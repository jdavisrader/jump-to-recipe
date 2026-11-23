import type { DraggableStateSnapshot, DraggingStyle } from '@hello-pangea/dnd';
import { DROP_ANIMATION_DURATION, getDraggableStyle } from '../drag-drop-style';

const snapshot = (overrides: Partial<DraggableStateSnapshot>): DraggableStateSnapshot => ({
  isDragging: false,
  isDropAnimating: false,
  isClone: false,
  dropAnimation: null,
  draggingOver: null,
  combineWith: null,
  combineTargetFor: null,
  mode: null,
  ...overrides,
});

describe('getDraggableStyle', () => {
  const style: DraggingStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    boxSizing: 'border-box',
    width: 300,
    height: 40,
    transition: 'transform 0.33s cubic-bezier(.2,1,.1,1)',
    transform: 'translate(0px, 10px)',
    zIndex: 5000,
    pointerEvents: 'none',
  };

  it('returns the library style unchanged when not drop animating', () => {
    expect(getDraggableStyle(style, snapshot({ isDragging: true }))).toBe(style);
  });

  it('shortens the drop animation while dropping', () => {
    const result = getDraggableStyle(style, snapshot({ isDragging: true, isDropAnimating: true }));

    expect(result).toEqual({ ...style, transitionDuration: DROP_ANIMATION_DURATION });
  });
});
