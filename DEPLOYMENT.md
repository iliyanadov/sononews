# SonoNews Production Deployment Guide

This guide covers deploying SonoNews to production using:
- **Railway** - API backend
- **Vercel** - Web frontend
- **Neon** - PostgreSQL database
- **Upstash** - Redis for BullMQ

---

## 📋 Prerequisites

1. GitHub repository: https://github.com/iliyanadov/sononews.git
2. Railway account (free tier available)
3. Vercel account (free tier available)
4. Neon account (free tier available)
5. Upstash account (free tier available)
6. TwitterAPI.io account (for Twitter scraping)
7. Anthropic account (for Claude AI)
8. Google Cloud account (for Gemini AI - optional)

---

## 🚀 Deployment Steps

### 1. Set Up Neon (PostgreSQL Database)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the **Connection String**:
   - **Pooled URL** (has `-pooler` in hostname): Use this for `DATABASE_URL`
   - **Direct URL** (no `-pooler`): Use this for `DIRECT_DATABASE_URL`

**Example:**
```
DATABASE_URL=postgresql://user:pass@ep-xxx.pooler.us-east-1.aws.neon.tech/neondb
DIRECT_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb
```

---

### 2. Set Up Upstash (Redis)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the **REST API URL** or **Redis Connection URL**
4. Note it uses `rediss://` protocol (double 's' for TLS)

**Example:**
```
REDIS_URL=rediss://default:your-password@your-redis.upstash.io:6379
```

---

### 3. Set Up Railway (API Backend)

1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `iliyanadov/sononews`
4. Configure settings:

**Root Directory:** `apps/api`

**Environment Variables:**
```bash
# Database (from Neon)
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...

# Redis (from Upstash)
REDIS_URL=rediss://...

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...

# Twitter Scraper
TWITTER_API_KEY=new1_...
TWITTER_SOURCE_ACCOUNT=Kurrco

# App Settings
NODE_ENV=production
FRONTEND_URL=https://sononews.vercel.app
USE_MOCK_SCRAPER=false
```

5. Click **Deploy**

6. **Post-Deploy:**
   - Railway will detect the Dockerfile
   - Build will take 2-3 minutes
   - Get your API URL: `https://your-app.up.railway.app`
   - Run migrations: Railway → Project → Metrics → "Execute Command"
     ```
     npx prisma migrate deploy
     ```

---

### 4. Set Up Vercel (Web Frontend)

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import `iliyanadov/sononews` from GitHub

**Build Settings:**
```
Framework Preset: Next.js
Root Directory: (leave empty)
Build Command: cd apps/web && npm run build
Output Directory: apps/web/.next
Install Command: npm install
```

**Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

4. Click **Deploy**

5. Your frontend will be available at: `https://sononews.vercel.app`

---

## 🔧 Configuration Details

### Railway Docker Configuration

The `apps/api/Dockerfile` handles:
- Node.js 20 Alpine base image
- Dependency installation
- Prisma client generation
- TypeScript compilation
- Production-optimized runtime

Railway automatically sets the `PORT` environment variable.

### Vercel Next.js Configuration

The `vercel.json` at repo root ensures:
- Correct build command for monorepo
- Output directory points to `apps/web/.next`
- Framework detection: Next.js
- Standalone output mode (optimized)

### Neon Database Connection

The Prisma schema uses both connection URLs:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")         // Pooled connection
  directUrl = env("DIRECT_DATABASE_URL")  // Direct connection (for migrations)
}
```

### Upstash Redis TLS

The Redis client automatically detects `rediss://` protocol and enables TLS:
```typescript
const isTls = url.protocol === 'rediss:';
const tls = isTls ? {} : undefined;
```

---

## ✅ Verification Checklist

After deployment, verify:

### API Health Check
```bash
curl https://your-app.up.railway.app/api/health
```
Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "sononews-api",
  "version": "0.1.0"
}
```

### Frontend Access
1. Open `https://sononews.vercel.app`
2. Navigate to `/alerts`
3. Should load alert list (or show empty if mock disabled)

### Create Draft Test
1. Click "Create Draft" on any alert
2. Wait 10-15 seconds
3. Should redirect to draft editor with AI-generated content

---

## 🔐 Security Notes

### Environment Variables
- **Never** commit `.env` files to git
- Use `.env.production.example` as template
- Rotate API keys regularly
- Use read-only API keys when possible

### CORS Configuration
The API only accepts requests from `FRONTEND_URL`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

### Database Access
- Neon provides pooled connections for better performance
- Direct URL used only for migrations
- Both URLs required in Railway env vars

---

## 📊 Monitoring

### Railway (API)
- View logs in Railway dashboard
- Monitor CPU/memory usage
- Check deployment status

### Vercel (Frontend)
- View builds in Vercel dashboard
- Analytics available
- Deployment logs accessible

### Neon (Database)
- Monitor connection pool usage
- Query performance insights
- Storage usage

### Upstash (Redis)
- Monitor command rate
- Memory usage
- Connection count

---

## 🐛 Troubleshooting

### API Returns 404/500
- Check Railway logs for errors
- Verify all env vars are set
- Ensure DATABASE_URL and DIRECT_DATABASE_URL are both set

### Frontend Can't Connect to API
- Verify NEXT_PUBLIC_API_URL is set in Vercel
- Check FRONTEND_URL matches your Vercel domain
- Ensure CORS is configured correctly

### Database Connection Errors
- Verify DATABASE_URL format (should have `-pooler`)
- Verify DIRECT_DATABASE_URL format (should NOT have `-pooler`)
- Check Neon console for connection issues

### Redis Connection Errors
- Verify REDIS_URL uses `rediss://` (double 's')
- Check Upstash console for database status
- Ensure TLS is enabled in connection config

### AI Generation Fails
- Verify ANTHROPIC_API_KEY is valid
- Check API key has credits/usage available
- Review logs for specific error messages

---

## 🔄 Continuous Deployment

Both Railway and Vercel are configured for automatic deployments:

- **Push to `main`** → Automatic deployment
- **Pull requests** → Preview deployments (Vercel)
- **Rollbacks** → One-click revert in dashboards

---

## 📝 Post-Deployment Setup

1. **Update DNS:** Point custom domain to Vercel (optional)
2. **Configure Twitter API:** Add real Twitter API credentials
3. **Set Monitoring:** Configure alerts for API/database
4. **Brand Voice:** Configure default brand voice in Settings
5. **Test Flow:** Create test draft from alert

---

## 🆘 Support

For issues:
- Check logs in Railway/Vercel dashboards
- Review this deployment guide
- Check Neon/Upstash status pages
- Open issue on GitHub

---

**Deployment Status:** Codebase prepared ✅

Ready to deploy to:
- Railway (API)
- Vercel (Web)
- Neon (Database)
- Upstash (Redis)
