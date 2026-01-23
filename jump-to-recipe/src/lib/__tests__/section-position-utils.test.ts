import {
  reindexSectionPositions,
  reindexItemPositions,
  validatePositions,
  resolvePositionConflicts,
  resolveSectionConflicts,
  validateAndFixRecipePositions,
} from '../section-position-utils';

describe('section-position-utils', () => {
  describe('reindexSectionPositions', () => {
    it('should assign sequential positions starting from 0', () => {
      const sections = [
        { id: 'a', position: 5, name: 'First' },
        { id: 'b', position: 2, name: 'Second' },
        { id: 'c', position: 10, name: 'Third' },
      ];

      const result = reindexSectionPositions(sections);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ id: 'b', position: 0 });
      expect(result[1]).toMatchObject({ id: 'a', position: 1 });
      expect(result[2]).toMatchObject({ id: 'c', position: 2 });
    });

    it('should handle empty array', () => {
      const result = reindexSectionPositions([]);
      expect(result).toEqual([]);
    });

    it('should handle single section', () => {
      const sections = [{ id: 'a', position: 99, name: 'Only' }];
      const result = reindexSectionPositions(sections);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(0);
    });

    it('should maintain stable sort when positions are equal', () => {
      const sections = [
        { id: 'c', position: 0, name: 'Third' },
        { id: 'a', position: 0, name: 'First' },
        { id: 'b', position: 0, name: 'Second' },
      ];

      const result = reindexSectionPositions(sections);

      // Should sort by id when positions are equal
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
      expect(result[2].id).toBe('c');
    });

    it('should preserve other properties', () => {
      const sections = [
        { id: 'a', position: 1, name: 'Test', items: [1, 2, 3] },
      ];

      const result = reindexSectionPositions(sections);

      expect(result[0]).toMatchObject({
        id: 'a',
        position: 0,
        name: 'Test',
        items: [1, 2, 3],
      });
    });
  });

  describe('reindexItemPositions', () => {
    it('should assign sequential positions starting from 0', () => {
      const items = [
        { id: 'x', position: 10, text: 'First' },
        { id: 'y', position: 3, text: 'Second' },
        { id: 'z', position: 7, text: 'Third' },
      ];

      const result = reindexItemPositions(items);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ id: 'y', position: 0 });
      expect(result[1]).toMatchObject({ id: 'z', position: 1 });
      expect(result[2]).toMatchObject({ id: 'x', position: 2 });
    });

    it('should handle empty array', () => {
      const result = reindexItemPositions([]);
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const items = [{ id: 'x', position: 42, text: 'Only' }];
      const result = reindexItemPositions(items);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(0);
    });

    it('should maintain stable sort when positions are equal', () => {
      const items = [
        { id: 'z', position: 5, text: 'Third' },
        { id: 'x', position: 5, text: 'First' },
        { id: 'y', position: 5, text: 'Second' },
      ];

      const result = reindexItemPositions(items);

      // Should sort by id when positions are equal
      expect(result[0].id).toBe('x');
      expect(result[1].id).toBe('y');
      expect(result[2].id).toBe('z');
    });

    it('should handle large arrays efficiently', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        position: 1000 - i, // Reverse order
        text: `Item ${i}`,
      }));

      const result = reindexItemPositions(items);

      expect(result).toHaveLength(1000);
      expect(result[0].position).toBe(0);
      expect(result[999].position).toBe(999);
      // Should be in reverse order of original
      expect(result[0].id).toBe('item-999');
      expect(result[999].id).toBe('item-0');
    });
  });

  describe('validatePositions', () => {
    it('should return valid for correct sequential positions', () => {
      const items = [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
        { id: 'c', position: 2 },
      ];

      const result = validatePositions(items);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });

    it('should detect duplicate positions', () => {
      const items = [
        { id: 'a', position: 0 },
        { id: 'b', position: 0 },
        { id: 'c', position: 1 },
      ];

      const result = validatePositions(items);

      expect(result.isValid).toBe(false);
      expect(result.duplicates).toContain(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Duplicate position: 0');
    });

    it('should detect negative positions', () => {
      const items = [
        { id: 'a', position: -1 },
        { id: 'b', position: 0 },
      ];

      const result = validatePositions(items);

      expect(result.isValid).toBe(false);
      expect(result.invalid).toContain(-1);
      expect(result.errors[0]).toContain('Invalid position: -1');
    });

    it('should detect non-integer positions', () => {
      const items = [
        { id: 'a', position: 0.5 },
        { id: 'b', position: 1 },
      ];

      const result = validatePositions(items);

      expect(result.isValid).toBe(false);
      expect(result.invalid).toContain(0.5);
    });

    it('should handle empty array', () => {
      const result = validatePositions([]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect multiple types of errors', () => {
      const items = [
        { id: 'a', position: -1 },
        { id: 'b', position: 0 },
        { id: 'c', position: 0 },
        { id: 'd', position: 1.5 },
      ];

      const result = validatePositions(items);

      expect(result.isValid).toBe(false);
      expect(result.invalid).toContain(-1);
      expect(result.invalid).toContain(1.5);
      expect(result.duplicates).toContain(0);
      expect(result.errors.length).toBeGreaterThan(2);
    });

    it('should allow non-sequential but valid positions', () => {
      const items = [
        { id: 'a', position: 0 },
        { id: 'b', position: 5 },
        { id: 'c', position: 10 },
      ];

      const result = validatePositions(items);

      expect(result.isValid).toBe(true);
    });
  });

  describe('resolvePositionConflicts', () => {
    it('should merge items with last-write-wins strategy', () => {
      const existing = [
        { id: 'a', position: 0, text: 'Old text' },
        { id: 'b', position: 1, text: 'Item B' },
      ];

      const incoming = [
        { id: 'a', position: 0, text: 'New text' },
        { id: 'c', position: 2, text: 'Item C' },
      ];

      const result = resolvePositionConflicts(existing, incoming);

      expect(result).toHaveLength(3);
      // Incoming 'a' should overwrite existing 'a'
      const itemA = result.find((item) => item.id === 'a');
      expect(itemA?.text).toBe('New text');
      // Existing 'b' should be preserved
      expect(result.find((item) => item.id === 'b')).toBeDefined();
      // Incoming 'c' should be added
      expect(result.find((item) => item.id === 'c')).toBeDefined();
    });

    it('should reindex positions after merge', () => {
      const existing = [
        { id: 'a', position: 5, text: 'A' },
        { id: 'b', position: 10, text: 'B' },
      ];

      const incoming = [
        { id: 'c', position: 3, text: 'C' },
        { id: 'd', position: 7, text: 'D' },
      ];

      const result = resolvePositionConflicts(existing, incoming);

      expect(result).toHaveLength(4);
      // All positions should be sequential
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
      expect(result[2].position).toBe(2);
      expect(result[3].position).toBe(3);
    });

    it('should handle empty existing items', () => {
      const incoming = [
        { id: 'a', position: 0, text: 'A' },
        { id: 'b', position: 1, text: 'B' },
      ];

      const result = resolvePositionConflicts([], incoming);

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
    });

    it('should handle empty incoming items', () => {
      const existing = [
        { id: 'a', position: 0, text: 'A' },
        { id: 'b', position: 1, text: 'B' },
      ];

      const result = resolvePositionConflicts(existing, []);

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
    });

    it('should preserve items from other users', () => {
      const existing = [
        { id: 'a', position: 0, text: 'User 1 item' },
        { id: 'b', position: 1, text: 'User 2 item' },
      ];

      const incoming = [
        { id: 'a', position: 0, text: 'User 1 updated' },
      ];

      const result = resolvePositionConflicts(existing, incoming);

      expect(result).toHaveLength(2);
      expect(result.find((item) => item.id === 'b')).toBeDefined();
    });
  });

  describe('resolveSectionConflicts', () => {
    it('should merge sections and resolve item conflicts', () => {
      const existing = [
        {
          id: 's1',
          position: 0,
          name: 'Section 1',
          items: [
            { id: 'a', position: 0, text: 'Old A' },
            { id: 'b', position: 1, text: 'B' },
          ],
        },
      ];

      const incoming = [
        {
          id: 's1',
          position: 0,
          name: 'Section 1 Updated',
          items: [
            { id: 'a', position: 0, text: 'New A' },
            { id: 'c', position: 2, text: 'C' },
          ],
        },
      ];

      const result = resolveSectionConflicts(existing, incoming);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Section 1 Updated');
      expect(result[0].items).toHaveLength(3);
      // Item 'a' should be updated
      const itemA = result[0].items.find((item) => item.id === 'a');
      expect(itemA?.text).toBe('New A');
      // Item 'b' should be preserved
      expect(result[0].items.find((item) => item.id === 'b')).toBeDefined();
      // Item 'c' should be added
      expect(result[0].items.find((item) => item.id === 'c')).toBeDefined();
    });

    it('should preserve sections from other users', () => {
      const existing = [
        {
          id: 's1',
          position: 0,
          name: 'User 1 Section',
          items: [{ id: 'a', position: 0, text: 'A' }],
        },
        {
          id: 's2',
          position: 1,
          name: 'User 2 Section',
          items: [{ id: 'b', position: 0, text: 'B' }],
        },
      ];

      const incoming = [
        {
          id: 's1',
          position: 0,
          name: 'User 1 Section Updated',
          items: [{ id: 'a', position: 0, text: 'A Updated' }],
        },
      ];

      const result = resolveSectionConflicts(existing, incoming);

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.id === 's2')).toBeDefined();
    });

    it('should reindex section and item positions', () => {
      const existing = [
        {
          id: 's1',
          position: 10,
          name: 'Section 1',
          items: [{ id: 'a', position: 5, text: 'A' }],
        },
      ];

      const incoming = [
        {
          id: 's2',
          position: 3,
          name: 'Section 2',
          items: [{ id: 'b', position: 7, text: 'B' }],
        },
      ];

      const result = resolveSectionConflicts(existing, incoming);

      expect(result).toHaveLength(2);
      // Sections should have sequential positions
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
      // Items should have sequential positions
      expect(result[0].items[0].position).toBe(0);
      expect(result[1].items[0].position).toBe(0);
    });

    it('should handle empty existing sections', () => {
      const incoming = [
        {
          id: 's1',
          position: 0,
          name: 'Section 1',
          items: [{ id: 'a', position: 0, text: 'A' }],
        },
      ];

      const result = resolveSectionConflicts([], incoming);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(0);
      expect(result[0].items[0].position).toBe(0);
    });

    it('should handle empty incoming sections', () => {
      const existing = [
        {
          id: 's1',
          position: 0,
          name: 'Section 1',
          items: [{ id: 'a', position: 0, text: 'A' }],
        },
      ];

      const result = resolveSectionConflicts(existing, []);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(0);
    });
  });

  describe('validateAndFixRecipePositions', () => {
    it('should validate and fix all positions in recipe', () => {
      const sections = [
        {
          id: 's1',
          position: 5,
          name: 'Section 1',
          items: [
            { id: 'a', position: 10, text: 'A' },
            { id: 'b', position: 3, text: 'B' },
          ],
        },
        {
          id: 's2',
          position: 2,
          name: 'Section 2',
          items: [{ id: 'c', position: 7, text: 'C' }],
        },
      ];

      const result = validateAndFixRecipePositions(sections);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fixedSections).toHaveLength(2);
      // Sections should be reindexed (s2 comes first because it had position 2, s1 had position 5)
      expect(result.fixedSections[0].id).toBe('s2');
      expect(result.fixedSections[0].position).toBe(0);
      expect(result.fixedSections[1].id).toBe('s1');
      expect(result.fixedSections[1].position).toBe(1);
      // Items should be reindexed (within s1, 'b' had position 3, 'a' had position 10)
      expect(result.fixedSections[1].items[0].id).toBe('b');
      expect(result.fixedSections[1].items[0].position).toBe(0);
      expect(result.fixedSections[1].items[1].id).toBe('a');
      expect(result.fixedSections[1].items[1].position).toBe(1);
    });

    it('should detect validation errors', () => {
      const sections = [
        {
          id: 's1',
          position: -1,
          name: 'Section 1',
          items: [
            { id: 'a', position: 0, text: 'A' },
            { id: 'b', position: 0, text: 'B' },
          ],
        },
      ];

      const result = validateAndFixRecipePositions(sections);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should still provide fixed sections
      expect(result.fixedSections).toHaveLength(1);
      expect(result.fixedSections[0].position).toBe(0);
    });

    it('should handle empty sections array', () => {
      const result = validateAndFixRecipePositions([]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fixedSections).toEqual([]);
    });

    it('should report errors with section context', () => {
      const sections = [
        {
          id: 's1',
          position: 0,
          name: 'Section 1',
          items: [
            { id: 'a', position: -1, text: 'A' },
          ],
        },
      ];

      const result = validateAndFixRecipePositions(sections);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Section 0');
      expect(result.errors[0]).toContain('s1');
    });
  });
});
