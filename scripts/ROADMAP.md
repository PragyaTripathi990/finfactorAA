# Complete Roadmap: Schema Validation & Data Quality

## 🎯 Your Goal

You want to:
1. ✅ **Check if schema has missing fields** (API has field, but schema doesn't)
2. ✅ **Check what data is NULL** (API doesn't send that field, or we're not storing it)
3. ✅ **Understand what's missing and why**

---

## 📋 The Complete Roadmap

### PHASE 1: Schema Validation ✅ (DONE)
**Goal:** Find fields in API that don't exist in schema

**What we did:**
- ✅ Created seed script that calls APIs
- ✅ Script compares API fields with schema fields
- ✅ Generates "Missing Fields Report"

**Result:**
```
📌 deposit_linked_accounts:
   - accountBranch (API has it, schema doesn't)
   - accountIfscCode (API has it, schema doesn't)
   - holderName (API has it, schema doesn't)
```

**Status:** ✅ COMPLETE - We found missing fields!

---

### PHASE 2: Data Quality Check ✅ (DONE)
**Goal:** Find what's NULL in database

**What we did:**
- ✅ Created `check-data-quality.ts` script
- ✅ Checks all tables for empty/NULL fields
- ✅ Shows percentage of empty fields

**Result:**
```
📌 fi_accounts:
   account_branch: 37/37 empty (100%)  ← All NULL!
   account_ifsc_code: 37/37 empty (100%) ← All NULL!
```

**Status:** ✅ COMPLETE - We found empty fields!

---

### PHASE 3: Root Cause Analysis 🔄 (IN PROGRESS)
**Goal:** Understand WHY fields are NULL

**Two possible reasons:**

#### Reason 1: Schema Missing Column ❌
- API sends: `accountBranch: "Mumbai"`
- Schema has: NO `account_branch` column
- Result: Can't store it → NULL (or column doesn't exist)

#### Reason 2: API Not Sending Field ❌
- Schema has: `account_branch` column
- API sends: NO `accountBranch` field
- Result: Column exists but stays NULL

**What we need to check:**
1. Does column exist in schema? → Check migration
2. Does API send this field? → Check API response
3. Are we storing it? → Check seed script

---

### PHASE 4: Fix Missing Schema Fields 🔄 (NEXT)
**Goal:** Add missing columns to schema

**Action:**
1. Run `migration-add-missing-fields.sql` in Supabase
2. This adds columns like:
   - `account_branch`
   - `account_ifsc_code`
   - `account_status`
   - etc.

**Status:** ⏳ READY - Migration file created, needs to be run

---

### PHASE 5: Update Seed Script 🔄 (NEXT)
**Goal:** Capture and store the new fields

**Action:**
1. Update `seed-from-apis.ts` to:
   - Read `accountBranch` from API
   - Store in `account_branch` column
   - Do same for all missing fields

**Status:** ⏳ PENDING - Need to update script

---

### PHASE 6: Re-seed and Validate ✅ (FINAL)
**Goal:** Verify everything works

**Action:**
1. Re-run: `npm run seed:from-apis`
2. Re-check: `npm run check:data-quality`
3. Verify: Fields are no longer NULL

**Status:** ⏳ PENDING

---

## 🔍 What We're Checking Now

### Check 1: Schema Missing Fields ✅
**Question:** Does schema have all fields that API provides?

**How we check:**
```typescript
// In seed script
detectMissingFields('deposit_accounts', apiData, schemaFields);
// Compares: API fields vs Schema fields
// Result: Fields in API but NOT in schema
```

**Current Status:**
- ✅ Found: accountBranch, accountIfscCode, holderName, etc.
- ✅ Solution: migration-add-missing-fields.sql

---

### Check 2: NULL Data in Database ✅
**Question:** What fields are NULL in the database?

**How we check:**
```typescript
// In check-data-quality.ts
const empty = data.filter(row => row[field] === null).length;
// Counts: How many records have NULL for each field
```

**Current Status:**
- ✅ Found: 100% NULL for account_branch, account_ifsc_code, etc.
- ✅ Reason: Columns don't exist OR API doesn't send OR we're not storing

---

### Check 3: API Not Sending Fields 🔄 (NEW - Need to Add)
**Question:** Does API actually send this field?

**How we'll check:**
1. Call API
2. Log full response
3. Check if field exists in response
4. Compare with what we're storing

**Status:** ⏳ Need to add this check

---

## 📊 Current Analysis

### What We Know:

#### ✅ Schema Missing Fields (API has, Schema doesn't):
```
- accountBranch
- accountIfscCode  
- accountStatus
- holderName
- holderPan
- accountInterestRate (RD)
- bseSymbol (Equities)
- nseSymbol (Equities)
```

#### ✅ Database NULL Fields (100% empty):
```
- account_branch: 37/37 NULL
- account_ifsc_code: 37/37 NULL
- account_status: 37/37 NULL
- bse_symbol: 12/12 NULL
- nse_symbol: 12/12 NULL
```

#### ❓ Unknown: Does API Send These Fields?
**We need to check:**
- Does API actually send `accountBranch`?
- Does API send `holderName`?
- Or are these fields optional/not always present?

---

## 🛣️ Complete Roadmap

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: Schema Validation ✅ DONE                      │
│ - Find fields in API but not in schema                  │
│ - Result: Missing fields report generated              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: Data Quality Check ✅ DONE                     │
│ - Find NULL/empty fields in database                    │
│ - Result: 100% NULL for many fields                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: Root Cause Analysis 🔄 IN PROGRESS             │
│ - Check: Does API send these fields?                    │
│ - Check: Do columns exist in schema?                   │
│ - Check: Are we storing them?                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 4: Fix Schema ⏳ NEXT                              │
│ - Run migration-add-missing-fields.sql                 │
│ - Add missing columns to tables                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 5: Update Seed Script ⏳ NEXT                      │
│ - Update seed script to capture new fields              │
│ - Store API data in new columns                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PHASE 6: Re-seed & Validate ⏳ FINAL                    │
│ - Re-run seed script                                    │
│ - Re-check data quality                                 │
│ - Verify fields are populated                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 What We Need to Add

### New Check: API Field Presence
**Create a script that:**
1. Calls each API endpoint
2. Logs the FULL response structure
3. Marks which fields are:
   - ✅ Always present
   - ⚠️ Sometimes present (optional)
   - ❌ Never present

**This will tell us:**
- If `accountBranch` is in API response → We need to store it
- If `accountBranch` is NOT in API → That's why it's NULL (API doesn't send it)

---

## 📝 Summary

### What We've Done ✅:
1. ✅ Found missing schema fields (API has, schema doesn't)
2. ✅ Found NULL fields in database (100% empty)
3. ✅ Created migration to add missing columns
4. ✅ Created check script to validate data

### What We Need to Do ⏳:
1. ⏳ Check if API actually sends these fields
2. ⏳ Run migration to add columns
3. ⏳ Update seed script to capture fields
4. ⏳ Re-seed and validate

### Your Questions Answered:

**Q: Are we checking if schema has missing fields?**
✅ YES - Phase 1 (DONE)

**Q: Are we checking what data is NULL?**
✅ YES - Phase 2 (DONE)

**Q: Are we checking if API sends these fields?**
⏳ NOT YET - Need to add this check (Phase 3)

---

## 🚀 Next Immediate Steps

1. **Add API Field Presence Check** (New script)
   - Call APIs
   - Log which fields are present
   - Compare with what we're storing

2. **Run Migration** (Add columns)
   - Run `migration-add-missing-fields.sql` in Supabase

3. **Update Seed Script** (Capture fields)
   - Add code to store new fields

4. **Re-seed & Validate** (Final check)
   - Run seed again
   - Check data quality again
   - Verify everything is populated

