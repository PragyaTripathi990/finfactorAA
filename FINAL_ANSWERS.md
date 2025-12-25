# Final Answers to All Questions

## ✅ Direct Answers

### Q1: Will data be stored in all tables if I start populating?
**A: YES!** ✅

When you use `ingestCompleteData()` function, data flows like this:

**Layer A (Raw):**
- ✅ `aa_fetch_payloads.raw_payload` - Complete JSON stored

**Layer B (Parsed):**
- ✅ `fi_accounts` - Accounts extracted from raw_payload
- ✅ `fi_transactions` - Transactions extracted from raw_payload
- ✅ `fi_account_holders_pii` - Holders extracted (PAN stored here)

**Layer C (Computed):**
- ✅ `fi_deposit_summaries` - Computed from Layer B
- ✅ All holdings tables - Computed from Layer B

**ALL DATA POINTS WILL BE STORED!** ✅

---

### Q2: Is my understanding correct about data flow?
**A: YES!** ✅ Exactly correct!

```
Layer A: Raw JSON → aa_fetch_payloads.raw_payload
    ↓ (Functions extract)
Layer B: Parsed data → fi_accounts, fi_transactions, etc.
    ↓ (Queries compute)
Layer C: Summaries → fi_deposit_summaries, holdings, etc.
```

**Your understanding is 100% correct!** ✅

---

### Q3: Which table stores financial data from AA?
**A:** Financial data is stored in:

1. **`aa_fetch_payloads.raw_payload`** (JSONB) - **COMPLETE RAW JSON**
2. **`fi_accounts`** - Account details (parsed from raw_payload)
3. **`fi_transactions`** - Transaction records (parsed from raw_payload)
4. **`fi_account_holders_pii`** - Holder info including PAN (parsed from raw_payload)

**Primary storage:** `aa_fetch_payloads.raw_payload` (Layer A)
**Parsed storage:** `fi_accounts`, `fi_transactions` (Layer B)

---

### Q4: Difference between `aa_consent_requests` and `aa_consents`?

**`aa_consent_requests`:**
- **When:** Created BEFORE user approves
- **Purpose:** Tracks the REQUEST for consent
- **Contains:** Request details, redirect URLs, consent URL
- **Status:** CREATED → PENDING → APPROVED/REJECTED
- **Use:** To initiate consent flow

**`aa_consents`:**
- **When:** Created AFTER user approves
- **Purpose:** Tracks the ACTUAL CONSENT
- **Contains:** Consent handle (used to fetch data), expiry, status
- **Status:** PENDING → ACTIVE → REVOKED/EXPIRED
- **Use:** To fetch financial data from AA

**Flow:**
```
1. Create aa_consent_requests → Get consent_url
2. User approves on FIP website
3. Create aa_consents → Get consent_handle
4. Use consent_handle to fetch data
```

---

### Q5: Schema Corrections Applied

✅ **1. MFC Consent Requests - REMOVED**
- Table `mfc_consent_requests` removed from schema

✅ **2. PAN Removed from app_users**
- `pan` field removed (PII compliance)
- PAN only in `fi_account_holders_pii` (correct location)

✅ **3. Subscription Fields Removed from app_users**
- `subscription_status` removed
- `subscription_start_date` removed
- `subscription_end_date` removed
- Use `user_subscriptions` table instead

✅ **4. consent_id Made Optional**
- `aa_data_fetch_runs.consent_id` is now nullable
- Allows data fetching without explicit consent record

---

## 📊 Data Storage Confirmation

### When You Call API and Store Data:

**Step 1: API Response Arrives**
```javascript
const response = await callAPI('/deposit/user-linked-accounts', {...});
```

**Step 2: Layer A - Raw Storage**
```javascript
// Stored in: aa_fetch_payloads.raw_payload
await storeRawPayload(fetchRunId, response);
```

**Step 3: Layer B - Parse and Store**
```javascript
// Extracted from raw_payload and stored in:
// - fi_accounts
// - fi_transactions  
// - fi_account_holders_pii
await parseAndStoreLayerB(userId, fetchRunId, response);
```

**Step 4: Layer C - Compute and Store**
```javascript
// Computed from Layer B and stored in:
// - fi_deposit_summaries
// - fi_mutual_fund_holdings
// - etc.
await computeAndStoreLayerC(userId, fetchRunId);
```

**ALL TABLES WILL BE FILLED!** ✅

---

## ✅ Final Confirmation

**Q: Will all data points be stored?**
**A: YES!** ✅ All data points will be stored in appropriate tables.

**Q: Is data flow correct?**
**A: YES!** ✅ Layer A → Layer B (extract) → Layer C (compute)

**Q: Which table stores financial data?**
**A:** `aa_fetch_payloads.raw_payload` (raw) + `fi_accounts`, `fi_transactions` (parsed)

**Schema is now correct and ready!** 🎉

