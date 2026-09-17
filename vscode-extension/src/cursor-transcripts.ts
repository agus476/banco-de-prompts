import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export type TranscriptChat = {
  id: string;
  title: string;
  filePath: string;
  projectSlug: string;
  mtimeMs: number;
};

export type TranscriptTurn = {
  order: number;
  prompt: string;
  response: string;
};

type ContentPart = {
  type?: string;
  text?: string;
};

type TranscriptLine = {
  role?: string;
  message?: {
    content?: ContentPart[] | string;
  };
};

function cursorProjectsRoot(): string {
  return path.join(os.homedir(), ".cursor", "projects");
}

function readTextParts(content: ContentPart[] | string | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content.trim();
  return content
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text!.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/** Saca el <user_query> si existe; si no, usa el texto completo limpio. */
export function cleanUserPrompt(raw: string): string {
  const match = raw.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/i);
  if (match?.[1]) return match[1].trim();
  return raw
    .replace(/<timestamp>[\s\S]*?<\/timestamp>/gi, "")
    .replace(/<\/?user_query>/gi, "")
    .trim();
}

export function parseTranscriptTurns(filePath: string): TranscriptTurn[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);

  const turns: TranscriptTurn[] = [];
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
    let parsed: TranscriptLine;
    try {
      parsed = JSON.parse(line) as TranscriptLine;
    } catch {
      continue;
    }

    const role = parsed.role;
    const text = readTextParts(parsed.message?.content);
    if (!role) continue;

    if (role === "user") {
      flush();
      const prompt = cleanUserPrompt(text);
      if (prompt) pendingPrompt = prompt;
      continue;
    }

    if (role === "assistant" && pendingPrompt && text) {
      pendingResponse.push(text);
    }
  }

  flush();
  return turns.filter((turn) => turn.prompt.length > 0);
}

function titleFromTurns(turns: TranscriptTurn[], fallback: string): string {
  const first = turns[0]?.prompt?.replace(/\s+/g, " ").trim() ?? "";
  if (!first) return fallback;
  return first.length > 72 ? `${first.slice(0, 69)}…` : first;
}

export function listCursorTranscripts(limit = 40): TranscriptChat[] {
  const root = cursorProjectsRoot();
  if (!fs.existsSync(root)) return [];

  const chats: TranscriptChat[] = [];

  for (const projectSlug of fs.readdirSync(root)) {
    const transcriptsDir = path.join(root, projectSlug, "agent-transcripts");
    if (!fs.existsSync(transcriptsDir)) continue;

    for (const entry of fs.readdirSync(transcriptsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const id = entry.name;
      const filePath = path.join(transcriptsDir, id, `${id}.jsonl`);
      if (!fs.existsSync(filePath)) continue;

      let turns: TranscriptTurn[] = [];
      try {
        turns = parseTranscriptTurns(filePath);
      } catch {
        continue;
      }
      if (turns.length === 0) continue;

      const stat = fs.statSync(filePath);
      chats.push({
        id,
        title: titleFromTurns(turns, id),
        filePath,
        projectSlug,
        mtimeMs: stat.mtimeMs,
      });
    }
  }

  return chats.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit);
}

/** Preferí chats del workspace abierto si el path coincide con el slug. */
export function rankTranscriptsForWorkspace(
  chats: TranscriptChat[],
  workspaceFolder?: string,
): TranscriptChat[] {
  if (!workspaceFolder) return chats;
  const normalized = workspaceFolder.replace(/\\/g, "/").toLowerCase();
  const scored = chats.map((chat) => {
    const slug = chat.projectSlug.toLowerCase().replace(/-/g, "");
    const hay = normalized.replace(/[^a-z0-9]/g, "");
    const score = hay.includes(slug.replace(/^cusers/, "").slice(0, 24)) ||
      slug.includes(
        path
          .basename(workspaceFolder)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
      )
      ? 1
      : 0;
    return { chat, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || b.chat.mtimeMs - a.chat.mtimeMs)
    .map((item) => item.chat);
}
