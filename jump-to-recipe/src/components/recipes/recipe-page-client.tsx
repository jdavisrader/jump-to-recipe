"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RecipeDisplay } from "./recipe-display";
import type { Recipe } from "@/types/recipe";

interface RecipePageClientProps {
  recipe: Recipe;
}

export function RecipePageClient({ recipe }: RecipePageClientProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Check if the current user is the author of the recipe
  const canEdit = session?.user?.id === recipe.authorId;

  const handleEdit = () => {
    router.push(`/recipes/${recipe.id}/edit`);
  };

  return (
    <RecipeDisplay
      recipe={recipe}
      canEdit={canEdit}
      onEdit={handleEdit}
    />
  );
}