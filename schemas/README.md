# WealthScape API MongoDB Schemas

This folder contains Mongoose schemas for the WealthScape API (Finfactor/Finvu) based on the **Official API Documentation**.

## Schema Structure Overview

### Core Schemas

#### `User.js`
- **Purpose**: User profile and subscription management
- **APIs**: `/pfm/api/v2/user-subscriptions`, `/pfm/api/v2/user-details`
- **Key Fields**:
  - `uniqueIdentifier` (mobile number)
  - `subscriptionStatus`, `subscriptionStart`, `subscriptionEnd`
  - `fiDatas` - Object containing FI data summaries per type (DEPOSIT, TERM_DEPOSIT, etc.)
  - `totalPortfolioValue` - Computed from fiDatas

#### `LinkedAccount.js`
- **Purpose**: Base schema for all linked accounts across all FI types
- **APIs**: All `/pfm/api/v2/*/user-linked-accounts` endpoints
- **Key Fields**:
  - `fiDataId` - Unique account identifier
  - `accountType` - DEPOSIT, TERM_DEPOSIT, RECURRING_DEPOSIT, EQUITIES, MUTUAL_FUNDS, NPS, ETF
  - `fipId`, `fipName` - Financial Information Provider
  - `dataFetched`, `lastFetchDateTime` - Data sync status
  - `latestConsentPurposeText`, `latestConsentExpiryTime` - Consent info
  - `fiData` - Raw JSON data from API

---

## Module-Specific Schemas

### Deposit Module (`/pfm/api/v2/deposit/*`)

#### `Deposit.js`
- **DepositAccount**: Extended deposit account details (balance, IFSC, branch)
- **DepositTransaction**: Bank statement transactions
- **DepositInsights**: Spending analytics and categorization

### Term Deposit Module (`/pfm/api/v2/term-deposit/*`)

#### `TermDeposit.js`
- **TermDeposit**: Fixed deposit details (principal, maturity, interest rate)
- **TermDepositTransaction**: TD transaction history

### Recurring Deposit Module (`/pfm/api/v2/recurring-deposit/*`)

#### `RecurringDeposit.js`
- **RecurringDeposit**: RD details (monthly installment, tenure, installments paid)
- **RecurringDepositTransaction**: RD transaction history

### Mutual Fund Module (`/pfm/api/v2/mutual-fund/*`)

#### `MutualFund.js`
- **MutualFundHolding**: ISIN-level aggregated holdings with folios array
  - Stores folios as embedded documents
  - Includes `prevDetails` for daily change tracking
- **MutualFundTransaction**: MF transactions with tax details (STT, stamp duty)
- **MutualFundInsights**: Portfolio analytics (XIRR, distributions by category/AMC/sector)
- **MutualFundAnalysis**: FIP-level category and type breakdowns
- **MFCConsent**: MFC OTP consent flow

### Equities Module (`/pfm/api/v2/equities/*`)

#### `Equities.js`
- **EquitiesHolding**: ISIN-level aggregated holdings with broker breakdown
  - Stores brokers as embedded documents
  - Includes portfolio weightage
- **EquitiesDematAccount**: Demat-wise holdings (from `/demat-holding` endpoint)
- **EquitiesTransaction**: Buy/sell transactions

### ETF Module (`/pfm/api/v2/etf/*`)

#### `ETF.js`
- **ETFHolding**: ETF holdings by ISIN (similar to equities)
- **ETFInsights**: Demat-wise distribution with returns summary
- **ETFTransaction**: ETF buy/sell transactions

### NPS Module (`/pfm/api/v2/nps/*`)

#### `NPS.js`
- **NPSAccount**: PRAN accounts with holder details
- **NPSSummary**: Aggregated NPS summary

### Consent Module

#### `Consent.js`
- **AccountConsent**: Latest consent per account (from `/pfm/api/v2/account-consents-latest`)
- **ConsentRequest**: Consent initiation flow (from `/pfm/api/v1/submit-consent-request`)
- **FIRequest**: FI data refresh requests (from `/pfm/api/v2/firequest-user`)
- **AccountDelinkHistory**: Account delink audit trail (from `/pfm/api/v2/user-account-delink`)

---

## Master Data Schemas

### `FIP.js`
- Financial Information Providers (banks, RTAs, depositories)
- **API**: `/pfm/api/v2/fips`

### `Broker.js`
- Stock brokers
- **API**: `/pfm/api/v2/brokers`

---

## Schema Design Principles

1. **Normalization**: Linked accounts stored separately from extended details
2. **Embedded Documents**: Used for nested structures (folios, brokers, distributions)
3. **Mixed Types**: Used for complex nested JSON structures from API
4. **Indexes**: Compound indexes on common query patterns
5. **Timestamps**: Auto-updated `createdAt` and `updatedAt` fields

---

## Usage Example

```javascript
const { User, LinkedAccount, MutualFundHolding } = require('./schemas');

// Create user
const user = new User({
  uniqueIdentifier: '8956545791',
  mobileNumber: '8956545791',
  subscriptionStatus: 'YES',
  subscriptionStart: new Date('2024-01-01'),
  subscriptionEnd: new Date('2026-01-01')
});

// Create linked account
const linkedAccount = new LinkedAccount({
  uniqueIdentifier: '8956545791',
  fiDataId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
  accountType: 'DEPOSIT',
  fipId: 'HDFC-FIP',
  dataFetched: true
});

// Create MF holding with folios
const mfHolding = new MutualFundHolding({
  uniqueIdentifier: '8956545791',
  isin: 'INF179K01UT0',
  amc: 'HDFC AMC',
  closingUnits: 245.678,
  nav: 925.45,
  currentValue: 227385.78,
  folios: [{
    fipId: 'CAMS-FIP',
    folioNo: 'FOLIO001234',
    closingUnits: 245.678,
    nav: 925.45
  }]
});
```

---

## API Endpoint Mapping

| Schema | API Endpoint |
|--------|--------------|
| User | `/pfm/api/v2/user-subscriptions`, `/pfm/api/v2/user-details` |
| LinkedAccount | All `/pfm/api/v2/*/user-linked-accounts` |
| DepositAccount | `/pfm/api/v2/deposit/user-linked-accounts` |
| DepositTransaction | `/pfm/api/v2/deposit/user-account-statement` |
| DepositInsights | `/pfm/api/v2/deposit/insights` |
| TermDeposit | `/pfm/api/v2/term-deposit/user-linked-accounts` |
| TermDepositTransaction | `/pfm/api/v2/term-deposit/user-account-statement` |
| RecurringDeposit | `/pfm/api/v2/recurring-deposit/user-linked-accounts` |
| RecurringDepositTransaction | `/pfm/api/v2/recurring-deposit/user-account-statement` |
| MutualFundHolding | `/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio` |
| MutualFundTransaction | `/pfm/api/v2/mutual-fund/user-account-statement` |
| MutualFundInsights | `/pfm/api/v2/mutual-fund/insights` |
| MutualFundAnalysis | `/pfm/api/v2/mutual-fund/analysis` |
| MFCConsent | `/pfm/api/v2/mutual-fund/mfc/consent-request` |
| EquitiesHolding | `/pfm/api/v2/equities/user-linked-accounts/holding-broker` |
| EquitiesDematAccount | `/pfm/api/v2/equities/user-linked-accounts/demat-holding` |
| EquitiesTransaction | `/pfm/api/v2/equities/user-account-statement` |
| ETFHolding | `/pfm/api/v2/etf/user-linked-accounts` |
| ETFInsights | `/pfm/api/v2/etf/insights` |
| ETFTransaction | `/pfm/api/v2/etf/user-account-statement` |
| NPSAccount | `/pfm/api/v2/nps/user-linked-accounts` |
| AccountConsent | `/pfm/api/v2/account-consents-latest` |
| ConsentRequest | `/pfm/api/v1/submit-consent-request` |
| FIRequest | `/pfm/api/v2/firequest-user`, `/pfm/api/v2/firequest-account` |

---

## Notes

- All schemas use Mongoose for MongoDB
- Timestamps are automatically managed via `pre('save')` hooks
- Complex nested structures use `Schema.Types.Mixed` for flexibility
- Indexes are optimized for common query patterns
- Foreign key relationships are maintained via `uniqueIdentifier` and `fiDataId`
