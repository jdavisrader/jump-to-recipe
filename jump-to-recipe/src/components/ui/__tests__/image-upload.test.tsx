import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ImageUpload } from '../image-upload';
import { downscaleImageForUpload } from '../../../lib/downscale-image';

jest.mock('../../../lib/downscale-image', () => ({
  downscaleImageForUpload: jest.fn(),
}));

const MB = 1024 * 1024;

function makeFile(sizeBytes: number, name: string, type = 'image/jpeg'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function dropFile(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe('ImageUpload', () => {
  const onChange = jest.fn();
  const downscaled = makeFile(1 * MB, 'IMG_1234.jpg');

  beforeEach(() => {
    jest.clearAllMocks();
    (downscaleImageForUpload as jest.Mock).mockResolvedValue(downscaled);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, file: { url: 'https://x.public.blob.vercel-storage.com/uploads/recipes/a.jpg' } }),
    }) as jest.Mock;
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('accepts photos over the old 4MB limit and uploads the downscaled version', async () => {
    render(<ImageUpload category="recipes" onChange={onChange} />);
    dropFile(makeFile(6 * MB, 'IMG_1234.JPG'));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('https://x.public.blob.vercel-storage.com/uploads/recipes/a.jpg')
    );
    const body = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData;
    expect(body.get('file')).toBe(downscaled);
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('tells the user when a file is over the 10MB limit instead of doing nothing', async () => {
    render(<ImageUpload category="recipes" onChange={onChange} />);
    dropFile(makeFile(12 * MB, 'huge.jpg'));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('huge.jpg is too large. Maximum size is 10MB.')
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows the new limit in the hint text', () => {
    render(<ImageUpload category="recipes" onChange={onChange} />);
    expect(screen.getByText('PNG, JPG, GIF up to 10MB')).toBeInTheDocument();
  });
});
