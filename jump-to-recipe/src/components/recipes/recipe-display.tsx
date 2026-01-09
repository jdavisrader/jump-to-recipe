"use client";

import { Clock, Users, ChefHat, ExternalLink, Edit, Star, MoreVertical, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecipeImage } from "./recipe-image";
import { RecipeComments } from "./recipe-comments";
import { AddToCookbookModal } from "./add-to-cookbook-modal";
import { RecipePhotosViewer } from "./recipe-photos-viewer";
import type { Recipe } from "@/types/recipe";
import type { RecipePhoto } from "@/types/recipe-photos";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface RecipeDisplayProps {
  recipe: Recipe;
  onEdit?: () => void;
  canEdit?: boolean;
  showComments?: boolean;
}

export function RecipeDisplay({ recipe, onEdit, canEdit = false, showComments = true }: RecipeDisplayProps) {
  const { data: session } = useSession();
  const [commentsEnabled, setCommentsEnabled] = useState(recipe.commentsEnabled ?? true);
  const [photos, setPhotos] = useState<RecipePhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [servings, setServings] = useState(recipe.servings || 4);
  const [showAddToCookbook, setShowAddToCookbook] = useState(false);
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  
  const isRecipeOwner = session?.user?.id === recipe.authorId;

  // Fetch recipe photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setPhotosLoading(true);
        const response = await fetch(`/api/recipes/${recipe.id}/photos`);
        if (response.ok) {
          const data = await response.json();
          setPhotos(data.photos || []);
        } else {
          console.error('Failed to fetch photos:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setPhotosLoading(false);
      }
    };

    fetchPhotos();
  }, [recipe.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Recipe Image */}
      {recipe.imageUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <RecipeImage
            src={recipe.imageUrl}
            alt={recipe.title}
            width={800}
            height={450}
            className="object-cover w-full h-full"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="border-b pb-6">
        {/* Title with Star and Menu */}
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold tracking-tight flex-1">{recipe.title}</h1>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" className="p-2">
              <Star className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowAddToCookbook(true)}>
                  <Star className="h-4 w-4 mr-2" />
                  Add to Cookbook
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Recipe
                  </DropdownMenuItem>
                )}
                {recipe.sourceUrl && (
                  <DropdownMenuItem asChild>
                    <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original Recipe
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Author */}
        {recipe.authorName && (
          <p className="text-muted-foreground mb-4">By {recipe.authorName}</p>
        )}
        
        {/* Description */}
        {recipe.description && (
          <p className="text-lg text-muted-foreground mb-6">{recipe.description}</p>
        )}
        
        {/* Timing Information */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Prep Time */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Prep Time</span>
            </div>
            <div className="text-lg font-semibold">
              {recipe.prepTime ? `${recipe.prepTime} min` : '—'}
            </div>
          </div>
          
          {/* Cook Time */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ChefHat className="h-4 w-4" />
              <span className="text-sm font-medium">Cook Time</span>
            </div>
            <div className="text-lg font-semibold">
              {recipe.cookTime ? `${recipe.cookTime} min` : '—'}
            </div>
          </div>
          
          {/* Total Time */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Total Time</span>
            </div>
            <div className="text-lg font-semibold">
              {totalTime > 0 ? `${totalTime} min` : '—'}
            </div>
          </div>
          
          {/* Servings */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Servings</span>
            </div>
            <div className="text-lg font-semibold">{servings}</div>
          </div>
        </div>
        
        {/* Recipe Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Content: Ingredients (sticky) and Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ingredients - Sticky */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>INGREDIENTS</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.ingredientSections && recipe.ingredientSections.length > 0 ? (
                // Display sectioned ingredients
                <div className="space-y-6">
                  {recipe.ingredientSections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id}>
                        <h4 className="font-semibold text-sm mb-3 text-primary">
                          {section.name}
                        </h4>
                        <ul className="space-y-3">
                          {section.items.map((ingredient) => (
                            <li key={ingredient.id} className="flex items-start gap-2">
                              <input 
                                type="checkbox" 
                                className="mt-1 h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                aria-label={`Check off ${ingredient.name}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {ingredient.amount > 0 && (
                                    <span className="text-muted-foreground mr-2">
                                      {ingredient.displayAmount || ingredient.amount} {ingredient.unit}
                                    </span>
                                  )}
                                  {ingredient.name}
                                </div>
                                {ingredient.notes && (
                                  <div className="text-sm text-muted-foreground">
                                    {ingredient.notes}
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              ) : (
                // Display flat ingredients (backward compatible)
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient.id} className="flex items-start gap-2">
                      <input 
                        type="checkbox" 
                        className="mt-1 h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label={`Check off ${ingredient.name}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {ingredient.amount > 0 && (
                            <span className="text-muted-foreground mr-2">
                              {ingredient.displayAmount || ingredient.amount} {ingredient.unit}
                            </span>
                          )}
                          {ingredient.name}
                        </div>
                        {ingredient.notes && (
                          <div className="text-sm text-muted-foreground">
                            {ingredient.notes}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>INSTRUCTIONS</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.instructionSections && recipe.instructionSections.length > 0 ? (
                // Display sectioned instructions
                <div className="space-y-8">
                  {recipe.instructionSections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id}>
                        <h4 className="font-semibold text-lg mb-4 text-primary">
                          {section.name}
                        </h4>
                        <ol className="space-y-4">
                          {section.items.map((instruction) => (
                            <li key={instruction.id} className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                {instruction.step}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="text-sm leading-relaxed">
                                  {instruction.content}
                                </div>
                                {instruction.duration && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {instruction.duration} min
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                </div>
              ) : (
                // Display flat instructions (backward compatible)
                <ol className="space-y-4">
                  {recipe.instructions
                    .sort((a, b) => a.step - b.step)
                    .map((instruction) => (
                      <li key={instruction.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {instruction.step}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="text-sm leading-relaxed">
                            {instruction.content}
                          </div>
                          {instruction.duration && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {instruction.duration} min
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <Card>
          <CardHeader>
            <CardTitle>NOTES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {recipe.notes}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipe Photos */}
      {photosLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Recipe Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : photos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recipe Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipePhotosViewer photos={photos} />
          </CardContent>
        </Card>
      ) : null}

      {/* Comments */}
      {showComments && (
        <Card>
          <CardHeader>
            <CardTitle>COMMENTS ({commentsEnabled ? 'Enabled' : 'Disabled'})</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeComments
              recipeId={recipe.id}
              recipeAuthorId={recipe.authorId || ''}
              commentsEnabled={commentsEnabled}
              onCommentsEnabledChange={setCommentsEnabled}
              isRecipeOwner={isRecipeOwner}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Add to Cookbook Modal */}
      <AddToCookbookModal
        recipeId={recipe.id}
        isOpen={showAddToCookbook}
        onClose={() => setShowAddToCookbook(false)}
      />
    </div>
  );
}