# Design Document

## Overview

The Recipe Sections feature extends the existing recipe creation and editing forms to support optional, named sections for both ingredients and instructions. This feature allows users to organize complex recipes into logical components (e.g., "Cake Batter" and "Frosting") while maintaining the simplicity of the current interface for basic recipes.

The design integrates seamlessly with the existing React Hook Form-based recipe forms, using nested field arrays to manage sections and their contents. The feature leverages the already-installed `@hello-pangea/dnd` library for drag-and-drop reordering functionality.

## Architecture

### Data Model Extensions

The current recipe data structure stores ingredients and instructions as flat arrays. To support sections, we'll extend the data model to include optional section groupings while maintaining backward compatibility.

#### Extended Ingredient Structure
```typescript
interface IngredientSection {
  id: string;
  name: string;
  order: number;
  ingredients: Ingredient[];
}

interface ExtendedIngredient extends Ingredient {
  sectionId?: string; // Optional reference to parent section
}
```

#### Extended Instruction Structure
```typescript
interface InstructionSection {
  id: string;
  name: string;
  order: number;
  instructions: Instruction[];
}

interface ExtendedInstruction extends Instruction {
  sectionId?: string; // Optional reference to parent section
}
```

#### Recipe Data Structure
```typescript
interface RecipeWithSections extends Recipe {
  ingredientSections?: IngredientSection[];
  instructionSections?: InstructionSection[];
  // Maintain backward compatibility with flat arrays
  ingredients: ExtendedIngredient[];
  instructions: ExtendedInstruction[];
}
```

### Component Architecture

The sections feature will be implemented as composable components that can be integrated into the existing `RecipeForm` and `RecipeEditor` components.

```
RecipeForm/RecipeEditor
├── RecipeIngredientsSection
│   ├── SectionManager
│   │   ├── SectionHeader (editable title, drag handle, delete)
│   │   ├── IngredientList (existing ingredient fields)
│   │   └── AddIngredientButton
│   └── AddSectionButton
└── RecipeInstructionsSection
    ├── SectionManager
    │   ├── SectionHeader (editable title, drag handle, delete)
    │   ├── InstructionList (existing instruction fields)
    │   └── AddInstructionButton
    └── AddSectionButton
```

## Components and Interfaces

### Core Section Components

#### 1. SectionManager Component
```typescript
interface SectionManagerProps<T> {
  sections: Section<T>[];
  onSectionsChange: (sections: Section<T>[]) => void;
  onAddItem: (sectionId: string) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemType: 'ingredient' | 'instruction';
}
```

#### 2. SectionHeader Component
```typescript
interface SectionHeaderProps {
  section: Section;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onReorder: (dragResult: DropResult) => void;
  canDelete: boolean;
}
```

#### 3. EditableTitle Component
```typescript
interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
```

### Integration Components

#### 1. RecipeIngredientsWithSections
Wraps the existing ingredients form fields with section management capabilities.

#### 2. RecipeInstructionsWithSections
Wraps the existing instructions form fields with section management capabilities.

### Form Integration

The sections will integrate with React Hook Form using nested field arrays:

```typescript
// Form schema extension
const recipeSectionSchema = z.object({
  // Existing fields...
  ingredientSections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    ingredients: z.array(ingredientSchema)
  })).optional(),
  instructionSections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    instructions: z.array(instructionSchema)
  })).optional(),
});
```

## Data Models

### Section Data Structure

```typescript
interface Section<T = any> {
  id: string;
  name: string;
  order: number;
  items: T[];
}

type IngredientSection = Section<Ingredient>;
type InstructionSection = Section<Instruction>;
```

### Database Schema Changes

The existing JSONB fields for ingredients and instructions will be extended to support the new section structure while maintaining backward compatibility:

```sql
-- No schema changes required initially
-- The existing jsonb fields can store the extended structure
-- Migration will handle data transformation
```

### Data Transformation Layer

A transformation layer will handle converting between the flat structure (for backward compatibility) and the sectioned structure:

```typescript
interface DataTransformer {
  flatToSections(items: (Ingredient | Instruction)[]): Section[];
  sectionsToFlat(sections: Section[]): (Ingredient | Instruction)[];
  migrateExistingData(recipe: Recipe): RecipeWithSections;
}
```

## Error Handling

### Validation Rules

1. **Section Names**: Must not be empty (fallback to "Untitled Section")
2. **Empty Sections**: Warning on save, but allowed
3. **Duplicate Names**: Allowed (sections are identified by ID)
4. **Minimum Sections**: No minimum required (sections are optional)

### Error States

```typescript
interface SectionValidationError {
  sectionId: string;
  type: 'empty_name' | 'empty_section' | 'invalid_order';
  message: string;
}
```

### User Feedback

- **Empty Section Warning**: Modal dialog before save
- **Deletion Confirmation**: "Delete this section and all its contents?"
- **Inline Validation**: Real-time feedback for section names
- **Drag Feedback**: Visual indicators during reordering

## Testing Strategy

### Unit Tests

1. **Section Management Logic**
   - Adding/removing sections
   - Reordering sections
   - Renaming sections
   - Data transformation functions

2. **Form Integration**
   - React Hook Form integration
   - Validation handling
   - State management

3. **Component Behavior**
   - Drag and drop functionality
   - Inline editing
   - Conditional rendering

### Integration Tests

1. **Recipe Form Integration**
   - Creating recipes with sections
   - Editing existing recipes
   - Backward compatibility

2. **Data Persistence**
   - Saving sectioned recipes
   - Loading sectioned recipes
   - Migration of existing data

### E2E Tests

1. **User Workflows**
   - Creating a multi-section recipe
   - Reordering sections
   - Converting simple recipe to sectioned
   - Deleting sections

2. **Edge Cases**
   - Empty sections
   - Single section recipes
   - Maximum section limits

### Accessibility Tests

1. **Keyboard Navigation**
   - Tab order through sections
   - Keyboard shortcuts for reordering
   - Screen reader compatibility

2. **ARIA Labels**
   - Section landmarks
   - Drag handle descriptions
   - Form field associations

## Implementation Phases

### Phase 1: Core Section Components
- SectionManager component
- SectionHeader with inline editing
- Basic drag-and-drop functionality
- Data transformation utilities

### Phase 2: Form Integration
- Integrate with RecipeForm component
- React Hook Form field array management
- Validation and error handling
- Backward compatibility layer

### Phase 3: Enhanced UX
- Smooth animations for reordering
- Improved visual feedback
- Empty state handling
- Confirmation dialogs

### Phase 4: Data Migration
- Database migration for existing recipes
- Bulk data transformation
- Performance optimization
- Rollback procedures

## Technical Considerations

### Performance

- **Lazy Loading**: Sections rendered only when needed
- **Memoization**: Prevent unnecessary re-renders during drag operations
- **Debounced Updates**: Batch section name changes
- **Virtual Scrolling**: For recipes with many sections (future enhancement)

### Accessibility

- **ARIA Landmarks**: Each section marked as a region
- **Keyboard Support**: Full keyboard navigation for drag-and-drop
- **Screen Reader**: Descriptive labels for all interactive elements
- **Focus Management**: Proper focus handling during section operations

### Browser Compatibility

- **Drag and Drop**: Fallback for touch devices
- **CSS Grid**: Graceful degradation for older browsers
- **JavaScript**: ES2020+ features with appropriate polyfills

### Security

- **Input Sanitization**: Section names and content
- **XSS Prevention**: Proper escaping of user-generated content
- **CSRF Protection**: Form submission security
- **Rate Limiting**: Prevent abuse of section operations

## Migration Strategy

### Backward Compatibility

Existing recipes without sections will continue to work unchanged. The system will:

1. Detect recipes without section data
2. Render them using the traditional flat list approach
3. Allow users to optionally convert to sections
4. Maintain the original data structure until explicitly modified

### Data Migration

```typescript
interface MigrationPlan {
  phase1: 'Add section support to new recipes';
  phase2: 'Provide conversion tools for existing recipes';
  phase3: 'Optional bulk migration for power users';
  phase4: 'Deprecate flat structure (future consideration)';
}
```

The migration will be gradual and user-driven, ensuring no data loss or forced changes to existing workflows.