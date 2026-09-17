import * as vscode from "vscode";
import { normalizeApiUrl, type ApiSettings } from "./api";

export class BancoSettings {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  get apiUrl(): string {
    const url = vscode.workspace.getConfiguration("banco").inspect<string>("apiUrl");
    return normalizeApiUrl(url?.globalValue || url?.defaultValue || "http://localhost:3000");
  }

  private get tokenKey(): string {
    return `banco.importToken:${this.apiUrl}`;
  }

  async read(): Promise<ApiSettings> {
    return { apiUrl: this.apiUrl, importToken: (await this.secrets.get(this.tokenKey)) || "" };
  }

  async migrateLegacyToken(): Promise<void> {
    const config = vscode.workspace.getConfiguration("banco");
    // Never accept a credential supplied by a repository's workspace settings.
    const legacy = config.inspect<string>("importToken")?.globalValue?.trim();
    if (!legacy) return;
    const key = this.tokenKey;
    if (!(await this.secrets.get(key))) await this.secrets.store(key, legacy);
    await config.update("importToken", undefined, vscode.ConfigurationTarget.Global);
  }

  async configureToken(): Promise<boolean> {
    const apiUrl = this.apiUrl;
    const key = this.tokenKey;
    const token = await vscode.window.showInputBox({
      title: "Conectar Banco de prompts",
      prompt: `Pegá el IMPORT_TOKEN de ${apiUrl}. Se guarda en el almacén seguro de VS Code.`,
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => value.trim() ? undefined : "El token no puede estar vacío.",
    });
    if (token === undefined) return false;
    await this.secrets.store(key, token.trim());
    return true;
  }

  async removeToken(): Promise<void> {
    await this.secrets.delete(this.tokenKey);
    void vscode.window.showInformationMessage("Se eliminó el token de esta conexión.");
  }
}
