'use client';

import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DropResult
} from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecipeCard } from '@/components/recipes';
import { Loader2, Save, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Recipe } from '@/types/recipe';

interface CookbookRecipeOrganizerProps {
  cookbookId: string;
  recipes: {
    recipe: Recipe;
    position: number;
  }[];
  onSave?: () => void;
}

export function CookbookRecipeOrganizer({
  cookbookId,
  recipes: initialRecipes,
  onSave
}: CookbookRecipeOrganizerProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Sort recipes by position initially
  useEffect(() => {
    setRecipes([...initialRecipes].sort((a, b) => a.position - b.position));
  }, [initialRecipes]);

  const handleDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = Array.from(recipes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));

    setRecipes(updatedItems);
  };

  const handleRemoveRecipe = (recipeId: string) => {
    const updatedRecipes = recipes.filter(item => item.recipe.id !== recipeId);

    // Update positions after removal
    const reindexedRecipes = updatedRecipes.map((item, index) => ({
      ...item,
      position: index
    }));

    setRecipes(reindexedRecipes);
  };

  const handleSaveOrder = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipes: recipes.map(item => ({
            recipeId: item.recipe.id,
            position: item.position,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update recipe order');
      }

      toast({
        title: 'Recipe order updated',
        description: 'Your cookbook recipe order has been saved',
      });

      if (onSave) {
        onSave();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update recipe order',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Organize Recipes</h2>
        <Button
          onClick={handleSaveOrder}
          disabled={isSubmitting || recipes.length === 0}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Order
        </Button>
      </div>

      {recipes.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No recipes in this cookbook</p>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="recipes">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {recipes.map((item, index) => (
                  <Draggable
                    key={item.recipe.id}
                    draggableId={item.recipe.id}
                    index={index}
                  >
                    {(provided: DraggableProvided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-card border rounded-md overflow-hidden"
                      >
                        <div className="flex items-center">
                          <div
                            {...provided.dragHandleProps}
                            className="p-4 flex items-center justify-center bg-muted"
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="flex-1 p-2">
                            <RecipeCard
                              recipe={item.recipe}
                              compact
                            />
                          </div>

                          <div className="p-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRecipe(item.recipe.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}