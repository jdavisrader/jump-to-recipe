"use client";

import { Pencil, Printer, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AddToCookbookButton } from "./add-to-cookbook-button";

interface RecipeActionsProps {
  recipeId: string;
  canEdit: boolean;
  onEdit?: () => void;
}

const touchTarget = "min-h-[44px] touch-manipulation";

export function RecipeActions({ recipeId, canEdit, onEdit }: RecipeActionsProps) {
  const { toast } = useToast();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", description: "Paste it anywhere to share this recipe." });
    } catch {
      toast({
        title: "Couldn't copy the link",
        description: "Copy it from your browser's address bar instead.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {canEdit && (
        <Button onClick={onEdit} className={touchTarget}>
          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
          Edit recipe
        </Button>
      )}

      <AddToCookbookButton recipeId={recipeId} size="default" />

      <Button variant="outline" onClick={copyLink} className={touchTarget}>
        <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Share
      </Button>

      <Button variant="outline" onClick={() => window.print()} className={touchTarget}>
        <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
        Print
      </Button>
    </div>
  );
}
