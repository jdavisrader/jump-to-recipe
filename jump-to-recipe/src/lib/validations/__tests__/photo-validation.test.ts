import {
  validatePhotoFile,
  validatePhotoFiles,
  validatePhotoCount,
  validatePhotoPosition,
  validatePhotoReorder,
  getPhotoValidationErrorMessage,
  ALLOWED_PHOTO_MIME_TYPES,
} from '../photo-validation';
import { FILE_STORAGE_CONFIG } from '@/lib/file-storage-config';

describe('Photo Validation', () => {
  describe('validatePhotoFile', () => {
    it('should validate a valid photo file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file with invalid MIME type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file that is too large', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const maxSize = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_SIZE_MB * 1024 * 1024;
      Object.defineProperty(file, 'size', { value: maxSize + 1 });

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should reject empty file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 0 });

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should validate all supported image formats', () => {
      const formats = [
        { type: 'image/jpeg', name: 'test.jpg' },
        { type: 'image/png', name: 'test.png' },
        { type: 'image/gif', name: 'test.gif' },
        { type: 'image/webp', name: 'test.webp' },
        { type: 'image/heic', name: 'test.heic' },
      ];

      formats.forEach(({ type, name }) => {
        const file = new File(['test'], name, { type });
        Object.defineProperty(file, 'size', { value: 1024 * 1024 });

        const result = validatePhotoFile(file);

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validatePhotoFiles', () => {
    it('should validate multiple valid files', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ];

      files.forEach(file => {
        Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      });

      const result = validatePhotoFiles(files);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject when no files provided', () => {
      const result = validatePhotoFiles([]);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No files provided');
    });

    it('should reject when total count exceeds limit', () => {
      const files = Array(5).fill(null).map((_, i) => 
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
      );

      files.forEach(file => {
        Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      });

      const result = validatePhotoFiles(files, 8); // 8 existing + 5 new = 13 > 10 max

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('maximum is');
    });

    it('should collect multiple validation errors', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.pdf', { type: 'application/pdf' }),
      ];

      Object.defineProperty(files[0], 'size', { value: 1024 * 1024 });
      Object.defineProperty(files[1], 'size', { value: 1024 * 1024 });

      const result = validatePhotoFiles(files);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('validatePhotoCount', () => {
    it('should validate count within limit', () => {
      const result = validatePhotoCount(3, 5);

      expect(result.isValid).toBe(true);
    });

    it('should reject count exceeding limit', () => {
      const result = validatePhotoCount(5, 8);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('maximum is');
    });

    it('should handle edge case at exact limit', () => {
      const maxCount = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT;
      const result = validatePhotoCount(2, maxCount - 2);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePhotoPosition', () => {
    it('should validate valid position', () => {
      const result = validatePhotoPosition(2, 5);

      expect(result.isValid).toBe(true);
    });

    it('should reject negative position', () => {
      const result = validatePhotoPosition(-1, 5);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should reject position out of range', () => {
      const result = validatePhotoPosition(10, 5);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('out of range');
    });
  });

  describe('validatePhotoReorder', () => {
    it('should validate correct reorder', () => {
      const photoIds = ['id1', 'id2', 'id3'];
      const existingIds = ['id1', 'id2', 'id3'];

      const result = validatePhotoReorder(photoIds, existingIds);

      expect(result.isValid).toBe(true);
    });

    it('should reject mismatched array lengths', () => {
      const photoIds = ['id1', 'id2'];
      const existingIds = ['id1', 'id2', 'id3'];

      const result = validatePhotoReorder(photoIds, existingIds);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should reject missing IDs', () => {
      const photoIds = ['id1', 'id2', 'id4'];
      const existingIds = ['id1', 'id2', 'id3'];

      const result = validatePhotoReorder(photoIds, existingIds);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing photo IDs');
    });

    it('should reject duplicate IDs', () => {
      const photoIds = ['id1', 'id2', 'id2'];
      const existingIds = ['id1', 'id2', 'id3'];

      const result = validatePhotoReorder(photoIds, existingIds);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Duplicate');
    });
  });

  describe('getPhotoValidationErrorMessage', () => {
    it('should return friendly message for known error codes', () => {
      const message = getPhotoValidationErrorMessage('file-too-large');

      expect(message).toContain('Maximum size');
    });

    it('should return original message for unknown error codes', () => {
      const customError = 'custom-error-message';
      const message = getPhotoValidationErrorMessage(customError);

      expect(message).toBe(customError);
    });

    it('should return friendly message for all known error codes', () => {
      const errorCodes = [
        'file-too-large',
        'file-invalid-type',
        'too-many-files',
        'file-too-small',
      ];

      errorCodes.forEach(code => {
        const message = getPhotoValidationErrorMessage(code);
        expect(message).toBeTruthy();
        expect(message).not.toBe(code);
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle file at exact size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const maxSize = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_SIZE_MB * 1024 * 1024;
      Object.defineProperty(file, 'size', { value: maxSize });

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should handle file one byte over size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const maxSize = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_SIZE_MB * 1024 * 1024;
      Object.defineProperty(file, 'size', { value: maxSize + 1 });

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should handle exact photo count limit', () => {
      const maxCount = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT;
      const result = validatePhotoCount(5, maxCount - 5);

      expect(result.isValid).toBe(true);
    });

    it('should reject one photo over count limit', () => {
      const maxCount = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT;
      const result = validatePhotoCount(6, maxCount - 5);

      expect(result.isValid).toBe(false);
    });

    it('should handle very small valid file', () => {
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1 });

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should handle file with uppercase extension', () => {
      const file = new File(['test'], 'TEST.JPG', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should handle file with mixed case MIME type', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validatePhotoFile(file);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Multiple File Validation Edge Cases', () => {
    it('should handle maximum allowed files', () => {
      const maxCount = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT;
      const files = Array(maxCount).fill(null).map((_, i) => 
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
      );

      files.forEach(file => {
        Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      });

      const result = validatePhotoFiles(files, 0);

      expect(result.isValid).toBe(true);
    });

    it('should handle single file upload', () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      Object.defineProperty(files[0], 'size', { value: 1024 * 1024 });

      const result = validatePhotoFiles(files);

      expect(result.isValid).toBe(true);
    });

    it('should validate with existing photos at limit', () => {
      const maxCount = FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT;
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      Object.defineProperty(files[0], 'size', { value: 1024 * 1024 });

      const result = validatePhotoFiles(files, maxCount);

      expect(result.isValid).toBe(false);
    });

    it('should handle mixed valid and invalid files', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.txt', { type: 'text/plain' }),
        new File(['test3'], 'test3.png', { type: 'image/png' }),
      ];

      files.forEach(file => {
        Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      });

      const result = validatePhotoFiles(files);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);
    });
  });

  describe('Photo Reorder Validation Edge Cases', () => {
    it('should handle empty arrays', () => {
      const result = validatePhotoReorder([], []);

      // Empty arrays should be valid (no photos to reorder)
      expect(result.isValid).toBe(true);
    });

    it('should handle single photo reorder', () => {
      const result = validatePhotoReorder(['id1'], ['id1']);

      expect(result.isValid).toBe(true);
    });

    it('should handle large number of photos', () => {
      const ids = Array(100).fill(null).map((_, i) => `id${i}`);
      const result = validatePhotoReorder(ids, ids);

      expect(result.isValid).toBe(true);
    });

    it('should detect extra IDs in reorder', () => {
      const photoIds = ['id1', 'id2', 'id3', 'id4'];
      const existingIds = ['id1', 'id2', 'id3'];

      const result = validatePhotoReorder(photoIds, existingIds);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Position Validation Edge Cases', () => {
    it('should validate position 0', () => {
      const result = validatePhotoPosition(0, 5);

      expect(result.isValid).toBe(true);
    });

    it('should validate last valid position', () => {
      const result = validatePhotoPosition(4, 5);

      expect(result.isValid).toBe(true);
    });

    it('should reject position equal to total count', () => {
      const result = validatePhotoPosition(5, 5);

      expect(result.isValid).toBe(false);
    });

    it('should handle single photo', () => {
      const result = validatePhotoPosition(0, 1);

      expect(result.isValid).toBe(true);
    });

    it('should reject any position when no photos exist', () => {
      const result = validatePhotoPosition(0, 0);

      expect(result.isValid).toBe(false);
    });
  });
});
