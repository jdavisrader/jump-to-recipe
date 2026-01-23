# Recipe Sections Migration Guide

## Overview

This guide documents the migration strategy for the Recipe Sections Hardening feature, which introduces strict validation rules and data integrity checks for recipe sections. The migration is designed to be **backward compatible** and **non-breaking**, ensuring existing recipes continue to work while gradually improving data quality.

## Table of Contents

- [Backward Compatibility Approach](#backward-compatibility-approach)
- [Normalization Process](#normalization-process)
- [Data Transformation Examples](#data-transformation-examples)
- [Rollout Plan and Phases](#rollout-plan-and-phases)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## Backward Compatibility Approach

### Core Principles

1. **No Forced Migration**: Existing recipes are never modified automatically in the database
2. **Lazy Normalization**: Data is normalized only when a recipe is loaded for editing
3. **Transparent Fixes**: Invalid data is silently corrected without user intervention
4. **Dual Format Support**: Both old and new data formats are accepted by the API
5. **Graceful Degradation**: If normalization fails, the recipe remains accessible in read-only mode

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ Existing Recipe (may have invalid data)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ User Opens Recipe for Editing                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ normalizeExistingRecipe() Applied                           │
│ - Assigns missing section names                             │
│ - Flattens empty sections                                   │
│ - Auto-assigns missing positions                            │
│ - Drops empty items                                         │
│ - Generates missing UUIDs                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Normalized Data Displayed in Editor                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ User Saves Recipe                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Strict Validation Applied                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Valid Data Persisted to Database                            │
└─────────────────────────────────────────────────────────────┘
```

### Compatibility Guarantees

| Scenario | Behavior | User Impact |
|----------|----------|-------------|
| Recipe with missing section names | Normalized to "Untitled Section" on edit | None - transparent fix |
| Recipe with empty sections | Items moved to unsectioned on edit | None - data preserved |
| Recipe with missing positions | Sequential positions assigned on edit | None - order preserved |
| Recipe with empty items | Empty items dropped on edit | None - invalid data removed |
| Recipe with missing IDs | UUIDs generated on edit | None - transparent fix |
| Recipe in old format (no sections) | Treated as unsectioned recipe | None - fully compatible |

---

## Normalization Process

### What Gets Normalized

The normalization process handles the following data quality issues:

#### 1. Missing Section Names

**Before:**
```json
{
  "ingredientSections": [
    {
      "id": "abc-123",
      "name": "",
      "items": [...]
    }
  ]
}
```

**After:**
```json
{
  "ingredientSections": [
    {
      "id": "abc-123",
      "name": "Untitled Section",
      "items": [...]
    }
  ]
}
```

#### 2. Empty Sections

**Before:**
```json
{
  "ingredientSections": [
    {
      "id": "abc-123",
      "name": "Empty Section",
      "items": []
    },
    {
      "id": "def-456",
      "name": "Valid Section",
      "items": [{ "id": "item-1", "text": "Flour", "position": 0 }]
    }
  ]
}
```

**After:**
```json
{
  "ingredientSections": [
    {
      "id": "def-456",
      "name": "Valid Section",
      "position": 0,
      "items": [{ "id": "item-1", "text": "Flour", "position": 0 }]
    }
  ]
}
```

*Note: Empty section is removed, remaining sections are reindexed*

#### 3. Missing Positions

**Before:**
```json
{
  "ingredientSections": [
    {
      "id": "abc-123",
      "name": "Section 1",
      "items": [
        { "id": "item-1", "text": "Flour" },
        { "id": "item-2", "text": "Sugar" }
      ]
    }
  ]
}
```

**After:**
```json
{
  "ingredientSections": [
    {
      "id": "abc-123",
      "name": "Section 1",
      "position": 0,
      "items": [
        { "id": "item-1", "text": "Flour", "position": 0 },
        { "id": "item-2", "text": "Sugar", "position": 1 }
      ]
    }
  ]
}
```

#### 4. Empty Items

**Before:**
```json
{
  "items": [
    { "id": "item-1", "text": "Flour", "position": 0 },
    { "id": "item-2", "text": "", "position": 1 },
    { "id": "item-3", "text": "   ", "position": 2 },
    { "id": "item-4", "text": "Sugar", "position": 3 }
  ]
}
```

**After:**
```json
{
  "items": [
    { "id": "item-1", "text": "Flour", "position": 0 },
    { "id": "item-4", "text": "Sugar", "position": 1 }
  ]
}
```

*Note: Empty and whitespace-only items are dropped, positions are reindexed*

#### 5. Missing IDs

**Before:**
```json
{
  "items": [
    { "text": "Flour", "position": 0 },
    { "text": "Sugar", "position": 1 }
  ]
}
```

**After:**
```json
{
  "items": [
    { "id": "550e8400-e29b-41d4-a716-446655440000", "text": "Flour", "position": 0 },
    { "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "text": "Sugar", "position": 1 }
  ]
}
```

*Note: UUIDs are generated for items missing IDs*

### Normalization Function

The normalization is performed by `normalizeExistingRecipe()` in `src/lib/recipe-import-normalizer.ts`:

```typescript
import { normalizeExistingRecipe } from '@/lib/recipe-import-normalizer';

// In recipe editor component
const normalizedRecipe = normalizeExistingRecipe(rawRecipeData);
```

### When Normalization Occurs

| Context | Timing | Function Used |
|---------|--------|---------------|
| Recipe Editor Load | On component mount | `normalizeExistingRecipe()` |
| Recipe Import | Before validation | `normalizeImportedRecipe()` |
| API Update | Before validation | `normalizeExistingRecipe()` |
| API Create | Not applied (strict validation only) | N/A |

---

## Data Transformation Examples

### Example 1: Legacy Recipe with No Sections

**Original Data (Legacy Format):**
```json
{
  "id": "recipe-123",
  "title": "Chocolate Chip Cookies",
  "ingredients": [
    { "text": "2 cups flour" },
    { "text": "1 cup sugar" },
    { "text": "" }
  ],
  "instructions": [
    { "text": "Mix ingredients" },
    { "text": "Bake at 350°F" }
  ]
}
```

**After Normalization:**
```json
{
  "id": "recipe-123",
  "title": "Chocolate Chip Cookies",
  "ingredients": [
    { "id": "uuid-1", "text": "2 cups flour", "position": 0 },
    { "id": "uuid-2", "text": "1 cup sugar", "position": 1 }
  ],
  "instructions": [
    { "id": "uuid-3", "text": "Mix ingredients", "position": 0 },
    { "id": "uuid-4", "text": "Bake at 350°F", "position": 1 }
  ]
}
```

**Changes Applied:**
- Empty ingredient dropped
- UUIDs generated for all items
- Sequential positions assigned
- No sections created (remains unsectioned)

### Example 2: Recipe with Invalid Sections

**Original Data:**
```json
{
  "id": "recipe-456",
  "title": "Layered Cake",
  "ingredientSections": [
    {
      "id": "section-1",
      "name": "",
      "items": [
        { "text": "2 cups flour" },
        { "text": "1 cup sugar" }
      ]
    },
    {
      "id": "section-2",
      "name": "Frosting",
      "items": []
    },
    {
      "id": "section-3",
      "name": "Decoration",
      "items": [
        { "text": "Sprinkles" }
      ]
    }
  ]
}
```

**After Normalization:**
```json
{
  "id": "recipe-456",
  "title": "Layered Cake",
  "ingredientSections": [
    {
      "id": "section-1",
      "name": "Untitled Section",
      "position": 0,
      "items": [
        { "id": "uuid-1", "text": "2 cups flour", "position": 0 },
        { "id": "uuid-2", "text": "1 cup sugar", "position": 1 }
      ]
    },
    {
      "id": "section-3",
      "name": "Decoration",
      "position": 1,
      "items": [
        { "id": "uuid-3", "text": "Sprinkles", "position": 0 }
      ]
    }
  ]
}
```

**Changes Applied:**
- Section 1: Empty name replaced with "Untitled Section"
- Section 2: Empty section removed entirely
- Section 3: Kept as-is, position reindexed to 1
- All items: UUIDs and positions assigned

### Example 3: Imported Recipe with Mixed Issues

**Original Data (from external source):**
```json
{
  "title": "Pasta Carbonara",
  "ingredientSections": [
    {
      "name": "Pasta",
      "items": [
        { "text": "1 lb spaghetti" },
        { "text": "" },
        { "text": "   " }
      ]
    },
    {
      "items": [
        { "text": "4 eggs" },
        { "text": "1 cup parmesan" }
      ]
    }
  ]
}
```

**After Normalization:**
```json
{
  "title": "Pasta Carbonara",
  "ingredientSections": [
    {
      "id": "uuid-section-1",
      "name": "Pasta",
      "position": 0,
      "items": [
        { "id": "uuid-1", "text": "1 lb spaghetti", "position": 0 }
      ]
    },
    {
      "id": "uuid-section-2",
      "name": "Imported Section",
      "position": 1,
      "items": [
        { "id": "uuid-2", "text": "4 eggs", "position": 0 },
        { "id": "uuid-3", "text": "1 cup parmesan", "position": 1 }
      ]
    }
  ]
}
```

**Changes Applied:**
- Section 1: Empty items dropped, IDs and positions assigned
- Section 2: Missing name replaced with "Imported Section"
- All sections: UUIDs generated, positions assigned
- All items: UUIDs and positions assigned

---

## Rollout Plan and Phases

### Phase 1: Deploy Validation (Read-Only Mode)

**Duration:** 1-2 weeks  
**Goal:** Monitor validation failures without blocking saves

**Actions:**
1. Deploy validation code to production
2. Enable logging for validation failures
3. Allow all saves to proceed (validation errors logged only)
4. Monitor error rates and patterns

**Success Criteria:**
- Validation code deployed successfully
- Error logging working correctly
- < 10% of recipes have validation errors
- No user-reported issues

**Monitoring:**
```javascript
// Log validation failures
if (!validationResult.success) {
  logger.warn('Recipe validation failed (non-blocking)', {
    recipeId: recipe.id,
    errors: validationResult.error.issues,
    userId: user.id
  });
}
```

### Phase 2: Enable Client-Side Validation

**Duration:** 2-3 weeks  
**Goal:** Show validation errors to users but allow saves

**Actions:**
1. Enable client-side validation in recipe editor
2. Display inline validation errors
3. Show warning banner: "This recipe has validation issues that will need to be fixed in the future"
4. Allow save button to remain enabled
5. Collect user feedback

**Success Criteria:**
- Users see validation errors
- No increase in support tickets
- Users can still save recipes
- Positive feedback on error messages

**User Experience:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Warning: This recipe has validation issues               │
│ These will need to be fixed in a future update.             │
│ [Learn More]                                                 │
└─────────────────────────────────────────────────────────────┘

Section Name: [Empty Section]  ⚠️ Section name is required
Items:
  - [Empty item]  ⚠️ Item text cannot be empty

[Save Recipe] ← Still enabled
```

### Phase 3: Enable Server-Side Validation (Soft Block)

**Duration:** 2-3 weeks  
**Goal:** Block invalid saves but provide clear guidance

**Actions:**
1. Enable server-side validation
2. Return 400 errors for invalid recipes
3. Display detailed error messages to users
4. Provide "Auto-Fix" button to apply normalization
5. Monitor error rates and user behavior

**Success Criteria:**
- Invalid recipes blocked from saving
- < 5% of save attempts fail validation
- Users successfully fix validation errors
- Support tickets remain low

**User Experience:**
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Cannot Save Recipe                                        │
│ This recipe has 3 validation errors that must be fixed:     │
│                                                              │
│ 1. Section "Empty Section" has no items                     │
│ 2. Ingredient text cannot be empty (line 3)                 │
│ 3. Section name is required (section 2)                     │
│                                                              │
│ [Auto-Fix Issues] [Fix Manually]                            │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Full Enforcement

**Duration:** Ongoing  
**Goal:** All recipes meet validation standards

**Actions:**
1. Strict validation fully enforced
2. No auto-fix option (users must fix manually)
3. Background job to normalize existing recipes
4. Notify users of recipes that need attention

**Success Criteria:**
- < 1% of save attempts fail validation
- All existing recipes normalized
- No user complaints about data loss
- System stability maintained

**Background Normalization:**
```javascript
// Run nightly job to normalize recipes
async function normalizeExistingRecipes() {
  const recipes = await db.query.recipes.findMany({
    where: eq(recipes.needsNormalization, true),
    limit: 100
  });

  for (const recipe of recipes) {
    const normalized = normalizeExistingRecipe(recipe);
    await db.update(recipes)
      .set({ ...normalized, needsNormalization: false })
      .where(eq(recipes.id, recipe.id));
  }
}
```

### Rollout Timeline

```
Week 1-2:   Phase 1 - Deploy validation (read-only)
Week 3-5:   Phase 2 - Enable client-side validation
Week 6-8:   Phase 3 - Enable server-side validation (soft block)
Week 9+:    Phase 4 - Full enforcement
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Recipe Won't Save After Update

**Symptoms:**
- Save button is disabled
- Validation errors displayed
- User cannot save recipe

**Cause:**
Recipe has validation errors that must be fixed

**Solution:**
1. Review validation errors displayed inline
2. Fix each error:
   - Empty section names: Add a name
   - Empty sections: Add items or delete section
   - Empty items: Add text or delete item
3. Save button will enable when all errors are fixed

**Quick Fix:**
Use the normalization function to auto-fix:
```javascript
import { normalizeExistingRecipe } from '@/lib/recipe-import-normalizer';

const fixedRecipe = normalizeExistingRecipe(recipe);
// Display fixed recipe in editor
```

#### Issue 2: Imported Recipe Has Wrong Section Names

**Symptoms:**
- Sections named "Imported Section"
- Section names don't match original source

**Cause:**
External source didn't provide section names, normalization assigned default

**Solution:**
1. Manually rename sections to desired names
2. Save recipe with corrected names

**Prevention:**
Improve import parser to extract section names from source

#### Issue 3: Items Disappeared After Edit

**Symptoms:**
- Some ingredients or steps missing after saving
- User reports data loss

**Cause:**
Empty items were automatically dropped during normalization

**Solution:**
1. Check if items had empty text
2. If legitimate data loss, restore from backup
3. If empty items, explain normalization behavior

**Prevention:**
- Add confirmation before dropping items
- Show normalization summary before save

#### Issue 4: Duplicate Section Names Not Allowed

**Symptoms:**
- User tries to create section with existing name
- Error message displayed

**Cause:**
Misunderstanding - duplicate names ARE allowed

**Solution:**
1. Verify latest code is deployed
2. Check validation schema allows duplicates
3. If bug, fix validation schema

**Verification:**
```typescript
// Duplicate names should be allowed
const schema = z.object({
  name: z.string().min(1) // No uniqueness check
});
```

#### Issue 5: Position Conflicts in Multi-User Scenario

**Symptoms:**
- Sections appear in wrong order
- Items duplicated or missing
- Concurrent edit conflicts

**Cause:**
Multiple users edited same recipe simultaneously

**Solution:**
1. Server automatically reindexes positions
2. Last save wins for each field
3. Users should refresh to see latest state

**Prevention:**
- Implement optimistic locking
- Show "Recipe updated by another user" warning
- Provide merge conflict resolution UI

### Error Messages Reference

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `EMPTY_SECTION_NAME` | "Section name is required" | Section name is empty or whitespace | Add a section name |
| `EMPTY_SECTION` | "This section must contain at least one ingredient/step" | Section has no items | Add items or delete section |
| `NO_INGREDIENTS` | "At least one ingredient is required for a recipe" | Recipe has no ingredients | Add at least one ingredient |
| `EMPTY_ITEM_TEXT` | "Ingredient/Instruction text cannot be empty" | Item text is empty or whitespace | Add text or delete item |
| `INVALID_POSITION` | "Invalid position value" | Position is negative or duplicate | Auto-fixed by system |
| `INVALID_ID` | "Invalid ID format" | ID is not a valid UUID | Auto-fixed by system |
| `VALIDATION_FAILED` | "Validation failed" | Multiple validation errors | Fix all listed errors |

### Debug Mode

Enable debug logging to troubleshoot validation issues:

```javascript
// In browser console
localStorage.setItem('DEBUG_VALIDATION', 'true');

// In server logs
process.env.DEBUG_VALIDATION = 'true';
```

This will log:
- Validation input data
- Validation results
- Normalization transformations
- Error details

---

## Rollback Procedures

### Emergency Rollback

If critical issues arise, follow these steps to rollback:

#### Step 1: Disable Server-Side Validation

```javascript
// In src/app/api/recipes/route.ts
const ENABLE_STRICT_VALIDATION = false; // Set to false

export async function POST(request: Request) {
  if (!ENABLE_STRICT_VALIDATION) {
    // Skip validation, save directly
    const recipe = await db.insert(recipes).values(body);
    return Response.json(recipe);
  }
  
  // Normal validation flow
  // ...
}
```

#### Step 2: Disable Client-Side Validation

```javascript
// In src/components/recipes/recipe-form.tsx
const ENABLE_CLIENT_VALIDATION = false; // Set to false

function RecipeForm() {
  const { validate } = useRecipeValidation();
  
  const handleSave = () => {
    if (ENABLE_CLIENT_VALIDATION) {
      const isValid = validate(formData);
      if (!isValid) return;
    }
    
    // Save recipe
    // ...
  };
}
```

#### Step 3: Deploy Rollback

```bash
# Deploy with validation disabled
git revert <commit-hash>
npm run build
npm run deploy
```

#### Step 4: Monitor System

- Check error rates return to normal
- Verify users can save recipes
- Monitor support tickets
- Collect feedback

#### Step 5: Investigate Root Cause

- Review error logs
- Identify problematic validation rules
- Test fixes in staging
- Plan re-deployment

### Partial Rollback

If only specific validation rules are problematic:

```javascript
// Disable specific validation rules
const strictIngredientSectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1), // Keep this
  position: z.number().int().nonnegative(),
  items: z.array(strictIngredientSchema)
    // .min(1) // Disable this temporarily
});
```

### Data Restoration

If data loss occurs:

#### From Database Backups

```sql
-- Restore specific recipe from backup
INSERT INTO recipes (id, title, ingredients, ...)
SELECT id, title, ingredients, ...
FROM recipes_backup
WHERE id = 'recipe-id';
```

#### From Audit Logs

```javascript
// Restore from audit log
const auditEntry = await db.query.auditLog.findFirst({
  where: and(
    eq(auditLog.entityType, 'recipe'),
    eq(auditLog.entityId, recipeId),
    eq(auditLog.action, 'update')
  ),
  orderBy: desc(auditLog.createdAt)
});

const previousData = JSON.parse(auditEntry.previousData);
await db.update(recipes)
  .set(previousData)
  .where(eq(recipes.id, recipeId));
```

### Communication Plan

#### User Notification Template

```
Subject: Recipe Sections Update - Temporary Rollback

Dear Jump to Recipe Users,

We've temporarily rolled back the recent Recipe Sections update due to 
[specific issue]. Your recipes are safe and accessible.

What this means:
- All recipes remain accessible
- Validation rules temporarily relaxed
- No data has been lost

We're working on a fix and will re-deploy soon.

Thank you for your patience.

- The Jump to Recipe Team
```

### Post-Rollback Actions

1. **Root Cause Analysis**
   - Document what went wrong
   - Identify gaps in testing
   - Update test coverage

2. **Fix and Test**
   - Implement fixes
   - Add regression tests
   - Test in staging environment

3. **Gradual Re-Deployment**
   - Deploy to 10% of users
   - Monitor for 24 hours
   - Gradually increase to 100%

4. **Documentation Update**
   - Update migration guide
   - Add lessons learned
   - Improve troubleshooting section

---

## Additional Resources

### Related Documentation

- [Validation Schema Documentation](../jump-to-recipe/src/lib/validations/README.md)
- [Import Normalization Examples](../jump-to-recipe/src/lib/recipe-import-normalizer.examples.md)
- [Validation Examples](../jump-to-recipe/src/lib/validations/VALIDATION-EXAMPLES.md)
- [Design Document](./.kiro/specs/recipe-sections-hardening/design.md)
- [Requirements Document](./.kiro/specs/recipe-sections-hardening/requirements.md)

### Support Contacts

- **Technical Issues**: dev-team@jumptorecipe.com
- **User Support**: support@jumptorecipe.com
- **Emergency Hotline**: +1-555-RECIPE-911

### Monitoring Dashboards

- **Validation Error Rates**: [Dashboard Link]
- **API Performance**: [Dashboard Link]
- **User Feedback**: [Dashboard Link]

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-23 | 1.0.0 | Initial migration guide created |

---

## Feedback

If you encounter issues not covered in this guide, please:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing GitHub issues
3. Create a new issue with:
   - Recipe ID (if applicable)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or error messages

Your feedback helps us improve this migration process for all users.
