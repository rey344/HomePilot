# HomePilot – Production Deployment Guide

Deploy HomePilot to production with Vercel (frontend) + Railway/Render (backend) + managed PostgreSQL.

---

## Architecture Overview

```
Frontend (Vercel)  →  Backend (Railway/Render)  →  Database (Railway/Neon/Supabase)
   Next.js              FastAPI                      PostgreSQL
```

---

## Option 1: Deploy with Railway (Recommended)

Railway provides seamless PostgreSQL + Python backend hosting with automatic deployments.

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your HomePilot repository
   - Select the `backend` directory as the root

3. **Add PostgreSQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create a database

4. **Configure Environment Variables**
   - Go to your backend service → "Variables"
   - Add these variables:
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     CORS_ORIGINS=https://your-app.vercel.app,https://homepilot.vercel.app
     PORT=8000
     ```
   - Railway auto-connects `DATABASE_URL` to your Postgres instance

5. **Deploy**
   - Railway will automatically deploy on every git push
   - Note your backend URL: `https://your-backend.railway.app`

6. **Verify**
   - Visit `https://your-backend.railway.app/health`
   - Visit `https://your-backend.railway.app/docs` (API documentation)

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your HomePilot repository
   - **Choose a unique project name** (e.g., `homepilot-yourname`, `homepilot-demo-123`)
     - This becomes your URL: `https://project-name.vercel.app`
     - If name is taken, Vercel will suggest alternatives
   - Select `frontend` as the root directory

3. **Configure Build Settings**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Environment Variables**
   - Add this variable:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-app.vercel.app`

6. **Update Backend CORS**
   - Go back to Railway → Backend service → Variables
   - Update `CORS_ORIGINS` with your Vercel URL

---

## Option 2: Deploy with Render (Alternative)

### Step 1: Deploy Backend to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Dashboard → "New" → "PostgreSQL"
   - Name: `homepilot-db`
   - Plan: Free (or paid for production)
   - Note the "Internal Database URL"

3. **Create Web Service**
   - Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `homepilot-backend`
     - **Root Directory**: `backend`
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Environment Variables**
   ```
   DATABASE_URL=<your-render-postgres-url>
   CORS_ORIGINS=https://your-app.vercel.app
   ```

5. **Deploy & Verify**
   - Render will deploy automatically
   - Visit `https://homepilot-backend.onrender.com/health`

### Step 2: Deploy Frontend to Vercel

Same as Railway Option above, but use your Render backend URL.

---

## Option 3: Vercel + Neon (Serverless PostgreSQL)

### Step 1: Set Up Neon Database

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up (free tier available)

2. **Create Database**
   - Create new project: "HomePilot"
   - Copy the connection string

### Step 2: Deploy Backend to Railway/Render

Same as above options, but use Neon's DATABASE_URL

---

## Post-Deployment Configuration

### 1. Update CORS Settings

After deploying frontend, update backend CORS:

**Railway:**
```bash
# In Railway dashboard → Variables
CORS_ORIGINS=https://your-actual-app.vercel.app,https://homepilot-preview-*.vercel.app
```

**Render:**
```bash
# In Render dashboard → Environment
CORS_ORIGINS=https://your-actual-app.vercel.app
```

### 2. Custom Domain (Optional)

**Vercel:**
- Settings → Domains → Add Domain
- Follow DNS configuration steps

**Railway:**
- Settings → Domain → Add Custom Domain

### 3. Enable Production Optimizations

**Frontend (Vercel):**
- Environment Variables → Add:
  ```
  NODE_ENV=production
  ```

**Backend (Railway/Render):**
- Already set to production mode

---

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g., `https://backend.railway.app`) | ✅ Yes |
| `NODE_ENV` | `production` | Optional |

### Backend (Railway/Render)

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `CORS_ORIGINS` | Comma-separated frontend URLs | ✅ Yes |
| `PORT` | `8000` (Railway/Render auto-set) | Auto |

---

## Monitoring & Health Checks

### Health Check Endpoints

- **Backend**: `/health`
- **Frontend**: Root URL `/`

### Logs

**Railway:**
- Project → Service → "Deployments" tab → Click deployment

**Render:**
- Dashboard → Service → "Logs" tab

**Vercel:**
- Project → "Deployments" → Click deployment → "Logs"

---

## Troubleshooting

### Frontend can't connect to backend

**Check:**
1. `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Backend CORS includes your Vercel URL
3. Backend is running (visit `/health` endpoint)

**Fix:**
```bash
# Vercel: Redeploy after updating env vars
# Railway: Redeploy → Variables → Update CORS_ORIGINS
```

### Database connection errors

**Check:**
1. `DATABASE_URL` is set in backend
2. Database is running
3. Migrations ran successfully

**Fix:**
```bash
# Railway: Service Logs → Check for "alembic upgrade head" success
# Render: Logs → Look for connection errors
```

### Build failures

**Frontend:**
- Check Node version (should be 18+)
- Verify `package-lock.json` is committed
- Check build logs in Vercel

**Backend:**
- Check Python version (should be 3.11+)
- Verify `requirements.txt` is up to date
- Check build logs in Railway/Render

---

## Cost Estimates (as of 2026)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** | Unlimited personal projects | $20/mo (Pro) |
| **Railway** | $5 free credit/month | Pay-as-you-go |
| **Render** | 750 hours/month free | $7/mo (Starter) |
| **Neon** | 3 GB storage free | $19/mo (Pro) |

**Total for MVP**: Free tier covers development and demo use.

---

## Quick Deploy Checklist

- [ ] Push code to GitHub
- [ ] Deploy backend to Railway/Render
- [ ] Copy backend URL
- [ ] Deploy frontend to Vercel
- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel
- [ ] Update `CORS_ORIGINS` in backend
- [ ] Test `/health` endpoint
- [ ] Test frontend → backend connection
- [ ] Share live URL with recruiters! 🚀

---

## Example Live URLs

After deployment, your app will be accessible at:

- **Frontend**: `https://homepilot-yourname.vercel.app` (Vercel auto-generates or you choose)
- **Backend API**: `https://homepilot-backend-production.up.railway.app` (Railway auto-generates)
- **API Docs**: `https://homepilot-backend-production.up.railway.app/docs`

**Note**: Vercel and Railway will auto-generate unique URLs. You can customize them in settings.

---

## Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Render Docs**: [render.com/docs](https://render.com/docs)

---

**Ready to deploy!** Start with Railway + Vercel for the smoothest experience.
