"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="mt-2 w-full rounded-md px-2.5 py-1.5 text-left text-[12px] text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-fg"
    >
      Cerrar sesión
    </button>
  );
}
