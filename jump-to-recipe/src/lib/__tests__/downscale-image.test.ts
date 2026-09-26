import {
  downscaleImageForUpload,
  scaleToFit,
  DOWNSCALE_THRESHOLD_BYTES,
} from '../downscale-image';

function makeFile(sizeBytes: number, name = 'IMG_0001.HEIC.jpeg', type = 'image/jpeg'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('scaleToFit', () => {
  it('shrinks the long edge to the max, keeping aspect ratio', () => {
    expect(scaleToFit(4032, 3024)).toEqual({ width: 2400, height: 1800 });
    expect(scaleToFit(3024, 4032)).toEqual({ width: 1800, height: 2400 });
  });

  it('never enlarges small images', () => {
    expect(scaleToFit(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe('downscaleImageForUpload', () => {
  const drawImage = jest.fn();
  const close = jest.fn();
  let outputBlobSize: number;

  beforeEach(() => {
    jest.clearAllMocks();
    outputBlobSize = 900 * 1024;
    (global as unknown as { createImageBitmap: unknown }).createImageBitmap = jest.fn(
      async () => ({ width: 4032, height: 3024, close })
    );
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function (callback) {
        callback(new Blob([new Uint8Array(outputBlobSize)], { type: 'image/jpeg' }));
      });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns small files untouched without decoding them', async () => {
    const file = makeFile(DOWNSCALE_THRESHOLD_BYTES);
    await expect(downscaleImageForUpload(file)).resolves.toBe(file);
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('re-encodes large photos as a smaller JPEG at max 2400px', async () => {
    const file = makeFile(6 * 1024 * 1024, 'IMG_0001.png', 'image/png');
    const result = await downscaleImageForUpload(file);

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2400, 1800);
    expect(close).toHaveBeenCalled();
    expect(result).not.toBe(file);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('IMG_0001.jpg');
    expect(result.size).toBe(outputBlobSize);
  });

  it('falls back to the original when the browser cannot decode it (e.g. HEIC)', async () => {
    (createImageBitmap as jest.Mock).mockRejectedValueOnce(new Error('unsupported'));
    const file = makeFile(6 * 1024 * 1024, 'IMG_0001.heic', 'image/heic');
    await expect(downscaleImageForUpload(file)).resolves.toBe(file);
  });

  it('keeps the original if re-encoding would not make it smaller', async () => {
    outputBlobSize = 7 * 1024 * 1024;
    const file = makeFile(6 * 1024 * 1024);
    await expect(downscaleImageForUpload(file)).resolves.toBe(file);
  });
});
