/**
 * Unit tests for useRecipeValidation hook
 * 
 * Tests Requirements: 5.1, 5.2, 5.3, 5.4, 14.1, 14.2, 14.3
 */

import { renderHook, act } from '@testing-library/react';
import { useRecipeValidation } from '../useRecipeValidation';

describe('useRecipeValidation', () => {
  // Helper function to create valid recipe data
  const createValidRecipe = () => ({
    title: 'Test Recipe',
    description: 'A test recipe',
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    // Flat arrays (required)
    ingredients: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Flour',
        amount: 2,
        unit: 'cups',
        sectionId: '550e8400-e29b-41d4-a716-446655440000',
      },
    ],
    instructions: [
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        step: 1,
        content: 'Mix ingredients',
        sectionId: '550e8400-e29b-41d4-a716-446655440002',
      },
    ],
    // Section arrays (optional)
    ingredientSections: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Main Ingredients',
        order: 0,
        items: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
          },
        ],
      },
    ],
    instructionSections: [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Preparation',
        order: 0,
        items: [
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
      },
    ],
  });

  describe('validation state management', () => {
    it('should initialize with valid state (Req 5.1)', () => {
      const { result } = renderHook(() => useRecipeValidation());

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.errorSummary).toBeNull();
    });

    it('should update state to invalid when validation fails (Req 5.2)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '', // Empty name - should fail
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it('should update state to valid when validation passes (Req 5.1)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const validRecipe = createValidRecipe();

      act(() => {
        result.current.validate(validRecipe);
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.errorSummary).toBeNull();
    });

    it('should clear errors when clearErrors is called', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = { title: 'Test' }; // Missing required fields

      act(() => {
        result.current.validate(invalidRecipe);
      });

      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toEqual([]);
      expect(result.current.errorSummary).toBeNull();
    });
  });

  describe('error mapping from Zod errors to field errors', () => {
    it('should map Zod errors to structured ValidationError format (Req 5.2)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '', // Empty name
            order: 0,
            items: [],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      expect(result.current.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.any(Array),
            message: expect.any(String),
          }),
        ])
      );
    });

    it('should create field-level error map with dot-separated paths (Req 5.1)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '', // Empty name
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const nameError = result.current.getFieldError('ingredientSections.0.name');
      expect(nameError).toBeDefined();
      expect(typeof nameError).toBe('string');
    });

    it('should handle multiple errors for different fields (Req 5.2)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '', // Empty name - error 1
            order: 0,
            items: [], // Empty items - error 2
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      expect(result.current.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should store only first error for each field when multiple exist', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'invalid-uuid', // Invalid UUID
            name: '', // Empty name
            order: 0,
            items: [],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const idError = result.current.getFieldError('ingredientSections.0.id');
      expect(idError).toBeDefined();
      expect(typeof idError).toBe('string');
    });
  });

  describe('getFieldError function', () => {
    it('should return error message for invalid field (Req 5.1)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '', // Empty name
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const error = result.current.getFieldError('ingredientSections.0.name');
      expect(error).toBeDefined();
      expect(error).toContain('name');
    });

    it('should return undefined for valid field (Req 5.4)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const validRecipe = createValidRecipe();

      act(() => {
        result.current.validate(validRecipe);
      });

      const error = result.current.getFieldError('ingredientSections.0.name');
      expect(error).toBeUndefined();
    });

    it('should return undefined for non-existent field path', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const validRecipe = createValidRecipe();

      act(() => {
        result.current.validate(validRecipe);
      });

      const error = result.current.getFieldError('nonexistent.field.path');
      expect(error).toBeUndefined();
    });

    it('should handle nested field paths correctly (Req 5.1)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Section',
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: '', // Empty ingredient name
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const error = result.current.getFieldError('ingredientSections.0.items.0.name');
      expect(error).toBeDefined();
    });
  });

  describe('errorSummary computation', () => {
    it('should return null when no errors exist (Req 14.5)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const validRecipe = createValidRecipe();

      act(() => {
        result.current.validate(validRecipe);
      });

      expect(result.current.errorSummary).toBeNull();
    });

    it('should compute error count correctly (Req 14.2)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '', // Error 1
            order: 0,
            items: [], // Error 2
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      expect(result.current.errorSummary).not.toBeNull();
      expect(result.current.errorSummary!.count).toBeGreaterThanOrEqual(2);
    });

    it('should list unique error types (Req 14.3)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '', // Empty name error
            order: 0,
            items: [], // Empty items error
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: '', // Same empty name error
            order: 1,
            items: [], // Same empty items error
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      expect(result.current.errorSummary).not.toBeNull();
      expect(result.current.errorSummary!.types).toBeInstanceOf(Array);
      expect(result.current.errorSummary!.types.length).toBeGreaterThan(0);
      // Should have unique error messages, not duplicates
      const uniqueTypes = new Set(result.current.errorSummary!.types);
      expect(uniqueTypes.size).toBe(result.current.errorSummary!.types.length);
    });

    it('should update immediately when errors change (Req 14.4)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '',
            order: 0,
            items: [],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const firstSummary = result.current.errorSummary;
      expect(firstSummary).not.toBeNull();

      const validRecipe = createValidRecipe();
      act(() => {
        result.current.validate(validRecipe);
      });

      expect(result.current.errorSummary).toBeNull();
    });

    it('should include error summary structure with count and types (Req 14.1)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '',
            order: 0,
            items: [],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      expect(result.current.errorSummary).toMatchObject({
        count: expect.any(Number),
        types: expect.any(Array),
      });
    });
  });

  describe('validation with valid and invalid data', () => {
    it('should return true for valid recipe data', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const validRecipe = createValidRecipe();

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validate(validRecipe);
      });

      expect(isValid).toBe(true);
      expect(result.current.isValid).toBe(true);
    });

    it('should return false for invalid recipe data', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '',
            order: 0,
            items: [],
          },
        ],
      };

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate(invalidRecipe);
      });

      expect(isValid).toBe(false);
      expect(result.current.isValid).toBe(false);
    });

    it('should validate empty section name (Req 5.3)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '', // Empty name
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const error = result.current.getFieldError('ingredientSections.0.name');
      expect(error).toBeDefined();
      expect(error).toMatch(/name/i);
    });

    it('should validate whitespace-only section name (Req 5.3)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '   ', // Whitespace only
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const error = result.current.getFieldError('ingredientSections.0.name');
      expect(error).toBeDefined();
      expect(error).toMatch(/whitespace/i);
    });

    it('should validate empty section items (Req 5.3)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Section Name',
            order: 0,
            items: [], // Empty items
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const error = result.current.getFieldError('ingredientSections.0.items');
      expect(error).toBeDefined();
      expect(error).toMatch(/ingredient/i);
    });

    it('should validate invalid UUID format (Req 5.3)', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'not-a-valid-uuid', // Invalid UUID
            name: 'Section Name',
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const error = result.current.getFieldError('ingredientSections.0.id');
      expect(error).toBeDefined();
      expect(error).toMatch(/uuid|id/i);
    });

    it('should handle recipe with multiple sections', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const validRecipe = {
        title: 'Test Recipe',
        description: 'Test',
        servings: 4,
        prepTime: 15,
        cookTime: 30,
        // Flat arrays (required)
        ingredients: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
            sectionId: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Sugar',
            amount: 1,
            unit: 'cup',
            sectionId: '550e8400-e29b-41d4-a716-446655440002',
          },
        ],
        instructions: [
          {
            id: '550e8400-e29b-41d4-a716-446655440005',
            step: 1,
            content: 'Mix ingredients',
            sectionId: '550e8400-e29b-41d4-a716-446655440004',
          },
        ],
        // Section arrays (optional)
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Section 1',
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Section 2',
            order: 1,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440003',
                name: 'Sugar',
                amount: 1,
                unit: 'cup',
              },
            ],
          },
        ],
        instructionSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            name: 'Preparation',
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440005',
                step: 1,
                content: 'Mix ingredients',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(validRecipe);
      });

      expect(result.current.isValid).toBe(true);
    });
  });

  describe('memoization and performance', () => {
    it('should memoize errorSummary when errors do not change', () => {
      const { result, rerender } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '',
            order: 0,
            items: [],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const firstSummary = result.current.errorSummary;

      // Rerender without changing errors
      rerender();

      const secondSummary = result.current.errorSummary;

      // Should be the same reference (memoized)
      expect(firstSummary).toBe(secondSummary);
    });

    it('should recompute errorSummary when errors change', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe1 = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '',
            order: 0,
            items: [],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe1);
      });

      const firstSummary = result.current.errorSummary;

      const invalidRecipe2 = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'invalid-uuid',
            name: 'Valid Name',
            order: 0,
            items: [],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe2);
      });

      const secondSummary = result.current.errorSummary;

      // Should be different references (recomputed)
      expect(firstSummary).not.toBe(secondSummary);
    });

    it('should memoize getFieldError callback', () => {
      const { result, rerender } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '',
            order: 0,
            items: [],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const firstGetFieldError = result.current.getFieldError;

      // Rerender without changing errors
      rerender();

      const secondGetFieldError = result.current.getFieldError;

      // Should be the same reference (memoized)
      expect(firstGetFieldError).toBe(secondGetFieldError);
    });

    it('should handle rapid successive validations efficiently', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const validRecipe = createValidRecipe();
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: '',
            order: 0,
            items: [],
          },
        ],
      };

      // Perform multiple validations rapidly
      act(() => {
        result.current.validate(validRecipe);
        result.current.validate(invalidRecipe);
        result.current.validate(validRecipe);
        result.current.validate(invalidRecipe);
      });

      // Should end in invalid state
      expect(result.current.isValid).toBe(false);
      expect(result.current.errorSummary).not.toBeNull();
    });

    it('should perform validation in reasonable time', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const largeRecipe = {
        title: 'Large Recipe',
        description: 'Test',
        servings: 4,
        prepTime: 15,
        cookTime: 30,
        ingredientSections: Array.from({ length: 10 }, (_, i) => ({
          id: `550e8400-e29b-41d4-a716-44665544000${i}`,
          name: `Section ${i}`,
          order: i,
          items: Array.from({ length: 10 }, (_, j) => ({
            id: `550e8400-e29b-41d4-a716-44665544${i}${j}00`,
            name: `Ingredient ${i}-${j}`,
            amount: 1,
            unit: 'cup',
          })),
        })),
        instructionSections: Array.from({ length: 10 }, (_, i) => ({
          id: `650e8400-e29b-41d4-a716-44665544000${i}`,
          name: `Step Section ${i}`,
          order: i,
          items: Array.from({ length: 10 }, (_, j) => ({
            id: `650e8400-e29b-41d4-a716-44665544${i}${j}00`,
            step: j + 1,
            content: `Step ${i}-${j}`,
          })),
        })),
      };

      const startTime = performance.now();

      act(() => {
        result.current.validate(largeRecipe);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Validation should complete in under 100ms for large recipe
      expect(duration).toBeLessThan(100);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined data gracefully', () => {
      const { result } = renderHook(() => useRecipeValidation());

      act(() => {
        result.current.validate(undefined);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it('should handle null data gracefully', () => {
      const { result } = renderHook(() => useRecipeValidation());

      act(() => {
        result.current.validate(null);
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty object', () => {
      const { result } = renderHook(() => useRecipeValidation());

      act(() => {
        result.current.validate({});
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it('should handle recipe with no sections', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const recipeWithoutSections = {
        title: 'Test Recipe',
        description: 'Test',
        servings: 4,
        prepTime: 15,
        cookTime: 30,
      };

      act(() => {
        result.current.validate(recipeWithoutSections);
      });

      expect(result.current.isValid).toBe(false);
    });

    it('should handle deeply nested error paths', () => {
      const { result } = renderHook(() => useRecipeValidation());
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Section',
            order: 0,
            items: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: '', // Empty ingredient name
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      act(() => {
        result.current.validate(invalidRecipe);
      });

      const error = result.current.getFieldError('ingredientSections.0.items.0.name');
      expect(error).toBeDefined();
    });
  });
});
