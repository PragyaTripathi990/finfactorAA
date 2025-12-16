# Finfactor AA MongoDB Schemas

This folder contains all Mongoose schemas for storing Finfactor Account Aggregator API data in MongoDB.

## 📁 Schema Files

| File | Description |
|------|-------------|
| `User.js` | User profile and portfolio summary |
| `Subscription.js` | User subscription details |
| `LinkedAccount.js` | Base schema for all linked accounts |
| `TermDeposit.js` | Term Deposit accounts and transactions |
| `RecurringDeposit.js` | Recurring Deposit accounts and transactions |
| `MutualFund.js` | Mutual Fund holdings, transactions, insights |
| `ETF.js` | ETF accounts, insights, and transactions |
| `Equities.js` | Equities holdings, demat accounts, transactions |
| `Deposit.js` | Savings/Current accounts, transactions, insights |
| `NPS.js` | NPS (National Pension System) accounts |
| `Consent.js` | Consent management and history |
| `FIP.js` | Financial Information Providers master data |
| `Broker.js` | Broker master data |
| `Transaction.js` | Unified transaction schema for all asset types |
| `FIRequest.js` | FI Request tracking |
| `MutualFundMaster.js` | Mutual Fund master data |
| `db.js` | MongoDB connection utilities |
| `index.js` | Exports all schemas |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install mongoose
```

### 2. Set Environment Variable

```bash
export MONGODB_URI="mongodb://localhost:27017/finfactor_aa"
```

Or create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/finfactor_aa
```

### 3. Connect to MongoDB

```javascript
const { connectDB } = require('./schemas/db');

// Connect to MongoDB
await connectDB();
```

### 4. Import Schemas

```javascript
// Import all schemas
const schemas = require('./schemas');

// Or import specific schemas
const User = require('./schemas/User');
const { MutualFundHolding, MutualFundTransaction } = require('./schemas/MutualFund');
const { TermDepositAccount, TermDepositTransaction } = require('./schemas/TermDeposit');
```

## 📊 Usage Examples

### Save User Details

```javascript
const User = require('./schemas/User');

const user = new User({
  uniqueIdentifier: '8956545791',
  mobileNumber: '8956545791',
  subscriptionStatus: 'YES',
  subscriptionStartDate: new Date('2025-11-25'),
  subscriptionEndDate: new Date('2026-11-25'),
  fiDatas: {
    DEPOSIT: {
      totalFiData: 17,
      totalFiDataToBeFetched: 0,
      currentBalance: 1218000.00
    },
    MUTUAL_FUNDS: {
      totalFiData: 3,
      totalFiDataToBeFetched: 0,
      currentValue: 1834500.81,
      costValue: 1116560.01,
      totalHoldings: 11
    }
  }
});

await user.save();
```

### Save Mutual Fund Holding

```javascript
const { MutualFundHolding } = require('./schemas/MutualFund');

const holding = new MutualFundHolding({
  uniqueIdentifier: '8956545791',
  isin: 'INF209K01YY3',
  amc: 'HDFC Mutual Fund',
  schemaCategory: 'Equity',
  schemaTypes: 'Large Cap',
  isinDescription: 'HDFC Top 100 Fund - Direct Plan - Growth',
  closingUnits: 500.25,
  nav: 850.50,
  currentValue: 425375.13,
  costValue: 350000.00
});

await holding.save();
```

### Save Transaction

```javascript
const Transaction = require('./schemas/Transaction');

const txn = new Transaction({
  uniqueIdentifier: '8956545791',
  accountId: 'b986d95d-709e-45a7-8548-39814173ec9c',
  txnId: 'TXN123456',
  assetType: 'MUTUAL_FUNDS',
  transactionDateTime: new Date(),
  type: 'PURCHASE',
  amount: 10000,
  units: 11.75,
  nav: 850.50,
  isin: 'INF209K01YY3',
  mode: 'SIP'
});

await txn.save();
```

### Query Transactions by Date Range

```javascript
const Transaction = require('./schemas/Transaction');

const transactions = await Transaction.getByDateRange(
  '8956545791',
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  'MUTUAL_FUNDS'
);
```

### Get Transaction Summary

```javascript
const summary = await Transaction.getSummary(
  '8956545791',
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Returns: [
//   { _id: 'MUTUAL_FUNDS', totalTransactions: 50, totalAmount: 500000, avgAmount: 10000 },
//   { _id: 'DEPOSIT', totalTransactions: 200, totalAmount: 2000000, avgAmount: 10000 },
// ]
```

### Save NPS Account

```javascript
const { NPSAccount } = require('./schemas/NPS');

const npsAccount = new NPSAccount({
  uniqueIdentifier: '8956545791',
  fiDataId: '6fd55b32-700d-4c8a-a491-42c54862226a',
  fipId: 'fip@finrepo',
  fipName: 'Finrepo',
  maskedPranId: 'XXXXXXXXXXXX2481',
  holderPranId: '1208160088348123',
  holderName: 'John Doe',
  holderPan: 'IJFGF4579B',
  accountCurrentValue: 461.00,
  dataFetched: true,
  lastFetchDateTime: new Date()
});

await npsAccount.save();
```

### Save Consent

```javascript
const { Consent } = require('./schemas/Consent');

const consent = new Consent({
  uniqueIdentifier: '8956545791',
  consentHandle: 'consent-handle-123',
  consentStatus: 'APPROVED',
  templateName: 'BANK_STATEMENT_PERIODIC',
  purposeText: 'To generate insights based on your overall finances',
  aaCustId: '8956545791@finvu',
  consentStart: new Date(),
  consentExpiry: new Date('2027-12-31'),
  fiTypes: ['DEPOSIT', 'MUTUAL_FUNDS', 'EQUITIES']
});

await consent.save();
```

## 🔍 Indexes

All schemas include optimized indexes for common query patterns:

- **User**: `uniqueIdentifier` (unique)
- **Transactions**: `uniqueIdentifier + transactionDateTime`, `accountId + transactionDateTime`
- **Holdings**: `uniqueIdentifier + isin`
- **Accounts**: `uniqueIdentifier + accountType`, `fipId`

## 📝 Schema Relationships

```
User (1) ─────┬───── LinkedAccount (*)
              │
              ├───── MutualFundHolding (*)
              │
              ├───── EquitiesHolding (*)
              │
              ├───── ETFAccount (*)
              │
              ├───── TermDepositAccount (*)
              │
              ├───── RecurringDepositAccount (*)
              │
              ├───── DepositAccount (*)
              │
              ├───── NPSAccount (*)
              │
              ├───── Consent (*)
              │
              └───── Transaction (*)
```

## 🛠️ Available Methods

### User Model

- `calculateTotalValue()` - Calculate and update total portfolio value

### Subscription Model

- `isActive()` - Check if subscription is currently active

### Consent Model

- `isActive()` - Check if consent is currently valid

### Transaction Model (Static)

- `getByDateRange(uniqueIdentifier, startDate, endDate, assetType)` - Get transactions by date range
- `getSummary(uniqueIdentifier, startDate, endDate)` - Get transaction summary by asset type

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/finfactor_aa` |

## 📦 Dependencies

```json
{
  "mongoose": "^8.0.0"
}
```

## 🤝 Integration with Next.js

For Next.js API routes:

```javascript
// lib/mongodb.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

```javascript
// app/api/user/route.js
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/schemas/User';

export async function GET(request) {
  await connectToDatabase();
  
  const users = await User.find({});
  return Response.json(users);
}
```

