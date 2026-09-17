"use client";

import { useActionState, useState } from "react";
import { saveInteractionToLibrary } from "@/actions/interactions";
import { Button, FieldError, Input, Label, Select } from "@/components/ui/Form";

export function SaveToLibraryForm({
  projectId,
  sessionId,
  interactionId,
  defaultTitle,
  categories,
}: {
  projectId: string;
  sessionId: string;
  interactionId: string;
  defaultTitle: string;
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const action = saveInteractionToLibrary.bind(null, projectId, sessionId, interactionId);
  const [state, formAction, pending] = useActionState(action, null);

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Guardar también en biblioteca
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3 rounded-lg bg-surface-hover p-4">
      <p className="text-sm font-medium text-foreground">Guardar este prompt en la biblioteca</p>
      <FieldError message={state?.error} />
      <div>
        <Label htmlFor={`title-${interactionId}`}>Título</Label>
        <Input id={`title-${interactionId}`} name="title" defaultValue={defaultTitle} required />
      </div>
      <div>
        <Label htmlFor={`category-${interactionId}`}>Categoría</Label>
        <Select
          id={`category-${interactionId}`}
          name="categoryId"
          defaultValue={categories[0]?.id}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor={`tags-${interactionId}`}>Tags</Label>
        <Input id={`tags-${interactionId}`} name="tags" placeholder="opcional, separado por comas" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
