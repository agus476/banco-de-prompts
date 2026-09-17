import type { ReactNode } from "react";
import { formatDate } from "@/lib/dates";
import { outcomeStatusLabel } from "@/lib/constants";
import { collectTools, hasLogbookText } from "@/lib/export-logbook";
import type { LogbookProject } from "@/lib/types";

function Meta({ label, value }: { label: string; value?: string | null }) {
  if (!hasLogbookText(value)) return null;
  return (
    <p>
      <span className="font-semibold">{label}:</span> {value}
    </p>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <h4 className="text-sm font-semibold tracking-wide uppercase">{title}</h4>
      <div className="mt-1 whitespace-pre-wrap leading-7">{children}</div>
    </section>
  );
}

export function LogbookDocument({ project }: { project: LogbookProject }) {
  const tools = collectTools(project);

  return (
    <article className="logbook-sheet mx-auto max-w-3xl bg-white px-8 py-10 text-[#1c1917] sm:px-12 sm:py-14">
      <header className="border-b border-[#d6d3d1] pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#57534e]">
          Entrega académica
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight">
          Bitácora de uso de Inteligencia Artificial
        </h1>
      </header>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Trabajo</h2>
        <div className="mt-3 space-y-1 text-[15px] leading-7">
          <Meta label="Materia" value={project.subject.name} />
          <Meta label="Trabajo práctico" value={project.title} />
          {project.date ? <Meta label="Fecha" value={formatDate(project.date)} /> : null}
          <Meta label="Institución" value={project.institution} />
          <Meta label="Docente" value={project.teacher} />
        </div>
        {hasLogbookText(project.description) ? (
          <p className="mt-4 whitespace-pre-wrap leading-7">{project.description}</p>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Herramientas utilizadas</h2>
        {tools.length === 0 ? (
          <p className="mt-3 text-[15px] leading-7">No se registraron herramientas.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] leading-7">
            {tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        )}
      </section>

      {project.sessions.length === 0 ? (
        <p className="mt-8 text-[15px] leading-7">
          No se registraron sesiones de IA en este trabajo.
        </p>
      ) : null}

      {project.sessions.map((session, sessionIndex) => (
        <section key={session.id} className="mt-10 break-inside-avoid">
          <h2 className="font-serif text-xl">
            Sesión {sessionIndex + 1}: {session.title}
          </h2>
          <div className="mt-3 space-y-1 text-[15px] leading-7">
            <Meta label="Fecha" value={formatDate(session.date)} />
            <Meta label="Herramienta" value={session.tool} />
            <Meta label="Modelo" value={session.model} />
            {hasLogbookText(session.conversationUrl) ? (
              <p>
                <span className="font-semibold">URL de la conversación:</span>{" "}
                {session.conversationUrl}
              </p>
            ) : null}
          </div>
          {hasLogbookText(session.observations) ? (
            <p className="mt-3 whitespace-pre-wrap leading-7">{session.observations}</p>
          ) : null}

          {session.interactions.length === 0 ? (
            <p className="mt-4 text-[15px] leading-7">
              No se registraron interacciones en esta sesión.
            </p>
          ) : null}

          {session.interactions.map((interaction) => (
            <div key={interaction.id} className="mt-6 border-t border-[#e7e5e4] pt-4">
              <h3 className="font-serif text-lg">Prompt {interaction.order}</h3>
              <pre className="mt-2 font-mono text-[13px] leading-6">
                {interaction.prompt.trim() || "(Sin prompt registrado)"}
              </pre>

              <Block title="Respuesta">
                <pre className="font-mono text-[13px] leading-6">
                  {hasLogbookText(interaction.response)
                    ? interaction.response.trim()
                    : "(Sin respuesta registrada)"}
                </pre>
              </Block>

              {hasLogbookText(interaction.outcome) ? (
                <Block title="Resultado">{interaction.outcome.trim()}</Block>
              ) : null}
              {hasLogbookText(interaction.decision) ? (
                <Block title="Decisión tomada">{interaction.decision.trim()}</Block>
              ) : null}
              {hasLogbookText(interaction.generatedCode) ? (
                <Block title="Código generado">
                  <pre className="font-mono text-[13px] leading-6">
                    {interaction.generatedCode.trim()}
                  </pre>
                </Block>
              ) : null}
              {hasLogbookText(interaction.affectedFiles) ? (
                <p className="mt-3 text-[15px] leading-7">
                  <span className="font-semibold">Archivos afectados:</span>{" "}
                  {interaction.affectedFiles.trim()}
                </p>
              ) : null}
              {hasLogbookText(interaction.conceptsToStudy) ? (
                <p className="mt-2 text-[15px] leading-7">
                  <span className="font-semibold">Conceptos a estudiar:</span>{" "}
                  {interaction.conceptsToStudy.trim()}
                </p>
              ) : null}
              {hasLogbookText(interaction.notes) ? (
                <Block title="Notas">{interaction.notes.trim()}</Block>
              ) : null}
              {interaction.outcomeStatus && interaction.outcomeStatus !== "PENDING" ? (
                <p className="mt-3 text-[15px] leading-7">
                  <span className="font-semibold">Estado de la solución:</span>{" "}
                  {outcomeStatusLabel(interaction.outcomeStatus)}
                </p>
              ) : null}
            </div>
          ))}
        </section>
      ))}

      {hasLogbookText(project.notes) ? (
        <section className="mt-10">
          <h2 className="font-serif text-xl">Notas del proyecto</h2>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7">{project.notes.trim()}</p>
        </section>
      ) : null}

      {hasLogbookText(project.conclusions) ? (
        <section className="mt-10">
          <h2 className="font-serif text-xl">Conclusiones del proceso</h2>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7">
            {project.conclusions.trim()}
          </p>
        </section>
      ) : null}
    </article>
  );
}
