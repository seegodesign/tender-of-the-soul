import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/newsletter.js";

const origin = "https://tender-of-the-soul.pages.dev";
const hostname = new URL(origin).hostname;
const env = {
  BREVO_API_KEY: "test-key",
  TURNSTILE_SECRET: "test-turnstile-secret",
  TURNSTILE_HOSTNAMES: hostname,
};
function request(payload, options = {}) {
  return new Request(`${origin}/api/newsletter`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(payload && !Array.isArray(payload)
      ? { "cf-turnstile-response": "test-token", ...payload }
      : payload),
    ...options,
  });
}
const verified = () => Response.json({ success: true, action: "signup", hostname });

test("newsletter signup with server-side bot protection", async (t) => {
  let calls = [];
  let verifications = [];
  let verify = verified;
  let provider = () => Response.json({ id: 123 }, { status: 201 });
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify") {
      verifications.push([url, options]);
      return verify();
    }
    calls.push([url, options]);
    return provider();
  });

  await t.test("verifies the token before adding the subscriber directly to list 3", async () => {
    const response = await onRequest({ request: request({ email: " reader@example.com " }), env });
    assert.equal(response.status, 200);
    assert.match((await response.json()).message, /Thank you for signing up/);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(verifications.length, 1);
    const verification = verifications[0][1];
    assert.equal(verification.method, "POST");
    assert.deepEqual(Object.fromEntries(verification.body), {
      secret: env.TURNSTILE_SECRET, response: "test-token",
    });
    assert.equal(calls.length, 1);
    const [url, options] = calls[0];
    assert.equal(url, "https://api.brevo.com/v3/contacts");
    assert.equal(options.headers["api-key"], "test-key");
    assert.deepEqual(JSON.parse(options.body), {
      email: "reader@example.com", listIds: [3], updateEnabled: true,
    });
    calls = [];
    verifications = [];
  });

  await t.test("existing contacts can sign up without changing blocklist settings", async () => {
    provider = () => new Response(null, { status: 204 });
    const response = await onRequest({ request: request({ email: "existing@example.com" }), env });
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(calls[0][1].body), {
      email: "existing@example.com", listIds: [3], updateEnabled: true,
    });
    calls = [];
    verifications = [];
  });

  await t.test("malformed, foreign-origin and oversized submissions never reach either service", async () => {
    for (const payload of [null, [], { email: "bad" }, { email: 42 }]) {
      assert.equal((await onRequest({ request: request(payload), env })).status, 400);
    }
    const foreign = request({ email: "reader@example.com" }, {
      headers: { Origin: "https://elsewhere.example", "Content-Type": "application/json" },
    });
    assert.equal((await onRequest({ request: foreign, env })).status, 403);
    assert.equal((await onRequest({ request: request({ email: "a".repeat(5000) }), env })).status, 413);
    assert.equal((await onRequest({ request: request({}, { body: "{" }), env })).status, 400);
    assert.equal(calls.length, 0);
    assert.equal(verifications.length, 0);
  });

  await t.test("honeypot accepts silently without subscribing or verifying", async () => {
    const response = await onRequest({ request: request({ website: "spam", email: "reader@example.com" }), env });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 0);
    assert.equal(verifications.length, 0);
  });

  await t.test("missing configuration fails closed", async () => {
    for (const settings of [
      {}, { ...env, BREVO_API_KEY: "" }, { ...env, TURNSTILE_SECRET: "" },
      { ...env, TURNSTILE_HOSTNAMES: "" }, { ...env, TURNSTILE_HOSTNAMES: "localhost" },
    ]) {
      assert.equal((await onRequest({ request: request({ email: "reader@example.com" }), env: settings })).status, 503);
    }
    assert.equal(calls.length, 0);
    assert.equal(verifications.length, 0);
  });

  await t.test("missing, malformed and oversized tokens are rejected before external requests", async () => {
    for (const token of [undefined, null, "", "  ", 123, {}, "x".repeat(2049)]) {
      const response = await onRequest({ request: request({ email: "reader@example.com", "cf-turnstile-response": token }), env });
      assert.equal(response.status, 403);
    }
    assert.equal(calls.length, 0);
    assert.equal(verifications.length, 0);
  });

  await t.test("invalid, expired, wrong-action and wrong-host tokens cannot subscribe", async () => {
    for (const result of [
      { success: false, "error-codes": ["timeout-or-duplicate"] },
      { success: "true", action: "signup", hostname },
      { success: true, action: "login", hostname },
      { success: true, action: "signup", hostname: "localhost" },
      { success: true, action: "signup", hostname: "elsewhere.example" },
      { success: true }, null,
    ]) {
      verify = () => Response.json(result);
      const response = await onRequest({ request: request({ email: "reader@example.com" }), env });
      assert.equal(response.status, 403);
    }
    // Even another configured hostname cannot redeem a token issued for this site.
    verify = () => Response.json({ success: true, action: "signup", hostname: "tenderofthesoul.com" });
    assert.equal((await onRequest({ request: request({ email: "reader@example.com" }), env: {
      ...env, TURNSTILE_HOSTNAMES: `${hostname},tenderofthesoul.com`,
    } })).status, 403);
    assert.equal(calls.length, 0);
    verifications = [];
    verify = verified;
  });

  await t.test("verification outages never fall through to Brevo", async () => {
    for (const implementation of [
      () => new Response("private-details", { status: 503 }),
      () => new Response("not JSON"),
      () => { throw new Error("private-details"); },
    ]) {
      verify = implementation;
      const response = await onRequest({ request: request({ email: "reader@example.com" }), env });
      assert.equal(response.status, 503);
      assert.doesNotMatch(await response.text(), /private-details|test-turnstile-secret/);
    }
    assert.equal(calls.length, 0);
    verifications = [];
    verify = verified;
  });

  await t.test("a replay rejected by Siteverify cannot create another subscription", async () => {
    let redeemed = false;
    verify = () => {
      if (redeemed) return Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] });
      redeemed = true;
      return verified();
    };
    assert.equal((await onRequest({ request: request({ email: "reader@example.com" }), env })).status, 200);
    assert.equal((await onRequest({ request: request({ email: "other@example.com" }), env })).status, 403);
    assert.equal(calls.length, 1);
    calls = [];
    verifications = [];
    verify = verified;
  });

  await t.test("unsupported methods and content types cannot subscribe", async () => {
    const response = await onRequest({ request: new Request(`${origin}/api/newsletter`), env });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
    const wrongType = request({}, { headers: { Origin: origin, "Content-Type": "text/plain" } });
    assert.equal((await onRequest({ request: wrongType, env })).status, 415);
    assert.equal(calls.length, 0);
    assert.equal(verifications.length, 0);
  });

  await t.test("provider diagnostics identify problems without logging private details", async () => {
    const log = console.error;
    for (const [message, reason] of [
      ["Your SMTP account needs to be activated", "account_activation"],
      ["Missing scope", "api_key_permissions"],
      ["Unrecognised IP address", "ip_authorization"],
      ["Invalid list", "subscriber_list"],
      ["private-provider-details", "unknown"],
    ]) {
      provider = () => Response.json({ code: "invalid_parameter", message: `${message}: reader@example.com test-key` }, { status: 400 });
      const response = await onRequest({ request: request({ email: "reader@example.com" }), env });
      assert.equal(response.status, 502);
      assert.deepEqual(log.mock.calls.at(-1).arguments, ["Newsletter provider request failed", {
        status: 400, code: "invalid_parameter", reason, listId: 3,
      }]);
      assert.doesNotMatch(await response.text(), /invalid_parameter|reader@example.com|test-key/);
    }
  });

  await t.test("provider errors and network failures return a retry message without leaking details", async () => {
    for (const implementation of [
      () => new Response("private-provider-details", { status: 429 }),
      () => Response.json({ code: "test-key", message: "x".repeat(5000) }, { status: 400 }),
      () => Response.json(null, { status: 400 }),
      () => Response.json({ code: "test-key", message: "private-provider-details" }, { status: 400 }),
      () => { throw new Error("private-provider-details"); },
    ]) {
      provider = implementation;
      const response = await onRequest({ request: request({ email: "reader@example.com" }), env });
      assert.equal(response.status, 502);
      const text = await response.text();
      assert.match(text, /try again later/);
      assert.doesNotMatch(text, /private-provider-details|test-key|reader@example.com|test-turnstile-secret|test-token/);
    }
    assert.doesNotMatch(JSON.stringify(console.error.mock.calls.map((call) => call.arguments)), /private-provider-details|test-key|reader@example.com|test-turnstile-secret|test-token/);
  });
});
