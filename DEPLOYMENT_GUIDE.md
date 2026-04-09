# Suppa Deployment Guide

**Goal**: Deploy Suppa to production using Netlify + Railway

**Timeline**: ~30 minutes
**Cost**: $5/month (Railway hobby tier for PocketBase)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Users                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
        ▼                                      ▼
  ┌──────────────┐                   ┌──────────────────┐
  │   Netlify    │                   │   Netlify Admin  │
  │ (Frontend)   │                   │   (DNS, Deploy)  │
  │ (API Routes) │                   │                  │
  └──────────────┘                   └──────────────────┘
        │
        └──────────────────────────────────┐
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   Railway    │
                                    │ (PocketBase) │
                                    │   (Database) │
                                    └──────────────┘
```

---

## Step 1: Deploy PocketBase to Railway

### 1.1 Create Railway Account
- Go to https://railway.app
- Sign up (GitHub, Google, or email)
- Create a new project

### 1.2 Deploy PocketBase Container
```bash
# In Railway dashboard:
# 1. Click "New Project"
# 2. Select "Docker"
# 3. Connect to GitHub (skip for now, we'll use CLI)
# 4. Or use Railway CLI:

npm install -g @railway/cli
railway login
railway init

# In the init wizard:
# - Project name: "suppa-pocketbase"
# - Select Docker

# Then deploy:
railway up --dockerfile Dockerfile.pocketbase
```

### 1.3 Get PocketBase URL
After deployment, Railway will give you a URL like:
```
https://suppa-pocketbase-prod.up.railway.app
```

**Save this URL** - you'll need it for the backend.

### 1.4 Access PocketBase Admin
- Go to `https://your-railway-url/_/`
- Log in with your admin credentials (jon.searle@gmail.com / SK8Ztxn4aERA7Ey)
- Verify collections exist

---

## Step 2: Deploy Backend to Netlify

### 2.1 Connect GitHub
The easiest way is to push your code to GitHub:

```bash
# From your Suppa root directory
git init
git add .
git commit -m "Initial commit: Suppa MVP with PocketBase"
git remote add origin https://github.com/YOUR_USERNAME/suppa.git
git push -u origin main
```

### 2.2 Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Authenticate
netlify login

# Deploy from root directory
netlify deploy --prod
```

Or use Netlify dashboard:
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Connect GitHub account
4. Select your `suppa` repository
5. Build settings:
   - Build command: `cd backend && npm install && npm run build`
   - Publish directory: `backend/dist`
   - Functions directory: `backend/netlify/functions`
6. Click "Deploy site"

### 2.3 Set Environment Variables
In Netlify dashboard:
1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add variables:
   - `POCKETBASE_URL` = `https://your-railway-url`
   - `USER_ID` = `prod_user`
   - `OPENAI_API_KEY` = your actual API key

---

## Step 3: Deploy Frontend to Netlify

### 3.1 Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 3.2 Update API URL
Edit `frontend/src/services/api.ts`:
```typescript
// Change from:
const API_BASE = 'http://localhost:3000'

// To:
const API_BASE = 'https://your-netlify-site.netlify.app'
```

### 3.3 Deploy
```bash
# Option A: Netlify CLI
cd frontend
netlify deploy --prod --dir=dist

# Option B: GitHub + automatic deploy
# (If you're using GitHub integration, just push to main)
```

---

## Step 4: Wire Everything Together

### 4.1 Update Frontend API Calls
Make sure `frontend/src/services/api.ts` points to your Netlify site:

```typescript
const API_BASE = process.env.VITE_API_URL || 'https://your-netlify-site.netlify.app';
```

### 4.2 Update Backend Environment
Make sure `backend/.env` has the correct PocketBase URL:

```bash
POCKETBASE_URL=https://your-railway-url
USER_ID=prod_user
OPENAI_API_KEY=sk-your-key-here
```

### 4.3 Test the Connection
```bash
# Test backend API
curl https://your-netlify-site.netlify.app/.netlify/functions/api/health

# Should return:
# {"status": "ok", "timestamp": "..."}
```

---

## Step 5: Production Verification

### 5.1 Test Full Flow
1. Open https://your-netlify-site.netlify.app in browser
2. Add inventory items
3. Get meal suggestions
4. Start cooking
5. Confirm and deduct ingredients
6. Verify remainder items created (Task 8 Fix #1)
7. Try deducting more than available (Task 8 Fix #2 - should error)

### 5.2 Monitor Logs
- **Frontend errors**: Netlify dashboard → Functions
- **Backend errors**: Netlify dashboard → Functions logs
- **Database errors**: Railway dashboard → Logs

---

## Troubleshooting

### "PocketBase connection refused"
- Check POCKETBASE_URL is correct in Netlify env vars
- Verify Railway URL is accessible from internet
- Check Railway service is running

### "API 404 errors"
- Verify backend is deployed (check Netlify Functions)
- Check API routes are correctly configured
- Verify `netlify.toml` redirects are in place

### "Database schema errors"
- Make sure collections exist in PocketBase
- Check field names match exactly
- Verify admin has proper permissions

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Netlify | Free | Frontend + Functions (free tier) |
| Railway | $5/month | PocketBase hobby tier |
| OpenAI | ~$0.01-$1/month | Pay as you go |
| **Total** | **~$5-6/month** | Very affordable MVP |

---

## Next Steps After Deployment

1. **Test thoroughly** - Use production data to find edge cases
2. **Gather feedback** - Share with friends/family
3. **Task 9** - Polish & Final Iteration
4. **Analytics** - Add tracking to understand usage
5. **Scale** - If popular, upgrade to paid tiers

---

## Quick Reference

**URLs after deployment:**
- Frontend: `https://your-netlify-site.netlify.app`
- Backend API: `https://your-netlify-site.netlify.app/.netlify/functions/api`
- PocketBase Admin: `https://your-railway-url/_/`
- PocketBase API: `https://your-railway-url/api`

**Rollback**: Both Netlify and Railway support instant rollbacks if something breaks.

---

## Questions?

Check the docs:
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Railway: https://docs.railway.app/
- PocketBase: https://pocketbase.io/docs/
