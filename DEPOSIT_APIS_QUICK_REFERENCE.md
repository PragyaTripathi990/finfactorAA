# Deposit APIs - Quick Reference Table

## 📋 Summary: Where Each API Response is Stored

| API Endpoint | Response Fields | Table Names | Notes |
|--------------|----------------|-------------|-------|
| **`/pfm/api/v2/deposit/user-linked-accounts`** |
| `fipData[].fipId` | `fips` | `fip_code` | FIP registry |
| `fipData[].fipName` | `fips` | `name` | FIP name |
| `fipData[].linkedAccounts[].accountRefNumber` | `fi_accounts` | `account_ref_number` | Primary account ID |
| `fipData[].linkedAccounts[].maskedAccNumber` | `fi_accounts` | `masked_acc_no` | Masked account |
| `fipData[].linkedAccounts[].accountType` | `fi_accounts` | `fip_account_type` | Account type |
| `fipData[].linkedAccounts[].holderName` | `fi_account_holders_pii` | `name` | Holder name |
| `fipData[].linkedAccounts[].holderDob` | `fi_account_holders_pii` | `dob` | Date of birth |
| `fipData[].linkedAccounts[].holderMobile` | `fi_account_holders_pii` | `mobile` | Mobile number |
| `fipData[].linkedAccounts[].holderEmail` | `fi_account_holders_pii` | `email` | Email |
| `fipData[].linkedAccounts[].holderPan` | `fi_account_holders_pii` | `pan` | PAN number |
| `fipData[].linkedAccounts[].accountCurrentBalance` | `fi_deposit_summaries` | `current_balance` | Balance |
| `fipData[].linkedAccounts[].accountBranch` | `fi_deposit_summaries` | `branch` | Branch name |
| `fipData[].linkedAccounts[].accountIfscCode` | `fi_deposit_summaries` | `ifsc` | IFSC code |
| **All other fields** | `aa_fetch_payloads` | `raw_payload` (JSONB) | Complete response |
| **Request + Response** | `aa_fetch_payloads` | `raw_payload` (JSONB) | Full audit trail |
| **Fetch metadata** | `aa_data_fetch_runs` | Various columns | Fetch tracking |
| **`/pfm/api/v2/user-details`** |
| `subscriptionStatus` | `aa_fetch_payloads` | `raw_payload` (JSONB) | Raw JSON only |
| `subscriptionStartDate` | `aa_fetch_payloads` | `raw_payload` (JSONB) | Raw JSON only |
| `subscriptionEndDate` | `aa_fetch_payloads` | `raw_payload` (JSONB) | Raw JSON only |
| `fiDatas.*` | `aa_fetch_payloads` | `raw_payload` (JSONB) | All FI summaries |
| **Complete response** | `aa_fetch_payloads` | `raw_payload` (JSONB) | Full response |
| **Fetch metadata** | `aa_data_fetch_runs` | Various columns | Fetch tracking |
| **`/pfm/api/v2/deposit/user-account-statement`** |
| `transactions[].txnId` | `fi_transactions` | `txn_id` | Transaction ID |
| `transactions[].type` | `fi_transactions` | `txn_type` | DEBIT/CREDIT |
| `transactions[].mode` | `fi_transactions` | `mode` | UPI/NEFT/IMPS |
| `transactions[].amount` | `fi_transactions` | `amount` | Amount |
| `transactions[].currentBalance` | `fi_transactions` | `balance` | Balance after txn |
| `transactions[].transactionTimestamp` | `fi_transactions` | `txn_timestamp` | Timestamp |
| `transactions[].valueDate` | `fi_transactions` | `value_date` | Value date |
| `transactions[].narration` | `fi_transactions` | `narration` | Description |
| `transactions[].reference` | `fi_transactions` | `reference` | Reference number |
| `transactions[].category` | `fi_transactions` | `category` | Category |
| `transactions[].subCategory` | `fi_transactions` | `sub_category` | Sub-category |
| **All other fields** | `aa_fetch_payloads` | `raw_payload` (JSONB) | Complete response |
| **Request + Response** | `aa_fetch_payloads` | `raw_payload` (JSONB) | Full audit trail |
| **Fetch metadata** | `aa_data_fetch_runs` | Various columns | Fetch tracking |
| **`/pfm/api/v2/deposit/insights`** |
| `depositInsights.*` | `user_financial_snapshots` | `snapshot` (JSONB) | **Complete insights** |
| **All insights fields** | `user_financial_snapshots` | `snapshot` (JSONB) | Stored as JSONB |
| **Complete response** | `aa_fetch_payloads` | `raw_payload` (JSONB) | Full response |
| **Fetch metadata** | `aa_data_fetch_runs` | Various columns | Fetch tracking |

---

## 📊 Table Summary

### API 1: `/deposit/user-linked-accounts`
**Tables Used:**
1. `fips` - FIP registry
2. `fi_accounts` - Account details
3. `fi_account_holders_pii` - Holder information
4. `fi_deposit_summaries` - Account summary
5. `aa_data_fetch_runs` - Fetch metadata
6. `aa_fetch_payloads` - Raw JSON

### API 2: `/user-details`
**Tables Used:**
1. `aa_data_fetch_runs` - Fetch metadata
2. `aa_fetch_payloads` - Raw JSON only

### API 3: `/deposit/user-account-statement`
**Tables Used:**
1. `fi_transactions` - Transaction details
2. `aa_data_fetch_runs` - Fetch metadata
3. `aa_fetch_payloads` - Raw JSON

### API 4: `/deposit/insights`
**Tables Used:**
1. `user_financial_snapshots` - Insights as JSONB
2. `aa_data_fetch_runs` - Fetch metadata
3. `aa_fetch_payloads` - Raw JSON

---

## 🔑 Key Points

1. **Every API response is stored in `aa_fetch_payloads.raw_payload`** - Complete audit trail
2. **Normalized fields** go to specific tables for easy querying
3. **Insights** are stored as JSONB in `user_financial_snapshots` for flexibility
4. **User details** are stored as raw JSON only (not normalized)
5. **Nothing is lost** - All data is preserved in raw JSON

---

## 📝 Query Examples

### Get all accounts from linked-accounts API:
```sql
SELECT * FROM fi_accounts WHERE fi_type = 'DEPOSIT';
```

### Get all transactions:
```sql
SELECT * FROM fi_transactions ORDER BY txn_timestamp DESC;
```

### Get raw response:
```sql
SELECT raw_payload FROM aa_fetch_payloads 
WHERE fetch_run_id IN (
  SELECT id FROM aa_data_fetch_runs 
  WHERE endpoint = '/pfm/api/v2/deposit/user-linked-accounts'
);
```

### Get insights:
```sql
SELECT snapshot FROM user_financial_snapshots 
WHERE snapshot_type = 'DEPOSIT_INSIGHTS';
```

