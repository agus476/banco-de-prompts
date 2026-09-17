import * as os from "os";
import * as path from "path";
import type { ChatTurn } from "./chat-types";
import {
  chatFile, chatLimit, chatTitle, directoryEntries, isRecord, jsonRecords,
  newestFirst, textValue, workspacePath, type ChatFile,
} from "./chat-files";

export type TranscriptChat = {
  id: string;
  title: string;
  filePath: string;
  projectSlug: string;
  mtimeMs: number;
};

export type TranscriptTurn = ChatTurn;

function readTextParts(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content.map((part) => isRecord(part) && part.type === "text" ? textValue(part.text) : "")
    .filter(Boolean).join("\n\n");
}

/** Extract the user query without importing Cursor's timestamp/context wrapper. */
export function cleanUserPrompt(raw: string): string {
  const match = raw.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/i);
  if (match) return match[1].trim();
  return raw.replace(/<timestamp>[\s\S]*?<\/timestamp>/gi, "")
    .replace(/<\/?user_query>/gi, "").trim();
}

function readTranscript(filePath: string, preview = false): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  let prompt = "";
  let response: string[] = [];
  const flush = () => {
    if (prompt) turns.push({ order: turns.length + 1, prompt, response: response.join("\n\n") });
    prompt = "";
    response = [];
  };
  for (const entry of jsonRecords(filePath)) {
    const text = readTextParts(isRecord(entry.message) ? entry.message.content : undefined);
    if (entry.role === "user") {
      flush();
      prompt = cleanUserPrompt(text);
      if (preview && prompt) {
        flush();
        break;
      }
    } else if (entry.role === "assistant" && prompt && text) {
      response.push(text);
    }
  }
  flush();
  return turns;
}

export function parseTranscriptTurns(filePath: string): TranscriptTurn[] {
  return readTranscript(filePath);
}

export function listCursorTranscripts(limit = 40): TranscriptChat[] {
  const count = chatLimit(limit);
  if (!count) return [];
  const root = path.join(os.homedir(), ".cursor", "projects");
  const candidates: (ChatFile & { id: string; projectSlug: string })[] = [];
  for (const project of directoryEntries(root)) {
    if (!project.isDirectory()) continue;
    const directory = path.join(root, project.name, "agent-transcripts");
    for (const entry of directoryEntries(directory)) {
      const filePath = entry.isDirectory()
        ? path.join(directory, entry.name, `${entry.name}.jsonl`)
        : path.join(directory, entry.name);
      if (!entry.isDirectory() && (!entry.isFile() || !/\.jsonl$/i.test(entry.name))) continue;
      const file = chatFile(filePath);
      if (file) candidates.push({ ...file, id: entry.isDirectory() ? entry.name : path.parse(entry.name).name, projectSlug: project.name });
    }
  }
  const chats: TranscriptChat[] = [];
  for (const file of newestFirst(candidates)) {
    try {
      const turns = readTranscript(file.filePath, true);
      if (!turns.length) continue;
      chats.push({ ...file, title: chatTitle(turns[0].prompt, file.id) });
      if (chats.length >= count) break;
    } catch {
      // Continue when another editor removes or locks a transcript during discovery.
    }
  }
  return chats;
}

/** Match the full encoded workspace path before falling back to its folder name. */
export function rankTranscriptsForWorkspace(chats: TranscriptChat[], workspaceFolder?: string): TranscriptChat[] {
  if (!workspaceFolder) return chats;
  const normalized = workspacePath(workspaceFolder).toLowerCase();
  const slug = normalized.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  const folder = path.posix.basename(normalized).replace(/[^\p{L}\p{N}]+/gu, "-");
  const score = (chat: TranscriptChat) => {
    const project = chat.projectSlug.toLowerCase().replace(/^-|-$/g, "");
    if (slug && (project === slug || project.startsWith(`${slug}-`))) return 2;
    return folder && (project === folder || project.endsWith(`-${folder}`)) ? 1 : 0;
  };
  return [...chats].sort((a, b) => score(b) - score(a) || b.mtimeMs - a.mtimeMs);
}
