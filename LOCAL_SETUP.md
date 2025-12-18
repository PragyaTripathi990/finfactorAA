# Running on Localhost

## Quick Start

### 1. Install Dependencies (if not done)
```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://epxfwxzerivaklmennfo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_9HffItjyNohPc6GIDQx-PQ_RuPjCto-

# Finfactor API Configuration
FINFACTOR_BASE_URL=https://dhanaprayoga.fiu.finfactor.in
FINFACTOR_USER_ID=pfm@dhanaprayoga
FINFACTOR_PASSWORD=7777
```

### 3. Run the Seed Script (Populate Database)
```bash
npm run seed:from-apis
```

This will:
- Call your APIs
- Populate Supabase database
- Show missing fields report

### 4. Run the Next.js App (Development Server)
```bash
npm run dev
```

Then open: http://localhost:3000

---

## What Each Command Does

### `npm run seed:from-apis`
- Runs: `scripts/seed-from-apis.ts`
- Calls real Finfactor APIs
- Populates Supabase database
- Shows missing fields report
- **Runs on your local machine, writes to Supabase cloud**

### `npm run dev`
- Starts Next.js development server
- Runs on: http://localhost:3000
- Hot reload enabled
- Shows your app UI

---

## Prerequisites

1. ✅ Node.js installed (you have it - tsx works)
2. ✅ Dependencies installed (`npm install`)
3. ✅ Supabase schema created (run `supabase-schema-v2.sql` in Supabase Dashboard)
4. ✅ Environment variables set (`.env.local` file)

---

## Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "Supabase connection error"
- Check `.env.local` file exists
- Verify Supabase URL and key are correct
- Make sure schema is created in Supabase

### "API authentication failed"
- Check `FINFACTOR_USER_ID` and `FINFACTOR_PASSWORD` in `.env.local`
- Verify API credentials are correct

### "Table does not exist"
- Run `scripts/supabase-schema-v2.sql` in Supabase SQL Editor first

---

## Typical Workflow

```bash
# 1. First time setup
npm install
# Create .env.local file (see above)

# 2. Create schema in Supabase
# Copy scripts/supabase-schema-v2.sql
# Paste in Supabase Dashboard → SQL Editor → Run

# 3. Seed database
npm run seed:from-apis

# 4. Run app
npm run dev
# Open http://localhost:3000
```

