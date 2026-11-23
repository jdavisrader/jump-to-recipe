"use client";

import { ExternalLink, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddToCookbookButton } from "./add-to-cookbook-button";

interface RecipeActionsProps {
  recipeId: string;
  canEdit: boolean;
  onEdit?: () => void;
  sourceUrl?: string | null;
}

const touchTarget = "min-h-[44px] touch-manipulation";

export function RecipeActions({ recipeId, canEdit, onEdit, sourceUrl }: RecipeActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <AddToCookbookButton recipeId={recipeId} />

      {canEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className={touchTarget}>
          <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
          Edit
        </Button>
      )}

      {sourceUrl && (
        <Button variant="ghost" size="sm" asChild className={touchTarget}>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            Source
            <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      )}
    </div>
  );
}
