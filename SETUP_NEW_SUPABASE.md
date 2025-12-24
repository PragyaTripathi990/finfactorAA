# Setup New Supabase Database

## Quick Steps to See Data

### Step 1: Update .env File

Make sure your `.env` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://dsixqqltqlqxtcfrtytw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key-here
```

### Step 2: Run Schema in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/project/dsixqqltqlqxtcfrtytw
2. Click **SQL Editor** (left sidebar)
3. Copy contents of `scripts/production-schema.sql`
4. Paste and click **Run**
5. Wait for "Schema created with 29 tables" message

### Step 3: Seed Database

Run in terminal:
```bash
npm run seed:simple
```

This will populate:
- 24 accounts
- 20 holders
- 17 deposit summaries
- 11 MF holdings
- 12 equity holdings
- Transactions
- Insights

### Step 4: View Data

**Go to main dashboard (NOT test dashboard):**
- Main Dashboard: `http://localhost:3000/` ← **This shows your data**
- Test Dashboard: `http://localhost:3000/test-dashboard` ← This shows test results

On the main dashboard:
- Click **"Deposit"** tab → **"Linked Accounts"** to see accounts
- Click **"Deposit"** tab → **"Insights"** to see insights
- Click **"Portfolio"** tab to see overview

---

## Why Test Dashboard is Empty?

The test dashboard (`/test-dashboard`) runs automated tests, not your actual data. It shows:
- ✅/❌ Test results
- Not your financial data

**To see your data:** Go to `http://localhost:3000/` (main dashboard)



