/**
 * Multi-User Safety Tests
 * 
 * Tests for concurrent edit handling, ID uniqueness validation,
 * and position conflict resolution in recipe API routes.
 * 
 * Requirements tested:
 * - 12.1: UUID v4 for section and item IDs
 * - 12.2: Last-write-wins for concurrent edits
 * - 12.3: Position conflict resolution
 * - 12.4: Unique ID validation
 * - 12.5: Clear error messages for duplicate IDs
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { 
  validateUniqueSectionIds, 
  validateUniqueItemIds 
} from '@/lib/validations/recipe-sections';
import { 
  resolveSectionConflicts,
  validateAndFixRecipePositions
} from '@/lib/section-position-utils';

describe('Multi-User Safety - ID Uniqueness', () => {
  describe('validateUniqueSectionIds', () => {
    it('should return true when all section IDs are unique', () => {
      const data = {
        ingredientSections: [
          { id: uuidv4(), name: 'Section 1', position: 0, items: [] },
          { id: uuidv4(), name: 'Section 2', position: 1, items: [] },
        ],
        instructionSections: [
          { id: uuidv4(), name: 'Section 3', position: 0, items: [] },
        ],
      };

      expect(validateUniqueSectionIds(data)).toBe(true);
    });

    it('should return false when duplicate section IDs exist within ingredient sections', () => {
      const duplicateId = uuidv4();
      const data = {
        ingredientSections: [
          { id: duplicateId, name: 'Section 1', position: 0, items: [] },
          { id: duplicateId, name: 'Section 2', position: 1, items: [] },
        ],
      };

      expect(validateUniqueSectionIds(data)).toBe(false);
    });

    it('should return false when duplicate section IDs exist across ingredient and instruction sections', () => {
      const duplicateId = uuidv4();
      const data = {
        ingredientSections: [
          { id: duplicateId, name: 'Section 1', position: 0, items: [] },
        ],
        instructionSections: [
          { id: duplicateId, name: 'Section 2', position: 0, items: [] },
        ],
      };

      expect(validateUniqueSectionIds(data)).toBe(false);
    });

    it('should return true when sections are undefined', () => {
      const data = {};
      expect(validateUniqueSectionIds(data)).toBe(true);
    });

    it('should return true when sections are empty arrays', () => {
      const data = {
        ingredientSections: [],
        instructionSections: [],
      };
      expect(validateUniqueSectionIds(data)).toBe(true);
    });
  });

  describe('validateUniqueItemIds', () => {
    it('should return true when all item IDs are unique', () => {
      const data = {
        ingredientSections: [
          {
            id: uuidv4(),
            name: 'Section 1',
            position: 0,
            items: [
              { id: uuidv4(), name: 'Item 1', amount: 1, unit: 'cup' },
              { id: uuidv4(), name: 'Item 2', amount: 2, unit: 'tbsp' },
            ],
          },
        ],
        instructionSections: [
          {
            id: uuidv4(),
            name: 'Section 2',
            position: 0,
            items: [
              { id: uuidv4(), step: 1, content: 'Step 1' },
              { id: uuidv4(), step: 2, content: 'Step 2' },
            ],
          },
        ],
      };

      expect(validateUniqueItemIds(data)).toBe(true);
    });

    it('should return false when duplicate item IDs exist within a section', () => {
      const duplicateId = uuidv4();
      const data = {
        ingredientSections: [
          {
            id: uuidv4(),
            name: 'Section 1',
            position: 0,
            items: [
              { id: duplicateId, name: 'Item 1', amount: 1, unit: 'cup' },
              { id: duplicateId, name: 'Item 2', amount: 2, unit: 'tbsp' },
            ],
          },
        ],
      };

      expect(validateUniqueItemIds(data)).toBe(false);
    });

    it('should return false when duplicate item IDs exist across sections', () => {
      const duplicateId = uuidv4();
      const data = {
        ingredientSections: [
          {
            id: uuidv4(),
            name: 'Section 1',
            position: 0,
            items: [
              { id: duplicateId, name: 'Item 1', amount: 1, unit: 'cup' },
            ],
          },
          {
            id: uuidv4(),
            name: 'Section 2',
            position: 1,
            items: [
              { id: duplicateId, name: 'Item 2', amount: 2, unit: 'tbsp' },
            ],
          },
        ],
      };

      expect(validateUniqueItemIds(data)).toBe(false);
    });

    it('should return false when duplicate item IDs exist across ingredient and instruction sections', () => {
      const duplicateId = uuidv4();
      const data = {
        ingredientSections: [
          {
            id: uuidv4(),
            name: 'Section 1',
            position: 0,
            items: [
              { id: duplicateId, name: 'Item 1', amount: 1, unit: 'cup' },
            ],
          },
        ],
        instructionSections: [
          {
            id: uuidv4(),
            name: 'Section 2',
            position: 0,
            items: [
              { id: duplicateId, step: 1, content: 'Step 1' },
            ],
          },
        ],
      };

      expect(validateUniqueItemIds(data)).toBe(false);
    });

    it('should return true when sections have no items', () => {
      const data = {
        ingredientSections: [
          { id: uuidv4(), name: 'Section 1', position: 0, items: [] },
        ],
      };

      expect(validateUniqueItemIds(data)).toBe(true);
    });
  });
});

describe('Multi-User Safety - Position Conflict Resolution', () => {
  describe('resolveSectionConflicts', () => {
    it('should merge sections with last-write-wins strategy', () => {
      const sectionId1 = uuidv4();
      const sectionId2 = uuidv4();
      const itemId1 = uuidv4();
      const itemId2 = uuidv4();

      const existing = [
        {
          id: sectionId1,
          name: 'Old Name',
          position: 0,
          items: [
            { id: itemId1, name: 'Old Item', amount: 1, unit: 'cup', position: 0 },
          ],
        },
        {
          id: sectionId2,
          name: 'Section 2',
          position: 1,
          items: [
            { id: itemId2, name: 'Item 2', amount: 2, unit: 'tbsp', position: 0 },
          ],
        },
      ];

      const incoming = [
        {
          id: sectionId1,
          name: 'New Name',
          position: 0,
          items: [
            { id: itemId1, name: 'New Item', amount: 2, unit: 'cups', position: 0 },
          ],
        },
      ];

      const result = resolveSectionConflicts(existing, incoming);

      // Should have 2 sections (incoming + existing not in incoming)
      expect(result).toHaveLength(2);
      
      // First section should have updated name (last-write-wins)
      expect(result[0].name).toBe('New Name');
      expect(result[0].items[0].name).toBe('New Item');
      
      // Second section should be preserved
      expect(result[1].id).toBe(sectionId2);
      expect(result[1].name).toBe('Section 2');
    });

    it('should preserve sections added by other users', () => {
      const sectionId1 = uuidv4();
      const sectionId2 = uuidv4();
      const sectionId3 = uuidv4();

      const existing = [
        { id: sectionId1, name: 'Section 1', position: 0, items: [] },
        { id: sectionId2, name: 'Section 2', position: 1, items: [] },
        { id: sectionId3, name: 'Section 3', position: 2, items: [] },
      ];

      const incoming = [
        { id: sectionId1, name: 'Updated Section 1', position: 0, items: [] },
      ];

      const result = resolveSectionConflicts(existing, incoming);

      // Should have all 3 sections
      expect(result).toHaveLength(3);
      
      // First section should be updated
      expect(result[0].name).toBe('Updated Section 1');
      
      // Other sections should be preserved
      expect(result.find(s => s.id === sectionId2)).toBeDefined();
      expect(result.find(s => s.id === sectionId3)).toBeDefined();
    });

    it('should reindex positions after merging', () => {
      const sectionId1 = uuidv4();
      const sectionId2 = uuidv4();

      const existing = [
        { id: sectionId1, name: 'Section 1', position: 5, items: [] },
      ];

      const incoming = [
        { id: sectionId2, name: 'Section 2', position: 10, items: [] },
      ];

      const result = resolveSectionConflicts(existing, incoming);

      // Positions should be reindexed to 0, 1
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
    });

    it('should handle empty existing sections', () => {
      const sectionId = uuidv4();
      const incoming = [
        { id: sectionId, name: 'Section 1', position: 0, items: [] },
      ];

      const result = resolveSectionConflicts([], incoming);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(sectionId);
      expect(result[0].position).toBe(0);
    });

    it('should handle empty incoming sections', () => {
      const sectionId = uuidv4();
      const existing = [
        { id: sectionId, name: 'Section 1', position: 0, items: [] },
      ];

      const result = resolveSectionConflicts(existing, []);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(sectionId);
      expect(result[0].position).toBe(0);
    });
  });

  describe('validateAndFixRecipePositions', () => {
    it('should detect and fix duplicate positions', () => {
      const sections = [
        {
          id: uuidv4(),
          name: 'Section 1',
          position: 0,
          items: [
            { id: uuidv4(), name: 'Item 1', amount: 1, unit: 'cup', position: 0 },
            { id: uuidv4(), name: 'Item 2', amount: 2, unit: 'tbsp', position: 0 },
          ],
        },
      ];

      const result = validateAndFixRecipePositions(sections);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.fixedSections[0].items[0].position).toBe(0);
      expect(result.fixedSections[0].items[1].position).toBe(1);
    });

    it('should detect and fix negative positions', () => {
      const sections = [
        {
          id: uuidv4(),
          name: 'Section 1',
          position: 0,
          items: [
            { id: uuidv4(), name: 'Item 1', amount: 1, unit: 'cup', position: -1 },
          ],
        },
      ];

      const result = validateAndFixRecipePositions(sections);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.fixedSections[0].items[0].position).toBe(0);
    });

    it('should reindex section positions', () => {
      const sections = [
        {
          id: uuidv4(),
          name: 'Section 1',
          position: 5,
          items: [],
        },
        {
          id: uuidv4(),
          name: 'Section 2',
          position: 10,
          items: [],
        },
      ];

      const result = validateAndFixRecipePositions(sections);

      expect(result.fixedSections[0].position).toBe(0);
      expect(result.fixedSections[1].position).toBe(1);
    });

    it('should return valid for already valid positions', () => {
      const sections = [
        {
          id: uuidv4(),
          name: 'Section 1',
          position: 0,
          items: [
            { id: uuidv4(), name: 'Item 1', amount: 1, unit: 'cup', position: 0 },
            { id: uuidv4(), name: 'Item 2', amount: 2, unit: 'tbsp', position: 1 },
          ],
        },
      ];

      const result = validateAndFixRecipePositions(sections);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty sections array', () => {
      const result = validateAndFixRecipePositions([]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fixedSections).toHaveLength(0);
    });
  });
});

describe('Multi-User Safety - UUID v4 Format', () => {
  it('should generate valid UUID v4 format', () => {
    const id = uuidv4();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    expect(id).toMatch(uuidRegex);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(uuidv4());
    }
    
    // All 1000 IDs should be unique
    expect(ids.size).toBe(1000);
  });

  it('should generate IDs that pass validation schema', () => {
    const id = uuidv4();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    expect(id).toMatch(uuidRegex);
  });
});
