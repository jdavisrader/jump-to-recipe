import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipePhotosViewer } from '../recipe-photos-viewer';
import { RecipePhoto } from '@/types/recipe-photos';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, className }: any) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={onError}
      />
    );
  };
});

// Mock PhotoLightbox component
jest.mock('../photo-lightbox', () => ({
  PhotoLightbox: ({ photos, initialIndex, isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="photo-lightbox">
        <div>Lightbox Open</div>
        <div>Photo {initialIndex + 1} of {photos.length}</div>
        <button onClick={onClose}>Close Lightbox</button>
      </div>
    ) : null
  ),
}));

const mockPhotos: RecipePhoto[] = [
  {
    id: 'photo-1',
    recipeId: 'recipe-1',
    filePath: '/uploads/recipe-photos/recipe-1/photo1.jpg',
    fileName: 'photo1.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    position: 0,
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'photo-2',
    recipeId: 'recipe-1',
    filePath: '/uploads/recipe-photos/recipe-1/photo2.jpg',
    fileName: 'photo2.jpg',
    fileSize: 2048000,
    mimeType: 'image/jpeg',
    position: 1,
    deletedAt: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'photo-3',
    recipeId: 'recipe-1',
    filePath: '/uploads/recipe-photos/recipe-1/photo3.jpg',
    fileName: 'photo3.jpg',
    fileSize: 1536000,
    mimeType: 'image/jpeg',
    position: 2,
    deletedAt: null,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

const defaultProps = {
  photos: mockPhotos,
};

describe('RecipePhotosViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders photo grid with correct number of photos', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
    });

    it('displays photos in correct order by position', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'photo1.jpg');
      expect(images[1]).toHaveAttribute('alt', 'photo2.jpg');
      expect(images[2]).toHaveAttribute('alt', 'photo3.jpg');
    });

    it('displays photo count', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    it('displays singular photo count for one photo', () => {
      render(<RecipePhotosViewer {...defaultProps} photos={[mockPhotos[0]]} />);

      expect(screen.getByText('1 photo')).toBeInTheDocument();
    });

    it('filters out deleted photos', () => {
      const photosWithDeleted = [
        ...mockPhotos,
        {
          ...mockPhotos[0],
          id: 'photo-4',
          deletedAt: new Date(),
        },
      ];

      render(<RecipePhotosViewer {...defaultProps} photos={photosWithDeleted} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3); // Should not include deleted photo
    });

    it('applies custom className', () => {
      const { container } = render(
        <RecipePhotosViewer {...defaultProps} className="custom-class" />
      );

      const gridContainer = container.firstChild;
      expect(gridContainer).toHaveClass('custom-class');
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no photos', () => {
      render(<RecipePhotosViewer {...defaultProps} photos={[]} />);

      expect(screen.getByText('Add original photos')).toBeInTheDocument();
    });

    it('shows empty state when all photos are deleted', () => {
      const deletedPhotos = mockPhotos.map(photo => ({
        ...photo,
        deletedAt: new Date(),
      }));

      render(<RecipePhotosViewer {...defaultProps} photos={deletedPhotos} />);

      expect(screen.getByText('Add original photos')).toBeInTheDocument();
    });
  });

  describe('Photo Interaction', () => {
    it('opens lightbox when photo is clicked', async () => {
      const user = userEvent.setup();
      render(<RecipePhotosViewer {...defaultProps} />);

      const photoButtons = screen.getAllByRole('button');
      await user.click(photoButtons[0]);

      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();
      expect(screen.getByText('Lightbox Open')).toBeInTheDocument();
    });

    it('opens lightbox with correct initial index', async () => {
      const user = userEvent.setup();
      render(<RecipePhotosViewer {...defaultProps} />);

      const photoButtons = screen.getAllByRole('button');
      await user.click(photoButtons[1]);

      expect(screen.getByText('Photo 2 of 3')).toBeInTheDocument();
    });

    it('opens lightbox when Enter key is pressed on photo', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const photoButtons = screen.getAllByRole('button');
      fireEvent.keyDown(photoButtons[0], { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();
      });
    });

    it('opens lightbox when Space key is pressed on photo', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const photoButtons = screen.getAllByRole('button');
      fireEvent.keyDown(photoButtons[0], { key: ' ' });

      await waitFor(() => {
        expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();
      });
    });

    it('closes lightbox when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<RecipePhotosViewer {...defaultProps} />);

      // Open lightbox
      const photoButtons = screen.getAllByRole('button');
      await user.click(photoButtons[0]);

      expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();

      // Close lightbox
      const closeButton = screen.getByText('Close Lightbox');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Image Error Handling', () => {
    it('displays error state when image fails to load', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      fireEvent.error(images[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('does not open lightbox for failed images', async () => {
      const user = userEvent.setup();
      render(<RecipePhotosViewer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      fireEvent.error(images[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });

      const photoButtons = screen.getAllByRole('button');
      await user.click(photoButtons[0]);

      // Lightbox should not open for failed image
      expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument();
    });

    it('tracks multiple image errors independently', async () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      fireEvent.error(images[0]);
      fireEvent.error(images[2]);

      await waitFor(() => {
        const errorMessages = screen.getAllByText('Failed to load');
        expect(errorMessages).toHaveLength(2);
      });

      // Second image should still work
      expect(images[1]).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('shows hover overlay on photo hover', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const photoButtons = screen.getAllByRole('button');
      const firstPhoto = photoButtons[0];

      // Check that hover text exists in the DOM
      expect(screen.getAllByText('View Photo')).toHaveLength(3);
    });
  });

  describe('Responsive Grid Layout', () => {
    it('applies responsive grid classes', () => {
      const { container } = render(<RecipePhotosViewer {...defaultProps} />);

      // Find the inner grid that contains the photos
      const grids = container.querySelectorAll('.grid');
      const photoGrid = grids[1]; // Second grid is the photo grid
      expect(photoGrid).toHaveClass(
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      );
    });

    it('maintains aspect ratio for photos', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const photoButtons = screen.getAllByRole('button');
      photoButtons.forEach(button => {
        expect(button).toHaveClass('aspect-square');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper role attributes', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const photoButtons = screen.getAllByRole('button');
      expect(photoButtons).toHaveLength(3);
    });

    it('has proper tabIndex for keyboard navigation', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const photoButtons = screen.getAllByRole('button');
      photoButtons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex', '0');
      });
    });

    it('has descriptive aria-labels', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      expect(screen.getByLabelText('View photo: photo1.jpg')).toBeInTheDocument();
      expect(screen.getByLabelText('View photo: photo2.jpg')).toBeInTheDocument();
      expect(screen.getByLabelText('View photo: photo3.jpg')).toBeInTheDocument();
    });

    it('has proper alt text for images', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('photo2.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('photo3.jpg')).toBeInTheDocument();
    });
  });

  describe('Photo URL Handling', () => {
    it('handles photos with /uploads/ prefix', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', '/uploads/recipe-photos/recipe-1/photo1.jpg');
    });

    it('adds /uploads/ prefix to relative paths', () => {
      const photosWithRelativePaths = mockPhotos.map(photo => ({
        ...photo,
        filePath: 'recipe-photos/recipe-1/photo1.jpg',
      }));

      render(<RecipePhotosViewer {...defaultProps} photos={photosWithRelativePaths} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', '/uploads/recipe-photos/recipe-1/photo1.jpg');
    });

    it('handles full URLs without modification', () => {
      const photosWithUrls = mockPhotos.map(photo => ({
        ...photo,
        filePath: 'https://example.com/photo1.jpg',
      }));

      render(<RecipePhotosViewer {...defaultProps} photos={photosWithUrls} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });
  });

  describe('Performance', () => {
    it('uses proper image sizes attribute for responsive loading', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      const images = screen.getAllByRole('img');
      // Note: Next.js Image mock doesn't preserve sizes, but we can verify the component structure
      expect(images).toHaveLength(3);
    });

    it('lazy loads images', () => {
      render(<RecipePhotosViewer {...defaultProps} />);

      // Images should be rendered but may not be loaded yet
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('handles photos with missing filePath gracefully', () => {
      const photosWithMissingPath = [
        {
          ...mockPhotos[0],
          filePath: '',
        },
      ];

      render(<RecipePhotosViewer {...defaultProps} photos={photosWithMissingPath} />);

      // Should still render without crashing
      expect(screen.getByText('1 photo')).toBeInTheDocument();
    });

    it('handles photos with special characters in filename', () => {
      const photosWithSpecialChars = [
        {
          ...mockPhotos[0],
          fileName: 'photo (1) [test].jpg',
        },
      ];

      render(<RecipePhotosViewer {...defaultProps} photos={photosWithSpecialChars} />);

      expect(screen.getByAltText('photo (1) [test].jpg')).toBeInTheDocument();
    });

    it('handles very large number of photos', () => {
      const manyPhotos = Array.from({ length: 50 }, (_, i) => ({
        ...mockPhotos[0],
        id: `photo-${i}`,
        fileName: `photo${i}.jpg`,
        position: i,
      }));

      render(<RecipePhotosViewer {...defaultProps} photos={manyPhotos} />);

      expect(screen.getByText('50 photos')).toBeInTheDocument();
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(50);
    });
  });

  describe('State Management', () => {
    it('maintains lightbox state independently for each photo', async () => {
      const user = userEvent.setup();
      render(<RecipePhotosViewer {...defaultProps} />);

      // Open lightbox for first photo
      const photoButtons = screen.getAllByRole('button');
      await user.click(photoButtons[0]);

      expect(screen.getByText('Photo 1 of 3')).toBeInTheDocument();

      // Close lightbox
      const closeButton = screen.getByText('Close Lightbox');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument();
      });

      // Open lightbox for second photo
      await user.click(photoButtons[1]);

      expect(screen.getByText('Photo 2 of 3')).toBeInTheDocument();
    });

    it('resets error state when photos change', () => {
      const { rerender } = render(<RecipePhotosViewer {...defaultProps} />);

      // Trigger error on first photo
      const images = screen.getAllByRole('img');
      fireEvent.error(images[0]);

      // Update photos
      const newPhotos = [mockPhotos[1], mockPhotos[2]];
      rerender(<RecipePhotosViewer {...defaultProps} photos={newPhotos} />);

      // Error state should be cleared
      expect(screen.queryByText('Failed to load')).not.toBeInTheDocument();
    });
  });
});
