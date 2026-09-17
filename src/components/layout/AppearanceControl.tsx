"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener("storage", onStoreChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStoreChange);
  };
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export function AppearanceControl() {
  const dark = useSyncExternalStore(subscribe, isDark, () => true);

  function setDarkMode(next: boolean) {
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // The appearance still changes when browser storage is unavailable.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-sidebar-fg">
        {dark ? <Moon className="h-4 w-4 text-sidebar-muted" aria-hidden /> : <Sun className="h-4 w-4 text-sidebar-muted" aria-hidden />}
        <span>{dark ? "Modo oscuro" : "Modo claro"}</span>
      </div>
      <Toggle
        checked={dark}
        onChange={setDarkMode}
        label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      />
    </div>
  );
}
