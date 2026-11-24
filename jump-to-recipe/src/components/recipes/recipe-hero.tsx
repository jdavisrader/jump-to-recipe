import type { ReactNode } from "react";

import { RecipeHeroImage } from "./recipe-hero-image";
import { RecipeDescription } from "./recipe-description";
import { RecipeAuthorLine } from "./recipe-author-line";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

interface RecipeHeroProps {
  recipe: Pick<
    Recipe,
    "title" | "description" | "authorName" | "updatedAt" | "sourceUrl" | "tags" | "imageUrl"
  >;
  canEdit: boolean;
  onEdit?: () => void;
  /** Stats and actions, shown under the tags */
  children?: ReactNode;
}

export function RecipeHero({ recipe, canEdit, onEdit, children }: RecipeHeroProps) {
  // Viewers who can't add a photo get the full width instead of an empty column
  const hasPhotoColumn = Boolean(recipe.imageUrl) || canEdit;

  return (
    <section
      className={cn("grid items-start gap-8 lg:gap-10", hasPhotoColumn && "lg:grid-cols-2")}
    >
      <div className="flex min-w-0 flex-col gap-5">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {recipe.title}
        </h1>

        {recipe.description && <RecipeDescription text={recipe.description} />}

        <RecipeAuthorLine
          authorName={recipe.authorName}
          updatedAt={recipe.updatedAt}
          sourceUrl={recipe.sourceUrl}
        />

        {recipe.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Tags">
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

        {children}
      </div>

      {hasPhotoColumn && (
        <div className="order-first min-w-0 lg:order-none">
          <RecipeHeroImage
            imageUrl={recipe.imageUrl}
            title={recipe.title}
            canEdit={canEdit}
            onEdit={onEdit}
          />
        </div>
      )}
    </section>
  );
}
