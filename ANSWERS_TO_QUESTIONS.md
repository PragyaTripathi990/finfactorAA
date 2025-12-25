# Answers to All Questions

## ✅ Question 1: Will Data Be Stored in All Tables?

**YES!** When you start populating data using `ingestCompleteData()` function:

### Layer A (Raw Storage)
✅ **`aa_fetch_payloads.raw_payload`** - Complete JSON stored here
✅ **`aa_data_fetch_runs`** - Fetch metadata stored here

### Layer B (Canonical Data - Extracted from Layer A)
✅ **`fi_accounts`** - Account details extracted from raw_payload
✅ **`fi_transactions`** - Transactions extracted from raw_payload
✅ **`fi_account_holders_pii`** - Holder info (including PAN) extracted from raw_payload
✅ **`fips`** - FIP registry extracted from raw_payload

### Layer C (Computed from Layer B)
✅ **`fi_deposit_summaries`** - Computed from fi_accounts + fi_transactions
✅ **`fi_mutual_fund_holdings`** - Computed from fi_accounts + MF data
✅ **`fi_equity_holdings`** - Computed from fi_accounts + equity data
✅ All other summaries and holdings - Computed from Layer B

**ALL DATA POINTS WILL BE STORED!** ✅

---

## ✅ Question 2: Data Flow Confirmation

**YES, your understanding is CORRECT!**

### Flow:
```
1. Layer A: Raw JSON stored in aa_fetch_payloads.raw_payload
   ↓
2. Layer B: Functions extract data from Layer A
   - parseAndStoreLayerB() reads raw_payload
   - Extracts accounts, transactions, holders
   - Stores in fi_accounts, fi_transactions, fi_account_holders_pii
   ↓
3. Layer C: Queries compute from Layer B
   - computeDepositSummaries() queries fi_accounts + fi_transactions
   - Computes summaries and stores in fi_deposit_summaries
   - Computes holdings and stores in holdings tables
```

**Exactly as you described!** ✅

---

## ✅ Question 3: Which Table Stores Financial Data from AA?

**When data is fetched from AA, it goes to:**

### Primary Storage (Layer A):
- **`aa_fetch_payloads.raw_payload`** (JSONB) - **COMPLETE UNCHANGED JSON**

### Parsed Storage (Layer B):
- **`fi_accounts`** - Account details
- **`fi_transactions`** - Transaction records  
- **`fi_account_holders_pii`** - Holder information (PAN stored here)
- **`fips`** - FIP registry

### Computed Storage (Layer C):
- **`fi_deposit_summaries`** - Account balances (computed)
- **`fi_mutual_fund_holdings`** - MF holdings (computed)
- **`fi_equity_holdings`** - Equity holdings (computed)
- All other summaries and holdings (computed)

**Answer:** Financial data is stored in **`aa_fetch_payloads.raw_payload`** (raw) and **`fi_accounts`, `fi_transactions`** (parsed).

---

## ✅ Question 4: Difference Between `aa_consent_requests` and `aa_consents`

### `aa_consent_requests` (Request Stage)
- **Purpose:** Tracks the **REQUEST** for consent (before user approves)
- **Created:** When you initiate consent flow with AA
- **Contains:**
  - Request details
  - Redirect URLs
  - Consent URL (for user to approve)
  - Request status (CREATED, PENDING)
- **Lifecycle:** CREATED → User redirected → PENDING → APPROVED/REJECTED
- **Example:** "User wants to link bank account"

### `aa_consents` (Approval Stage)
- **Purpose:** Tracks the **ACTUAL CONSENT** (after user approves)
- **Created:** When user **APPROVES** the consent on FIP website
- **Contains:**
  - Consent handle (used to fetch data)
  - Consent expiry
  - Fetch count
  - Consent status (ACTIVE, REVOKED, EXPIRED)
- **Lifecycle:** PENDING → ACTIVE → REVOKED/EXPIRED
- **Example:** "User approved consent, consent_handle = 'abc123'"

### Flow:
```
1. Create aa_consent_requests → Get consent_url
2. User clicks consent_url → Redirected to FIP
3. User approves → Callback received
4. Create aa_consents → Get consent_handle
5. Use consent_handle to fetch data from AA
```

**Key Difference:**
- `aa_consent_requests` = **Request** (before approval)
- `aa_consents` = **Actual consent** (after approval, used for data fetch)

---

## ✅ Question 5: Schema Corrections Applied

### 1. ✅ MFC Consent Requests - REMOVED
- Table `mfc_consent_requests` has been removed from schema
- Not required for this project

### 2. ✅ PAN Removed from app_users
- `pan` field removed from `app_users` table
- PAN is PII and should only be in `fi_account_holders_pii`
- **Correct Location:** `fi_account_holders_pii.pan`

### 3. ✅ Subscription Fields Removed from app_users
- `subscription_status` removed
- `subscription_start_date` removed
- `subscription_end_date` removed
- **Correct Location:** Use `user_subscriptions` table (already exists)

### 4. ✅ Schema Updated
- All corrections applied to `COMPLETE_SCHEMA.sql`
- Total tables: 51 (was 52, removed mfc_consent_requests)

---

## 📊 Final Confirmation

### Will Data Be Stored?
**YES!** ✅ All data points will be stored in:
- Layer A: `aa_fetch_payloads.raw_payload`
- Layer B: `fi_accounts`, `fi_transactions`, `fi_account_holders_pii`
- Layer C: All summaries and holdings tables

### Data Flow?
**YES!** ✅ Exactly as you described:
- Layer A stores raw JSON
- Layer B extracts from Layer A
- Layer C computes from Layer B

### Which Tables Store Financial Data?
**Answer:**
- **Raw:** `aa_fetch_payloads.raw_payload`
- **Parsed:** `fi_accounts`, `fi_transactions`, `fi_account_holders_pii`
- **Computed:** All Layer C tables

---

## ✅ Schema is Now Correct!

All issues fixed:
- ✅ MFC consent requests removed
- ✅ PAN removed from app_users (PII compliance)
- ✅ Subscription fields removed from app_users
- ✅ Schema ready for deployment

**You can now deploy and start populating data!** 🎉

