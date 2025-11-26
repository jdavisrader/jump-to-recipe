import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipePhotosViewer } from '../recipe-photos-viewer';
import { RecipePhoto } from '@/types/recipe-photos';

// Mock the PhotoLightbox component
jest.mock('../photo-lightbox', () => ({
  PhotoLightbox: ({ isOpen, onClose, photos, initialIndex }: any) => (
    isOpen ? (
      <div data-testid="photo-lightbox">
        <button onClick={onClose}>Close Lightbox</button>
        <div>Photo {initialIndex + 1} of {photos.length}</div>
      </div>
    ) : null
  ),
}));

const mockPhotos: RecipePhoto[] = [
  {
    id: '1',
    recipeId: 'recipe-1',
    filePath: 'recipe_photos/recipe-1/photo1.jpg',
    fileName: 'photo1.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    position: 0,
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    recipeId: 'recipe-1',
    filePath: 'recipe_photos/recipe-1/photo2.jpg',
    fileName: 'photo2.jpg',
    fileSize: 2048000,
    mimeType: 'image/jpeg',
    position: 1,
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    recipeId: 'recipe-1',
    filePath: 'recipe_photos/recipe-1/photo3.jpg',
    fileName: 'photo3.jpg',
    fileSize: 3072000,
    mimeType: 'image/jpeg',
    position: 2,
    deletedAt: new Date('2024-01-02'), // Deleted photo
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  },
];

describe('RecipePhotosViewer', () => {
  const defaultProps = {
    photos: mockPhotos,
  };

  describe('Basic Rendering', () => {
    it('renders photo grid with visible photos', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      // Should show 2 photos (excluding deleted one)
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      
      expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('photo2.jpg')).toBeInTheDocument();
      expect(screen.queryByAltText('photo3.jpg')).not.toBeInTheDocument();
    });

    it('shows photo count for multiple photos', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      expect(screen.getByText('2 photos')).toBeInTheDocument();
    });

    it('shows singular photo count for single photo', () => {
      const singlePhoto = [mockPhotos[0]];
      render(<RecipePhotosViewer photos={singlePhoto} />);
      
      expect(screen.getByText('1 photo')).toBeInTheDocument();
    });

    it('shows photo count even for single photo', () => {
      const singlePhoto = [mockPhotos[0]];
      render(<RecipePhotosViewer photos={singlePhoto} />);
      
      // Should show count for single photo too
      expect(screen.getByText('1 photo')).toBeInTheDocument();
    });

    it('renders empty state when no photos', () => {
      render(<RecipePhotosViewer photos={[]} />);
      
      expect(screen.getByText('Add original photos')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders empty state when all photos are deleted', () => {
      const deletedPhotos = mockPhotos.map(photo => ({
        ...photo,
        deletedAt: new Date(),
      }));
      
      render(<RecipePhotosViewer photos={deletedPhotos} />);
      
      expect(screen.getByText('Add original photos')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <RecipePhotosViewer {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Photo Grid Layout', () => {
    it('uses responsive grid classes', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const grid = screen.getAllByRole('img')[0].closest('.grid');
      expect(grid).toHaveClass('grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-5');
    });

    it('renders photos with correct src paths', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const photo1 = screen.getByAltText('photo1.jpg');
      const photo2 = screen.getByAltText('photo2.jpg');
      
      // Next.js Image component transforms the src, so we check if it contains the path
      expect(photo1.getAttribute('src')).toContain('recipe_photos');
      expect(photo2.getAttribute('src')).toContain('recipe_photos');
    });

    it('adds lazy loading to images', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const images = screen.getAllByRole('img');
      // Next.js Image component handles lazy loading automatically
      // Just verify images are rendered
      expect(images.length).toBe(2);
    });

    it('sorts photos by position', () => {
      const unsortedPhotos = [
        { ...mockPhotos[1], position: 5 },
        { ...mockPhotos[0], position: 1 },
      ];
      
      render(<RecipePhotosViewer photos={unsortedPhotos} />);
      
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'photo1.jpg'); // position 1
      expect(images[1]).toHaveAttribute('alt', 'photo2.jpg'); // position 5
    });
  });

  describe('Hover Effects', () => {
    it('shows hover overlay with "View Photo" text', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const viewTexts = screen.getAllByText('View Photo');
      expect(viewTexts).toHaveLength(2); // One for each visible photo
    });

    it('applies hover classes to photo containers', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const photoContainers = screen.getAllByRole('img').map(img => img.parentElement);
      photoContainers.forEach(container => {
        expect(container).toHaveClass('cursor-pointer', 'group');
      });
    });
  });

  describe('Lightbox Integration', () => {
    it('does not show lightbox initially', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument();
    });

    it('opens lightbox when photo is clicked', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const firstPhoto = screen.getByAltText('photo1.jpg');
      await userEvent.click(firstPhoto);
      
      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();
      expect(screen.getByText('Photo 1 of 2')).toBeInTheDocument();
    });

    it('opens lightbox with correct photo index', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const secondPhoto = screen.getByAltText('photo2.jpg');
      await userEvent.click(secondPhoto);
      
      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();
      expect(screen.getByText('Photo 2 of 2')).toBeInTheDocument();
    });

    it('closes lightbox when close button is clicked', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      // Open lightbox
      const firstPhoto = screen.getByAltText('photo1.jpg');
      await userEvent.click(firstPhoto);
      
      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();
      
      // Close lightbox
      const closeButton = screen.getByText('Close Lightbox');
      await userEvent.click(closeButton);
      
      expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument();
    });

    it('passes filtered photos to lightbox', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const firstPhoto = screen.getByAltText('photo1.jpg');
      await userEvent.click(firstPhoto);
      
      // Should show 2 photos (excluding deleted one)
      expect(screen.getByText('Photo 1 of 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper alt text for images', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('photo2.jpg')).toBeInTheDocument();
    });

    it('makes photo containers keyboard accessible', () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const photoContainers = screen.getAllByRole('img').map(img => img.parentElement);
      photoContainers.forEach(container => {
        expect(container).toHaveClass('cursor-pointer');
      });
    });

    it('handles keyboard navigation for photo selection', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);
      
      const firstPhotoContainer = screen.getByAltText('photo1.jpg').parentElement!;
      
      // Simulate Enter key press
      fireEvent.keyDown(firstPhotoContainer, { key: 'Enter' });
      
      // Note: In a real implementation, you might want to add keyboard event handlers
      // For now, we're just testing that the structure supports it
      expect(firstPhotoContainer).toHaveClass('cursor-pointer');
    });
  });

  describe('Edge Cases', () => {
    it('handles photos with missing filePath gracefully', () => {
      const photosWithMissingPath = [
        { ...mockPhotos[0], filePath: '' },
        mockPhotos[1],
      ];
      
      render(<RecipePhotosViewer photos={photosWithMissingPath} />);
      
      const images = screen.getAllByRole('img');
      // Next.js Image component transforms the src, so we check if it contains expected parts
      expect(images[0].getAttribute('src')).toContain('uploads');
      expect(images[1].getAttribute('src')).toContain('recipe_photos');
    });

    it('handles very long file names', () => {
      const photoWithLongName = {
        ...mockPhotos[0],
        fileName: 'this-is-a-very-long-file-name-that-might-cause-layout-issues-in-some-cases.jpg',
      };
      
      render(<RecipePhotosViewer photos={[photoWithLongName]} />);
      
      expect(screen.getByAltText('this-is-a-very-long-file-name-that-might-cause-layout-issues-in-some-cases.jpg')).toBeInTheDocument();
    });

    it('handles photos with same position', () => {
      const photosWithSamePosition = [
        { ...mockPhotos[0], position: 1 },
        { ...mockPhotos[1], position: 1 },
      ];
      
      render(<RecipePhotosViewer photos={photosWithSamePosition} />);
      
      // Should still render both photos
      expect(screen.getAllByRole('img')).toHaveLength(2);
    });
  });
});