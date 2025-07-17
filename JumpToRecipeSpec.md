# Jump to Recipe - Product Specification

## Product Overview
**Jump to Recipe** is a modern web and mobile app that helps users collect, share, and organize recipes into customizable digital cookbooks. Users can import recipes from URLs or images, adjust ingredients by serving size, generate grocery lists, and share cookbooks with others. The app emphasizes clean UX, support for both metric and imperial units, privacy controls, and collaboration features.

## Key Features

### 1. User Authentication
- Login and registration via email/password and social logins (Google, GitHub)
- Managed with NextAuth.js
- Role-based access: admin, elevated, regular user

### 2. Homepage / Landing Page
- Marketing-style landing page with recipe previews
- Call-to-actions for login/signup
- Responsive design with dark and light mode

### 3. Recipe Management
- Add recipes manually, via URL (using JSON-LD scraping), or image OCR
- Ingredient and step parsing
- Rich text notes and tagging system
- Supports metric and imperial units with conversion

### 4. Cookbooks
- Users can create and manage digital cookbooks
- Cookbooks can be shared publicly or privately
- Owners can invite collaborators with edit/view permissions

### 5. Grocery List Builder
- Select recipes to generate a smart grocery list
- Group ingredients by category (e.g., dairy, produce)
- Detect overlapping ingredients to reduce food waste

### 6. Feeds & Discovery
- Home feed shows recently added/shared recipes
- Filters for cook time, tags, popularity
- Search by title, ingredient, or tag

### 7. Comments & Notes
- Users can comment on public recipes
- Toggle visibility of comments
- Rich text supported in personal notes

### 8. Mobile App Support
- Native app (via Expo or React Native)
- Syncs data with web version

## Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, React Server Components
- **Backend:** Next.js API routes, PostgreSQL
- **Auth:** NextAuth.js
- **ORM:** Drizzle ORM
- **Image Uploads:** UploadThing or Cloudinary
- **Scraping:** JSON-LD schema-based parsing
- **OCR (optional):** Tesseract.js or external API
- **Mobile:** Expo/React Native
- **Hosting:** Vercel (frontend), Railway/Fly.io (backend & DB)

## MVP Scope
- Public landing page
- User authentication
- Recipe CRUD (manual + URL)
- Cookbook creation and sharing
- Basic grocery list generation

## Post-MVP Features
- Image OCR for scanned recipes
- Recipe recommendations based on saved content
- Community likes/comments/reviews
- In-app timers for cooking steps
- AI meal planning

## Success Metrics
- Number of users creating cookbooks
- Recipes imported and shared
- Time to grocery list generation
- Retention of users after first recipe saved
