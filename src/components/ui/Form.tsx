import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const fieldClass =
  "h-9 w-full rounded-md border border-transparent bg-surface-hover px-3 text-[13px] text-text-primary outline-none transition-colors duration-[180ms] placeholder:text-text-secondary focus:bg-surface";

export function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-medium text-text-secondary">
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClass, "h-auto min-h-28 resize-y py-2", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block w-full">
      <select className={cn(fieldClass, "appearance-none pr-8", className)} {...props} />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary"
        aria-hidden
      />
    </span>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger" role="alert">
      {message}
    </p>
  );
}

const variants = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "bg-surface-hover text-text-primary hover:bg-surface",
  ghost: "text-text-primary hover:bg-surface-hover",
  danger: "text-danger hover:bg-danger-soft",
};

export function buttonClass(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
) {
  return cn(
    "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors duration-[180ms] disabled:opacity-50",
    variants[variant],
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return <button className={cn(buttonClass(variant), className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonClass(variant), className)}>
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "muted";
}) {
  const tones = {
    default: "bg-surface-hover text-text-secondary",
    accent: "bg-accent-soft text-accent",
    muted: "bg-surface-hover text-text-secondary",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface px-6 py-12 text-center">
      <h2 className="text-[15px] font-medium text-text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-text-secondary">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
