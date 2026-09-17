"use client";

import { useActionState } from "react";
import { Button, FieldError, Input } from "@/components/ui/Form";
import type { FormAction } from "@/lib/action-types";

export function SubjectCreateForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg bg-surface p-3 sm:flex-row sm:items-center">
      <FieldError message={state?.error} />
      <Input name="name" placeholder="Nueva materia" required className="sm:flex-1" />
      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear"}
      </Button>
    </form>
  );
}
