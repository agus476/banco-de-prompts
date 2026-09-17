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

type ProjectOption = {
  id: string;
  title: string;
  subject: { name: string };
  sessions: { id: string; title: string; tool: string }[];
};

function config() {
  const cfg = vscode.workspace.getConfiguration("banco");
  return {
    apiUrl: (cfg.get<string>("apiUrl") || "http://localhost:3000").replace(/\/$/, ""),
    importToken: cfg.get<string>("importToken") || "",
    defaultProjectId: cfg.get<string>("defaultProjectId") || "",
    defaultTool: cfg.get<string>("defaultTool") || "Codex",
  };
}

function authHeaders(): Record<string, string> {
  const { importToken } = config();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (importToken) headers["x-import-token"] = importToken;
  return headers;
}

async function fetchProjects(): Promise<ProjectOption[]> {
  const { apiUrl } = config();
  const response = await fetch(`${apiUrl}/api/import`, { headers: authHeaders() });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`No pude listar proyectos (${response.status}): ${text}`);
  }
  const data = (await response.json()) as { projects: ProjectOption[] };
  return data.projects ?? [];
}

async function pickProjectAndSession(sessionHint?: string): Promise<{
  projectId?: string;
  sessionId?: string;
  sessionTitle?: string;
} | undefined> {
  const { defaultProjectId } = config();
  const projects = await fetchProjects();
  if (projects.length === 0) {
    void vscode.window.showErrorMessage(
      "No hay proyectos en Banco de prompts. Creá uno en la web primero.",
    );
    return undefined;
  }

  const projectItems = projects.map((project) => ({
    label: project.title,
    description: project.subject.name,
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
    projectId: pickedProject.project.id,
    sessionId: pickedSession.sessionId,
    sessionTitle: sessionTitle || undefined,
  };
}

async function postInteractions(body: Record<string, unknown>) {
  const { apiUrl } = config();
  const response = await fetch(`${apiUrl}/api/import`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    url?: string;
    createdCount?: number;
  };
  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }
  return data;
}

async function openResult(url?: string, createdCount?: number) {
  const open = "Abrir en la app";
  const choice = await vscode.window.showInformationMessage(
    `Guardado: ${createdCount ?? 1} interacción(es).`,
    open,
  );
  if (choice === open && url) {
    const { apiUrl } = config();
    await vscode.env.openExternal(vscode.Uri.parse(`${apiUrl}${url}`));
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
    interactions: selected.map((turn, index) => ({
      order: index + 1,
      prompt: turn.prompt,
      response: turn.response,
    })),
  });

  await openResult(result.url, result.createdCount);
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

  const clipboard = await vscode.env.clipboard.readText();
  const response = await vscode.window.showInputBox({
    prompt: "Respuesta de la IA",
    value: clipboard.trim() || undefined,
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
  });

  await openResult(result.url, result.createdCount);
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("banco.importChat", async () => {
      try {
        await importChat();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Banco: ${message}`);
      }
    }),
    vscode.commands.registerCommand("banco.importFromCodex", async () => {
      try {
        await importFromCodex();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Banco: ${message}`);
      }
    }),
    vscode.commands.registerCommand("banco.importFromVSCode", async () => {
      try {
        await importFromVSCode();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Banco: ${message}`);
      }
    }),
    vscode.commands.registerCommand("banco.importFromCursor", async () => {
      try {
        await importFromCursor();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Banco: ${message}`);
      }
    }),
    vscode.commands.registerCommand("banco.saveInteraction", async () => {
      try {
        await saveInteractionManual();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Banco: ${message}`);
      }
    }),
  );
}

export function deactivate() {}
