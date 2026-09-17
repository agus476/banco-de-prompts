import { FileDown, FileText, Printer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink, buttonClass } from "@/components/ui/Form";

export function ExportPanel({ projectId }: { projectId: string }) {
  return (
    <Card padded className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[15px] font-medium text-text-primary">Preparar entrega</h2>
          <p className="mt-1 max-w-xl text-[13px] leading-6 text-text-secondary">
            La vista de entrega arma un documento académico con lo que registraste.
            Desde ahí podés guardarlo como PDF con Imprimir del navegador, o bajar
            Markdown / texto para adjuntarlo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/proyectos/${projectId}/bitacora`}>
            <Printer className="h-4 w-4" />
            Vista para PDF
          </ButtonLink>
          <a
            href={`/proyectos/${projectId}/exportar?format=md`}
            className={buttonClass("secondary")}
          >
            <FileDown className="h-4 w-4" />
            Markdown
          </a>
          <a
            href={`/proyectos/${projectId}/exportar?format=txt`}
            className={buttonClass("secondary")}
          >
            <FileText className="h-4 w-4" />
            Texto
          </a>
        </div>
      </div>
    </Card>
  );
}
