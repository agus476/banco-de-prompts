export default function NotFound() {
  return (
    <div className="rounded-lg bg-surface px-6 py-16 text-center">
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">No encontrado</h1>
      <p className="mt-2 text-[13px] text-text-secondary">
        Ese recurso no existe o fue eliminado.
      </p>
    </div>
  );
}
