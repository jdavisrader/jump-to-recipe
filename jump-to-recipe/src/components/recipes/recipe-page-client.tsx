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

  // Check if the current user can edit the recipe
  // Admins can edit any recipe, owners can edit their own recipes
  const isOwner = session?.user?.id === recipe.authorId;
  const isAdmin = session?.user?.role === 'admin';
  const canEdit = isOwner || isAdmin;

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