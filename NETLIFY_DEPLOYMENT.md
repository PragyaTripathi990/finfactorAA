# 🚀 Deploy to Netlify - Step by Step Guide

## Option 1: Deploy via Netlify Dashboard (Easiest)

### Step 1: Push your code to GitHub
```bash
git add -A
git commit -m "Add Netlify configuration"
git push origin main
```

### Step 2: Go to Netlify
1. Visit: https://app.netlify.com
2. Sign up/Login (you can use your GitHub account)

### Step 3: Add New Site
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"GitHub"** and authorize Netlify
3. Select your repository: `finfactorAA`
4. Select branch: **`main`**

### Step 4: Configure Build Settings
Netlify should auto-detect Next.js, but verify:
- **Build command:** `npm run build`
- **Publish directory:** `.next` (or leave empty, Netlify will handle it)
- **Node version:** `20` (or latest)

### Step 5: Add Environment Variables
Click **"Show advanced"** → **"New variable"** and add:

#### Finfactor API Variables:
- `FINFACTOR_BASE_URL` = `https://api.finfactor.in`
- `FINFACTOR_USER_ID` = `your_user_id_here`
- `FINFACTOR_PASSWORD` = `your_password_here`

#### Supabase Variables:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://epxfwxzerivaklmennfo.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` = `sb_publishable_9HffItjyNohPc6GIDQx-PQ_RuPjCto-`
- `SUPABASE_SERVICE_ROLE_KEY` = `your_service_role_key_here` (get from Supabase Dashboard → Settings → API)

### Step 6: Deploy!
Click **"Deploy site"** and wait for the build to complete.

---

## Option 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify
```bash
netlify login
```

### Step 3: Initialize and Deploy
```bash
netlify init
# Follow the prompts:
# - Create & configure a new site
# - Choose your team
# - Site name (or leave blank for auto-generated)
# - Build command: npm run build
# - Directory to deploy: .next (or leave blank)

# Set environment variables
netlify env:set FINFACTOR_BASE_URL "https://api.finfactor.in"
netlify env:set FINFACTOR_USER_ID "your_user_id_here"
netlify env:set FINFACTOR_PASSWORD "your_password_here"
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://epxfwxzerivaklmennfo.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "sb_publishable_9HffItjyNohPc6GIDQx-PQ_RuPjCto-"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_role_key_here"

# Deploy
netlify deploy --prod
```

---

## 🎯 Your Site URL
After deployment, Netlify will give you a URL like:
- `https://your-site-name.netlify.app`
- Your test dashboard will be at: `https://your-site-name.netlify.app/test-dashboard`

---

## 🔄 Alternative Platforms

### Railway (railway.app)
- Similar to Netlify
- Good for full-stack apps
- Free tier available

### Render (render.com)
- Simple deployment
- Free tier available
- Good for Next.js apps

### Cloudflare Pages (pages.cloudflare.com)
- Very fast
- Free tier
- Good for static/SSG sites

---

## ✅ After Deployment
1. Test your dashboard: `https://your-site.netlify.app/test-dashboard`
2. Check all API endpoints are working
3. Verify environment variables are set correctly

---

## 🆘 Troubleshooting

**Build fails?**
- Check build logs in Netlify dashboard
- Ensure all environment variables are set
- Verify Node version is 20+

**API calls not working?**
- Check environment variables are set correctly
- Verify CORS settings if needed
- Check Netlify function logs

**Need help?** Check Netlify docs: https://docs.netlify.com/integrations/frameworks/nextjs/

