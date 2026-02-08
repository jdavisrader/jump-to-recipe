# Implementation Plan

- [x] 1. Create position management utilities
  - Create utility functions for calculating ingredient positions during reorder operations
  - Implement `reorderWithinSection` function to handle reordering within a single section
  - Implement `moveBetweenSections` function to handle moving ingredients across sections
  - Implement `normalizePositions` function to ensure sequential position values
  - Add position assignment logic for new ingredients
  - _Requirements: 1.4, 2.3, 3.3, 6.3, 6.4_

- [ ]* 1.1 Write property test for position normalization
  - **Property 3: Position values are sequential after reorder**
  - **Validates: Requirements 1.4, 3.3**

- [ ]* 1.2 Write property test for new ingredient position assignment
  - **Property 19: New ingredient gets max position plus one**
  - **Validates: Requirements 6.3**

- [ ]* 1.3 Write property test for deletion reindexing
  - **Property 20: Deletion reindexes positions**
  - **Validates: Requirements 6.4**

- [x] 2. Add drag handle and delete button UI components
  - Create `DragHandle` component with GripVertical icon from lucide-react
  - Create `DeleteButton` component with X icon
  - Add hover states and cursor changes for both components
  - Ensure drag handle has proper ARIA labels for accessibility
  - Style components to match existing design system
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 2.1 Write unit tests for UI components
  - Test drag handle renders with correct icon
  - Test delete button renders with X icon
  - Test hover states apply correct styles
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Reorder ingredient input fields
  - Update ingredient field layout to: Quantity, Unit, Ingredient Name, Notes
  - Ensure tab order follows visual order
  - Update both sectioned and flat list ingredient rendering
  - Test field order on mobile viewports
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 3.1 Write property test for field order consistency
  - **Property 14: Field order is Quantity, Unit, Name, Notes**
  - **Property 16: Field order consistent across viewports**
  - **Validates: Requirements 5.1, 5.5**

- [ ]* 3.2 Write property test for tab order
  - **Property 15: Tab order follows visual order**
  - **Validates: Requirements 5.2**

- [x] 4. Integrate drag-and-drop for flat ingredient lists
  - Wrap flat ingredient list with DragDropContext from @hello-pangea/dnd
  - Implement Droppable container for flat list
  - Implement Draggable wrapper for each ingredient
  - Add drag handle to each ingredient row
  - Implement `onDragEnd` handler for flat list reordering
  - Update ingredient positions after drag operations
  - Add visual feedback during drag (ghost image, placeholders)
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 4.1 Write property test for flat list reorder
  - **Property 8: Flat list reorder updates positions**
  - **Validates: Requirements 3.2, 3.3**

- [ ]* 4.2 Write property test for drag handle presence
  - **Property 1: Drag handle presence**
  - **Validates: Requirements 1.1, 3.1**

- [x] 5. Integrate drag-and-drop for sectioned ingredient lists
  - Wrap sectioned ingredient list with DragDropContext
  - Implement Droppable container for each section
  - Implement Draggable wrapper for each ingredient within sections
  - Add drag handle to each ingredient row in sections
  - Implement `onDragEnd` handler for within-section reordering
  - Update ingredient positions after drag operations
  - Add visual feedback for drop targets
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 5.1 Write property test for within-section reorder
  - **Property 2: Reorder within section preserves ingredient data**
  - **Validates: Requirements 1.3, 1.4**

- [x] 6. Implement cross-section drag-and-drop
  - Extend `onDragEnd` handler to detect cross-section moves
  - Implement logic to remove ingredient from source section
  - Implement logic to add ingredient to destination section
  - Update positions in both source and destination sections
  - Preserve ingredient data during cross-section moves
  - Add visual feedback when dragging over different sections
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 6.1 Write property test for cross-section move
  - **Property 5: Cross-section move removes from source and adds to destination**
  - **Property 6: Cross-section move preserves ingredient data**
  - **Validates: Requirements 2.2, 2.4**

- [ ]* 6.2 Write property test for section reordering invariant
  - **Property 7: Section reordering preserves ingredient assignments**
  - **Validates: Requirements 2.5**

- [x] 7. Implement mode conversion with order preservation
  - Update flat-to-sectioned conversion to preserve ingredient order
  - Update sectioned-to-flat conversion to preserve ingredient order
  - Ensure position values are correctly assigned during conversion
  - Test conversion in both directions
  - _Requirements: 3.4, 3.5_

- [ ]* 7.1 Write property test for flat-to-sectioned conversion
  - **Property 9: Flat-to-sectioned conversion preserves order**
  - **Validates: Requirements 3.4**

- [ ]* 7.2 Write property test for sectioned-to-flat conversion
  - **Property 10: Sectioned-to-flat conversion preserves order**
  - **Validates: Requirements 3.5**

- [x] 8. Add drag-only-from-handle restriction
  - Configure Draggable to only allow drag from drag handle
  - Use `dragHandleProps` to restrict drag initiation
  - Test that dragging from other elements doesn't initiate drag
  - _Requirements: 4.5_

- [ ]* 8.1 Write property test for drag restriction
  - **Property 13: Drag only initiates from handle**
  - **Validates: Requirements 4.5**

- [x] 9. Implement visual feedback for drag operations
  - Add ghost image/placeholder that follows cursor during drag
  - Add drop target highlighting when hovering over valid targets
  - Add "not allowed" cursor for invalid drop targets
  - Add placeholder/gap at original position during drag
  - Add smooth animation when ingredient drops at new position
  - Style feedback to match design system (light/dark mode)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 9.1 Write unit tests for visual feedback
  - Test ghost image appears during drag
  - Test drop target highlighting
  - Test placeholder at source position
  - Test animation on drop
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 10. Add database persistence for positions
  - Ensure ingredient position values are included in form submission
  - Update API handlers to save position values
  - Implement position sorting when loading recipes
  - Add migration logic for existing recipes without positions
  - Test save/load round-trip preserves order
  - _Requirements: 6.1, 6.2, 6.5_

- [ ]* 10.1 Write property test for persistence round-trip
  - **Property 4: Reorder persistence round-trip**
  - **Property 17: Reorder persists to database**
  - **Property 18: Loaded ingredients are sorted by position**
  - **Validates: Requirements 1.5, 6.1, 6.2**

- [x] 11. Implement performance optimizations
  - Add React.memo to ingredient row components
  - Implement selective re-rendering for drag operations
  - Add debouncing for rapid position updates
  - Optimize position calculation algorithms
  - Test performance with large ingredient lists (20+ items)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 11.1 Write property test for data integrity under rapid operations
  - **Property 21: Rapid reorders maintain data integrity**
  - **Validates: Requirements 8.3**

- [ ]* 11.2 Write property test for minimal re-renders
  - **Property 22: Reorder minimizes re-renders**
  - **Validates: Requirements 8.5**

- [x] 12. Add mobile touch support
  - Configure @hello-pangea/dnd for touch devices
  - Implement long-press to initiate drag on touch
  - Ensure touch drag follows touch point
  - Implement touch drag cancellation
  - Test visual feedback equivalence between touch and mouse
  - Test on actual mobile devices or emulators
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 12.1 Write property test for touch drag behavior
  - **Property 23: Touch drag follows touch point**
  - **Property 24: Touch and mouse have equivalent visual feedback**
  - **Validates: Requirements 9.2, 9.4**

- [x] 13. Add error handling and recovery
  - Implement error handling for invalid drag destinations
  - Add revert-to-snapshot functionality for failed operations
  - Implement position conflict detection and auto-correction
  - Add user-friendly error messages and toast notifications
  - Test error scenarios (invalid drops, position conflicts, save failures)
  - _Requirements: All (error handling)_

- [ ]* 13.1 Write unit tests for error handling
  - Test invalid drop destination handling
  - Test position conflict resolution
  - Test error message display
  - _Requirements: All (error handling)_

- [x] 14. Add accessibility enhancements
  - Add ARIA labels to drag handles
  - Implement screen reader announcements for drag operations
  - Add ARIA labels to drop targets
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - Ensure all interactive elements are keyboard accessible
  - _Requirements: All (accessibility)_

- [ ]* 14.1 Write accessibility tests
  - Test ARIA labels are present
  - Test screen reader announcements
  - Test keyboard navigation
  - _Requirements: All (accessibility)_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Integration testing and polish
  - Test complete drag-and-drop workflows end-to-end
  - Test mode conversion workflows
  - Test form submission with reordered ingredients
  - Verify visual consistency across light/dark modes
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Fix any visual or functional issues discovered
  - _Requirements: All_

- [ ]* 16.1 Write integration tests
  - Test complete within-section drag workflow
  - Test complete cross-section drag workflow
  - Test complete flat list drag workflow
  - Test mode conversion workflows
  - Test form submission and persistence
  - _Requirements: All_
