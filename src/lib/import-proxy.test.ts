import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "../../proxy";

const { createServerClient, getUser } = vi.hoisted(() => {
  const getUser = vi.fn();
  return {
    getUser,
    createServerClient: vi.fn(() => ({ auth: { getUser } })),
  };
});

vi.mock("@supabase/ssr", () => ({ createServerClient }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("IMPORT_TOKEN", "test-import-token");
  getUser.mockResolvedValue({ data: { user: null } });
});

afterEach(() => vi.unstubAllEnvs());

describe("import API proxy", () => {
  it.each<Record<string, string>>([
    { "x-import-token": "test-import-token" },
    { authorization: "Bearer test-import-token" },
  ])("authenticates API clients before accessing Supabase (%j)", async (headers) => {
    const response = await proxy(new NextRequest("http://localhost:3000/api/import", { headers }));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("returns JSON to unauthenticated API clients instead of the login page", async () => {
    const response = await proxy(new NextRequest("https://example.com/api/import"));

    expect(response.status).toBe(401);
    expect(response.headers.get("location")).toBeNull();
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("fails closed when the import token is not configured", async () => {
    vi.stubEnv("IMPORT_TOKEN", undefined);
    const response = await proxy(new NextRequest("http://localhost:3000/api/import"));

    expect(response.status).toBe(503);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("preserves the login requirement for web pages even with an import token", async () => {
    const response = await proxy(new NextRequest("https://example.com/biblioteca", {
      headers: { "x-import-token": "test-import-token" },
    }));

    expect(response.headers.get("location")).toBe("https://example.com/login");
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("preserves the authenticated redirect away from login", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "test-user" } } });
    const response = await proxy(new NextRequest("https://example.com/login"));

    expect(response.headers.get("location")).toBe("https://example.com/biblioteca");
  });
});
