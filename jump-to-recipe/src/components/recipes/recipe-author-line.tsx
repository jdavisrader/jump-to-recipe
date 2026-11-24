import { ExternalLink } from "lucide-react";

interface RecipeAuthorLineProps {
  authorName?: string;
  updatedAt: Date | string;
  sourceUrl?: string | null;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

// Fixed time zone so the server and browser render the same date
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function RecipeAuthorLine({ authorName, updatedAt, sourceUrl }: RecipeAuthorLineProps) {
  const updatedLabel = `Updated ${dateFormatter.format(new Date(updatedAt))}`;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      {authorName && (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground"
          aria-hidden="true"
        >
          {getInitials(authorName)}
        </span>
      )}
      <span>
        {authorName && (
          <>
            By <strong className="font-semibold text-foreground">{authorName}</strong> ·{" "}
          </>
        )}
        {updatedLabel}
      </span>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-primary hover:underline print:hidden"
        >
          Source
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
