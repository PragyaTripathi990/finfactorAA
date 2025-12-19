# Finfactor Account Aggregator - Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Features Implemented](#features-implemented)
3. [Architecture](#architecture)
4. [Pages & Routes](#pages--routes)
5. [API Integration](#api-integration)
6. [Database Schema](#database-schema)
7. [Testing Infrastructure](#testing-infrastructure)
8. [Codebase Cleanup](#codebase-cleanup)
9. [Tech Stack](#tech-stack)

---

## 🎯 Project Overview

**Finfactor Account Aggregator** is a comprehensive financial data management platform built on Next.js that integrates with the Finfactor/Finvu WealthScape PFM API. It enables users to:

- View consolidated financial data across multiple asset classes
- Connect and manage bank accounts via Account Aggregator (AA) framework
- View transactions, holdings, and insights for deposits, mutual funds, equities, ETFs, and NPS
- Test database integrations and API connectivity

---

## ✨ Features Implemented

### 1. Main Dashboard (`/`)
A comprehensive financial dashboard with:

| Feature | Description |
|---------|-------------|
| **Portfolio Overview** | Consolidated view of user's financial data across all asset types |
| **Deposits Module** | Linked accounts, user details, statements, downloads, and insights |
| **Mutual Funds** | Holdings list, folio details, statements, insights, and analysis |
| **Equities** | Holdings by broker, demat accounts, combined equity+ETF view |
| **ETF Module** | Linked accounts, insights, and statements |
| **Term Deposits** | Linked accounts, details, and statements |
| **Recurring Deposits** | Linked accounts, details, and statements |
| **NPS** | National Pension Scheme linked accounts |
| **FIPs** | List of all Financial Information Providers |
| **Brokers** | List of supported brokers |
| **Consents** | Account consent management |
| **FI Requests** | Financial Information request tracking |

### 2. Quick Actions (Portfolio Tab)
| Action | Description |
|--------|-------------|
| **Connect Bank** | Initiate web flow to link new bank accounts via AA framework |
| **Delink Account** | Remove a linked bank account |
| **Direct Consent** | Submit consent request using V1 API |

### 3. Test Dashboard (`/test-dashboard`)
A visual testing interface for database operations:

| Button | Function |
|--------|----------|
| **Layer A** | Tests Flow & Control (Users, Consents, Audit Logs) |
| **Layer B** | Tests Canonical Financial Data (Accounts, Transactions) |
| **Layer C** | Tests Financial State (Summaries, Snapshots, Insights) |
| **Full Flow** | Tests complete A→B→C data flow with real Finfactor API |
| **Run All** | Runs all 4 tests sequentially |
| **Cleanup** | Removes all test data from database |

### 4. API Reference (`/api-reference`)
Interactive API documentation with:
- Quick start bash script
- Environment variables reference
- Copy-to-clipboard curl commands
- Sample inputs/outputs for all endpoints
- Organized by category (Deposits, MF, Equity, FIPs, etc.)

### 5. Live API Tester (`/live-tester`)
Real-time API testing interface:
- Input fields for unique identifier, account ID, date range
- Click-to-test buttons for all major API categories
- Visual response display with JSON formatting
- Response time and success/error indicators

### 6. Callback Handler (`/callback`)
OAuth callback page for handling AA redirect responses after consent flow.

---

## 🏗️ Architecture

### Three-Layer Database Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER A: FLOW & CONTROL                       │
├─────────────────────────────────────────────────────────────────┤
│ • TSP Providers (Finfactor)                                      │
│ • AA Gateways (Finvu)                                            │
│ • App Users                                                       │
│ • Consents & Consent Requests                                    │
│ • Auth Tokens                                                     │
│ • API Call Audit Logs                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              LAYER B: CANONICAL FINANCIAL DATA                   │
├─────────────────────────────────────────────────────────────────┤
│ • FI Accounts (all account types)                                │
│ • FI Transactions                                                 │
│ • Account Holders PII                                            │
│ • FIPs (Financial Information Providers)                         │
│ • Brokers                                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            LAYER C: FINANCIAL STATE & HOLDINGS                   │
├─────────────────────────────────────────────────────────────────┤
│ • Deposit Summaries & Insights                                   │
│ • Term Deposit Holdings                                          │
│ • Recurring Deposit Holdings                                     │
│ • Mutual Fund Holdings & Insights                                │
│ • Equity Holdings & Summaries                                    │
│ • ETF Holdings & Insights                                        │
│ • NPS Holdings & Summaries                                       │
│ • User Financial Snapshots (Portfolio Overview)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 Pages & Routes

### Frontend Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Main dashboard with tabs |
| `/test-dashboard` | `app/test-dashboard/page.tsx` | Visual DB testing UI |
| `/api-reference` | `app/api-reference/page.tsx` | API documentation |
| `/live-tester` | `app/live-tester/page.tsx` | Real-time API testing |
| `/callback` | `app/callback/page.tsx` | OAuth callback handler |

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/test/layer-a` | GET | Run Layer A tests |
| `/api/test/layer-a` | DELETE | Cleanup Layer A data |
| `/api/test/layer-b` | GET | Run Layer B tests |
| `/api/test/layer-b` | DELETE | Cleanup Layer B data |
| `/api/test/layer-c` | GET | Run Layer C tests |
| `/api/test/layer-c` | DELETE | Cleanup Layer C data |
| `/api/test/full-flow` | GET | Run complete flow test |
| `/api/test/full-flow` | DELETE | Cleanup full flow data |
| `/api/finfactor-proxy` | POST | Proxy for Finfactor API calls |

---

## 🔌 API Integration

### Finfactor API Service (`lib/finfactor.ts`)

Features:
- **Auto-authentication**: Automatically obtains and caches JWT token
- **Token refresh**: Handles 401/403 responses with automatic re-auth
- **Flexible response parsing**: Handles JSON and plain text responses
- **Error handling**: Comprehensive error messages

### Server Actions (`app/actions.ts`)

40+ server actions for all Finfactor API endpoints:

| Category | Actions |
|----------|---------|
| **User** | `getUserDetails`, `delinkAccount` |
| **Consent** | `initiateConsentPlus`, `submitConsentV1` |
| **Deposits** | `getDepositUserLinkedAccounts`, `getDepositUserDetails`, `getDepositAccountStatement`, `getDepositInsights` |
| **Mutual Funds** | `getMutualFunds`, `getMFUserLinkedAccounts`, `getMFHoldingFolio`, `getMFInsights`, `getMFAnalysis` |
| **Equities** | `getEquitiesUserLinkedAccounts`, `getEquitiesHoldingBroker`, `getEquitiesDematHolding`, `getEquitiesAccountStatement` |
| **ETF** | `getETFUserLinkedAccounts`, `getETFInsights`, `getETFAccountStatement` |
| **Term Deposit** | `getTermDepositLinkedAccounts`, `getTermDepositUserDetails`, `getTermDepositAccountStatement` |
| **Recurring Deposit** | `getRecurringDepositLinkedAccounts`, `getRecurringDepositUserDetails`, `getRecurringDepositAccountStatement` |
| **NPS** | `getNPSLinkedAccounts` |
| **Master Data** | `getFIPs`, `getBrokers`, `getAccountConsents`, `getFIRequestUser`, `getFIRequestAccount` |

---

## 🗄️ Database Schema

### Supabase/PostgreSQL Tables

Located in: `scripts/comprehensive-schema.sql` (1,295 lines)

**Layer A Tables:**
- `tsp_providers` - TSP provider configuration
- `aa_gateways` - AA gateway configuration
- `app_users` - Core user table
- `app_integration_apps` - App credentials
- `tsp_auth_tokens` - Authentication tokens
- `tsp_api_calls` - API audit log
- `aa_consents` - Consent records
- `aa_consent_requests` - Consent request tracking

**Layer B Tables:**
- `fips` - Financial Information Providers
- `brokers` - Broker master data
- `fi_accounts` - All financial accounts
- `fi_transactions` - Transaction history
- `fi_account_holders_pii` - Account holder information

**Layer C Tables:**
- `fi_deposit_summaries` - Deposit account summaries
- `fi_deposit_insights` - Deposit analytics
- `fi_term_deposit_holdings` - Term deposit records
- `fi_recurring_deposit_holdings` - RD records
- `fi_mf_holdings` - Mutual fund holdings
- `fi_mf_insights` - MF analytics
- `fi_equity_summaries` - Equity summaries
- `fi_equity_holdings` - Stock holdings
- `fi_equity_txn_details` - Equity transactions
- `fi_etf_holdings` - ETF holdings
- `fi_etf_insights` - ETF analytics
- `fi_nps_summaries` - NPS summaries
- `fi_nps_holdings` - NPS holdings
- `user_financial_snapshots` - Portfolio snapshots

---

## 🧪 Testing Infrastructure

### 1. Internal Layer Tests (API Routes)

**Layer A Tests (`/api/test/layer-a`):**
- CREATE User
- READ User
- UPDATE User (subscription status)
- CREATE API Log (Audit Trail)
- READ API Logs

**Layer B Tests (`/api/test/layer-b`):**
- FETCH from Finfactor API (real API call)
- CREATE FIP
- CREATE Account
- CREATE Transactions (3 sample transactions)
- READ Accounts
- READ Transactions

**Layer C Tests (`/api/test/layer-c`):**
- CREATE Deposit Summary
- UPDATE Deposit Summary
- CREATE Financial Snapshot
- READ Snapshot History
- CREATE Deposit Insights

**Full Flow Test (`/api/test/full-flow`):**
1. Create User (Layer A)
2. Call Finfactor API (real API)
3. Log API Call (Layer A audit)
4. Store Accounts from API (Layer B)
5. Create Deposit Summaries (Layer C)
6. Create Portfolio Snapshot (Layer C)
7. Verify Data Integrity (all layers)

### 2. Standalone API Test Script

Located in: `scripts/test-all-apis.ts`

Features:
- Tests all 40+ Finfactor API endpoints
- Dynamic accountId extraction
- Detailed success/failure reporting
- Response preview and data counts

Run with:
```bash
npx ts-node --project tsconfig.json scripts/test-all-apis.ts
```

### 3. Database Seeding

Located in: `scripts/seed-production.ts`

Seeds the database with production-ready data from live API responses.

---

## 🧹 Codebase Cleanup

### Files Removed (37 total)

**Root Level (5 files):**
- `api-response-user-account-statement.json` (empty)
- `api-response-user-details.json` (sample data)
- `api-response-user-linked-accounts.json` (sample data)
- `APIS-req-res.json` (12K lines API reference)
- `Roadmap.txt` (single line note)

**Duplicate Component (1 file):**
- `app/components/DepositInsightsDisplayV2.tsx` (never imported)

**Old SQL Schemas (12 files):**
- `supabase-schema.sql`, `supabase-schema-v2.sql`
- `final-schema.sql`, `final-schema-v2.sql`
- `production-schema.sql`, `supervisor-schema.sql`
- `add-unique-constraints.sql`, `fix-all-constraints.sql`
- `fix-permissions.sql`, `migration-add-missing-fields.sql`
- `manual-schema-test.sql`, `QUICK_TEST.sql`

**Old Seed/Test Scripts (12 files):**
- `seed-simple.ts`, `seed-supabase.ts`, `seed-from-apis.ts`, `seed-layered.ts`
- `test-all-apis.ts` (old v1), `test-insights-debug.ts`
- `diagnose-api-structure.ts`, `analyze-schema-gaps.ts`
- `api-to-schema-mapper.ts`, `check-api-fields.ts`
- `check-data-quality.ts`, `check-seed-status.ts`

**Unused MongoDB Schemas (18 files):**
- Entire `schemas/` folder (project uses Supabase, not MongoDB)

**Redundant Route (1 file):**
- `app/api/test/route.ts` (functionality covered by layer routes)

### Final Clean Structure

```
finfactorAA/
├── app/
│   ├── actions.ts                    # 40+ server actions
│   ├── api/
│   │   ├── finfactor-proxy/route.ts  # API proxy
│   │   └── test/
│   │       ├── full-flow/route.ts    # Full flow test
│   │       ├── layer-a/route.ts      # Layer A tests
│   │       ├── layer-b/route.ts      # Layer B tests
│   │       └── layer-c/route.ts      # Layer C tests
│   ├── components/                   # 13 UI components
│   ├── api-reference/page.tsx
│   ├── callback/page.tsx
│   ├── live-tester/page.tsx
│   ├── test-dashboard/page.tsx
│   ├── page.tsx                      # Main dashboard
│   └── [config files]
├── lib/
│   ├── finfactor.ts                  # API service
│   ├── formatters.ts                 # Data formatters
│   └── supabase-server.ts            # DB operations
├── scripts/
│   ├── comprehensive-schema.sql      # Database schema
│   ├── seed-production.ts            # Seeder
│   └── test-all-apis.ts              # API test script
├── utils/supabase/                   # Supabase client utils
├── DEPOSIT_APIS_QUICK_REFERENCE.md
├── DEPOSIT_APIS_TABLE_MAPPING.md
├── CHANGELOG.md                      # This file
└── [config files]
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Database** | Supabase (PostgreSQL) |
| **Notifications** | React Hot Toast |
| **API Integration** | Finfactor/Finvu WealthScape PFM API |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Finfactor credentials

# Run development server
npm run dev

# Run database tests
curl http://localhost:3000/api/test/full-flow | jq

# Run API tests
npx ts-node --project tsconfig.json scripts/test-all-apis.ts
```

---

## 📝 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Finfactor
FINFACTOR_BASE_URL=https://dhanaprayoga.fiu.finfactor.in
FINFACTOR_USER_ID=pfm@dhanaprayoga
FINFACTOR_PASSWORD=7777
```

---

*Last Updated: December 19, 2025*

