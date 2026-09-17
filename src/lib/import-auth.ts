import { timingSafeEqual } from "node:crypto";

function matchesToken(candidate: string | null, expected: string): boolean {
  if (!candidate) return false;

  const actualBytes = Buffer.from(candidate.trim());
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length
    && timingSafeEqual(actualBytes, expectedBytes);
}

/** Shared by the proxy and handler so the API never relies on browser sessions. */
export function authorizeImportRequest(
  request: Pick<Request, "headers">,
  configuredToken = process.env.IMPORT_TOKEN,
): Response | null {
  const expected = configuredToken?.trim();
  const responseHeaders = { "Cache-Control": "no-store" };

  if (!expected) {
    return Response.json(
      { error: "La importación no está configurada. Definí IMPORT_TOKEN en el servidor." },
      { status: 503, headers: responseHeaders },
    );
  }

  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  if (
    matchesToken(request.headers.get("x-import-token"), expected)
    || matchesToken(bearer, expected)
  ) {
    return null;
  }

  return Response.json(
    { error: "Token de importación faltante o inválido." },
    { status: 401, headers: responseHeaders },
  );
}
