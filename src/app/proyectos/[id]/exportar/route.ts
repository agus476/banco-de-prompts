import { NextRequest } from "next/server";
import { getProjectLogbook } from "@/lib/projects";
import {
  logbookFilename,
  renderLogbookMarkdown,
  renderLogbookPlainText,
} from "@/lib/export-logbook";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await getProjectLogbook(id);
  if (!project) {
    return new Response("Proyecto no encontrado", { status: 404 });
  }

  const format = request.nextUrl.searchParams.get("format") === "txt" ? "txt" : "md";
  const body =
    format === "txt" ? renderLogbookPlainText(project) : renderLogbookMarkdown(project);
  const filename = logbookFilename(project.title, format);

  return new Response(body, {
    headers: {
      "Content-Type": format === "txt" ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
