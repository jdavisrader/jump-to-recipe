import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { recipes } from '@/db/schema';

export interface RecipeShareData {
  title: string;
  description: string | null;
  imageUrl: string | null;
}

/**
 * Recipe details for link previews. Only public recipes expose their
 * title, description and photo; private or missing recipes return null
 * so previews fall back to a generic Happeacook card.
 */
export const getRecipeShareData = cache(
  async (recipeId: string): Promise<RecipeShareData | null> => {
    try {
      const [recipe] = await db
        .select({
          title: recipes.title,
          description: recipes.description,
          imageUrl: recipes.imageUrl,
          visibility: recipes.visibility,
        })
        .from(recipes)
        .where(eq(recipes.id, recipeId))
        .limit(1);

      if (!recipe || recipe.visibility !== 'public') return null;

      return {
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
      };
    } catch {
      // Malformed ids (not a uuid) make the query throw; treat as not found.
      return null;
    }
  }
);

export function truncateForPreview(text: string | null, maxLength = 200): string | null {
  if (!text) return null;
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength - 1).trimEnd()}…`;
}
