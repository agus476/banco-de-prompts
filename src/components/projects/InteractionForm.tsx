"use client";

import { useActionState, useState } from "react";
import { OUTCOME_STATUSES } from "@/lib/constants";
import type { FormAction } from "@/lib/action-types";
import { Button, FieldError, Input, Label, Select, Textarea } from "@/components/ui/Form";

type InteractionValues = {
  prompt: string;
  response: string;
  notes: string | null;
  generatedCode: string | null;
  decision: string | null;
  outcome: string | null;
  outcomeStatus: string;
  affectedFiles: string | null;
  conceptsToStudy: string | null;
  libraryPromptId: string | null;
};

type Props = {
  libraryPrompts: { id: string; title: string; content: string }[];
  interaction?: InteractionValues;
  action: FormAction;
};

export function InteractionForm({ libraryPrompts, interaction, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [prompt, setPrompt] = useState(interaction?.prompt ?? "");
  const [libraryPromptId, setLibraryPromptId] = useState(interaction?.libraryPromptId ?? "");

  function applyLibraryPrompt(id: string) {
    setLibraryPromptId(id);
    const selected = libraryPrompts.find((item) => item.id === id);
    if (selected) setPrompt(selected.content);
  }

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-border bg-surface p-6">
      <FieldError message={state?.error} />
      <input type="hidden" name="libraryPromptId" value={libraryPromptId} />

      {libraryPrompts.length > 0 ? (
        <div>
          <Label htmlFor="fromLibrary">Insertar desde la biblioteca</Label>
          <Select
            id="fromLibrary"
            value={libraryPromptId}
            onChange={(event) => applyLibraryPrompt(event.target.value)}
          >
            <option value="">Escribir un prompt nuevo</option>
            {libraryPrompts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-[12px] text-text-secondary">
            Se copia el texto actual. Si después editás el prompt de la biblioteca, esta bitácora no cambia.
          </p>
        </div>
      ) : null}

      <div>
        <Label htmlFor="prompt">Prompt utilizado</Label>
        <Textarea
          id="prompt"
          name="prompt"
          required
          className="min-h-36 font-mono"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="response">Respuesta de la IA</Label>
        <Textarea
          id="response"
          name="response"
          className="min-h-36 font-mono"
          defaultValue={interaction?.response ?? ""}
          placeholder="Pegá la respuesta real. No se completa sola."
        />
      </div>

      <div>
        <Label htmlFor="outcome">Resultado</Label>
        <Textarea
          id="outcome"
          name="outcome"
          defaultValue={interaction?.outcome ?? ""}
          placeholder="Qué funcionó, qué falló, qué quedó a medias"
        />
      </div>

      <div>
        <Label htmlFor="decision">Decisión tomada</Label>
        <Textarea
          id="decision"
          name="decision"
          defaultValue={interaction?.decision ?? ""}
          placeholder="Qué cambiaste vos después de esa respuesta"
        />
      </div>

      <div>
        <Label htmlFor="generatedCode">Código generado</Label>
        <Textarea
          id="generatedCode"
          name="generatedCode"
          className="min-h-32 font-mono"
          defaultValue={interaction?.generatedCode ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="affectedFiles">Archivos afectados</Label>
          <Input
            id="affectedFiles"
            name="affectedFiles"
            defaultValue={interaction?.affectedFiles ?? ""}
            placeholder="bfs.py, graph.py"
          />
        </div>
        <div>
          <Label htmlFor="outcomeStatus">Estado de la solución</Label>
          <Select
            id="outcomeStatus"
            name="outcomeStatus"
            defaultValue={interaction?.outcomeStatus ?? "PENDING"}
          >
            {OUTCOME_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="conceptsToStudy">Conceptos que necesito estudiar</Label>
        <Input
          id="conceptsToStudy"
          name="conceptsToStudy"
          defaultValue={interaction?.conceptsToStudy ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" defaultValue={interaction?.notes ?? ""} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar iteración"}
        </Button>
      </div>
    </form>
  );
}
