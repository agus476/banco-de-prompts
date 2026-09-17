import { notFound } from "next/navigation";
import { ExportToolbar } from "@/components/projects/ExportToolbar";
import { LogbookDocument } from "@/components/projects/LogbookDocument";
import {
  logbookFilename,
  renderLogbookMarkdown,
} from "@/lib/export-logbook";
import { getProjectLogbook } from "@/lib/projects";

export default async function BitacoraEntregaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectLogbook(id);
  if (!project) notFound();

  const markdown = renderLogbookMarkdown(project);

  return (
    <div className="min-h-screen bg-background">
      <ExportToolbar projectId={id} markdown={markdown} />
      <div className="px-4 py-8">
        <p className="no-print mx-auto mb-6 max-w-3xl text-sm text-muted">
          Revisá el documento y usá <strong className="text-foreground">Imprimir / Guardar PDF</strong>.
          En el cuadro del navegador elegí “Guardar como PDF”. El archivo sugerido es{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
            {logbookFilename(project.title, "md").replace(/\.md$/, ".pdf")}
          </code>
          . Esta vista no agrega contenido que no hayas registrado.
        </p>
        <LogbookDocument project={project} />
      </div>
    </div>
  );
}
