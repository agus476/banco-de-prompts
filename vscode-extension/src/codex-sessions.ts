import * as os from "os";
import * as path from "path";
import type { ChatTurn } from "./chat-types";
import {
  chatFile, chatLimit, chatTitle, directoryEntries, isRecord, jsonRecords,
  matchesWorkspace, newestFirst, textValue, type ChatFile,
} from "./chat-files";

export type CodexChat = {
  id: string;
  title: string;
  filePath: string;
  cwd?: string;
  mtimeMs: number;
};

function codexRoot(): string {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

function sessionFiles(root: string): ChatFile[] {
  const directories = [root];
  const files: ChatFile[] = [];
  while (directories.length > 0) {
    const directory = directories.pop()!;
    for (const entry of directoryEntries(directory)) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) directories.push(full);
      else if (entry.isFile() && /\.jsonl$/i.test(entry.name)) {
        const file = chatFile(full);
        if (file) files.push(file);
      }
    }
  }
  return files;
}

function readIndex(root: string): Map<string, string> {
  const index = new Map<string, string>();
  try {
    for (const entry of jsonRecords(path.join(root, "session_index.jsonl"))) {
      const id = textValue(entry.id);
      const title = textValue(entry.thread_name);
      if (id && title) index.set(id, title);
    }
  } catch {
    // The index is optional; each session still has its own prompt and metadata.
  }
  return index;
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content.map((part) => isRecord(part) ? textValue(part.text) : "")
    .filter(Boolean).join("\n\n").trim();
}

function readSession(filePath: string, preview = false): {
  turns: ChatTurn[];
  id?: string;
  cwd?: string;
} {
  const turns: ChatTurn[] = [];
  let id: string | undefined;
  let cwd: string | undefined;
  let prompt = "";
  let response: string[] = [];
  const flush = () => {
    if (prompt && response.length) {
      turns.push({ order: turns.length + 1, prompt, response: response.join("\n\n") });
    }
    prompt = "";
    response = [];
  };

  for (const entry of jsonRecords(filePath)) {
    if (!isRecord(entry.payload)) continue;
    const payload = entry.payload;
    if (entry.type === "session_meta") {
      id = textValue(payload.id) || textValue(payload.session_id) || undefined;
      cwd = textValue(payload.cwd) || undefined;
      continue;
    }
    if (entry.type !== "response_item" || payload.type !== "message") continue;
    const text = extractText(payload.content);
    if (payload.role === "user") {
      flush();
      if (preview && turns.length) break;
      prompt = text;
    } else if (payload.role === "assistant" && prompt && text) {
      response.push(text);
      if (preview) {
        flush();
        break;
      }
    }
  }
  flush();
  return { turns, id, cwd };
}

export function parseCodexSessionFile(filePath: string): ChatTurn[] {
  return readSession(filePath).turns;
}

export function listCodexChats(limit = 50): CodexChat[] {
  const count = chatLimit(limit);
  if (!count) return [];
  const root = codexRoot();
  const files = newestFirst([
    ...sessionFiles(path.join(root, "sessions")),
    ...sessionFiles(path.join(root, "archived_sessions")),
  ]);
  const index = readIndex(root);
  const chats: CodexChat[] = [];
  for (const file of files) {
    try {
      const session = readSession(file.filePath, true);
      if (!session.turns.length) continue;
      const filename = path.basename(file.filePath);
      const id = session.id || filename.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i)?.[0] || filename;
      chats.push({
        ...file, id, cwd: session.cwd,
        title: index.get(id) || chatTitle(session.turns[0].prompt, id),
      });
      if (chats.length >= count) break;
    } catch {
      // A single unreadable session must not prevent importing the others.
    }
  }
  return chats;
}

export function rankCodexChatsForWorkspace(chats: CodexChat[], workspaceFolder?: string): CodexChat[] {
  if (!workspaceFolder) return chats;
  return [...chats].sort((a, b) =>
    Number(matchesWorkspace(b.cwd || "", workspaceFolder)) -
    Number(matchesWorkspace(a.cwd || "", workspaceFolder)) || b.mtimeMs - a.mtimeMs);
}
