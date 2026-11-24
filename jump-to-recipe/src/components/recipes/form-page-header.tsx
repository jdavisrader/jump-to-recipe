import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface FormPageHeaderProps {
  backHref: string;
  backLabel: string;
  title: string;
  /** Extra line under the title: the intro, or the edit status badge */
  children?: ReactNode;
}

export function FormPageHeader({ backHref, backLabel, title, children }: FormPageHeaderProps) {
  return (
    <header className="mb-8 space-y-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {children}
    </header>
  );
}

interface RecipeStatusBadgeProps {
  visibility: "public" | "private";
  updatedAt?: Date | string | null;
}

function formatSavedDate(updatedAt: Date | string) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function RecipeStatusBadge({ visibility, updatedAt }: RecipeStatusBadgeProps) {
  const savedDate = updatedAt ? formatSavedDate(updatedAt) : null;

  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm">
        <span
          className={visibility === "public" ? "h-2 w-2 rounded-full bg-primary" : "h-2 w-2 rounded-full bg-muted-foreground"}
          aria-hidden="true"
        />
        <span className="font-medium">{visibility === "public" ? "Public" : "Private"}</span>
        {savedDate && <span className="text-muted-foreground">· last saved {savedDate}</span>}
      </p>
      <p className="text-sm text-muted-foreground">Changes go live when you save.</p>
    </div>
  );
}
