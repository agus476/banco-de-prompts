import Link from "next/link";
import { ToolMark } from "@/components/brand/ToolMark";
import { Card } from "@/components/ui/Card";
import { Badge, ButtonLink } from "@/components/ui/Form";
import { projectStatusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/dates";

type ProjectListItem = {
  id: string;
  title: string;
  status: string;
  date: Date | null;
  subject: { name: string };
  _count: { sessions: number };
  sessions: { tool: string; _count: { interactions: number } }[];
};

export function ProjectCard({
  project,
  showExport = false,
}: {
  project: ProjectListItem;
  showExport?: boolean;
}) {
  const interactions = project.sessions.reduce(
    (sum, session) => sum + session._count.interactions,
    0,
  );
  const tools = [...new Set(project.sessions.map((session) => session.tool))];

  return (
    <Card className="p-4 transition-colors duration-[180ms] hover:bg-surface-hover">
      <Link href={`/proyectos/${project.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.12em] text-text-secondary uppercase">
              {project.subject.name}
            </p>
            <h2 className="mt-1 text-[15px] font-medium text-text-primary">{project.title}</h2>
          </div>
          <Badge tone={project.status === "COMPLETED" ? "accent" : "default"}>
            {projectStatusLabel(project.status)}
          </Badge>
        </div>
        <p className="mt-3 text-[13px] text-text-secondary">
          {project._count.sessions} sesión{project._count.sessions === 1 ? "" : "es"} · {interactions}{" "}
          prompt{interactions === 1 ? "" : "s"}
          {project.date ? ` · ${formatDate(project.date)}` : ""}
        </p>
        {tools.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {tools.map((tool) => (
              <span key={tool} className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary">
                <ToolMark tool={tool} />
                {tool}
              </span>
            ))}
          </div>
        ) : null}
      </Link>
      {showExport ? (
        <div className="mt-4 border-t border-border pt-4">
          <ButtonLink href={`/proyectos/${project.id}/bitacora`} variant="secondary">
            Preparar entrega
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}
