import { db } from '@/db';
import { recipes } from '@/db/schema';
import { RecipePageClient } from '@/components/recipes/recipe-page-client';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Ingredient, Instruction } from '@/types/recipe';

interface RecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  
  // Fetch the specific recipe from the database
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipe) {
    notFound();
  }

  const recipeData = {
    ...recipe,
    ingredients: recipe.ingredients as Ingredient[],
    instructions: recipe.instructions as Instruction[],
    tags: recipe.tags || [],
    createdAt: recipe.createdAt!,
    updatedAt: recipe.updatedAt!,
  };

  return (
    <div className="container mx-auto py-8">
      <RecipePageClient recipe={recipeData} />
    </div>
  );
}