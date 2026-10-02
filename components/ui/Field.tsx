"use client";

import clsx from "clsx";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const CONTROL =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 transition focus:border-indigo-400/60 focus:bg-white/[0.06] focus:outline-none disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={clsx("block space-y-1.5", className)}>
      {label ? (
        <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
          {required ? <span className="text-rose-400">*</span> : null}
        </span>
      ) : null}
      {children}
      {error ? (
        <span className="block text-xs text-rose-400">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(CONTROL, className)} />;
}

export function Textarea({ className, rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={rows} className={clsx(CONTROL, "resize-y", className)} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={clsx(CONTROL, "appearance-none bg-[#0b0f22] pr-8", className)}>
      {children}
    </select>
  );
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add a tag and press Enter",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-200"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== tag))}
            className="text-indigo-300/70 hover:text-white"
            aria-label={`Remove tag ${tag}`}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        placeholder={placeholder}
        className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== ",") return;
          event.preventDefault();
          const next = event.currentTarget.value.trim();
          if (!next || value.includes(next)) return;
          onChange([...value, next]);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={clsx("flex cursor-pointer items-center gap-2 text-sm text-slate-300", className)}>
      <input
        type="checkbox"
        {...props}
        className="size-4 rounded border-white/20 bg-white/5 text-indigo-500 accent-indigo-500"
      />
      {label}
    </label>
  );
}
