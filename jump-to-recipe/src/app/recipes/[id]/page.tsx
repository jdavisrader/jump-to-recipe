import { db } from '@/db';
import { recipes } from '@/db/schema';
import { RecipeDisplay } from '@/components/recipes';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Ingredient, Instruction } from '@/types/recipe';

interface RecipePageProps {
  params: {
    id: string;
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  // Fetch the specific recipe from the database
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, params.id))
    .limit(1);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <RecipeDisplay
        recipe={{
          ...recipe,
          ingredients: recipe.ingredients as Ingredient[],
          instructions: recipe.instructions as Instruction[],
          tags: recipe.tags || [],
          createdAt: recipe.createdAt!,
          updatedAt: recipe.updatedAt!,
        }}
      />
    </div>
  );
}