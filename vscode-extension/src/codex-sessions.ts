import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { ChatTurn } from "./vscode-chats";

export type CodexChat = {
  id: string;
  title: string;
  filePath: string;
  cwd?: string;
  mtimeMs: number;
};

type IndexEntry = {
  id: string;
  thread_name?: string;
  updated_at?: string;
};

function codexRoot(): string {
  return path.join(os.homedir(), ".codex");
}

function walkJsonl(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsonl(full, acc);
    else if (full.endsWith(".jsonl")) acc.push(full);
  }
  return acc;
}

function readIndex(): Map<string, IndexEntry> {
  const map = new Map<string, IndexEntry>();
  const indexPath = path.join(codexRoot(), "session_index.jsonl");
  if (!fs.existsSync(indexPath)) return map;
  for (const line of fs.readFileSync(indexPath, "utf8").split(/\r?\n/).filter(Boolean)) {
    try {
      const entry = JSON.parse(line) as IndexEntry;
      if (entry?.id) map.set(entry.id, entry);
    } catch {
      // skip bad lines
    }
  }
  return map;
}

function extractText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const item = part as { type?: string; text?: string };
      if (typeof item.text === "string") return item.text;
      return "";
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function idFromFile(filePath: string): string | null {
  const match = path
    .basename(filePath)
    .match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match?.[1] ?? null;
}

export function parseCodexSessionFile(filePath: string): ChatTurn[] {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const turns: ChatTurn[] = [];
  let pendingPrompt: string | null = null;
  let pendingResponse: string[] = [];

  const flush = () => {
    if (!pendingPrompt) return;
    turns.push({
      order: turns.length + 1,
      prompt: pendingPrompt,
      response: pendingResponse.join("\n\n").trim(),
    });
    pendingPrompt = null;
    pendingResponse = [];
  };

  for (const line of lines) {
    let entry: {
      type?: string;
      payload?: {
        type?: string;
        role?: string;
        content?: unknown;
      };
    };
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.type !== "response_item") continue;
    const payload = entry.payload;
    if (!payload || payload.type !== "message") continue;
    const role = payload.role;
    const text = extractText(payload.content);
    if (!text) continue;

    if (role === "user") {
      flush();
      pendingPrompt = text;
      continue;
    }

    if (role === "assistant" && pendingPrompt) {
      pendingResponse.push(text);
    }
  }

  flush();
  // Codex a veces mete un primer "user" de contexto sin respuesta de texto.
  return turns.filter((turn) => turn.prompt.length > 0 && turn.response.length > 0);
}

function readSessionMeta(filePath: string): { id?: string; cwd?: string; titleHint?: string } {
  try {
    const first = fs.readFileSync(filePath, "utf8").split(/\r?\n/).find(Boolean);
    if (!first) return {};
    const entry = JSON.parse(first) as {
      type?: string;
      payload?: { id?: string; session_id?: string; cwd?: string };
    };
    if (entry.type !== "session_meta") return {};
    return {
      id: entry.payload?.id || entry.payload?.session_id,
      cwd: entry.payload?.cwd,
    };
  } catch {
    return {};
  }
}

export function listCodexChats(limit = 50): CodexChat[] {
  const root = codexRoot();
  const files = [
    ...walkJsonl(path.join(root, "sessions")),
    ...walkJsonl(path.join(root, "archived_sessions")),
  ];
  const index = readIndex();
  const chats: CodexChat[] = [];

  for (const filePath of files) {
    let turns: ChatTurn[] = [];
    try {
      turns = parseCodexSessionFile(filePath);
    } catch {
      continue;
    }
    if (turns.length === 0) continue;

    const meta = readSessionMeta(filePath);
    const id = meta.id || idFromFile(filePath) || path.basename(filePath);
    const indexed = index.get(id);
    const fromPrompt = turns[0].prompt.replace(/\s+/g, " ").trim();
    const title =
      indexed?.thread_name?.trim() ||
      (fromPrompt.length > 72 ? `${fromPrompt.slice(0, 69)}…` : fromPrompt) ||
      id;

    const st = fs.statSync(filePath);
    chats.push({
      id,
      title,
      filePath,
      cwd: meta.cwd,
      mtimeMs: st.mtimeMs,
    });
  }

  return chats.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit);
}

export function rankCodexChatsForWorkspace(
  chats: CodexChat[],
  workspaceFolder?: string,
): CodexChat[] {
  if (!workspaceFolder) return chats;
  const needle = workspaceFolder.replace(/\\/g, "/").toLowerCase();
  return [...chats].sort((a, b) => {
    const as = (a.cwd || "").replace(/\\/g, "/").toLowerCase().includes(needle) ? 1 : 0;
    const bs = (b.cwd || "").replace(/\\/g, "/").toLowerCase().includes(needle) ? 1 : 0;
    return bs - as || b.mtimeMs - a.mtimeMs;
  });
}
