import { Ingredient, Instruction } from './recipe';

// Generic section interface
export interface Section<T = any> {
  id: string;
  name: string;
  order: number;
  items: T[];
}

// Specific section types
export interface IngredientSection extends Section<Ingredient> {
  items: Ingredient[];
}

export interface InstructionSection extends Section<Instruction> {
  items: Instruction[];
}

// Extended ingredient and instruction types with section references
export interface ExtendedIngredient extends Ingredient {
  sectionId?: string;
}

export interface ExtendedInstruction extends Instruction {
  sectionId?: string;
}

// Recipe with sections support
export interface RecipeWithSections {
  ingredientSections?: IngredientSection[];
  instructionSections?: InstructionSection[];
  // Maintain backward compatibility with flat arrays
  ingredients: ExtendedIngredient[];
  instructions: ExtendedInstruction[];
}

// Section validation error types
export interface SectionValidationError {
  sectionId: string;
  type: 'empty_name' | 'empty_section' | 'invalid_order';
  message: string;
}

// Section operation types
export type SectionOperation = 
  | { type: 'ADD_SECTION'; sectionType: 'ingredient' | 'instruction' }
  | { type: 'REMOVE_SECTION'; sectionId: string }
  | { type: 'RENAME_SECTION'; sectionId: string; name: string }
  | { type: 'REORDER_SECTIONS'; sectionIds: string[] }
  | { type: 'ADD_ITEM'; sectionId: string; item: Ingredient | Instruction }
  | { type: 'REMOVE_ITEM'; sectionId: string; itemId: string }
  | { type: 'MOVE_ITEM'; fromSectionId: string; toSectionId: string; itemId: string };

// Utility types for section management
export interface SectionManagerState {
  sections: Section[];
  activeSection?: string;
  draggedItem?: {
    sectionId: string;
    itemId: string;
    type: 'section' | 'item';
  };
}

export interface SectionFormData {
  ingredientSections: IngredientSection[];
  instructionSections: InstructionSection[];
}