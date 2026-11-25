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

  await t.test("provider errors and network failures return a retry message without leaking details", async () => {
    t.mock.method(console, "error", () => {});
    for (const implementation of [
      async () => new Response("private-provider-details", { status: 429 }),
      async () => { throw new Error("private-provider-details"); },
    ]) {
      globalThis.fetch.mock.mockImplementation(implementation);
      const response = await onRequest({ request: request({ email: "reader@example.com" }), env });
      assert.equal(response.status, 502);
      const text = await response.text();
      assert.match(text, /try again later/);
      assert.doesNotMatch(text, /private-provider-details|test-key|reader@example.com/);
    }
  });
});
