import * as fs from "fs";
import * as path from "path";
import { StringDecoder } from "string_decoder";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A missing, locked or disappearing directory must not hide other sources. */
export function directoryEntries(directory: string): fs.Dirent[] {
  try {
    return fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}

export type ChatFile = { filePath: string; mtimeMs: number };

export function chatFile(filePath: string): ChatFile | undefined {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() ? { filePath, mtimeMs: stat.mtimeMs } : undefined;
  } catch {
    return undefined;
  }
}

export function newestFirst<T extends ChatFile>(files: T[]): T[] {
  return files.sort((a, b) => b.mtimeMs - a.mtimeMs || a.filePath.localeCompare(b.filePath));
}

export function chatLimit(limit: number): number {
  return Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 50;
}

export function chatTitle(prompt: string, fallback: string): string {
  const title = prompt.replace(/\s+/g, " ").trim() || fallback;
  return title.length > 72 ? `${title.slice(0, 69)}…` : title;
}

/** Stream JSONL so previews can stop after the first turn without loading a full chat. */
export function* jsonRecords(filePath: string): Generator<Record<string, unknown>> {
  const descriptor = fs.openSync(filePath, "r");
  const decoder = new StringDecoder("utf8");
  const buffer = Buffer.alloc(64 * 1024);
  let pending = "";
  const parse = (line: string): Record<string, unknown> | undefined => {
    try {
      const value: unknown = JSON.parse(line.replace(/^\uFEFF/, ""));
      return isRecord(value) ? value : undefined;
    } catch {
      // Editors can leave an incomplete final line while a response is streaming.
      return undefined;
    }
  };
  try {
    let count: number;
    while ((count = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
      pending += decoder.write(buffer.subarray(0, count));
      let start = 0;
      let end: number;
      while ((end = pending.indexOf("\n", start)) !== -1) {
        const record = parse(pending.slice(start, end));
        start = end + 1;
        if (record) yield record;
      }
      pending = pending.slice(start);
    }
    const record = parse(pending + decoder.end());
    if (record) yield record;
  } finally {
    fs.closeSync(descriptor);
  }
}

export function workspacePath(value: string): string {
  if (!value) return "";
  let normalized = value;
  if (/^file:\/\//i.test(normalized)) {
    try {
      const uri = new URL(normalized);
      normalized = `${uri.hostname ? `//${uri.hostname}` : ""}${decodeURIComponent(uri.pathname)}`;
      normalized = normalized.replace(/^\/([a-z]:\/)/i, "$1");
    } catch {
      return value;
    }
  }
  const windows = /^[a-z]:[\\/]/i.test(normalized) || normalized.includes("\\");
  normalized = path.posix.normalize(normalized.replace(/\\/g, "/"));
  if (normalized !== "/") normalized = normalized.replace(/\/$/, "");
  return windows ? normalized.toLowerCase() : normalized;
}

export function matchesWorkspace(candidate: string, workspace: string): boolean {
  const directory = workspacePath(workspace);
  const actual = workspacePath(candidate);
  return !!directory && (actual === directory || actual.startsWith(directory === "/" ? "/" : `${directory}/`));
}
