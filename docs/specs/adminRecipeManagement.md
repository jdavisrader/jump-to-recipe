# Epic 4 — Recipe Management (Global Admin Control)

## Epic Description

Recipe Management enables administrators to view, search, filter, edit, and delete *any* recipe in the system. It gives admins full visibility and control over recipe content and ownership, while reusing existing user-facing components wherever possible. This epic focuses on building the admin-facing list views and augmenting the existing recipe edit experience to support admin-level actions like ownership reassignment and global deletion.

## Epic Goal

Provide administrators with powerful tools to:

* Browse and manage all recipes in the system
* Access any recipe directly from the admin panel
* Edit recipes using the existing recipe edit UI
* Reassign recipe ownership (admin-only)
* Delete recipes using the standard delete flow

This epic centralizes recipe governance in one place while minimizing duplicate UI by extending existing components.

## What This Epic Accomplishes

* Adds **admin-only recipe discovery** via list, filter, and search tools.
* Gives admins **global access** to edit/delete actions.
* Adds **new ownership reassignment functionality** (admin-only).
* Ensures a consistent user experience through reuse of existing UI components.
* Lays the foundation for later analytics, bulk actions, or moderation features.

---

# Features, User Stories & Requirements

## Feature A — Admin Recipe List Page

### User Story

As an **admin**, I need to browse all recipes in the system with filtering, sorting, and search so that I can quickly find and manage recipes.

### Requirements

**UI**

* Page: `/admin/recipes`
* Table columns:

  * Recipe Title
  * Owner Name
  * Date Created
  * Date Updated
  * Visibility (if applicable)
* Search bar:

  * Search by **title** and **tags**
* Filters:

  * Filter by **author/owner**
  * Filter by **visibility** (if applicable)
* Sorting:

  * Sort by **title**
  * Sort by **date created**
  * Sort by **date updated**

**Behavior**

* Clicking a recipe in the list navigates the admin to the **public recipe page**, where they can edit/delete.

**Backend**

* Server-side query with pagination
* Search + filter parameters handled in DB query

---

## Feature B — Admin Click → Open Existing Recipe Page

### User Story

As an **admin**, when I click a recipe, I want to view the recipe the same way as an end user, without a separate admin screen.

### Requirements

* Clicking a recipe in the admin table navigates to `/recipes/[id]`.
* No admin-specific recipe detail page is required.
* Admins see the **edit** and **delete** buttons on the recipe page.
* They can use the **existing edit UI**.

---

## Feature C — Full Admin Editing Using Existing Components

### User Story

As an admin, I want to edit any recipe using the existing edit interface so that I can make corrections or adjustments without duplicating UI.

### Requirements

* Admins can access the **same “Edit Recipe” page** that the owner uses.
* No new UI components created for admin editing.
* Admins have the **same editing permissions as owners**:

  * Title
  * Ingredients
  * Sections
  * Steps
  * Tags
  * Metadata
* Admins should NOT see any UI specific to ownership transfer (unless defined in Feature D).

---

## Feature D — Assign Recipe Owner (Admin Only)

### User Story

As an admin, I want to change the owner of a recipe so that I can correct ownership issues or transfer recipes when users leave the platform.

### Requirements

#### UI

* Only visible to admins.
* Appears on the **existing recipe edit page**, no new screen created.
* Component:

  * Label: **“Assign Owner”**
  * A **searchable dropdown** listing all users
  * Preselect current owner
* Owner is **required** (cannot be blank)

#### Behavior

* Admin selects a new user from the dropdown.
* When saving the recipe:

  * The `ownerId` is updated.
* If no change is made, owner remains unchanged.

#### Backend

* `updateRecipe` accepts `ownerId` but **only applies it if the requester is an admin**.
* Validation:

  * `ownerId` must exist
  * Cannot be null or omitted when admin sets it

#### Other

* No notifications are required.

---

## Feature E — Admin Delete Recipe

### User Story

As an admin, I want to delete any recipe so that I can remove inappropriate or outdated content.

### Requirements

* Reuse existing **delete button** on the edit page.
* Reuse existing **delete confirmation flow**.
* No admin-specific delete screens required.
* Deleting a recipe is a **hard delete**.

---

# Assumptions

1. Admin permissions and route guards are already implemented via Epic 1.
2. Searchable user dropdown will use existing user list API or a new simple endpoint.
3. Admins already have the ability to load the existing recipe edit page.
4. Recipes must always have an owner — owner cannot be removed.
5. No audit log is required for ownership changes (for now).
6. Visibility filtering only applies if your recipes have a visibility field.
7. No bulk recipe actions are in scope for this epic.

---

# Deliverables

* `/admin/recipes` route
* Recipe list page with search/filter/sort
* Navigation → recipe detail → recipe edit flow works for admins
* Ownership transfer component on recipe edit page (admin only)
* Updated backend logic to validate/administer owner changes
* Ensure admin delete works inside the existing UI
