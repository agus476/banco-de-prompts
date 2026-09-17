export type ProjectOption = {
  id: string;
  title: string;
  subject: { name: string } | null;
  sessions: { id: string; title: string; tool: string }[];
};

export type ImportResult = { ok: true; url: string; createdCount: number; apiUrl: string };
export type ApiSettings = { apiUrl: string; importToken: string };

/** Keep credentials on the configured origin; allow plain HTTP only on loopback. */
export function normalizeApiUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("La URL de la app no es válida. Revisá Banco: Abrir configuración.");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error("Usá HTTPS para la app, o HTTP con localhost para desarrollo local.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("La URL no debe incluir credenciales, parámetros ni fragmentos.");
  }
  return url.toString().replace(/\/+$/, "");
}

export function resultUrl(apiUrl: string, pathname: string): string {
  if (!/^\/proyectos\/[a-zA-Z0-9_-]+\/sesiones\/[a-zA-Z0-9_-]+$/.test(pathname)) {
    throw new Error("La app devolvió un enlace de sesión inválido.");
  }
  return `${normalizeApiUrl(apiUrl)}${pathname}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isProject(value: unknown): value is ProjectOption {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") return false;
  if (value.subject !== null && (!isRecord(value.subject) || typeof value.subject.name !== "string")) return false;
  return Array.isArray(value.sessions) && value.sessions.every((session: unknown) =>
    isRecord(session) && typeof session.id === "string" && typeof session.title === "string" && typeof session.tool === "string",
  );
}

export class BancoApi {
  constructor(private readonly settings: () => Promise<ApiSettings>) {}

  private async request(body?: Record<string, unknown>, expectedApiUrl?: string): Promise<{ data: Record<string, unknown>; apiUrl: string }> {
    const { apiUrl, importToken } = await this.settings();
    const base = normalizeApiUrl(apiUrl);
    if (expectedApiUrl && base !== normalizeApiUrl(expectedApiUrl)) {
      throw new Error("La URL cambió durante la importación. Volvé a elegir el proyecto en la nueva conexión.");
    }
    if (!importToken) throw new Error("Configurá el token de importación desde el panel de Banco de prompts.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`${base}/api/import`, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json", "x-import-token": importToken },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        redirect: "manual",
      });
      if (response.status === 401 || response.status === 403) {
        throw new Error("El token no coincide con IMPORT_TOKEN de la app. Volvé a configurarlo.");
      }
      if (response.status >= 300 && response.status < 400) {
        throw new Error("La app redirigió la conexión. Revisá la URL y la configuración de /api/import.");
      }
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("La URL no devolvió la API de Banco de prompts. Revisá que la app esté disponible.");
      }
      const data: unknown = await response.json();
      if (!isRecord(data)) throw new Error("La app devolvió una respuesta inválida.");
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error.slice(0, 300) : `La app respondió con un error (${response.status}).`);
      }
      return { data, apiUrl: base };
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error("La app tardó más de 15 segundos. Comprobá la conexión antes de volver a intentar; una importación podría haberse guardado.");
      }
      if (error instanceof TypeError) {
        throw new Error("No se pudo conectar con la app. Comprobá que esté iniciada y que la URL sea correcta.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchProjects(expectedApiUrl?: string): Promise<ProjectOption[]> {
    const { data } = await this.request(undefined, expectedApiUrl);
    if (!Array.isArray(data.projects) || !data.projects.every(isProject)) {
      throw new Error("La app devolvió una lista de proyectos inválida. Revisá su versión.");
    }
    return data.projects;
  }

  async postInteractions(body: Record<string, unknown>, expectedApiUrl?: string): Promise<ImportResult> {
    const { data, apiUrl } = await this.request(body, expectedApiUrl);
    if (data.ok !== true || typeof data.url !== "string" || !Number.isInteger(data.createdCount) || (data.createdCount as number) < 1) {
      throw new Error("La app no confirmó la importación. Revisá la bitácora antes de volver a intentar.");
    }
    // Validate the link without following a URL supplied by the server.
    resultUrl(apiUrl, data.url);
    return { ok: true, url: data.url, createdCount: data.createdCount as number, apiUrl };
  }
}
