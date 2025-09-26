# 🍽️ Jump to Recipe

A modern web and mobile platform for collecting, organizing, and sharing digital cookbooks. Users can import recipes from URLs or images, create custom cookbooks, generate smart grocery lists, and collaborate with others.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or work directly in the app directory
cd jump-to-recipe
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
jump-to-recipe/
├── docs/                   # Documentation and specifications
│   ├── deployment/         # Deployment guides
│   ├── specs/             # Feature specifications
│   └── roadmap.md         # Project roadmap
├── scripts/               # Deployment and management scripts
├── tests/                 # Development test scripts
├── jump-to-recipe/        # Main Next.js application
└── package.json          # Workspace configuration
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4.1 with App Router, React 19, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (frontend), Railway (backend)

## 📚 Documentation

- [Deployment Guide](docs/deployment/README-DEPLOYMENT.md) - Deploy to Raspberry Pi
- [Product Specification](docs/specs/JumpToRecipeSpec.md) - Product overview and features
- [Engineering Design](docs/specs/EngineeringDesignDoc.md) - Technical architecture
- [Feature Specs](docs/specs/) - Individual feature specifications
- [Project Roadmap](docs/roadmap.md) - Development phases and timeline

## 🔧 Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests
```

## 🚀 Deployment

Use the provided scripts for Raspberry Pi deployment:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy in order
./scripts/deploy-to-pi.sh
./scripts/setup-app.sh
./scripts/setup-database.sh
./scripts/start-app.sh
```

See the [deployment guide](docs/deployment/README-DEPLOYMENT.md) for detailed instructions.

## 🎯 Core Features

- **Recipe Management** - Manual entry, URL import, image OCR
- **Digital Cookbooks** - Create, organize, and share recipe collections
- **Smart Grocery Lists** - Generate optimized shopping lists from recipes
- **Collaboration** - Share cookbooks with view/edit permissions
- **Cross-Platform** - Web app with planned mobile support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions or issues, please check the documentation or open an issue on GitHub.