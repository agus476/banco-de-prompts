import * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { resultUrl } from "./api";
import { BancoSettings } from "./settings";
import { renderSidebar } from "./sidebar-html";

export type RecentImport = { source: string; count: number; at: string; url: string; apiUrl: string };
export type ConnectionStatus = "idle" | "checking" | "connected" | "error";
const HISTORY_KEY = "banco.recentImports";
const ALLOWED_COMMANDS = new Set([
  "banco.importChat", "banco.importFromCodex", "banco.importFromVSCode", "banco.importFromCursor",
  "banco.saveInteraction", "banco.openApp", "banco.openSettings", "banco.checkConnection",
  "banco.configureToken", "banco.clearHistory",
]);

export class BancoSidebar implements vscode.WebviewViewProvider, vscode.Disposable {
  private view?: vscode.WebviewView;
  private listener?: vscode.Disposable;
  private status: ConnectionStatus = "idle";
  private detail = "Conectá tu espacio para empezar.";
  private busy = false;

  constructor(private readonly context: vscode.ExtensionContext, private readonly settings: BancoSettings) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    const media = vscode.Uri.joinPath(this.context.extensionUri, "media");
    view.webview.options = { enableScripts: true, localResourceRoots: [media] };
    this.listener?.dispose();
    this.listener = view.webview.onDidReceiveMessage(async (message: unknown) => {
      if (!message || typeof message !== "object") return;
      const data = message as Record<string, unknown>;
      if (data.type === "ready") { await this.sendState(); return; }
      if (data.type === "command" && typeof data.command === "string" && ALLOWED_COMMANDS.has(data.command)) {
        await vscode.commands.executeCommand(data.command);
      }
      if (data.type === "recent" && Number.isInteger(data.index)) {
        const item = this.history()[data.index as number];
        if (!item) return;
        try { await vscode.env.openExternal(vscode.Uri.parse(resultUrl(item.apiUrl, item.url))); }
        catch { void vscode.window.showErrorMessage("No se pudo abrir esta sesión."); }
      }
    });
    const css = view.webview.asWebviewUri(vscode.Uri.joinPath(media, "sidebar.css")).toString();
    const js = view.webview.asWebviewUri(vscode.Uri.joinPath(media, "sidebar.js")).toString();
    view.webview.html = renderSidebar({ css, js, cspSource: view.webview.cspSource, nonce: randomBytes(24).toString("hex") });
  }

  private history(): RecentImport[] { return this.context.globalState.get<RecentImport[]>(HISTORY_KEY, []); }

  private async sendState(): Promise<void> {
    let apiUrl = "Revisá la URL en Configuración";
    let hasToken = false;
    try { const settings = await this.settings.read(); apiUrl = settings.apiUrl; hasToken = Boolean(settings.importToken); }
    catch { /* Invalid settings must not prevent the setup panel from rendering. */ }
    await this.view?.webview.postMessage({ type: "state", status: this.status, detail: this.detail, busy: this.busy, apiUrl, hasToken, history: this.history() });
  }

  setConnection(status: ConnectionStatus, detail: string): void {
    this.status = status;
    this.detail = detail;
    void this.sendState();
  }

  resetConnection(): void { this.setConnection("idle", "Comprobá la conexión con tu app."); }
  setBusy(value: boolean): void { this.busy = value; void this.sendState(); }

  async recordImport(item: RecentImport): Promise<void> {
    await this.context.globalState.update(HISTORY_KEY, [item, ...this.history()].slice(0, 8));
    this.setConnection("connected", "Tu bitácora está al día.");
  }

  async clearHistory(): Promise<void> {
    await this.context.globalState.update(HISTORY_KEY, []);
    await this.sendState();
    void vscode.window.showInformationMessage("Historial local limpiado. Tus bitácoras siguen en la app.");
  }

  dispose(): void { this.listener?.dispose(); }
}
