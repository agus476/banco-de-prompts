import Link from "next/link";
import { createSubject, deleteSubject } from "@/actions/prompts";
import { SubjectCreateForm } from "@/app/materias/SubjectCreateForm";
import { PageHeader } from "@/components/layout/AppShell";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { EmptyState } from "@/components/ui/Form";
import { listSubjects } from "@/lib/projects";

export default async function MateriasPage() {
  const subjects = await listSubjects();

  return (
    <>
      <PageHeader
        eyebrow="Bitácora"
        title="Materias"
        description="Cada materia agrupa los trabajos prácticos y sus bitácoras de IA."
      />
      <SubjectCreateForm action={createSubject} />
      {subjects.length === 0 ? (
        <EmptyState
          title="Todavía no hay materias"
          description="Creá una materia o hacelo al dar de alta un proyecto."
        />
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {subjects.map((subject) => (
            <li key={subject.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <Link
                  href={`/materias/${subject.slug}`}
                  className="font-medium text-text-primary hover:underline"
                >
                  {subject.name}
                </Link>
                <p className="text-[13px] text-text-secondary">
                  {subject._count.projects} proyecto{subject._count.projects === 1 ? "" : "s"}
                </p>
              </div>
              {subject._count.projects === 0 ? (
                <form action={deleteSubject.bind(null, subject.id)}>
                  <ConfirmSubmit
                    message="¿Eliminar esta materia?"
                    className="text-sm text-danger hover:underline"
                  >
                    Eliminar
                  </ConfirmSubmit>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
