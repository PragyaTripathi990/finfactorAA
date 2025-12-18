# Missing Fields Explanation

## What "Missing Fields" Means

### ✅ Fields in API Response
The API returns data like this:
```json
{
  "fiDataId": "abc123",
  "maskedAccNumber": "XXXX1234",
  "accountBranch": "Mumbai - Andheri",      // ❌ NOT in schema
  "accountIfscCode": "HDFC0001234",        // ❌ NOT in schema
  "accountStatus": "ACTIVE",                // ❌ NOT in schema
  "holderName": "John Doe",                 // ❌ NOT in schema
  "holderPan": "ABCDE1234F",               // ❌ NOT in schema
  "holderDob": "1990-01-01",                // ❌ NOT in schema
  "accountCurrentBalance": 50000.00         // ❌ NOT in schema
}
```

### ❌ Fields in Database Schema
Your `fi_accounts` table only has:
```sql
- id
- user_id
- fi_type
- masked_acc_no          ✅ Stored
- aa_linked_ref          ✅ Stored
- provider_name          ✅ Stored
- account_ref_hash       ✅ Stored
-- Missing: accountBranch, accountIfscCode, accountStatus, etc.
```

### 🔍 What Happens

1. **API Returns**: 20+ fields per account
2. **Schema Has**: Only 8-10 fields
3. **Script Stores**: Only the fields that exist in schema
4. **Result**: 10+ fields are **lost/ignored**

## Example from Your Seed Run

### What API Gave You:
```
Deposit Account: XXXXX1197
- accountBranch: "Mumbai Branch"          ❌ Lost
- accountIfscCode: "HDFC0001234"          ❌ Lost
- accountStatus: "ACTIVE"                ❌ Lost
- holderName: "Test User"                ❌ Lost
- holderPan: "IJFGF4579B"                ❌ Lost
- accountCurrentBalance: 125678.50       ❌ Lost
```

### What Got Stored:
```
✅ masked_acc_no: "XXXXX1197"
✅ provider_name: "HDFC Bank"
✅ aa_linked_ref: "abc123"
```

## The Missing Fields Report

The script detected these fields in API responses that don't exist in your schema:

### 📌 FIPs Table Missing:
- `code` - FIP code/identifier
- `fiTypes` - Array of supported FI types
- `entityLogoUri` - Logo URL
- `otpLength` - OTP length for this FIP

### 📌 Deposit Accounts Missing:
- `accountBranch` - Branch name
- `accountIfscCode` - IFSC code
- `accountStatus` - Account status (ACTIVE/CLOSED)
- `accountCurrentBalance` - Current balance
- `holderName`, `holderPan`, `holderDob` - Account holder info

### 📌 Recurring Deposits Missing:
- `accountInterestRate` - Interest rate
- `accountMaturityDate` - Maturity date
- `accountRecurringAmount` - Monthly deposit amount
- `accountTenureMonths` - Tenure in months

### 📌 Equities Missing:
- `bseSymbol` - BSE stock symbol
- `nseSymbol` - NSE stock symbol
- `marketCapCategory` - Market cap category

## Solution

### Step 1: Add Columns to Schema
Run `migration-add-missing-fields.sql` to add these columns to your tables.

### Step 2: Update Seed Script
Modify the seed script to store these new fields:
```typescript
const accountRecord = {
  // ... existing fields ...
  account_branch: account.accountBranch,           // ✅ Now stored
  account_ifsc_code: account.accountIfscCode,     // ✅ Now stored
  account_status: account.accountStatus,          // ✅ Now stored
  account_current_balance: account.accountCurrentBalance, // ✅ Now stored
};
```

### Step 3: Store Holder Info
```typescript
// Create holder record
const holderRecord = {
  account_id: accountData.id,
  name: account.holderName,        // ✅ Now stored
  pan: account.holderPan,          // ✅ Now stored
  dob: account.holderDob,          // ✅ Now stored
  mobile: account.holderMobile,    // ✅ Now stored
};
```

## Impact

### Before Migration:
- ❌ Can't query accounts by branch
- ❌ Can't filter by account status
- ❌ Can't show account holder names
- ❌ Can't display current balances
- ❌ Can't show RD interest rates

### After Migration:
- ✅ Can query: "Show all ACTIVE accounts"
- ✅ Can filter: "Accounts in Mumbai branch"
- ✅ Can display: Account holder name, PAN
- ✅ Can show: Current balance, interest rates
- ✅ Can search: By IFSC code

## Summary

**"Missing Fields" = Fields in API but NOT in Database Schema**

The migration file adds these columns so you can store all the data the API provides!

