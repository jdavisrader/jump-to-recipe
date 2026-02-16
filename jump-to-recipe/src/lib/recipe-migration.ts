import { 
  Recipe, 
  Ingredient, 
  Instruction 
} from '@/types/recipe';
import { 
  RecipeWithSections, 
  IngredientSection, 
  InstructionSection, 
  ExtendedIngredient, 
  ExtendedInstruction 
} from '@/types/sections';
import { SectionDataTransformer } from './section-utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Migration utilities for converting existing recipes to sectioned format
 */
export class RecipeMigrationUtils {
  /**
   * Convert a legacy flat recipe to sectioned format
   * This creates a single default section for all ingredients and instructions
   */
  static convertFlatRecipeToSections(recipe: Recipe): RecipeWithSections {
    const extendedIngredients: ExtendedIngredient[] = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      sectionId: undefined
    }));

    const extendedInstructions: ExtendedInstruction[] = recipe.instructions.map(instruction => ({
      ...instruction,
      sectionId: undefined
    }));

    // Create default sections if there are items
    let ingredientSections: IngredientSection[] | undefined;
    let instructionSections: InstructionSection[] | undefined;

    if (recipe.ingredients.length > 0) {
      ingredientSections = [{
        id: uuidv4(),
        name: 'Ingredients',
        order: 0,
        items: [...recipe.ingredients]
      }];
    }

    if (recipe.instructions.length > 0) {
      instructionSections = [{
        id: uuidv4(),
        name: 'Instructions',
        order: 0,
        items: [...recipe.instructions]
      }];
    }

    return {
      ingredients: extendedIngredients,
      instructions: extendedInstructions,
      ingredientSections,
      instructionSections
    };
  }

  /**
   * Convert a sectioned recipe back to flat format.
   * 
   * Extracts flat arrays from sections while preserving explicit position values.
   * Useful for APIs or systems that expect flat recipe structure.
   */
  static convertSectionedRecipeToFlat(recipe: RecipeWithSections): Recipe {
    // Extract flat ingredients from sections or use existing flat array
    let flatIngredients: Ingredient[];
    if (recipe.ingredientSections && recipe.ingredientSections.length > 0) {
      flatIngredients = SectionDataTransformer.sectionsToFlatIngredients(recipe.ingredientSections);
    } else {
      flatIngredients = recipe.ingredients.map(({ sectionId, ...ingredient }) => ingredient);
    }

    // Extract flat instructions from sections or use existing flat array
    let flatInstructions: Instruction[];
    if (recipe.instructionSections && recipe.instructionSections.length > 0) {
      flatInstructions = SectionDataTransformer.sectionsToFlatInstructions(recipe.instructionSections);
    } else {
      flatInstructions = recipe.instructions.map(({ sectionId, ...instruction }) => instruction);
    }

    // Return a recipe with flat structure
    return {
      ...(recipe as any), // Cast to bypass type checking for missing properties
      ingredients: flatIngredients,
      instructions: flatInstructions,
      // Remove section properties
      ingredientSections: undefined,
      instructionSections: undefined
    };
  }

  /**
   * Detect if a recipe needs migration (has flat structure without sections)
   */
  static needsMigration(recipe: Recipe | RecipeWithSections): boolean {
    const recipeWithSections = recipe as RecipeWithSections;
    
    // If it already has sections, no migration needed
    if (SectionDataTransformer.hasSections(recipeWithSections)) {
      return false;
    }

    // If it has ingredients or instructions but no sections, it needs migration
    return (
      (recipe.ingredients && recipe.ingredients.length > 0) ||
      (recipe.instructions && recipe.instructions.length > 0)
    );
  }

  /**
   * Safely migrate a recipe, handling edge cases
   */
  static safeMigrateRecipe(recipe: Recipe): RecipeWithSections {
    try {
      // Handle empty ingredients/instructions
      const safeIngredients = recipe.ingredients || [];
      const safeInstructions = recipe.instructions || [];

      const safeRecipe: Recipe = {
        ...recipe,
        ingredients: safeIngredients,
        instructions: safeInstructions
      };

      return this.convertFlatRecipeToSections(safeRecipe);
    } catch (error) {
      console.error('Error migrating recipe:', error);
      
      // Fallback: return basic sectioned structure
      return {
        ingredients: [],
        instructions: [],
        ingredientSections: undefined,
        instructionSections: undefined
      };
    }
  }

  /**
   * Batch migrate multiple recipes
   */
  static batchMigrateRecipes(recipes: Recipe[]): RecipeWithSections[] {
    return recipes.map(recipe => this.safeMigrateRecipe(recipe));
  }

  /**
   * Create a migration preview showing what would change
   */
  static createMigrationPreview(recipe: Recipe): {
    original: {
      ingredientCount: number;
      instructionCount: number;
      hasSections: boolean;
    };
    migrated: {
      ingredientSectionCount: number;
      instructionSectionCount: number;
      totalIngredients: number;
      totalInstructions: number;
    };
  } {
    const migratedRecipe = this.convertFlatRecipeToSections(recipe);

    return {
      original: {
        ingredientCount: recipe.ingredients?.length || 0,
        instructionCount: recipe.instructions?.length || 0,
        hasSections: false
      },
      migrated: {
        ingredientSectionCount: migratedRecipe.ingredientSections?.length || 0,
        instructionSectionCount: migratedRecipe.instructionSections?.length || 0,
        totalIngredients: migratedRecipe.ingredientSections?.reduce((sum, section) => sum + section.items.length, 0) || 0,
        totalInstructions: migratedRecipe.instructionSections?.reduce((sum, section) => sum + section.items.length, 0) || 0
      }
    };
  }

  /**
   * Validate that a migration was successful
   */
  static validateMigration(original: Recipe, migrated: RecipeWithSections): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check ingredient count preservation
    const originalIngredientCount = original.ingredients?.length || 0;
    const migratedIngredientCount = migrated.ingredientSections?.reduce((sum, section) => sum + section.items.length, 0) || 0;
    
    if (originalIngredientCount !== migratedIngredientCount) {
      errors.push(`Ingredient count mismatch: original ${originalIngredientCount}, migrated ${migratedIngredientCount}`);
    }

    // Check instruction count preservation
    const originalInstructionCount = original.instructions?.length || 0;
    const migratedInstructionCount = migrated.instructionSections?.reduce((sum, section) => sum + section.items.length, 0) || 0;
    
    if (originalInstructionCount !== migratedInstructionCount) {
      errors.push(`Instruction count mismatch: original ${originalInstructionCount}, migrated ${migratedInstructionCount}`);
    }

    // Check for empty sections (warning, not error)
    if (migrated.ingredientSections) {
      const emptyIngredientSections = migrated.ingredientSections.filter(section => section.items.length === 0);
      if (emptyIngredientSections.length > 0) {
        warnings.push(`${emptyIngredientSections.length} empty ingredient section(s) created`);
      }
    }

    if (migrated.instructionSections) {
      const emptyInstructionSections = migrated.instructionSections.filter(section => section.items.length === 0);
      if (emptyInstructionSections.length > 0) {
        warnings.push(`${emptyInstructionSections.length} empty instruction section(s) created`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a rollback plan for a migration
   */
  static createRollbackPlan(migratedRecipe: RecipeWithSections): Recipe | null {
    try {
      return this.convertSectionedRecipeToFlat(migratedRecipe);
    } catch (error) {
      console.error('Error creating rollback plan:', error);
      return null;
    }
  }
}

/**
 * Backward compatibility layer for reading recipes
 */
export class RecipeCompatibilityLayer {
  /**
   * Normalize a recipe to ensure it has the expected structure
   * Handles both legacy flat recipes and new sectioned recipes
   */
  static normalizeRecipe(recipe: Recipe | RecipeWithSections): RecipeWithSections {
    const recipeWithSections = recipe as RecipeWithSections;

    // If it already has the sectioned structure, return as-is
    if (this.isRecipeWithSections(recipeWithSections)) {
      return recipeWithSections;
    }

    // Otherwise, migrate it to sectioned format
    const migratedRecipe = RecipeMigrationUtils.safeMigrateRecipe(recipe as Recipe);
    
    // Ensure the migrated recipe has the section properties
    return {
      ...migratedRecipe,
      ingredientSections: migratedRecipe.ingredientSections,
      instructionSections: migratedRecipe.instructionSections
    };
  }

  /**
   * Check if a recipe has the sectioned structure
   */
  static isRecipeWithSections(recipe: any): recipe is RecipeWithSections {
    if (!recipe) {
      return false;
    }

    // Check if it has the basic structure
    const hasBasicStructure = (
      Array.isArray(recipe.ingredients) &&
      Array.isArray(recipe.instructions)
    );

    if (!hasBasicStructure) {
      return false;
    }

    // Check if it has section properties (even if undefined)
    const hasSectionProperties = (
      'ingredientSections' in recipe || 
      'instructionSections' in recipe
    );

    // If it has section properties, it's a sectioned recipe
    // If it doesn't have section properties, it's a flat recipe
    return hasSectionProperties;
  }

  /**
   * Get ingredients in a consistent format, regardless of recipe structure
   */
  static getIngredients(recipe: Recipe | RecipeWithSections): Ingredient[] {
    const normalized = this.normalizeRecipe(recipe);
    
    if (normalized.ingredientSections && normalized.ingredientSections.length > 0) {
      return SectionDataTransformer.sectionsToFlatIngredients(normalized.ingredientSections);
    }
    
    return normalized.ingredients.map(({ sectionId, ...ingredient }) => ingredient);
  }

  /**
   * Get instructions in a consistent format, regardless of recipe structure
   */
  static getInstructions(recipe: Recipe | RecipeWithSections): Instruction[] {
    const normalized = this.normalizeRecipe(recipe);
    
    if (normalized.instructionSections && normalized.instructionSections.length > 0) {
      return SectionDataTransformer.sectionsToFlatInstructions(normalized.instructionSections);
    }
    
    return normalized.instructions.map(({ sectionId, ...instruction }) => instruction);
  }

  /**
   * Get ingredient sections, creating default section if needed
   */
  static getIngredientSections(recipe: Recipe | RecipeWithSections): IngredientSection[] {
    const normalized = this.normalizeRecipe(recipe);
    
    if (normalized.ingredientSections && normalized.ingredientSections.length > 0) {
      return normalized.ingredientSections;
    }

    // Create default section from flat ingredients
    if (normalized.ingredients.length > 0) {
      return [{
        id: uuidv4(),
        name: 'Ingredients',
        order: 0,
        items: normalized.ingredients.map(({ sectionId, ...ingredient }) => ingredient)
      }];
    }

    return [];
  }

  /**
   * Get instruction sections, creating default section if needed
   */
  static getInstructionSections(recipe: Recipe | RecipeWithSections): InstructionSection[] {
    const normalized = this.normalizeRecipe(recipe);
    
    if (normalized.instructionSections && normalized.instructionSections.length > 0) {
      return normalized.instructionSections;
    }

    // Create default section from flat instructions
    if (normalized.instructions.length > 0) {
      return [{
        id: uuidv4(),
        name: 'Instructions',
        order: 0,
        items: normalized.instructions.map(({ sectionId, ...instruction }) => instruction)
      }];
    }

    return [];
  }
}

/**
 * User-facing conversion utilities
 */
export class RecipeConversionUtils {
  /**
   * Convert a recipe to use sections (user-initiated conversion)
   */
  static convertToSections(recipe: Recipe): RecipeWithSections {
    return RecipeMigrationUtils.convertFlatRecipeToSections(recipe);
  }

  /**
   * Convert a sectioned recipe back to flat format (user-initiated conversion)
   */
  static convertToFlat(recipe: RecipeWithSections): Recipe {
    return RecipeMigrationUtils.convertSectionedRecipeToFlat(recipe);
  }

  /**
   * Check if conversion is recommended for a recipe
   */
  static isConversionRecommended(recipe: Recipe): boolean {
    // Recommend conversion for recipes with many ingredients or instructions
    const ingredientCount = recipe.ingredients?.length || 0;
    const instructionCount = recipe.instructions?.length || 0;
    
    return ingredientCount > 8 || instructionCount > 6;
  }

  /**
   * Get conversion benefits for a recipe
   */
  static getConversionBenefits(recipe: Recipe): string[] {
    const benefits: string[] = [];
    const ingredientCount = recipe.ingredients?.length || 0;
    const instructionCount = recipe.instructions?.length || 0;

    if (ingredientCount > 8) {
      benefits.push('Organize ingredients into logical groups (e.g., "Dry Ingredients", "Wet Ingredients")');
    }

    if (instructionCount > 6) {
      benefits.push('Break instructions into phases (e.g., "Preparation", "Cooking", "Assembly")');
    }

    if (ingredientCount > 15 || instructionCount > 10) {
      benefits.push('Improve readability for complex recipes');
    }

    benefits.push('Better organization for meal prep and cooking');
    benefits.push('Easier to follow step-by-step process');

    return benefits;
  }
}