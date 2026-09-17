"use client";

import { useMemo, useState } from "react";
import { addPromptToSession } from "@/actions/prompts";
import { Button, Select } from "@/components/ui/Form";

type ProjectOption = {
  id: string;
  title: string;
  sessions: { id: string; title: string }[];
};

export function AddToProject({
  promptId,
  projects,
}: {
  promptId: string;
  projects: ProjectOption[];
}) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const sessions = useMemo(
    () => projects.find((project) => project.id === projectId)?.sessions ?? [],
    [projectId, projects],
  );
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");

  if (projects.length === 0) return null;

  if (!open) {
    return (
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        Agregar a proyecto
      </Button>
    );
  }

  return (
    <form
      action={addPromptToSession.bind(null, promptId)}
      className="w-full rounded-md border border-border bg-surface-hover/50 p-3"
    >
      <p className="text-[12px] font-medium text-text-primary">Usar en una sesión</p>
      <div className="mt-2 space-y-2">
        <Select
          aria-label="Proyecto"
          value={projectId}
          onChange={(event) => {
            const next = event.target.value;
            setProjectId(next);
            const first = projects.find((project) => project.id === next)?.sessions[0]?.id ?? "";
            setSessionId(first);
          }}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </Select>
        <Select
          name="sessionId"
          aria-label="Sesión"
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          required
        >
          {sessions.length === 0 ? (
            <option value="">Este proyecto no tiene sesiones</option>
          ) : (
            sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title}
              </option>
            ))
          )}
        </Select>
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="submit" disabled={!sessionId}>
          Agregar
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
