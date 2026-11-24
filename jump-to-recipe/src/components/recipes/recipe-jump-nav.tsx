interface RecipeJumpNavProps {
  sections: Array<{ id: string; name: string; order: number }>;
}

/** Anchor id for the nth (1-based) method section, shared with the method list */
export function getMethodSectionId(sectionNumber: number) {
  return `method-section-${sectionNumber}`;
}

/** Numbered chips that jump to each method section. Hidden for single-section recipes. */
export function RecipeJumpNav({ sections }: RecipeJumpNavProps) {
  if (sections.length < 2) return null;

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <nav
      aria-label="Recipe sections"
      className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 print:hidden"
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Jump to
      </span>
      {sortedSections.map((section, index) => (
        <a
          key={section.id}
          href={`#${getMethodSectionId(index + 1)}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border bg-background px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs text-background"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          {section.name}
        </a>
      ))}
    </nav>
  );
}
