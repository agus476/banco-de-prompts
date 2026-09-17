import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { ChatTurn } from "./chat-types";
import {
  chatFile, chatLimit, chatTitle, directoryEntries, isRecord, jsonRecords,
  matchesWorkspace, newestFirst, textValue, workspacePath, type ChatFile,
} from "./chat-files";

export type { ChatTurn } from "./chat-types";

export type VsCodeChat = {
  id: string;
  title: string;
  filePath: string;
  workspaceLabel: string;
  mtimeMs: number;
};

/** Defaults from VS Code's standard desktop installations; also testable off-platform. */
export function codeUserRoots(
  platform: NodeJS.Platform = process.platform,
  home = os.homedir(),
  environment: NodeJS.ProcessEnv = process.env,
): string[] {
  const paths = platform === "win32" ? path.win32 : path.posix;
  const configuration = platform === "win32"
    ? environment.APPDATA || paths.join(home, "AppData", "Roaming")
    : platform === "darwin"
      ? paths.join(home, "Library", "Application Support")
      : environment.XDG_CONFIG_HOME || paths.join(home, ".config");
  return ["Code", "Code - Insiders"].map((edition) => paths.join(configuration, edition, "User"));
}

function readWorkspaceLabel(workspaceDir: string): string {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(path.join(workspaceDir, "workspace.json"), "utf8"));
    if (isRecord(value)) {
      const folder = textValue(value.folder) || textValue(value.workspace);
      if (folder) return workspacePath(folder);
    }
  } catch {
    // Workspaces without metadata remain importable.
  }
  return path.basename(workspaceDir);
}

type JsonContainer = Record<string, unknown> | unknown[];
type PropertyKey = string | number;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

function validPath(value: unknown): value is PropertyKey[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 100 && value.every((key) =>
    typeof key === "string" ? !unsafeKeys.has(key) :
      typeof key === "number" && Number.isSafeInteger(key) && key >= 0 && key < 1_000_000);
}

function containerAt(state: Record<string, unknown>, keys: PropertyKey[]): JsonContainer | undefined {
  let current: JsonContainer = state;
  for (let index = 0; index < keys.length - 1; index++) {
    const key = keys[index];
    if (!Object.hasOwn(current, key)) return undefined;
    const next: unknown = (current as Record<PropertyKey, unknown>)[key];
    if (!isRecord(next) && !Array.isArray(next)) return undefined;
    current = next;
  }
  const last = keys[keys.length - 1];
  // Reject sparse arrays and properties such as `length` that could corrupt later entries.
  if (Array.isArray(current)) {
    const position = typeof last === "number" ? last : /^(0|[1-9]\d*)$/.test(last) ? Number(last) : -1;
    if (!Number.isSafeInteger(position) || position < 0 || position > current.length) return undefined;
  }
  return current;
}

/** Replay VS Code's objectMutationLog: set, nested array push/truncate, and delete. */
function readJsonl(filePath: string): Record<string, unknown> | undefined {
  let state: Record<string, unknown> | undefined;
  for (const entry of jsonRecords(filePath)) {
    if (entry.kind === 0) {
      if (isRecord(entry.v)) state = entry.v;
      continue;
    }
    if (!state || !validPath(entry.k)) continue;
    const container = containerAt(state, entry.k);
    if (!container) continue;
    const current = container as Record<PropertyKey, unknown>;
    const key = entry.k[entry.k.length - 1];
    if (entry.kind === 1) {
      current[key] = entry.v;
    } else if (entry.kind === 3) {
      delete current[key];
    } else if (entry.kind === 2) {
      if (entry.v !== undefined && !Array.isArray(entry.v)) continue;
      const previous = Object.hasOwn(current, key) ? current[key] : undefined;
      if (previous !== undefined && previous !== null && !Array.isArray(previous)) continue;
      const array: unknown[] = Array.isArray(previous) ? previous : [];
      if (entry.i !== undefined) {
        if (typeof entry.i !== "number" || !Number.isSafeInteger(entry.i) || entry.i < 0 || entry.i > array.length) continue;
        array.length = entry.i;
      }
      if (Array.isArray(entry.v)) for (const value of entry.v) array.push(value);
      current[key] = array;
    }
  }
  return state;
}

function readSession(filePath: string): Record<string, unknown> | undefined {
  const value: unknown = /\.jsonl$/i.test(filePath)
    ? readJsonl(filePath)
    : JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  if (!isRecord(value)) return undefined;
  return Array.isArray(value.requests) ? value : isRecord(value.v) ? value.v : value;
}

function extractPrompt(message: unknown): string {
  if (!isRecord(message)) return "";
  if (textValue(message.text)) return textValue(message.text);
  return Array.isArray(message.parts)
    ? message.parts.map((part) => isRecord(part) && typeof part.text === "string" ? part.text : "").join("").trim()
    : "";
}

function extractResponse(response: unknown): string {
  if (!Array.isArray(response)) return "";
  return response.map((part) => {
    if (!isRecord(part)) return "";
    const kind = textValue(part.kind);
    if (/thinking|toolInvocation|progress|mcp|preparing/i.test(kind)) return "";
    return textValue(part.value);
  }).filter(Boolean).join("\n\n");
}

function sessionTurns(session: Record<string, unknown> | undefined): ChatTurn[] {
  if (!session || !Array.isArray(session.requests)) return [];
  const turns: ChatTurn[] = [];
  for (const request of session.requests) {
    if (!isRecord(request)) continue;
    const prompt = extractPrompt(request.message);
    if (prompt) turns.push({ order: turns.length + 1, prompt, response: extractResponse(request.response) });
  }
  return turns;
}

export function parseVsCodeSessionFile(filePath: string): ChatTurn[] {
  return sessionTurns(readSession(filePath));
}

export function listVsCodeChats(limit = 50): VsCodeChat[] {
  const count = chatLimit(limit);
  if (!count) return [];
  const candidates: (ChatFile & { workspaceDir?: string })[] = [];
  const addFiles = (directory: string, workspaceDir?: string) => {
    const entries = directoryEntries(directory);
    const jsonlNames = new Set(entries.filter((entry) => entry.isFile() && /\.jsonl$/i.test(entry.name))
      .map((entry) => path.parse(entry.name).name));
    for (const entry of entries) {
      if (!entry.isFile() || !/\.(json|jsonl)$/i.test(entry.name)) continue;
      if (/\.json$/i.test(entry.name) && jsonlNames.has(path.parse(entry.name).name)) continue;
      const file = chatFile(path.join(directory, entry.name));
      if (file) candidates.push({ ...file, workspaceDir });
    }
  };
  for (const root of codeUserRoots()) {
    const storage = path.join(root, "workspaceStorage");
    for (const workspace of directoryEntries(storage)) {
      if (!workspace.isDirectory()) continue;
      const directory = path.join(storage, workspace.name);
      addFiles(path.join(directory, "chatSessions"), directory);
    }
    addFiles(path.join(root, "globalStorage", "emptyWindowChatSessions"));
  }
  const chats: VsCodeChat[] = [];
  const labels = new Map<string, string>();
  for (const file of newestFirst(candidates)) {
    try {
      const session = readSession(file.filePath);
      const turns = sessionTurns(session);
      if (!turns.length) continue;
      let workspaceLabel = "Sin carpeta abierta";
      if (file.workspaceDir) {
        workspaceLabel = labels.get(file.workspaceDir) || readWorkspaceLabel(file.workspaceDir);
        labels.set(file.workspaceDir, workspaceLabel);
      }
      const id = path.parse(file.filePath).name;
      chats.push({
        id, filePath: file.filePath, mtimeMs: file.mtimeMs, workspaceLabel,
        title: textValue(session?.customTitle) || chatTitle(turns[0].prompt, id),
      });
      if (chats.length >= count) break;
    } catch {
      // A broken or disappearing file should not hide valid sessions from other workspaces.
    }
  }
  return chats;
}

export function rankVsCodeChatsForWorkspace(chats: VsCodeChat[], workspaceFolder?: string): VsCodeChat[] {
  if (!workspaceFolder) return chats;
  return [...chats].sort((a, b) =>
    Number(matchesWorkspace(b.workspaceLabel, workspaceFolder)) -
    Number(matchesWorkspace(a.workspaceLabel, workspaceFolder)) || b.mtimeMs - a.mtimeMs);
}
