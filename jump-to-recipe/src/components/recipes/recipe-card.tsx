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
      <Card className="overflow-hidden hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-ring">
        <Link 
          href={`/recipes/${recipe.id}`}
          className="flex focus:outline-none"
          aria-label={`View recipe: ${recipe.title}`}
        >
          <div className="w-20 sm:w-24 h-20 sm:h-24 flex-shrink-0 overflow-hidden">
            <RecipeImage
              src={recipe.imageUrl}
              alt=""
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 p-3 sm:p-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {recipe.title}
              </h3>
              {recipe.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {recipe.description}
                </p>
              )}
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                {totalTime > 0 && (
                  <div className="flex items-center gap-1" title={`Total time: ${totalTime} minutes`}>
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{totalTime}m</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-1" title={`Serves ${recipe.servings}`}>
                    <Users className="h-3 w-3" aria-hidden="true" />
                    <span>{recipe.servings}</span>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="flex items-center gap-1" title={`Difficulty: ${recipe.difficulty}`}>
                    <ChefHat className="h-3 w-3" aria-hidden="true" />
                    <span className="capitalize">{recipe.difficulty}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-ring">
      <div className="aspect-video w-full overflow-hidden">
        <RecipeImage
          src={recipe.imageUrl}
          alt=""
          width={400}
          height={225}
          className="object-cover w-full h-full transition-transform hover:scale-105"
        />
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 text-base sm:text-lg">{recipe.title}</CardTitle>
        {recipe.description && (
          <CardDescription className="line-clamp-2 text-sm">
            {recipe.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Recipe Meta */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
            {totalTime > 0 && (
              <div className="flex items-center gap-1" title={`Total time: ${totalTime} minutes`}>
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>{totalTime} min</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1" title={`Serves ${recipe.servings} people`}>
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>{recipe.servings} servings</span>
              </div>
            )}
            {recipe.difficulty && (
              <div className="flex items-center gap-1" title={`Difficulty level: ${recipe.difficulty}`}>
                <ChefHat className="h-4 w-4" aria-hidden="true" />
                <span className="capitalize">{recipe.difficulty}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1" role="list" aria-label="Recipe tags">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground rounded-sm text-xs"
                  role="listitem"
                >
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="text-xs text-muted-foreground" role="listitem">
                  +{recipe.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          {showStats && (recipe.viewCount > 0 || recipe.likeCount > 0) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {recipe.viewCount > 0 && (
                <div className="flex items-center gap-1" title={`${recipe.viewCount} views`}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  <span>{recipe.viewCount}</span>
                  <span className="sr-only">views</span>
                </div>
              )}
              {recipe.likeCount > 0 && (
                <div className="flex items-center gap-1" title={`${recipe.likeCount} likes`}>
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  <span>{recipe.likeCount}</span>
                  <span className="sr-only">likes</span>
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
            <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}