import type { ReactNode } from "react";

import { RecipeHeroImage } from "./recipe-hero-image";
import { RecipeAuthorLine } from "./recipe-author-line";
import type { Recipe } from "@/types/recipe";

interface RecipeHeroProps {
  recipe: Pick<
    Recipe,
    "title" | "description" | "authorName" | "updatedAt" | "sourceUrl" | "tags" | "imageUrl"
  >;
  canEdit: boolean;
  onEdit?: () => void;
  /** Stats and actions, shown under the description */
  children?: ReactNode;
}

/** Full-width photo on top, then the recipe's details centered beneath it */
export function RecipeHero({ recipe, canEdit, onEdit, children }: RecipeHeroProps) {
  return (
    <section className="flex flex-col items-center gap-8">
      <div className="w-full print:hidden">
        <RecipeHeroImage
          imageUrl={recipe.imageUrl}
          title={recipe.title}
          canEdit={canEdit}
          onEdit={onEdit}
        />
      </div>

      <div className="flex w-full max-w-3xl flex-col items-center gap-5 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {recipe.title}
        </h1>

        <RecipeAuthorLine
          authorName={recipe.authorName}
          updatedAt={recipe.updatedAt}
          sourceUrl={recipe.sourceUrl}
        />

        {recipe.tags.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Tags">
            {recipe.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {recipe.description && (
          <p className="max-w-prose whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
            {recipe.description}
          </p>
        )}

        {children && <div className="flex w-full flex-col gap-5">{children}</div>}
      </div>
    </section>
  );
}
