# Jump to Recipe - Engineering Design Document

## Overview

This document outlines the architectural design, data flow, schema, and implementation plan for **Jump to Recipe** — a web and mobile platform to create, manage, and share digital cookbooks and recipes.

---

## 1. Architecture

### 1.1 High-Level Architecture

Client (Web & Mobile via React Native / Expo)
|
| HTTP Requests (REST/Next.js API Routes)
V
Backend (Next.js Server Functions)
|
| ORM (Drizzle)
V
Database (PostgreSQL)


### 1.2 Component Breakdown

- **Frontend (Next.js + Tailwind CSS)**
  - App Router with RSC
  - Client components for interactivity
  - Responsive UI for desktop and mobile
  - Uses shadcn/ui for components

- **Backend (Next.js API routes)**
  - RESTful endpoints for CRUD operations
  - Auth managed via NextAuth
  - File uploads via UploadThing or Cloudinary

- **Database (PostgreSQL via Drizzle ORM)**
  - Schema-driven, typed models
  - Tables for users, recipes, cookbooks, ingredients, comments, tags, lists

- **Mobile App**
  - React Native + Expo (MVP syncs via shared API)

---

## 2. Authentication & Authorization

- Managed via **NextAuth.js**
- Providers: GitHub, Google
- Session strategy: JWT
- Roles: `admin`, `editor`, `user`
- Middleware to protect routes based on session and role

---

## 3. Database Schema (Simplified)

- `users`  
  `id`, `name`, `email`, `image`, `role`

- `recipes`  
  `id`, `title`, `ingredients`, `instructions`, `notes`, `author_id`, `visibility`, `created_at`

- `cookbooks`  
  `id`, `title`, `owner_id`, `is_public`

- `cookbook_recipes`  
  `id`, `cookbook_id`, `recipe_id`, `position`

- `comments`  
  `id`, `recipe_id`, `user_id`, `content`, `created_at`

- `grocery_lists`  
  `id`, `user_id`, `title`, `generated_from`

---

## 4. Key APIs (Next.js Route Handlers)

| Route                        | Method | Description                          |
|-----------------------------|--------|--------------------------------------|
| `/api/auth/*`               | `GET/POST` | Auth routes via NextAuth             |
| `/api/recipes`              | `GET/POST` | List or create recipes               |
| `/api/recipes/:id`          | `GET/PUT/DELETE` | View/edit/delete recipe         |
| `/api/cookbooks`            | `GET/POST` | Manage cookbooks                     |
| `/api/cookbooks/:id`        | `GET/PUT/DELETE` | View/edit cookbook             |
| `/api/grocery-list/generate`| `POST` | Create a grocery list from recipes   |

---

## 5. Data Flow (Recipe Import)

1. User pastes recipe URL
2. Frontend sends request to `/api/recipes/import`
3. Backend fetches HTML and parses JSON-LD
4. Parsed fields are normalized and stored in DB
5. User reviews/edits before final save

---

## 6. File Uploads

- UploadThing for client-friendly, secure file uploads
- Used for recipe images, user avatars, cookbook covers
- Files stored on UploadThing or Cloudinary, URLs stored in DB

---

## 7. Landing Page

- Built as public route `/`
- Tailwind + shadcn UI
- Features carousel, demo cookbook, login/signup CTA
- Theme toggle for dark/light mode

---

## 8. Development & Deployment

- **Frontend**: Vercel
- **Backend & DB**: Railway (alt: Fly.io)
- **Migrations**: Drizzle Kit
- **Linting**: ESLint, Prettier
- **Testing**: Jest for API routes, Cypress for E2E (post-MVP)

---

## 9. MVP Completion Criteria

- ✅ Auth working via NextAuth
- ✅ Landing page accessible and responsive
- ✅ Users can:
  - Create and edit a recipe
  - Build and share cookbooks
  - Generate a grocery list

---

## 10. Future Considerations

- AI summarization of long recipes
- OCR pipeline for handwritten cards
- Native mobile push notifications
- Offline mode via service workers