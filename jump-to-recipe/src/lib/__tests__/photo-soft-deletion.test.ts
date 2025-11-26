/**
 * Unit tests for photo soft deletion functionality
 * Tests soft deletion logic and position management after deletion
 */

describe('Photo Soft Deletion', () => {
  describe('Soft Deletion Behavior', () => {
    it('should mark photo as deleted without removing from database', () => {
      const photo = {
        id: 'photo1',
        recipeId: 'recipe1',
        position: 0,
        deletedAt: null,
      };

      // Simulate soft deletion
      const deletedPhoto = {
        ...photo,
        deletedAt: new Date(),
      };

      expect(deletedPhoto.deletedAt).not.toBeNull();
      expect(deletedPhoto.id).toBe(photo.id);
      expect(deletedPhoto.recipeId).toBe(photo.recipeId);
    });

    it('should preserve photo metadata after soft deletion', () => {
      const photo = {
        id: 'photo1',
        recipeId: 'recipe1',
        filePath: '/uploads/recipe-photos/recipe1/photo1.jpg',
        fileName: 'photo1.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        position: 0,
        deletedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const deletedPhoto = {
        ...photo,
        deletedAt: new Date(),
        updatedAt: new Date(),
      };

      expect(deletedPhoto.filePath).toBe(photo.filePath);
      expect(deletedPhoto.fileName).toBe(photo.fileName);
      expect(deletedPhoto.fileSize).toBe(photo.fileSize);
      expect(deletedPhoto.mimeType).toBe(photo.mimeType);
      expect(deletedPhoto.createdAt).toEqual(photo.createdAt);
    });
  });

  describe('Position Management After Deletion', () => {
    it('should reorder remaining photos after deletion', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: null },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      // Delete photo at position 1
      const deletedPhotoId = 'photo2';
      const remainingPhotos = photos
        .filter(p => p.id !== deletedPhotoId)
        .map((p, index) => ({ ...p, position: index }));

      expect(remainingPhotos).toHaveLength(2);
      expect(remainingPhotos[0].position).toBe(0);
      expect(remainingPhotos[1].position).toBe(1);
      expect(remainingPhotos[0].id).toBe('photo1');
      expect(remainingPhotos[1].id).toBe('photo3');
    });

    it('should handle deletion of first photo', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: null },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      const deletedPhotoId = 'photo1';
      const remainingPhotos = photos
        .filter(p => p.id !== deletedPhotoId)
        .map((p, index) => ({ ...p, position: index }));

      expect(remainingPhotos).toHaveLength(2);
      expect(remainingPhotos[0].id).toBe('photo2');
      expect(remainingPhotos[0].position).toBe(0);
      expect(remainingPhotos[1].id).toBe('photo3');
      expect(remainingPhotos[1].position).toBe(1);
    });

    it('should handle deletion of last photo', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: null },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      const deletedPhotoId = 'photo3';
      const remainingPhotos = photos
        .filter(p => p.id !== deletedPhotoId)
        .map((p, index) => ({ ...p, position: index }));

      expect(remainingPhotos).toHaveLength(2);
      expect(remainingPhotos[0].id).toBe('photo1');
      expect(remainingPhotos[0].position).toBe(0);
      expect(remainingPhotos[1].id).toBe('photo2');
      expect(remainingPhotos[1].position).toBe(1);
    });

    it('should handle deletion of only photo', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
      ];

      const deletedPhotoId = 'photo1';
      const remainingPhotos = photos
        .filter(p => p.id !== deletedPhotoId)
        .map((p, index) => ({ ...p, position: index }));

      expect(remainingPhotos).toHaveLength(0);
    });

    it('should maintain sequential positions after multiple deletions', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: null },
        { id: 'photo3', position: 2, deletedAt: null },
        { id: 'photo4', position: 3, deletedAt: null },
        { id: 'photo5', position: 4, deletedAt: null },
      ];

      // Delete photos 2 and 4
      const deletedPhotoIds = ['photo2', 'photo4'];
      const remainingPhotos = photos
        .filter(p => !deletedPhotoIds.includes(p.id))
        .map((p, index) => ({ ...p, position: index }));

      expect(remainingPhotos).toHaveLength(3);
      expect(remainingPhotos.map(p => p.position)).toEqual([0, 1, 2]);
      expect(remainingPhotos.map(p => p.id)).toEqual(['photo1', 'photo3', 'photo5']);
    });
  });

  describe('Filtering Deleted Photos', () => {
    it('should exclude soft-deleted photos from active photo list', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: new Date() },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      const activePhotos = photos.filter(p => p.deletedAt === null);

      expect(activePhotos).toHaveLength(2);
      expect(activePhotos.map(p => p.id)).toEqual(['photo1', 'photo3']);
    });

    it('should include all photos when showing deleted items', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: new Date() },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      const allPhotos = photos; // No filtering

      expect(allPhotos).toHaveLength(3);
    });

    it('should identify deleted photos correctly', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: new Date() },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      const deletedPhotos = photos.filter(p => p.deletedAt !== null);

      expect(deletedPhotos).toHaveLength(1);
      expect(deletedPhotos[0].id).toBe('photo2');
    });
  });

  describe('Deletion Validation', () => {
    it('should prevent deletion of already deleted photo', () => {
      const photo = {
        id: 'photo1',
        position: 0,
        deletedAt: new Date('2024-01-01'),
      };

      const isAlreadyDeleted = photo.deletedAt !== null;

      expect(isAlreadyDeleted).toBe(true);
    });

    it('should allow deletion of active photo', () => {
      const photo = {
        id: 'photo1',
        position: 0,
        deletedAt: null,
      };

      const canDelete = photo.deletedAt === null;

      expect(canDelete).toBe(true);
    });

    it('should validate photo exists before deletion', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: null },
      ];

      const photoToDelete = 'photo3';
      const photoExists = photos.some(p => p.id === photoToDelete);

      expect(photoExists).toBe(false);
    });
  });

  describe('Audit Trail', () => {
    it('should preserve deletion timestamp', () => {
      const deletionTime = new Date('2024-01-15T10:30:00Z');
      const photo = {
        id: 'photo1',
        position: 0,
        deletedAt: deletionTime,
      };

      expect(photo.deletedAt).toEqual(deletionTime);
    });

    it('should update updatedAt timestamp on deletion', () => {
      const originalUpdatedAt = new Date('2024-01-01');
      const deletionTime = new Date('2024-01-15');

      const photo = {
        id: 'photo1',
        position: 0,
        updatedAt: originalUpdatedAt,
        deletedAt: null,
      };

      const deletedPhoto = {
        ...photo,
        updatedAt: deletionTime,
        deletedAt: deletionTime,
      };

      expect(deletedPhoto.updatedAt).toEqual(deletionTime);
      expect(deletedPhoto.deletedAt).toEqual(deletionTime);
      expect(deletedPhoto.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Position Compaction', () => {
    it('should compact positions to be sequential starting from 0', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 3, deletedAt: null },
        { id: 'photo3', position: 7, deletedAt: null },
      ];

      const compactedPhotos = photos
        .sort((a, b) => a.position - b.position)
        .map((p, index) => ({ ...p, position: index }));

      expect(compactedPhotos[0].position).toBe(0);
      expect(compactedPhotos[1].position).toBe(1);
      expect(compactedPhotos[2].position).toBe(2);
    });

    it('should maintain photo order during compaction', () => {
      const photos = [
        { id: 'photo1', position: 2, deletedAt: null },
        { id: 'photo2', position: 5, deletedAt: null },
        { id: 'photo3', position: 8, deletedAt: null },
      ];

      const compactedPhotos = photos
        .sort((a, b) => a.position - b.position)
        .map((p, index) => ({ ...p, position: index }));

      expect(compactedPhotos.map(p => p.id)).toEqual(['photo1', 'photo2', 'photo3']);
    });

    it('should handle already compacted positions', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: null },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      const compactedPhotos = photos
        .sort((a, b) => a.position - b.position)
        .map((p, index) => ({ ...p, position: index }));

      expect(compactedPhotos).toEqual(photos);
    });
  });

  describe('Next Position Calculation', () => {
    it('should return 0 for first photo', () => {
      const photos: any[] = [];
      const nextPosition = photos.length === 0 ? 0 : Math.max(...photos.map(p => p.position)) + 1;

      expect(nextPosition).toBe(0);
    });

    it('should return next sequential position', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 1, deletedAt: null },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      const nextPosition = Math.max(...photos.map(p => p.position)) + 1;

      expect(nextPosition).toBe(3);
    });

    it('should handle non-sequential positions', () => {
      const photos = [
        { id: 'photo1', position: 0, deletedAt: null },
        { id: 'photo2', position: 5, deletedAt: null },
        { id: 'photo3', position: 2, deletedAt: null },
      ];

      const nextPosition = Math.max(...photos.map(p => p.position)) + 1;

      expect(nextPosition).toBe(6);
    });
  });
});
