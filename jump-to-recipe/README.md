# 🍽️ Jump to Recipe - Application

A modern web application for collecting, organizing, and sharing digital cookbooks. Built with Next.js 15, React 19, and TypeScript.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
jump-to-recipe/
├── docs/                   # Application documentation
│   ├── features/          # Feature-specific guides
│   └── implementation/    # Technical implementation details
├── scripts/               # Utility scripts
│   └── utils/            # Development and debugging tools
├── src/                   # Source code
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── lib/              # Utility functions and configurations
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15.4.1 with App Router
- **React**: 19.1.0 with Server Components
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui with Radix UI
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **Testing**: Jest with React Testing Library

## 📚 Documentation

- [Feature Documentation](docs/features/) - User-facing feature guides
- [Implementation Details](docs/implementation/) - Technical implementation summaries
- [API Documentation](src/app/api/) - API endpoint documentation
- [Component Library](src/components/) - Reusable component documentation

## 🧪 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🗄️ Database

```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database with sample data
```

## 🎯 Key Features

- **Recipe Management** - Create, edit, and organize recipes
- **Digital Cookbooks** - Build and share recipe collections
- **Smart Import** - Import recipes from URLs with JSON-LD parsing
- **Image Upload** - Secure image handling with optimization
- **Grocery Lists** - Generate shopping lists from recipes
- **Collaboration** - Share cookbooks with permissions
- **Search & Filter** - Advanced recipe discovery
- **Responsive Design** - Mobile-first responsive interface

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# File Storage (optional)
USE_S3=false
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"
```

### Database Setup

1. Create a PostgreSQL database
2. Update `DATABASE_URL` in `.env`
3. Run migrations: `npm run db:migrate`
4. Seed data (optional): `npm run db:seed`

## 🧪 Testing

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e          # End-to-end tests
```

## 🚀 Deployment

The application is designed to deploy on Vercel with minimal configuration:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

For other platforms, see the [deployment documentation](../docs/deployment/).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run linting and tests: `npm run lint && npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
