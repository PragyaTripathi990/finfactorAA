# 🔄 WealthScape API - "Golden Loop" Flow Documentation

**Complete Integration Guide for Account Aggregator (AA) Flow**

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [The Golden Loop Summary](#2-the-golden-loop-summary)
3. [STEP 1: Authentication (Login → Get Token)](#3-step-1-authentication-login--get-token)
4. [STEP 2: User Subscription (Register User)](#4-step-2-user-subscription-register-user)
5. [STEP 3: Consent Flow (Get URL → Redirect → User Approves)](#5-step-3-consent-flow-get-url--redirect--user-approves)
6. [STEP 4: Data Fetch (Get Data → Show Dashboard)](#6-step-4-data-fetch-get-data--show-dashboard)
7. [Data Storage Strategy](#7-data-storage-strategy)
8. [Complete Flow Diagram](#8-complete-flow-diagram)
9. [API Reference Quick Guide](#9-api-reference-quick-guide)

---

## 1. Overview

### What is the Golden Loop?

The "Golden Loop" is the core integration flow for fetching a user's financial data via Account Aggregator (AA) infrastructure:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LOGIN     │ --> │   CONSENT   │ --> │    FETCH    │ --> │  DASHBOARD  │
│  Get Token  │     │ User Approves│     │  Get Data   │     │  Show Data  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Key Players

| Entity | Role | Example |
|--------|------|---------|
| **FIU** (Financial Information User) | Your App - consumes data | Handa Uncle / WealthScape |
| **AA** (Account Aggregator) | Consent Manager & Data Router | Finvu |
| **FIP** (Financial Information Provider) | Banks, Brokers, RTAs | SBI, HDFC, CAMS, Zerodha |
| **User** | End customer giving consent | Mobile: 8956545791 |

### Base URL

```
https://dhanaprayoga.fiu.finfactor.in
```

---

## 2. The Golden Loop Summary

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           THE GOLDEN LOOP                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1️⃣ LOGIN                     2️⃣ CONSENT                    3️⃣ FETCH         │
│  ─────────────               ─────────────                ─────────────     │
│  POST /user-login            POST /submit-consent-        POST /*/user-     │
│                              request-plus                 linked-accounts   │
│       │                           │                            │            │
│       ▼                           ▼                            ▼            │
│  ┌─────────┐                ┌─────────────┐              ┌───────────┐      │
│  │  TOKEN  │                │ Redirect URL│              │ FI DATA   │      │
│  │ (JWT)   │                │ for User    │              │ (Holdings,│      │
│  └─────────┘                └─────────────┘              │ Balances) │      │
│       │                           │                      └───────────┘      │
│       │                           ▼                            │            │
│       │                    User approves on                    │            │
│       │                    Finvu portal                        ▼            │
│       │                           │                      ┌───────────┐      │
│       └───────────────────────────┴──────────────────────│ DASHBOARD │      │
│                     Token used for all API calls         └───────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. STEP 1: Authentication (Login → Get Token)

### 🎯 Purpose
Get a JWT Bearer Token to authenticate all subsequent API calls.

### 📡 API Endpoint
```
POST /pfm/api/v2/user-login
```

### 📤 Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "pfm@dhanaprayoga",
  "password": "7777"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | TSP (Technical Service Provider) user ID - provided by Finfactor |
| `password` | String | TSP password - provided by Finfactor |

### 📥 Response

**Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwZm1AZGhhbmFwcmF5b2dhIiwiaWF0IjoxNjM0MDg2..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `token` | String | JWT Bearer token for authentication |

### 💾 What to Store?

```javascript
// Store in-memory (server-side variable)
let authToken = response.token;

// OR in environment/config (more secure)
// NOT in localStorage/cookies (security risk)
```

**Storage Location:** Server-side memory or secure environment variable
**Duration:** Until token expires (typically 24 hours) or 401 error
**Refresh Strategy:** On 401/403 error, clear token and re-authenticate

### ❓ Questions to Ask

1. **What is this token?** → JWT (JSON Web Token) for authenticating your app with Finfactor
2. **Who owns this token?** → Your organization (TSP), not the end user
3. **Is this user-specific?** → No, this is org-level authentication
4. **Where to store?** → Server-side memory, never expose to client

### 🔧 Code Implementation

```typescript
// lib/finfactor.ts
const BASE_URL = 'https://dhanaprayoga.fiu.finfactor.in';
let authToken: string | null = null;

export async function authenticate(): Promise<string> {
  if (authToken) return authToken;  // Return cached token
  
  const response = await fetch(`${BASE_URL}/pfm/api/v2/user-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'pfm@dhanaprayoga',
      password: '7777',
    }),
  });
  
  const data = await response.json();
  authToken = data.token;
  return authToken;
}
```

---

## 4. STEP 2: User Subscription (Register User)

### 🎯 Purpose
Register/update a user in WealthScape system before they can link accounts.

### 📡 API Endpoint
```
POST /pfm/api/v2/user-subscriptions   (Create)
PUT  /pfm/api/v2/user-subscriptions   (Update)
```

### 📤 Request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "uniqueIdentifier": "8956545791",
  "mobileNumber": "8956545791",
  "subscriptionStatus": "YES",
  "subscriptionStart": "2025-01-01",
  "subscriptionEnd": "2026-02-01"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `uniqueIdentifier` | String | Unique user ID (typically mobile number) |
| `mobileNumber` | String | User's mobile number |
| `subscriptionStatus` | Enum | `YES` (active) or `NO` (inactive) |
| `subscriptionStart` | Date | Subscription start date (YYYY-MM-DD) |
| `subscriptionEnd` | Date | Subscription end date (YYYY-MM-DD) |

### 📥 Response

```json
{
  "success": true,
  "message": "Subscription created successfully"
}
```

### 💾 What to Store?

```javascript
// Store in your database (Supabase/MongoDB)
{
  uniqueIdentifier: "8956545791",
  mobileNumber: "8956545791",
  subscriptionStatus: "YES",
  subscriptionStart: "2025-01-01T00:00:00.000Z",
  subscriptionEnd: "2026-02-01T00:00:00.000Z",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### ❓ Questions to Ask

1. **When to create subscription?** → When user signs up for your app
2. **What if user already exists?** → Use PUT to update
3. **Is `uniqueIdentifier` always mobile?** → Yes, in this implementation
4. **What happens after subscription expires?** → User can't fetch new data

---

## 5. STEP 3: Consent Flow (Get URL → Redirect → User Approves)

### 🎯 Purpose
Get user's consent to access their financial data from FIPs (banks, brokers, etc.)

### Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Your App   │     │  Finfactor  │     │   Finvu AA  │     │  User's FIP │
│  (FIU)      │     │  (TSP)      │     │             │     │  (Bank)     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ 1. Request URL    │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │ 2. Return URL     │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ 3. Redirect User ─┼──────────────────>│                   │
       │                   │                   │                   │
       │                   │                   │ 4. User selects   │
       │                   │                   │    bank & approves│
       │                   │                   │───────────────────>│
       │                   │                   │                   │
       │                   │                   │ 5. Bank confirms  │
       │                   │                   │<───────────────────│
       │                   │                   │                   │
       │ 6. Redirect back  │                   │                   │
       │<──────────────────┼───────────────────│                   │
       │  to redirectUrl   │                   │                   │
       │                   │                   │                   │
```

### 📡 API Endpoint
```
POST /pfm/api/v2/submit-consent-request-plus
```

### 📤 Request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "uniqueIdentifier": "8956545791",
  "aaCustId": "8956545791@finvu",
  "templateName": "BANK_STATEMENT_PERIODIC",
  "userSessionId": "session-abc-123",
  "redirectUrl": "https://yourapp.com/callback"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `uniqueIdentifier` | String | User's unique ID (mobile) |
| `aaCustId` | String | AA Customer ID format: `{mobile}@finvu` |
| `templateName` | String | Consent template: `BANK_STATEMENT_PERIODIC`, `BANK_STATEMENT_ONETIME` |
| `userSessionId` | String | Your session ID to track this request |
| `redirectUrl` | String | Where to redirect user after consent |

### 📥 Response

```json
{
  "url": "https://finvu.in/consent?handle=abc123-xyz-789",
  "consentHandle": "abc123-xyz-789"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `url` | String | Redirect user to this URL for consent |
| `consentHandle` | String | Unique handle to track this consent |

### 🔄 User Journey

1. **User clicks "Link Account"** in your app
2. **You call** `/submit-consent-request-plus`
3. **Redirect user** to the `url` returned
4. **User on Finvu portal:**
   - Enters mobile number
   - Receives OTP
   - Selects banks/accounts to link
   - Approves consent
5. **User redirected back** to your `redirectUrl`
6. **Consent is now active** - you can fetch data

### 💾 What to Store?

```javascript
// Store consent request in database
{
  uniqueIdentifier: "8956545791",
  consentHandle: "abc123-xyz-789",
  templateName: "BANK_STATEMENT_PERIODIC",
  status: "PENDING",  // Update to "APPROVED" after callback
  redirectUrl: "https://yourapp.com/callback",
  userSessionId: "session-abc-123",
  createdAt: new Date()
}
```

### ❓ Questions to Ask

1. **What is `aaCustId`?** → AA customer ID format: `{mobile}@{aa_name}` (e.g., `8956545791@finvu`)
2. **What is `templateName`?** → Predefined consent template:
   - `BANK_STATEMENT_PERIODIC` - Recurring access (daily/weekly/monthly refresh)
   - `BANK_STATEMENT_ONETIME` - One-time access
3. **What is `redirectUrl`?** → Your callback URL after consent approval
4. **What if user cancels?** → They're redirected with `status=REJECTED` query param
5. **How long is consent valid?** → Defined in template (typically 1-3 years)

### 🔧 Consent Templates

| Template | Description | Frequency | Data Life |
|----------|-------------|-----------|-----------|
| `BANK_STATEMENT_PERIODIC` | Recurring bank statement access | MONTHLY | 1 YEAR |
| `BANK_STATEMENT_ONETIME` | One-time bank statement access | ONETIME | 1 DAY |

---

## 6. STEP 4: Data Fetch (Get Data → Show Dashboard)

### 🎯 Purpose
Fetch the user's financial data after consent is approved.

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        DATA FETCH HIERARCHY                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /user-details ─────────────────────────────────────────────────────┐   │
│  (Summary of ALL FI types)                                          │   │
│                                                                      │   │
│  ├── fiDatas.DEPOSIT ────────> /deposit/user-linked-accounts        │   │
│  │                             (List of bank accounts)              │   │
│  │                                                                   │   │
│  ├── fiDatas.TERM_DEPOSIT ───> /term-deposit/user-linked-accounts   │   │
│  │                             (List of FDs)                         │   │
│  │                                                                   │   │
│  ├── fiDatas.RECURRING_DEPOSIT > /recurring-deposit/user-linked-... │   │
│  │                               (List of RDs)                       │   │
│  │                                                                   │   │
│  ├── fiDatas.MUTUAL_FUNDS ───> /mutual-fund/user-linked-accounts    │   │
│  │                             /mutual-fund/.../holding-folio        │   │
│  │                             (MF holdings by ISIN with folios)    │   │
│  │                                                                   │   │
│  ├── fiDatas.EQUITIES ───────> /equities/user-linked-accounts       │   │
│  │                             /equities/.../holding-broker          │   │
│  │                             (Stock holdings by ISIN with brokers)│   │
│  │                                                                   │   │
│  ├── fiDatas.ETF ────────────> /etf/user-linked-accounts            │   │
│  │                             (ETF holdings)                        │   │
│  │                                                                   │   │
│  └── fiDatas.NPS ────────────> /nps/user-linked-accounts            │   │
│                                (NPS accounts)                        │   │
│                                                                      │   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Get User Overview

**Endpoint:** `POST /pfm/api/v2/user-details`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791"
}
```

**Response:**
```json
{
  "subscriptionStatus": "YES",
  "subscriptionStartDate": "2025-11-25T00:00:00.000+00:00",
  "subscriptionEndDate": "2026-11-25T00:00:00.000+00:00",
  "fiDatas": {
    "DEPOSIT": {
      "totalFiData": 17,
      "totalFiDataToBeFetched": 0,
      "lastFetchDate": "2025-08-07T19:35:15.798+00:00",
      "currentBalance": 1218000.00
    },
    "TERM_DEPOSIT": {
      "totalFiData": 1,
      "currentValue": 69300.00
    },
    "RECURRING_DEPOSIT": {
      "totalFiData": 1,
      "currentValue": 64027.42
    },
    "EQUITIES": {
      "totalFiData": 2,
      "currentValue": 526210.20,
      "totalHoldings": 12,
      "totalBrokers": 1
    },
    "MUTUAL_FUNDS": {
      "totalFiData": 3,
      "currentValue": 1834500.81,
      "costValue": 1116560.01,
      "totalHoldings": 11,
      "dataSourceDetails": [
        { "dataResourceType": "AA", "lastFetchDate": "2025-12-10" },
        { "dataResourceType": "MFC", "lastFetchDate": "2025-12-12" }
      ]
    },
    "NPS": {
      "totalFiData": 1,
      "currentValue": 461.00
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `totalFiData` | Number of linked accounts of this type |
| `totalFiDataToBeFetched` | Accounts pending data fetch |
| `lastFetchDate` | When data was last refreshed |
| `currentBalance` | For DEPOSIT - total bank balance |
| `currentValue` | For investments - current market value |
| `costValue` | For MF - original invested amount |
| `totalHoldings` | Number of unique holdings (stocks/MFs) |
| `totalBrokers` | Number of brokers (for equities) |
| `dataSourceDetails` | Where data came from (AA or MFC) |

### 6.2 Get Detailed Holdings

#### Mutual Funds (ISIN-wise with Folios)

**Endpoint:** `POST /pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio`

**Response Structure:**
```json
{
  "totalFiData": 3,
  "currentValue": 1834500.81,
  "costValue": 1116560.01,
  "totalHoldings": 11,
  "holdings": [
    {
      "isin": "INF179K01234",
      "isinDescription": "HDFC Top 100 Fund - Growth",
      "amc": "HDFC Asset Management",
      "schemaTypes": "EQUITY",
      "schemaCategory": "Large Cap",
      "closingUnits": 500.25,
      "nav": 850.50,
      "currentValue": 425378.63,
      "folios": [
        {
          "folioNo": "12345678/90",
          "fipId": "fip@cams",
          "closingUnits": 500.25,
          "currentValue": 425378.63
        }
      ]
    }
  ]
}
```

#### Equities (ISIN-wise with Brokers)

**Endpoint:** `POST /pfm/api/v2/equities/user-linked-accounts/holding-broker`

**Response Structure:**
```json
{
  "totalFiData": 2,
  "currentValue": 526210.20,
  "totalHoldings": 12,
  "holdings": [
    {
      "isin": "INE002A01018",
      "issuerName": "Reliance Industries Ltd",
      "units": 50,
      "lastTradedPrice": 2850.50,
      "avgTradedPrice": 2500.00,
      "currentValue": 142525.00,
      "portfolioWeightagePercent": 27.1,
      "brokers": [
        {
          "brokerName": "Zerodha",
          "brokerId": "ZERODHA",
          "units": 50,
          "currentValue": 142525.00
        }
      ]
    }
  ]
}
```

### 💾 What to Store?

```javascript
// User Level
{
  uniqueIdentifier: "8956545791",
  subscriptionStatus: "YES",
  totalPortfolioValue: 3712499.43,  // Sum of all fiDatas
  fiDatas: {
    DEPOSIT: { totalFiData: 17, currentBalance: 1218000.00 },
    // ... other FI types
  },
  lastSyncedAt: new Date()
}

// Account Level (LinkedAccount)
{
  uniqueIdentifier: "8956545791",
  fiDataId: "037f5d5e-495b-484d-84f8-dba76a14d6b1",
  accountType: "DEPOSIT",
  fipId: "fip@sbi",
  fipName: "State Bank of India",
  maskedAccNumber: "XXXX1234",
  dataFetched: true,
  lastFetchDateTime: "2024-12-11T15:56:13.000Z"
}

// Holdings Level (e.g., MutualFundHolding)
{
  uniqueIdentifier: "8956545791",
  isin: "INF179K01234",
  isinDescription: "HDFC Top 100 Fund - Growth",
  closingUnits: 500.25,
  nav: 850.50,
  currentValue: 425378.63,
  folios: [...]
}
```

### ❓ Questions to Ask

1. **What is `fiDataId`?** → Unique ID for each linked account (UUID format)
2. **What is `fipId`?** → Identifier for Financial Information Provider (e.g., `fip@sbi`)
3. **What is `dataSourceDetails`?** → Where data came from:
   - `AA` = Account Aggregator (via consent)
   - `MFC` = MF Central (direct integration)
4. **What is `prevDetails`?** → Previous day's values for daily change calculation
5. **How often should we fetch?** → Based on consent frequency (typically daily)

---

## 7. Data Storage Strategy

### 7.1 Token Storage

| Token Type | Where to Store | Duration |
|------------|---------------|----------|
| TSP Auth Token (JWT) | Server memory (`let authToken`) | Until expires or 401 |

```javascript
// lib/finfactor.ts
let authToken: string | null = null;  // Server-side only!
```

### 7.2 User Data Storage (Supabase/MongoDB)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA MODEL                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  users                                                                  │
│  ├── unique_identifier (PK)                                            │
│  ├── subscription_status                                                │
│  ├── total_portfolio_value                                              │
│  └── fi_datas (JSONB)                                                   │
│                                                                         │
│  linked_accounts                                                        │
│  ├── fi_data_id (PK)                                                    │
│  ├── unique_identifier (FK)                                             │
│  ├── account_type                                                       │
│  ├── fip_id, fip_name                                                   │
│  └── fi_data (JSONB)                                                    │
│                                                                         │
│  mutual_fund_holdings                                                   │
│  ├── unique_identifier + isin (PK)                                      │
│  ├── current_value, cost_value                                          │
│  └── folios (JSONB array)                                               │
│                                                                         │
│  equities_holdings                                                      │
│  ├── unique_identifier + isin (PK)                                      │
│  ├── current_value, units                                               │
│  └── brokers (JSONB array)                                              │
│                                                                         │
│  consents                                                               │
│  ├── consent_handle (PK)                                                │
│  ├── unique_identifier (FK)                                             │
│  └── status, expiry_time                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE GOLDEN LOOP SEQUENCE                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  USER                YOUR APP              FINFACTOR              FINVU AA    │
│   │                     │                     │                      │        │
│   │  1. Opens app       │                     │                      │        │
│   │────────────────────>│                     │                      │        │
│   │                     │                     │                      │        │
│   │                     │  2. Login           │                      │        │
│   │                     │────────────────────>│                      │        │
│   │                     │                     │                      │        │
│   │                     │  3. Token           │                      │        │
│   │                     │<────────────────────│                      │        │
│   │                     │                     │                      │        │
│   │  4. Click "Link     │                     │                      │        │
│   │     Account"        │                     │                      │        │
│   │────────────────────>│                     │                      │        │
│   │                     │                     │                      │        │
│   │                     │  5. Consent Req     │                      │        │
│   │                     │────────────────────>│                      │        │
│   │                     │                     │                      │        │
│   │                     │  6. Consent URL     │                      │        │
│   │                     │<────────────────────│                      │        │
│   │                     │                     │                      │        │
│   │  7. Redirect        │                     │                      │        │
│   │<────────────────────│                     │                      │        │
│   │                     │                     │                      │        │
│   │  8. User on Finvu ──┼─────────────────────┼─────────────────────>│        │
│   │     - Enter mobile  │                     │                      │        │
│   │     - OTP verify    │                     │                      │        │
│   │     - Select banks  │                     │                      │        │
│   │     - Approve       │                     │                      │        │
│   │                     │                     │                      │        │
│   │  9. Redirect back   │                     │                      │        │
│   │────────────────────>│                     │                      │        │
│   │                     │                     │                      │        │
│   │                     │  10. Fetch Data     │                      │        │
│   │                     │────────────────────>│                      │        │
│   │                     │                     │                      │        │
│   │                     │  11. FI Data        │                      │        │
│   │                     │<────────────────────│                      │        │
│   │                     │                     │                      │        │
│   │  12. Show Dashboard │                     │                      │        │
│   │<────────────────────│                     │                      │        │
│   │                     │                     │                      │        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. API Reference Quick Guide

### Authentication

| Action | Endpoint | Method |
|--------|----------|--------|
| Login | `/pfm/api/v2/user-login` | POST |

### User Management

| Action | Endpoint | Method |
|--------|----------|--------|
| Create Subscription | `/pfm/api/v2/user-subscriptions` | POST |
| Update Subscription | `/pfm/api/v2/user-subscriptions` | PUT |
| Get User Details | `/pfm/api/v2/user-details` | POST |

### Consent Management

| Action | Endpoint | Method |
|--------|----------|--------|
| Submit Consent (V1) | `/pfm/api/v1/submit-consent-request` | POST |
| Submit Consent Plus (V2) | `/pfm/api/v2/submit-consent-request-plus` | POST |
| Get Account Consents | `/pfm/api/v2/account-consents-latest` | POST |

### Data Fetch by FI Type

| FI Type | Linked Accounts | Holdings | Transactions | Insights |
|---------|-----------------|----------|--------------|----------|
| Deposit | `/deposit/user-linked-accounts` | - | `/deposit/user-account-statement` | `/deposit/insights` |
| Term Deposit | `/term-deposit/user-linked-accounts` | - | `/term-deposit/user-account-statement` | - |
| Recurring Deposit | `/recurring-deposit/user-linked-accounts` | - | `/recurring-deposit/user-account-statement` | - |
| Mutual Fund | `/mutual-fund/user-linked-accounts` | `/mutual-fund/.../holding-folio` | `/mutual-fund/user-account-statement` | `/mutual-fund/insights` |
| Equities | `/equities/user-linked-accounts` | `/equities/.../holding-broker` | `/equities/user-account-statement` | - |
| ETF | `/etf/user-linked-accounts` | - | `/etf/user-account-statement` | `/etf/insights` |
| NPS | `/nps/user-linked-accounts` | - | - | - |

### Data Refresh

| Action | Endpoint | Method |
|--------|----------|--------|
| Refresh User Data | `/pfm/api/v2/firequest-user` | POST |
| Refresh Account Data | `/pfm/api/v2/firequest-account` | POST |
| Delink Account | `/pfm/api/v2/user-account-delink` | POST |

---

## Summary Checklist

✅ **Step 1: Login** → Get JWT token, store server-side  
✅ **Step 2: Subscribe** → Register user with mobile number  
✅ **Step 3: Consent** → Get URL, redirect user, they approve  
✅ **Step 4: Fetch** → Call APIs to get data, store in database  
✅ **Step 5: Display** → Show dashboard with portfolio overview  

---

**Document Version:** 1.0  
**Created:** December 16, 2025  
**Team:** Handa Uncle  
**Environment:** Sandbox (dhanaprayoga.fiu.finfactor.in)


