'use client';

import React, { useState } from 'react';
import { Recipe } from '@/types/recipe';
import { RecipeWithSections } from '@/types/sections';
import { 
  RecipeMigrationUtils, 
  RecipeConversionUtils 
} from '@/lib/recipe-migration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ArrowRight, Undo2 } from 'lucide-react';

interface RecipeMigrationHelperProps {
  recipe: Recipe;
  onConvert?: (convertedRecipe: RecipeWithSections) => void;
  onRevert?: (revertedRecipe: Recipe) => void;
  className?: string;
}

/**
 * Component that helps users convert their recipes to use sections
 */
export function RecipeMigrationHelper({
  recipe,
  onConvert,
  onRevert,
  className
}: RecipeMigrationHelperProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const needsMigration = RecipeMigrationUtils.needsMigration(recipe);
  const isRecommended = RecipeConversionUtils.isConversionRecommended(recipe);
  const benefits = RecipeConversionUtils.getConversionBenefits(recipe);
  const preview = RecipeMigrationUtils.createMigrationPreview(recipe);

  const handleConvert = async () => {
    if (!onConvert) return;

    setIsConverting(true);
    try {
      const convertedRecipe = RecipeConversionUtils.convertToSections(recipe);
      const validation = RecipeMigrationUtils.validateMigration(recipe, convertedRecipe);

      if (validation.isValid) {
        onConvert(convertedRecipe);
      } else {
        console.error('Migration validation failed:', validation.errors);
        // Could show error toast here
      }
    } catch (error) {
      console.error('Error converting recipe:', error);
      // Could show error toast here
    } finally {
      setIsConverting(false);
    }
  };

  const handleRevert = async () => {
    if (!onRevert) return;

    try {
      const revertedRecipe = RecipeConversionUtils.convertToFlat(recipe as RecipeWithSections);
      onRevert(revertedRecipe);
    } catch (error) {
      console.error('Error reverting recipe:', error);
      // Could show error toast here
    }
  };

  // Don't show if recipe doesn't need migration
  if (!needsMigration) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Recipe Organization</CardTitle>
          {isRecommended && (
            <Badge variant="secondary" className="text-xs">
              Recommended
            </Badge>
          )}
        </div>
        <CardDescription>
          Organize your recipe into sections for better clarity and easier cooking.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Benefits */}
        <div>
          <h4 className="font-medium mb-2 text-sm">Benefits of using sections:</h4>
          <ul className="space-y-1">
            {benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <h4 className="font-medium mb-2 text-sm">Preview of changes:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Current</div>
                <div>{preview.original.ingredientCount} ingredients</div>
                <div>{preview.original.instructionCount} instructions</div>
                <div>No sections</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">After conversion</div>
                <div>{preview.migrated.totalIngredients} ingredients in {preview.migrated.ingredientSectionCount} section(s)</div>
                <div>{preview.migrated.totalInstructions} instructions in {preview.migrated.instructionSectionCount} section(s)</div>
                <div>Organized structure</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleConvert}
            disabled={isConverting || !onConvert}
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            {isConverting ? 'Converting...' : 'Convert to Sections'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>

        {/* Warning for complex recipes */}
        {(preview.original.ingredientCount > 15 || preview.original.instructionCount > 10) && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-amber-800">Complex Recipe Detected</div>
              <div className="text-amber-700">
                This recipe has many ingredients or steps. Converting to sections will make it much easier to follow.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecipeRevertHelperProps {
  recipe: RecipeWithSections;
  onRevert?: (revertedRecipe: Recipe) => void;
  className?: string;
}

/**
 * Component that helps users revert sectioned recipes back to flat format
 */
export function RecipeRevertHelper({
  recipe,
  onRevert,
  className
}: RecipeRevertHelperProps) {
  const [isReverting, setIsReverting] = useState(false);

  const handleRevert = async () => {
    if (!onRevert) return;

    setIsReverting(true);
    try {
      const revertedRecipe = RecipeConversionUtils.convertToFlat(recipe);
      onRevert(revertedRecipe);
    } catch (error) {
      console.error('Error reverting recipe:', error);
      // Could show error toast here
    } finally {
      setIsReverting(false);
    }
  };

  // Only show if recipe has sections
  const hasSections = (recipe.ingredientSections && recipe.ingredientSections.length > 0) ||
                     (recipe.instructionSections && recipe.instructionSections.length > 0);

  if (!hasSections) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Remove Sections</CardTitle>
        <CardDescription>
          Convert back to a simple list format without sections.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRevert}
            disabled={isReverting || !onRevert}
            size="sm"
            className="flex items-center gap-2"
          >
            <Undo2 className="h-4 w-4" />
            {isReverting ? 'Removing Sections...' : 'Remove Sections'}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          This will combine all sections into simple lists. You can always add sections back later.
        </p>
      </CardContent>
    </Card>
  );
}