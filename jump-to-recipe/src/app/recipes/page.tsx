import Link from 'next/link';
import { db } from '@/db';
import { recipes } from '@/db/schema';
import { RecipeCard } from '@/components/recipes';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { eq } from 'drizzle-orm';

export default async function RecipesPage() {
  // Fetch all public recipes from the database
  const allRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.visibility, 'public'))
    .orderBy(recipes.createdAt);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Recipe Collection</h1>
          <p className="text-muted-foreground">
            Discover delicious recipes from our community
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/recipes/new">
              <Plus className="h-5 w-5 mr-2" />
              Create Recipe
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/recipes/import">
              <Upload className="h-5 w-5 mr-2" />
              Import Recipe
            </Link>
          </Button>
        </div>
      </div>

      {allRecipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No recipes found. Try seeding the database first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={{
                ...recipe,
                ingredients: recipe.ingredients as any[],
                instructions: recipe.instructions as any[],
                tags: recipe.tags || [],
                createdAt: recipe.createdAt!,
                updatedAt: recipe.updatedAt!,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}