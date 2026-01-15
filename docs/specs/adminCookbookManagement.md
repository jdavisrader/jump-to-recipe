# Epic 5 — Cookbook Management (Admin CRUD + Ownership Transfer)

## Epic Description

This epic provides administrators with full control over cookbooks across the platform. Admins can browse, edit, reassign ownership, manage collaborators, and delete cookbooks while reusing existing user-facing components wherever possible.

Cookbooks introduce additional complexity due to ownership and collaboration, and this epic ensures admins can safely manage those relationships without introducing unnecessary new UI patterns.

## Epic Goal

Enable administrators to:

* View and manage all cookbooks in the system
* Edit cookbook metadata
* Manage collaborators
* Reassign cookbook ownership
* Delete cookbooks when necessary

This epic ensures data consistency and moderation capability while maintaining a clean, reusable architecture.

## What This Epic Accomplishes

* Global admin visibility into all cookbooks
* Admin-only control over ownership and collaborators
* Reuse of existing cookbook view and edit flows
* Consistent admin experience aligned with prior epics

---

# Features, User Stories & Requirements

## Feature A — Admin Cookbook List Page

### User Story

As an admin, I want to browse all cookbooks so I can quickly manage platform content.

### Requirements

**UI**

* Route: `/admin/cookbooks`
* Table columns:

  * Cookbook Title
  * Owner
  * Collaborator Count
  * Recipe Count
  * Date Created
* Search:

  * By cookbook title
* Filters:

  * Owner
* Sorting:

  * Title (A–Z / Z–A)
  * Date Created (newest / oldest)
* Pagination required

**Behavior**

* Clicking a cookbook navigates to the existing cookbook page.

---

## Feature B — View Cookbook (Reuse Existing Pages)

### User Story

As an admin, I want to view a cookbook the same way a user does so I can understand its contents.

### Requirements

* Clicking a cookbook opens the existing cookbook detail page.
* No admin-specific cookbook detail page is required.
* Admins can see edit/delete actions normally restricted to the owner.

---

## Feature C — Edit Cookbook Metadata (Reuse Existing Components)

### User Story

As an admin, I want to edit cookbook metadata so I can correct or update cookbook details.

### Requirements

* Reuse existing cookbook edit UI.
* Admin has the same permissions as the owner to edit:

  * Title
  * Description
  * Cover image (if applicable)
* Save behavior uses existing logic and validations.

---

## Feature D — Manage Collaborators (Admin Only)

### User Story

As an admin, I want to manage cookbook collaborators so I can control access appropriately.

### Requirements

* Admin-only UI component.
* Appears on the existing cookbook edit page.
* Capabilities:

  * View current collaborators
  * Add collaborator (user search/select)
  * Remove collaborator
* Reuse existing collaborator logic where possible.

---

## Feature E — Assign Cookbook Owner (Admin Only)

### User Story

As an admin, I want to reassign a cookbook’s owner so I can fix ownership issues or transfer data.

### Requirements

* Admin-only UI component.
* Appears on the existing cookbook edit page.
* Searchable dropdown of all users.
* Owner is required (cannot be empty).
* Backend validation ensures only admins can change ownership.

---

## Feature F — Delete Cookbook

### User Story

As an admin, I want to delete a cookbook so I can remove outdated or invalid content.

### Requirements

* Reuse existing delete button and confirmation flow.
* Deletion is a hard delete.
* Deleting a cookbook does not delete recipes contained within it.

---

# Assumptions

1. Cookbooks have a single owner and multiple collaborators.
2. Collaborators do not automatically become owners.
3. Admins bypass all cookbook permission checks.
4. Reassigning ownership does not affect recipes inside the cookbook.
5. Existing cookbook edit UI is reusable.
6. Hard delete behavior is acceptable for MVP.
7. No audit log or notifications are required.
8. No bulk cookbook actions are included in this epic.

---

# Deliverables

* `/admin/cookbooks` route
* Cookbook list page with search, filter, sort, and pagination
* Admin access to existing cookbook view and edit pages
* Admin-only collaborator management UI
* Admin-only ownership reassignment UI
* Admin delete using existing workflow
