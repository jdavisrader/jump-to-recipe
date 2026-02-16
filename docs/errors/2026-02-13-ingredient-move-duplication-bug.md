# 🔎 Ingredient Move Bug Report

**Date:** 2026-02-13
**Status:** Root cause identified, fix applied

---

## 1. Reproduction Result

**Bug reproduced:** YES (via code trace)

**Steps:**
1. Create recipe with Section A (contains Ingredient X) and Section B (empty)
2. Drag Ingredient X from Section A → Section B
3. UI correctly shows: Section A empty, Section B has Ingredient X
4. Save recipe
5. Reload recipe
6. Ingredient X appears in BOTH Section A and Section B

---

## 2. Frontend State Before Save

```json
{
  "ingredientSections": [
    { "id": "section-a", "name": "Section A", "items": [] },
    { "id": "section-b", "name": "Section B", "items": [{ "id": "ingredient-x", "name": "Salt", "position": 0 }] }
  ]
}
```

**Conclusion:** Frontend state is CORRECT. Ingredient X is only in Section B. The `moveBetweenSections()` utility correctly splices from source and inserts into destination. The `replaceSections()` call atomically updates both sections.

---

## 3. Outgoing API Payload

```json
{
  "ingredients": [],
  "ingredientSections": [
    { "id": "section-a", "name": "Section A", "items": [] },
    { "id": "section-b", "name": "Section B", "items": [{ "id": "ingredient-x", "name": "Salt", "position": 0 }] }
  ]
}
```

**Conclusion:** Payload is CORRECT. `submitRecipe()` in `recipe-form.tsx` clears the flat `ingredients` array when sections exist, and sends sections as-is. Ingredient X appears only in Section B.

---

## 4. Server Received Payload

Server receives the payload exactly as sent. The PUT handler in `route.ts` logs it and passes it to `normalizeExistingRecipe()`, which delegates to `normalizeImportedRecipe()`. The normalizer correctly keeps `ingredients: []` because both `ingredientSections` and `ingredients` are explicitly provided.

---

## 5. Server Persistence Logic — WHERE THE BUG IS

After normalization, the PUT handler calls `resolveSectionConflicts()` to merge incoming sections with existing DB sections (for concurrent edit support).

**File:** `jump-to-recipe/src/lib/section-position-utils.ts`

**Function:** `resolveSectionConflicts()` → calls `resolvePositionConflicts()` per section

**The bug is in `resolvePositionConflicts()` (line 218):**

```typescript
function resolvePositionConflicts<T extends WithPosition>(
  existingItems: T[],
  incomingItems: T[]
): T[] {
  // BUG: When incomingItems is empty, it returns existingItems
  // This means an intentionally emptied section gets its old items restored
  if (!incomingItems || incomingItems.length === 0) {
    return reindexItemPositions(existingItems || []);  // ← BUG HERE
  }
  // ...
  // Also: existing items NOT in incoming set are appended
  existingItems.forEach((item) => {
    if (!incomingMap.has(item.id)) {
      mergedItems.push(item);  // ← SECONDARY BUG: moved items get re-added
    }
  });
}
```

**Two bugs in one function:**

1. **Empty array fallback (line 222-224):** When `incomingItems` is `[]` (section was emptied by moving all items out), the function returns the existing items from the DB. This restores the moved ingredient back into the source section.

2. **Orphan item re-addition (line 253-256):** Even if the incoming array isn't empty, any existing items NOT present in the incoming set are appended. This means if you move 1 of 3 items out of a section, the moved item gets re-added from the existing DB state.

---

## 6. Database State After Save

```
Section A: [Ingredient X]  ← WRONG: should be empty, restored by resolvePositionConflicts
Section B: [Ingredient X]  ← CORRECT: from incoming data
```

**Conclusion:** Duplication occurs in the server-side `resolvePositionConflicts()` function during the merge step.

---

## 7. Root Cause

`resolvePositionConflicts()` was designed for concurrent edit conflict resolution (merging changes from multiple users). It assumes that if an item exists in the DB but not in the incoming payload, it was added by another user and should be preserved.

However, this assumption is wrong for the single-user drag-and-drop case: when a user moves an ingredient OUT of a section, the incoming payload intentionally omits that ingredient from the source section. The merge logic interprets this as "another user might have added it" and restores it.

**The function cannot distinguish between:**
- "This item was removed intentionally" (drag-and-drop move)
- "This item was added by another user and should be preserved" (concurrent edit)

---

## 8. Proposed Fix

The fix is in `resolvePositionConflicts()`. Since this is a single-user application (no real-time collaboration), the incoming data should be treated as the source of truth. The "preserve existing items not in incoming set" logic should be removed, and the empty array should be treated as intentional.

**Minimal fix:** Make the incoming items array authoritative — don't re-add existing items that aren't in the incoming set.
