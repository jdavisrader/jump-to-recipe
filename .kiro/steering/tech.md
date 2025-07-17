# Technology Stack & Build System

## Frontend Stack
- **Framework**: Next.js 15.4.1 with App Router
- **React**: 19.1.0 with React Server Components
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Fonts**: Geist Sans and Geist Mono

## Development Tools
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Next.js and Prettier configs
- **Formatting**: Prettier with 2-space tabs, single quotes
- **Build**: Next.js with Turbopack for dev mode

## Planned Backend (from specs)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js (Google, GitHub providers)
- **File Uploads**: UploadThing or Cloudinary
- **API**: Next.js API routes (REST)
- **Mobile**: React Native with Expo

## Common Commands

### Development
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting
npm run type-check   # TypeScript type checking
```

## Path Aliases
- `@/*` maps to `./src/*` for clean imports

## Deployment
- **Frontend**: Vercel (recommended)
- **Backend & DB**: Railway or Fly.io (planned)