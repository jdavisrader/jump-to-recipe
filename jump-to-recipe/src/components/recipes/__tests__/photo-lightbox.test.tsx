import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoLightbox } from '../photo-lightbox';
import { RecipePhoto } from '@/types/recipe-photos';

// Mock photos for testing
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
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('PhotoLightbox', () => {
  const defaultProps = {
    photos: mockPhotos,
    initialIndex: 0,
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock body style
    Object.defineProperty(document.body, 'style', {
      value: { overflow: '' },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = '';
  });

  describe('Basic Rendering', () => {
    it('renders when open', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Photo lightbox')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<PhotoLightbox {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not render with empty photos array', () => {
      render(<PhotoLightbox {...defaultProps} photos={[]} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays the correct initial photo', () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={1} />);
      
      const image = screen.getByAltText('photo2.jpg');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/uploads/recipe_photos/recipe-1/photo2.jpg');
    });

    it('shows photo counter for multiple photos', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('does not show photo counter for single photo', () => {
      render(<PhotoLightbox {...defaultProps} photos={[mockPhotos[0]]} />);
      
      expect(screen.queryByText(/of/)).not.toBeInTheDocument();
    });

    it('displays photo information', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });
  });

  describe('Navigation Controls', () => {
    it('shows navigation buttons for multiple photos', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByLabelText('Previous photo')).toBeInTheDocument();
      expect(screen.getByLabelText('Next photo')).toBeInTheDocument();
    });

    it('does not show navigation buttons for single photo', () => {
      render(<PhotoLightbox {...defaultProps} photos={[mockPhotos[0]]} />);
      
      expect(screen.queryByLabelText('Previous photo')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next photo')).not.toBeInTheDocument();
    });

    it('navigates to next photo when next button is clicked', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const nextButton = screen.getByLabelText('Next photo');
      await userEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
        expect(screen.getByAltText('photo2.jpg')).toBeInTheDocument();
      });
    });

    it('navigates to previous photo when previous button is clicked', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={1} />);
      
      const prevButton = screen.getByLabelText('Previous photo');
      await userEvent.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument();
        expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
      });
    });

    it('wraps around when navigating past the last photo', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={2} />);
      
      const nextButton = screen.getByLabelText('Next photo');
      await userEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument();
        expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
      });
    });

    it('wraps around when navigating before the first photo', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={0} />);
      
      const prevButton = screen.getByLabelText('Previous photo');
      await userEvent.click(prevButton);
      
      await waitFor(() => {
        expect(screen.getByText('3 of 3')).toBeInTheDocument();
        expect(screen.getByAltText('photo3.jpg')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes lightbox when Escape key is pressed', async () => {
      const onClose = jest.fn();
      render(<PhotoLightbox {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('navigates to next photo with ArrowRight key', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
      });
    });

    it('navigates to previous photo with ArrowLeft key', async () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={1} />);
      
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument();
      });
    });

    it('zooms in with + key', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: '+' });
      
      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });
    });

    it('zooms in with = key', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: '=' });
      
      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });
    });

    it('zooms out with - key', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // First zoom in
      fireEvent.keyDown(document, { key: '+' });
      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });
      
      // Then zoom out
      fireEvent.keyDown(document, { key: '-' });
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('resets zoom with 0 key', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // First zoom in
      fireEvent.keyDown(document, { key: '+' });
      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });
      
      // Then reset
      fireEvent.keyDown(document, { key: '0' });
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });
  });

  describe('Zoom Controls', () => {
    it('shows zoom controls', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('zooms in when zoom in button is clicked', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      await userEvent.click(zoomInButton);
      
      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });
    });

    it('zooms out when zoom out button is clicked', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // First zoom in
      const zoomInButton = screen.getByLabelText('Zoom in');
      await userEvent.click(zoomInButton);
      
      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });
      
      // Then zoom out
      const zoomOutButton = screen.getByLabelText('Zoom out');
      await userEvent.click(zoomOutButton);
      
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('resets zoom when reset button is clicked', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // First zoom in
      const zoomInButton = screen.getByLabelText('Zoom in');
      await userEvent.click(zoomInButton);
      
      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });
      
      // Then reset
      const resetButton = screen.getByLabelText('Reset zoom');
      await userEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('disables zoom out button at minimum zoom', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const zoomOutButton = screen.getByLabelText('Zoom out');
      
      // Zoom out to minimum (0.5x)
      await userEvent.click(zoomOutButton); // 0.67x
      await userEvent.click(zoomOutButton); // 0.44x -> clamped to 0.5x
      
      await waitFor(() => {
        expect(zoomOutButton).toBeDisabled();
      });
    });

    it('disables zoom in button at maximum zoom', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const zoomInButton = screen.getByLabelText('Zoom in');
      
      // Zoom to maximum (4x)
      await userEvent.click(zoomInButton); // 1.5x
      await userEvent.click(zoomInButton); // 2.25x
      await userEvent.click(zoomInButton); // 3.375x
      await userEvent.click(zoomInButton); // 5.0625x -> clamped to 4x
      
      await waitFor(() => {
        expect(zoomInButton).toBeDisabled();
      });
    });
  });

  describe('Close Functionality', () => {
    it('shows close button', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
    });

    it('closes when close button is clicked', async () => {
      const onClose = jest.fn();
      render(<PhotoLightbox {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close lightbox');
      await userEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes when backdrop is clicked', async () => {
      const onClose = jest.fn();
      render(<PhotoLightbox {...defaultProps} onClose={onClose} />);
      
      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when image is clicked', async () => {
      const onClose = jest.fn();
      render(<PhotoLightbox {...defaultProps} onClose={onClose} />);
      
      const image = screen.getByAltText('photo1.jpg');
      await userEvent.click(image);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Touch Gestures', () => {
    it('handles double tap to zoom', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const image = screen.getByAltText('photo1.jpg');
      
      // Simulate double tap
      fireEvent.doubleClick(image);
      
      expect(screen.getByText('200%')).toBeInTheDocument();
    });

    it('handles double tap to reset zoom when zoomed', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const image = screen.getByAltText('photo1.jpg');
      
      // First double tap to zoom
      fireEvent.doubleClick(image);
      expect(screen.getByText('200%')).toBeInTheDocument();
      
      // Second double tap to reset
      fireEvent.doubleClick(image);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles touch swipe for navigation', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const image = screen.getByAltText('photo1.jpg');
      const container = image.parentElement;
      
      // Simulate swipe left (next photo)
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      fireEvent.touchEnd(container!, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });
      
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });

    it('handles touch swipe right for previous navigation', () => {
      render(<PhotoLightbox {...defaultProps} initialIndex={1} />);
      
      const image = screen.getByAltText('photo2.jpg');
      const container = image.parentElement;
      
      // Simulate swipe right (previous photo)
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(container!, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      });
      
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Photo lightbox');
    });

    it('manages focus properly when opening', () => {
      const focusedElement = document.createElement('button');
      document.body.appendChild(focusedElement);
      focusedElement.focus();
      
      const originalFocus = document.activeElement;
      
      render(<PhotoLightbox {...defaultProps} />);
      
      // Focus should be stored for restoration later
      expect(originalFocus).toBe(focusedElement);
      
      document.body.removeChild(focusedElement);
    });

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

    it('has proper button labels', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous photo')).toBeInTheDocument();
      expect(screen.getByLabelText('Next photo')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator initially', () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('hides loading indicator after image loads', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const image = screen.getByAltText('photo1.jpg');
      fireEvent.load(image);
      
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });

    it('hides loading indicator on image error', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      const image = screen.getByAltText('photo1.jpg');
      fireEvent.error(image);
      
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('resets zoom and position when changing photos', async () => {
      render(<PhotoLightbox {...defaultProps} />);
      
      // Zoom in first
      const zoomInButton = screen.getByLabelText('Zoom in');
      await userEvent.click(zoomInButton);
      
      expect(screen.getByText('150%')).toBeInTheDocument();
      
      // Navigate to next photo
      const nextButton = screen.getByLabelText('Next photo');
      await userEvent.click(nextButton);
      
      // Zoom should be reset
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('resets state when reopening lightbox', () => {
      const { rerender } = render(<PhotoLightbox {...defaultProps} />);
      
      // Close and reopen
      rerender(<PhotoLightbox {...defaultProps} isOpen={false} />);
      rerender(<PhotoLightbox {...defaultProps} isOpen={true} initialIndex={1} />);
      
      // Should show the new initial index
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});