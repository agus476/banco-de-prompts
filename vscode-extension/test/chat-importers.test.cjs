const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { parseCodexSessionFile, listCodexChats, rankCodexChatsForWorkspace } = require("../out/codex-sessions");
const { parseTranscriptTurns, listCursorTranscripts, rankTranscriptsForWorkspace } = require("../out/cursor-transcripts");
const { parseVsCodeSessionFile, listVsCodeChats, rankVsCodeChatsForWorkspace, codeUserRoots } = require("../out/vscode-chats");
const { jsonRecords, matchesWorkspace } = require("../out/chat-files");

function fixture(t) {
  const temporaryRoot = path.resolve(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(temporaryRoot, "banco-chat-test-"));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(directory)), temporaryRoot);
    assert.match(path.basename(directory), /^banco-chat-test-/);
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    directory,
    write(name, value, mtime) {
      const file = path.join(directory, name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value), "utf8");
      if (mtime) fs.utimesSync(file, mtime, mtime);
      return file;
    },
  };
}

function fakeHome(t, directory) {
  t.mock.method(os, "homedir", () => directory);
  for (const [key, value] of Object.entries({
    APPDATA: path.join(directory, "AppData", "Roaming"),
    XDG_CONFIG_HOME: path.join(directory, ".config"),
    CODEX_HOME: path.join(directory, ".codex"),
  })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => previous === undefined ? delete process.env[key] : process.env[key] = previous);
  }
}

const lines = (values) => values.map((value) => JSON.stringify(value)).join("\r\n");
const request = (prompt, response = "Respuesta") => ({ message: { text: prompt }, response: [{ value: response }] });
const codexMessage = (role, text) => ({ type: "response_item", payload: { type: "message", role, content: [{ type: "text", text }] } });
const cursorMessage = (role, text) => ({ role, message: { content: [{ type: "text", text }] } });

test("VS Code replays nested sets, appends, truncation and deletion without losing sibling turns", (t) => {
  const f = fixture(t);
  const file = f.write("nested.JSONL", lines([
    { kind: 0, v: { requests: [request("Primero", "Borrador"), request("Segundo")] } },
    { kind: 1, k: ["requests", 0, "response", 0, "value"], v: "Final" },
    { kind: 2, k: ["requests", "0", "response"], v: [{ value: "Detalle" }] },
    { kind: 2, k: ["requests", 1, "response"], i: 0 },
    { kind: 2, k: ["requests", 1, "response"], v: [{ value: "Respuesta nueva" }] },
    { kind: 2, k: ["requests"], v: [request("Descartar")] },
    { kind: 2, k: ["requests"], i: 2 },
    { kind: 3, k: ["requests", 1, "message", "text"] },
    { kind: 1, k: ["requests", 1, "message", "parts"], v: [{ text: "Prompt " }, { text: "editado" }] },
  ]) + '\n{"kind":');
  assert.deepEqual(parseVsCodeSessionFile(file), [
    { order: 1, prompt: "Primero", response: "Final\n\nDetalle" },
    { order: 2, prompt: "Prompt editado", response: "Respuesta nueva" },
  ]);
});

test("VS Code ignores unsafe and malformed mutation paths without modifying prototypes", (t) => {
  const f = fixture(t);
  const file = f.write("unsafe.jsonl", lines([
    null, [], "text",
    { kind: 0, v: { requests: [request("Seguro")] } },
    { kind: 1, k: ["__proto__", "bancoPolluted"], v: true },
    { kind: 1, k: ["constructor", "prototype", "bancoPolluted"], v: true },
    { kind: 1, k: ["requests", "length"], v: 999999999 },
    { kind: 1, k: ["requests", 999999999], v: request("No") },
    { kind: 1, k: ["requests", {}], v: "No" },
    { kind: 1, k: ["missing", "nested"], v: true },
    { kind: 2, k: ["requests"], i: -1, v: [] },
    { kind: 2, k: ["requests"], i: 999999999, v: [] },
    { kind: 2, k: ["requests"], v: "wrong type" },
  ]));
  assert.deepEqual(parseVsCodeSessionFile(file), [{ order: 1, prompt: "Seguro", response: "Respuesta" }]);
  assert.equal(Object.prototype.bancoPolluted, undefined);
  assert.equal(Array.prototype.bancoPolluted, undefined);
});

test("VS Code accepts legacy wrapped JSON and ignores non-text response data", (t) => {
  const f = fixture(t);
  const file = f.write("legacy.json", { v: { requests: [null, [], {
    message: { parts: [null, { text: "Hola" }, { text: " mundo" }] },
    response: [null, { kind: "thinking", value: "Oculto" }, { kind: "toolInvocationSerialized", value: "Comando" }, { value: "Visible" }, { kind: {}, value: 42 }],
  }] } });
  assert.deepEqual(parseVsCodeSessionFile(file), [{ order: 1, prompt: "Hola mundo", response: "Visible" }]);
  assert.deepEqual(parseVsCodeSessionFile(f.write("null.json", "null")), []);
});

test("Codex skips context-only prompts, malformed entries and maintains consecutive order", (t) => {
  const f = fixture(t);
  const file = f.write("codex.jsonl", lines([
    null, [], { type: "response_item", payload: null },
    codexMessage("user", "Contexto sin respuesta"),
    codexMessage("user", "Consulta"),
    codexMessage("assistant", "Primera parte"),
    { type: "response_item", payload: { type: "message", role: "assistant", content: [null, 7, { text: "Segunda parte" }] } },
    codexMessage("user", "Pendiente"),
  ]));
  assert.deepEqual(parseCodexSessionFile(file), [{ order: 1, prompt: "Consulta", response: "Primera parte\n\nSegunda parte" }]);
});

test("Cursor handles malformed content and removes context wrappers", (t) => {
  const f = fixture(t);
  const file = f.write("cursor.jsonl", lines([
    null, [], { role: "user", message: { content: {} } },
    cursorMessage("user", "Contexto <user_query>Consulta real</user_query>"),
    { role: "assistant", message: { content: [null, { type: "tool_use", text: "Ignorar" }, { type: "text", text: "Respuesta" }] } },
    cursorMessage("user", "<timestamp>ahora</timestamp>Otra consulta"),
    cursorMessage("user", "<user_query> </user_query>"),
  ]));
  assert.deepEqual(parseTranscriptTurns(file), [
    { order: 1, prompt: "Consulta real", response: "Respuesta" },
    { order: 2, prompt: "Otra consulta", response: "" },
  ]);
});

test("streaming JSONL preserves UTF-8 across buffer boundaries and closes early previews", (t) => {
  const f = fixture(t);
  const content = "x".repeat(65520) + "á🌿fin";
  const file = f.write("unicode.jsonl", "\uFEFF" + lines([{ content }, { content: "segundo" }]));
  assert.deepEqual([...jsonRecords(file)], [{ content }, { content: "segundo" }]);
  const close = t.mock.method(fs, "closeSync");
  for (const record of jsonRecords(file)) {
    assert.equal(record.content, content);
    break;
  }
  assert.equal(close.mock.callCount(), 1);
});

test("VS Code storage paths support Windows, macOS, Linux and config overrides", () => {
  assert.deepEqual(codeUserRoots("win32", "C:\\Users\\demo", {}), [
    "C:\\Users\\demo\\AppData\\Roaming\\Code\\User",
    "C:\\Users\\demo\\AppData\\Roaming\\Code - Insiders\\User",
  ]);
  assert.equal(codeUserRoots("win32", "C:\\Users\\demo", { APPDATA: "D:\\Data" })[0], "D:\\Data\\Code\\User");
  assert.equal(codeUserRoots("darwin", "/Users/demo", {})[0], "/Users/demo/Library/Application Support/Code/User");
  assert.equal(codeUserRoots("linux", "/home/demo", {})[0], "/home/demo/.config/Code/User");
  assert.equal(codeUserRoots("linux", "/home/demo", { XDG_CONFIG_HOME: "/custom" })[0], "/custom/Code/User");
});

test("workspace ranking honors path boundaries, Windows separators and Unix case", () => {
  assert.equal(matchesWorkspace("C:\\Work\\App\\src", "c:/work/app/"), true);
  assert.equal(matchesWorkspace("file:///C:/Work/My%20App", "c:/work/my app"), true);
  assert.equal(matchesWorkspace("/work/app-old", "/work/app"), false);
  assert.equal(matchesWorkspace("/Work/App", "/work/app"), false);
  const chats = [{ id: "other", cwd: "/work/app-old", workspaceLabel: "/work/app-old", mtimeMs: 20 },
    { id: "match", cwd: "/work/app/src", workspaceLabel: "/work/app/src", mtimeMs: 10 }];
  assert.equal(rankCodexChatsForWorkspace(chats, "/work/app")[0].id, "match");
  assert.equal(rankVsCodeChatsForWorkspace(chats, "/work/app")[0].id, "match");
  assert.equal(chats[0].id, "other");
  assert.equal(rankTranscriptsForWorkspace([
    { projectSlug: "C-Work-other", mtimeMs: 20 }, { projectSlug: "C-Work-App", mtimeMs: 10 },
  ], "C:\\Work\\App")[0].projectSlug, "C-Work-App");
});

test("Codex discovery reads only the newest valid previews and tolerates unreadable directories", (t) => {
  const f = fixture(t);
  fakeHome(t, f.directory);
  f.write(".codex/session_index.jsonl", lines([{ id: "new", thread_name: "Título del índice" }]));
  const old = f.write(".codex/sessions/old.jsonl", lines([codexMessage("user", "Viejo"), codexMessage("assistant", "Respuesta")]), 10);
  f.write(".codex/sessions/new.jsonl", lines([
    { type: "session_meta", payload: { id: "new", cwd: "/work/app" } },
    codexMessage("user", "Nuevo"), codexMessage("assistant", "Respuesta"),
  ]), 20);
  f.write(".codex/sessions/broken.jsonl", "not json", 30);
  const originalOpen = fs.openSync;
  const opened = [];
  t.mock.method(fs, "openSync", (file, ...args) => { opened.push(file); return originalOpen(file, ...args); });
  const originalRead = fs.readdirSync;
  t.mock.method(fs, "readdirSync", (directory, ...args) => {
    if (path.basename(directory) === "archived_sessions") throw new Error("access denied");
    return originalRead(directory, ...args);
  });
  const result = listCodexChats(1);
  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Título del índice");
  assert.equal(result[0].cwd, "/work/app");
  assert.equal(opened.includes(old), false);
});

test("Cursor discovers both flat and nested transcripts in newest-first order", (t) => {
  const f = fixture(t);
  fakeHome(t, f.directory);
  const root = ".cursor/projects/project/agent-transcripts";
  f.write(`${root}/older/older.jsonl`, lines([cursorMessage("user", "Anterior")]), 10);
  f.write(`${root}/newer.jsonl`, lines([cursorMessage("user", "Reciente")]), 20);
  f.write(`${root}/broken.jsonl`, lines([null, { role: "user", message: { content: 42 } }]), 30);
  assert.deepEqual(listCursorTranscripts(2).map((chat) => chat.title), ["Reciente", "Anterior"]);
});

test("VS Code discovery deduplicates legacy files, isolates failures and only reads the newest candidates", (t) => {
  const f = fixture(t);
  fakeHome(t, f.directory);
  const userRoot = path.relative(f.directory, codeUserRoots()[0]);
  const workspace = path.join(userRoot, "workspaceStorage", "workspace");
  f.write(path.join(workspace, "workspace.json"), { folder: pathToFileURL(path.join(f.directory, "my project")).href });
  const old = f.write(path.join(workspace, "chatSessions", "old.json"), { requests: [request("Viejo")] }, 10);
  f.write(path.join(workspace, "chatSessions", "new.json"), { requests: [request("Duplicado")] }, 40);
  f.write(path.join(workspace, "chatSessions", "new.jsonl"), lines([{ kind: 0, v: { customTitle: "Título", requests: [request("Nuevo")] } }]), 20);
  f.write(path.join(workspace, "chatSessions", "broken.json"), "{", 30);
  const originalRead = fs.readFileSync;
  const read = [];
  t.mock.method(fs, "readFileSync", (file, ...args) => { read.push(file); return originalRead(file, ...args); });
  const chats = listVsCodeChats(1);
  assert.equal(chats.length, 1);
  assert.equal(chats[0].title, "Título");
  assert.match(chats[0].workspaceLabel, /my project$/);
  assert.equal(read.includes(old), false);
  assert.deepEqual(listVsCodeChats(10).map((chat) => chat.id), ["new", "old"]);
});

test("VS Code includes chats from windows without a workspace", (t) => {
  const f = fixture(t);
  fakeHome(t, f.directory);
  const userRoot = path.relative(f.directory, codeUserRoots()[0]);
  f.write(path.join(userRoot, "globalStorage", "emptyWindowChatSessions", "empty.json"), { requests: [request("Consulta")] });
  assert.equal(listVsCodeChats()[0].workspaceLabel, "Sin carpeta abierta");
});

test("a zero or negative limit performs no filesystem discovery", (t) => {
  t.mock.method(fs, "readdirSync", () => { throw new Error("must not scan"); });
  assert.deepEqual(listCodexChats(0), []);
  assert.deepEqual(listCursorTranscripts(-1), []);
  assert.deepEqual(listVsCodeChats(0), []);
});
