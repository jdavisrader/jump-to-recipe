# Feature Design Document: Add Recipes to Cookbooks

## Overview
This feature allows users to add or remove recipes from their cookbooks directly from the recipe page. It provides a modal interface with checkboxes for cookbooks that the user can edit, ensuring no duplicate entries and a seamless add/remove flow.  

---

## User Stories

1. **As a user**, I want to click a button on a recipe page to quickly add that recipe to one of my cookbooks.  
2. **As a user**, I want to see which cookbooks the recipe is already part of, so I don’t add duplicates.  
3. **As a user**, I want to be able to remove a recipe from a cookbook from the same interface.  
4. **As a user**, I want immediate visual feedback (checkbox checked/unchecked) when I add or remove a recipe.  
5. **As a user with no cookbooks**, I want to be taken to a “Create Cookbook” page so I can make one.  
6. **As a user with multiple cookbooks**, I want to quickly search for the right cookbook in the modal.  
7. **As a user with edit rights on a shared cookbook**, I want to be able to add or remove recipes from it.  
8. **As a collaborator with view-only rights**, I should not see cookbooks I cannot edit in the modal.  
9. **As a user**, I want to keep recipe references live so if the original recipe is updated, I can still access notes/comments in my cookbook view.  

---

## Functional Requirements

1. **Recipe Reference Model**
   - Cookbook entries reference the original recipe object.  
   - Notes/comments remain attached to the original recipe.  

2. **Permissions**
   - Only cookbook owners and collaborators with edit rights can add/remove recipes.  
   - View-only collaborators cannot see their cookbooks in the modal.  

3. **Uniqueness**
   - A recipe may only exist **once per cookbook**.  

4. **Deletion Rules**
   - If a recipe is deleted from the system → cookbook entry becomes a **“deleted recipe placeholder”** (still visible in cookbook).  
   - If a cookbook is deleted → all recipe relations for that cookbook are **hard-deleted**.  

---

## API Design

### Endpoints

#### Add Recipe to Cookbook
POST /cookbooks/:cookbookId/recipes
Body: { recipeId: string }
Response: 200 OK { success: true }

#### Remove Recipe from Cookbook
DELETE /cookbooks/:cookbookId/recipes/:recipeId
Response: 200 OK { success: true }

#### Get Cookbooks for a Recipe (editable only)
GET /recipes/:id/cookbooks?editableOnly=true
Response: [
{ id: string, name: string, isChecked: boolean }
]

- `editableOnly=true` ensures the modal only shows cookbooks user can edit.  
- Alternatively, fetch all cookbooks and merge permissions on client.  

---

## UI/UX Flow

### Entry Point
- **Primary “Add to Cookbook” button** placed near the top of the recipe page.  

### Modal Layout
- **Title:** “Add to Cookbook”  
- **Search bar:** filters cookbooks by name (real time).  
- **Cookbook list:**  
  - Checkboxes next to each editable cookbook.  
  - Checked = recipe is in that cookbook.  
  - Unchecked = not included.  
- **Create Cookbook button:**  
  - Always present at the bottom.  
  - If user has no editable cookbooks, this is the only option shown.  

### Checkbox Behavior
- **Checked:**  
  - `POST /cookbooks/:id/recipes` called immediately.  
- **Unchecked:**  
  - `DELETE /cookbooks/:id/recipes/:recipeId` called immediately.  
- **Optimistic UI update:** state changes instantly; rollback if error.  
- **Error Handling:** show toast notification if API fails, revert checkbox.  

### Sorting
Cookbooks displayed in the following order:  
1. Recently used (last added-to).  
2. Owned cookbooks.  
3. Collaborated cookbooks.  

---

## Edge Cases

1. User has **no cookbooks** → modal shows only “Create Cookbook” button.  
2. User has cookbooks but **no edit rights** → same behavior as above.  
3. User creates a new cookbook from modal → redirected to cookbook creation page.  
4. Recipe deleted from system → persists in cookbooks as “deleted recipe placeholder.”  
5. Cookbook deleted → all associated recipe relations hard-deleted.  

---

## Data Model Changes

### CookbookRecipe (Join Table)
```ts
CookbookRecipe {
  id: string
  cookbookId: string (FK)
  recipeId: string (FK, nullable if deleted recipe placeholder)
  createdAt: Date
  updatedAt: Date
}
- Ensures uniqueness constraint: (cookbookId, recipeId) must be unique.
Supports “deleted recipe placeholder” by keeping null recipeId but preserving the relation row.
Technical Notes
Optimistic UI is critical for responsiveness.
Permission filtering: server should respect editableOnly param, but client can double-check with merged user data.
Search inside modal: case-insensitive substring match.
Deleted recipe placeholders: when recipeId is null, display "Deleted Recipe" in cookbook view.