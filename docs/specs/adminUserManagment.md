# Epic 2 — Admin User Management

## Epic Overview

This epic enables admins to manage user accounts within the recipe app. Admins can view all users, update user roles, edit user profile details, reassign ownership of user-generated content when deleting a user, and delete users entirely. This epic establishes full CRUD functionality for user accounts from the admin perspective.

The goal is to provide a clear, efficient interface for managing users and handling ownership transitions for recipes and cookbooks.

---

## Features

### **Feature 2.1 — User List Page**

**Description:** Provide a table view of all users with basic account info and management actions.

#### Requirements

* Page path: `/admin/users`
* Displays all users in a sortable and filterable table.
* Table columns:

  * Name
  * Email
  * Role
  * Recipe count
  * Cookbook count
  * Created at
  * Updated at
  * Actions (edit, delete)
* Default sort: **alphabetical by name**
* Supports:

  * search by name or email
  * filter by role
  * sort by name, creation date, or role
* Uses existing table and filter components.

---

### **Feature 2.2 — User Detail & Edit Page**

**Description:** Allow admins to edit user profile information and account role.

#### Requirements

* Page path: `/admin/users/[id]`
* Editable fields:

  * Name
  * Email
  * Role (`regular`, `elevated`, `admin`)
  * Password (updated through a modal)
* Non-editable fields:

  * User ID
  * Created at
  * Updated at
* Show associated resource counts:

  * Total recipes created
  * Total cookbooks owned
* UI patterns:

  * Reuse existing form styles
  * Toast on success or failure
  * Disable Save button during API submission
* Role changes update the database immediately.

---

### **Feature 2.3 — Delete User + Ownership Reassignment**

**Description:** Admins can delete user accounts and transfer ownership of all recipes and cookbooks to another user.

#### Requirements

* When clicking **Delete User**, show a confirmation modal.
* Modal requires admin to:

  * Select a new owner from a dropdown list of existing users.
  * Confirm irreversible deletion.
* On delete:

  * Transfer ownership of:

    * All recipes created by the user
    * All cookbooks owned by the user
  * Remove the user from collaborator lists
  * Hard-delete the user account
* Success toast shown after deletion
* Redirect back to `/admin/users`

---

## User Stories

### **Admin Views All Users**

As an admin, I want to view all users so I can understand who has access to the app and how much content they have created.

### **Admin Edits User Details**

As an admin, I want to modify user profiles, including their role and password, so I can maintain control of the system.

### **Admin Deletes User with Reassignment**

As an admin, I want to delete a user and reassign their content so that no recipes or cookbooks are left without an owner.

---

## Functional Requirements Summary

* Admin-only access enforced via middleware.
* Full table of all users with search, filter, sort.
* Editable profile fields (name, email, role, password).
* Ownership reassignment required on deletion.
* Hard-delete user records.
* Remove deleted users from collaborator lists.
* Reuse existing UI components and toast system.

---

## Non-Functional Requirements

* UI should remain responsive even with up to thousands of users.
* Sorting and filtering operations should be fast (server-side or optimized client-side).
* Secure server-side validation for all admin APIs.
* Consistent styling with existing app.

---

## Assumptions

* Admin role values already exist: `regular`, `elevated`, `admin`.
* Admin cannot create new users.
* Admin does not need to view detailed activity logs.
* Email change does NOT require email verification (for now).
* Deleting a user requires ownership reassignment (mandatory).
* Admin can update user roles via DB update.
* No impersonation or session switching required.

---

## Out of Scope

* Bulk user actions
* Audit logs
* Two-factor authentication
* Email verification system

---

## Open Questions

None at this time.

---
