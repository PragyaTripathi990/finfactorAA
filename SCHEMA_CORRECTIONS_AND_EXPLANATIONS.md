# Schema Corrections & Answers to Questions

## 🔴 Issues Identified & Fixed

### 1. ❌ MFC Consent Requests - NOT REQUIRED
**Action:** Removed `mfc_consent_requests` table from schema

### 2. ❌ PAN in app_users - PII VIOLATION
**Issue:** PAN is PII and should NOT be in `app_users`
**Action:** Removed `pan` field from `app_users`
**Correct Location:** PAN should only be in `fi_account_holders_pii` (where it belongs)

### 3. ❌ Subscription Fields in app_users - WRONG PLACE
**Issue:** Subscription data should NOT be in `app_users`
**Action:** Removed `subscription_status`, `subscription_start_date`, `subscription_end_date` from `app_users`
**Correct Location:** Use `user_subscriptions` table (already exists)

### 4. ✅ Difference Between `aa_consent_requests` and `aa_consents`

**`aa_consent_requests`:**
- **Purpose:** Tracks the REQUEST for consent (before user approves)
- **Lifecycle:** Created when you initiate consent flow
- **Status:** CREATED → PENDING → APPROVED/REJECTED
- **Contains:** Request details, redirect URLs, consent URL
- **When:** Created BEFORE user approves consent

**`aa_consents`:**
- **Purpose:** Tracks the ACTUAL consent (after user approves)
- **Lifecycle:** Created when user APPROVES the consent
- **Status:** PENDING → ACTIVE → REVOKED/EXPIRED
- **Contains:** Consent handle, expiry, fetch count
- **When:** Created AFTER user approves consent

**Flow:**
```
1. Create aa_consent_requests → User redirected to FIP
2. User approves → Create aa_consents (with consent_handle)
3. Use aa_consents.consent_handle to fetch data
```

### 5. ✅ Which Table Stores Financial Data from AA?

**When data is fetched from AA, it goes to:**

**Layer A (Raw Storage):**
- `aa_fetch_payloads.raw_payload` (JSONB) - **COMPLETE UNCHANGED JSON**

**Layer B (Canonical Data - Parsed from raw_payload):**
- `fi_accounts` - Account details
- `fi_transactions` - Transaction records
- `fi_account_holders_pii` - Holder information (includes PAN)
- `fips` - FIP registry

**Layer C (Computed from Layer B):**
- `fi_deposit_summaries` - Account balances
- `fi_mutual_fund_holdings` - MF holdings
- `fi_equity_holdings` - Equity holdings
- etc.

---

## 📊 Data Flow Confirmation

### Your Understanding is CORRECT! ✅

**Layer A → Layer B → Layer C**

1. **Layer A:** Raw JSON stored in `aa_fetch_payloads.raw_payload`
2. **Layer B:** Functions extract data from Layer A and store in canonical tables
3. **Layer C:** Queries compute summaries/holdings from Layer B

---

## ✅ Will Data Be Stored?

**YES!** If you use the `ingestCompleteData()` function, data will be stored in:

1. ✅ **Layer A:** `aa_fetch_payloads.raw_payload` (complete JSON)
2. ✅ **Layer B:** `fi_accounts`, `fi_transactions`, `fi_account_holders_pii` (parsed data)
3. ✅ **Layer C:** `fi_deposit_summaries`, holdings, etc. (computed data)

**All data points will be stored!**

---

## 🔧 Schema Corrections Applied

I'll create a corrected schema file next.

