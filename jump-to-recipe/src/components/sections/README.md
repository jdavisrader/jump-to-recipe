# Recipe Sections - Simplified Section Management

This document describes the recipe sections functionality, which provides a streamlined interface for organizing recipe ingredients and instructions into named sections with a predictable, append-only ordering model.

## Overview

The Recipe Sections feature allows users to organize their recipes into logical groups (e.g., "For the Sauce", "For the Topping") without the complexity of manual reordering. Sections are created in a specific order and maintain that order throughout their lifecycle.

## Key Behaviors

### 1. Append-Only Ordering

- **New Sections Always Append**: When you create a new section, it always appears at the bottom of the list
- **Predictable Order**: Sections maintain their creation order and cannot be reordered
- **Order Stability**: Renaming or editing sections does not change their position

### 2. Loading States and Visual Feedback

- **Loading Skeletons**: Shimmer animation for section content while loading
- **Button Loading States**: Spinner animations on buttons during async operations
- **Disabled State Feedback**: Clear visual indication when buttons are disabled during operations

### 3. Empty State Messaging

- **Empty Sections**: Animated indicators with pulsing dots to draw attention to empty sections
- **No Sections State**: Helpful messaging when no sections exist yet
- **Contextual Guidance**: Clear instructions on how to add content

### 4. Section Management

- **Rename Sections**: Click any section title to edit it inline
- **Delete Sections**: Remove sections with a confirmation dialog
- **Order Preservation**: Deleting a section maintains the relative order of remaining sections

### 5. Enhanced Accessibility

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and announcements
- **Focus Management**: Clear focus indicators and logical tab order
- **Reduced Motion**: Respects user's motion preferences

## Order Stability Guarantees

The section ordering system provides the following guarantees:

1. **Creation Order**: Sections appear in the order they were created
2. **Append-Only**: New sections always appear at the bottom
3. **Stable Rename**: Renaming a section does not change its position
4. **Stable Delete**: Deleting a section preserves the relative order of remaining sections
5. **No Reordering**: Sections cannot be manually reordered after creation

## CSS Animation Classes

### Core Animation Classes

- `.section-item-enter`: Animation for new items being added
- `.section-skeleton`: Loading skeleton with shimmer effect
- `.section-button`: Hover and interaction animations for buttons
- `.section-spinner`: Loading spinner animation
- `.section-empty-indicator`: Gentle pulse for empty sections
- `.section-empty-dot`: Bouncing dot animation
- `.section-modal-backdrop`: Modal backdrop fade-in
- `.section-modal-content`: Modal content slide-in animation

### Performance Optimizations

- **GPU Acceleration**: Uses transform and opacity for smooth animations
- **Reduced Repaints**: Avoids layout-triggering properties
- **Efficient Selectors**: Optimized CSS selectors for better performance
- **Motion Preferences**: Respects `prefers-reduced-motion` setting

## Component Props

### SectionManager

```typescript
interface SectionManagerProps<T> {
  sections: Section<T>[];                      // Array of sections to display
  onSectionsChange: (sections: Section<T>[]) => void; // Callback when sections change
  onAddItem: (sectionId: string) => void;      // Callback to add item to section
  onRemoveItem: (sectionId: string, itemId: string) => void; // Callback to remove item
  renderItem: (item: T, index: number, sectionId: string) => React.ReactNode; // Item renderer
  itemType: 'ingredient' | 'instruction';      // Type of items being managed
  className?: string;                          // Additional CSS classes
  addSectionLabel?: string;                    // Custom "Add Section" button label
  addItemLabel?: string;                       // Custom "Add Item" button label
  isLoading?: boolean;                         // Shows loading skeleton
  isAddingSection?: boolean;                   // Shows loading on add section button
  isAddingItem?: Record<string, boolean>;      // Shows loading on specific add item buttons
}
```

### SectionHeader

```typescript
interface SectionHeaderProps {
  section: Section;                            // The section to display
  onRename: (id: string, name: string) => void; // Callback when section is renamed
  onDelete: (id: string) => void;              // Callback when section is deleted
  canDelete?: boolean;                         // Whether delete button is enabled
  className?: string;                          // Additional CSS classes
  isDeleting?: boolean;                        // Shows loading state during deletion
}
```

### EditableTitle

```typescript
interface EditableTitleProps {
  value: string;                               // Current title value
  onChange: (value: string) => void;           // Callback when title changes
  placeholder?: string;                        // Placeholder when empty
  className?: string;                          // Additional CSS classes
  disabled?: boolean;                          // Disables editing with visual feedback
}
```

## Usage Examples

### Basic Usage with Append-Only Behavior

```tsx
<SectionManager
  sections={sections}
  onSectionsChange={handleSectionsChange}
  onAddItem={handleAddItem}
  onRemoveItem={handleRemoveItem}
  renderItem={renderItem}
  itemType="ingredient"
  isLoading={isLoading}
  isAddingSection={isAddingSection}
  isAddingItem={{ 'section-1': true }}
/>
```

**Note**: When `handleSectionsChange` is called with a new section, it will always be appended to the end of the array.

### Section Header with Simplified Controls

```tsx
<SectionHeader
  section={section}
  onRename={handleRename}
  onDelete={handleDelete}
  canDelete={sections.length > 1}
  isDeleting={isDeleting}
/>
```

**Note**: The section header only provides rename and delete controls. There is no drag handle or reordering functionality.

## Section Operations

### Adding a Section

When you click "Add Section", the new section:
1. Is assigned a unique ID
2. Gets a default name of "Untitled Section"
3. Is assigned an order value equal to the current section count
4. Is appended to the end of the sections array
5. Appears at the bottom of the list

### Renaming a Section

When you rename a section:
1. Click the section title to enter edit mode
2. Type the new name
3. Press Enter or click outside to save
4. The section's position remains unchanged
5. Only the name property is updated

### Deleting a Section

When you delete a section:
1. Click the delete button
2. Confirm the deletion in the modal dialog
3. The section and all its items are removed
4. Remaining sections are reindexed (order values updated)
5. The relative order of remaining sections is preserved

## Accessibility Features

### Keyboard Support

- **Tab Navigation**: Logical tab order through all interactive elements
- **Enter/Space**: Activate buttons and start editing
- **Escape**: Cancel editing or close modals
- **No Reordering Keys**: Arrow keys and other reordering shortcuts are not available

### Screen Reader Support

- **Button Labels**: Clear, descriptive labels for all buttons
- **State Announcements**: Loading states announced to screen readers
- **Section Landmarks**: Proper ARIA landmarks for navigation
- **Error Messages**: Clear error announcements

### Visual Accessibility

- **High Contrast**: Support for high contrast mode
- **Focus Indicators**: Clear focus rings for keyboard navigation
- **Color Independence**: Information not conveyed by color alone
- **Motion Sensitivity**: Respects reduced motion preferences

## Performance Considerations

### Rendering Performance

- Simplified component tree without drag-and-drop wrappers
- Uses CSS transforms and opacity for GPU acceleration
- Avoids layout-triggering properties (width, height, top, left)
- Efficient event handling with proper cleanup

### Memory Management

- No memory leaks from animation timers
- Proper cleanup of event listeners
- Efficient re-rendering with React.memo where appropriate
- Reduced JavaScript bundle size (no drag-and-drop library overhead)

### Large Dataset Handling

- Efficient rendering of large section lists
- Simple array operations for section management
- Virtual scrolling considerations for future enhancement

## Browser Compatibility

- **Modern Browsers**: Full feature support
- **Older Browsers**: Graceful degradation
- **Mobile Devices**: Touch-friendly interactions
- **Reduced Motion**: Automatic detection and respect

## Testing

The section features are covered by comprehensive tests:

- **Unit Tests**: Individual component behavior (add, rename, delete)
- **Integration Tests**: Component interaction and data flow
- **Accessibility Tests**: ARIA compliance and keyboard navigation
- **Performance Tests**: Rendering performance and memory usage
- **Backward Compatibility Tests**: Existing recipes load correctly

## Backward Compatibility

The simplified section system maintains full backward compatibility:

- **Existing Recipes**: All existing recipes with sections continue to work
- **Order Preservation**: Section order from the database is maintained
- **No Migration**: No data migration or schema changes required
- **API Compatibility**: All existing API endpoints work unchanged

## Design Decisions

### Why Append-Only?

The append-only ordering model was chosen for several reasons:

1. **Simplicity**: Reduces UI complexity and cognitive load
2. **Predictability**: Users always know where new sections will appear
3. **Accident Prevention**: Eliminates accidental reordering
4. **Performance**: Simpler rendering without drag-and-drop overhead
5. **Mobile-Friendly**: Better experience on touch devices

### Why No Reordering?

Manual reordering was removed because:

1. **Low Usage**: Analytics showed minimal use of reordering
2. **Complexity**: Drag-and-drop adds significant UI complexity
3. **Errors**: Users occasionally reordered sections accidentally
4. **Alternatives**: Users can delete and recreate sections if needed

## Troubleshooting

### Common Issues

1. **Sections Not Appearing**: Check that `onSectionsChange` is properly wired
2. **Order Not Preserved**: Ensure sections are sorted by `order` property
3. **Accessibility Problems**: Test with screen readers and keyboard only
4. **Mobile Issues**: Ensure touch events are properly handled

### Debug Tips

- Check the `order` property on each section
- Verify sections are sorted before rendering
- Ensure unique IDs for all sections
- Test with multiple sections to verify ordering