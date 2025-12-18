# Manual Testing Guide

## How to Test Data Quality Manually

### Method 1: Using Supabase Dashboard (Easiest)

#### Step 1: Open Supabase Dashboard
1. Go to: https://app.supabase.com
2. Select your project
3. Click on **Table Editor** in the left sidebar

#### Step 2: Check Each Table

**Check `fi_accounts` table:**
```
1. Click on "fi_accounts" table
2. Look at the columns:
   - account_branch - Are these empty/null?
   - account_ifsc_code - Are these empty/null?
   - account_status - Are these empty/null?
   - account_current_balance - Are these empty/null?
3. Count how many rows have empty values
```

**Check `fi_account_holders_pii` table:**
```
1. Click on "fi_account_holders_pii" table
2. Check:
   - name - Are holder names stored?
   - pan - Are PAN numbers stored?
   - dob - Are dates of birth stored?
   - mobile - Are mobile numbers stored?
```

**Check `fi_recurring_deposit_summaries` table:**
```
1. Click on "fi_recurring_deposit_summaries" table
2. Check:
   - interest_rate - Are interest rates stored?
   - maturity_date - Are maturity dates stored?
   - recurring_amount - Are monthly amounts stored?
```

**Check `fi_equity_holdings` table:**
```
1. Click on "fi_equity_holdings" table
2. Check:
   - bse_symbol - Are BSE symbols stored?
   - nse_symbol - Are NSE symbols stored?
   - market_cap_category - Is market cap stored?
```

---

### Method 2: Using SQL Queries in Supabase

#### Step 1: Open SQL Editor
1. In Supabase Dashboard, click **SQL Editor**
2. Click **New Query**

#### Step 2: Run These Queries

**Query 1: Check Empty Fields in fi_accounts**
```sql
SELECT 
  COUNT(*) as total_records,
  COUNT(account_branch) as has_branch,
  COUNT(account_ifsc_code) as has_ifsc,
  COUNT(account_status) as has_status,
  COUNT(account_current_balance) as has_balance,
  COUNT(*) - COUNT(account_branch) as missing_branch,
  COUNT(*) - COUNT(account_ifsc_code) as missing_ifsc,
  COUNT(*) - COUNT(account_status) as missing_status,
  COUNT(*) - COUNT(account_current_balance) as missing_balance
FROM fi_accounts;
```

**Query 2: Check Account Holders Data**
```sql
SELECT 
  COUNT(*) as total_holders,
  COUNT(name) as has_name,
  COUNT(pan) as has_pan,
  COUNT(dob) as has_dob,
  COUNT(mobile) as has_mobile,
  COUNT(*) - COUNT(name) as missing_name,
  COUNT(*) - COUNT(pan) as missing_pan
FROM fi_account_holders_pii;
```

**Query 3: Check RD Details**
```sql
SELECT 
  COUNT(*) as total_rd,
  COUNT(interest_rate) as has_interest_rate,
  COUNT(maturity_date) as has_maturity_date,
  COUNT(recurring_amount) as has_recurring_amount,
  COUNT(*) - COUNT(interest_rate) as missing_interest_rate
FROM fi_recurring_deposit_summaries;
```

**Query 4: Check Equity Symbols**
```sql
SELECT 
  COUNT(*) as total_equities,
  COUNT(bse_symbol) as has_bse,
  COUNT(nse_symbol) as has_nse,
  COUNT(market_cap_category) as has_market_cap,
  COUNT(*) - COUNT(bse_symbol) as missing_bse,
  COUNT(*) - COUNT(nse_symbol) as missing_nse
FROM fi_equity_holdings;
```

**Query 5: Find Accounts with Missing Data**
```sql
SELECT 
  id,
  masked_acc_no,
  provider_name,
  CASE WHEN account_branch IS NULL THEN 'Missing Branch' END as missing_branch,
  CASE WHEN account_ifsc_code IS NULL THEN 'Missing IFSC' END as missing_ifsc,
  CASE WHEN account_status IS NULL THEN 'Missing Status' END as missing_status
FROM fi_accounts
WHERE account_branch IS NULL 
   OR account_ifsc_code IS NULL 
   OR account_status IS NULL
LIMIT 20;
```

**Query 6: Compare API Data vs Database**
```sql
-- Check if we have holder info for accounts
SELECT 
  a.id,
  a.masked_acc_no,
  a.provider_name,
  CASE WHEN h.id IS NULL THEN 'No Holder Info' ELSE 'Has Holder Info' END as holder_status
FROM fi_accounts a
LEFT JOIN fi_account_holders_pii h ON h.account_id = a.id
WHERE a.fi_type = 'DEPOSIT'
LIMIT 20;
```

---

### Method 3: Using the Automated Script

#### Run the Check Script
```bash
npm run check:data-quality
```

This will automatically:
- ✅ Check all tables for empty fields
- ✅ Compare API responses with database
- ✅ Generate comprehensive reports
- ✅ Show statistics

**Output will show:**
```
📊 EMPTY FIELDS REPORT
   - Which fields are empty
   - Percentage of empty values
   - Total vs empty counts

🔍 MISSING DATA POINTS REPORT
   - Fields in API but not stored
   - What needs to be added to schema

📈 SUMMARY STATISTICS
   - Record counts per table
```

---

### Method 4: Compare API Response with Database

#### Step 1: Get API Response
```bash
# In your terminal, you can use curl or check the API response
# Or look at the seed script output
```

#### Step 2: Check Database
```sql
-- In Supabase SQL Editor, run:
SELECT * FROM fi_accounts WHERE fi_type = 'DEPOSIT' LIMIT 1;
```

#### Step 3: Compare
- **API has:** `accountBranch`, `holderName`, `accountIfscCode`
- **Database has:** `masked_acc_no`, `provider_name`
- **Missing:** `accountBranch`, `holderName`, `accountIfscCode`

---

## What to Look For

### ✅ Good Signs:
- All important fields have data
- Holder information is stored
- Account details (branch, IFSC) are present
- Interest rates, maturity dates are stored

### ❌ Red Flags:
- Many NULL/empty fields
- No holder information
- Missing account details
- Missing financial data (balances, rates)

---

## Quick Test Checklist

- [ ] Check `fi_accounts` - Are account details stored?
- [ ] Check `fi_account_holders_pii` - Are holder names/PAN stored?
- [ ] Check `fi_deposit_summaries` - Are balances stored?
- [ ] Check `fi_recurring_deposit_summaries` - Are RD details stored?
- [ ] Check `fi_equity_holdings` - Are symbols stored?
- [ ] Run automated check script
- [ ] Compare with API responses

---

## Example: Testing Deposit Accounts

### 1. Check in Supabase Dashboard:
```
Table: fi_accounts
Filter: fi_type = 'DEPOSIT'
Look for:
- account_branch column - should have branch names
- account_ifsc_code column - should have IFSC codes
- account_status column - should have "ACTIVE" or similar
```

### 2. Check in SQL:
```sql
SELECT 
  masked_acc_no,
  account_branch,
  account_ifsc_code,
  account_status,
  account_current_balance
FROM fi_accounts
WHERE fi_type = 'DEPOSIT'
LIMIT 5;
```

### 3. Expected Result:
```
masked_acc_no | account_branch    | account_ifsc_code | account_status | account_current_balance
XXXXX1197     | Mumbai - Andheri | HDFC0001234      | ACTIVE         | 125678.50
```

### 4. If Empty:
- ❌ Fields are NULL → Need to update seed script
- ❌ Columns don't exist → Need to run migration

---

## Troubleshooting

### "Table doesn't exist"
→ Run `supabase-schema-v2.sql` first

### "All fields are empty"
→ Run `npm run seed:from-apis` to populate data

### "Fields exist but are NULL"
→ Update seed script to capture those fields

### "Columns don't exist"
→ Run `migration-add-missing-fields.sql`

