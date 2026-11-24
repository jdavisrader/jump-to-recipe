"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddToCookbookButton } from "./add-to-cookbook-button";

interface RecipeActionsProps {
  recipeId: string;
  canEdit: boolean;
  onEdit?: () => void;
}

const touchTarget = "min-h-[44px] touch-manipulation";

export function RecipeActions({ recipeId, canEdit, onEdit }: RecipeActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <AddToCookbookButton recipeId={recipeId} />

      {canEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className={touchTarget}>
          <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
          Edit
        </Button>
      )}
    </div>
  );
}
