# Cook Mode (Keep Screen Awake) — Implementation Plan

## Context
While cooking, the phone/tablet screen dims and locks, forcing users to wake it with messy hands. Cook Mode is a toggle on the recipe page that keeps the screen on while enabled, and lets it sleep normally when off.

### Decisions (confirmed with user)
- **Placement:** a full-width labeled row between the recipe header (timing/tags) and the Ingredients/Instructions grid — "Cook Mode · Keeps your screen on" with a switch. Chosen because it's where cooking starts, it's discoverable for non-technical users (not buried in the ⋮ menu), and the Ingredients card header is already crowded by the scaler.
- **Persistence:** none — off every time a recipe is opened (avoids accidental battery drain).
- **Unsupported browsers:** toggle is hidden entirely.

## Approach
- Screen Wake Lock API (`navigator.wakeLock.request('screen')`) — no new dependencies. Requires HTTPS (localhost ok).
- The browser releases the lock whenever the page is hidden (tab switch, phone locked), so the hook re-requests it on `visibilitychange` → visible while the toggle is on.
- Released on toggle-off and on unmount (leaving the page).
- Known limit: iOS Home Screen (standalone) web apps only support wake lock from iOS 18.4.

## Chunks
1. `feat: add useWakeLock hook` — `src/hooks/useWakeLock.ts` returning `{ isSupported, isActive, enable, disable }`, plus Jest tests with a mocked `navigator.wakeLock`.
2. `feat: add cook mode toggle to recipe page` — `src/components/recipes/cook-mode-toggle.tsx` (existing `Switch` + label + helper text), placed in `recipe-display.tsx`. Verify in browser preview at mobile and desktop widths.
