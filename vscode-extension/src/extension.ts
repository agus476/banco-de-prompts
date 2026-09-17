import * as vscode from "vscode";
import { BancoApi } from "./api";
import { createImportCommands } from "./commands";
import { BancoSettings } from "./settings";
import { BancoSidebar } from "./sidebar";

export async function activate(context: vscode.ExtensionContext) {
  const settings = new BancoSettings(context.secrets);
  const api = new BancoApi(() => settings.read());
  const sidebar = new BancoSidebar(context, settings);
  const imports = createImportCommands(api, settings, (item) => sidebar.recordImport(item));
  const checkConnection = async () => {
    sidebar.setConnection("checking", "Comprobando conexión…");
    try {
      const projects = await api.fetchProjects();
      sidebar.setConnection("connected", `${projects.length} ${projects.length === 1 ? "proyecto disponible" : "proyectos disponibles"}`);
    } catch (error) {
      sidebar.setConnection("error", error instanceof Error ? error.message : "No se pudo conectar.");
      throw error;
    }
  };
  let importing = false;
  const importCommand = (command: () => Promise<void>) => async () => {
    if (importing) {
      void vscode.window.showInformationMessage("Ya hay una importación en curso. Completala o cancelala antes de iniciar otra.");
      return;
    }
    importing = true;
    sidebar.setBusy(true);
    try { await command(); }
    finally { importing = false; sidebar.setBusy(false); }
  };
  const commands: Record<string, () => unknown> = {
    "banco.importChat": importCommand(imports.importChat),
    "banco.importFromCodex": importCommand(imports.importFromCodex),
    "banco.importFromVSCode": importCommand(imports.importFromVSCode),
    "banco.importFromCursor": importCommand(imports.importFromCursor),
    "banco.saveInteraction": importCommand(imports.saveInteractionManual),
    "banco.openApp": () => vscode.env.openExternal(vscode.Uri.parse(settings.apiUrl + "/biblioteca")),
    "banco.openSettings": () => vscode.commands.executeCommand("workbench.action.openSettings", "@ext:" + context.extension.id),
    "banco.checkConnection": checkConnection,
    "banco.configureToken": async () => { if (await settings.configureToken()) await checkConnection(); },
    "banco.removeToken": async () => { await settings.removeToken(); sidebar.resetConnection(); },
    "banco.clearHistory": () => sidebar.clearHistory(),
  };
  for (const [id, handler] of Object.entries(commands)) {
    context.subscriptions.push(vscode.commands.registerCommand(id, async () => {
      try { await handler(); }
      catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo completar la acción.";
        void vscode.window.showErrorMessage("Banco: " + message, "Abrir configuración").then((choice) => {
          if (choice) void vscode.commands.executeCommand("banco.openSettings");
        });
      }
    }));
  }
  context.subscriptions.push(
    sidebar,
    vscode.window.registerWebviewViewProvider("banco.home", sidebar),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("banco")) sidebar.resetConnection();
    }),
  );
  try { await settings.migrateLegacyToken(); }
  catch {
    void vscode.window.showWarningMessage("Banco: no se pudo migrar el token anterior. Revisá la URL y usá Configurar token.");
  }
}
