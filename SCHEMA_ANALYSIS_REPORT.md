# Schema Gap Analysis Report

**Generated:** 2025-12-18T16:18:47.237Z  
**Test User:** 8956545791

---

## Summary

| Status | Count |
|--------|-------|
| ✅ SUCCESS | 9 |
| ⚠️ EMPTY | 0 |
| ❌ ERROR | 3 |

---

## Detailed Analysis by API

### FIPs List

**Endpoint:** `/pfm/api/v2/fips`  
**Status:** SUCCESS

#### 🟡 Schema Columns NOT Populated by API

- `fip_code`
- `name`
- `type`
- `environment`
- `is_active`
- `product_types`
- `aa_identifier`

---

### Brokers List

**Endpoint:** `/pfm/api/v2/brokers`  
**Status:** SUCCESS

#### 🟡 Schema Columns NOT Populated by API

- `broker_id`
- `name`
- `type`
- `is_active`

---

### Deposit Linked Accounts

**Endpoint:** `/pfm/api/v2/deposit/user-linked-accounts`  
**Status:** SUCCESS

#### 🔴 API Fields NOT in Schema (Need to Add)

| Field | Type |
|-------|------|
| fiDataId | string |
| fi_data_id | unknown |
| dataFetched | boolean |
| data_fetched | unknown |
| lastFetchDateTime | date/timestamp |
| last_fetch_date_time | unknown |
| fiRequestCountOfCurrentMonth | integer |
| fi_request_count_of_current_month | unknown |
| fipId | string |
| fip_id | unknown |
| latestConsentPurposeText | string |
| latest_consent_purpose_text | unknown |
| latestConsentExpiryTime | date/timestamp |
| latest_consent_expiry_time | unknown |
| consentPurposeVersion | string |
| consent_purpose_version | unknown |
| accountType | string |
| account_type | unknown |
| maskedAccNumber | string |
| masked_acc_number | unknown |
| ... | +42 more |

#### 🟡 Schema Columns NOT Populated by API

- `fi_type`
- `fip_account_type`
- `fip_account_sub_type`
- `aa_linked_ref`
- `masked_acc_no`
- `provider_name`
- `version`
- `account_ref_hash`
- `link_ref_number`
- `link_status`
- `consent_id_list`
- `last_seen_at`

#### 🟢 Working Fields (4)

<details><summary>Click to expand</summary>

- `accountRefNumber`
- `account_ref_number`
- `fipName`
- `fip_name`

</details>

---

### Term Deposit Linked Accounts

**Endpoint:** `/pfm/api/v2/term-deposit/user-linked-accounts`  
**Status:** SUCCESS

#### 🔴 API Fields NOT in Schema (Need to Add)

| Field | Type |
|-------|------|
| fiDataId | string |
| fi_data_id | unknown |
| accountType | string |
| account_type | unknown |
| maskedAccNumber | string |
| masked_acc_number | unknown |
| dataFetched | boolean |
| data_fetched | unknown |
| lastFetchDateTime | date/timestamp |
| last_fetch_date_time | unknown |
| fipId | string |
| fip_id | unknown |
| latestConsentPurposeText | string |
| latest_consent_purpose_text | unknown |
| latestConsentExpiryTime | date/timestamp |
| latest_consent_expiry_time | unknown |
| consentPurposeVersion | string |
| consent_purpose_version | unknown |
| holderName | string |
| holder_name | unknown |
| ... | +50 more |

#### 🟡 Schema Columns NOT Populated by API

- `fi_type`
- `fip_account_type`
- `fip_account_sub_type`
- `aa_linked_ref`
- `masked_acc_no`
- `provider_name`
- `version`
- `account_ref_hash`
- `link_ref_number`
- `link_status`
- `consent_id_list`
- `last_seen_at`

#### 🟢 Working Fields (4)

<details><summary>Click to expand</summary>

- `accountRefNumber`
- `account_ref_number`
- `fipName`
- `fip_name`

</details>

---

### Recurring Deposit Linked Accounts

**Endpoint:** `/pfm/api/v2/recurring-deposit/user-linked-accounts`  
**Status:** SUCCESS

#### 🔴 API Fields NOT in Schema (Need to Add)

| Field | Type |
|-------|------|
| fiDataId | string |
| fi_data_id | unknown |
| accountType | string |
| account_type | unknown |
| maskedAccNumber | string |
| masked_acc_number | unknown |
| dataFetched | boolean |
| data_fetched | unknown |
| lastFetchDateTime | date/timestamp |
| last_fetch_date_time | unknown |
| fipId | string |
| fip_id | unknown |
| latestConsentPurposeText | string |
| latest_consent_purpose_text | unknown |
| latestConsentExpiryTime | date/timestamp |
| latest_consent_expiry_time | unknown |
| consentPurposeVersion | string |
| consent_purpose_version | unknown |
| holderName | string |
| holder_name | unknown |
| ... | +54 more |

#### 🟡 Schema Columns NOT Populated by API

- `fi_type`
- `fip_account_type`
- `fip_account_sub_type`
- `aa_linked_ref`
- `masked_acc_no`
- `provider_name`
- `version`
- `account_ref_hash`
- `link_ref_number`
- `link_status`
- `consent_id_list`
- `last_seen_at`

#### 🟢 Working Fields (4)

<details><summary>Click to expand</summary>

- `accountRefNumber`
- `account_ref_number`
- `fipName`
- `fip_name`

</details>

---

### Mutual Fund Linked Accounts

**Endpoint:** `/pfm/api/v2/mutual-fund/user-linked-accounts`  
**Status:** SUCCESS

#### 🔴 API Fields NOT in Schema (Need to Add)

| Field | Type |
|-------|------|
| fiDataId | string |
| fi_data_id | unknown |
| dataFetched | boolean |
| data_fetched | unknown |
| lastFetchDateTime | date/timestamp |
| last_fetch_date_time | unknown |
| fiRequestCountOfCurrentMonth | integer |
| fi_request_count_of_current_month | unknown |
| fipId | string |
| fip_id | unknown |
| latestConsentPurposeText | string |
| latest_consent_purpose_text | unknown |
| latestConsentExpiryTime | date/timestamp |
| latest_consent_expiry_time | unknown |
| consentPurposeVersion | string |
| consent_purpose_version | unknown |
| amc | string |
| accountType | string |
| account_type | unknown |
| maskedAccNumber | string |
| ... | +31 more |

#### 🟡 Schema Columns NOT Populated by API

- `fi_type`
- `fip_account_type`
- `fip_account_sub_type`
- `aa_linked_ref`
- `masked_acc_no`
- `provider_name`
- `version`
- `account_ref_hash`
- `link_ref_number`
- `link_status`
- `consent_id_list`
- `last_seen_at`

#### 🟢 Working Fields (4)

<details><summary>Click to expand</summary>

- `accountRefNumber`
- `account_ref_number`
- `fipName`
- `fip_name`

</details>

---

### Equities Linked Accounts

**Endpoint:** `/pfm/api/v2/equities/user-linked-accounts`  
**Status:** SUCCESS

#### 🔴 API Fields NOT in Schema (Need to Add)

| Field | Type |
|-------|------|
| fiDataId | string |
| fi_data_id | unknown |
| dataFetched | boolean |
| data_fetched | unknown |
| lastFetchDateTime | date/timestamp |
| last_fetch_date_time | unknown |
| fiRequestCountOfCurrentMonth | integer |
| fi_request_count_of_current_month | unknown |
| fipId | string |
| fip_id | unknown |
| latestConsentPurposeText | string |
| latest_consent_purpose_text | unknown |
| latestConsentExpiryTime | date/timestamp |
| latest_consent_expiry_time | unknown |
| consentPurposeVersion | string |
| consent_purpose_version | unknown |
| accountType | string |
| account_type | unknown |
| maskedAccNumber | string |
| masked_acc_number | unknown |
| ... | +32 more |

#### 🟡 Schema Columns NOT Populated by API

- `fi_type`
- `fip_account_type`
- `fip_account_sub_type`
- `aa_linked_ref`
- `masked_acc_no`
- `provider_name`
- `version`
- `account_ref_hash`
- `link_ref_number`
- `link_status`
- `consent_id_list`
- `last_seen_at`

#### 🟢 Working Fields (4)

<details><summary>Click to expand</summary>

- `accountRefNumber`
- `account_ref_number`
- `fipName`
- `fip_name`

</details>

---

### ETF Linked Accounts

**Endpoint:** `/pfm/api/v2/etf/user-linked-accounts`  
**Status:** SUCCESS

#### 🔴 API Fields NOT in Schema (Need to Add)

| Field | Type |
|-------|------|
| fiDataId | string |
| fi_data_id | unknown |
| dataFetched | boolean |
| data_fetched | unknown |
| lastFetchDateTime | date/timestamp |
| last_fetch_date_time | unknown |
| fiRequestCountOfCurrentMonth | integer |
| fi_request_count_of_current_month | unknown |
| fipId | string |
| fip_id | unknown |
| latestConsentPurposeText | string |
| latest_consent_purpose_text | unknown |
| latestConsentExpiryTime | date/timestamp |
| latest_consent_expiry_time | unknown |
| consentPurposeVersion | string |
| consent_purpose_version | unknown |
| accountType | string |
| account_type | unknown |
| maskedAccNumber | string |
| masked_acc_number | unknown |
| ... | +32 more |

#### 🟡 Schema Columns NOT Populated by API

- `fi_type`
- `fip_account_type`
- `fip_account_sub_type`
- `aa_linked_ref`
- `masked_acc_no`
- `provider_name`
- `version`
- `account_ref_hash`
- `link_ref_number`
- `link_status`
- `consent_id_list`
- `last_seen_at`

#### 🟢 Working Fields (4)

<details><summary>Click to expand</summary>

- `accountRefNumber`
- `account_ref_number`
- `fipName`
- `fip_name`

</details>

---

### Mutual Fund Holdings

**Endpoint:** `/pfm/api/v2/mutual-fund/holding-folio`  
**Status:** ERROR

**Error:** API request failed: 500 . {"timestamp":"2025-12-18T16:18:46.237+00:00","status":500,"error":"Internal Server Error","message":"No static resource pfm/api/v2/mutual-fund/holding-folio.","path":"/pfm/api/v2/mutual-fund/holding-folio"}

### Equity Demat Holdings

**Endpoint:** `/pfm/api/v2/equities/demat-holding`  
**Status:** ERROR

**Error:** API request failed: 500 . {"timestamp":"2025-12-18T16:18:46.481+00:00","status":500,"error":"Internal Server Error","message":"No static resource pfm/api/v2/equities/demat-holding.","path":"/pfm/api/v2/equities/demat-holding"}

### Equity Broker Holdings

**Endpoint:** `/pfm/api/v2/equities/holding-broker`  
**Status:** ERROR

**Error:** API request failed: 500 . {"timestamp":"2025-12-18T16:18:46.720+00:00","status":500,"error":"Internal Server Error","message":"No static resource pfm/api/v2/equities/holding-broker.","path":"/pfm/api/v2/equities/holding-broker"}

### Deposit Insights

**Endpoint:** `/pfm/api/v2/deposit/insights`  
**Status:** SUCCESS

#### 🔴 API Fields NOT in Schema (Need to Add)

| Field | Type |
|-------|------|
| accountIds | array |
| account_ids | unknown |
| balance | array |
| from | unknown |
| to | unknown |
| avg | unknown |
| min | unknown |
| max | unknown |
| startOfPeriod | unknown |
| start_of_period | unknown |
| endOfPeriod | unknown |
| end_of_period | unknown |
| valueChange | unknown |
| value_change | unknown |
| percentChange | unknown |
| percent_change | unknown |
| hasFullPeriodData | unknown |
| has_full_period_data | unknown |
| outgoing | array |
| total | unknown |
| ... | +11 more |

#### 🟡 Schema Columns NOT Populated by API

- `snapshot_type`
- `snapshot`
- `generated_at`

---

## Database NULL Column Analysis

These columns exist in the schema but are always NULL in the database:

✅ No always-NULL columns found (or tables are empty).

## Recommendations

### High Priority (Add to Schema)

Consider adding these frequently appearing API fields:

```sql
-- Example ALTER statements
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS data_fetched BOOLEAN;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS data_fetched TEXT;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS last_fetch_date_time TIMESTAMPTZ;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS last_fetch_date_time TEXT;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS fi_request_count_of_current_month NUMERIC;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS fi_request_count_of_current_month TEXT;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS latest_consent_purpose_text TEXT;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS latest_consent_purpose_text TEXT;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS latest_consent_expiry_time TIMESTAMPTZ;
ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS latest_consent_expiry_time TEXT;
```

### Low Priority (Review for Removal)

Schema columns that are never populated might be candidates for removal or indicate missing API integration.

