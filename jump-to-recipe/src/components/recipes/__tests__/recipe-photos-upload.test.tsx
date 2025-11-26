import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipePhotosUpload } from '../recipe-photos-upload';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock the environment
jest.mock('../../../lib/env', () => ({
  env: {
    MAX_RECIPE_PHOTO_SIZE_MB: 10,
    MAX_RECIPE_PHOTO_COUNT: 10,
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('RecipePhotosUpload', () => {
  const mockOnPhotosChange = jest.fn();
  const defaultProps = {
    recipeId: 'test-recipe-id',
    onPhotosChange: mockOnPhotosChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    // Clean up any object URLs
    jest.clearAllMocks();
  });

  it('renders upload zone with correct text', () => {
    render(<RecipePhotosUpload {...defaultProps} />);
    
    expect(screen.getByText('Drag & drop photos here, or click to select')).toBeInTheDocument();
    expect(screen.getByText('JPEG, PNG, WEBP, HEIC up to 10MB each')).toBeInTheDocument();
    expect(screen.getByText('0/10 photos')).toBeInTheDocument();
  });

  it('shows maximum reached message when at photo limit', () => {
    const existingPhotos = Array.from({ length: 10 }, (_, i) => ({
      id: `photo-${i}`,
      filePath: `/path/to/photo-${i}.jpg`,
      fileName: `photo-${i}.jpg`,
    }));

    render(
      <RecipePhotosUpload 
        {...defaultProps} 
        existingPhotos={existingPhotos}
      />
    );
    
    expect(screen.getByText('Maximum 10 photos reached')).toBeInTheDocument();
    expect(screen.getByText('10/10 photos')).toBeInTheDocument();
  });

  it('displays existing photos count correctly', () => {
    const existingPhotos = [
      { id: 'photo-1', filePath: '/path/to/photo-1.jpg', fileName: 'photo-1.jpg' },
      { id: 'photo-2', filePath: '/path/to/photo-2.jpg', fileName: 'photo-2.jpg' },
    ];

    render(
      <RecipePhotosUpload 
        {...defaultProps} 
        existingPhotos={existingPhotos}
      />
    );
    
    expect(screen.getByText('2/10 photos')).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(<RecipePhotosUpload {...defaultProps} disabled />);
    
    const uploadZone = screen.getByText('Drag & drop photos here, or click to select').closest('div')?.parentElement;
    expect(uploadZone).toHaveClass('cursor-not-allowed', 'opacity-50');
  });

  it('creates file preview when files are selected', async () => {
    // Mock URL.createObjectURL
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.createObjectURL = mockCreateObjectURL;

    // Mock successful upload response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        photos: [
          {
            id: 'new-photo-id',
            filePath: '/path/to/new-photo.jpg',
            fileName: 'test-image.jpg',
          },
        ],
      }),
    });

    render(<RecipePhotosUpload {...defaultProps} />);
    
    const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(screen.getByText('Uploading Photos')).toBeInTheDocument();
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });
  });

  it('shows error message for failed uploads', async () => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

    // Mock failed upload response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

    render(<RecipePhotosUpload {...defaultProps} />);
    
    const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls onPhotosChange when upload succeeds', async () => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

    const newPhoto = {
      id: 'new-photo-id',
      filePath: '/path/to/new-photo.jpg',
      fileName: 'test-image.jpg',
    };

    // Mock successful upload response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        photos: [newPhoto],
      }),
    });

    render(<RecipePhotosUpload {...defaultProps} />);
    
    const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockOnPhotosChange).toHaveBeenCalledWith([newPhoto]);
    });
  });

  it('allows removing pending uploads', async () => {
    // Mock URL.createObjectURL and revokeObjectURL
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock a slow/pending upload to keep it in pending state
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves, keeps upload pending
    );

    render(<RecipePhotosUpload {...defaultProps} />);
    
    const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });

    // Find and click the remove button (should be visible for pending uploads)
    const removeButton = document.querySelector('button[type="button"]') as HTMLButtonElement;
    expect(removeButton).toBeInTheDocument();
    
    await userEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test-image.jpg')).not.toBeInTheDocument();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});