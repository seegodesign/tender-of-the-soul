const SUCCESS = "Thank you for signing up for my newsletter!";

async function providerFailure(response) {
  const details = { status: response.status, code: "unknown", reason: "unknown" };
  const reader = response.body?.getReader();
  if (!reader) return details;
  try {
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) return details;
      chunks.push(value);
    }
    const error = JSON.parse(await new Blob(chunks).text());
    const knownCodes = ["invalid_parameter", "missing_parameter", "unauthorized", "permission_denied", "document_not_found", "duplicate_parameter", "not_enough_credits", "account_under_validation", "method_not_allowed", "out_of_range"];
    if (knownCodes.includes(error?.code)) details.code = error.code;
    // Classify the message, never log raw provider content or contact details.
    if (typeof error?.message === "string") {
      const reasons = [
        [/\bip\b|ip address/i, "ip_authorization"],
        [/scope|permission/i, "api_key_permissions"],
        [/smtp|activat|validat.*account|account.*validat/i, "account_activation"],
        [/\blist\b|listIds/i, "subscriber_list"],
        [/api.?key|authentication/i, "api_key"],
        [/already|duplicate/i, "duplicate_contact"],
        [/email/i, "email_address"],
      ];
      details.reason = reasons.find(([pattern]) => pattern.test(error.message))?.[1] ?? "unknown";
    }
  } catch {
    // Non-JSON errors must still produce the normal retry response.
  } finally {
    await reader.cancel().catch(() => {});
  }
  return details;
}

function reply(message, status = 200) {
  return Response.json({ message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    const response = reply("Please submit the newsletter form.", 405);
    response.headers.set("Allow", "POST");
    return response;
  }

  const origin = new URL(request.url).origin;
  if (request.headers.get("Origin") !== origin) {
    return reply("Please sign up through this website.", 403);
  }
  if (request.headers.get("Content-Type")?.split(";")[0].trim() !== "application/json") {
    return reply("Please submit the newsletter form.", 415);
  }

  // Bound the body even when Content-Length is absent or inaccurate.
  let payload;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply("Please enter your email address.", 400);
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return reply("This submission is too large.", 413);
      }
      chunks.push(value);
    }
    payload = JSON.parse(await new Blob(chunks).text());
  } catch {
    return reply("Please enter a valid email address.", 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return reply("Please enter a valid email address.", 400);
  }
  if (payload.website) return reply(SUCCESS);
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply("Please enter a valid email address.", 400);
  }
  const firstName = typeof payload.firstName === "string" ? payload.firstName.trim() : "";
  const lastName = typeof payload.lastName === "string" ? payload.lastName.trim() : "";
  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100 || /[\u0000-\u001f\u007f]/.test(firstName + lastName)) {
    return reply("Please enter your first and last name (up to 100 characters each).", 400);
  }

  const expectedHostnames = new Set(
    (env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
  const hostname = new URL(request.url).hostname;
  if (!env.BREVO_API_KEY || !env.TURNSTILE_SECRET || !expectedHostnames.has(hostname)) {
    return reply("Newsletter signup is temporarily unavailable. Please try again later.", 503);
  }

  const token = payload["cf-turnstile-response"];
  if (typeof token !== "string" || !token.trim() || token.length > 2048) {
    return reply("Please complete the bot check and try again.", 403);
  }

  try {
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token }),
      signal: AbortSignal.timeout(10000),
    });
    if (!verification.ok) {
      await verification.body?.cancel();
      throw new Error("Verification unavailable");
    }
    const result = await verification.json();
    if (
      result?.success !== true || result.action !== "signup" ||
      result.hostname !== hostname || !expectedHostnames.has(result.hostname)
    ) {
      return reply("Please complete the bot check again and retry.", 403);
    }
  } catch {
    console.error("Newsletter bot verification could not complete");
    return reply("We couldn’t verify the bot check. Please try again later.", 503);
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName, LASTNAME: lastName },
        listIds: [3],
        updateEnabled: true,
      }),
      signal: AbortSignal.timeout(10000),
    });
    // Do not expose Brevo's response body, which can contain contact details.
    if (!response.ok) {
      console.error("Newsletter provider request failed", {
        ...await providerFailure(response),
        listId: 3,
      });
      return reply("We couldn’t complete your signup. Please try again later.", 502);
    }
    await response.body?.cancel();
    return reply(SUCCESS);
  } catch {
    console.error("Newsletter provider request could not complete");
    return reply("We couldn’t complete your signup. Please try again later.", 502);
  }
}
