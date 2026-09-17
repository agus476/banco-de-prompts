import { afterEach, describe, expect, it, vi } from "vitest";
import { authorizeImportRequest } from "@/lib/import-auth";

const token = "test-import-token-123";

function request(headers: HeadersInit = {}) {
  return new Request("http://localhost:3000/api/import", { headers });
}

afterEach(() => vi.unstubAllEnvs());

describe("authorizeImportRequest", () => {
  it.each([undefined, "", "   "])("requires server configuration even on localhost (%s)", async (value) => {
    vi.stubEnv("IMPORT_TOKEN", value);
    const response = authorizeImportRequest(request({ "x-import-token": token }));

    expect(response?.status).toBe(503);
    expect(response?.headers.get("content-type")).toContain("application/json");
    expect(response?.headers.get("cache-control")).toBe("no-store");
    expect(await response?.json()).toEqual({
      error: expect.stringContaining("IMPORT_TOKEN"),
    });
  });

  it.each<Record<string, string>>([
    {},
    { "x-import-token": "wrong-token" },
    { authorization: "Bearer wrong-token" },
    { authorization: `Basic ${token}` },
    { authorization: "Bearer" },
    { "x-import-token": "é".repeat(token.length) },
  ])("rejects missing or invalid credentials without redirects (%j)", async (headers) => {
    const response = authorizeImportRequest(request(headers), token);

    expect(response?.status).toBe(401);
    expect(response?.headers.get("location")).toBeNull();
    expect(await response?.json()).toEqual({
      error: "Token de importación faltante o inválido.",
    });
  });

  it.each<Record<string, string>>([
    { "x-import-token": token },
    { authorization: `Bearer ${token}` },
    { authorization: `bEaReR ${token}` },
    { "x-import-token": "incorrect", authorization: `Bearer ${token}` },
  ])("accepts either supported credential header (%j)", (headers) => {
    expect(authorizeImportRequest(request(headers), token)).toBeNull();
  });

  it("uses IMPORT_TOKEN and ignores surrounding whitespace in configuration", () => {
    vi.stubEnv("IMPORT_TOKEN", ` ${token} \n`);

    expect(authorizeImportRequest(request({ "x-import-token": token }))).toBeNull();
  });

  it("does not accept tokens from query strings or browser cookies", () => {
    const browserRequest = new Request(`https://example.com/api/import?token=${token}`, {
      headers: { cookie: `x-import-token=${token}` },
    });

    expect(authorizeImportRequest(browserRequest, token)?.status).toBe(401);
  });
});
