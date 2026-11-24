import type { CSSProperties } from 'react';
import type {
  DraggableStateSnapshot,
  DraggingStyle,
  NotDraggingStyle,
} from '@hello-pangea/dnd';

// @hello-pangea/dnd animates a dropped item into place for 0.33–0.55s and only
// calls onDragEnd once that finishes, so its default reads as lag after letting go
export const DROP_ANIMATION_DURATION = '0.15s';

export function getDraggableStyle(
  style: DraggingStyle | NotDraggingStyle | undefined,
  snapshot: DraggableStateSnapshot
): CSSProperties | undefined {
  if (!snapshot.isDropAnimating) return style;
  return { ...style, transitionDuration: DROP_ANIMATION_DURATION };
}
