# SonoNews (KurrAlert)

A full-stack web tool that monitors the X/Twitter account @Kurrco for hip-hop news, detects viral posts using a likes-per-hour metric, and helps create Instagram carousel content using AI.

## Tech Stack

- **Monorepo**: Turborepo
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Job Queue**: BullMQ with Redis
- **X Data Source**: TwitterAPI.io (REST API, pay-as-you-go)
- **AI**: Gemini 2.5 Flash (development), Claude Haiku 4.5 (production)
- **Image Search**: Google Custom Search JSON API

## Project Structure

```
sononews/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # Express backend
├── packages/
│   ├── shared/               # Shared types, constants, validation
│   ├── eslint-config/        # Shared ESLint config
│   └── tsconfig/             # Shared TS configs
├── docker-compose.yml        # Local PostgreSQL + Redis
└── turbo.json                # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 16+ and Redis 7+ (or Docker/Docker Compose)

### 1. Clone the repository

```bash
git clone https://github.com/iliyanadov/sononews.git
cd sononews
```

### 2. Start the databases

**Option A: Using Docker (Recommended)**

```bash
docker compose up -d
```

This will start PostgreSQL on port 5432 and Redis on port 6379.

**Option B: Local Installation**

Install PostgreSQL and Redis locally, then ensure they're running:
- PostgreSQL: `brew install postgresql` (macOS) or use your system package manager
- Redis: `brew install redis` (macOS) or use your system package manager

Make sure PostgreSQL is accepting connections on port 5432 and Redis on port 6379.

### 1. Clone the repository

```bash
git clone https://github.com/iliyanadov/sononews.git
cd sononews
```

### 2. Start the databases

```bash
docker compose up -d
```

This will start PostgreSQL on port 5432 and Redis on port 6379.

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- `ANTHROPIC_API_KEY`: Get from [console.anthropic.com](https://console.anthropic.com)
- `TWITTER_API_KEY`: Get from [twitterapi.io](https://twitterapi.io) (optional, mock adapter used in dev)
- `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID`: Get from [Google Cloud Console](https://console.cloud.google.com)

### 5. Run the Prisma migration

```bash
cd apps/api
npx prisma migrate dev --name init
cd ../..
```

### 6. Start the development servers

```bash
npm run dev
```

This will start:
- Frontend at [http://localhost:3000](http://localhost:3000)
- API at [http://localhost:3001](http://localhost:3001)

### 7. Verify everything works

1. Check the frontend at http://localhost:3000
2. Verify API health at http://localhost:3001/api/health
3. Trigger a manual scraper job: `curl -X POST http://localhost:3001/api/jobs/scraper/trigger`

## Development Commands

```bash
# Start both frontend and backend
npm run dev

# Build all packages
npm run build

# Run linting
npm run lint

# Clean build artifacts
npm run clean

# Prisma commands
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
npm run db:push       # Push schema changes
npm run db:studio     # Open Prisma Studio
```

## Features

### Current (Scaffold)

- ✅ Full monorepo setup with Turborepo
- ✅ Express API with health check
- ✅ Next.js frontend with Tailwind CSS and shadcn/ui
- ✅ Prisma schema with all models
- ✅ Mock X/Twitter scraper with realistic data
- ✅ BullMQ job queue for scraper
- ✅ LPH (likes-per-hour) scoring service
- ✅ Docker Compose for local development

### Planned (Next Phases)

- 🚧 Alert dashboard UI
- 🚧 AI content generation with Claude
- 🚧 Visual content editor
- 🚧 Image search integration
- 🚧 Export functionality

## API Endpoints

### Health
- `GET /api/health` - Check API status

### Jobs
- `POST /api/jobs/scraper/trigger` - Manually trigger the scraper job
- `GET /api/jobs/scraper/status` - Get scraper queue status

## License

MIT
