'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keeps the device screen awake via the Screen Wake Lock API.
 * Browsers release the lock whenever the page is hidden, so it is
 * re-requested when the page becomes visible again while still enabled.
 */
export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const wantsLockRef = useRef(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  /** Resolves to whether the screen is now being kept awake. */
  const requestLock = useCallback(async () => {
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      if (!wantsLockRef.current) {
        await sentinel.release();
        return false;
      }
      sentinelRef.current = sentinel;
      setIsActive(true);
      return true;
    } catch {
      // Denied (e.g. battery saver or page not visible) — leave the screen alone
      wantsLockRef.current = false;
      setIsActive(false);
      return false;
    }
  }, []);

  const releaseLock = useCallback(async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    setIsActive(false);
    await sentinel?.release().catch(() => {});
  }, []);

  const enable = useCallback(async () => {
    wantsLockRef.current = true;
    return requestLock();
  }, [requestLock]);

  const disable = useCallback(async () => {
    wantsLockRef.current = false;
    await releaseLock();
  }, [releaseLock]);

  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wantsLockRef.current) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wantsLockRef.current = false;
      releaseLock();
    };
  }, [requestLock, releaseLock]);

  return { isSupported, isActive, enable, disable };
}
