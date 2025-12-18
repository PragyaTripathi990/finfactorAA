# Environment Variables Setup

## Current Status

**⚠️ The Finfactor API credentials are currently HARDCODED in the code.**

I've updated `lib/finfactor.ts` to use environment variables, but you need to create a `.env` file to store them securely.

## Required Environment Variables

Create a `.env` file in the project root with these variables:

```env
# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://epxfwxzerivaklmennfo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_9HffItjyNohPc6GIDQx-PQ_RuPjCto-

# Finfactor API Configuration
# ⚠️ IMPORTANT: These are currently hardcoded but should be in .env
FINFACTOR_BASE_URL=https://dhanaprayoga.fiu.finfactor.in
FINFACTOR_USER_ID=pfm@dhanaprayoga
FINFACTOR_PASSWORD=7777

# MongoDB Configuration (optional, if using MongoDB)
# MONGODB_URI=mongodb://localhost:27017/finfactor_aa
```

## How It Works Now

The code in `lib/finfactor.ts` now checks for environment variables first, then falls back to hardcoded values:

```typescript
// Base URL
const BASE_URL = process.env.FINFACTOR_BASE_URL || 'https://dhanaprayoga.fiu.finfactor.in';

// Credentials
userId: process.env.FINFACTOR_USER_ID || 'pfm@dhanaprayoga',
password: process.env.FINFACTOR_PASSWORD || '7777',
```

## Security Best Practices

1. **✅ DO:**
   - Store credentials in `.env` file
   - Add `.env` to `.gitignore` (already done)
   - Use different credentials for dev/staging/prod
   - Rotate credentials regularly

2. **❌ DON'T:**
   - Commit `.env` file to git
   - Hardcode credentials in source code
   - Share credentials in chat/email
   - Use production credentials in development

## Next Steps

1. **Create `.env` file:**
   ```bash
   # In project root
   touch .env
   ```

2. **Add the variables above** to your `.env` file

3. **For production:**
   - Use your hosting platform's environment variable settings
   - Vercel: Project Settings → Environment Variables
   - Other platforms: Check their documentation

4. **Optional:** Create `.env.example` (without actual values) as a template:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key
   FINFACTOR_BASE_URL=your-finfactor-url
   FINFACTOR_USER_ID=your-user-id
   FINFACTOR_PASSWORD=your-password
   ```

## Current Hardcoded Values

These are the current fallback values (for reference):

- **FINFACTOR_BASE_URL:** `https://dhanaprayoga.fiu.finfactor.in`
- **FINFACTOR_USER_ID:** `pfm@dhanaprayoga`
- **FINFACTOR_PASSWORD:** `7777`

⚠️ **Note:** If these are production credentials, you should change them immediately after moving to `.env`!

