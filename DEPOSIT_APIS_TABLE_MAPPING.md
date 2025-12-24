# Deposit APIs - Complete Table Mapping

## Overview

This document shows where each field from the 4 Deposit APIs is stored in the database.

---

## API 1: `/pfm/api/v2/deposit/user-linked-accounts`

### Request:
```json
{
  "uniqueIdentifier": "8956545791",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

### Response Structure:
```json
{
  "totalFiData": 17,
  "totalFiDataToBeFetched": 17,
  "currentBalance": 1220030,
  "fipData": [
    {
      "fipId": "dhanagarbank",
      "fipName": "Dhanagar Finvu Bank Ltd.",
      "linkedAccounts": [
        {
          "fiDataId": "...",
          "accountRefNumber": "...",
          "accountType": "SAVINGS",
          "maskedAccNumber": "XXXXX1197",
          "holderName": "...",
          "holderDob": "...",
          "accountCurrentBalance": 74590,
          // ... more fields
        }
      ]
    }
  ]
}
```

### Table Mapping:

| Response Field | Table Name | Column Name | Notes |
|----------------|------------|-------------|-------|
| **TOP LEVEL** |
| `totalFiData` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `totalFiDataToBeFetched` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `currentBalance` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| **FIP LEVEL** |
| `fipData[].fipId` | `fips` | `fip_code` | ✅ Normalized |
| `fipData[].fipName` | `fips` | `name` | ✅ Normalized |
| `fipData[].fipId` | `fi_accounts` | `fip_id_external` | ✅ Reference |
| `fipData[].fipName` | `fi_accounts` | `fip_name` | ✅ Reference |
| `fipData[].fipName` | `fi_accounts` | `provider_name` | ✅ Reference |
| **ACCOUNT LEVEL** |
| `fipData[].linkedAccounts[].accountRefNumber` | `fi_accounts` | `account_ref_number` | ✅ Primary key |
| `fipData[].linkedAccounts[].linkRefNumber` | `fi_accounts` | `link_ref_number` | ✅ If present |
| `fipData[].linkedAccounts[].linkRefNumber` | `fi_accounts` | `aa_linked_ref` | ✅ Alias |
| `fipData[].linkedAccounts[].maskedAccNumber` | `fi_accounts` | `masked_acc_no` | ✅ Normalized |
| `fipData[].linkedAccounts[].accountType` | `fi_accounts` | `fip_account_type` | ✅ Normalized |
| `fipData[].linkedAccounts[].linkStatus` | `fi_accounts` | `link_status` | ✅ Normalized |
| `fipData[].linkedAccounts[].fiDataId` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fipData[].linkedAccounts[].dataFetched` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fipData[].linkedAccounts[].lastFetchDateTime` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fipData[].linkedAccounts[].fiRequestCountOfCurrentMonth` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fipData[].linkedAccounts[].latestConsentPurposeText` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fipData[].linkedAccounts[].latestConsentExpiryTime` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fipData[].linkedAccounts[].consentPurposeVersion` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| **HOLDER LEVEL** |
| `fipData[].linkedAccounts[].holderName` | `fi_account_holders_pii` | `name` | ✅ Normalized |
| `fipData[].linkedAccounts[].holderDob` | `fi_account_holders_pii` | `dob` | ✅ Normalized (DATE) |
| `fipData[].linkedAccounts[].holderMobile` | `fi_account_holders_pii` | `mobile` | ✅ Normalized |
| `fipData[].linkedAccounts[].holderEmail` | `fi_account_holders_pii` | `email` | ✅ Normalized |
| `fipData[].linkedAccounts[].holderPan` | `fi_account_holders_pii` | `pan` | ✅ Normalized |
| `fipData[].linkedAccounts[].holderAddress` | `fi_account_holders_pii` | `address` | ✅ Normalized |
| `fipData[].linkedAccounts[].holderNominee` | `fi_account_holders_pii` | `nominee` | ✅ Normalized |
| `fipData[].linkedAccounts[].holderType` | `fi_account_holders_pii` | `holders_type` | ✅ Normalized |
| `fipData[].linkedAccounts[].holderCkycCompliance` | `fi_account_holders_pii` | `ckyc_registered` | ✅ Normalized (BOOLEAN) |
| `fipData[].linkedAccounts[].holderLandline` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| **SUMMARY LEVEL** |
| `fipData[].linkedAccounts[].accountCurrentBalance` | `fi_deposit_summaries` | `current_balance` | ✅ Normalized (NUMERIC) |
| `fipData[].linkedAccounts[].accountCurrency` | `fi_deposit_summaries` | `currency` | ✅ Normalized |
| `fipData[].linkedAccounts[].accountType` | `fi_deposit_summaries` | `account_type` | ✅ Normalized |
| `fipData[].linkedAccounts[].accountBranch` | `fi_deposit_summaries` | `branch` | ✅ Normalized |
| `fipData[].linkedAccounts[].accountIfscCode` | `fi_deposit_summaries` | `ifsc` | ✅ Normalized |
| `fipData[].linkedAccounts[].accountMicrCode` | `fi_deposit_summaries` | `micr_code` | ✅ Normalized |
| `fipData[].linkedAccounts[].accountOpeningDate` | `fi_deposit_summaries` | `opening_date` | ✅ Normalized (DATE) |
| `fipData[].linkedAccounts[].accountStatus` | `fi_deposit_summaries` | `status` | ✅ Normalized |
| `fipData[].linkedAccounts[].accountCurrentODLimit` | `fi_deposit_summaries` | `available_credit_limit` | ✅ Normalized (NUMERIC) |
| `fipData[].linkedAccounts[].accountDrawingLimit` | `fi_deposit_summaries` | `drawing_limit` | ✅ Normalized (NUMERIC) |
| `fipData[].linkedAccounts[].accountFacility` | `fi_deposit_summaries` | `facility_type` | ✅ Normalized |
| `fipData[].linkedAccounts[].accountExchgeRate` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| **METADATA** |
| Request body | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Full request stored |
| Full response | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ **COMPLETE RESPONSE** |
| Fetch metadata | `aa_data_fetch_runs` | Various columns | ✅ Fetch tracking |

### Summary Tables:
- ✅ `fips` - FIP registry
- ✅ `fi_accounts` - Account details
- ✅ `fi_account_holders_pii` - Holder information
- ✅ `fi_deposit_summaries` - Account summary
- ✅ `aa_data_fetch_runs` - Fetch metadata
- ✅ `aa_fetch_payloads` - **Complete raw response (JSONB)**

---

## API 2: `/pfm/api/v2/user-details`

### Request:
```json
{
  "uniqueIdentifier": "8956545791"
}
```

### Response Structure:
```json
{
  "subscriptionStatus": "YES",
  "subscriptionStartDate": "2025-11-25T00:00:00.000+00:00",
  "subscriptionEndDate": "2026-11-25T00:00:00.000+00:00",
  "fiDatas": {
    "DEPOSIT": {
      "totalFiData": 17,
      "currentBalance": 1220030,
      "lastFetchDate": "2025-12-18T15:45:49.922+00:00"
    },
    "TERM_DEPOSIT": {
      "totalFiData": 1,
      "currentValue": 69300
    },
    "MUTUAL_FUNDS": {
      "totalFiData": 3,
      "currentValue": 1821719.21,
      "costValue": 1116560.01,
      "totalHoldings": 11
    }
    // ... other FI types
  }
}
```

### Table Mapping:

| Response Field | Table Name | Column Name | Notes |
|----------------|------------|-------------|-------|
| **USER LEVEL** |
| `subscriptionStatus` | `app_users` | (not stored directly) | ✅ Can be derived from subscription data |
| `subscriptionStartDate` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `subscriptionEndDate` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| **FI DATA SUMMARY** |
| `fiDatas.DEPOSIT.totalFiData` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fiDatas.DEPOSIT.currentBalance` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fiDatas.DEPOSIT.lastFetchDate` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fiDatas.TERM_DEPOSIT.*` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fiDatas.MUTUAL_FUNDS.*` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| `fiDatas.EQUITIES.*` | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Raw JSON only |
| **METADATA** |
| Request body | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Full request stored |
| Full response | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ **COMPLETE RESPONSE** |
| Fetch metadata | `aa_data_fetch_runs` | Various columns | ✅ Fetch tracking |

### Summary Tables:
- ✅ `aa_data_fetch_runs` - Fetch metadata
- ✅ `aa_fetch_payloads` - **Complete raw response (JSONB)**

**Note:** User details response is primarily stored as raw JSON. The subscription status and FI data summaries are not normalized into separate tables - they're kept in `raw_payload` for flexibility.

---

## API 3: `/pfm/api/v2/deposit/user-account-statement`

### Request:
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "1dcf0e3d-aff3-456a-8581-51cb92b3c320",
  "dateRangeFrom": "2025-01-01",
  "dateRangeTo": "2025-12-31"  // optional
}
```

### Response Structure:
```json
{
  "transactions": [
    {
      "txnId": "TXN123",
      "type": "DEBIT",
      "mode": "UPI",
      "amount": 500.00,
      "currentBalance": 10000.00,
      "transactionTimestamp": "2025-01-15T10:30:00Z",
      "valueDate": "2025-01-15",
      "narration": "UPI payment to merchant",
      "reference": "REF123456",
      "category": "FOOD",
      "subCategory": "RESTAURANT"
    }
  ]
}
```

### Table Mapping:

| Response Field | Table Name | Column Name | Notes |
|----------------|------------|-------------|-------|
| **TRANSACTION LEVEL** |
| `transactions[].txnId` | `fi_transactions` | `txn_id` | ✅ Normalized |
| `transactions[].type` | `fi_transactions` | `txn_type` | ✅ Normalized (DEBIT/CREDIT) |
| `transactions[].mode` | `fi_transactions` | `mode` | ✅ Normalized (UPI/NEFT/IMPS) |
| `transactions[].amount` | `fi_transactions` | `amount` | ✅ Normalized (NUMERIC) |
| `transactions[].currentBalance` | `fi_transactions` | `balance` | ✅ Normalized (NUMERIC) |
| `transactions[].transactionTimestamp` | `fi_transactions` | `txn_timestamp` | ✅ Normalized (TIMESTAMPTZ) |
| `transactions[].valueDate` | `fi_transactions` | `value_date` | ✅ Normalized (DATE) |
| `transactions[].narration` | `fi_transactions` | `narration` | ✅ Normalized (TEXT) |
| `transactions[].reference` | `fi_transactions` | `reference` | ✅ Normalized |
| `transactions[].category` | `fi_transactions` | `category` | ✅ Normalized |
| `transactions[].subCategory` | `fi_transactions` | `sub_category` | ✅ Normalized |
| `transactions[].merchantName` | `fi_transactions` | `merchant_name` | ✅ If present |
| `transactions[].merchantCategory` | `fi_transactions` | `merchant_category` | ✅ If present |
| **METADATA** |
| Request body | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Full request stored |
| Full response | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ **COMPLETE RESPONSE** |
| Fetch metadata | `aa_data_fetch_runs` | Various columns | ✅ Fetch tracking |

### Summary Tables:
- ✅ `fi_transactions` - Transaction details
- ✅ `aa_data_fetch_runs` - Fetch metadata
- ✅ `aa_fetch_payloads` - **Complete raw response (JSONB)**

---

## API 4: `/pfm/api/v2/deposit/insights`

### Request:
```json
{
  "uniqueIdentifier": "8956545791",
  "accountIds": ["1dcf0e3d-aff3-456a-8581-51cb92b3c320"],
  "from": "2025-01-01",
  "to": "2025-12-18",
  "frequency": "MONTHLY"
}
```

### Response Structure:
```json
{
  "depositInsights": {
    "balanceSummary": {
      "openingBalance": 100000,
      "closingBalance": 150000,
      "averageBalance": 125000
    },
    "transactionSummary": {
      "totalDebits": 50000,
      "totalCredits": 100000,
      "transactionCount": 25
    },
    "categoryWiseBreakdown": [
      {
        "category": "FOOD",
        "amount": 10000,
        "percentage": 20
      }
    ],
    "monthlyTrends": [
      {
        "month": "2025-01",
        "balance": 120000,
        "incoming": 50000,
        "outgoing": 30000
      }
    ]
    // ... more insights
  }
}
```

### Table Mapping:

| Response Field | Table Name | Column Name | Notes |
|----------------|------------|-------------|-------|
| **INSIGHTS DATA** |
| `depositInsights.balanceSummary.*` | `user_financial_snapshots` | `snapshot` (JSONB) | ✅ **Complete insights stored as JSONB** |
| `depositInsights.transactionSummary.*` | `user_financial_snapshots` | `snapshot` (JSONB) | ✅ **Complete insights stored as JSONB** |
| `depositInsights.categoryWiseBreakdown.*` | `user_financial_snapshots` | `snapshot` (JSONB) | ✅ **Complete insights stored as JSONB** |
| `depositInsights.monthlyTrends.*` | `user_financial_snapshots` | `snapshot` (JSONB) | ✅ **Complete insights stored as JSONB** |
| **All other insights fields** | `user_financial_snapshots` | `snapshot` (JSONB) | ✅ **Complete insights stored as JSONB** |
| **METADATA** |
| Request body | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ Full request stored |
| Full response | `aa_fetch_payloads` | `raw_payload` (JSONB) | ✅ **COMPLETE RESPONSE** |
| Fetch metadata | `aa_data_fetch_runs` | Various columns | ✅ Fetch tracking |

### Summary Tables:
- ✅ `user_financial_snapshots` - **Complete insights as JSONB** (`snapshot_type = 'DEPOSIT_INSIGHTS'`)
- ✅ `aa_data_fetch_runs` - Fetch metadata
- ✅ `aa_fetch_payloads` - **Complete raw response (JSONB)**

**Note:** Insights are stored as complete JSONB in `user_financial_snapshots.snapshot` for flexibility. This allows storing any insights structure without schema changes.

---

## 📊 QUICK REFERENCE TABLE

| API Endpoint | Primary Tables | Raw Storage |
|--------------|----------------|-------------|
| `/deposit/user-linked-accounts` | `fips`, `fi_accounts`, `fi_account_holders_pii`, `fi_deposit_summaries` | `aa_fetch_payloads.raw_payload` |
| `/user-details` | None (raw only) | `aa_fetch_payloads.raw_payload` |
| `/deposit/user-account-statement` | `fi_transactions` | `aa_fetch_payloads.raw_payload` |
| `/deposit/insights` | `user_financial_snapshots` (JSONB) | `aa_fetch_payloads.raw_payload` |

---

## 🔍 How to Query

### Get Raw Response:
```sql
SELECT raw_payload 
FROM aa_fetch_payloads 
WHERE fetch_run_id = (
  SELECT id FROM aa_data_fetch_runs 
  WHERE endpoint = '/pfm/api/v2/deposit/user-linked-accounts'
  ORDER BY created_at DESC LIMIT 1
);
```

### Get Normalized Data:
```sql
-- Accounts
SELECT * FROM fi_accounts WHERE fi_type = 'DEPOSIT';

-- Transactions
SELECT * FROM fi_transactions ORDER BY txn_timestamp DESC;

-- Insights
SELECT snapshot FROM user_financial_snapshots 
WHERE snapshot_type = 'DEPOSIT_INSIGHTS';
```

---

## ✅ Complete Coverage

**Every API response is stored in TWO places:**
1. **Normalized fields** → Individual tables (for queries)
2. **Complete response** → `aa_fetch_payloads.raw_payload` (for audit/reconstruction)

**Nothing is lost!** You can always get the original response from `raw_payload`.

