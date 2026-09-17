"use client";

import { useActionState } from "react";
import { AI_TOOLS } from "@/lib/constants";
import type { FormAction } from "@/lib/action-types";
import type { PromptWithRelations } from "@/lib/types";
import { Button, FieldError, Input, Label, Select, Textarea } from "@/components/ui/Form";

type CategoryOption = { id: string; name: string };

type Props = {
  categories: CategoryOption[];
  prompt?: PromptWithRelations;
  action: FormAction;
};

export function PromptForm({ categories, prompt, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const tags = prompt?.tags.map((item) => item.tag.name).join(", ") ?? "";

  return (
    <form action={formAction} className="space-y-5">
      <FieldError message={state?.error} />

      <div>
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required defaultValue={prompt?.title} />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          defaultValue={prompt?.description ?? ""}
          placeholder="Para qué sirve este prompt"
        />
      </div>

      <div>
        <Label htmlFor="content">Prompt</Label>
        <Textarea
          id="content"
          name="content"
          required
          className="min-h-48 font-mono"
          defaultValue={prompt?.content}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Categoría</Label>
          <Select id="categoryId" name="categoryId" defaultValue={prompt?.categoryId ?? categories[0]?.id}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="newCategory">O crear categoría</Label>
          <Input id="newCategory" name="newCategory" placeholder="Nueva categoría" />
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={tags}
          placeholder="python, bfs, complejidad"
        />
        <p className="mt-1 text-[12px] text-text-secondary">Separalos con comas.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="tool">Herramienta habitual</Label>
          <Select id="tool" name="tool" defaultValue={prompt?.tool ?? ""}>
            <option value="">Sin especificar</option>
            {AI_TOOLS.map((tool) => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="recommendedModel">Modelo recomendado</Label>
          <Input
            id="recommendedModel"
            name="recommendedModel"
            defaultValue={prompt?.recommendedModel ?? ""}
            placeholder="GPT-4, Claude, etc."
          />
        </div>
        <div>
          <Label htmlFor="usageContext">Contexto de uso</Label>
          <Input
            id="usageContext"
            name="usageContext"
            defaultValue={prompt?.usageContext ?? ""}
            placeholder="Debugging de código Python"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-[13px] text-text-primary">
        <input
          type="checkbox"
          name="favorite"
          defaultChecked={prompt?.favorite}
          className="h-4 w-4 rounded-[5px] accent-[var(--accent)]"
        />
        Marcar como favorito
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar prompt"}
        </Button>
      </div>
    </form>
  );
}
