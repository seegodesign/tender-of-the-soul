import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";

const component = await readFile(new URL("../src/components/Footer.astro", import.meta.url), "utf8");
const source = component.match(/<script>([\s\S]*?)<\/script>/)[1];
const { code } = await transformWithOxc(source, "newsletter.ts");
const settle = () => new Promise((resolve) => setImmediate(resolve));

function setup({ apiLoaded = true } = {}) {
  const documentEvents = {};
  const widgets = [];
  const resets = [];
  const removed = [];
  const requests = [];
  const scripts = [];
  let respond = async () => Response.json({ message: "Thank you for signing up!" });
  function newForm() {
    const status = { textContent: "Loading bot check…" };
    const button = { disabled: true, innerHTML: "Sign up", textContent: "Sign up" };
    const container = { dataset: { sitekey: "public-sitekey" } };
    return {
      status, button, container, dataset: {}, isConnected: true, events: {}, resets: 0,
      action: "/api/newsletter",
      querySelector(selector) {
        if (selector.includes("status")) return status;
        if (selector.includes("turnstile")) return container;
        return button;
      },
      addEventListener(event, callback) { this.events[event] = callback; },
      reset() { this.resets++; },
    };
  }
  let form = newForm();
  const api = {
    render(container, options) { widgets.push({ container, options }); return String(widgets.length); },
    reset(id) { resets.push(id); },
    remove(id) { removed.push(id); },
  };
  const window = apiLoaded ? { turnstile: api } : {};
  const document = {
    querySelector(selector) { return selector.includes("turnstile") ? form.container : form; },
    addEventListener(event, callback) { documentEvents[event] = callback; },
    createElement() {
      return { events: {}, setAttribute() {}, addEventListener(event, callback) { this.events[event] = callback; }, remove() {} };
    },
    head: { appendChild(script) { scripts.push(script); } },
  };
  vm.runInNewContext(code, {
    window, document,
    FormData: class { *[Symbol.iterator]() { yield ["email", "reader@example.com"]; yield ["website", ""]; } },
    fetch: async (url, options) => { requests.push([url, options]); return respond(); },
  });
  return {
    get form() { return form; }, widgets, resets, removed, requests, scripts,
    setResponse(callback) { respond = callback; },
    async submit() { await form.events.submit({ preventDefault() {} }); },
    navigate() {
      documentEvents["astro:before-swap"]();
      form.isConnected = false;
      form = newForm();
      documentEvents["astro:page-load"]();
    },
  };
}

test("signup requires a token and refreshes after success, provider rejection and network failure", async () => {
  const page = setup();
  await settle();
  await page.submit();
  assert.equal(page.requests.length, 0);
  for (const response of [
    async () => Response.json({ message: "Thank you for signing up!" }),
    async () => Response.json({ message: "Please try again" }, { status: 502 }),
    async () => { throw new Error("Network failure"); },
  ]) {
    page.setResponse(response);
    page.widgets[0].options.callback("fresh-token");
    assert.equal(page.form.button.disabled, false);
    await page.submit();
    assert.equal(page.form.button.disabled, true);
    assert.equal(JSON.parse(page.requests.at(-1)[1].body)["cf-turnstile-response"], "fresh-token");
  }
  assert.equal(page.form.resets, 1);
  assert.deepEqual(page.resets, ["1", "1", "1"]);
});

test("expired tokens disable signup and navigation removes and recreates the widget", async () => {
  const page = setup();
  await settle();
  page.widgets[0].options.callback("expired-token");
  page.widgets[0].options["expired-callback"]();
  await page.submit();
  assert.equal(page.requests.length, 0);
  assert.equal(page.form.button.disabled, true);
  page.navigate();
  await settle();
  assert.deepEqual(page.removed, ["1"]);
  assert.equal(page.widgets.length, 2);
  page.widgets[1].options.callback("new-page-token");
  await page.submit();
  assert.deepEqual(page.resets, ["2"]);
});

test("a blocked challenge script leaves signup disabled with a recovery message", async () => {
  const page = setup({ apiLoaded: false });
  page.scripts[0].events.error();
  await settle();
  assert.equal(page.form.button.disabled, true);
  assert.match(page.form.status.textContent, /reload this page/);
  await page.submit();
  assert.equal(page.requests.length, 0);
});
