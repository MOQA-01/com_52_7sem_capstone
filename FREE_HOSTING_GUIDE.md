# Free Hosting Guide - Jal Jeevan Mission Platform

## 🚀 Free Hosting Options

This guide provides multiple FREE hosting options for your real-time IoT platform.

---

## Option 1: Render.com (Recommended - Best for Full Stack)

### ✅ Pros:
- Free tier includes PostgreSQL database
- Auto-deploy from GitHub
- Built-in SSL certificates
- Supports Python backend + static frontend
- 750 hours/month free (enough for 24/7)

### 📦 What You Get Free:
- Backend: 750 hours/month
- PostgreSQL: 90 days free, then $7/month
- Static frontend: Unlimited
- Custom domain support

### 🛠️ Setup Steps:

#### 1. Prepare Your Repository

Create a `render.yaml` file in your project root:

```yaml
services:
  # PostgreSQL Database
  - type: pserv
    name: jal-jeevan-db
    env: docker
    plan: free
    region: oregon
    databases:
      - name: jal_jeevan_db

  # Redis (for caching)
  - type: redis
    name: jal-jeevan-redis
    plan: free
    maxmemoryPolicy: allkeys-lru

  # Backend API
  - type: web
    name: jal-jeevan-backend
    runtime: python
    plan: free
    region: oregon
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11
      - key: DATABASE_URL
        fromDatabase:
          name: jal-jeevan-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: jal-jeevan-redis
          type: redis
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: MQTT_BROKER_HOST
        value: test.mosquitto.org
      - key: CORS_ORIGINS
        value: "*"

  # Frontend Static Site
  - type: web
    name: jal-jeevan-frontend
    runtime: static
    plan: free
    buildCommand: "echo 'Static site - no build needed'"
    staticPublishPath: .
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

#### 2. Push to GitHub

```bash
cd /Users/moqa/Desktop/gis/jal-jeevan-platform

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: Jal Jeevan Mission Platform"

# Create repository on GitHub (https://github.com/new)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/jal-jeevan-platform.git
git branch -M main
git push -u origin main
```

#### 3. Deploy on Render

1. Go to https://render.com and sign up (free)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` and deploy everything
5. Wait 5-10 minutes for deployment

#### 4. Your URLs:
- Frontend: `https://jal-jeevan-frontend.onrender.com`
- Backend: `https://jal-jeevan-backend.onrender.com`

---

## Option 2: Railway.app (Easiest Setup)

### ✅ Pros:
- $5 free credit per month
- One-click PostgreSQL + Redis
- Auto-deploy from GitHub
- Very easy to use

### 🛠️ Setup:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Railway auto-detects Python and deploys
6. Add PostgreSQL: Click "New" → "Database" → "PostgreSQL"
7. Add Redis: Click "New" → "Database" → "Redis"
8. Set environment variables in Railway dashboard

---

## Option 3: Vercel (Frontend) + Supabase (Backend)

### For Frontend:

1. Go to https://vercel.com
2. Import GitHub repository
3. Configure build settings:
   - Framework: Other
   - Root Directory: `.`
   - Build Command: (leave empty)
   - Output Directory: `.`
4. Deploy

### For Backend:

Use **Supabase** (free PostgreSQL) or **PythonAnywhere**

#### Supabase Setup:
1. Go to https://supabase.com
2. Create new project (free tier)
3. Get connection string from Settings → Database
4. Update your backend `.env` with Supabase connection string

---

## Option 4: Heroku Alternative - fly.io

### ✅ Pros:
- Free allowance: 3 shared-cpu VMs
- Free PostgreSQL (3GB storage)
- Global deployment

### 🛠️ Setup:

Create `fly.toml`:

```toml
app = "jal-jeevan-mission"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

Deploy:
```bash
# Install flyctl
brew install flyctl

# Login
flyctl auth login

# Deploy
flyctl launch
flyctl deploy
```

---

## Option 5: Free Tier Combination (Best Performance)

### Frontend: Netlify/Vercel (Free)
- Unlimited bandwidth
- Auto SSL
- CDN included

### Backend: PythonAnywhere (Free)
- Always-on web app
- Limited to 100 seconds/day API calls
- Perfect for demos

### Database: Supabase (Free)
- 500MB database
- Unlimited API requests

---

## 🔧 Configuration for Free Hosting

### Update `backend/.env` for production:

```env
# Database (from hosting provider)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis (optional for free tier)
REDIS_URL=redis://host:6379

# MQTT (use free public broker)
MQTT_BROKER_HOST=test.mosquitto.org
MQTT_BROKER_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Security
SECRET_KEY=your-generated-secret-key-here
CORS_ORIGINS=https://your-frontend.vercel.app

# Disable debug in production
DEBUG=false
```

---

## 📊 Free Hosting Comparison

| Provider | Backend | Database | Storage | Bandwidth | Best For |
|----------|---------|----------|---------|-----------|----------|
| **Render** | 750 hrs/mo | PostgreSQL 90 days | 512MB | 100GB/mo | Full stack |
| **Railway** | $5 credit/mo | PostgreSQL + Redis | 1GB | 100GB/mo | Easy setup |
| **Vercel** | Serverless | None | N/A | 100GB/mo | Frontend only |
| **Fly.io** | 3 VMs | PostgreSQL 3GB | 3GB | 160GB/mo | Global deploy |
| **PythonAnywhere** | 1 web app | MySQL 100MB | 512MB | Limited | Simple demo |

---

## 🚀 Quick Start: Deploy in 5 Minutes

### Using Render (Recommended):

```bash
# 1. Push to GitHub
cd /Users/moqa/Desktop/gis/jal-jeevan-platform
git init
git add .
git commit -m "Deploy Jal Jeevan Mission"
git branch -M main
git remote add origin YOUR_GITHUB_URL
git push -u origin main

# 2. Go to https://render.com
# 3. New → Web Service
# 4. Connect GitHub repo
# 5. Configure:
#    - Name: jal-jeevan-backend
#    - Environment: Python
#    - Build Command: pip install -r backend/requirements.txt
#    - Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
# 6. Add PostgreSQL database
# 7. Deploy!
```

---

## 🔒 Security Checklist for Production

- [ ] Change SECRET_KEY to a strong random string
- [ ] Set CORS_ORIGINS to your frontend URL only
- [ ] Set DEBUG=false
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Set up database backups
- [ ] Add rate limiting
- [ ] Monitor logs regularly

---

## 📝 Post-Deployment Steps

1. **Test all endpoints**: Visit `/docs` on your backend URL
2. **Update frontend URLs**: Change API URLs in your frontend code
3. **Set up monitoring**: Use UptimeRobot (free) to monitor uptime
4. **Custom domain** (optional): Most platforms support free custom domains

---

## 💡 Cost-Saving Tips

1. **Use free MQTT broker**: `test.mosquitto.org` or `broker.hivemq.com`
2. **Optimize images**: Compress all images to reduce bandwidth
3. **Enable caching**: Use browser caching for static assets
4. **Sleep inactive apps**: Most free tiers sleep after inactivity (acceptable for demos)
5. **Database optimization**: Clean old sensor readings regularly

---

## 🆘 Troubleshooting

### Common Issues:

**"Application Error" on Render:**
- Check build logs for Python version compatibility
- Ensure all dependencies in requirements.txt
- Verify PORT is set correctly

**Database Connection Failed:**
- Check DATABASE_URL format
- Ensure PostgreSQL extensions (PostGIS) are installed
- Verify firewall allows connections

**MQTT Not Working:**
- Use public test broker for free hosting
- Check MQTT_BROKER_HOST is accessible
- Test with MQTT client tools first

---

## 📧 Support

If you encounter issues:
1. Check provider documentation
2. Review deployment logs
3. Test locally first with same environment variables
4. Contact provider support (most have free tier support)

---

## ✅ Next Steps After Hosting

1. Share your live URL!
2. Monitor application performance
3. Set up CI/CD for automatic deployments
4. Add analytics (Google Analytics, etc.)
5. Collect user feedback
6. Plan for scaling when you outgrow free tier
