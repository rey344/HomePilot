# Quick Deploy to Production

Simple one-page deployment guide to get HomePilot live in ~15 minutes.

---

## Prerequisites

- [ ] GitHub account with HomePilot repo pushed
- [ ] Railway account (free - sign up at [railway.app](https://railway.app))
- [ ] Vercel account (free - sign up at [vercel.com](https://vercel.com))

---

## Step 1: Deploy Backend + Database (5 min)

### Railway Setup

1. Go to [railway.app](https://railway.app) → **New Project**

2. Select "**Deploy from GitHub repo**"
   - Choose your HomePilot repository
   - Root directory: `backend`

3. Add PostgreSQL:
   - Click "**+ New**" → "**Database**" → "**PostgreSQL**"

4. Set Environment Variables:
   - Click on your backend service
   - Go to "**Variables**" tab
   - Click "**+ New Variable**" and add:
   
   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   PORT = 8000
   CORS_ORIGINS = https://your-app-name.vercel.app
   ```
   (You'll update CORS_ORIGINS later with your actual Vercel URL - Vercel will auto-generate this)

5. Get your backend URL:
   - Go to "**Settings**" tab
   - Under "**Domains**", copy the generated URL
   - Example: `https://homepilot-backend-production.up.railway.app`

6. **Test it**:
   - Visit `https://your-backend-url.railway.app/health`
   - Should see: `{"status":"ok","version":"1.0.0","database":"connected"}`
   - Visit `https://your-backend-url.railway.app/docs` for API docs

✅ Backend deployed!

---

## Step 2: Deploy Frontend (5 min)

### Vercel Setup

1. Go to [vercel.com](https://vercel.com) → **New Project**

2. **Import** your HomePilot repository

3. Configure Project:
   - **Project Name**: Choose a unique name (e.g., `homepilot-yourname`, `homepilot-demo-rey`)
     - This becomes your URL: `https://your-project-name.vercel.app`
     - If taken, Vercel suggests alternatives
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. Add Environment Variable:
   - Click "**Environment Variables**"
   - Add:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend-url.railway.app
   ```
   (Use the Railway backend URL from Step 1)

5. Click "**Deploy**" (wait ~2-3 minutes)

6. Get your frontend URL:
   - Vercel shows it after deployment
   - Example: `https://homepilot-reysanchez.vercel.app` or whatever name you choose
   - **Tip**: You can customize the project name during import to get a unique URL

✅ Frontend deployed!

---

## Step 3: Update CORS (2 min)

Now that you have your Vercel URL, update backend CORS:

1. Go back to **Railway** → Your backend service

2. **Variables** tab → Edit `CORS_ORIGINS`:
   ```
   CORS_ORIGINS = https://your-actual-app.vercel.app,https://your-actual-app-git-*.vercel.app
   ```
   (Replace with your actual Vercel URL from Step 2)

3. Railway will automatically redeploy

✅ CORS configured!

---

## Step 4: Test Everything (3 min)

1. **Visit your app**: `https://your-app.vercel.app`

2. **Test the calculator**:
   - Enter home value: $400,000
   - Enter down payment: $80,000
   - Enter monthly income: $8,000
   - Click "**Calculate**"
   
3. **Check the results**:
   - Should see PITI breakdown
   - Should see affordability analysis
   - Should see amortization schedule

4. **Test the API**:
   - Visit `https://your-backend-url.railway.app/docs`
   - Try the interactive docs

✅ Everything working!

---

## Step 5: Share with Recruiters 🚀

**Your portfolio links:**

📱 **Live App**: `https://your-app.vercel.app`

🔧 **API Docs**: `https://your-backend-url.railway.app/docs`

💻 **GitHub**: `https://github.com/your-username/HomePilot`

**Add to your resume/LinkedIn:**
```
HomePilot - Full-Stack Homebuying Platform
• Next.js + TypeScript + Tailwind CSS frontend
• FastAPI + PostgreSQL backend
• Deployed on Vercel + Railway
• Live demo: https://your-app.vercel.app
```

---

## Troubleshooting

### Frontend shows "Failed to fetch"

**Fix:**
1. Check that `NEXT_PUBLIC_API_URL` is set in Vercel
2. Redeploy frontend in Vercel
3. Check backend is running: visit `/health` endpoint

### Backend not connecting to database

**Fix:**
1. Check `DATABASE_URL` is set to `${{Postgres.DATABASE_URL}}` in Railway
2. Verify PostgreSQL service is running in Railway
3. Check logs in Railway dashboard

### CORS errors in browser console

**Fix:**
1. Update `CORS_ORIGINS` in Railway to include your Vercel URL
2. Make sure there are no trailing slashes in URLs
3. Redeploy backend in Railway

---

## Optional: Custom Domain

### Vercel Custom Domain

1. Vercel Dashboard → Your project → **Settings** → **Domains**
2. Add your domain (e.g., `homepilot.com`)
3. Follow DNS instructions

### Railway Custom Domain

1. Railway Dashboard → Your service → **Settings** → **Domains**
2. Click "**+ Custom Domain**"
3. Add your domain (e.g., `api.homepilot.com`)
4. Follow DNS instructions

---

## Cost (2026 Pricing)

| Service | Free Tier | What You Get |
|---------|-----------|--------------|
| **Railway** | $5 credit/month | Good for personal projects |
| **Vercel** | Unlimited | Perfect for portfolios |
| **Total** | **Free** | ✅ More than enough for demos |

---

## Next Steps

- [ ] Add your live URLs to README.md
- [ ] Add project to your portfolio website
- [ ] Share on LinkedIn
- [ ] Add to resume
- [ ] Configure custom domain (optional)

---

**🎉 Congratulations!** Your app is now live and ready to impress recruiters!

Need help? Check the [full deployment guide](DEPLOYMENT.md).
