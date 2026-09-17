const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

function harness(t, overrides = {}) {
  const values = {
    apiUrl: { defaultValue: "http://localhost:3000", ...overrides.apiUrl },
    importToken: { ...overrides.importToken },
  };
  const calls = [];
  const stored = new Map(overrides.stored || []);
  const secrets = {
    async get(key) { calls.push(["get", key]); return stored.get(key); },
    async store(key, value) { calls.push(["store", key, value]); stored.set(key, value); },
    async delete(key) { calls.push(["delete", key]); stored.delete(key); },
  };
  let inputOptions;
  const window = {
    async showInputBox(options) { inputOptions = options; return overrides.input; },
    async showInformationMessage(message) { calls.push(["info", message]); },
  };
  const config = {
    inspect(key) { return values[key]; },
    get() { throw new Error("Tests require explicit global/default configuration inspection"); },
    async update(key, value, scope) { calls.push(["update", key, value, scope]); values[key].globalValue = value; },
  };
  const vscode = {
    workspace: { getConfiguration(section) { assert.equal(section, "banco"); return config; } },
    ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
    window,
  };
  const originalLoad = Module._load;
  const modulePath = require.resolve("../out/settings");
  let BancoSettings;
  try {
    Module._load = function(request, parent, isMain) {
      return request === "vscode" ? vscode : originalLoad.call(this, request, parent, isMain);
    };
    delete require.cache[modulePath];
    ({ BancoSettings } = require(modulePath));
  } finally {
    Module._load = originalLoad;
    delete require.cache[modulePath];
  }
  return { settings: new BancoSettings(secrets), values, calls, stored, secrets, window, config, inputOptions: () => inputOptions };
}

const localUrl = "http://localhost:3000";
const remoteUrl = "https://bank.example";
const tokenKey = (url) => `banco.importToken:${url}`;

test("settings use global URL or default and ignore workspace-controlled endpoints", (t) => {
  const h = harness(t, { apiUrl: { workspaceValue: "https://workspace.example", workspaceFolderValue: "https://folder.example" } });
  assert.equal(h.settings.apiUrl, localUrl);
  h.values.apiUrl.globalValue = `${remoteUrl}/`;
  assert.equal(h.settings.apiUrl, remoteUrl);
  h.values.apiUrl.globalValue = "http://insecure.example";
  assert.throws(() => h.settings.apiUrl, /HTTPS/);
});

test("settings retrieve a distinct secret for each normalized connection", async (t) => {
  const h = harness(t, { stored: [[tokenKey(localUrl), "fixture-local"], [tokenKey(remoteUrl), "fixture-remote"]] });
  assert.deepEqual(await h.settings.read(), { apiUrl: localUrl, importToken: "fixture-local" });
  h.values.apiUrl.globalValue = `${remoteUrl}/`;
  assert.deepEqual(await h.settings.read(), { apiUrl: remoteUrl, importToken: "fixture-remote" });
  h.values.apiUrl.globalValue = "https://new.example";
  assert.deepEqual(await h.settings.read(), { apiUrl: "https://new.example", importToken: "" });
});

test("legacy migration saves the global token securely before removing the old setting", async (t) => {
  const h = harness(t, { importToken: { globalValue: "  fixture-legacy  ", workspaceValue: "fixture-workspace" } });
  await h.settings.migrateLegacyToken();
  assert.deepEqual(h.calls, [
    ["get", tokenKey(localUrl)],
    ["store", tokenKey(localUrl), "fixture-legacy"],
    ["update", "importToken", undefined, 1],
  ]);
  assert.equal(h.values.importToken.workspaceValue, "fixture-workspace");
});

test("legacy migration never trusts a workspace-only token", async (t) => {
  const h = harness(t, { importToken: { workspaceValue: "fixture-workspace", workspaceFolderValue: "fixture-folder" } });
  await h.settings.migrateLegacyToken();
  assert.deepEqual(h.calls, []);
});

test("legacy migration preserves an existing connection secret", async (t) => {
  const h = harness(t, { importToken: { globalValue: "fixture-legacy" }, stored: [[tokenKey(localUrl), "fixture-existing"]] });
  await h.settings.migrateLegacyToken();
  assert.equal(h.stored.get(tokenKey(localUrl)), "fixture-existing");
  assert.deepEqual(h.calls.map(([operation]) => operation), ["get", "update"]);
});

test("legacy migration leaves the old token recoverable when secure storage fails", async (t) => {
  const h = harness(t, { importToken: { globalValue: "fixture-legacy" } });
  t.mock.method(h.secrets, "store", async () => { throw new Error("Secure storage unavailable"); });
  await assert.rejects(h.settings.migrateLegacyToken(), /Secure storage/);
  assert.equal(h.values.importToken.globalValue, "fixture-legacy");
  assert.equal(h.calls.some(([operation]) => operation === "update"), false);
});

test("legacy migration keeps its original connection if the URL changes while reading secrets", async (t) => {
  const h = harness(t, { importToken: { globalValue: "fixture-legacy" } });
  t.mock.method(h.secrets, "get", async (key) => {
    h.calls.push(["get", key]);
    h.values.apiUrl.globalValue = remoteUrl;
    return undefined;
  });
  await h.settings.migrateLegacyToken();
  assert.equal(h.stored.get(tokenKey(localUrl)), "fixture-legacy");
  assert.equal(h.stored.has(tokenKey(remoteUrl)), false);
});

test("cancelling token configuration does not change secure storage", async (t) => {
  const h = harness(t, { input: undefined, stored: [[tokenKey(localUrl), "fixture-existing"]] });
  assert.equal(await h.settings.configureToken(), false);
  assert.equal(h.stored.get(tokenKey(localUrl)), "fixture-existing");
  assert.deepEqual(h.calls, []);
});

test("token configuration masks input, rejects blanks and stores a trimmed connection secret", async (t) => {
  const h = harness(t, { input: "  fixture-new  " });
  assert.equal(await h.settings.configureToken(), true);
  const options = h.inputOptions();
  assert.equal(options.password, true);
  assert.equal(options.ignoreFocusOut, true);
  assert.match(options.prompt, /http:\/\/localhost:3000/);
  assert.equal(typeof options.validateInput("   "), "string");
  assert.equal(options.validateInput("fixture-new"), undefined);
  assert.equal(h.stored.get(tokenKey(localUrl)), "fixture-new");
  assert.equal(h.calls.some(([operation]) => operation === "update"), false);
});

test("token input remains associated with the connection shown in its prompt", async (t) => {
  const h = harness(t);
  t.mock.method(h.window, "showInputBox", async (options) => {
    assert.match(options.prompt, /localhost:3000/);
    h.values.apiUrl.globalValue = remoteUrl;
    return "fixture-local";
  });
  assert.equal(await h.settings.configureToken(), true);
  assert.equal(h.stored.get(tokenKey(localUrl)), "fixture-local");
  assert.equal(h.stored.has(tokenKey(remoteUrl)), false);
});

test("removing a token deletes only the active connection secret", async (t) => {
  const h = harness(t, { stored: [[tokenKey(localUrl), "fixture-local"], [tokenKey(remoteUrl), "fixture-remote"]] });
  await h.settings.removeToken();
  assert.equal(h.stored.has(tokenKey(localUrl)), false);
  assert.equal(h.stored.get(tokenKey(remoteUrl)), "fixture-remote");
  assert.deepEqual(h.calls[0], ["delete", tokenKey(localUrl)]);
});
