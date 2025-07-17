# Project Structure & Organization

## Root Structure
```
jump-to-recipe/
├── src/                    # Source code
├── public/                 # Static assets
├── .kiro/                  # Kiro configuration and specs
├── node_modules/           # Dependencies
└── config files            # Build and tool configurations
```

## Source Code Organization (`src/`)
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Homepage
│   ├── globals.css        # Global styles
│   └── favicon.ico        # App icon
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── textarea.tsx
└── lib/                   # Utility functions
    └── utils.ts          # Common utilities (cn function)
```

## Architecture Patterns
- **App Router**: Uses Next.js 15 App Router with RSC
- **Component Structure**: shadcn/ui pattern with Radix primitives
- **Styling**: Tailwind utility classes with `cn()` helper for conditional styles
- **Type Safety**: Strict TypeScript with proper typing

## File Naming Conventions
- React components: PascalCase (e.g., `Button.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Pages: lowercase (e.g., `page.tsx`)
- CSS: kebab-case (e.g., `globals.css`)

## Import Patterns
- Use `@/` alias for src imports: `import { cn } from '@/lib/utils'`
- Group imports: external packages first, then internal modules
- Use named exports for components and utilities

## Planned API Structure (from specs)
```
src/app/api/
├── auth/                  # NextAuth routes
├── recipes/              # Recipe CRUD operations
├── cookbooks/            # Cookbook management
└── grocery-list/         # Grocery list generation
```

## Component Guidelines
- Use React Server Components by default
- Add 'use client' only when client-side features needed
- Leverage shadcn/ui components for consistency
- Follow Tailwind responsive design patterns