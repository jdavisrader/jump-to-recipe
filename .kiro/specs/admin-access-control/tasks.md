# Implementation Plan

- [x] 1. Enhance authentication library with admin helpers
  - Add `isAdmin` helper function to check if user role is admin
  - Add `requireAdmin` server-side helper for admin page protection
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Update middleware for admin route protection
  - Add admin route detection for `/admin/*` paths
  - Implement session token extraction and JWT decoding for role verification
  - Add redirect logic for unauthenticated users to `/login?unauthorized=1`
  - Add redirect logic for non-admin authenticated users to `/?unauthorized=1`
  - Update middleware matcher configuration to include admin routes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Create admin layout with unauthorized feedback
  - Create `src/app/admin/layout.tsx` as client component
  - Implement useSearchParams hook to detect `unauthorized=1` parameter
  - Implement toast notification trigger with title "Not authorized" and description
  - Add URL cleanup logic to remove query parameter after toast display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4. Create admin dashboard page
  - Create `src/app/admin/page.tsx` as server component
  - Implement server-side session check using getServerSession
  - Add secondary authorization check with redirect for non-admin users
  - Add page title "Admin Dashboard" and welcome message
  - Use consistent container and typography patterns from existing pages
  - _Requirements: 5.1, 5.5, 5.9, 5.10_

- [x] 5. Create admin users management page
  - Create `src/app/admin/users/page.tsx` as server component
  - Implement server-side session check and authorization
  - Add page title "User Management" and placeholder message "User Management Coming Soon"
  - _Requirements: 5.2, 5.6, 5.9, 5.10_

- [x] 6. Create admin recipes management page
  - Create `src/app/admin/recipes/page.tsx` as server component
  - Implement server-side session check and authorization
  - Add page title "Recipe Management" and placeholder message "Recipe Management Coming Soon"
  - _Requirements: 5.3, 5.7, 5.9, 5.10_

- [x] 7. Create admin cookbooks management page
  - Create `src/app/admin/cookbooks/page.tsx` as server component
  - Implement server-side session check and authorization
  - Add page title "Cookbook Management" and placeholder message "Cookbook Management Coming Soon"
  - _Requirements: 5.4, 5.8, 5.9, 5.10_

- [x] 8. Update user profile dropdown with admin link
  - Import Shield icon from lucide-react
  - Add conditional rendering for admin link based on session.user.role === 'admin'
  - Position admin link between "My Recipes" and "Settings" menu items
  - Add proper accessibility attributes (role="menuitem")
  - Implement click handler to close dropdown and navigate to /admin
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Create admin role setup documentation
  - Create `docs/ADMIN_SETUP.md` file
  - Document SQL command for setting admin role
  - Document valid role values (user, elevated, admin)
  - Add instructions for initial admin setup process
  - Include note about JWT token refresh requirement (logout/login)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
