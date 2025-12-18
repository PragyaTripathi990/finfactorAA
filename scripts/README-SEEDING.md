# Database Seeding Guide

This guide explains how to populate your Supabase database with real API data and iteratively refine the schema.

## Overview

The seeding process follows this workflow:

1. **Create Schema** → Run the SQL schema in Supabase
2. **Call APIs** → Script calls your real APIs to get data
3. **Transform & Seed** → API responses are transformed to match schema and inserted
4. **Detect Missing Fields** → Script identifies fields in API responses that aren't in schema
5. **Refine Schema** → Add missing fields to schema and repeat

## Files

- `supabase-schema-v2.sql` - The new layered schema design
- `seed-from-apis.ts` - Script that calls APIs and seeds database
- `seed-supabase.ts` - Original seed script with static dummy data

## Step-by-Step Process

### Step 1: Create the Schema

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/supabase-schema-v2.sql`
4. Run the SQL script
5. Verify all tables are created

### Step 2: Run the Seed Script

```bash
npm run seed:from-apis
```

This script will:
- ✅ Create TSP Provider (FINFACTOR) and AA Gateway (FINVU)
- ✅ Create app user for the test unique identifier
- ✅ Call APIs to fetch FIPs, user details, accounts, holdings
- ✅ Transform API responses to match your schema
- ✅ Insert data into Supabase
- ✅ **Detect and report missing fields**

### Step 3: Review Missing Fields Report

After running the script, you'll see a report like:

```
📋 MISSING FIELDS REPORT
============================================================

📌 deposit_linked_accounts:
   - fiRequestCountCurrentMonth
   - holderDetails
   - someOtherField

📌 mf_holdings:
   - prevDetails
   - schemeTypes
```

### Step 4: Update Schema

1. Review the missing fields report
2. Identify which fields are important to store
3. Add them to `supabase-schema-v2.sql`:

```sql
ALTER TABLE fi_accounts 
ADD COLUMN fi_request_count_current_month INTEGER;
```

4. Run the ALTER statements in Supabase SQL Editor
5. Re-run the seed script: `npm run seed:from-apis`

### Step 5: Iterate

Repeat steps 2-4 until:
- ✅ All important fields are captured
- ✅ No critical missing fields in the report
- ✅ Data is being stored correctly

## Schema Architecture

The schema follows a **layered architecture**:

### Layer A - Flow & Control
- `tsp_providers` - TSP providers (FINFACTOR)
- `aa_gateways` - AA gateways (FINVU)
- `app_users` - Your app users
- `app_integration_apps` - App credentials
- `tsp_auth_tokens` - Authentication tokens
- `tsp_api_calls` - API call audit log
- `aa_consent_requests` - Consent request flow
- `aa_consents` - Normalized consents
- `aa_data_fetch_runs` - Data fetch tracking
- `aa_fetch_payloads` - Raw API responses

### Layer B - Canonical Financial Data
- `fi_accounts` - All financial accounts (normalized)
- `fi_account_holders_pii` - Account holder PII
- `fi_transactions` - All transactions (normalized)

### Layer C - Financial State & Holdings
- `fi_deposit_summaries` - Deposit account details
- `fi_recurring_deposit_summaries` - RD details
- `fi_term_deposit_summaries` - FD/TD details
- `fi_mutual_fund_summaries` - MF account summaries
- `fi_mutual_fund_holdings` - MF holdings
- `fi_mutual_fund_txn_details` - MF transaction details
- `fi_equity_summaries` - Equity account summaries
- `fi_equity_holdings` - Equity holdings
- `fi_equity_txn_details` - Equity transaction details

## Customization

### Change Test User

Edit `scripts/seed-from-apis.ts`:

```typescript
const uniqueIdentifier = '8956545791'; // Change this
```

### Add More API Endpoints

Add new seed functions following the pattern:

```typescript
async function seedNewDataType(userId: string, uniqueIdentifier: string, fipMap: Record<string, string>, fetchRunId: string) {
  const data = await callAPI('/pfm/api/v2/new-endpoint', {
    uniqueIdentifier: uniqueIdentifier,
  });
  
  // Transform and insert data
  // Detect missing fields
}
```

### Store Raw API Responses

The script automatically stores raw API responses in `aa_fetch_payloads` table for:
- Audit trail
- Debugging
- Re-processing if schema changes

## Troubleshooting

### "Table does not exist"
- Make sure you ran `supabase-schema-v2.sql` first
- Check table names match exactly

### "Missing fields not detected"
- Check that API responses are being logged
- Verify the `detectMissingFields` function is being called
- Review console output for API response structures

### "Foreign key constraint failed"
- Ensure parent records exist (e.g., user_id, fip_id)
- Check the order of seeding functions

## Next Steps

1. ✅ Run the schema SQL
2. ✅ Run the seed script
3. ✅ Review missing fields
4. ✅ Add important missing fields to schema
5. ✅ Re-run seed script
6. ✅ Verify data in Supabase dashboard
7. ✅ Build your application queries on top of this schema

## Notes

- The script uses **upsert** operations to avoid duplicates
- **Account deduplication** uses `account_ref_hash` (SHA256 hash)
- **Transaction deduplication** uses `dedupe_hash`
- All timestamps are stored in UTC
- Raw API responses are stored for audit/debugging

