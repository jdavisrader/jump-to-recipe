import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormPanelProps {
  title: string;
  description?: ReactNode;
  /** Right side of the header: a running total, a mode switch... */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

// One bordered panel per form section, with a plain h2 heading
export function FormPanel({ title, description, aside, className, children }: FormPanelProps) {
  const headingId = `form-panel-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("rounded-xl border bg-card p-5 text-card-foreground sm:p-6", className)}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id={headingId} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
