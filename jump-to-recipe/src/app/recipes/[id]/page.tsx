import { db } from '@/db';
import { recipes, users } from '@/db/schema';
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
  
  // Fetch the specific recipe from the database with author information
  const [recipeWithAuthor] = await db
    .select({
      recipe: recipes,
      authorName: users.name,
    })
    .from(recipes)
    .leftJoin(users, eq(recipes.authorId, users.id))
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipeWithAuthor) {
    notFound();
  }

  const { recipe, authorName } = recipeWithAuthor;

  const recipeData = {
    ...recipe,
    ingredients: recipe.ingredients as Ingredient[],
    instructions: recipe.instructions as Instruction[],
    ingredientSections: recipe.ingredientSections as Array<{
      id: string;
      name: string;
      order: number;
      items: Ingredient[];
    }> | undefined,
    instructionSections: recipe.instructionSections as Array<{
      id: string;
      name: string;
      order: number;
      items: Instruction[];
    }> | undefined,
    tags: recipe.tags || [],
    createdAt: recipe.createdAt!,
    updatedAt: recipe.updatedAt!,
    authorName: authorName || 'Unknown',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <RecipePageClient recipe={recipeData} />
    </div>
  );
}