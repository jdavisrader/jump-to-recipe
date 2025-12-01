# Admin Role Setup Guide

This document provides instructions for setting up and managing admin roles in the Jump to Recipe application.

## Overview

The Jump to Recipe application uses a role-based access control system with three permission levels:

- **`user`** (default): Standard user access with ability to create and manage own recipes and cookbooks
- **`elevated`**: Enhanced permissions (reserved for future use)
- **`admin`**: Full administrative access to all system features and management pages

## Initial Admin Setup

Since there is no UI for role management yet, admin privileges must be granted manually through direct database access.

### Prerequisites

- Access to the PostgreSQL database
- Database credentials with UPDATE permissions on the `users` table
- Email address of the user account to be granted admin access

### Step 1: Grant Admin Role

Connect to your database and run the following SQL command:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with the actual email address of the user account.

### Step 2: Verify Role Assignment

Confirm the role was updated successfully:

```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```

You should see the role column showing `admin` for the specified user.

### Step 3: Refresh JWT Token

**Important**: Role changes are stored in the JWT session token. For the admin role to take effect, the user must:

1. Log out of the application completely
2. Log back in with their credentials

This will generate a new JWT token with the updated role information.

## Accessing Admin Features

Once the admin role is active, admin users will see:

- An "Admin" link in their profile dropdown menu (top-right corner)
- Access to admin pages at `/admin`, `/admin/users`, `/admin/recipes`, and `/admin/cookbooks`

Non-admin users attempting to access admin pages will be redirected with an "Not authorized" message.

## Managing Multiple Admins

To grant admin access to additional users, repeat the process above for each user's email address:

```sql
UPDATE users SET role = 'admin' WHERE email = 'another-admin@example.com';
```

## Revoking Admin Access

To remove admin privileges from a user:

```sql
UPDATE users SET role = 'user' WHERE email = 'former-admin@example.com';
```

The user must log out and log back in for the change to take effect.

## Valid Role Values

The `role` field in the `users` table accepts only these values:

- `user`
- `elevated`
- `admin`

Attempting to set any other value may cause authentication errors.

## Security Considerations

- **Database Access**: Limit database access to trusted administrators only
- **Audit Trail**: Consider logging all role changes for security auditing
- **Principle of Least Privilege**: Only grant admin access to users who require it
- **Regular Review**: Periodically review admin user list and revoke unnecessary access

## Troubleshooting

### Admin Link Not Appearing

**Problem**: User has admin role in database but doesn't see the admin link in the profile dropdown.

**Solution**: 
1. Verify the role was set correctly in the database
2. Ensure the user logged out completely and logged back in
3. Clear browser cache and cookies if the issue persists

### Access Denied After Role Update

**Problem**: User still gets "Not authorized" message after being granted admin role.

**Solution**:
1. Confirm the user logged out and logged back in after the role change
2. Check that the role value is exactly `admin` (lowercase, no extra spaces)
3. Verify the JWT token contains the updated role by checking the session

### Cannot Access Database

**Problem**: Unable to connect to the database to update roles.

**Solution**:
1. Verify database connection credentials
2. Ensure you have the necessary permissions to UPDATE the users table
3. Contact your database administrator if access issues persist

## Future Enhancements

A user interface for role management is planned for a future release, which will include:

- Admin dashboard for viewing all users
- UI for changing user roles without SQL commands
- Audit logging for role changes
- Bulk role operations

Until then, use the SQL commands documented above for role management.
