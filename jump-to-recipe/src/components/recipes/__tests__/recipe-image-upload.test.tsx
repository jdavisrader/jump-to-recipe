import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeImageUpload } from '../recipe-image-upload';
import { downscaleImageForUpload } from '../../../lib/downscale-image';

jest.mock('../../../lib/downscale-image', () => ({
  downscaleImageForUpload: jest.fn(),
}));

const MB = 1024 * 1024;
const COVER = 'https://x.public.blob.vercel-storage.com/uploads/recipes/old.jpg';
const NEW_URL = 'https://x.public.blob.vercel-storage.com/uploads/recipes/new.jpg';

function makeFile(sizeBytes: number, name: string): File {
  const file = new File(['x'], name, { type: 'image/jpeg' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function pickReplacement(file: File) {
  fireEvent.change(screen.getByTestId('replace-cover-input'), { target: { files: [file] } });
}

describe('RecipeImageUpload', () => {
  const onChange = jest.fn();
  const downscaled = makeFile(1 * MB, 'downscaled.jpg');

  beforeEach(() => {
    jest.clearAllMocks();
    (downscaleImageForUpload as jest.Mock).mockResolvedValue(downscaled);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, file: { url: NEW_URL } }),
    }) as jest.Mock;
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('has no Replace button until a cover is set', () => {
    render(<RecipeImageUpload onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Replace' })).not.toBeInTheDocument();
  });

  it('shows Replace next to Remove when a cover is set', () => {
    render(<RecipeImageUpload value={COVER} onChange={onChange} onRemove={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove image' })).toBeInTheDocument();
  });

  it('uploads the downscaled replacement and swaps in the new URL', async () => {
    render(<RecipeImageUpload value={COVER} onChange={onChange} />);
    pickReplacement(makeFile(6 * MB, 'IMG_1.JPG'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(NEW_URL));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/upload');
    expect((init.body as FormData).get('file')).toBe(downscaled);
    expect((init.body as FormData).get('category')).toBe('recipes');
  });

  it('rejects files over 10MB without uploading', async () => {
    render(<RecipeImageUpload value={COVER} onChange={onChange} />);
    pickReplacement(makeFile(12 * MB, 'huge.jpg'));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('huge.jpg is too large. Maximum size is 10MB.')
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hides Replace when disabled', () => {
    render(<RecipeImageUpload value={COVER} onChange={onChange} disabled />);
    expect(screen.queryByRole('button', { name: 'Replace' })).not.toBeInTheDocument();
  });
});
