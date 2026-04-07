# 🚀 Suppa Deployment Checklist

**Estimated time**: 30 minutes  
**Cost**: $5/month (Railway)  
**Result**: Live app at https://your-netlify-site.netlify.app

---

## ✅ Pre-Deployment (Complete Before Starting)

- [ ] Task 8 testing validated ✓ (already done!)
- [ ] Backend code builds without errors ✓ (already done!)
- [ ] PocketBase collections created ✓ (already done!)
- [ ] OPENAI_API_KEY ready (check your account)

---

## 🔧 Step 1: Prepare for Deployment (5 min)

### 1.1 Have these ready:
```
□ GitHub account (for code storage)
□ Netlify account (for frontend deployment)
□ Railway account (for PocketBase hosting)
□ OpenAI API key
□ PocketBase admin credentials:
  - Email: jon.searle@gmail.com
  - Password: SK8Ztxn4aERA7Ey
```

### 1.2 Push code to GitHub:
```bash
cd /Users/jonsearle/Desktop/Suppa/.claude/worktrees/iteration-1

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Suppa MVP: PocketBase migration + Task 8 fixes"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/suppa.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Step 2: Deploy PocketBase to Railway (10 min)

### 2.1 Create Railway Account
- [ ] Go to https://railway.app
- [ ] Sign up (use GitHub)
- [ ] Create account

### 2.2 Deploy PocketBase
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From Suppa root directory:
railway init

# When prompted:
# - Project name: "suppa-pocketbase"
# - Select Docker
# - Select Dockerfile.pocketbase

# Deploy
railway up --dockerfile Dockerfile.pocketbase
```

### 2.3 Get Your Railway URL
- [ ] After deployment, Railway shows your URL
- [ ] Format: `https://suppa-pocketbase-prod.up.railway.app`
- [ ] **Save this URL** ← YOU'LL NEED THIS

### 2.4 Verify PocketBase Works
- [ ] Open `https://your-railway-url/_/` in browser
- [ ] Log in with admin credentials
- [ ] Verify you see `inventory_items` and `chat_messages` collections
- [ ] If you can't log in, check Railway logs

---

## ⚙️ Step 3: Deploy Backend to Netlify (10 min)

### 3.1 Connect GitHub to Netlify
- [ ] Go to https://app.netlify.com
- [ ] Click "New site from Git"
- [ ] Authorize GitHub
- [ ] Select your `suppa` repository

### 3.2 Configure Build Settings
```
Build command: cd backend && npm install && npm run build
Publish directory: backend/dist
Functions directory: backend/netlify/functions
```

- [ ] Click "Deploy site"
- [ ] Wait for build to complete (~3-5 min)
- [ ] Check for build errors in logs

### 3.3 Set Environment Variables
In Netlify dashboard → Site settings → Build & deploy → Environment:

```
□ POCKETBASE_URL = https://your-railway-url (from Step 2.3)
□ USER_ID = prod_user
□ OPENAI_API_KEY = sk-xxxxx (your actual key)
```

### 3.4 Verify Backend Works
```bash
# Test the health endpoint
curl https://your-netlify-site.netlify.app/.netlify/functions/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

- [ ] Got a 200 response
- [ ] No errors in Netlify Functions logs

---

## 🎨 Step 4: Deploy Frontend to Netlify (5 min)

### 4.1 Update API URL in Frontend
Edit `frontend/src/services/api.ts`:

```typescript
// Change this line:
const API_BASE = 'http://localhost:3000'

// To your Netlify site:
const API_BASE = 'https://your-netlify-site.netlify.app'
```

- [ ] Updated API_BASE URL

### 4.2 Build Frontend
```bash
cd frontend
npm install
npm run build
```

- [ ] Build completed without errors

### 4.3 Deploy Frontend
```bash
# Option A: Netlify CLI
netlify deploy --prod --dir=dist

# Option B: Push to GitHub (auto-deploys)
git add .
git commit -m "Update API URL for production"
git push
```

- [ ] Frontend deployed
- [ ] Site is live at https://your-netlify-site.netlify.app

---

## ✨ Step 5: Test Everything (5 min)

### 5.1 Smoke Test
- [ ] Open https://your-netlify-site.netlify.app in browser
- [ ] Page loads (not a 404)
- [ ] No console errors (press F12)

### 5.2 Full Workflow Test
- [ ] Add inventory item ("5 apples")
- [ ] Check browser network tab → See API call
- [ ] Get meal suggestions
- [ ] Click a recipe
- [ ] See recipe details load
- [ ] Start cooking
- [ ] Confirm deduction

### 5.3 Test Task 8 Fixes
- [ ] Add "10 tomatoes" to inventory
- [ ] Cook a recipe using 3 tomatoes
- [ ] Verify 7 tomatoes remain (Fix #1 ✓)
- [ ] Try cooking with "5 tomatoes" when you have 2
- [ ] Verify error message (Fix #2 ✓)

### 5.4 Monitor for Errors
- [ ] Netlify dashboard → Functions logs (no errors)
- [ ] Railway dashboard → Logs (no errors)
- [ ] Browser console (F12 → Console tab)

---

## 📊 Success Criteria

You're done when:

✅ Frontend loads at `https://your-netlify-site.netlify.app`
✅ API calls reach backend successfully
✅ Backend communicates with PocketBase on Railway
✅ Task 8 fixes work in production
✅ No errors in any logs
✅ Full user workflow tested end-to-end

---

## 🐛 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| PocketBase not accessible | Check Railway service is running, URL is public |
| API 404 errors | Verify POCKETBASE_URL env var is set correctly |
| Frontend blank page | Check build logs, verify dist folder has files |
| "Can't reach PocketBase" | Check POCKETBASE_URL is accessible from internet |
| Inventory not saving | Check browser network tab, look for API errors |

---

## 🎉 Post-Deployment

Once everything is working:

1. **Share the link** with friends/family
2. **Gather feedback** on Task 8 fixes
3. **Monitor usage** in Netlify and Railway dashboards
4. **Proceed to Task 9** (Polish & Final Iteration)

---

## 💰 Verify Costs

```
Netlify:   Free ($0/month)
Railway:   Hobby tier $5/month
OpenAI:    ~$0.01-1/month (you pay as you go)
─────────────────────────────
Total:     ~$5-6/month ✨
```

Perfect for an MVP!

---

## 📝 Notes

- Deployment is **fully reversible** - both platforms support instant rollbacks
- You can **update anytime** by pushing to GitHub (auto-deploys)
- Both **scale automatically** if you get more users
- No credit card required for Netlify free tier

---

**Ready to deploy? Start with Step 1 and follow the checklist!**

Need help? Check DEPLOYMENT_GUIDE.md for detailed instructions.
