# Quick Setup - See Your Data

## The Problem
- You're on **Test Dashboard** (`/test-dashboard`) - this shows test results, not your data
- Your **new Supabase database is empty** - needs schema + data

## Solution (3 Steps)

### Step 1: Run Schema in Supabase
1. Go to: https://supabase.com/dashboard/project/dsixqqltqlqxtcfrtytw/sql/new
2. Copy **entire contents** of `scripts/production-schema.sql`
3. Paste in SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for: "Schema created with 29 tables"

### Step 2: Seed Database
```bash
npm run seed:simple
```

This populates:
- ✅ 24 accounts
- ✅ 20 holders  
- ✅ 17 deposit summaries
- ✅ 11 MF holdings
- ✅ 12 equity holdings
- ✅ Transactions
- ✅ Insights

### Step 3: Go to Main Dashboard
**Open:** `http://localhost:3000/` (NOT `/test-dashboard`)

Then:
- Click **"Deposit"** tab → **"Linked Accounts"** to see accounts
- Click **"Deposit"** tab → **"Insights"** to see insights
- Click **"Portfolio"** tab to see overview

---

## Why Test Dashboard is Empty?

The test dashboard runs **automated tests**, not your actual data. It shows:
- ✅/❌ Test pass/fail results
- Not your financial data

**To see your data:** Always use `http://localhost:3000/` (main dashboard)



