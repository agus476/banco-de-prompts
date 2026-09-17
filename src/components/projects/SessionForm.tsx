"use client";

import { useActionState } from "react";
import { AI_TOOLS } from "@/lib/constants";
import { toDateInputValue } from "@/lib/dates";
import type { FormAction } from "@/lib/action-types";
import { Button, FieldError, Input, Label, Select, Textarea } from "@/components/ui/Form";

type SessionValues = {
  title: string;
  tool: string;
  model: string | null;
  date: Date;
  conversationUrl: string | null;
  observations: string | null;
};

type Props = {
  session?: SessionValues;
  action: FormAction;
};

export function SessionForm({ session, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-border bg-surface p-6">
      <FieldError message={state?.error} />

      <div>
        <Label htmlFor="title">Título de la sesión</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={session?.title}
          placeholder="Implementación de BFS"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="tool">Herramienta</Label>
          <Select id="tool" name="tool" required defaultValue={session?.tool ?? "ChatGPT"}>
            {AI_TOOLS.map((tool) => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" defaultValue={session?.model ?? ""} placeholder="si se conoce" />
        </div>
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={toDateInputValue(session?.date ?? new Date())}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="conversationUrl">URL de la conversación</Label>
        <Input
          id="conversationUrl"
          name="conversationUrl"
          defaultValue={session?.conversationUrl ?? ""}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="observations">Observaciones</Label>
        <Textarea id="observations" name="observations" defaultValue={session?.observations ?? ""} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar sesión"}
        </Button>
      </div>
    </form>
  );
}
