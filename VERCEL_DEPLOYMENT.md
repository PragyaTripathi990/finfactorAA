# Vercel Deployment Guide

## 🎯 Quick Answer

**No backend deployment needed!** All API calls go directly to FinFactor's external API (`https://dhanaprayoga.fiu.finfactor.in`). You only need to deploy the Next.js frontend to Vercel.

## 📋 Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier is fine)
2. **GitHub/GitLab/Bitbucket Account** - Your code needs to be in a Git repository
3. **Environment Variables** - You'll need to add these in Vercel dashboard

## 🚀 Deployment Steps

### Step 1: Push Code to Git Repository

If you haven't already, initialize git and push to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for Vercel deployment"

# Create a repository on GitHub and push
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel will auto-detect Next.js
5. **Configure Environment Variables** (see Step 3 below)
6. Click **"Deploy"**

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? (press enter for default)
# - Directory? (press enter for ./)
# - Override settings? No
```

### Step 3: Add Environment Variables

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:

```
FINFACTOR_BASE_URL = https://dhanaprayoga.fiu.finfactor.in
FINFACTOR_USER_ID = pfm@dhanaprayoga
FINFACTOR_PASSWORD = 7777
NEXT_PUBLIC_SUPABASE_URL = https://epxfwxzerivaklmennfo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = sb_publishable_9HffItjyNohPc6GIDQx-PQ_RuPjCto-
```

**Important:**
- ✅ Add to **Production**, **Preview**, and **Development** environments
- ✅ After adding variables, **redeploy** your project (Vercel will prompt you)

### Step 4: Verify Deployment

1. After deployment, Vercel will give you a URL like: `https://your-project.vercel.app`
2. Visit the URL and test:
   - Go to `/test-dashboard`
   - Try clicking on different sections
   - Test the "Direct Consent" button

## 🔧 Troubleshooting

### Build Errors

If you get build errors:

1. **Check Node.js version:**
   - Vercel uses Node.js 18.x by default
   - If needed, add `.nvmrc` file with: `18` or `20`

2. **Check for TypeScript errors:**
   ```bash
   npm run build
   ```
   Fix any errors before deploying

3. **Check environment variables:**
   - Make sure all required variables are set in Vercel
   - Variables starting with `NEXT_PUBLIC_` are available in browser
   - Other variables are only available in server-side code

### API Errors After Deployment

If APIs return errors:

1. **Check CORS:** FinFactor API should allow requests from your Vercel domain
2. **Check credentials:** Verify environment variables are correct
3. **Check network:** Some APIs might block requests from certain regions

### Environment Variables Not Working

- Make sure variables are added to the correct environment (Production/Preview/Development)
- **Redeploy** after adding new variables
- Variables are case-sensitive

## 📝 Project Structure

```
NfinvuHU/
├── app/                    # Next.js App Router
│   ├── actions.ts          # Server Actions (API calls)
│   ├── components/        # React Components
│   └── test-dashboard/    # Main dashboard page
├── lib/
│   └── finfactor.ts       # FinFactor API client
├── package.json
└── next.config.mjs
```

## 🔐 Security Notes

1. **Environment Variables:**
   - ✅ Stored securely in Vercel (encrypted)
   - ✅ Never committed to Git
   - ✅ Different values for dev/prod (if needed)

2. **API Credentials:**
   - Currently using sandbox/test credentials
   - For production, use production credentials
   - Rotate credentials regularly

3. **CORS:**
   - FinFactor API needs to allow your Vercel domain
   - If blocked, contact FinFactor support

## 🌐 Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will handle SSL automatically

## 📊 Monitoring

- **Vercel Dashboard** shows:
  - Deployment status
  - Build logs
  - Function logs
  - Analytics (if enabled)

## 🆘 Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Support:** Available in dashboard

## ✅ Checklist

Before deploying:
- [ ] Code pushed to Git repository
- [ ] `npm run build` succeeds locally
- [ ] Environment variables documented
- [ ] No hardcoded credentials in code
- [ ] `.env.local` is in `.gitignore`

After deploying:
- [ ] Environment variables added in Vercel
- [ ] Build successful in Vercel
- [ ] Site accessible at Vercel URL
- [ ] Test dashboard loads correctly
- [ ] API calls work (test a few endpoints)
- [ ] Share URL with team

---

**Ready to deploy?** Follow Step 1-4 above! 🚀

