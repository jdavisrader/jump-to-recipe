Feature Specification: Delete Recipe Functionality
1. Overview
This feature enables users to delete an existing recipe from the application. The deletion action is initiated from the recipe editing screen and requires explicit user confirmation through a modal dialog. This prevents accidental deletions and aligns with common UX patterns for destructive actions.
This document describes the user flow, UI requirements, API interaction, validation, and acceptance criteria.

2. User Flow
* User navigates to a recipe detail page
* The recipe displays all its information (title, description, ingredients, etc.).
User clicks the “Edit” button
Redirects to the recipe editing screen /recipes/[id]/edit.
User sees the Delete button
Located at the bottom of the page next to the “Update” button.
Button label: Delete
Styled in a destructive color (e.g., red) to indicate risk.
User clicks the “Delete” button
A modal appears requesting confirmation.

Confirmation modal
Modal content:
Title: Delete Recipe
Body text: “Are you sure you want to delete this recipe? This action cannot be undone.”
Buttons:
Cancel (secondary)
Delete (primary destructive)

User selects an action in the modal
* Clicking Cancel closes the modal and returns the user to the edit page.
* Clicking Delete triggers the recipe deletion API.
After deletion
The user is redirected to:
Either the recipe list page
Or the home/dashboard view
A success toast/alert is displayed: “Recipe deleted successfully.”

3. UI Specifications
3.1 Edit Page Layout
Add a Delete button container below the update section.
Layout example:
[ Update Recipe ]    [ Delete ]
Delete button:
variant="destructive"
Should visually differ from Update (e.g., red background, white text)

3.2 Confirmation Modal
Component should include:
Title: Delete Recipe
Text: Are you sure you want to delete this recipe? This action cannot be undone.
Buttons:
Cancel button:
Secondary style
Must simply close modal
Delete button:
Destructive style
Performs the deletion request

4. Backend & API Requirements
Assumptions:
A DELETE route already exists:
DELETE /api/recipes/[id]

4.1 API Call
Frontend should send a DELETE request:
DELETE /api/recipes/:id
Expected API Response:
200 OK – Recipe deleted successfully
404 Not Found – Recipe does not exist
401 Unauthorized / 403 Forbidden – User lacks permissions
500 Internal Server Error – Unexpected failure

4.2 Post-Deletion Handling
Upon successful deletion:
Clear any local state
Redirect to the recipe list page
Show a toast notification confirming the deletion

5. State Management Requirements
Modal visibility state:
isDeleteModalOpen: boolean
Deletion loading state:
isDeleting: boolean
While isDeleting=true, disable delete button and show spinner

6. Error Handling
If deletion fails:
Display an error toast:
“Failed to delete recipe. Please try again.”
Modal remains open
Button re-enables

7. Edge Cases
User opens delete modal then navigates away → modal should close
API returns 404 → treat as success (recipe is already gone)
User loses network connection → show retry error
Multiple clicks on delete button → blocked by loading state

8. Acceptance Criteria
✔ User can navigate to edit page
✔ Delete button appears at bottom next to Update
✔ Delete button triggers confirmation modal
✔ Modal includes cancel + delete actions
✔ Cancel closes modal
✔ Delete calls API
✔ Successful delete redirects user & shows confirmation
✔ Failed delete shows error message
✔ UI prevents double-submit