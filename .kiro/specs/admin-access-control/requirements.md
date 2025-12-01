# Requirements Document

## Introduction

This feature introduces admin-only access control to the Jump to Recipe application. It establishes a role-based permission system that restricts access to administrative pages and functionality to users with the `admin` role. The implementation uses both server-side middleware for security and client-side feedback for user experience, ensuring that unauthorized access attempts are properly handled with clear messaging.

## Requirements

### Requirement 1: Role-Based Access Control

**User Story:** As a system administrator, I want only users with admin privileges to access administrative pages, so that sensitive functionality is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN a user's role is `admin` THEN the system SHALL grant access to all admin routes
2. WHEN a user's role is `user` or `elevated` THEN the system SHALL deny access to admin routes
3. WHEN an unauthenticated user attempts to access an admin route THEN the system SHALL redirect to `/login`
4. WHEN an authenticated non-admin user attempts to access an admin route THEN the system SHALL redirect to `/`
5. IF a user attempts unauthorized access THEN the system SHALL display a toast notification with title "Not authorized" and message "You do not have permission to access that page."

### Requirement 2: Admin Navigation Access

**User Story:** As an admin user, I want to see an admin link in my profile dropdown, so that I can easily navigate to administrative pages.

#### Acceptance Criteria

1. WHEN a user with role `admin` opens the profile dropdown THEN the system SHALL display an "Admin" navigation link
2. WHEN a user with role `user` or `elevated` opens the profile dropdown THEN the system SHALL NOT display the admin navigation link
3. WHEN an admin clicks the "Admin" link THEN the system SHALL navigate to `/admin`
4. The admin link SHALL appear within the existing profile dropdown component
5. The admin link SHALL NOT appear in the top-level navigation bar

### Requirement 3: Server-Side Authorization Middleware

**User Story:** As a security-conscious developer, I want admin routes protected at the server level, so that unauthorized users cannot access admin content even if they bypass client-side checks.

#### Acceptance Criteria

1. WHEN a request is made to any `/admin/*` route THEN the middleware SHALL execute before rendering
2. WHEN the middleware detects an unauthenticated user THEN it SHALL redirect to `/login?unauthorized=1`
3. WHEN the middleware detects an authenticated non-admin user THEN it SHALL redirect to `/?unauthorized=1`
4. WHEN the middleware detects an admin user THEN it SHALL allow the request to proceed
5. The middleware SHALL check the user's role from the session token
6. The middleware SHALL append the `unauthorized=1` query parameter to enable client-side toast notifications

### Requirement 4: Client-Side Authorization Feedback

**User Story:** As a user who attempts to access an admin page, I want to see a clear message explaining why I was redirected, so that I understand the access restriction.

#### Acceptance Criteria

1. WHEN a page loads with the `unauthorized=1` query parameter THEN the system SHALL display a toast notification
2. The toast notification SHALL have the title "Not authorized"
3. The toast notification SHALL have the message "You do not have permission to access that page."
4. WHEN the toast is displayed THEN the system SHALL remove the `unauthorized` query parameter from the URL
5. The toast SHALL use the existing global toast component
6. The toast SHALL appear only once per unauthorized access attempt

### Requirement 5: Admin Page Structure

**User Story:** As a developer, I want placeholder admin pages created, so that the routing structure is established for future admin functionality.

#### Acceptance Criteria

1. The system SHALL provide an admin dashboard page at `/admin`
2. The system SHALL provide a users management page at `/admin/users`
3. The system SHALL provide a recipes management page at `/admin/recipes`
4. The system SHALL provide a cookbooks management page at `/admin/cookbooks`
5. WHEN an admin accesses `/admin` THEN the page SHALL display "Welcome to Admin Dashboard"
6. WHEN an admin accesses `/admin/users` THEN the page SHALL display "User Management Coming Soon"
7. WHEN an admin accesses `/admin/recipes` THEN the page SHALL display "Recipe Management Coming Soon"
8. WHEN an admin accesses `/admin/cookbooks` THEN the page SHALL display "Cookbook Management Coming Soon"
9. All admin pages SHALL use the existing default application layout
10. All admin pages SHALL be accessible only to users with the `admin` role

### Requirement 6: Admin Role Management

**User Story:** As a system administrator, I want a documented process for granting admin privileges, so that I can manage admin access until a UI is available.

#### Acceptance Criteria

1. The system SHALL support manual database updates to set user roles
2. The documentation SHALL provide the SQL command: `UPDATE users SET role = 'admin' WHERE email = 'example@example.com';`
3. The role field SHALL accept values: `user`, `elevated`, or `admin`
4. WHEN a user's role is updated to `admin` THEN they SHALL immediately have access to admin routes upon next login
5. The system SHALL validate that the role field contains only valid role values
