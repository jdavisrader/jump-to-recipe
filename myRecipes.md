# Feature Design Document: "My Recipes" Section

## 1. Feature Overview
Currently, users have no dedicated way to view the recipes they have uploaded. The **“My Recipes”** feature introduces a personal space within the app for logged-in users to view, search, and manage their own recipes. This page mirrors the layout and capabilities of the main “Recipes” page but filters content to only recipes created by the logged-in user.

---

## 2. User Stories
- **US1:** As a logged-in user, I want to access a “My Recipes” option under my account menu so I can quickly view only the recipes I have uploaded.  
- **US2:** As a logged-in user, I want to see my recipes in the same card format as the main recipes page so the interface feels consistent.  
- **US3:** As a logged-in user, I want to search, sort, and filter my recipes so I can easily find a specific one I uploaded.  
- **US4:** As a logged-in user with no uploaded recipes, I want to see an empty-state message with a link to create a recipe so I understand how to get started.  
- **US5:** As a logged-in user, I want the page to load quickly even if I have many recipes.  

---

## 3. Functional Requirements

### Navigation
- Add a **“My Recipes”** option in the account dropdown, directly below “Your Profile.”
- Clicking the option routes to `/my-recipes`.

### Page Behavior
- Display only recipes created by the logged-in user.
- Recipe cards mirror the layout and interaction model of the main “Recipes” page:
  - Thumbnail image  
  - Title  
  - Tags (if any)  
  - Clickable to go to full recipe details  
- Include search, sort, and filter controls identical to the main recipes page.
- Default sorting: most recently added first.

### Empty State
- If no recipes exist for the user:
  - Show a friendly illustration/message: “You haven’t added any recipes yet.”
  - Provide a primary button: **“Create Your First Recipe”** linking to the recipe creation page.

### Permissions
- Show only recipes created by the logged-in user (exclude shared/public recipes unless the user is the creator).
- Must be logged in to access `/my-recipes`.

---

## 4. Non-Functional Requirements
- **Performance:** Support pagination or infinite scroll to handle large recipe sets.  
- **Consistency:** Maintain visual parity with main “Recipes” page components.  
- **Accessibility:** All navigation and controls must be keyboard- and screen reader-friendly.  
- **Responsiveness:** Page must work seamlessly on mobile, tablet, and desktop.  

---

## 5. UI/UX Flow (Wireframe-Level)

**Navigation Flow:**
Account Dropdown
├── Your Profile
├── My Recipes ← NEW
└── Logout


**Page Layout (Desktop & Mobile):**
- **Header:** “My Recipes”
- **Controls Bar:** Search bar + sort dropdown + filter button
- **Content Area:** Grid/list of recipe cards
- **Empty State:** Centered illustration + text + “Create Your First Recipe” button

---

## 6. API/Backend Changes Needed
- **Endpoint:** `GET /users/:id/recipes`  
  - Returns all recipes created by the specified user.
  - Support query params for search, sort, filter, and pagination.
  - Must authenticate to ensure user can only see their own recipes.

- (Optional Optimization)  
  - Use the current `GET /recipes` endpoint with an `owner_id` filter:
    - `GET /recipes?owner_id={currentUserId}`

- **No changes to recipe creation endpoint** beyond existing behavior.

---

## 7. Edge Cases & Error Handling
- **Empty State:** No recipes created yet → show empty state.
- **Deleted Recipes:** If a recipe is soft-deleted by the user, exclude from the list.
- **Permissions Error:** If a user tries to access `/my-recipes` without being logged in, redirect to login page.
- **Large Dataset:** Implement pagination/infinite scroll to prevent slow load times.

---

## 8. Follow-Ups / Open Questions
1. Should the “My Recipes” page also display recipes the user is a collaborator on, or strictly those they created?  
2. Do we need to allow bulk actions (delete multiple recipes, etc.) or just view for now?  
3. Should filters and sorting options persist across sessions (saved preferences)?  

---
