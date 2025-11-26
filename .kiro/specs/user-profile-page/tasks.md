# Implementation Plan

- [x] 1. Set up API routes for profile management
  - Create PATCH endpoint for profile updates at `/api/user/profile`
  - Create PATCH endpoint for password changes at `/api/user/password`
  - Add authentication provider detection logic
  - Implement proper error handling and validation
  - _Requirements: 4.1, 4.2, 4.3, 5.3, 5.4, 7.1, 7.2, 7.3_

- [x] 2. Create core profile page components
- [x] 2.1 Build ProfilePage server component
  - Create `/app/profile/page.tsx` with session handling
  - Implement authentication redirect logic
  - Fetch user profile data server-side
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

- [x] 2.2 Create EditableField component
  - Build reusable component for inline editing
  - Implement toggle between display and edit modes
  - Add field-specific validation support
  - Handle different input types (text, email)
  - _Requirements: 3.1, 3.2, 3.4, 7.1_

- [x] 2.3 Build ProfileForm component
  - Create form with React Hook Form and Zod validation
  - Implement name and email editing functionality
  - Add save button with loading states
  - Handle form submission and API integration
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.4, 4.5_

- [x] 3. Implement password change functionality
- [x] 3.1 Create PasswordChangeModal component
  - Build modal with current and new password fields
  - Implement form validation and submission
  - Add proper modal open/close state management
  - Handle password change API calls
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.2 Add password change API endpoint
  - Create `/api/user/password` PATCH route
  - Implement current password verification
  - Add bcrypt password hashing for updates
  - Include proper error handling for invalid passwords
  - _Requirements: 5.3, 5.4, 7.3_

- [x] 4. Enhance profile API with email support
- [x] 4.1 Extend existing profile API route
  - Modify `/api/user/profile` to support PATCH method
  - Add email field to update schema validation
  - Implement email uniqueness validation
  - Add authentication provider detection
  - _Requirements: 3.2, 2.5, 7.1, 7.2_

- [x] 4.2 Add authentication provider detection
  - Create utility to detect Google vs credentials users
  - Query accounts table for OAuth provider information
  - Return provider info in profile API response
  - _Requirements: 2.5, 5.6_

- [x] 5. Build responsive profile page layout
- [x] 5.1 Create ProfileLayout component
  - Implement two-column desktop layout
  - Add responsive single-column mobile layout
  - Create sidebar with user info display
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5.2 Style profile components with Tailwind
  - Apply consistent styling with app theme
  - Implement responsive breakpoints
  - Add proper spacing and visual hierarchy
  - Support light and dark mode themes
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6. Implement toast notifications and error handling
- [x] 6.1 Integrate toast notifications
  - Add success toasts for profile updates
  - Add error toasts for failed operations
  - Implement toast for password change success
  - _Requirements: 4.2, 4.3, 5.4_

- [x] 6.2 Add comprehensive error handling
  - Implement client-side form validation errors
  - Add network error handling with retry logic
  - Handle authentication errors with redirects
  - Display validation errors inline
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7. Add conditional UI for authentication providers
- [x] 7.1 Implement Google user restrictions
  - Disable email editing for Google users
  - Hide password change button for Google users
  - Add explanatory text for disabled fields
  - _Requirements: 2.5, 5.6_

- [x] 7.2 Create read-only field components
  - Build components for role and last updated display
  - Format timestamps appropriately
  - Add proper labeling and styling
  - _Requirements: 2.3, 2.4_

- [ ] 8. Write comprehensive tests
- [ ] 8.1 Create component unit tests
  - Test ProfileForm component behavior
  - Test EditableField toggle functionality
  - Test PasswordChangeModal validation
  - Mock API responses and error states
  - _Requirements: All requirements validation_

- [ ] 8.2 Create API route tests
  - Test profile update endpoint validation
  - Test password change endpoint security
  - Test authentication middleware behavior
  - Test error response formats
  - _Requirements: 4.1, 4.2, 4.3, 5.3, 5.4, 7.2, 7.3_

- [x] 9. Integrate with existing navigation
- [x] 9.1 Update UserProfileButton component
  - Ensure "Your Profile" link navigates to `/profile`
  - Verify dropdown menu functionality
  - Test navigation flow from dropdown to profile page
  - _Requirements: 1.1_

- [x] 9.2 Add profile page to app routing
  - Verify `/profile` route is properly configured
  - Test authentication middleware integration
  - Ensure proper page metadata and SEO
  - _Requirements: 1.1, 1.2_