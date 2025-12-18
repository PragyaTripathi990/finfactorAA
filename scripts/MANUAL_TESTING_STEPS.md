# Manual Testing Steps - Zero Errors Approach

## 🎯 Goal: Test Everything Manually to Ensure 0 Errors

---

## 📋 Pre-Testing Checklist

Before you start, make sure:
- [ ] Supabase project is set up
- [ ] Environment variables are configured
- [ ] You have access to Supabase Dashboard
- [ ] APIs are working (you can call them)

---

## STEP 1: Verify Schema is Created ✅

### 1.1 Open Supabase Dashboard
1. Go to: https://app.supabase.com
2. Select your project
3. Click **Table Editor** in left sidebar

### 1.2 Check if Tables Exist
Look for these tables (should see them in the list):
- [ ] `tsp_providers`
- [ ] `aa_gateways`
- [ ] `app_users`
- [ ] `fips`
- [ ] `fi_accounts`
- [ ] `fi_account_holders_pii`
- [ ] `fi_deposit_summaries`
- [ ] `fi_recurring_deposit_summaries`
- [ ] `fi_mutual_fund_holdings`
- [ ] `fi_equity_holdings`

**If tables don't exist:**
1. Click **SQL Editor** in left sidebar
2. Click **New Query**
3. Copy entire content of `scripts/supabase-schema-v2.sql`
4. Paste and click **Run**
5. Wait for "Success" message

**✅ Expected:** All tables should appear in Table Editor

---

## STEP 2: Check Current Data State 📊

### 2.1 Check Record Counts

**In Supabase SQL Editor, run:**

```sql
-- Check how many records we have
SELECT 
  'app_users' as table_name, COUNT(*) as count FROM app_users
UNION ALL
SELECT 'fips', COUNT(*) FROM fips
UNION ALL
SELECT 'fi_accounts', COUNT(*) FROM fi_accounts
UNION ALL
SELECT 'fi_account_holders_pii', COUNT(*) FROM fi_account_holders_pii
UNION ALL
SELECT 'fi_deposit_summaries', COUNT(*) FROM fi_deposit_summaries
UNION ALL
SELECT 'fi_mutual_fund_holdings', COUNT(*) FROM fi_mutual_fund_holdings
UNION ALL
SELECT 'fi_equity_holdings', COUNT(*) FROM fi_equity_holdings;
```

**✅ Expected:**
- `app_users`: 1 record
- `fips`: 400+ records
- `fi_accounts`: 30+ records
- Others: May be 0 or have some records

### 2.2 Check Sample Data

**Run this to see actual data:**

```sql
-- See sample deposit accounts
SELECT 
  id,
  masked_acc_no,
  provider_name,
  fi_type,
  account_branch,
  account_ifsc_code,
  account_status
FROM fi_accounts
WHERE fi_type = 'DEPOSIT'
LIMIT 5;
```

**✅ Expected:** Should see account records
**❌ If Error:** Table might not exist or no data

---

## STEP 3: Check Empty/NULL Fields 🔍

### 3.1 Check Deposit Accounts

**Run this query:**

```sql
SELECT 
  COUNT(*) as total_accounts,
  COUNT(account_branch) as has_branch,
  COUNT(account_ifsc_code) as has_ifsc,
  COUNT(account_status) as has_status,
  COUNT(account_current_balance) as has_balance,
  -- Calculate missing
  COUNT(*) - COUNT(account_branch) as missing_branch,
  COUNT(*) - COUNT(account_ifsc_code) as missing_ifsc,
  COUNT(*) - COUNT(account_status) as missing_status,
  COUNT(*) - COUNT(account_current_balance) as missing_balance
FROM fi_accounts
WHERE fi_type = 'DEPOSIT';
```

**✅ Expected Result:**
```
total_accounts | has_branch | has_ifsc | has_status | has_balance | missing_branch | missing_ifsc | missing_status | missing_balance
     17        |     0      |    0     |     0      |      0      |      17        |     17       |      17        |      17
```

**This tells you:**
- If `missing_branch = 17` → All accounts missing branch (100% NULL)
- If `has_branch = 0` → Column might not exist OR all NULL

### 3.2 Check Account Holders

```sql
SELECT 
  COUNT(*) as total_holders,
  COUNT(name) as has_name,
  COUNT(pan) as has_pan,
  COUNT(dob) as has_dob,
  COUNT(mobile) as has_mobile
FROM fi_account_holders_pii;
```

**✅ Expected:**
- If `total_holders = 0` → No holder data stored at all
- If `has_name = 0` but `total_holders > 0` → Names are NULL

### 3.3 Check Equity Holdings

```sql
SELECT 
  COUNT(*) as total_equities,
  COUNT(bse_symbol) as has_bse,
  COUNT(nse_symbol) as has_nse,
  COUNT(market_cap_category) as has_market_cap
FROM fi_equity_holdings;
```

**✅ Expected:**
- If `has_bse = 0` → BSE symbols are NULL (column might not exist)

---

## STEP 4: Check if Columns Exist 🏗️

### 4.1 Check fi_accounts Columns

**Run this to see all columns:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'fi_accounts'
ORDER BY ordinal_position;
```

**✅ Expected Columns:**
- `id`, `user_id`, `fi_type`, `masked_acc_no`, `provider_name`
- `account_branch` ← Should exist after migration
- `account_ifsc_code` ← Should exist after migration
- `account_status` ← Should exist after migration

**❌ If `account_branch` doesn't appear:**
→ Column doesn't exist, need to run migration

### 4.2 Check Other Tables

```sql
-- Check fi_account_holders_pii
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fi_account_holders_pii';

-- Check fi_equity_holdings
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fi_equity_holdings';
```

---

## STEP 5: Test API Responses Manually 🌐

### 5.1 Test Deposit Accounts API

**Option A: Using Browser/Postman**
1. Get auth token first (call login API)
2. Call: `POST https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/deposit/user-linked-accounts`
3. Body: `{"uniqueIdentifier": "8956545791"}`
4. Check response - look for fields like:
   - `accountBranch`
   - `accountIfscCode`
   - `holderName`
   - `accountStatus`

**Option B: Using Our Script**
```bash
npm run check:api-fields
```

**✅ Expected:** Should see all 33 fields listed

### 5.2 Compare API vs Database

**Manual Comparison:**

1. **Get API Response:**
   - Run `npm run check:api-fields`
   - Note down fields from "All Fields in API" section

2. **Get Database Columns:**
   - Run SQL from Step 4.1
   - Note down column names

3. **Compare:**
   - API has: `accountBranch`
   - DB has: `account_branch`? (Check if exists)
   - If DB doesn't have → Missing column!

---

## STEP 6: Run Automated Checks 🤖

### 6.1 Check Data Quality

```bash
npm run check:data-quality
```

**✅ Expected Output:**
- Summary statistics (record counts)
- Empty fields report (which fields are NULL)
- Missing data points report (API has but not stored)

**Check for:**
- [ ] No errors in output
- [ ] All tables show record counts
- [ ] Empty fields report shows what's NULL
- [ ] Missing data points report shows what API has

### 6.2 Check API Fields

```bash
npm run check:api-fields
```

**✅ Expected Output:**
- List of all fields API sends
- Fields not being stored
- Sample values

**Check for:**
- [ ] No API errors
- [ ] Fields are listed
- [ ] Can see what's missing

---

## STEP 7: Test Migration (If Needed) 🔧

### 7.1 Check if Migration is Needed

**Run this query:**

```sql
-- Check if account_branch column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fi_accounts' 
  AND column_name = 'account_branch';
```

**✅ If returns 0 rows:**
→ Column doesn't exist, need migration

**✅ If returns 1 row:**
→ Column exists, migration already run

### 7.2 Run Migration (If Needed)

1. Go to Supabase Dashboard → SQL Editor
2. Click **New Query**
3. Copy entire content of `scripts/migration-add-missing-fields.sql`
4. Paste in editor
5. Click **Run**
6. Wait for "Success" message

**✅ Expected:** "Migration: Missing fields added successfully!"

### 7.3 Verify Migration Worked

**Run this:**

```sql
-- Check if new columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fi_accounts'
  AND column_name IN (
    'account_branch',
    'account_ifsc_code',
    'account_status',
    'account_current_balance'
  );
```

**✅ Expected:** Should return 4 rows (all columns exist)

---

## STEP 8: Test Seed Script 🌱

### 8.1 Run Seed Script

```bash
npm run seed:from-apis
```

**✅ Expected Output:**
- Should see "Seeding..." messages
- Should see "✅ Seeded..." for each table
- Should see missing fields report at end
- **No errors!**

**❌ If Errors:**
- Check error message
- Common issues:
  - Table doesn't exist → Run schema first
  - Column doesn't exist → Run migration first
  - API error → Check credentials

### 8.2 Verify Data Was Stored

**After seed, run:**

```sql
-- Check if new data was added
SELECT 
  COUNT(*) as total,
  COUNT(account_branch) as has_branch,
  COUNT(account_ifsc_code) as has_ifsc
FROM fi_accounts
WHERE fi_type = 'DEPOSIT';
```

**✅ Expected:**
- If migration was run + seed updated:
  - `has_branch` should be > 0
  - `has_ifsc` should be > 0

**❌ If still 0:**
- Migration not run → Run migration
- Seed script not updated → Update seed script

---

## STEP 9: Final Validation ✅

### 9.1 Complete Data Quality Check

```bash
npm run check:data-quality
```

**✅ Expected:**
- All tables have records
- Empty fields percentage should decrease
- Missing data points should decrease

### 9.2 Manual Spot Check

**Pick a few records and verify:**

```sql
-- Get one deposit account with all details
SELECT 
  a.masked_acc_no,
  a.account_branch,
  a.account_ifsc_code,
  a.account_status,
  a.account_current_balance,
  h.name as holder_name,
  h.pan as holder_pan
FROM fi_accounts a
LEFT JOIN fi_account_holders_pii h ON h.account_id = a.id
WHERE a.fi_type = 'DEPOSIT'
LIMIT 1;
```

**✅ Expected:**
- Should see actual values (not all NULL)
- Branch name should be there
- IFSC code should be there
- Holder name should be there

---

## STEP 10: Error Checklist ❌

### Common Errors & Solutions

#### Error 1: "Table does not exist"
**Solution:**
1. Run `supabase-schema-v2.sql` in Supabase SQL Editor
2. Verify tables appear in Table Editor

#### Error 2: "Column does not exist"
**Solution:**
1. Run `migration-add-missing-fields.sql`
2. Verify columns exist (Step 4.1)

#### Error 3: "All fields are NULL"
**Possible Causes:**
- Columns don't exist → Run migration
- Seed script doesn't capture fields → Update seed script
- API doesn't send fields → Check API response

**Solution:**
1. Check if columns exist (Step 4.1)
2. Check if API sends fields (Step 5.1)
3. Update seed script if needed

#### Error 4: "API authentication failed"
**Solution:**
1. Check `.env.local` file exists
2. Verify `FINFACTOR_USER_ID` and `FINFACTOR_PASSWORD`
3. Test API manually

#### Error 5: "Foreign key constraint failed"
**Solution:**
1. Seed in order: Users → FIPs → Accounts
2. Check if parent records exist

---

## 📊 Testing Checklist

Use this checklist to ensure 0 errors:

### Schema & Database
- [ ] All tables exist in Supabase
- [ ] All columns exist (check with SQL)
- [ ] No SQL errors when querying

### Data Population
- [ ] Seed script runs without errors
- [ ] Records are created in tables
- [ ] Record counts match expectations

### Data Quality
- [ ] NULL fields are identified
- [ ] Missing fields are identified
- [ ] API fields are verified

### Migration
- [ ] Migration runs successfully
- [ ] New columns are created
- [ ] No errors in migration

### Final Validation
- [ ] Data quality check passes
- [ ] Sample records have data (not all NULL)
- [ ] All important fields are populated

---

## 🎯 Zero Errors Approach

### Step-by-Step:

1. **Start Fresh** (If needed)
   ```sql
   -- Drop all tables (CAREFUL - deletes data!)
   -- Or just verify schema is correct
   ```

2. **Create Schema** (If not done)
   - Run `supabase-schema-v2.sql`
   - Verify tables exist

3. **Run Migration** (Add missing columns)
   - Run `migration-add-missing-fields.sql`
   - Verify columns exist

4. **Run Seed** (Populate data)
   - Run `npm run seed:from-apis`
   - Check for errors

5. **Validate** (Check everything)
   - Run `npm run check:data-quality`
   - Run `npm run check:api-fields`
   - Manual SQL checks

6. **Fix Issues** (If any)
   - Update seed script if needed
   - Re-run seed
   - Re-validate

7. **Final Check** (Ensure 0 errors)
   - All scripts run without errors
   - All queries return data
   - No NULL fields (or acceptable NULLs)

---

## 🚀 Quick Test Commands

```bash
# 1. Check data quality
npm run check:data-quality

# 2. Check API fields
npm run check:api-fields

# 3. Seed database
npm run seed:from-apis

# 4. Re-check after seed
npm run check:data-quality
```

---

## 📝 Manual SQL Queries for Testing

Save these queries in Supabase SQL Editor for quick testing:

### Query 1: Quick Health Check
```sql
SELECT 
  (SELECT COUNT(*) FROM app_users) as users,
  (SELECT COUNT(*) FROM fips) as fips,
  (SELECT COUNT(*) FROM fi_accounts) as accounts,
  (SELECT COUNT(*) FROM fi_account_holders_pii) as holders;
```

### Query 2: Check Empty Fields
```sql
SELECT 
  'fi_accounts' as table_name,
  COUNT(*) as total,
  COUNT(account_branch) as has_branch,
  COUNT(account_ifsc_code) as has_ifsc
FROM fi_accounts
WHERE fi_type = 'DEPOSIT';
```

### Query 3: Sample Data Check
```sql
SELECT * FROM fi_accounts LIMIT 3;
SELECT * FROM fi_account_holders_pii LIMIT 3;
SELECT * FROM fi_equity_holdings LIMIT 3;
```

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ All scripts run without errors
2. ✅ All tables have data
3. ✅ Important fields are NOT NULL
4. ✅ API fields match database columns
5. ✅ Data quality check shows low NULL percentage
6. ✅ Manual SQL queries return expected data

---

## 🆘 If You Get Errors

1. **Read the error message carefully**
2. **Check which step failed**
3. **Refer to "Error Checklist" above**
4. **Fix the issue**
5. **Re-run the test**

---

## 📞 Quick Reference

| What to Test | How to Test | Expected Result |
|-------------|------------|----------------|
| Tables exist | Supabase Dashboard → Table Editor | See all tables |
| Columns exist | SQL: `SELECT column_name FROM information_schema.columns` | See all columns |
| Data exists | SQL: `SELECT COUNT(*) FROM table_name` | Count > 0 |
| Fields not NULL | SQL: `SELECT COUNT(field) FROM table` | Count = total |
| API sends fields | `npm run check:api-fields` | List of fields |
| Data quality | `npm run check:data-quality` | Low NULL % |

