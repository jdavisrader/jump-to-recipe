import { describe, it, expect } from '@jest/globals';
import {
  strictIngredientItemSchema,
  strictInstructionItemSchema,
  strictIngredientSectionSchema,
  strictInstructionSectionSchema,
  strictExtendedIngredientSchema,
  strictExtendedInstructionSchema,
  strictRecipeWithSectionsSchema,
  validateRecipeStrict,
  validateIngredientSectionStrict,
  validateInstructionSectionStrict,
  validateUniqueSectionIds,
  validateUniqueItemIds,
} from '../recipe-sections';

// ============================================================================
// Test Helpers
// ============================================================================

const validUUID = '550e8400-e29b-41d4-a716-446655440000';
const validUUID2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const validUUID3 = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
const invalidUUID = 'not-a-uuid';
const invalidUUIDFormat = '550e8400-e29b-41d4-a716';

const createValidIngredientItem = (overrides = {}) => ({
  id: validUUID,
  name: 'Flour',
  amount: 2,
  unit: 'cups',
  position: 0,
  ...overrides,
});

const createValidInstructionItem = (overrides = {}) => ({
  id: validUUID,
  step: 1,
  content: 'Mix ingredients',
  position: 0,
  ...overrides,
});

const createValidIngredientSection = (overrides = {}) => ({
  id: validUUID,
  name: 'Dry Ingredients',
  order: 0,
  items: [createValidIngredientItem()],
  ...overrides,
});

const createValidInstructionSection = (overrides = {}) => ({
  id: validUUID,
  name: 'Preparation',
  order: 0,
  items: [createValidInstructionItem()],
  ...overrides,
});

const createValidRecipe = (overrides = {}) => ({
  title: 'Test Recipe',
  description: 'A test recipe',
  ingredients: [createValidIngredientItem()],
  instructions: [createValidInstructionItem()],
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  difficulty: 'easy' as const,
  tags: ['test'],
  notes: 'Test notes',
  imageUrl: 'https://example.com/image.jpg',
  sourceUrl: 'https://example.com/recipe',
  authorId: validUUID,
  visibility: 'private' as const,
  commentsEnabled: true,
  viewCount: 0,
  likeCount: 0,
  ...overrides,
});

// ============================================================================
// strictIngredientItemSchema Tests
// ============================================================================

describe('strictIngredientItemSchema', () => {
  describe('Valid Cases', () => {
    it('should validate a valid ingredient item', () => {
      const item = createValidIngredientItem();
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const item = createValidIngredientItem({
        displayAmount: '2 cups',
        notes: 'sifted',
        category: 'baking',
      });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from name', () => {
      const item = createValidIngredientItem({ name: '  Flour  ' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Flour');
      }
    });
  });

  describe('ID Validation', () => {
    it('should reject invalid UUID format', () => {
      const item = createValidIngredientItem({ id: invalidUUID });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid ingredient ID format');
      }
    });

    it('should reject incomplete UUID', () => {
      const item = createValidIngredientItem({ id: invalidUUIDFormat });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should reject missing ID', () => {
      const item = { ...createValidIngredientItem() };
      delete (item as any).id;
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should accept uppercase UUID', () => {
      const item = createValidIngredientItem({ id: validUUID.toUpperCase() });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });

  describe('Name Validation', () => {
    it('should reject empty name', () => {
      const item = createValidIngredientItem({ name: '' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should reject whitespace-only name', () => {
      const item = createValidIngredientItem({ name: '   ' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('whitespace'))).toBe(true);
      }
    });

    it('should reject missing name', () => {
      const item = { ...createValidIngredientItem() };
      delete (item as any).name;
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('Amount Validation', () => {
    it('should accept zero amount', () => {
      const item = createValidIngredientItem({ amount: 0 });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const item = createValidIngredientItem({ amount: -1 });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('non-negative');
      }
    });

    it('should accept decimal amounts', () => {
      const item = createValidIngredientItem({ amount: 1.5 });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });

  describe('Special Characters', () => {
    it('should accept names with special characters', () => {
      const item = createValidIngredientItem({ name: 'Salt & Pepper' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept names with unicode characters', () => {
      const item = createValidIngredientItem({ name: 'Café au lait' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept names with numbers', () => {
      const item = createValidIngredientItem({ name: '2% Milk' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// strictInstructionItemSchema Tests
// ============================================================================

describe('strictInstructionItemSchema', () => {
  describe('Valid Cases', () => {
    it('should validate a valid instruction item', () => {
      const item = createValidInstructionItem();
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept optional duration', () => {
      const item = createValidInstructionItem({ duration: 30 , position: 0 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from content', () => {
      const item = createValidInstructionItem({ content: '  Mix well  ' });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Mix well');
      }
    });
  });

  describe('ID Validation', () => {
    it('should reject invalid UUID format', () => {
      const item = createValidInstructionItem({ id: invalidUUID });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid instruction ID format');
      }
    });

    it('should reject missing ID', () => {
      const item = { ...createValidInstructionItem() };
      delete (item as any).id;
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('Step Validation', () => {
    it('should accept positive step numbers', () => {
      const item = createValidInstructionItem({ step: 5 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should reject zero step number', () => {
      const item = createValidInstructionItem({ step: 0 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject negative step number', () => {
      const item = createValidInstructionItem({ step: -1 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should reject decimal step number', () => {
      const item = createValidInstructionItem({ step: 1.5 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('Content Validation', () => {
    it('should reject empty content', () => {
      const item = createValidInstructionItem({ content: '' });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should reject whitespace-only content', () => {
      const item = createValidInstructionItem({ content: '   ' });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('whitespace'))).toBe(true);
      }
    });
  });

  describe('Duration Validation', () => {
    it('should accept positive duration', () => {
      const item = createValidInstructionItem({ duration: 30 , position: 0 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should reject zero duration', () => {
      const item = createValidInstructionItem({ duration: 0 , position: 0 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should reject negative duration', () => {
      const item = createValidInstructionItem({ duration: -10 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should reject decimal duration', () => {
      const item = createValidInstructionItem({ duration: 10.5 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// strictIngredientSectionSchema Tests
// ============================================================================

describe('strictIngredientSectionSchema', () => {
  describe('Valid Cases', () => {
    it('should validate a valid ingredient section', () => {
      const section = createValidIngredientSection();
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should accept multiple items', () => {
      const section = createValidIngredientSection({
        items: [
          createValidIngredientItem({ id: validUUID }),
          createValidIngredientItem({ id: validUUID2, name: 'Sugar' }),
        ],
      });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from section name', () => {
      const section = createValidIngredientSection({ name: '  Dry Ingredients  ' });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Dry Ingredients');
      }
    });
  });

  describe('Section ID Validation', () => {
    it('should reject invalid UUID format', () => {
      const section = createValidIngredientSection({ id: invalidUUID });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid section ID format');
      }
    });

    it('should reject missing ID', () => {
      const section = { ...createValidIngredientSection() };
      delete (section as any).id;
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });
  });

  describe('Section Name Validation', () => {
    it('should reject empty name', () => {
      const section = createValidIngredientSection({ name: '' });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Section name is required');
      }
    });

    it('should reject whitespace-only name', () => {
      const section = createValidIngredientSection({ name: '   ' });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('whitespace'))).toBe(true);
      }
    });

    it('should reject missing name', () => {
      const section = { ...createValidIngredientSection() };
      delete (section as any).name;
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });

    it('should accept duplicate section names', () => {
      // This test verifies that duplicate names are allowed
      const section1 = createValidIngredientSection({ id: validUUID, name: 'Ingredients' });
      const section2 = createValidIngredientSection({ id: validUUID2, name: 'Ingredients' });
      
      const result1 = strictIngredientSectionSchema.safeParse(section1);
      const result2 = strictIngredientSectionSchema.safeParse(section2);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Order Validation', () => {
    it('should accept zero order', () => {
      const section = createValidIngredientSection({ order: 0 });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should accept positive order', () => {
      const section = createValidIngredientSection({ order: 5 });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should reject negative order', () => {
      const section = createValidIngredientSection({ order: -1 });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('non-negative');
      }
    });

    it('should reject decimal order', () => {
      const section = createValidIngredientSection({ order: 1.5 });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });

    it('should reject missing order', () => {
      const section = { ...createValidIngredientSection() };
      delete (section as any).order;
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });
  });

  describe('Items Validation', () => {
    it('should reject empty items array', () => {
      const section = createValidIngredientSection({ items: [] });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one ingredient');
      }
    });

    it('should reject missing items', () => {
      const section = { ...createValidIngredientSection() };
      delete (section as any).items;
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });

    it('should validate all items in the array', () => {
      const section = createValidIngredientSection({
        items: [
          createValidIngredientItem({ id: validUUID }),
          createValidIngredientItem({ id: invalidUUID, name: 'Sugar' }),
        ],
      });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// strictInstructionSectionSchema Tests
// ============================================================================

describe('strictInstructionSectionSchema', () => {
  describe('Valid Cases', () => {
    it('should validate a valid instruction section', () => {
      const section = createValidInstructionSection();
      const result = strictInstructionSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should accept multiple items', () => {
      const section = createValidInstructionSection({
        items: [
          createValidInstructionItem({ id: validUUID, step: 1 }),
          createValidInstructionItem({ id: validUUID2, step: 2, content: 'Bake' , position: 0 }),
        ],
      });
      const result = strictInstructionSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });
  });

  describe('Section Name Validation', () => {
    it('should reject empty name', () => {
      const section = createValidInstructionSection({ name: '' });
      const result = strictInstructionSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Section name is required');
      }
    });

    it('should reject whitespace-only name', () => {
      const section = createValidInstructionSection({ name: '   ' });
      const result = strictInstructionSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });
  });

  describe('Items Validation', () => {
    it('should reject empty items array', () => {
      const section = createValidInstructionSection({ items: [] });
      const result = strictInstructionSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one step');
      }
    });

    it('should reject missing items', () => {
      const section = { ...createValidInstructionSection() };
      delete (section as any).items;
      const result = strictInstructionSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });
  });

  describe('Order Validation', () => {
    it('should reject negative order', () => {
      const section = createValidInstructionSection({ order: -1 });
      const result = strictInstructionSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// strictExtendedIngredientSchema Tests
// ============================================================================

describe('strictExtendedIngredientSchema', () => {
  it('should validate ingredient with optional sectionId', () => {
    const item = { ...createValidIngredientItem(), sectionId: validUUID };
    const result = strictExtendedIngredientSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should validate ingredient without sectionId', () => {
    const item = createValidIngredientItem();
    const result = strictExtendedIngredientSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should reject invalid sectionId format', () => {
    const item = { ...createValidIngredientItem(), sectionId: invalidUUID };
    const result = strictExtendedIngredientSchema.safeParse(item);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid section ID format');
    }
  });
});

// ============================================================================
// strictExtendedInstructionSchema Tests
// ============================================================================

describe('strictExtendedInstructionSchema', () => {
  it('should validate instruction with optional sectionId', () => {
    const item = { ...createValidInstructionItem(), sectionId: validUUID };
    const result = strictExtendedInstructionSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should validate instruction without sectionId', () => {
    const item = createValidInstructionItem();
    const result = strictExtendedInstructionSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should reject invalid sectionId format', () => {
    const item = { ...createValidInstructionItem(), sectionId: invalidUUID };
    const result = strictExtendedInstructionSchema.safeParse(item);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// strictRecipeWithSectionsSchema Tests
// ============================================================================

describe('strictRecipeWithSectionsSchema', () => {
  describe('Valid Cases', () => {
    it('should validate a valid recipe', () => {
      const recipe = createValidRecipe();
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should validate recipe with sections', () => {
      const recipe = createValidRecipe({
        ingredientSections: [createValidIngredientSection()],
        instructionSections: [createValidInstructionSection()],
      });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should validate recipe with multiple sections', () => {
      const recipe = createValidRecipe({
        ingredientSections: [
          createValidIngredientSection({ id: validUUID, order: 0 }),
          createValidIngredientSection({ id: validUUID2, order: 1, name: 'Wet Ingredients' }),
        ],
        instructionSections: [
          createValidInstructionSection({ id: validUUID3, order: 0 }),
        ],
      });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields as null', () => {
      const recipe = createValidRecipe({
        description: null,
        prepTime: null,
        cookTime: null,
        servings: null,
        difficulty: null,
        notes: null,
        imageUrl: null,
        sourceUrl: null,
        authorId: null,
      });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredients: [createValidIngredientItem()],
        instructions: [createValidInstructionItem()],
      };
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
        expect(result.data.visibility).toBe('private');
        expect(result.data.commentsEnabled).toBe(true);
        expect(result.data.viewCount).toBe(0);
        expect(result.data.likeCount).toBe(0);
      }
    });
  });

  describe('Title Validation', () => {
    it('should reject empty title', () => {
      const recipe = createValidRecipe({ title: '' });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title is required');
      }
    });

    it('should reject title that is too long', () => {
      const recipe = createValidRecipe({ title: 'a'.repeat(501) });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('too long');
      }
    });

    it('should accept title at max length', () => {
      const recipe = createValidRecipe({ title: 'a'.repeat(500) });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });
  });

  describe('Recipe-Level Ingredient Validation', () => {
    it('should reject recipe with no ingredients', () => {
      const recipe = createValidRecipe({ ingredients: [] });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('At least one ingredient'))).toBe(true);
      }
    });

    it('should reject recipe with empty ingredient sections', () => {
      const recipe = createValidRecipe({
        ingredients: [],
        ingredientSections: [
          createValidIngredientSection({ items: [] }),
        ],
      });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });

    it('should accept recipe with ingredients in sections', () => {
      const recipe = createValidRecipe({
        ingredients: [createValidIngredientItem()],
        ingredientSections: [createValidIngredientSection()],
      });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });
  });

  describe('Recipe-Level Instruction Validation', () => {
    it('should reject recipe with no instructions', () => {
      const recipe = createValidRecipe({ instructions: [] });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('At least one instruction'))).toBe(true);
      }
    });

    it('should accept recipe with instructions in sections', () => {
      const recipe = createValidRecipe({
        instructions: [createValidInstructionItem()],
        instructionSections: [createValidInstructionSection()],
      });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });
  });

  describe('Time Validation', () => {
    it('should accept positive prep time', () => {
      const recipe = createValidRecipe({ prepTime: 30 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should reject zero prep time', () => {
      const recipe = createValidRecipe({ prepTime: 0 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });

    it('should reject negative prep time', () => {
      const recipe = createValidRecipe({ prepTime: -10 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });

    it('should reject decimal prep time', () => {
      const recipe = createValidRecipe({ prepTime: 10.5 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });

    it('should accept positive cook time', () => {
      const recipe = createValidRecipe({ cookTime: 60 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should reject negative cook time', () => {
      const recipe = createValidRecipe({ cookTime: -20 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });
  });

  describe('Servings Validation', () => {
    it('should accept positive servings', () => {
      const recipe = createValidRecipe({ servings: 4 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should reject zero servings', () => {
      const recipe = createValidRecipe({ servings: 0 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });

    it('should reject negative servings', () => {
      const recipe = createValidRecipe({ servings: -2 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });

    it('should reject decimal servings', () => {
      const recipe = createValidRecipe({ servings: 4.5 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });
  });

  describe('Difficulty Validation', () => {
    it('should accept valid difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'] as const;
      difficulties.forEach(difficulty => {
        const recipe = createValidRecipe({ difficulty });
        const result = strictRecipeWithSectionsSchema.safeParse(recipe);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid difficulty', () => {
      const recipe = createValidRecipe({ difficulty: 'impossible' as any });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });
  });

  describe('Visibility Validation', () => {
    it('should accept valid visibility values', () => {
      const visibilities = ['public', 'private'] as const;
      visibilities.forEach(visibility => {
        const recipe = createValidRecipe({ visibility });
        const result = strictRecipeWithSectionsSchema.safeParse(recipe);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid visibility', () => {
      const recipe = createValidRecipe({ visibility: 'secret' as any });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });
  });

  describe('Count Validation', () => {
    it('should accept zero view count', () => {
      const recipe = createValidRecipe({ viewCount: 0 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should reject negative view count', () => {
      const recipe = createValidRecipe({ viewCount: -1 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });

    it('should accept zero like count', () => {
      const recipe = createValidRecipe({ likeCount: 0 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should reject negative like count', () => {
      const recipe = createValidRecipe({ likeCount: -1 });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Validation Helper Functions Tests
// ============================================================================

describe('validateRecipeStrict', () => {
  it('should return success for valid recipe', () => {
    const recipe = createValidRecipe();
    const result = validateRecipeStrict(recipe);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('should return structured errors for invalid recipe', () => {
    const recipe = createValidRecipe({ title: '', ingredients: [] });
    const result = validateRecipeStrict(recipe);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('should include path and message in errors', () => {
    const recipe = createValidRecipe({ title: '' });
    const result = validateRecipeStrict(recipe);
    expect(result.success).toBe(false);
    if (!result.success && result.errors) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('path');
      expect(result.errors[0]).toHaveProperty('message');
      expect(typeof result.errors[0].path).toBe('string');
      expect(typeof result.errors[0].message).toBe('string');
    }
  });

  it('should return multiple errors for multiple issues', () => {
    const recipe = createValidRecipe({
      title: '',
      ingredients: [],
      instructions: [],
    });
    const result = validateRecipeStrict(recipe);
    expect(result.success).toBe(false);
    if (!result.success && result.errors) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });
});

describe('validateIngredientSectionStrict', () => {
  it('should return success for valid section', () => {
    const section = createValidIngredientSection();
    const result = validateIngredientSectionStrict(section);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should return structured errors for invalid section', () => {
    const section = createValidIngredientSection({ name: '', items: [] });
    const result = validateIngredientSectionStrict(section);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('should include helpful error messages', () => {
    const section = createValidIngredientSection({ items: [] });
    const result = validateIngredientSectionStrict(section);
    expect(result.success).toBe(false);
    if (!result.success && result.errors) {
      const errorMessages = result.errors.map(e => e.message);
      expect(errorMessages.some(msg => msg.includes('at least one ingredient'))).toBe(true);
    }
  });
});

describe('validateInstructionSectionStrict', () => {
  it('should return success for valid section', () => {
    const section = createValidInstructionSection();
    const result = validateInstructionSectionStrict(section);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should return structured errors for invalid section', () => {
    const section = createValidInstructionSection({ name: '', items: [] });
    const result = validateInstructionSectionStrict(section);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should include helpful error messages', () => {
    const section = createValidInstructionSection({ items: [] });
    const result = validateInstructionSectionStrict(section);
    expect(result.success).toBe(false);
    if (!result.success && result.errors) {
      const errorMessages = result.errors.map(e => e.message);
      expect(errorMessages.some(msg => msg.includes('at least one step'))).toBe(true);
    }
  });
});

describe('validateUniqueSectionIds', () => {
  it('should return true for unique section IDs', () => {
    const data = {
      ingredientSections: [
        { id: validUUID },
        { id: validUUID2 },
      ],
      instructionSections: [
        { id: validUUID3 },
      ],
    };
    const result = validateUniqueSectionIds(data);
    expect(result).toBe(true);
  });

  it('should return false for duplicate section IDs', () => {
    const data = {
      ingredientSections: [
        { id: validUUID },
        { id: validUUID },
      ],
    };
    const result = validateUniqueSectionIds(data);
    expect(result).toBe(false);
  });

  it('should return false for duplicate IDs across section types', () => {
    const data = {
      ingredientSections: [{ id: validUUID }],
      instructionSections: [{ id: validUUID }],
    };
    const result = validateUniqueSectionIds(data);
    expect(result).toBe(false);
  });

  it('should return true for empty sections', () => {
    const data = {
      ingredientSections: [],
      instructionSections: [],
    };
    const result = validateUniqueSectionIds(data);
    expect(result).toBe(true);
  });

  it('should return true for undefined sections', () => {
    const data = {};
    const result = validateUniqueSectionIds(data);
    expect(result).toBe(true);
  });
});

describe('validateUniqueItemIds', () => {
  it('should return true for unique item IDs', () => {
    const data = {
      ingredientSections: [
        {
          items: [
            { id: validUUID },
            { id: validUUID2 },
          ],
        },
      ],
      instructionSections: [
        {
          items: [
            { id: validUUID3 },
          ],
        },
      ],
    };
    const result = validateUniqueItemIds(data);
    expect(result).toBe(true);
  });

  it('should return false for duplicate item IDs within same section', () => {
    const data = {
      ingredientSections: [
        {
          items: [
            { id: validUUID },
            { id: validUUID },
          ],
        },
      ],
    };
    const result = validateUniqueItemIds(data);
    expect(result).toBe(false);
  });

  it('should return false for duplicate item IDs across sections', () => {
    const data = {
      ingredientSections: [
        { items: [{ id: validUUID }] },
        { items: [{ id: validUUID }] },
      ],
    };
    const result = validateUniqueItemIds(data);
    expect(result).toBe(false);
  });

  it('should return false for duplicate IDs across section types', () => {
    const data = {
      ingredientSections: [{ items: [{ id: validUUID }] }],
      instructionSections: [{ items: [{ id: validUUID }] }],
    };
    const result = validateUniqueItemIds(data);
    expect(result).toBe(false);
  });

  it('should return true for empty sections', () => {
    const data = {
      ingredientSections: [{ items: [] }],
      instructionSections: [{ items: [] }],
    };
    const result = validateUniqueItemIds(data);
    expect(result).toBe(true);
  });

  it('should return true for undefined sections', () => {
    const data = {};
    const result = validateUniqueItemIds(data);
    expect(result).toBe(true);
  });

  it('should handle multiple sections with multiple items', () => {
    const data = {
      ingredientSections: [
        {
          items: [
            { id: '550e8400-e29b-41d4-a716-446655440001' },
            { id: '550e8400-e29b-41d4-a716-446655440002' },
          ],
        },
        {
          items: [
            { id: '550e8400-e29b-41d4-a716-446655440003' },
            { id: '550e8400-e29b-41d4-a716-446655440004' },
          ],
        },
      ],
      instructionSections: [
        {
          items: [
            { id: '550e8400-e29b-41d4-a716-446655440005' },
          ],
        },
      ],
    };
    const result = validateUniqueItemIds(data);
    expect(result).toBe(true);
  });
});

// ============================================================================
// Edge Cases and Complex Scenarios
// ============================================================================

describe('Edge Cases', () => {
  describe('Whitespace Handling', () => {
    it('should trim leading and trailing whitespace from ingredient names', () => {
      const item = createValidIngredientItem({ name: '  Sugar  ' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Sugar');
      }
    });

    it('should trim whitespace from instruction content', () => {
      const item = createValidInstructionItem({ content: '  Mix well  ' });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Mix well');
      }
    });

    it('should trim whitespace from section names', () => {
      const section = createValidIngredientSection({ name: '  Dry Ingredients  ' });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Dry Ingredients');
      }
    });

    it('should reject tabs-only section name', () => {
      const section = createValidIngredientSection({ name: '\t\t\t' });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });

    it('should reject newlines-only ingredient name', () => {
      const item = createValidIngredientItem({ name: '\n\n' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('Special Characters in Text', () => {
    it('should accept emoji in ingredient names', () => {
      const item = createValidIngredientItem({ name: '🍎 Apple' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept special punctuation in section names', () => {
      const section = createValidIngredientSection({ name: 'Step 1: Preparation (Important!)' });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should accept HTML entities in instruction content', () => {
      const item = createValidInstructionItem({ content: 'Heat to 350&deg;F' });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept quotes in text', () => {
      const item = createValidIngredientItem({ name: '"Fresh" Basil' });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });

  describe('Boundary Values', () => {
    it('should accept maximum title length', () => {
      const recipe = createValidRecipe({ title: 'a'.repeat(500) });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    });

    it('should reject title exceeding maximum length', () => {
      const recipe = createValidRecipe({ title: 'a'.repeat(501) });
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });

    it('should accept very large order values', () => {
      const section = createValidIngredientSection({ order: 999999 });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should accept very large step numbers', () => {
      const item = createValidInstructionItem({ step: 999999 });
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept very large amounts', () => {
      const item = createValidIngredientItem({ amount: 999999.99 });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });

  describe('Missing Required Fields', () => {
    it('should reject ingredient item missing all required fields', () => {
      const item = {};
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should reject instruction item missing all required fields', () => {
      const item = {};
      const result = strictInstructionItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should reject section missing all required fields', () => {
      const section = {};
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });

    it('should reject recipe missing all required fields', () => {
      const recipe = {};
      const result = strictRecipeWithSectionsSchema.safeParse(recipe);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Coercion', () => {
    it('should not coerce string to number for amount', () => {
      const item = createValidIngredientItem({ amount: '2' as any });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should not coerce string to number for order', () => {
      const section = createValidIngredientSection({ order: '0' as any });
      const result = strictIngredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });

    it('should not coerce number to string for name', () => {
      const item = createValidIngredientItem({ name: 123 as any });
      const result = strictIngredientItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Error Message Quality Tests
// ============================================================================

describe('Error Message Quality', () => {
  it('should provide helpful error message for empty ingredient name', () => {
    const item = createValidIngredientItem({ name: '' });
    const result = strictIngredientItemSchema.safeParse(item);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      expect(errorMessage).toContain('name');
      expect(errorMessage).toContain('empty');
    }
  });

  it('should provide helpful error message for invalid UUID', () => {
    const item = createValidIngredientItem({ id: 'invalid' });
    const result = strictIngredientItemSchema.safeParse(item);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      expect(errorMessage).toContain('Invalid');
      expect(errorMessage).toContain('ID');
      expect(errorMessage).toContain('UUID');
    }
  });

  it('should provide helpful error message for empty section', () => {
    const section = createValidIngredientSection({ items: [] });
    const result = strictIngredientSectionSchema.safeParse(section);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      expect(errorMessage).toContain('at least one');
      expect(errorMessage).toContain('ingredient');
    }
  });

  it('should provide helpful error message for negative order', () => {
    const section = createValidIngredientSection({ order: -1 });
    const result = strictIngredientSectionSchema.safeParse(section);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      expect(errorMessage).toContain('non-negative');
    }
  });

  it('should provide helpful error message for recipe without ingredients', () => {
    const recipe = createValidRecipe({ ingredients: [] });
    const result = strictRecipeWithSectionsSchema.safeParse(recipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message);
      expect(messages.some(m => m.includes('At least one ingredient'))).toBe(true);
    }
  });

  it('should provide clear path in validation errors', () => {
    const recipe = createValidRecipe({ title: '' });
    const result = validateRecipeStrict(recipe);
    expect(result.success).toBe(false);
    if (!result.success && result.errors) {
      const titleError = result.errors.find(e => e.path.includes('title'));
      expect(titleError).toBeDefined();
      expect(titleError?.path).toBe('title');
    }
  });
});

// ============================================================================
// Complex Validation Scenarios
// ============================================================================

describe('Complex Validation Scenarios', () => {
  it('should validate recipe with both flat arrays and sections', () => {
    const recipe = createValidRecipe({
      ingredients: [createValidIngredientItem({ id: validUUID })],
      instructions: [createValidInstructionItem({ id: validUUID2 })],
      ingredientSections: [createValidIngredientSection({ id: validUUID3 })],
      instructionSections: [createValidInstructionSection({ id: '550e8400-e29b-41d4-a716-446655440004' })],
    });
    const result = strictRecipeWithSectionsSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });

  it('should validate recipe with duplicate section names but unique IDs', () => {
    const recipe = createValidRecipe({
      ingredientSections: [
        createValidIngredientSection({ id: validUUID, name: 'Ingredients', order: 0 }),
        createValidIngredientSection({ id: validUUID2, name: 'Ingredients', order: 1 }),
      ],
    });
    const result = strictRecipeWithSectionsSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });

  it('should reject recipe with sections but no items in any section', () => {
    const recipe = createValidRecipe({
      ingredients: [],
      ingredientSections: [
        createValidIngredientSection({ items: [] }),
      ],
    });
    const result = strictRecipeWithSectionsSchema.safeParse(recipe);
    expect(result.success).toBe(false);
  });

  it('should validate deeply nested validation errors', () => {
    const recipe = createValidRecipe({
      ingredientSections: [
        createValidIngredientSection({
          items: [
            createValidIngredientItem({ id: validUUID }),
            createValidIngredientItem({ id: invalidUUID, name: 'Sugar' }),
          ],
        }),
      ],
    });
    const result = strictRecipeWithSectionsSchema.safeParse(recipe);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'));
      expect(paths.some(p => p.includes('ingredientSections'))).toBe(true);
      expect(paths.some(p => p.includes('items'))).toBe(true);
    }
  });

  it('should handle recipe with all optional fields omitted', () => {
    const recipe = {
      title: 'Minimal Recipe',
      ingredients: [createValidIngredientItem()],
      instructions: [createValidInstructionItem()],
    };
    const result = strictRecipeWithSectionsSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });

  it('should validate recipe with maximum complexity', () => {
    const recipe = createValidRecipe({
      ingredientSections: [
        createValidIngredientSection({
          id: validUUID,
          order: 0,
          items: [
            createValidIngredientItem({ id: '550e8400-e29b-41d4-a716-446655440001' }),
            createValidIngredientItem({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Sugar' }),
          ],
        }),
        createValidIngredientSection({
          id: validUUID2,
          order: 1,
          name: 'Wet Ingredients',
          items: [
            createValidIngredientItem({ id: '550e8400-e29b-41d4-a716-446655440003', name: 'Milk' }),
          ],
        }),
      ],
      instructionSections: [
        createValidInstructionSection({
          id: validUUID3,
          order: 0,
          items: [
            createValidInstructionItem({ id: '550e8400-e29b-41d4-a716-446655440004', step: 1 }),
            createValidInstructionItem({ id: '550e8400-e29b-41d4-a716-446655440005', step: 2, content: 'Bake' , position: 0 }),
          ],
        }),
      ],
    });
    const result = strictRecipeWithSectionsSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });
});
