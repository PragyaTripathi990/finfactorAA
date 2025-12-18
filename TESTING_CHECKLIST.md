# 🧪 Manual Testing Checklist - Zero Errors

## Follow These Steps in Order

---

## ✅ STEP 1: Verify Schema Exists (2 minutes)

### Action:
1. Open: https://app.supabase.com
2. Click: **Table Editor** (left sidebar)
3. Look for: `fi_accounts`, `fips`, `app_users` tables

### ✅ Success:
- You see tables listed

### ❌ If Error:
- Tables don't exist → Go to **SQL Editor** → Run `supabase-schema-v2.sql`

---

## ✅ STEP 2: Run Quick SQL Test (1 minute)

### Action:
1. Click: **SQL Editor** → **New Query**
2. Copy this query:

```sql
SELECT 
  'app_users' as table_name, COUNT(*) as count FROM app_users
UNION ALL
SELECT 'fips', COUNT(*) FROM fips
UNION ALL
SELECT 'fi_accounts', COUNT(*) FROM fi_accounts;
```

3. Click: **Run**

### ✅ Success:
- See record counts (not all 0)
- No error messages

### ❌ If Error:
- "Table does not exist" → Run schema SQL first

---

## ✅ STEP 3: Check NULL Fields (2 minutes)

### Action:
1. In SQL Editor, run:

```sql
SELECT 
  COUNT(*) as total,
  COUNT(account_branch) as has_branch,
  COUNT(account_ifsc_code) as has_ifsc
FROM fi_accounts
WHERE fi_type = 'DEPOSIT';
```

### ✅ Success:
- Query runs without error
- Shows counts

### ❌ If Error:
- "Column does not exist" → Need to run migration

### 📊 What to Look For:
- If `has_branch = 0` and `total > 0` → All NULL (need to fix)
- If query errors → Column doesn't exist (need migration)

---

## ✅ STEP 4: Check if Columns Exist (2 minutes)

### Action:
1. Run this query:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fi_accounts'
  AND column_name IN ('account_branch', 'account_ifsc_code', 'account_status');
```

### ✅ Success:
- Returns 3 rows (all columns exist)

### ❌ If Error:
- Returns 0 rows → Columns don't exist → Run migration

---

## ✅ STEP 5: Run Migration (If Needed) (1 minute)

### Action:
1. If Step 4 returned 0 rows:
   - Go to **SQL Editor**
   - Copy entire `scripts/migration-add-missing-fields.sql`
   - Paste and **Run**
   - Wait for "Success"

### ✅ Success:
- "Migration: Missing fields added successfully!"

### ❌ If Error:
- Read error message
- Common: Column already exists → That's OK, skip

---

## ✅ STEP 6: Test Automated Scripts (3 minutes)

### Action 1: Check Data Quality
```bash
npm run check:data-quality
```

### ✅ Success:
- Shows statistics
- Shows empty fields report
- **No errors!**

### Action 2: Check API Fields
```bash
npm run check:api-fields
```

### ✅ Success:
- Shows all fields API sends
- **No errors!**

---

## ✅ STEP 7: Run Seed Script (2 minutes)

### Action:
```bash
npm run seed:from-apis
```

### ✅ Success:
- Shows "✅ Seeded..." messages
- Shows missing fields report
- **No errors!**

### ❌ If Error:
- Check error message
- Common errors:
  - "Table does not exist" → Run schema
  - "Column does not exist" → Run migration
  - "API error" → Check credentials

---

## ✅ STEP 8: Verify Data After Seed (2 minutes)

### Action:
1. Run this SQL:

```sql
SELECT 
  COUNT(*) as total,
  COUNT(account_branch) as has_branch,
  COUNT(account_ifsc_code) as has_ifsc
FROM fi_accounts
WHERE fi_type = 'DEPOSIT';
```

### ✅ Success:
- `has_branch` > 0 (if migration + seed updated)
- `has_ifsc` > 0 (if migration + seed updated)

### ❌ If Still 0:
- Migration not run → Run migration
- Seed script not updated → Need to update seed script

---

## ✅ STEP 9: Final Validation (2 minutes)

### Action:
```bash
npm run check:data-quality
```

### ✅ Success:
- All tables have records
- Empty fields percentage decreased
- **No errors!**

---

## ✅ STEP 10: Manual Spot Check (1 minute)

### Action:
1. In Supabase Dashboard → **Table Editor**
2. Click on `fi_accounts` table
3. Look at a few rows:
   - Check `account_branch` column
   - Check `account_ifsc_code` column
   - Check `account_status` column

### ✅ Success:
- See actual data (not all NULL)
- Or see NULLs (if migration/seed not updated yet)

---

## 🎯 Zero Errors Checklist

Before you finish, verify:

- [ ] All SQL queries run without errors
- [ ] All npm scripts run without errors
- [ ] Tables exist in Supabase
- [ ] Columns exist (after migration)
- [ ] Data exists in tables
- [ ] Seed script completes successfully
- [ ] Data quality check shows results
- [ ] API field check shows results

---

## 🚨 Common Errors & Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| "Table does not exist" | Run `supabase-schema-v2.sql` |
| "Column does not exist" | Run `migration-add-missing-fields.sql` |
| "All fields NULL" | Run migration + update seed script |
| "API authentication failed" | Check `.env.local` file |
| "Foreign key constraint" | Seed in order: Users → FIPs → Accounts |

---

## 📋 Quick Reference Commands

```bash
# Check data quality
npm run check:data-quality

# Check API fields  
npm run check:api-fields

# Seed database
npm run seed:from-apis

# Run all checks
npm run check:data-quality && npm run check:api-fields
```

---

## ✅ Success Criteria

You'll know everything works when:

1. ✅ All SQL queries return results (no errors)
2. ✅ All npm scripts complete (no errors)
3. ✅ Tables have data (counts > 0)
4. ✅ Important fields are populated (not 100% NULL)
5. ✅ No error messages in console
6. ✅ Supabase Dashboard shows data

---

## 🎯 Testing Order (Recommended)

```
1. Verify Schema (Step 1)
   ↓
2. Quick SQL Test (Step 2)
   ↓
3. Check NULL Fields (Step 3)
   ↓
4. Check Columns (Step 4)
   ↓
5. Run Migration if needed (Step 5)
   ↓
6. Test Scripts (Step 6)
   ↓
7. Run Seed (Step 7)
   ↓
8. Verify Data (Step 8)
   ↓
9. Final Check (Step 9)
   ↓
10. Spot Check (Step 10)
```

---

## 💡 Pro Tips

1. **Test incrementally** - Don't skip steps
2. **Fix errors immediately** - Don't proceed with errors
3. **Use SQL Editor** - Quick way to test
4. **Check console output** - Scripts show what's happening
5. **Compare before/after** - Run checks before and after changes

---

## 📞 Need Help?

If you get stuck:
1. Read the error message
2. Check which step failed
3. Refer to "Common Errors" section
4. Re-run the step after fixing

---

**Total Time: ~15-20 minutes for complete manual testing**

