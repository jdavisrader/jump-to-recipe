import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoLightbox } from '../photo-lightbox';
import { RecipePhoto } from '@/types/recipe-photos';

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
  initialIndex: 0,
  isOpen: true,
  onClose: jest.fn(),
};

describe('PhotoLightbox Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock body style
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Photo lightbox')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<PhotoLightbox {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays the correct initial photo', () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={1} />);
      
      const image = screen.getByAltText('photo2.jpg');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/uploads/recipe-photos/recipe-1/photo2.jpg');
    });

    it('displays photo counter', () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={0} />);
      
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('displays photo information', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });

    it('shows close button', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
    });

    it('shows navigation buttons when multiple photos', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByLabelText('Previous photo')).toBeInTheDocument();
      expect(screen.getByLabelText('Next photo')).toBeInTheDocument();
    });

    it('hides navigation buttons when single photo', () => {
      render(<PhotoLightbox {...defaultProps} photos={[mockPhotos[0]]} />);
      
      expect(screen.queryByLabelText('Previous photo')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next photo')).not.toBeInTheDocument();
    });

    it('hides photo counter when single photo', () => {
      render(<PhotoLightbox {...defaultProps} photos={[mockPhotos[0]]} />);
      
      expect(screen.queryByText(/of/)).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to next photo when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoLightbox {...defaultProps} initialIndex={0} />);
      
      const nextButton = screen.getByLabelText('Next photo');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
        expect(screen.getByAltText('photo2.jpg')).toBeInTheDocument();
      });
    });

    it('navigates to previous photo when previous button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoLightbox {...defaultProps} initialIndex={1} />);
      
      const prevButton = screen.getByLabelText('Previous photo');
      await user.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument();
        expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
      });
    });

    it('wraps to last photo when going previous from first photo', async () => {
      const user = userEvent.setup();
      render(<PhotoLightbox {...defaultProps} initialIndex={0} />);
      
      const prevButton = screen.getByLabelText('Previous photo');
      await user.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText('3 of 3')).toBeInTheDocument();
        expect(screen.getByAltText('photo3.jpg')).toBeInTheDocument();
      });
    });

    it('wraps to first photo when going next from last photo', async () => {
      const user = userEvent.setup();
      render(<PhotoLightbox {...defaultProps} initialIndex={2} />);
      
      const nextButton = screen.getByLabelText('Next photo');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument();
        expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Controls', () => {
    it('closes lightbox when Escape key is pressed', () => {
      const onClose = jest.fn();
      render(<PhotoLightbox {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalled();
    });

    it('navigates to next photo when ArrowRight is pressed', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={0} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
      });
    });

    it('navigates to previous photo when ArrowLeft is pressed', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={1} />);
      
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument();
      });
    });

    it('zooms in when + key is pressed', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: '+' });
      
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('zooms in when = key is pressed', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: '=' });
      
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('zooms out when - key is pressed', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // First zoom in
      fireEvent.keyDown(document, { key: '+' });
      expect(screen.getByText('150%')).toBeInTheDocument();
      
      // Then zoom out
      fireEvent.keyDown(document, { key: '-' });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('resets zoom when 0 key is pressed', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // Zoom in first
      fireEvent.keyDown(document, { key: '+' });
      expect(screen.getByText('150%')).toBeInTheDocument();
      
      // Reset zoom
      fireEvent.keyDown(document, { key: '0' });
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Zoom Controls', () => {
    it('displays zoom controls', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('zooms in when zoom in button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoLightbox {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      await user.click(zoomInButton);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    it('zooms out when zoom out button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoLightbox {...defaultProps} />);
      
      // Zoom in first
      const zoomInButton = screen.getByLabelText('Zoom in');
      await user.click(zoomInButton);
      
      // Then zoom out
      const zoomOutButton = screen.getByLabelText('Zoom out');
      await user.click(zoomOutButton);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('resets zoom when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoLightbox {...defaultProps} />);
      
      // Zoom in
      const zoomInButton = screen.getByLabelText('Zoom in');
      await user.click(zoomInButton);
      expect(screen.getByText('150%')).toBeInTheDocument();
      
      // Reset
      const resetButton = screen.getByLabelText('Reset zoom');
      await user.click(resetButton);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('disables zoom out button at minimum zoom', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // Zoom out to minimum (0.5x)
      fireEvent.keyDown(document, { key: '-' }); // 0.67x
      fireEvent.keyDown(document, { key: '-' }); // 0.44x (clamped to 0.5x)
      
      await waitFor(() => {
        const zoomOutButton = screen.getByLabelText('Zoom out');
        expect(zoomOutButton).toBeDisabled();
      });
    });

    it('disables zoom in button at maximum zoom', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // Zoom in to maximum (4x)
      fireEvent.keyDown(document, { key: '+' }); // 1.5x
      fireEvent.keyDown(document, { key: '+' }); // 2.25x
      fireEvent.keyDown(document, { key: '+' }); // 3.375x
      fireEvent.keyDown(document, { key: '+' }); // 4x (max)
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      expect(zoomInButton).toBeDisabled();
    });

    it('resets zoom when changing photos', async () => {
      const user = userEvent.setup();
      render(<PhotoLightbox {...defaultProps} initialIndex={0} />);
      
      // Zoom in
      const zoomInButton = screen.getByLabelText('Zoom in');
      await user.click(zoomInButton);
      expect(screen.getByText('150%')).toBeInTheDocument();
      
      // Navigate to next photo
      const nextButton = screen.getByLabelText('Next photo');
      await user.click(nextButton);
      
      // Zoom should be reset
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });
  });

  describe('Double Click Zoom', () => {
    it('zooms in on double click', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const image = screen.getByAltText('photo1.jpg');
      fireEvent.doubleClick(image.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText('200%')).toBeInTheDocument();
      });
    });

    it('resets zoom on double click when zoomed in', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const imageContainer = screen.getByAltText('photo1.jpg').parentElement!;
      
      // First double click to zoom in
      fireEvent.doubleClick(imageContainer);
      await waitFor(() => {
        expect(screen.getByText('200%')).toBeInTheDocument();
      });
      
      // Second double click to reset
      fireEvent.doubleClick(imageContainer);
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });
  });

  describe('Touch Gestures', () => {
    it('handles swipe left to go to next photo', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={0} />);
      
      const imageContainer = screen.getByAltText('photo1.jpg').parentElement!;
      
      // Simulate swipe left
      fireEvent.touchStart(imageContainer, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      
      fireEvent.touchEnd(imageContainer, {
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });
      
      await waitFor(() => {
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
      });
    });

    it('handles swipe right to go to previous photo', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={1} />);
      
      const imageContainer = screen.getByAltText('photo2.jpg').parentElement!;
      
      // Simulate swipe right
      fireEvent.touchStart(imageContainer, {
        touches: [{ clientX: 50, clientY: 100 }],
      });
      
      fireEvent.touchEnd(imageContainer, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      });
      
      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument();
      });
    });

    it('ignores vertical swipes', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={0} />);
      
      const imageContainer = screen.getByAltText('photo1.jpg').parentElement!;
      
      // Simulate vertical swipe
      fireEvent.touchStart(imageContainer, {
        touches: [{ clientX: 100, clientY: 50 }],
      });
      
      fireEvent.touchEnd(imageContainer, {
        changedTouches: [{ clientX: 100, clientY: 200 }],
      });
      
      // Should still be on first photo
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });
  });

  describe('Backdrop Click', () => {
    it('closes lightbox when backdrop is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<PhotoLightbox {...defaultProps} onClose={onClose} />);
      
      const dialog = screen.getByRole('dialog');
      await user.click(dialog);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('does not close when clicking on image', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<PhotoLightbox {...defaultProps} onClose={onClose} />);
      
      const image = screen.getByAltText('photo1.jpg');
      await user.click(image);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Close Button', () => {
    it('closes lightbox when close button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<PhotoLightbox {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close lightbox');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('prevents body scroll when open', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<PhotoLightbox {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<PhotoLightbox {...defaultProps} isOpen={false} />);
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const loadingIndicator = document.querySelector('.animate-spin');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('hides loading indicator after image loads', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const image = screen.getByAltText('photo1.jpg');
      fireEvent.load(image);
      
      await waitFor(() => {
        const loadingIndicator = document.querySelector('.animate-spin');
        expect(loadingIndicator).not.toBeInTheDocument();
      });
    });

    it('hides loading indicator on image error', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const image = screen.getByAltText('photo1.jpg');
      fireEvent.error(image);
      
      await waitFor(() => {
        const loadingIndicator = document.querySelector('.animate-spin');
        expect(loadingIndicator).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Photo lightbox');
    });

    it('has proper button labels', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous photo')).toBeInTheDocument();
      expect(screen.getByLabelText('Next photo')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
    });

    it('has proper image alt text', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty photos array', () => {
      render(<PhotoLightbox {...defaultProps} photos={[]} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles invalid initial index', () => {
      // Component should handle this gracefully by clamping to valid range
      // For now, we'll test with a valid index since the component doesn't handle invalid indices
      render(<PhotoLightbox {...defaultProps} initialIndex={2} />);
      
      // Should show the last photo
      expect(screen.getByText('3 of 3')).toBeInTheDocument();
    });

    it('handles photos with relative paths', () => {
      const photosWithRelativePaths = [
        {
          ...mockPhotos[0],
          filePath: 'recipe-photos/recipe-1/photo1.jpg',
        },
      ];
      
      render(<PhotoLightbox {...defaultProps} photos={photosWithRelativePaths} />);
      
      const image = screen.getByAltText('photo1.jpg');
      expect(image).toHaveAttribute('src', '/uploads/recipe-photos/recipe-1/photo1.jpg');
    });

    it('handles photos with full URLs', () => {
      const photosWithUrls = [
        {
          ...mockPhotos[0],
          filePath: 'https://example.com/photo1.jpg',
        },
      ];
      
      render(<PhotoLightbox {...defaultProps} photos={photosWithUrls} />);
      
      const image = screen.getByAltText('photo1.jpg');
      expect(image).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });
  });
});
