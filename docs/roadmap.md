# 🛤️ Jump to Recipe – Roadmap

This roadmap outlines the step-by-step plan to build **Jump to Recipe**, a full-stack recipe and meal planning app with cookbook sharing, grocery tools, and collaborative features.

We prioritize free and open-source technologies (Drizzle ORM, PostgreSQL, React Native, etc.) and follow a modular build approach.

---

## ✅ Phase 1: Project Setup

- [ ] Create monorepo using Turborepo
  - `apps/web` – Next.js frontend
  - `apps/api` – Node.js backend (Express or tRPC)
  - `apps/mobile` – React Native + Expo
  - `packages/db` – Drizzle ORM + schema
  - `packages/ui` – Shared components (optional)
- [ ] Configure TypeScript, ESLint, Prettier, Husky


---

## 🧱 Phase 2: Database Design (Drizzle ORM)

- [ ] Set up PostgreSQL using Railway or Supabase
- [ ] Initialize Drizzle ORM in `packages/db`
- [ ] Create schema:
  - Users, Recipes, Ingredients, Instructions
  - Cookbooks, Tags, Notes, Comments, GroceryLists
- [ ] Seed the database with test data

---

## 🔐 Phase 3: Auth & User Roles

- [ ] Implement auth with NextAuth.js
- [ ] Add social and email/password login options
- [ ] Create user roles: admin, elevated, regular
- [ ] Protect API routes with role-based middleware

---

## 🍽️ Phase 4: Recipe Management (Web)

- [ ] Create recipe creation form (title, ingredients, instructions, macros, etc.)
- [ ] Add image upload using Cloudinary or UploadThing
- [ ] Build frontend display components
- [ ] Implement recipe CRUD endpoints

---

## 📚 Phase 5: Cookbook Sharing

- [ ] Create cookbooks with ownership and access control
- [ ] Add options for public, private, and invite-only visibility
- [ ] Let users add collaborators with view/edit rights
- [ ] Enforce access in API middleware

---

## 🔍 Phase 6: Browsing & Saving

- [ ] Implement recipe browsing and search
- [ ] Add filters (tags, cook time, macros, ingredients)
- [ ] Add "Save to Cookbook" feature
- [ ] Display saved/public/shared recipes

---

## ✏️ Phase 7: Notes, Comments, Tags

- [ ] Add personal and shared recipe notes (rich text/Markdown)
- [ ] Add public comments with filtering options
- [ ] Allow manual and AI-suggested tags
- [ ] Build tag filters for browsing

---

## 📥 Phase 8: Recipe Importing

- [ ] Implement URL-based recipe importer using ld+json schema
- [ ] Add image-based OCR import with Tesseract.js (web) and Expo Camera (mobile)

---

## 🧾 Phase 9: Grocery Lists & Meal Planning

- [ ] Select multiple recipes for a meal plan
- [ ] Auto-generate grocery list with normalized ingredient merging
- [ ] Suggest low-waste recipe bundles

---

## 📱 Phase 10: Mobile App

- [ ] Build core screens with React Native + Expo
- [ ] Sync recipes, notes, and grocery lists via API
- [ ] Add camera support for OCR and uploads
- [ ] Support offline mode (optional)

---

## 🚀 Phase 11: Deployment

- [ ] Deploy frontend with Vercel (web)
- [ ] Host API on Render or Railway
- [ ] Host PostgreSQL on Railway/Supabase
- [ ] Store images on Cloudinary or UploadThing
- [ ] Use GitHub Actions for CI/CD pipeline

---

## 🎨 Phase 12: Polish & Launch

- [ ] Add modern UI design and dark mode
- [ ] Add onboarding and help screens
- [ ] Run performance and UX testing
- [ ] Launch closed beta or MVP publicly 🎉

---

## 🧠 Future Enhancements

- [ ] AI-based recipe suggestions
- [ ] Pantry tracking & smart substitutions
- [ ] Voice-to-text recipe entry
- [ ] Weekly meal planner with reminders

---

**Maintainer:** Jordan Rader  
**Tech Stack:** Next.js, React Native, Node.js, Drizzle ORM, PostgreSQL  
**License:** TBD  
**Status:** Planning & Prototyping