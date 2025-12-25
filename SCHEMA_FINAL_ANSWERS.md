# Complete Answers to All Questions

## ✅ Question 1: Will Data Be Stored in All Tables?

**YES!** ✅ When you start populating data:

### Layer A (Raw JSON Storage)
- ✅ **`aa_fetch_payloads.raw_payload`** - Complete JSON stored here
- ✅ **`aa_data_fetch_runs`** - Fetch metadata

### Layer B (Canonical Data - Extracted from Layer A)
- ✅ **`fi_accounts`** - Accounts extracted from `raw_payload`
- ✅ **`fi_transactions`** - Transactions extracted from `raw_payload`
- ✅ **`fi_account_holders_pii`** - Holders extracted (PAN stored here)
- ✅ **`fips`** - FIP registry

### Layer C (Computed from Layer B)
- ✅ **`fi_deposit_summaries`** - Computed from `fi_accounts` + `fi_transactions`
- ✅ **`fi_mutual_fund_holdings`** - Computed from accounts
- ✅ **`fi_equity_holdings`** - Computed from accounts
- ✅ All other summaries and holdings

**ALL DATA POINTS WILL BE STORED!** ✅

---

## ✅ Question 2: Data Flow Confirmation

**YES, your understanding is 100% CORRECT!** ✅

### Flow:
```
1. Layer A: Raw JSON → aa_fetch_payloads.raw_payload
   ↓ (Functions extract from raw_payload)
2. Layer B: Parsed data → fi_accounts, fi_transactions, fi_account_holders_pii
   ↓ (Queries compute from Layer B)
3. Layer C: Summaries → fi_deposit_summaries, holdings, etc.
```

**Exactly as you described!** ✅

---

## ✅ Question 3: Which Table Stores Financial Data from AA?

**When data is fetched from AA:**

### Primary Storage (Layer A):
- **`aa_fetch_payloads.raw_payload`** (JSONB) - **COMPLETE UNCHANGED JSON**

### Parsed Storage (Layer B):
- **`fi_accounts`** - Account details (parsed from `raw_payload`)
- **`fi_transactions`** - Transaction records (parsed from `raw_payload`)
- **`fi_account_holders_pii`** - Holder information including PAN (parsed from `raw_payload`)

### Computed Storage (Layer C):
- **`fi_deposit_summaries`** - Account balances (computed from Layer B)
- **`fi_mutual_fund_holdings`** - MF holdings (computed)
- All other summaries and holdings (computed)

**Answer:** Financial data is stored in **`aa_fetch_payloads.raw_payload`** (raw) and **`fi_accounts`, `fi_transactions`** (parsed).

---

## ✅ Question 4: Difference Between `aa_consent_requests` and `aa_consents`

### `aa_consent_requests` (Request Stage)
- **Purpose:** Tracks the **REQUEST** for consent (before user approves)
- **When Created:** When you initiate consent flow with AA
- **Contains:**
  - Request details
  - Redirect URLs
  - Consent URL (for user to click and approve)
  - Request status (CREATED, PENDING)
- **Lifecycle:** CREATED → User redirected → PENDING → APPROVED/REJECTED
- **Example:** "User wants to link bank account, consent requested"

### `aa_consents` (Approval Stage)
- **Purpose:** Tracks the **ACTUAL CONSENT** (after user approves)
- **When Created:** When user **APPROVES** the consent on FIP website
- **Contains:**
  - Consent handle (used to fetch data from AA)
  - Consent expiry date
  - Fetch count
  - Consent status (ACTIVE, REVOKED, EXPIRED)
- **Lifecycle:** PENDING → ACTIVE → REVOKED/EXPIRED
- **Example:** "User approved consent, consent_handle = 'abc123', can now fetch data"

### Complete Flow:
```
1. Create aa_consent_requests → Get consent_url
2. User clicks consent_url → Redirected to FIP website
3. User approves on FIP website → Callback received
4. Create aa_consents → Get consent_handle
5. Use consent_handle to fetch financial data from AA
```

**Key Difference:**
- `aa_consent_requests` = **Request** (before approval, contains consent_url)
- `aa_consents` = **Actual consent** (after approval, contains consent_handle for data fetch)

---

## ✅ Question 5: Schema Corrections Applied

### 1. ✅ MFC Consent Requests - REMOVED
- **Action:** Table `mfc_consent_requests` completely removed from schema
- **Reason:** Not required for this project

### 2. ✅ PAN Removed from app_users (PII Compliance)
- **Action:** `pan` field removed from `app_users` table
- **Reason:** PAN is PII and should not be in user table
- **Correct Location:** PAN is stored in `fi_account_holders_pii.pan` (where it belongs)

### 3. ✅ Subscription Fields Removed from app_users
- **Action:** Removed from `app_users`:
  - `subscription_status`
  - `subscription_start_date`
  - `subscription_end_date`
- **Reason:** Subscription data should be in separate table
- **Correct Location:** Use `user_subscriptions` table (already exists in schema)

### 4. ✅ consent_id Made Optional
- **Action:** `aa_data_fetch_runs.consent_id` is now nullable (was NOT NULL)
- **Reason:** Allows data fetching scenarios where explicit consent record may not exist

---

## 📊 Final Data Storage Confirmation

### When You Call API and Store Data:

**Step 1: API Response Arrives**
```javascript
const response = await callAPI('/deposit/user-linked-accounts', {...});
// Response contains: { totalFiData: 17, fipData: [...], ... }
```

**Step 2: Layer A - Store Raw JSON**
```javascript
// Stored in: aa_fetch_payloads.raw_payload (JSONB)
await storeRawPayload(fetchRunId, response);
// Complete JSON stored unchanged
```

**Step 3: Layer B - Extract and Store**
```javascript
// Functions read raw_payload and extract:
// - Accounts → fi_accounts
// - Transactions → fi_transactions
// - Holders (with PAN) → fi_account_holders_pii
await parseAndStoreLayerB(userId, fetchRunId, response);
```

**Step 4: Layer C - Compute and Store**
```javascript
// Queries compute from Layer B:
// - Deposit summaries → fi_deposit_summaries
// - MF holdings → fi_mutual_fund_holdings
// - Equity holdings → fi_equity_holdings
await computeAndStoreLayerC(userId, fetchRunId);
```

**ALL TABLES WILL BE FILLED!** ✅

---

## ✅ Summary

**Q: Will all data points be stored?**
**A: YES!** ✅ All data points will be stored in appropriate tables.

**Q: Is data flow correct (Layer A → B extract → C compute)?**
**A: YES!** ✅ Exactly as you described.

**Q: Which table stores financial data from AA?**
**A:** `aa_fetch_payloads.raw_payload` (raw) + `fi_accounts`, `fi_transactions` (parsed)

**Q: Schema corrections applied?**
**A: YES!** ✅ All issues fixed:
- MFC consent requests removed
- PAN removed from app_users
- Subscription fields removed from app_users
- consent_id made optional

**Schema is now correct and ready for deployment!** 🎉

