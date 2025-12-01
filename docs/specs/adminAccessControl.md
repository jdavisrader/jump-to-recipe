# Epic 1: Admin Access Control

## Overview

This epic introduces admin-only pages and permissions into the Jump to Recipe application. It ensures that only authenticated users with the role `admin` can view or interact with admin routes. Unauthorized users will be redirected and shown a global toast message. Admin navigation will be accessible through the existing profile dropdown.

---

## Goals

* Add admin-only routes and pages
* Add server + client middleware to enforce admin access
* Add navigation entry for admin pages inside the profile dropdown
* Display a toast message when a non-admin attempts to access admin pages
* Create placeholder admin pages for future expansion
* Add a basic manual DB update workflow for setting admin roles

---

## Requirements

### 1. Admin Roles

* Admin status is determined by the existing `role` field in the user model.
* Possible roles: `user` | `elevated` | `admin`.
* Only `admin` role grants access to admin routes.

### 2. Navigation

* The admin link must appear inside the **profile dropdown** (not the top nav).
* It only renders if `session.user.role === "admin"`.
* Text: **Admin**
* Link: `/admin`

### 3. Redirect + Authorization Messages

When a user without admin privileges attempts to access an admin route:

* They should be redirected:

  * If authenticated → redirect to `/`
  * If not authenticated → redirect to `/login`
* The existing global toast component must show:

  * **Title:** "Not authorized"
  * **Message:** "You do not have permission to access that page."

### 4. Middleware

We will use a hybrid access control approach:

#### **a. Next.js Middleware (server middleware)**

* Runs before rendering `/admin` routes.
* Checks authentication and role from session token.
* If user is not admin → redirect and attach a search param (`?unauthorized=1`).

#### **b. Client Middleware (layout-level)**

* The admin layout reads the search param and triggers a global toast if `unauthorized=1`.
* This ensures the toast is only shown client-side.

#### Why use middleware?

* Protects admin routes before any server-rendered content loads.
* More secure than client-side checks.
* Avoids loading full pages only to redirect.

### 5. Placeholder Admin Pages

Create a minimal `/admin` section:

```
/admin
/admin/users
/admin/recipes
/admin/cookbooks
```

Each should contain simple placeholder content:

* Admin Home: "Welcome to Admin Dashboard"
* Users Page: "User Management Coming Soon"
* Recipes Page: "Recipe Management Coming Soon"
* Cookbooks Page: "Cookbook Management Coming Soon"


All pages must use the existing default layout—**no separate admin layout needed**.


### 6. Database Update Process

Until admin UI is ready, administrators can be set manually.

Temporary workflow:

```sql
UPDATE users SET role = 'admin' WHERE email = 'example@example.com';
```

Future admin pages will allow role management.

---

## Deliverables

* `/middleware.ts` implemented for admin routing
* `/admin` folder with placeholder pages
* Profile dropdown updated with admin link
* Client-side toast trigger logic added
* DB update instructions included

---

## Acceptance Criteria

* Admin users can access `/admin` pages normally
* Non-admin authenticated users get redirected and shown a toast
* Unauthenticated users get redirected to login and shown a toast
* Admin link appears only in the profile dropdown for admin users
* All admin pages render with the existing site layout
* Placeholder pages render successfully

---

## Out of Scope

* Admin CRUD features
* User role management UI
* Automated tests
* Visual styling beyond placeholder content

---

## Notes

This epic sets the foundation for the future Admin Dashboard epics but keeps implementation lightweight and fully aligned with the current project architecture.
