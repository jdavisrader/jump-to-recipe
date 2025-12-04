# Requirements Document

## Introduction

This feature enables administrators to manage user accounts within the Jump to Recipe application. Admins will have the ability to view all users in a comprehensive table, edit user profile information and roles, and delete users while reassigning ownership of their content (recipes and cookbooks) to other users. This ensures that no user-generated content is orphaned when accounts are removed from the system.

The feature provides a complete user management interface that maintains data integrity while giving admins full control over user accounts and permissions.

## Requirements

### Requirement 1: User List Page

**User Story:** As an admin, I want to view all users in a sortable and filterable table so that I can quickly find and manage user accounts.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/users` THEN the system SHALL display a table containing all user accounts
2. WHEN the user list is displayed THEN the system SHALL show the following columns: Name, Email, Role, Recipe count, Cookbook count, Created at, Updated at, and Actions
3. WHEN the user list loads THEN the system SHALL sort users alphabetically by name by default
4. WHEN an admin enters text in the search field THEN the system SHALL filter users by name or email matching the search term
5. WHEN an admin selects a role filter THEN the system SHALL display only users with the selected role
6. WHEN an admin clicks a column header THEN the system SHALL sort the table by that column in ascending or descending order
7. WHEN an admin clicks the edit action THEN the system SHALL navigate to the user detail page for that user
8. WHEN an admin clicks the delete action THEN the system SHALL display a confirmation modal for user deletion

### Requirement 2: User Detail and Edit Page

**User Story:** As an admin, I want to edit user profile information and account roles so that I can maintain accurate user data and control access levels.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/users/[id]` THEN the system SHALL display the user detail page with all user information
2. WHEN the user detail page loads THEN the system SHALL display editable fields for Name, Email, and Role
3. WHEN the user detail page loads THEN the system SHALL display non-editable fields for User ID, Created at, and Updated at
4. WHEN the user detail page loads THEN the system SHALL display the total count of recipes created and cookbooks owned by the user
5. WHEN an admin clicks the password field THEN the system SHALL open a modal for password update
6. WHEN an admin modifies any editable field THEN the system SHALL enable the Save button
7. WHEN an admin clicks Save THEN the system SHALL disable the Save button and submit the changes to the API
8. WHEN the API successfully updates the user THEN the system SHALL display a success toast message
9. WHEN the API fails to update the user THEN the system SHALL display an error toast message and re-enable the Save button
10. WHEN an admin changes the user role THEN the system SHALL update the role value in the database immediately upon save
11. WHEN displaying the role field THEN the system SHALL provide options for `regular`, `elevated`, and `admin` roles

### Requirement 3: User Deletion with Ownership Reassignment

**User Story:** As an admin, I want to delete user accounts and transfer ownership of their content to another user so that no recipes or cookbooks are left without an owner.

#### Acceptance Criteria

1. WHEN an admin clicks the Delete User button THEN the system SHALL display a confirmation modal
2. WHEN the confirmation modal is displayed THEN the system SHALL require the admin to select a new owner from a dropdown list of existing users
3. WHEN the confirmation modal is displayed THEN the system SHALL exclude the user being deleted from the new owner dropdown
4. WHEN the confirmation modal is displayed THEN the system SHALL show a warning that the deletion is irreversible
5. WHEN an admin confirms deletion without selecting a new owner THEN the system SHALL prevent deletion and display a validation error
6. WHEN an admin confirms deletion with a valid new owner THEN the system SHALL transfer ownership of all recipes created by the deleted user to the new owner
7. WHEN an admin confirms deletion with a valid new owner THEN the system SHALL transfer ownership of all cookbooks owned by the deleted user to the new owner
8. WHEN ownership is transferred THEN the system SHALL remove the deleted user from all cookbook collaborator lists
9. WHEN ownership transfer is complete THEN the system SHALL hard-delete the user account from the database
10. WHEN the user is successfully deleted THEN the system SHALL display a success toast message
11. WHEN the user is successfully deleted THEN the system SHALL redirect the admin to `/admin/users`
12. WHEN the deletion fails THEN the system SHALL display an error toast message and keep the modal open

### Requirement 4: Admin Access Control

**User Story:** As a system administrator, I want to ensure that only users with admin role can access user management features so that the system remains secure.

#### Acceptance Criteria

1. WHEN a non-admin user attempts to access `/admin/users` THEN the system SHALL redirect them to an unauthorized page
2. WHEN a non-admin user attempts to access `/admin/users/[id]` THEN the system SHALL redirect them to an unauthorized page
3. WHEN a non-admin user attempts to call admin user management APIs THEN the system SHALL return a 403 Forbidden error
4. WHEN middleware validates admin access THEN the system SHALL check the user's role from the authenticated session
5. WHEN an admin's session expires THEN the system SHALL redirect them to the login page

### Requirement 5: Data Validation and Security

**User Story:** As a system administrator, I want all user management operations to be validated and secure so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN an admin submits user profile changes THEN the system SHALL validate all fields on the server side
2. WHEN an admin enters an invalid email format THEN the system SHALL display a validation error
3. WHEN an admin attempts to set an email that already exists THEN the system SHALL display an error message
4. WHEN an admin updates a user password THEN the system SHALL hash the password before storing it
5. WHEN an admin attempts to delete the last admin user THEN the system SHALL prevent deletion and display an error
6. WHEN ownership reassignment occurs THEN the system SHALL execute all database operations within a transaction
7. WHEN a database operation fails during deletion THEN the system SHALL roll back all changes and display an error message
