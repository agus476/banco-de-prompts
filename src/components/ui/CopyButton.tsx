"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/Form";
import { IconButton } from "@/components/ui/IconButton";

export function CopyButton({
  text,
  label = "Copiar",
  className,
  compact = false,
  variant = "secondary",
}: {
  text: string;
  label?: string;
  className?: string;
  compact?: boolean;
  variant?: "primary" | "secondary";
}) {
  const [copied, setCopied] = useState(false);

  async function copy(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  if (compact) {
    return (
      <IconButton
        onClick={copy}
        aria-label={copied ? "Copiado" : "Copiar prompt"}
        className={cn("h-7 w-auto gap-1 rounded-full px-2 text-[11px]", className)}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
      </IconButton>
    );
  }

  return (
    <button type="button" onClick={copy} className={cn(buttonClass(variant), className)}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span aria-live="polite">{copied ? "Copiado" : label}</span>
    </button>
  );
}
