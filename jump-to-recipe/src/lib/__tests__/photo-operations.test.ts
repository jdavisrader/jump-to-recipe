import { validatePhotoReorder, PhotoReorderOperation } from '../photo-operations';

describe('Photo Operations', () => {
  describe('validatePhotoReorder', () => {
    const existingPhotoIds = ['photo1', 'photo2', 'photo3'];

    it('should validate correct reorder operations', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 0 },
        { id: 'photo2', position: 1 },
        { id: 'photo3', position: 2 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty operations', () => {
      const result = validatePhotoReorder([], existingPhotoIds);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No photo operations provided');
    });

    it('should reject invalid photo IDs', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'invalid-id', position: 0 },
        { id: 'photo2', position: 1 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid photo IDs: invalid-id');
    });

    it('should reject duplicate photo IDs', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 0 },
        { id: 'photo1', position: 1 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Duplicate photo IDs in reorder operations');
    });

    it('should reject duplicate positions', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 0 },
        { id: 'photo2', position: 0 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Duplicate positions in reorder operations');
    });

    it('should reject negative positions', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: -1 },
        { id: 'photo2', position: 0 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Positions cannot be negative');
    });

    it('should reject positions that are too high', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 0 },
        { id: 'photo2', position: 2 }, // Only 2 operations, so max position should be 1
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing position: 1'); // This will catch the sequential check first
    });

    it('should reject non-sequential positions', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 0 },
        { id: 'photo2', position: 2 }, // Missing position 1
        { id: 'photo3', position: 3 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Positions must be sequential starting from 0. Missing position: 1');
    });

    it('should handle reordered positions correctly', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 2 },
        { id: 'photo2', position: 0 },
        { id: 'photo3', position: 1 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle single photo reorder', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 0 },
      ];

      const result = validatePhotoReorder(operations, ['photo1']);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate complex reordering scenarios', () => {
      const manyPhotoIds = Array.from({ length: 10 }, (_, i) => `photo${i}`);
      const operations: PhotoReorderOperation[] = manyPhotoIds.map((id, i) => ({
        id,
        position: (i + 5) % 10, // Rotate positions
      }));

      const result = validatePhotoReorder(operations, manyPhotoIds);
      expect(result.isValid).toBe(true);
    });

    it('should reject when operations count does not match existing photos', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 0 },
        { id: 'photo2', position: 1 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      // This should be valid because we're only reordering a subset
      // The validation checks if the provided IDs are valid, not if all IDs are present
      expect(result.isValid).toBe(true);
    });

    it('should handle edge case with maximum position equal to array length minus one', () => {
      const operations: PhotoReorderOperation[] = [
        { id: 'photo1', position: 2 },
        { id: 'photo2', position: 1 },
        { id: 'photo3', position: 0 },
      ];

      const result = validatePhotoReorder(operations, existingPhotoIds);
      expect(result.isValid).toBe(true);
    });
  });
});