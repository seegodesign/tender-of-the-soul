const SUCCESS = "Please check your inbox and click the confirmation link to finish signing up.";

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

  const templateId = Number(env.BREVO_DOI_TEMPLATE_ID);
  if (!env.BREVO_API_KEY || !Number.isSafeInteger(templateId) || templateId <= 0) {
    return reply("Newsletter signup is temporarily unavailable. Please try again later.", 503);
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        includeListIds: [3],
        templateId,
        redirectionUrl: `${origin}/?newsletter=confirmed#newsletter-heading`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    // Do not expose Brevo's response body, which can contain contact details.
    if (!response.ok) {
      console.error("Newsletter provider request failed", { status: response.status });
      await response.body?.cancel();
      return reply("We couldn’t send the confirmation email. Please try again later.", 502);
    }
    await response.body?.cancel();
    return reply(SUCCESS);
  } catch {
    console.error("Newsletter provider request could not complete");
    return reply("We couldn’t send the confirmation email. Please try again later.", 502);
  }
}
