import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/newsletter.js";

const origin = "https://tender-of-the-soul.pages.dev";
const env = { BREVO_API_KEY: "test-key", BREVO_DOI_TEMPLATE_ID: "12" };
function request(payload, options = {}) {
  return new Request(`${origin}/api/newsletter`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...options,
  });
}

test("newsletter double opt-in endpoint", async (t) => {
  let calls = [];
  t.mock.method(globalThis, "fetch", async (...args) => {
    calls.push(args);
    return new Response(null, { status: 204 });
  });

  await t.test("requests a confirmation for list 3 with server-only credentials", async () => {
    const response = await onRequest({ request: request({ email: " reader@example.com " }), env });
    assert.equal(response.status, 200);
    assert.match((await response.json()).message, /confirmation link/);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(calls.length, 1);
    const [url, options] = calls[0];
    assert.equal(url, "https://api.brevo.com/v3/contacts/doubleOptinConfirmation");
    assert.equal(options.headers["api-key"], "test-key");
    assert.deepEqual(JSON.parse(options.body), {
      email: "reader@example.com",
      includeListIds: [3],
      templateId: 12,
      redirectionUrl: `${origin}/?newsletter=confirmed#newsletter-heading`,
    });
    calls = [];
  });

  await t.test("rejects malformed email, payload, cross-origin requests and oversized bodies", async () => {
    for (const payload of [null, [], { email: "bad" }, { email: 42 }]) {
      assert.equal((await onRequest({ request: request(payload), env })).status, 400);
    }
    const foreign = request({ email: "reader@example.com" }, {
      headers: { Origin: "https://elsewhere.example", "Content-Type": "application/json" },
    });
    assert.equal((await onRequest({ request: foreign, env })).status, 403);
    assert.equal((await onRequest({ request: request({ email: "a".repeat(5000) }), env })).status, 413);
    const malformed = request({}, { body: "{" });
    assert.equal((await onRequest({ request: malformed, env })).status, 400);
    assert.equal(calls.length, 0);
  });

  await t.test("honeypot does not contact Brevo", async () => {
    const response = await onRequest({ request: request({ website: "spam", email: "reader@example.com" }), env });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 0);
  });

  await t.test("missing key or invalid template fails without subscribing", async () => {
    for (const settings of [{}, { ...env, BREVO_DOI_TEMPLATE_ID: "0" }, { ...env, BREVO_DOI_TEMPLATE_ID: "invalid" }]) {
      const response = await onRequest({ request: request({ email: "reader@example.com" }), env: settings });
      assert.equal(response.status, 503);
    }
    assert.equal(calls.length, 0);
  });

  await t.test("unsupported method and content type cannot subscribe", async () => {
    const response = await onRequest({ request: new Request(`${origin}/api/newsletter`), env });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
    const wrongType = request({}, { headers: { Origin: origin, "Content-Type": "text/plain" } });
    assert.equal((await onRequest({ request: wrongType, env })).status, 415);
    assert.equal(calls.length, 0);
  });

  await t.test("provider diagnostics identify configuration problems without logging private details", async () => {
    const log = t.mock.method(console, "error", () => {});
    for (const [message, reason] of [
      ["Template is not a valid DOI template", "confirmation_template"],
      ["Template needs to be activated", "confirmation_template"],
      ["Your SMTP account needs to be activated", "account_activation"],
      ["Missing Transactional Email scope", "api_key_permissions"],
      ["Unrecognised IP address", "ip_authorization"],
      ["Invalid list", "subscriber_list"],
      ["private-provider-details", "unknown"],
    ]) {
      globalThis.fetch.mock.mockImplementation(async () => Response.json({
        code: "invalid_parameter", message: `${message}: reader@example.com test-key`,
      }, { status: 400 }));
      const response = await onRequest({ request: request({ email: "reader@example.com" }), env });
      assert.equal(response.status, 502);
      assert.deepEqual(log.mock.calls.at(-1).arguments, ["Newsletter provider request failed", {
        status: 400, code: "invalid_parameter", reason, templateId: 12, listId: 3,
      }]);
      assert.doesNotMatch(await response.text(), /invalid_parameter|reader@example.com|test-key/);
    }
    log.mock.restore();
  });

  await t.test("provider errors and network failures return a retry message without leaking details", async () => {
    const log = t.mock.method(console, "error", () => {});
    for (const implementation of [
      async () => new Response("private-provider-details", { status: 429 }),
      async () => Response.json({ code: "test-key", message: "x".repeat(5000) }, { status: 400 }),
      async () => Response.json(null, { status: 400 }),
      async () => Response.json({ code: "test-key", message: "private-provider-details" }, { status: 400 }),
      async () => { throw new Error("private-provider-details"); },
    ]) {
      globalThis.fetch.mock.mockImplementation(implementation);
      const response = await onRequest({ request: request({ email: "reader@example.com" }), env });
      assert.equal(response.status, 502);
      const text = await response.text();
      assert.match(text, /try again later/);
      assert.doesNotMatch(text, /private-provider-details|test-key|reader@example.com/);
    }
    assert.doesNotMatch(JSON.stringify(log.mock.calls.map((call) => call.arguments)), /private-provider-details|test-key|reader@example.com/);
  });
});
