"use client";

import { useActionState } from "react";
import { PROJECT_STATUSES } from "@/lib/constants";
import { toDateInputValue } from "@/lib/dates";
import type { FormAction } from "@/lib/action-types";
import { Button, FieldError, Input, Label, Select, Textarea } from "@/components/ui/Form";
import type { ProjectWithSubject } from "@/lib/types";

type Props = {
  subjects: { id: string; name: string }[];
  project?: ProjectWithSubject;
  action: FormAction;
};

export function ProjectForm({ subjects, project, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-border bg-surface p-6">
      <FieldError message={state?.error} />

      <div>
        <Label htmlFor="title">Trabajo práctico</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={project?.title}
          placeholder="TPE 3 — Algoritmos de búsqueda"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="subjectId">Materia</Label>
          <Select id="subjectId" name="subjectId" defaultValue={project?.subjectId ?? subjects[0]?.id ?? ""}>
            <option value="">Elegir materia</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="newSubject">O crear materia</Label>
          <Input id="newSubject" name="newSubject" placeholder="Introducción a Inteligencia Artificial" />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" defaultValue={project?.description ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={toDateInputValue(project?.date)} />
        </div>
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select id="status" name="status" defaultValue={project?.status ?? "IN_PROGRESS"}>
            {PROJECT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="institution">Institución</Label>
          <Input id="institution" name="institution" defaultValue={project?.institution ?? ""} />
        </div>
        <div>
          <Label htmlFor="teacher">Docente</Label>
          <Input id="teacher" name="teacher" defaultValue={project?.teacher ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" defaultValue={project?.notes ?? ""} />
      </div>

      <div>
        <Label htmlFor="conclusions">Conclusiones del proceso</Label>
        <Textarea
          id="conclusions"
          name="conclusions"
          defaultValue={project?.conclusions ?? ""}
          placeholder="Cómo evolucionó la solución. Solo lo que realmente ocurrió."
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar proyecto"}
        </Button>
      </div>
    </form>
  );
}
