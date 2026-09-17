const assert = require("node:assert/strict");
const test = require("node:test");
const Module = require("node:module");

const ORIGINAL_URL = "https://banco.example.com";
const SESSION_PATH = "/proyectos/project-1/sesiones/session-1";
const turns = [
  { order: 1, prompt: "Primer prompt de prueba", response: "Primera respuesta" },
  { order: 2, prompt: "Segundo prompt de prueba", response: "Segunda respuesta" },
];

// All chat discovery is replaced before loading commands. No real user histories are read.
function loadCommands(vscode) {
  const commandsPath = require.resolve("../out/commands.js");
  const originalLoad = Module._load;
  const parser = {
    listCodexChats: () => [{ id: "fixture", title: "Chat de prueba", cwd: "/fixture", filePath: "/fixture/chat.jsonl", mtimeMs: 1_700_000_000_000 }],
    parseCodexSessionFile: () => turns,
    rankCodexChatsForWorkspace: (chats) => chats,
  };
  Module._load = function (request, parent, isMain) {
    if (request === "vscode") return vscode;
    if (request === "./codex-sessions") return parser;
    if (request === "./cursor-transcripts" || request === "./vscode-chats") return {};
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    delete require.cache[commandsPath];
    return require(commandsPath).createImportCommands;
  } finally {
    Module._load = originalLoad;
    delete require.cache[commandsPath];
  }
}

function harness(options = {}) {
  const choices = [...(options.choices || [0, 1, 0, 1])];
  const inputs = [...(options.inputs || [])];
  const calls = { fetch: [], post: [], history: [], info: [], warnings: [], errors: [], opened: [] };
  const settings = { apiUrl: ORIGINAL_URL };
  const vscode = {
    workspace: { getConfiguration: () => ({ get: () => undefined }) },
    ProgressLocation: { Notification: 15 },
    Uri: { parse: (value) => value },
    env: {
      openExternal: async (uri) => { calls.opened.push(uri); return true; },
      get clipboard() { throw new Error("The clipboard must not be read automatically"); },
    },
    window: {
      withProgress: async (_options, task) => task(),
      showQuickPick: async (items) => {
        assert.ok(choices.length > 0, "Unexpected quick pick");
        const choice = choices.shift();
        return choice === undefined ? undefined : items[choice];
      },
      showInputBox: async () => inputs.shift(),
      showErrorMessage: async (message) => { calls.errors.push(message); },
      showWarningMessage: async (message) => { calls.warnings.push(message); },
      showInformationMessage: async (message, action) => {
        calls.info.push(message);
        if (options.changeUrlOnSuccess) settings.apiUrl = "https://other.example.com";
        return options.openResult ? action : undefined;
      },
    },
  };
  const api = {
    fetchProjects: async (expectedApiUrl) => {
      calls.fetch.push(expectedApiUrl);
      if (options.changeUrlAfterFetch) settings.apiUrl = "https://other.example.com";
      return [{
        id: "project-1", title: "Proyecto de prueba", subject: null,
        sessions: [{ id: "session-1", title: "Sesión existente", tool: "Codex" }],
      }];
    },
    postInteractions: async (body, expectedApiUrl) => {
      calls.post.push({ body, expectedApiUrl });
      return { ok: true, url: SESSION_PATH, createdCount: body.interactions?.length || 1, apiUrl: ORIGINAL_URL };
    },
  };
  const commands = loadCommands(vscode)(api, settings, async (item) => {
    if (options.historyFails) throw new Error("Local storage unavailable");
    calls.history.push(item);
  });
  return { commands, calls };
}

test("append to an existing session lets the server allocate interaction order", async () => {
  const { commands, calls } = harness();
  await commands.importFromCodex();

  assert.equal(calls.post.length, 1);
  assert.equal(calls.post[0].body.sessionId, "session-1");
  assert.deepEqual(calls.post[0].body.interactions, turns.map(({ prompt, response }) => ({ prompt, response })));
  assert.deepEqual(calls.fetch, [ORIGINAL_URL]);
  assert.equal(calls.post[0].expectedApiUrl, ORIGINAL_URL);
  assert.equal(calls.history[0].count, 2);
});

test("cancelling chat, turn, project, session, or session title selection never posts", async (t) => {
  for (const [stage, choices] of [
    ["chat", [undefined]],
    ["turns", [0, undefined]],
    ["project", [0, 1, undefined]],
    ["session", [0, 1, 0, undefined]],
    ["session title", [0, 1, 0, 0]],
  ]) {
    await t.test(stage, async () => {
      const { commands, calls } = harness({ choices });
      await commands.importFromCodex();
      assert.deepEqual(calls.post, []);
      assert.deepEqual(calls.history, []);
      assert.deepEqual(calls.info, []);
    });
  }
});

test("a local history failure preserves the successful import and open action", async () => {
  const { commands, calls } = harness({ historyFails: true, openResult: true });
  await assert.doesNotReject(commands.importFromCodex());

  assert.equal(calls.post.length, 1);
  assert.equal(calls.warnings.length, 1);
  assert.match(calls.warnings[0], /se guardó en la app/);
  assert.deepEqual(calls.errors, []);
  assert.deepEqual(calls.info, ["Se guardaron 2 interacciones."]);
  assert.deepEqual(calls.opened, [ORIGINAL_URL + SESSION_PATH]);
});

test("the destination captured for the project is passed to the guarded POST", async () => {
  const { commands, calls } = harness({ changeUrlAfterFetch: true });
  await commands.importFromCodex();
  assert.equal(calls.post[0].expectedApiUrl, ORIGINAL_URL);
  assert.equal(calls.history[0].apiUrl, ORIGINAL_URL);
});

test("opening a successful import uses its actual server after configuration changes", async () => {
  const { commands, calls } = harness({ changeUrlOnSuccess: true, openResult: true });
  await commands.importFromCodex();
  assert.deepEqual(calls.opened, [ORIGINAL_URL + SESSION_PATH]);
});

test("manual import cancellation sends nothing and never reads the clipboard", async () => {
  const { commands, calls } = harness({ inputs: [undefined] });
  await commands.saveInteractionManual();
  assert.deepEqual(calls.fetch, []);
  assert.deepEqual(calls.post, []);
});
