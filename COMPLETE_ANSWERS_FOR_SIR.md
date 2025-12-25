# Complete Answers to All Questions

## ✅ Question 1: Will Data Be Stored in All Tables?

**YES!** ✅ When you start populating data using `ingestCompleteData()`:

### Layer A (Raw JSON - Stored First)
- ✅ **`aa_fetch_payloads.raw_payload`** - Complete JSON stored here
- ✅ **`aa_data_fetch_runs`** - Fetch metadata

### Layer B (Canonical Data - Extracted from Layer A)
- ✅ **`fi_accounts`** - Accounts extracted from `raw_payload`
- ✅ **`fi_transactions`** - Transactions extracted from `raw_payload`
- ✅ **`fi_account_holders_pii`** - Holders extracted (PAN stored here, not in app_users)
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

### Exact Flow:
```
1. Layer A: Raw JSON → aa_fetch_payloads.raw_payload
   (Complete API response stored unchanged)
   
2. Layer B: Functions extract from Layer A
   - parseAndStoreLayerB() reads raw_payload
   - Extracts accounts, transactions, holders
   - Stores in fi_accounts, fi_transactions, fi_account_holders_pii
   
3. Layer C: Queries compute from Layer B
   - computeDepositSummaries() queries fi_accounts + fi_transactions
   - Computes summaries and stores in fi_deposit_summaries
   - Computes holdings and stores in holdings tables
```

**Exactly as you described!** ✅

---

## ✅ Question 3: Which Table Stores Financial Data from AA?

**When data is fetched from AA, it is stored in:**

### Primary Storage (Layer A):
- **`aa_fetch_payloads.raw_payload`** (JSONB) - **COMPLETE UNCHANGED JSON**
  - This is the single source of truth for raw data
  - Contains everything from AA API response

### Parsed Storage (Layer B):
- **`fi_accounts`** - Account details (parsed from `raw_payload`)
- **`fi_transactions`** - Transaction records (parsed from `raw_payload`)
- **`fi_account_holders_pii`** - Holder information including PAN (parsed from `raw_payload`)

### Computed Storage (Layer C):
- **`fi_deposit_summaries`** - Account balances (computed from Layer B)
- **`fi_mutual_fund_holdings`** - MF holdings (computed)
- All other summaries and holdings (computed)

**Answer:** Financial data is stored in:
1. **`aa_fetch_payloads.raw_payload`** (raw JSON - Layer A)
2. **`fi_accounts`, `fi_transactions`** (parsed data - Layer B)

---

## ✅ Question 4: Difference Between `aa_consent_requests` and `aa_consents`

### `aa_consent_requests` (Request Stage)
- **Purpose:** Tracks the **REQUEST** for consent (before user approves)**
- **When Created:** When you initiate consent flow with AA
- **Contains:**
  - Request details
  - Redirect URLs
  - Consent URL (for user to click and approve)
  - Request status (CREATED, PENDING)
- **Lifecycle:** CREATED → User redirected → PENDING → APPROVED/REJECTED
- **Use Case:** "User wants to link bank account, consent requested"

### `aa_consents` (Approval Stage)
- **Purpose:** Tracks the **ACTUAL CONSENT (after user approves)**
- **When Created:** When user **APPROVES** the consent on FIP website
- **Contains:**
  - Consent handle (used to fetch data from AA)
  - Consent expiry date
  - Fetch count
  - Consent status (ACTIVE, REVOKED, EXPIRED)
- **Lifecycle:** PENDING → ACTIVE → REVOKED/EXPIRED
- **Use Case:** "User approved consent, consent_handle = 'abc123', can now fetch data"

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
- **File:** `COMPLETE_SCHEMA.sql` updated
- **Status:** ✅ Fixed

### 2. ✅ PAN Removed from app_users (PII Compliance)
- **Action:** `pan` field removed from `app_users` table
- **Reason:** PAN is PII and should not be in user table
- **Correct Location:** PAN is stored in `fi_account_holders_pii.pan` (where it belongs)
- **File:** `COMPLETE_SCHEMA.sql` updated
- **Status:** Fixed

### 3. ✅ Subscription Fields Removed from app_users
- **Action:** Removed from `app_users`:
  - `subscription_status`
  - `subscription_start_date`
  - `subscription_end_date`
- **Reason:** Subscription data should be in separate table
- **Correct Location:** Use `user_subscriptions` table (already exists in schema)
- **File:** `COMPLETE_SCHEMA.sql` updated
- **Status:** ✅ Fixed

### 4. ✅ consent_id Made Optional
- **Action:** `aa_data_fetch_runs.consent_id` is now nullable (was NOT NULL)
- **Reason:** Allows data fetching scenarios where explicit consent record may not exist
- **File:** `COMPLETE_SCHEMA.sql` updated
- **Status:** ✅ Fixed

---

## 📊 Final Confirmation

### Will All Data Points Be Stored?
**YES!** ✅ All data points will be stored in:
- Layer A: `aa_fetch_payloads.raw_payload`
- Layer B: `fi_accounts`, `fi_transactions`, `fi_account_holders_pii`
- Layer C: All summaries and holdings tables

### Is Data Flow Correct?
**YES!** ✅ Exactly as you described:
- Layer A stores raw JSON
- Layer B extracts from Layer A
- Layer C computes from Layer B

### Which Table Stores Financial Data?
**Answer:** 
- **Raw:** `aa_fetch_payloads.raw_payload`
- **Parsed:** `fi_accounts`, `fi_transactions`

### Schema Corrections?
**YES!** ✅ All issues fixed:
- ✅ MFC consent requests removed
- ✅ PAN removed from app_users
- ✅ Subscription fields removed from app_users
- ✅ consent_id made optional

---

## ✅ Schema is Now Correct and Ready!

**File:** `COMPLETE_SCHEMA.sql` - Ready to deploy to Supabase

**All questions answered!** 🎉

