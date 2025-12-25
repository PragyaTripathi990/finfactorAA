# Complete Schema Explanation

## 🎯 Overview

This schema is designed for an **Account Aggregator (AA) Platform** that integrates with TSP (Technology Service Provider) to fetch and store financial data from various Financial Information Providers (FIPs).

**Total Tables:** 51  
**Architecture:** 3-Layer Design

---

## 📊 The 3-Layer Architecture

### **Layer A: Flow & Control (21 Tables)**
**Purpose:** Manages workflow, authentication, consent, and stores raw API responses

**Key Tables:**
1. **`tsp_providers`** - TSP configuration (e.g., FINFACTOR)
2. **`aa_gateways`** - AA Gateway configuration (e.g., FINVU)
3. **`app_users`** - User management (NO PII, NO subscription data)
4. **`user_subscriptions`** - Subscription management (separate from users)
5. **`app_integration_apps`** - App credentials for TSP
6. **`tsp_auth_tokens`** - Authentication tokens
7. **`aa_consent_requests`** - Consent requests (before user approves)
8. **`aa_consents`** - Actual consents (after user approves, contains consent_handle)
9. **`aa_data_fetch_runs`** - Tracks each data fetch operation
10. **`aa_fetch_payloads`** - **CRITICAL:** Stores complete raw JSON responses
11. **`tsp_api_calls`** - API call audit log

**What Layer A Does:**
- Manages user authentication with TSP
- Handles consent lifecycle (request → approval → revocation)
- Stores **complete raw JSON** from AA APIs (unchanged)
- Tracks all API calls for audit

---

### **Layer B: Canonical Financial Data (14 Tables)**
**Purpose:** Stores normalized, vendor-agnostic financial facts (single source of truth)

**Key Tables:**
1. **`fips`** - Financial Information Providers registry (banks, RTAs, brokers)
2. **`brokers`** - Stock brokers registry
3. **`fi_accounts`** - All financial accounts (deposits, MF, equity, etc.)
4. **`fi_account_holders_pii`** - Account holder information (includes PAN - PII stored here)
5. **`fi_transactions`** - All transaction records (deposits)
6. **`fi_mf_transactions`** - Mutual fund transactions
7. **`fi_equity_transactions`** - Equity/stock transactions
8. **`fi_etf_transactions`** - ETF transactions

**What Layer B Does:**
- Stores **normalized** financial facts
- **No computed values** - only raw facts
- **Vendor-agnostic** - same structure regardless of FIP
- **Single source of truth** - all financial data comes from here

**Data Source:** Parsed from `aa_fetch_payloads.raw_payload` (Layer A)

---

### **Layer C: Derived Financial State & Holdings (16 Tables)**
**Purpose:** Stores computed summaries, holdings, and insights (rebuildable from Layer B)

**Key Tables:**

**Deposit Summaries:**
1. **`fi_deposit_summaries`** - Account balances, branch, IFSC
2. **`fi_term_deposit_summaries`** - TD principal, maturity, interest
3. **`fi_recurring_deposit_summaries`** - RD details, recurring amount

**Mutual Fund Data:**
4. **`fi_mutual_fund_summaries`** - Total MF value, cost value
5. **`fi_mutual_fund_holdings`** - Individual MF scheme holdings
6. **`fi_mutual_fund_txn_details`** - MF transaction details
7. **`fi_mf_holding_prev_details`** - MF holding history

**Equity Data:**
8. **`fi_equity_summaries`** - Total equity value
9. **`fi_equity_holdings`** - Individual stock holdings
10. **`fi_equity_txn_details`** - Equity transaction details

**ETF Data:**
11. **`fi_etf_holdings`** - ETF holdings

**NPS Data:**
12. **`fi_nps_summaries`** - NPS account summary
13. **`fi_nps_holdings`** - NPS holdings

**Insights:**
14. **`fi_mf_insights`** - MF analytics (XIRR, returns, distributions)
15. **`fi_equity_insights`** - Equity analytics
16. **`fi_etf_insights`** - ETF analytics
17. **`fi_deposit_insights`** - Deposit analytics
18. **`user_financial_snapshots`** - Dashboard snapshots

**What Layer C Does:**
- Stores **computed/derived** values
- **Rebuildable** - can delete and recompute from Layer B
- **Not authoritative** - Layer B is source of truth
- Used for fast UI rendering and analytics

**Data Source:** Computed from Layer B tables via SQL queries

---

## 🔄 Complete Data Flow

### Step-by-Step Flow:

```
1. User initiates data fetch
   ↓
2. Create aa_data_fetch_runs (Layer A)
   ↓
3. Call TSP/AA API
   ↓
4. Store complete response in aa_fetch_payloads.raw_payload (Layer A)
   ↓
5. Parse raw_payload → Extract accounts, transactions, holders
   ↓
6. Store in fi_accounts, fi_transactions, fi_account_holders_pii (Layer B)
   ↓
7. Query Layer B → Compute summaries, holdings
   ↓
8. Store in fi_deposit_summaries, holdings tables (Layer C)
```

---

## 📋 Table Relationships

### Layer A Relationships:
```
app_users
  ├─> user_subscriptions
  ├─> aa_consent_requests
  ├─> aa_consents
  └─> aa_data_fetch_runs
       └─> aa_fetch_payloads (stores raw JSON)
```

### Layer B Relationships:
```
fips
  └─> fi_accounts
       ├─> fi_account_holders_pii (PAN stored here)
       ├─> fi_transactions
       ├─> fi_mf_transactions
       ├─> fi_equity_transactions
       └─> fi_etf_transactions
```

### Layer C Relationships:
```
fi_accounts
  ├─> fi_deposit_summaries
  ├─> fi_term_deposit_summaries
  ├─> fi_recurring_deposit_summaries
  ├─> fi_mutual_fund_summaries
  │    └─> fi_mutual_fund_holdings
  ├─> fi_equity_summaries
  │    └─> fi_equity_holdings
  └─> fi_etf_holdings
```

---

## 🔑 Key Design Principles

### 1. Raw Data Storage (Layer A)
- **Rule:** Complete raw JSON stored in `aa_fetch_payloads.raw_payload`
- **Purpose:** Audit trail, reconstruction, debugging
- **Never modified** - stored exactly as received

### 2. Canonical Data (Layer B)
- **Rule:** Only normalized facts, no computed values
- **Purpose:** Single source of truth
- **Vendor-agnostic** - same structure for all FIPs

### 3. Derived Data (Layer C)
- **Rule:** Computed from Layer B, rebuildable
- **Purpose:** Fast queries, analytics, UI rendering
- **Can be deleted** and recomputed anytime

### 4. PII Handling
- **Rule:** PAN only in `fi_account_holders_pii`
- **Rule:** No PII in `app_users` or insights tables
- **Compliance:** Follows data privacy best practices

---

## 📊 Data Storage by FI Type

### Deposits:
- **Layer A:** `aa_fetch_payloads.raw_payload`
- **Layer B:** `fi_accounts`, `fi_transactions`, `fi_account_holders_pii`
- **Layer C:** `fi_deposit_summaries`

### Mutual Funds:
- **Layer A:** `aa_fetch_payloads.raw_payload`
- **Layer B:** `fi_accounts`, `fi_mf_transactions`
- **Layer C:** `fi_mutual_fund_summaries`, `fi_mutual_fund_holdings`

### Equities:
- **Layer A:** `aa_fetch_payloads.raw_payload`
- **Layer B:** `fi_accounts`, `fi_equity_transactions`
- **Layer C:** `fi_equity_summaries`, `fi_equity_holdings`

### ETFs:
- **Layer A:** `aa_fetch_payloads.raw_payload`
- **Layer B:** `fi_accounts`, `fi_etf_transactions`
- **Layer C:** `fi_etf_holdings`

### NPS:
- **Layer A:** `aa_fetch_payloads.raw_payload`
- **Layer B:** `fi_accounts`
- **Layer C:** `fi_nps_summaries`, `fi_nps_holdings`

---

## ✅ Schema Features

1. **Complete Audit Trail** - All raw responses stored
2. **Normalized Structure** - Clean, queryable data
3. **Rebuildable** - Layer C can be recomputed
4. **PII Compliant** - PAN only in appropriate table
5. **Scalable** - Handles all FI types
6. **Indexed** - Fast queries on all lookup fields

---

## 🎯 Summary

**Layer A:** Workflow, consent, raw JSON storage  
**Layer B:** Normalized financial facts (source of truth)  
**Layer C:** Computed summaries and holdings (for UI/analytics)

**Data Flow:** Layer A → Layer B (extract) → Layer C (compute)

**All data points are stored!** ✅

