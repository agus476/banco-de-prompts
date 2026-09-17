import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export type VsCodeChat = {
  id: string;
  title: string;
  filePath: string;
  workspaceLabel: string;
  mtimeMs: number;
};

export type ChatTurn = {
  order: number;
  prompt: string;
  response: string;
};

type JsonSession = {
  customTitle?: string;
  sessionId?: string;
  requests?: unknown[];
  v?: { customTitle?: string; sessionId?: string; requests?: unknown[] };
};

function codeUserRoots(): string[] {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  return [
    path.join(appData, "Code", "User", "workspaceStorage"),
    path.join(appData, "Code - Insiders", "User", "workspaceStorage"),
  ].filter((root) => fs.existsSync(root));
}

function readWorkspaceLabel(workspaceDir: string): string {
  const ws = path.join(workspaceDir, "workspace.json");
  if (!fs.existsSync(ws)) return path.basename(workspaceDir);
  try {
    const raw = JSON.parse(fs.readFileSync(ws, "utf8")) as {
      folder?: string;
      workspace?: string;
    };
    const folder = raw.folder || raw.workspace;
    if (!folder) return path.basename(workspaceDir);
    try {
      return decodeURIComponent(folder.replace(/^file:\/\/\//, "").replace(/^file:\/\//, ""));
    } catch {
      return folder;
    }
  } catch {
    return path.basename(workspaceDir);
  }
}

function setByPath(target: Record<string, unknown>, keys: string[], value: unknown) {
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = cursor[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}

function applyJsonl(lines: string[]): JsonSession | null {
  let state: Record<string, unknown> | null = null;

  for (const line of lines) {
    let entry: { kind?: number; k?: string[]; v?: unknown };
    try {
      entry = JSON.parse(line) as { kind?: number; k?: string[]; v?: unknown };
    } catch {
      continue;
    }

    if (entry.kind === 0 && entry.v && typeof entry.v === "object") {
      state = { ...(entry.v as Record<string, unknown>) };
      continue;
    }
    if (!state || !Array.isArray(entry.k) || entry.k.length === 0) continue;

    if (entry.kind === 1) {
      setByPath(state, entry.k, entry.v);
      continue;
    }

    if (entry.kind === 2) {
      const key = entry.k[0];
      const current = state[key];
      if (Array.isArray(entry.v)) {
        state[key] = Array.isArray(current) ? [...current, ...entry.v] : [...entry.v];
      } else if (Array.isArray(current)) {
        current.push(entry.v);
      } else {
        state[key] = [entry.v];
      }
    }
  }

  return state as JsonSession | null;
}

function extractPrompt(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const msg = message as { text?: string; parts?: { text?: string }[] };
  if (typeof msg.text === "string" && msg.text.trim()) return msg.text.trim();
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
}

function extractResponse(response: unknown): string {
  if (!Array.isArray(response)) return "";
  const chunks: string[] = [];

  for (const part of response) {
    if (!part || typeof part !== "object") continue;
    const item = part as { kind?: string; value?: unknown };
    const kind = item.kind ?? "";
    if (
      kind.includes("thinking") ||
      kind.includes("toolInvocation") ||
      kind.includes("progress") ||
      kind.includes("mcp") ||
      kind.includes("Preparing")
    ) {
      continue;
    }
    if (typeof item.value === "string" && item.value.trim()) {
      chunks.push(item.value.trim());
    }
  }

  return chunks.join("\n\n").trim();
}

export function parseVsCodeSessionFile(filePath: string): ChatTurn[] {
  const raw = fs.readFileSync(filePath, "utf8");
  let session: JsonSession | null = null;

  if (filePath.endsWith(".jsonl")) {
    session = applyJsonl(raw.split(/\r?\n/).filter(Boolean));
  } else {
    session = JSON.parse(raw) as JsonSession;
  }

  if (!session) return [];
  const requests = session.requests ?? session.v?.requests ?? [];
  if (!Array.isArray(requests)) return [];

  const turns: ChatTurn[] = [];
  for (const request of requests) {
    if (!request || typeof request !== "object") continue;
    const item = request as { message?: unknown; response?: unknown };
    const prompt = extractPrompt(item.message);
    if (!prompt) continue;
    turns.push({
      order: turns.length + 1,
      prompt,
      response: extractResponse(item.response),
    });
  }
  return turns;
}

function titleFromSession(filePath: string, turns: ChatTurn[]): string {
  try {
    if (filePath.endsWith(".json")) {
      const session = JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonSession;
      if (session.customTitle?.trim()) return session.customTitle.trim();
    } else {
      const session = applyJsonl(
        fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean),
      );
      const title = session?.customTitle || session?.v?.customTitle;
      if (typeof title === "string" && title.trim()) return title.trim();
    }
  } catch {
    // fall through
  }
  const first = turns[0]?.prompt.replace(/\s+/g, " ").trim() ?? path.basename(filePath);
  return first.length > 72 ? `${first.slice(0, 69)}…` : first;
}

export function listVsCodeChats(limit = 50): VsCodeChat[] {
  const chats: VsCodeChat[] = [];

  for (const root of codeUserRoots()) {
    for (const workspaceId of fs.readdirSync(root)) {
      const workspaceDir = path.join(root, workspaceId);
      const sessionsDir = path.join(workspaceDir, "chatSessions");
      if (!fs.existsSync(sessionsDir)) continue;
      const workspaceLabel = readWorkspaceLabel(workspaceDir);

      for (const file of fs.readdirSync(sessionsDir)) {
        if (!/\.(json|jsonl)$/i.test(file)) continue;
        const filePath = path.join(sessionsDir, file);
        let turns: ChatTurn[] = [];
        try {
          turns = parseVsCodeSessionFile(filePath);
        } catch {
          continue;
        }
        if (turns.length === 0) continue;
        const st = fs.statSync(filePath);
        chats.push({
          id: path.basename(file, path.extname(file)),
          title: titleFromSession(filePath, turns),
          filePath,
          workspaceLabel,
          mtimeMs: st.mtimeMs,
        });
      }
    }
  }

  return chats.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit);
}

export function rankVsCodeChatsForWorkspace(
  chats: VsCodeChat[],
  workspaceFolder?: string,
): VsCodeChat[] {
  if (!workspaceFolder) return chats;
  const needle = workspaceFolder.replace(/\\/g, "/").toLowerCase();
  return [...chats].sort((a, b) => {
    const as = a.workspaceLabel.replace(/\\/g, "/").toLowerCase().includes(needle) ? 1 : 0;
    const bs = b.workspaceLabel.replace(/\\/g, "/").toLowerCase().includes(needle) ? 1 : 0;
    return bs - as || b.mtimeMs - a.mtimeMs;
  });
}
