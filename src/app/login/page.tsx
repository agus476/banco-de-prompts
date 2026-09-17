"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: loginError } = await createClient().auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError("El email o la contraseña no son correctos.");
      setLoading(false);
      return;
    }

    router.push("/biblioteca");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">Banco de prompts</p>
          <h1 className="mt-2 text-2xl font-semibold">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esta aplicación es privada.</p>
        </div>
        <label className="block text-sm">
          Email
          <input className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          Contraseña
          <input className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-foreground px-4 py-2 text-background disabled:opacity-60">
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
