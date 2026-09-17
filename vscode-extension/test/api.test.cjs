const test = require("node:test");
const assert = require("node:assert/strict");
const { BancoApi, normalizeApiUrl, resultUrl } = require("../out/api");

const settings = { apiUrl: "http://localhost:3000", importToken: "fixture-token" };
const project = { id: "project-1", title: "Proyecto", subject: null, sessions: [{ id: "session-1", title: "Sesión", tool: "Codex" }] };
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

// Fail closed: every test must explicitly supply a response, never use the network.
test.beforeEach((t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected network request in test"); });
});

test("API URLs allow HTTPS and local HTTP while rejecting unsafe endpoints", () => {
  assert.equal(normalizeApiUrl(" http://localhost:3000/// "), "http://localhost:3000");
  assert.equal(normalizeApiUrl("http://127.0.0.1:4000/"), "http://127.0.0.1:4000");
  assert.equal(normalizeApiUrl("http://[::1]:3000/"), "http://[::1]:3000");
  assert.equal(normalizeApiUrl("https://bank.example/base/"), "https://bank.example/base");
  for (const endpoint of [
    "not a URL", "http://bank.example", "http://localhost.attacker.example", "ftp://localhost",
    "https://name:password@bank.example", "https://bank.example?token=fixture", "https://bank.example#fragment",
  ]) assert.throws(() => normalizeApiUrl(endpoint), Error);
});

test("result links stay on the configured app and accept only session paths", () => {
  assert.equal(resultUrl("https://bank.example/base", "/proyectos/p_1/sesiones/s-1"), "https://bank.example/base/proyectos/p_1/sesiones/s-1");
  for (const pathname of [
    "https://other.example/proyectos/p/sesiones/s", "//other.example", "/proyectos/../sesiones/s",
    "/proyectos/%2e%2e/sesiones/s", "/proyectos/p/sesiones/s?extra=1", "/proyectos/p/sesiones/s#extra",
  ]) assert.throws(() => resultUrl(settings.apiUrl, pathname), /enlace/);
});

test("project requests send JSON headers and credentials only to the normalized configured origin", async (t) => {
  let request;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    request = { url, init };
    return jsonResponse({ projects: [project] });
  });
  const api = new BancoApi(async () => ({ ...settings, apiUrl: `${settings.apiUrl}/` }));
  assert.deepEqual(await api.fetchProjects(), [project]);
  assert.equal(request.url, "http://localhost:3000/api/import");
  assert.equal(request.init.method, "GET");
  assert.equal(request.init.redirect, "manual");
  assert.deepEqual(request.init.headers, { "Content-Type": "application/json", "x-import-token": "fixture-token" });
  assert.equal(request.init.body, undefined);
  assert.ok(request.init.signal instanceof AbortSignal);
});

test("imports preserve their request body and capture the destination used for the saved result", async (t) => {
  const connection = { ...settings };
  const body = { projectId: "project-1", interactions: [{ prompt: "Consulta", response: "Respuesta" }] };
  let sent;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sent = { url, init };
    connection.apiUrl = "https://other.example";
    return jsonResponse({ ok: true, url: "/proyectos/project-1/sesiones/session-1", createdCount: 1 });
  });
  const api = new BancoApi(async () => ({ ...connection }));
  const result = await api.postInteractions(body, settings.apiUrl);
  assert.equal(sent.init.method, "POST");
  assert.deepEqual(JSON.parse(sent.init.body), body);
  assert.equal(result.apiUrl, settings.apiUrl);
  assert.equal(result.createdCount, 1);
  assert.equal(resultUrl(result.apiUrl, result.url), "http://localhost:3000/proyectos/project-1/sesiones/session-1");
});

test("requests fail before fetching if credentials are missing or the connection changed", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => jsonResponse({ projects: [] }));
  const missingToken = new BancoApi(async () => ({ ...settings, importToken: "" }));
  await assert.rejects(missingToken.fetchProjects(), /token/);
  const changedConnection = new BancoApi(async () => ({ ...settings, apiUrl: "https://other.example" }));
  await assert.rejects(changedConnection.fetchProjects(settings.apiUrl), /URL cambi/);
  await assert.rejects(changedConnection.postInteractions({}, settings.apiUrl), /URL cambi/);
  assert.equal(fetch.mock.callCount(), 0);
});

test("equivalent trailing slashes do not falsely report a changed connection", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ projects: [] }));
  const api = new BancoApi(async () => settings);
  assert.deepEqual(await api.fetchProjects(`${settings.apiUrl}/`), []);
});

test("authentication and redirect errors do not expose or follow server content", async (t) => {
  for (const status of [401, 403, 301, 302, 307, 308]) {
    await t.test(`HTTP ${status}`, async (child) => {
      const readBody = child.mock.fn(async () => { throw new Error("must not read rejected body"); });
      child.mock.method(globalThis, "fetch", async () => ({ status, json: readBody }));
      const api = new BancoApi(async () => settings);
      await assert.rejects(api.fetchProjects(), status === 401 || status === 403 ? /token no coincide/ : /redirigi/);
      assert.equal(readBody.mock.callCount(), 0);
    });
  }
});

test("API responses reject HTML, invalid envelopes and malformed project data", async (t) => {
  const scenarios = [
    { response: () => new Response("<html>app</html>", { headers: { "content-type": "text/html" } }), pattern: /API/ },
    { response: () => jsonResponse(null), pattern: /respuesta inv/ },
    { response: () => jsonResponse([]), pattern: /respuesta inv/ },
    { response: () => jsonResponse({ projects: null }), pattern: /proyectos inv/ },
    { response: () => jsonResponse({ projects: [{ ...project, subject: "bad" }] }), pattern: /proyectos inv/ },
    { response: () => jsonResponse({ projects: [{ ...project, sessions: [{ id: 1 }] }] }), pattern: /proyectos inv/ },
  ];
  for (const [index, scenario] of scenarios.entries()) {
    await t.test(`invalid response ${index + 1}`, async (child) => {
      child.mock.method(globalThis, "fetch", async () => scenario.response());
      await assert.rejects(new BancoApi(async () => settings).fetchProjects(), scenario.pattern);
    });
  }
});

test("server error messages are bounded and connection failures become actionable errors", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ error: "x".repeat(500) }, 500));
  await assert.rejects(new BancoApi(async () => settings).fetchProjects(), (error) => error.message.length === 300);
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  await assert.rejects(new BancoApi(async () => settings).fetchProjects(), /No se pudo conectar/);
});

test("imports require a positive integer count, explicit success and a valid session link", async (t) => {
  const valid = { ok: true, url: "/proyectos/p/sesiones/s", createdCount: 1 };
  const invalid = [
    { ...valid, ok: false }, { ...valid, createdCount: 0 }, { ...valid, createdCount: -1 },
    { ...valid, createdCount: 1.5 }, { ...valid, createdCount: "1" }, { ...valid, url: "https://other.example" },
  ];
  for (const [index, body] of invalid.entries()) {
    await t.test(`invalid confirmation ${index + 1}`, async (child) => {
      child.mock.method(globalThis, "fetch", async () => jsonResponse(body));
      await assert.rejects(new BancoApi(async () => settings).postInteractions({}), /confirm|enlace/);
    });
  }
});

test("timeouts abort pending requests, clear their timer and warn that a save may have completed", async (t) => {
  let onTimeout;
  let signal;
  const timer = { fixture: true };
  t.mock.method(globalThis, "setTimeout", (callback, milliseconds) => {
    assert.equal(milliseconds, 15_000);
    onTimeout = callback;
    return timer;
  });
  const clear = t.mock.method(globalThis, "clearTimeout", () => {});
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    signal = init.signal;
    return new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("Aborted")), { once: true }));
  });
  const pending = new BancoApi(async () => settings).postInteractions({});
  await Promise.resolve();
  assert.equal(typeof onTimeout, "function");
  onTimeout();
  await assert.rejects(pending, /15 segundos.*haberse guardado/);
  assert.equal(signal.aborted, true);
  assert.equal(clear.mock.callCount(), 1);
  assert.equal(clear.mock.calls[0].arguments[0], timer);
});

test("successful requests release the timeout without aborting their signal", async (t) => {
  const timer = { fixture: true };
  let signal;
  t.mock.method(globalThis, "setTimeout", () => timer);
  const clear = t.mock.method(globalThis, "clearTimeout", () => {});
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    signal = init.signal;
    return jsonResponse({ projects: [] });
  });
  await new BancoApi(async () => settings).fetchProjects();
  assert.equal(signal.aborted, false);
  assert.equal(clear.mock.calls[0].arguments[0], timer);
});
