# SonoNews Production Deployment Guide

This guide covers deploying SonoNews to production using:
- **Railway** - API backend and Web frontend (unified deployment)
- **Neon** - PostgreSQL database
- **Upstash** - Redis for BullMQ

---

## 📋 Prerequisites

1. GitHub repository: https://github.com/iliyanadov/sononews.git
2. Railway account (free tier available)
3. Neon account (free tier available)
4. Upstash account (free tier available)
5. TwitterAPI.io account (for Twitter scraping)
6. Anthropic account (for Claude AI)
7. Google Cloud account (for Gemini AI - optional)

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

### 3. Set Up Railway (API + Web)

Railway will host both services in a single project.

#### 3.1 Create Railway Project

1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `iliyanadov/sononews`

#### 3.2 Add API Service

1. Click "New Service" → "Deploy from GitHub repo"
2. Select the same repository
3. Configure settings:

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
PORT=3001
FRONTEND_URL=https://your-web-service.up.railway.app
USE_MOCK_SCRAPER=false
```

4. Click **Deploy**
5. Note your API service URL: `https://your-api-service.up.railway.app`

#### 3.3 Add Web Service

1. Click "New Service" → "Deploy from GitHub repo"
2. Select the same repository
3. Configure settings:

**Root Directory:** `apps/web`

**Environment Variables:**
```bash
# Points to the API service
NEXT_PUBLIC_API_URL=https://your-api-service.up.railway.app
```

4. Click **Deploy**
5. Note your web service URL: `https://your-web-service.up.railway.app`

#### 3.4 Update Service URLs (Cross-Referencing)

After both services are deployed:

1. Go to **API Service** → Settings → Environment Variables
2. Update `FRONTEND_URL` to point to your web service:
   ```
   FRONTEND_URL=https://your-web-service.up.railway.app
   ```
3. Go to **Web Service** → Settings → Environment Variables
4. Update `NEXT_PUBLIC_API_URL` to point to your API service:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-service.up.railway.app
   ```

#### 3.5 Run Database Migrations

1. Go to **API Service** → Metrics
2. Click "Execute Command"
3. Run:
   ```
   npx prisma migrate deploy
   ```

---

## 🔧 Configuration Details

### Railway Multi-Service Setup

**API Service** (`apps/api`):
- Uses `apps/api/Dockerfile`
- Runs on port 3001
- Provides REST API endpoints
- Connects to Neon and Upstash

**Web Service** (`apps/web`):
- Uses `apps/web/Dockerfile`
- Runs on port 3000
- Provides Next.js frontend
- Connects to API service

**Service Discovery:**
- Each service knows about the other via environment variables
- API service knows web service URL (`FRONTEND_URL`)
- Web service knows API service URL (`NEXT_PUBLIC_API_URL`)

### API Docker Configuration

The `apps/api/Dockerfile` handles:
- Node.js 20 Alpine base image
- Dependency installation
- Prisma client generation
- TypeScript compilation
- Production-optimized runtime
- Railway sets `PORT` environment variable dynamically

### Web Docker Configuration

The `apps/web/Dockerfile` handles:
- Node.js 20 Alpine base image
- Next.js standalone build (already configured)
- Optimized production bundle
- Railway sets `PORT` environment variable dynamically

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
curl https://your-api-service.up.railway.app/api/health
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

### Web Service Access
1. Open `https://your-web-service.up.railway.app`
2. Navigate to `/alerts`
3. Should load alert list (or show empty if mock disabled)

### Create Draft Test
1. Click "Create Draft" on any alert
2. Wait 10-15 seconds
3. Should redirect to draft editor with AI-generated content

### Cross-Service Communication
1. Open browser DevTools Network tab
2. Navigate to `/alerts`
3. Verify API calls go to `NEXT_PUBLIC_API_URL`
4. Check CORS headers include correct origin

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

### Service URLs
- Both services use Railway's public URLs
- Each service trusts the other via CORS
- Update environment variables when redeploying

### Database Access
- Neon provides pooled connections for better performance
- Direct URL used only for migrations
- Both URLs required in Railway env vars

---

## 📊 Monitoring

### Railway Dashboard
- View logs for both services
- Monitor CPU/memory usage per service
- Check deployment status
- Track response times

### Service Health
- API service: `/api/health` endpoint
- Web service: Railway health checks
- Both services have automatic restarts

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
- Check API service logs in Railway dashboard
- Verify all env vars are set
- Ensure DATABASE_URL and DIRECT_DATABASE_URL are both set
- Check that migrations ran successfully

### Web Can't Connect to API
- Verify NEXT_PUBLIC_API_URL is set in web service
- Check FRONTEND_URL matches web service URL in API service
- Ensure CORS is configured correctly
- Check browser console for CORS errors

### Database Connection Errors
- Verify DATABASE_URL format (should have `-pooler`)
- Verify DIRECT_DATABASE_URL format (should NOT have `-pooler`)
- Check Neon console for connection issues
- Ensure migrations were deployed

### Redis Connection Errors
- Verify REDIS_URL uses `rediss://` (double 's')
- Check Upstash console for database status
- Ensure TLS is enabled in connection config

### Service URL Issues
- Ensure both services are deployed and running
- Check environment variables reference correct service URLs
- Wait for Railway to assign public URLs
- Redeploy service if URL changed

### AI Generation Fails
- Verify ANTHROPIC_API_KEY is valid
- Check API key has credits/usage available
- Review API service logs for specific error messages

---

## 🔄 Continuous Deployment

Railway is configured for automatic deployments:
- **Push to `main`** → Automatic deployment of both services
- **Pull requests** → Can set up preview deployments
- **Rollbacks** → One-click revert in Railway dashboard

**Note:** When pushing to main, both services will redeploy automatically. Update environment variables accordingly if service URLs change.

---

## 📝 Post-Deployment Setup

1. **Update Service URLs:** Cross-reference FRONTEND_URL and NEXT_PUBLIC_API_URL
2. **Configure Twitter API:** Add real Twitter API credentials
3. **Set Monitoring:** Configure alerts for both services
4. **Brand Voice:** Configure default brand voice in Settings
5. **Test Flow:** Create test draft from alert
6. **Custom Domain:** Add custom domains in Railway (optional)

---

## 🆘 Support

For issues:
- Check logs in Railway dashboard for both services
- Review this deployment guide
- Check Neon/Upstash status pages
- Open issue on GitHub

---

**Deployment Status:** Ready for Railway ✅

**Architecture:**
- Railway Service 1: API (`apps/api`)
- Railway Service 2: Web (`apps/web`)
- External: Neon (Database), Upstash (Redis)
