"use client";

import Link from "next/link";
import { Clock, Users, ChefHat, ExternalLink, Eye, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecipeImage } from "./recipe-image";
import type { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe & { authorName?: string };
  showAuthor?: boolean;
  compact?: boolean;
  showStats?: boolean;
}

export function RecipeCard({ recipe, showAuthor = false, compact = false, showStats = true }: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  if (compact) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          <div className="w-24 h-24 flex-shrink-0 overflow-hidden">
            <RecipeImage
              src={recipe.imageUrl}
              alt={recipe.title}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {recipe.title}
              </h3>
              {recipe.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {recipe.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {totalTime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{totalTime}m</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{recipe.servings}</span>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="flex items-center gap-1">
                    <ChefHat className="h-3 w-3" />
                    <span className="capitalize">{recipe.difficulty}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video w-full overflow-hidden">
        <RecipeImage
          src={recipe.imageUrl}
          alt={recipe.title}
          width={400}
          height={225}
          className="object-cover w-full h-full transition-transform hover:scale-105"
        />
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
        {recipe.description && (
          <CardDescription className="line-clamp-2">
            {recipe.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Recipe Meta */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {totalTime > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{totalTime} min</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{recipe.servings} servings</span>
              </div>
            )}
            {recipe.difficulty && (
              <div className="flex items-center gap-1">
                <ChefHat className="h-4 w-4" />
                <span className="capitalize">{recipe.difficulty}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground rounded-sm text-xs"
                >
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{recipe.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          {showStats && (recipe.viewCount > 0 || recipe.likeCount > 0) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {recipe.viewCount > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{recipe.viewCount}</span>
                </div>
              )}
              {recipe.likeCount > 0 && (
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{recipe.likeCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Author */}
          {showAuthor && (
            <div className="text-sm text-muted-foreground">
              By {recipe.authorName || 'Anonymous'}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild className="w-full">
          <Link href={`/recipes/${recipe.id}`}>
            View Recipe
            <ExternalLink className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}