import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '../useWakeLock';

describe('useWakeLock', () => {
  let release: jest.Mock;
  let request: jest.Mock;

  const setVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  };

  beforeEach(() => {
    release = jest.fn().mockResolvedValue(undefined);
    request = jest.fn().mockResolvedValue({ release });
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  afterEach(() => {
    delete (navigator as { wakeLock?: unknown }).wakeLock;
  });

  it('reports support when the API exists', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it('reports no support when the API is missing', () => {
    delete (navigator as { wakeLock?: unknown }).wakeLock;
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isSupported).toBe(false);
  });

  it('requests and releases a screen lock', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(() => result.current.enable());
    expect(request).toHaveBeenCalledWith('screen');
    expect(result.current.isActive).toBe(true);

    await act(() => result.current.disable());
    expect(release).toHaveBeenCalled();
    expect(result.current.isActive).toBe(false);
  });

  it('stays inactive when the request is denied', async () => {
    request.mockRejectedValue(new Error('NotAllowedError'));
    const { result } = renderHook(() => useWakeLock());

    await act(() => result.current.enable());
    expect(result.current.isActive).toBe(false);
  });

  it('re-requests the lock when the page becomes visible while enabled', async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(() => result.current.enable());

    await act(async () => setVisibility('visible'));
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not re-request after being disabled', async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(() => result.current.enable());
    await act(() => result.current.disable());

    await act(async () => setVisibility('visible'));
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('releases the lock on unmount', async () => {
    const { result, unmount } = renderHook(() => useWakeLock());
    await act(() => result.current.enable());

    unmount();
    expect(release).toHaveBeenCalled();
  });
});
