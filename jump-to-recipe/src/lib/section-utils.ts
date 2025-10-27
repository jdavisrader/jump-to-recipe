import { 
  Ingredient, 
  Instruction, 
  Recipe 
} from '@/types/recipe';
import { 
  Section, 
  IngredientSection, 
  InstructionSection, 
  ExtendedIngredient, 
  ExtendedInstruction, 
  RecipeWithSections 
} from '@/types/sections';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data transformation utilities for converting between flat and sectioned structures
 */
export class SectionDataTransformer {
  /**
   * Convert flat ingredient array to sectioned structure
   */
  static ingredientsToSections(ingredients: ExtendedIngredient[]): IngredientSection[] {
    const sectionMap = new Map<string, IngredientSection>();
    const unsectionedItems: Ingredient[] = [];

    // Group ingredients by section
    ingredients.forEach(ingredient => {
      if (ingredient.sectionId) {
        if (!sectionMap.has(ingredient.sectionId)) {
          sectionMap.set(ingredient.sectionId, {
            id: ingredient.sectionId,
            name: 'Untitled Section',
            order: sectionMap.size,
            items: []
          });
        }
        const section = sectionMap.get(ingredient.sectionId)!;
        section.items.push({
          id: ingredient.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          displayAmount: ingredient.displayAmount,
          notes: ingredient.notes,
          category: ingredient.category
        });
      } else {
        unsectionedItems.push({
          id: ingredient.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          displayAmount: ingredient.displayAmount,
          notes: ingredient.notes,
          category: ingredient.category
        });
      }
    });

    const sections = Array.from(sectionMap.values());
    
    // If there are unsectioned items, create a default section
    if (unsectionedItems.length > 0) {
      sections.unshift({
        id: uuidv4(),
        name: 'Ingredients',
        order: 0,
        items: unsectionedItems
      });
      
      // Adjust order of other sections
      sections.slice(1).forEach((section, index) => {
        section.order = index + 1;
      });
    }

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Convert flat instruction array to sectioned structure
   */
  static instructionsToSections(instructions: ExtendedInstruction[]): InstructionSection[] {
    const sectionMap = new Map<string, InstructionSection>();
    const unsectionedItems: Instruction[] = [];

    // Group instructions by section
    instructions.forEach(instruction => {
      if (instruction.sectionId) {
        if (!sectionMap.has(instruction.sectionId)) {
          sectionMap.set(instruction.sectionId, {
            id: instruction.sectionId,
            name: 'Untitled Section',
            order: sectionMap.size,
            items: []
          });
        }
        const section = sectionMap.get(instruction.sectionId)!;
        section.items.push({
          id: instruction.id,
          step: instruction.step,
          content: instruction.content,
          duration: instruction.duration
        });
      } else {
        unsectionedItems.push({
          id: instruction.id,
          step: instruction.step,
          content: instruction.content,
          duration: instruction.duration
        });
      }
    });

    const sections = Array.from(sectionMap.values());
    
    // If there are unsectioned items, create a default section
    if (unsectionedItems.length > 0) {
      sections.unshift({
        id: uuidv4(),
        name: 'Instructions',
        order: 0,
        items: unsectionedItems
      });
      
      // Adjust order of other sections
      sections.slice(1).forEach((section, index) => {
        section.order = index + 1;
      });
    }

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Convert sectioned ingredients back to flat array with section references
   */
  static sectionsToIngredients(sections: IngredientSection[]): ExtendedIngredient[] {
    const ingredients: ExtendedIngredient[] = [];

    sections.forEach(section => {
      section.items.forEach(ingredient => {
        ingredients.push({
          ...ingredient,
          sectionId: section.id
        });
      });
    });

    return ingredients;
  }

  /**
   * Convert sectioned instructions back to flat array with section references
   */
  static sectionsToInstructions(sections: InstructionSection[]): ExtendedInstruction[] {
    const instructions: ExtendedInstruction[] = [];

    sections.forEach(section => {
      section.items.forEach(instruction => {
        instructions.push({
          ...instruction,
          sectionId: section.id
        });
      });
    });

    return instructions;
  }

  /**
   * Convert flat ingredients to flat array without section references (for backward compatibility)
   */
  static sectionsToFlatIngredients(sections: IngredientSection[]): Ingredient[] {
    const ingredients: Ingredient[] = [];

    sections.forEach(section => {
      section.items.forEach(ingredient => {
        ingredients.push({
          id: ingredient.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          displayAmount: ingredient.displayAmount,
          notes: ingredient.notes,
          category: ingredient.category
        });
      });
    });

    return ingredients;
  }

  /**
   * Convert flat instructions to flat array without section references (for backward compatibility)
   */
  static sectionsToFlatInstructions(sections: InstructionSection[]): Instruction[] {
    const instructions: Instruction[] = [];

    sections.forEach(section => {
      section.items.forEach(instruction => {
        instructions.push({
          id: instruction.id,
          step: instruction.step,
          content: instruction.content,
          duration: instruction.duration
        });
      });
    });

    return instructions;
  }

  /**
   * Migrate existing recipe to support sections while maintaining backward compatibility
   */
  static migrateRecipeToSections(recipe: Recipe): RecipeWithSections {
    // Convert existing flat arrays to extended format (no sections initially)
    const extendedIngredients: ExtendedIngredient[] = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      sectionId: undefined
    }));

    const extendedInstructions: ExtendedInstruction[] = recipe.instructions.map(instruction => ({
      ...instruction,
      sectionId: undefined
    }));

    return {
      ingredients: extendedIngredients,
      instructions: extendedInstructions,
      // No sections initially - they will be created when user adds them
      ingredientSections: undefined,
      instructionSections: undefined
    };
  }

  /**
   * Check if a recipe has any sections
   */
  static hasSections(recipe: RecipeWithSections): boolean {
    return Boolean(
      (recipe.ingredientSections && recipe.ingredientSections.length > 0) ||
      (recipe.instructionSections && recipe.instructionSections.length > 0)
    );
  }

  /**
   * Create a new empty section
   */
  static createEmptySection<T>(name: string = 'Untitled Section', order: number = 0): Section<T> {
    return {
      id: uuidv4(),
      name,
      order,
      items: []
    };
  }

  /**
   * Reorder sections based on new order array
   */
  static reorderSections<T>(sections: Section<T>[], newOrder: string[]): Section<T>[] {
    const sectionMap = new Map(sections.map(section => [section.id, section]));
    
    return newOrder
      .map((id, index) => {
        const section = sectionMap.get(id);
        if (section) {
          return { ...section, order: index };
        }
        return null;
      })
      .filter((section): section is Section<T> => section !== null);
  }

  /**
   * Validate section structure and return errors
   */
  static validateSections<T>(sections: Section<T>[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate IDs
    const ids = sections.map(s => s.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate section IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check for invalid order values
    const orders = sections.map(s => s.order);
    const hasInvalidOrder = orders.some(order => order < 0 || !Number.isInteger(order));
    if (hasInvalidOrder) {
      errors.push('Section orders must be non-negative integers');
    }

    // Check for empty section names (warning, not error)
    const emptySections = sections.filter(s => !s.name.trim());
    if (emptySections.length > 0) {
      errors.push(`${emptySections.length} section(s) have empty names`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Utility functions for section operations
 */
export const sectionUtils = {
  /**
   * Generate a unique section name
   */
  generateSectionName(existingNames: string[], baseName: string = 'Section'): string {
    let counter = 1;
    let name = baseName;
    
    while (existingNames.includes(name)) {
      name = `${baseName} ${counter}`;
      counter++;
    }
    
    return name;
  },

  /**
   * Check if section is empty
   */
  isSectionEmpty<T>(section: Section<T>): boolean {
    return section.items.length === 0;
  },

  /**
   * Get empty sections from a list
   */
  getEmptySections<T>(sections: Section<T>[]): Section<T>[] {
    return sections.filter(section => this.isSectionEmpty(section));
  },

  /**
   * Remove empty sections from a list
   */
  removeEmptySections<T>(sections: Section<T>[]): Section<T>[] {
    return sections.filter(section => !this.isSectionEmpty(section));
  },

  /**
   * Find section by ID
   */
  findSectionById<T>(sections: Section<T>[], id: string): Section<T> | undefined {
    return sections.find(section => section.id === id);
  },

  /**
   * Update section in array
   */
  updateSection<T>(sections: Section<T>[], updatedSection: Section<T>): Section<T>[] {
    return sections.map(section => 
      section.id === updatedSection.id ? updatedSection : section
    );
  },

  /**
   * Remove section from array
   */
  removeSection<T>(sections: Section<T>[], sectionId: string): Section<T>[] {
    return sections.filter(section => section.id !== sectionId);
  }
};