import * as vscode from "vscode";
import {
  listCodexChats,
  parseCodexSessionFile,
  rankCodexChatsForWorkspace,
} from "./codex-sessions";
import {
  listCursorTranscripts,
  parseTranscriptTurns,
  rankTranscriptsForWorkspace,
} from "./cursor-transcripts";
import {
  listVsCodeChats,
  parseVsCodeSessionFile,
  rankVsCodeChatsForWorkspace,
  type ChatTurn,
} from "./vscode-chats";

import { BancoApi, resultUrl, type ImportResult } from "./api";
import { BancoSettings } from "./settings";
import type { RecentImport } from "./sidebar";

export function createImportCommands(
  api: BancoApi,
  settings: BancoSettings,
  onImported: (item: RecentImport) => Promise<void>,
) {
  function config() {
    const cfg = vscode.workspace.getConfiguration("banco");
    return {
      apiUrl: settings.apiUrl,
      defaultProjectId: cfg.get<string>("defaultProjectId") || "",
      defaultTool: cfg.get<string>("defaultTool") || "Codex",
    };
  }
  const fetchProjects = (expectedApiUrl: string) => vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Banco: consultando proyectos…" },
    () => api.fetchProjects(expectedApiUrl),
  );

  async function pickProjectAndSession(sessionHint?: string): Promise<{
    apiUrl: string;
    projectId?: string;
    sessionId?: string;
    sessionTitle?: string;
  } | undefined> {
    const { apiUrl, defaultProjectId } = config();
    const projects = await fetchProjects(apiUrl);
    if (projects.length === 0) {
      void vscode.window.showErrorMessage(
        "No hay proyectos en Banco de prompts. Creá uno en la web primero.",
      );
      return undefined;
    }

    const projectItems = projects.map((project) => ({
      label: project.title,
      description: project.subject?.name || "Sin materia",
      detail: defaultProjectId === project.id ? "Proyecto por defecto" : undefined,
      project,
    }));

    const pickedProject =
      (defaultProjectId
        ? projectItems.find((item) => item.project.id === defaultProjectId)
        : undefined) ??
      (await vscode.window.showQuickPick(projectItems, {
        placeHolder: "Elegí el proyecto de la bitácora",
      }));
    if (!pickedProject) return undefined;

    const sessionItems = [
      {
        label: "Nueva sesión",
        description: sessionHint || "Importa el chat elegido",
        sessionId: undefined as string | undefined,
      },
      ...pickedProject.project.sessions.map((session) => ({
        label: session.title,
        description: session.tool,
        sessionId: session.id as string | undefined,
      })),
    ];

    const pickedSession = await vscode.window.showQuickPick(sessionItems, {
      placeHolder: "¿Sesión nueva o existente?",
    });
    if (!pickedSession) return undefined;

    let sessionTitle: string | undefined;
    if (!pickedSession.sessionId) {
      sessionTitle = await vscode.window.showInputBox({
        prompt: "Título de la sesión",
        value: sessionHint || `Import · ${new Date().toLocaleString("es-AR")}`,
      });
      if (sessionTitle === undefined) return undefined;
    }

    return {
      apiUrl,
      projectId: pickedProject.project.id,
      sessionId: pickedSession.sessionId,
      sessionTitle: sessionTitle || undefined,
    };
  }

  async function postInteractions(body: Record<string, unknown>, expectedApiUrl: string) {
    const result = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Banco: guardando interacciones…" },
      () => api.postInteractions(body, expectedApiUrl),
    );
    try {
      await onImported({
        source: String(body.tool || "IA"),
        count: result.createdCount,
        at: new Date().toISOString(),
        url: result.url,
        apiUrl: result.apiUrl,
      });
    } catch {
      void vscode.window.showWarningMessage(
        "La importación se guardó en la app, pero no se pudo actualizar el historial local de VS Code.",
      );
    }
    return result;
  }

  async function openResult(result: ImportResult) {
    const open = "Abrir en la app";
    const choice = await vscode.window.showInformationMessage(
      result.createdCount === 1 ? "Se guardó 1 interacción." : `Se guardaron ${result.createdCount} interacciones.`,
      open,
    );
    if (choice === open) {
      await vscode.env.openExternal(vscode.Uri.parse(resultUrl(result.apiUrl, result.url)));
    }
  }

  async function pickTurns(turns: ChatTurn[]): Promise<ChatTurn[] | undefined> {
    if (turns.length === 1) return turns;

    const mode = await vscode.window.showQuickPick(
      [
        {
          label: "Última interacción",
          description: "Solo el último prompt + respuesta",
          value: "last" as const,
        },
        {
          label: "Todas las interacciones",
          description: `${turns.length} turnos`,
          value: "all" as const,
        },
        {
          label: "Elegir turnos…",
          description: "Selección múltiple",
          value: "pick" as const,
        },
      ],
      { placeHolder: "¿Qué parte del chat importamos?" },
    );
    if (!mode) return undefined;

    if (mode.value === "last") return [turns[turns.length - 1]];
    if (mode.value === "all") return turns;

    const items = turns.map((turn) => ({
      label: `#${turn.order} ${turn.prompt.replace(/\s+/g, " ").slice(0, 80)}`,
      description: turn.response
        ? turn.response.replace(/\s+/g, " ").slice(0, 60)
        : "Sin respuesta de texto",
      turn,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      canPickMany: true,
      placeHolder: "Marcá las interacciones a guardar",
    });
    if (!picked || picked.length === 0) return undefined;
    return picked.map((item) => item.turn);
  }

  async function importSelectedTurns(opts: {
    source: string;
    tool: string;
    title: string;
    turns: ChatTurn[];
    capturedAt: string;
  }) {
    const selected = await pickTurns(opts.turns);
    if (!selected) return;

    const target = await pickProjectAndSession(opts.title.slice(0, 80));
    if (!target) return;

    const result = await postInteractions({
      source: opts.source,
      tool: opts.tool,
      capturedAt: opts.capturedAt,
      projectId: target.projectId,
      sessionId: target.sessionId,
      sessionTitle: target.sessionTitle,
      interactions: selected.map((turn) => ({
        prompt: turn.prompt,
        response: turn.response,
      })),
    }, target.apiUrl);

    await openResult(result);
  }

  async function importFromCodex() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const chats = rankCodexChatsForWorkspace(listCodexChats(50), workspaceFolder);

    if (chats.length === 0) {
      void vscode.window.showErrorMessage(
        "No encontré chats de Codex en %USERPROFILE%\\.codex\\sessions. Usá Codex al menos una vez.",
      );
      return;
    }

    const pickedChat = await vscode.window.showQuickPick(
      chats.map((chat) => ({
        label: chat.title,
        description: new Date(chat.mtimeMs).toLocaleString("es-AR"),
        detail: chat.cwd || chat.id,
        chat,
      })),
      { placeHolder: "Elegí un chat de Codex" },
    );
    if (!pickedChat) return;

    const turns = parseCodexSessionFile(pickedChat.chat.filePath);
    if (turns.length === 0) {
      void vscode.window.showErrorMessage("Ese chat de Codex no tiene turnos importables.");
      return;
    }

    await importSelectedTurns({
      source: "codex",
      tool: "Codex",
      title: pickedChat.chat.title,
      turns,
      capturedAt: new Date(pickedChat.chat.mtimeMs).toISOString(),
    });
  }

  async function importFromCursor() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const chats = rankTranscriptsForWorkspace(listCursorTranscripts(50), workspaceFolder);

    if (chats.length === 0) {
      void vscode.window.showErrorMessage(
        "No encontré chats de Cursor en ~/.cursor/projects/*/agent-transcripts.",
      );
      return;
    }

    const pickedChat = await vscode.window.showQuickPick(
      chats.map((chat) => ({
        label: chat.title,
        description: new Date(chat.mtimeMs).toLocaleString("es-AR"),
        detail: chat.projectSlug,
        chat,
      })),
      { placeHolder: "Elegí un chat de Cursor" },
    );
    if (!pickedChat) return;

    const turns = parseTranscriptTurns(pickedChat.chat.filePath);
    if (turns.length === 0) {
      void vscode.window.showErrorMessage("Ese chat no tiene turnos importables.");
      return;
    }

    await importSelectedTurns({
      source: "cursor-transcript",
      tool: "Cursor",
      title: pickedChat.chat.title,
      turns,
      capturedAt: new Date(pickedChat.chat.mtimeMs).toISOString(),
    });
  }

  async function importFromVSCode() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const chats = rankVsCodeChatsForWorkspace(listVsCodeChats(50), workspaceFolder);

    if (chats.length === 0) {
      void vscode.window.showErrorMessage(
        "No encontré chats de VS Code en %APPDATA%\\Code\\User\\workspaceStorage\\*\\chatSessions.",
      );
      return;
    }

    const pickedChat = await vscode.window.showQuickPick(
      chats.map((chat) => ({
        label: chat.title,
        description: new Date(chat.mtimeMs).toLocaleString("es-AR"),
        detail: chat.workspaceLabel,
        chat,
      })),
      { placeHolder: "Elegí un chat de Visual Studio Code / Copilot" },
    );
    if (!pickedChat) return;

    const turns = parseVsCodeSessionFile(pickedChat.chat.filePath);
    if (turns.length === 0) {
      void vscode.window.showErrorMessage("Ese chat no tiene turnos importables.");
      return;
    }

    await importSelectedTurns({
      source: "vscode-copilot",
      tool: "Copilot",
      title: pickedChat.chat.title,
      turns,
      capturedAt: new Date(pickedChat.chat.mtimeMs).toISOString(),
    });
  }

  async function importChat() {
    const source = await vscode.window.showQuickPick(
      [
        {
          label: "Codex",
          description: "Chats de OpenAI Codex (~/.codex/sessions)",
          value: "codex" as const,
        },
        {
          label: "Visual Studio Code (Copilot Chat)",
          description: "Chats de proyectos en VS Code",
          value: "vscode" as const,
        },
        {
          label: "Cursor",
          description: "Agent transcripts de Cursor",
          value: "cursor" as const,
        },
      ],
      { placeHolder: "¿De dónde importamos el chat?" },
    );
    if (!source) return;
    if (source.value === "codex") await importFromCodex();
    else if (source.value === "vscode") await importFromVSCode();
    else await importFromCursor();
  }

  async function saveInteractionManual() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.document.getText(editor.selection).trim() ?? "";

    const prompt = await vscode.window.showInputBox({
      prompt: "Prompt de la interacción",
      value: selection || undefined,
      placeHolder: "Pegá o editá el prompt usado",
      ignoreFocusOut: true,
    });
    if (prompt === undefined) return;
    if (!prompt.trim()) {
      void vscode.window.showErrorMessage("El prompt no puede estar vacío.");
      return;
    }

    const response = await vscode.window.showInputBox({
      prompt: "Respuesta de la IA",
      value: undefined,
      placeHolder: "Pegá la respuesta real",
      ignoreFocusOut: true,
    });
    if (response === undefined) return;

    const target = await pickProjectAndSession();
    if (!target) return;

    const { defaultTool } = config();
    const result = await postInteractions({
      source: "vscode-manual",
      tool: defaultTool,
      capturedAt: new Date().toISOString(),
      projectId: target.projectId,
      sessionId: target.sessionId,
      sessionTitle: target.sessionTitle,
      interaction: {
        prompt: prompt.trim(),
        response: (response || "").trim(),
      },
    }, target.apiUrl);

    await openResult(result);
  }
  return { importChat, importFromCodex, importFromVSCode, importFromCursor, saveInteractionManual };
}
