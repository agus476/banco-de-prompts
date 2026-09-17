"use client";

import { Printer } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Form";

export function ExportToolbar({
  projectId,
  markdown,
}: {
  projectId: string;
  markdown: string;
}) {
  return (
    <div className="no-print sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <ButtonLink href={`/proyectos/${projectId}`} variant="ghost">
          Volver al proyecto
        </ButtonLink>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </Button>
          <CopyButton text={markdown} label="Copiar Markdown" />
          <a
            href={`/proyectos/${projectId}/exportar?format=md`}
            className={buttonClass("secondary")}
          >
            Descargar .md
          </a>
          <a
            href={`/proyectos/${projectId}/exportar?format=txt`}
            className={buttonClass("secondary")}
          >
            Descargar .txt
          </a>
        </div>
      </div>
    </div>
  );
}
