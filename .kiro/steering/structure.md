# Project Structure & Organization

## Root Structure
```
/
├── jump-to-recipe/         # Main application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── ...                # App config files
├── docs/                   # Project documentation
│   ├── deployment/        # Deployment guides
│   ├── errors/            # Error logs and troubleshooting
│   ├── specs/             # Feature specifications
│   ├── dataMigration/     # Migration documentation
│   └── wireframes/        # Design mockups
├── .kiro/                  # Kiro configuration and specs
├── scripts/                # Build and deployment scripts
└── config files            # Docker and root configurations
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

## Documentation Organization
- **All documentation** must be placed in `/docs/` (root level)
- Use logical folder structure for organization
- Existing folders: deployment, errors, specs, dataMigration, wireframes
- Create new folders as needed for clear categorization
- Use descriptive filenames with dates for error logs (e.g., `2026-02-03-Deployment_error.md`)