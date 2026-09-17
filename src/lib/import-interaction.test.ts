import { describe, expect, it } from "vitest";
import { parseImportPayload } from "@/lib/import-interaction";

describe("parseImportPayload", () => {
  it("acepta el formato corto interaction", () => {
    const payload = parseImportPayload({
      source: "vscode",
      tool: "Cursor",
      interaction: {
        prompt: "Explicá este error",
        response: "El fallo viene de X",
      },
    });

    expect(payload.tool).toBe("Cursor");
    expect(payload.interactions).toHaveLength(1);
    expect(payload.interactions?.[0]).toMatchObject({
      prompt: "Explicá este error",
      response: "El fallo viene de X",
    });
  });

  it("acepta varias interactions", () => {
    const payload = parseImportPayload({
      projectId: "proj_1",
      interactions: [
        { prompt: "uno", response: "a" },
        { order: 2, prompt: "dos", response: "b" },
      ],
    });

    expect(payload.interactions).toHaveLength(2);
    expect(payload.projectId).toBe("proj_1");
  });

  it("rechaza body sin prompt", () => {
    expect(() => parseImportPayload({ interaction: { response: "solo" } })).toThrow(
      /prompt/,
    );
  });
});
