import {
  reindexSectionPositions,
  reindexItemPositions,
  validatePositions,
  resolvePositionConflicts,
  resolveSectionConflicts,
  validateAndFixRecipePositions,
  reorderWithinSection,
  moveBetweenSections,
  normalizePositions,
  getNextPosition,
} from '../section-position-utils';

describe('section-position-utils', () => {
  describe('reindexSectionPositions', () => {
    it('should assign sequential positions starting from 0', () => {
      const sections = [
        { id: 'a', position: 5, name: 'First', items: [] },
        { id: 'b', position: 2, name: 'Second', items: [] },
        { id: 'c', position: 10, name: 'Third', items: [] },
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
      const sections = [{ id: 'a', position: 99, name: 'Only', items: [] }];
      const result = reindexSectionPositions(sections);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(0);
    });

    it('should maintain stable sort when positions are equal', () => {
      const sections = [
        { id: 'c', position: 0, name: 'Third', items: [] },
        { id: 'a', position: 0, name: 'First', items: [] },
        { id: 'b', position: 0, name: 'Second', items: [] },
      ];

      const result = reindexSectionPositions(sections);

      // Should sort by id when positions are equal
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
      expect(result[2].id).toBe('c');
    });

    it('should preserve other properties', () => {
      const sections = [
        { id: 'a', position: 1, name: 'Test', items: [{ id: '1', position: 0 }, { id: '2', position: 1 }, { id: '3', position: 2 }] },
      ];

      const result = reindexSectionPositions(sections);

      expect(result[0]).toMatchObject({
        id: 'a',
        position: 0,
        name: 'Test',
        items: [{ id: '1', position: 0 }, { id: '2', position: 1 }, { id: '3', position: 2 }],
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
    it('should use incoming items as authoritative (last-write-wins)', () => {
      const existing = [
        { id: 'a', position: 0, text: 'Old text' },
        { id: 'b', position: 1, text: 'Item B' },
      ];

      const incoming = [
        { id: 'a', position: 0, text: 'New text' },
        { id: 'c', position: 2, text: 'Item C' },
      ];

      const result = resolvePositionConflicts(existing, incoming);

      // Incoming is authoritative — only 'a' and 'c' should be present
      expect(result).toHaveLength(2);
      const itemA = result.find((item) => item.id === 'a');
      expect(itemA?.text).toBe('New text');
      // Existing 'b' was not in incoming, so it's dropped
      expect(result.find((item) => item.id === 'b')).toBeUndefined();
      expect(result.find((item) => item.id === 'c')).toBeDefined();
    });

    it('should reindex positions from incoming items', () => {
      const existing = [
        { id: 'a', position: 5, text: 'A' },
        { id: 'b', position: 10, text: 'B' },
      ];

      const incoming = [
        { id: 'c', position: 3, text: 'C' },
        { id: 'd', position: 7, text: 'D' },
      ];

      const result = resolvePositionConflicts(existing, incoming);

      // Only incoming items should be present
      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
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

    it('should treat empty incoming items as intentionally emptied', () => {
      const existing = [
        { id: 'a', position: 0, text: 'A' },
        { id: 'b', position: 1, text: 'B' },
      ];

      const result = resolvePositionConflicts(existing, []);

      // Empty incoming array means the section was intentionally emptied
      // (e.g., all items moved to another section via drag-and-drop)
      expect(result).toHaveLength(0);
    });

    it('should treat incoming items as authoritative (last-write-wins)', () => {
      const existing = [
        { id: 'a', position: 0, text: 'User 1 item' },
        { id: 'b', position: 1, text: 'User 2 item' },
      ];

      const incoming = [
        { id: 'a', position: 0, text: 'User 1 updated' },
      ];

      const result = resolvePositionConflicts(existing, incoming);

      // Incoming is authoritative — item 'b' was intentionally removed
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
      expect(result[0].text).toBe('User 1 updated');
    });
  });

  describe('resolveSectionConflicts', () => {
    it('should use incoming sections as authoritative and not merge items from existing', () => {
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
      // Incoming is authoritative — only items 'a' and 'c' should be present
      expect(result[0].items).toHaveLength(2);
      const itemA = result[0].items.find((item) => item.id === 'a');
      expect(itemA?.text).toBe('New A');
      // Item 'b' was intentionally removed (not in incoming)
      expect(result[0].items.find((item) => item.id === 'b')).toBeUndefined();
      expect(result[0].items.find((item) => item.id === 'c')).toBeDefined();
    });

    it('should not preserve sections absent from incoming (incoming is authoritative)', () => {
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

      // Incoming is authoritative — section s2 was intentionally removed
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
      expect(result.find((s) => s.id === 's2')).toBeUndefined();
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

      // Only incoming section s2 should be present (incoming is authoritative)
      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(0);
      expect(result[0].items[0].position).toBe(0);
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

    it('should treat empty incoming sections as intentionally emptied', () => {
      const existing = [
        {
          id: 's1',
          position: 0,
          name: 'Section 1',
          items: [{ id: 'a', position: 0, text: 'A' }],
        },
      ];

      const result = resolveSectionConflicts(existing, []);

      // Empty incoming array means all sections were intentionally removed
      expect(result).toHaveLength(0);
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

  describe('reorderWithinSection', () => {
    it('should reorder item from start to end', () => {
      const items = [
        { id: 'a', position: 0, name: 'First' },
        { id: 'b', position: 1, name: 'Second' },
        { id: 'c', position: 2, name: 'Third' },
      ];

      const result = reorderWithinSection(items, 0, 2);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ id: 'b', position: 0 });
      expect(result[1]).toMatchObject({ id: 'c', position: 1 });
      expect(result[2]).toMatchObject({ id: 'a', position: 2 });
    });

    it('should reorder item from end to start', () => {
      const items = [
        { id: 'a', position: 0, name: 'First' },
        { id: 'b', position: 1, name: 'Second' },
        { id: 'c', position: 2, name: 'Third' },
      ];

      const result = reorderWithinSection(items, 2, 0);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ id: 'c', position: 0 });
      expect(result[1]).toMatchObject({ id: 'a', position: 1 });
      expect(result[2]).toMatchObject({ id: 'b', position: 2 });
    });

    it('should handle reordering to same position', () => {
      const items = [
        { id: 'a', position: 0, name: 'First' },
        { id: 'b', position: 1, name: 'Second' },
      ];

      const result = reorderWithinSection(items, 1, 1);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'a', position: 0 });
      expect(result[1]).toMatchObject({ id: 'b', position: 1 });
    });

    it('should throw error for invalid source index', () => {
      const items = [
        { id: 'a', position: 0, name: 'First' },
      ];

      expect(() => reorderWithinSection(items, -1, 0)).toThrow('Invalid indices');
      expect(() => reorderWithinSection(items, 5, 0)).toThrow('Invalid indices');
    });

    it('should throw error for invalid destination index', () => {
      const items = [
        { id: 'a', position: 0, name: 'First' },
      ];

      expect(() => reorderWithinSection(items, 0, -1)).toThrow('Invalid indices');
      expect(() => reorderWithinSection(items, 0, 5)).toThrow('Invalid indices');
    });

    it('should handle empty array', () => {
      const result = reorderWithinSection([], 0, 0);
      expect(result).toEqual([]);
    });

    it('should preserve all item properties', () => {
      const items = [
        { id: 'a', position: 0, name: 'First', extra: 'data' },
        { id: 'b', position: 1, name: 'Second', extra: 'more' },
      ];

      const result = reorderWithinSection(items, 0, 1);

      expect(result[1]).toMatchObject({
        id: 'a',
        position: 1,
        name: 'First',
        extra: 'data',
      });
    });
  });

  describe('moveBetweenSections', () => {
    it('should move item from source to destination', () => {
      const source = [
        { id: 'a', position: 0, name: 'Item A' },
        { id: 'b', position: 1, name: 'Item B' },
      ];
      const dest = [
        { id: 'c', position: 0, name: 'Item C' },
      ];

      const result = moveBetweenSections(source, dest, 0, 1);

      expect(result.sourceItems).toHaveLength(1);
      expect(result.sourceItems[0]).toMatchObject({ id: 'b', position: 0 });

      expect(result.destItems).toHaveLength(2);
      expect(result.destItems[0]).toMatchObject({ id: 'c', position: 0 });
      expect(result.destItems[1]).toMatchObject({ id: 'a', position: 1 });
    });

    it('should move item to start of destination', () => {
      const source = [
        { id: 'a', position: 0, name: 'Item A' },
      ];
      const dest = [
        { id: 'b', position: 0, name: 'Item B' },
        { id: 'c', position: 1, name: 'Item C' },
      ];

      const result = moveBetweenSections(source, dest, 0, 0);

      expect(result.sourceItems).toHaveLength(0);
      expect(result.destItems).toHaveLength(3);
      expect(result.destItems[0]).toMatchObject({ id: 'a', position: 0 });
      expect(result.destItems[1]).toMatchObject({ id: 'b', position: 1 });
      expect(result.destItems[2]).toMatchObject({ id: 'c', position: 2 });
    });

    it('should move item to empty destination', () => {
      const source = [
        { id: 'a', position: 0, name: 'Item A' },
        { id: 'b', position: 1, name: 'Item B' },
      ];
      const dest: any[] = [];

      const result = moveBetweenSections(source, dest, 1, 0);

      expect(result.sourceItems).toHaveLength(1);
      expect(result.sourceItems[0]).toMatchObject({ id: 'a', position: 0 });

      expect(result.destItems).toHaveLength(1);
      expect(result.destItems[0]).toMatchObject({ id: 'b', position: 0 });
    });

    it('should throw error for empty source', () => {
      const dest = [{ id: 'a', position: 0, name: 'Item A' }];

      expect(() => moveBetweenSections([], dest, 0, 0)).toThrow('Source items array is empty');
    });

    it('should throw error for invalid source index', () => {
      const source = [{ id: 'a', position: 0, name: 'Item A' }];
      const dest = [{ id: 'b', position: 0, name: 'Item B' }];

      expect(() => moveBetweenSections(source, dest, -1, 0)).toThrow('Invalid source index');
      expect(() => moveBetweenSections(source, dest, 5, 0)).toThrow('Invalid source index');
    });

    it('should throw error for invalid destination index', () => {
      const source = [{ id: 'a', position: 0, name: 'Item A' }];
      const dest = [{ id: 'b', position: 0, name: 'Item B' }];

      expect(() => moveBetweenSections(source, dest, 0, -1)).toThrow('Invalid destination index');
      expect(() => moveBetweenSections(source, dest, 0, 5)).toThrow('Invalid destination index');
    });

    it('should preserve all item properties', () => {
      const source = [
        { id: 'a', position: 0, name: 'Item A', extra: 'data', nested: { value: 1 } },
      ];
      const dest = [
        { id: 'b', position: 0, name: 'Item B' },
      ];

      const result = moveBetweenSections(source, dest, 0, 0);

      expect(result.destItems[0]).toMatchObject({
        id: 'a',
        position: 0,
        name: 'Item A',
        extra: 'data',
        nested: { value: 1 },
      });
    });
  });

  describe('normalizePositions', () => {
    it('should normalize non-sequential positions', () => {
      const items = [
        { id: 'a', position: 5, name: 'First' },
        { id: 'b', position: 10, name: 'Second' },
        { id: 'c', position: 3, name: 'Third' },
      ];

      const result = normalizePositions(items);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ id: 'c', position: 0 });
      expect(result[1]).toMatchObject({ id: 'a', position: 1 });
      expect(result[2]).toMatchObject({ id: 'b', position: 2 });
    });

    it('should handle already normalized positions', () => {
      const items = [
        { id: 'a', position: 0, name: 'First' },
        { id: 'b', position: 1, name: 'Second' },
      ];

      const result = normalizePositions(items);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'a', position: 0 });
      expect(result[1]).toMatchObject({ id: 'b', position: 1 });
    });

    it('should handle empty array', () => {
      const result = normalizePositions([]);
      expect(result).toEqual([]);
    });
  });

  describe('getNextPosition', () => {
    it('should return 0 for empty array', () => {
      const result = getNextPosition([]);
      expect(result).toBe(0);
    });

    it('should return max position plus one', () => {
      const items = [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
        { id: 'c', position: 2 },
      ];

      const result = getNextPosition(items);
      expect(result).toBe(3);
    });

    it('should handle non-sequential positions', () => {
      const items = [
        { id: 'a', position: 5 },
        { id: 'b', position: 10 },
        { id: 'c', position: 3 },
      ];

      const result = getNextPosition(items);
      expect(result).toBe(11);
    });

    it('should handle single item', () => {
      const items = [
        { id: 'a', position: 0 },
      ];

      const result = getNextPosition(items);
      expect(result).toBe(1);
    });

    it('should handle undefined array', () => {
      const result = getNextPosition(undefined as any);
      expect(result).toBe(0);
    });
  });
});
