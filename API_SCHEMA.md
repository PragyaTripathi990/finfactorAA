# Finfactor API Schema Documentation

**Base URL:** `https://dhanaprayoga.fiu.finfactor.in`  
**Authentication:** Bearer Token (from `/pfm/api/v2/user-login`)

---

## 📋 Table of Contents

1. [Authentication](#1-authentication)
2. [User APIs](#2-user-apis)
3. [Term Deposit APIs](#3-term-deposit-apis)
4. [Recurring Deposit APIs](#4-recurring-deposit-apis)
5. [Mutual Fund APIs](#5-mutual-fund-apis)
6. [ETF APIs](#6-etf-apis)
7. [Equities APIs](#7-equities-apis)
8. [Deposit APIs](#8-deposit-apis)
9. [NPS APIs](#9-nps-apis)
10. [Other APIs](#10-other-apis)

---

## 1. Authentication

### 1.1 User Login
**Endpoint:** `POST /pfm/api/v2/user-login`

**Request:**
```json
{
  "userId": "pfm@dhanaprayoga",
  "password": "7777"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. User APIs

### 2.1 Get User Details
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
      "totalFiDataToBeFetched": 0,
      "lastFetchDate": "2024-12-11T15:56:13.000+00:00",
      "currentValue": 69300.00
    },
    "RECURRING_DEPOSIT": {
      "totalFiData": 1,
      "totalFiDataToBeFetched": 0,
      "lastFetchDate": "2024-12-11T15:56:13.000+00:00",
      "currentValue": 64027.42
    },
    "EQUITIES": {
      "totalFiData": 2,
      "totalFiDataToBeFetched": 0,
      "lastFetchDate": "2025-12-10T10:37:05.171+00:00",
      "currentValue": 526210.20,
      "totalHoldings": 12,
      "totalBrokers": 1
    },
    "MUTUAL_FUNDS": {
      "totalFiData": 3,
      "totalFiDataToBeFetched": 0,
      "lastFetchDate": "2025-12-10T10:37:05.171+00:00",
      "dataSourceDetails": [
        {
          "dataResourceType": "AA",
          "lastFetchDate": "2025-12-10T10:37:05.171+00:00"
        },
        {
          "dataResourceType": "MFC",
          "lastFetchDate": "2025-12-12"
        }
      ],
      "currentValue": 1834500.81,
      "costValue": 1116560.01,
      "totalHoldings": 11
    },
    "NPS": {
      "totalFiData": 1,
      "totalFiDataToBeFetched": 0,
      "lastFetchDate": "2025-07-14T00:00:00.000+00:00",
      "currentValue": 461.00
    }
  }
}
```

### 2.2 User Account Delink
**Endpoint:** `POST /pfm/api/v2/user-account-delink`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1"
}
```

**Response:**
```
SUCCESS
```
*(Plain text response)*

### 2.3 User Subscriptions (POST - Create)
**Endpoint:** `POST /pfm/api/v2/user-subscriptions`

**Request:**
```json
{
  "uniqueIdentifier": "test-1",
  "mobileNumber": "9239874560",
  "subscriptionStatus": "YES",
  "subscriptionStart": "2025-01-01",
  "subscriptionEnd": "2026-02-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully"
}
```

### 2.4 User Subscriptions (PUT - Update)
**Endpoint:** `PUT /pfm/api/v2/user-subscriptions`

**Request:**
```json
{
  "uniqueIdentifier": "test-1",
  "mobileNumber": "9239874560",
  "subscriptionStatus": "YES",
  "subscriptionStart": "2025-01-01",
  "subscriptionEnd": "2026-02-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription updated successfully"
}
```

---

## 3. Term Deposit APIs

### 3.1 Get User Linked Accounts
**Endpoint:** `POST /pfm/api/v2/term-deposit/user-linked-accounts`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

**Response:**
```json
{
  "totalFiData": 1,
  "totalFiDataToBeFetched": 0,
  "lastFetchDate": "2024-12-11T15:56:13.000+00:00",
  "fipData": [
    {
      "fipId": "fip@sbi",
      "fipName": "State Bank of India",
      "totalFiData": 1,
      "totalFiDataToBeFetched": 0,
      "linkedAccounts": [
        {
          "fiDataId": "037f5d5e-495b-484d-84f8-dba76a14d6b1",
          "accountType": "TERM_DEPOSIT",
          "maskedAccNumber": "XXXX1234",
          "accountRefNumber": "037f5d5e-495b-484d-84f8-dba76a14d6b1",
          "dataFetched": true,
          "accountName": "Fixed Deposit",
          "lastFetchDateTime": "2024-12-11T15:56:13.000+00:00",
          "fipId": "fip@sbi",
          "fipName": "State Bank of India",
          "latestConsentPurposeText": "To generate insights...",
          "latestConsentExpiryTime": "2027-12-10T10:26:13.000+00:00",
          "consentPurposeVersion": "others"
        }
      ]
    }
  ],
  "dataSourceDetails": [
    {
      "dataResourceType": "AA",
      "lastFetchDate": "2024-12-11T15:56:13.000+00:00"
    }
  ]
}
```

### 3.2 Get User Details
**Endpoint:** `POST /pfm/api/v2/term-deposit/user-details`

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
    "TERM_DEPOSIT": {
      "totalFiData": 1,
      "totalFiDataToBeFetched": 0,
      "lastFetchDate": "2024-12-11T15:56:13.000+00:00",
      "fipData": [...]
    }
  }
}
```

### 3.3 Get User Account Statement ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/term-deposit/user-account-statement`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "037f5d5e-495b-484d-84f8-dba76a14d6b1",
  "txnOrder": "DESC",
  "dateRangeFrom": "2023-01-01",
  "dateRangeTo": "2025-12-31"
}
```

**Expected Response:**
```json
[
  {
    "txnId": "TXN001",
    "amount": 50000.00,
    "narration": "FD Interest Credit",
    "type": "CREDIT",
    "mode": "TRANSFER",
    "balance": 69300.00,
    "transactionDateTime": "2024-06-15T10:30:00.000+00:00",
    "valueDate": "2024-06-15T00:00:00.000+00:00",
    "reference": "REF123456"
  }
]
```

**Actual Response:** `[]` *(Empty array)*

---

## 4. Recurring Deposit APIs

### 4.1 Get User Linked Accounts
**Endpoint:** `POST /pfm/api/v2/recurring-deposit/user-linked-accounts`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

**Response:** *(Same structure as Term Deposit linked accounts)*

### 4.2 Get User Details
**Endpoint:** `POST /pfm/api/v2/recurring-deposit/user-details`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748"
}
```

**Response:** *(Same structure as Term Deposit user details)*

### 4.3 Get User Account Statement ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/recurring-deposit/user-account-statement`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "4a81e8e8-928b-4b1f-b226-946f8dc3b1d9",
  "txnOrder": "DESC",
  "dateRangeFrom": "2020-01-01",
  "dateRangeTo": "2025-12-31"
}
```

**Expected Response:**
```json
[
  {
    "txnId": "TXN001",
    "amount": 5000.00,
    "narration": "RD Installment",
    "type": "CREDIT",
    "mode": "AUTO_DEBIT",
    "balance": 64027.42,
    "transactionDateTime": "2024-12-01T10:30:00.000+00:00",
    "valueDate": "2024-12-01T00:00:00.000+00:00",
    "reference": "REF789012"
  }
]
```

**Actual Response:** `[]` *(Empty array)*

---

## 5. Mutual Fund APIs

### 5.1 Get User Linked Accounts
**Endpoint:** `POST /pfm/api/v2/mutual-fund/user-linked-accounts`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

**Response:**
```json
{
  "totalFiData": 3,
  "totalFiDataToBeFetched": 0,
  "lastFetchDate": "2025-12-10T10:37:05.171+00:00",
  "fipData": [
    {
      "fipId": "fip@cams",
      "fipName": "CAMS",
      "totalFiData": 2,
      "linkedAccounts": [...]
    }
  ],
  "dataSourceDetails": [
    {
      "dataResourceType": "AA",
      "lastFetchDate": "2025-12-10T10:37:05.171+00:00"
    },
    {
      "dataResourceType": "MFC",
      "lastFetchDate": "2025-12-12"
    }
  ]
}
```

### 5.2 Get Holding Folio
**Endpoint:** `POST /pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "filterZeroValueAccounts": "true",
  "filterZeroValueHoldings": "true"
}
```

**Response:**
```json
{
  "totalFiData": 3,
  "totalFiDataToBeFetched": 0,
  "currentValue": 1834500.81,
  "costValue": 1116560.01,
  "holdings": [
    {
      "amc": "HDFC Asset Management",
      "registrar": "CAMS",
      "schemeCode": "HDFC001",
      "schemaOption": "GROWTH",
      "schemaTypes": "EQUITY",
      "schemaCategory": "Large Cap",
      "isin": "INF179K01234",
      "isinDescription": "HDFC Top 100 Fund - Growth",
      "ucc": "12345678",
      "amfiCode": "100123",
      "closingUnits": 500.25,
      "lienUnits": 0,
      "nav": 850.50,
      "avgNav": 720.30,
      "navDate": "2025-12-10T00:00:00.000+00:00",
      "lockingUnits": 0,
      "lastFetchTime": "2025-12-10T10:37:05.171+00:00",
      "currentValue": 425378.63,
      "folios": [
        {
          "fipId": "fip@cams",
          "fiDataId": "abc123",
          "maskedAccNumber": "XXXX5678",
          "accountRefNumber": "abc123",
          "currentValue": 425378.63,
          "folioNo": "12345678/90",
          "closingUnits": 500.25,
          "lienUnits": 0,
          "nav": 850.50,
          "navDate": "2025-12-10T00:00:00.000+00:00",
          "lockingUnits": 0,
          "lastFetchTime": "2025-12-10T10:37:05.171+00:00"
        }
      ]
    }
  ],
  "totalHoldings": 11
}
```

### 5.3 Get User Details
**Endpoint:** `POST /pfm/api/v2/mutual-fund/user-details`

**Request:**
```json
{
  "uniqueIdentifier": "9167073512"
}
```

### 5.4 Get User Account Statement
**Endpoint:** `POST /pfm/api/v2/mutual-fund/user-account-statement`

**Request:**
```json
{
  "uniqueIdentifier": "7008281184",
  "accountId": "optional",
  "brokerId": "optional",
  "folioNo": "optional",
  "isin": "optional",
  "txnOrder": "DESC",
  "dateRangeFrom": "2024-01-01",
  "dateRangeTo": "2025-12-31",
  "isins": ["INF179K01234"],
  "accountIds": ["abc123"],
  "maskedFolioNos": ["XXXX5678"]
}
```

**Response:**
```json
[
  {
    "accountId": "abc123",
    "txnId": "TXN001",
    "isin": "INF179K01234",
    "amc": "HDFC Asset Management",
    "nav": 850.50,
    "mode": "SIP",
    "type": "PURCHASE",
    "units": 5.88,
    "amount": 5000.00,
    "navDate": "2024-06-15T00:00:00.000+00:00",
    "amfiCode": "100123",
    "narration": "SIP Purchase",
    "registrar": "CAMS",
    "lockInDays": "0",
    "lockInFlag": "N",
    "isinDescription": "HDFC Top 100 Fund - Growth",
    "transactionDateTime": "2024-06-15T10:30:00",
    "folioNo": "12345678/90",
    "sttTax": 0,
    "tax": 0,
    "totalTax": 0,
    "stampDuty": 0.75,
    "txnCharge": 0,
    "dataSource": "AA"
  }
]
```

### 5.5 Get Insights
**Endpoint:** `POST /pfm/api/v2/mutual-fund/insights`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748"
}
```

**Response:**
```json
{
  "overallSummary": {
    "pan": "ABCDE1234F",
    "mobile": "9823972748",
    "totalHoldings": 11,
    "currentValue": 1834500.81,
    "investedValue": 1116560.01,
    "absoluteReturn": 717940.80,
    "absoluteReturnPercentage": 64.30,
    "xirr": 18.5,
    "dailyReturns": 2500.00,
    "dailyReturnsPercent": 0.14,
    "categoryDistribution": [
      {
        "category": "Equity",
        "totalFunds": 6,
        "totalCurrentValue": 1200000.00,
        "percentage": 65.4
      },
      {
        "category": "Debt",
        "totalFunds": 3,
        "totalCurrentValue": 450000.00,
        "percentage": 24.5
      },
      {
        "category": "Hybrid",
        "totalFunds": 2,
        "totalCurrentValue": 184500.81,
        "percentage": 10.1
      }
    ],
    "subCategoryDistribution": [...],
    "mutualFundsMarketCapDistribution": [...],
    "mutualFundsAmcDistribution": [...],
    "mutualFundsSectorDistribution": [...]
  },
  "holdings": [...]
}
```

### 5.6 Get Analysis
**Endpoint:** `POST /pfm/api/v2/mutual-fund/analysis`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

**Response:**
```json
{
  "fipId": "fip@cams",
  "fipName": "CAMS",
  "totalFiData": 3,
  "totalFiDataToBeFetched": 0,
  "currentValue": 1834500.81,
  "costValue": 1116560.01,
  "totalHoldings": 11,
  "schemeCategory": [
    {
      "schemeCategory": "Large Cap",
      "currentValue": 800000.00,
      "totalHoldings": 4
    },
    {
      "schemeCategory": "Mid Cap",
      "currentValue": 400000.00,
      "totalHoldings": 3
    }
  ],
  "schemeType": [
    {
      "schemeTypes": "Growth",
      "currentValue": 1200000.00,
      "totalHoldings": 8
    },
    {
      "schemeTypes": "IDCW",
      "currentValue": 634500.81,
      "totalHoldings": 3
    }
  ]
}
```

### 5.7 MFC Consent Request
**Endpoint:** `POST /pfm/api/v2/mutual-fund/mfc/consent-request`

**Request:**
```json
{
  "uniqueIdentifier": "9239874560",
  "pan": "ANKPJ4391C"
}
```

**Response:**
```json
{
  "clientReferenceId": "68538337-f9f5-47f5-80d7-a1c4e9b2896b",
  "clientRefNo": "MFC2024121500001"
}
```

### 5.8 MFC Consent Approve ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/mutual-fund/mfc/consent-approve`

**Request:**
```json
{
  "uniqueIdentifier": "9239874560",
  "clientReferenceId": "68538337-f9f5-47f5-80d7-a1c4e9b2896b",
  "enteredOtp": "124391"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Consent approved successfully",
  "data": {
    "consentId": "CONSENT001",
    "status": "APPROVED"
  }
}
```

**Actual Response:** Empty or error

---

## 6. ETF APIs

### 6.1 Get User Linked Accounts
**Endpoint:** `POST /pfm/api/v2/etf/user-linked-accounts`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

**Response:** *(Similar structure to Equities linked accounts)*

### 6.2 Get Insights
**Endpoint:** `POST /pfm/api/v2/etf/insights`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748"
}
```

**Response:**
```json
{
  "currentValue": 150000.00,
  "totalHoldings": 3,
  "returnsSummary": {
    "dailyReturns": 500.00,
    "dailyReturnsPercentage": 0.33
  },
  "totalDemats": 1,
  "dematWiseDistribution": [
    {
      "dematId": "DEMAT001",
      "brokerName": "Zerodha",
      "brokerCode": "ZERODHA",
      "totalHoldings": 3,
      "currentValue": 150000.00,
      "dematValuePercentage": 100,
      "returnsSummary": {
        "dailyReturns": 500.00,
        "dailyReturnsPercentage": 0.33
      },
      "holdingsInsights": [
        {
          "schemeName": "Nippon India ETF Nifty BeES",
          "isin": "INF204K01234",
          "currentValue": 80000.00,
          "totalUnits": 400,
          "currentNAV": 200.00,
          "currentNAVDate": "2025-12-10T00:00:00.000+00:00",
          "returnsSummary": {
            "dailyReturns": 300.00,
            "dailyReturnsPercentage": 0.38
          }
        }
      ]
    }
  ]
}
```

### 6.3 Get User Account Statement ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/etf/user-account-statement`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
  "brokerId": "optional",
  "isin": "optional",
  "txnOrder": "DESC",
  "dateRangeFrom": "2024-01-01",
  "dateRangeTo": "2025-12-31"
}
```

**Expected Response:**
```json
{
  "transactions": [
    {
      "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
      "brokerId": "ZERODHA",
      "txnId": "TXN001",
      "isin": "INF204K01234",
      "isinDescription": "Nippon India ETF Nifty BeES",
      "transactionDateTime": "2024-06-15T10:30:00.000+00:00",
      "units": 50.0,
      "type": "BUY",
      "narration": "ETF Purchase",
      "nav": 195.50
    }
  ]
}
```

**Actual Response:** Empty or error

---

## 7. Equities APIs

### 7.1 Get User Linked Accounts
**Endpoint:** `POST /pfm/api/v2/equities/user-linked-accounts`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

### 7.2 Get Holding Broker
**Endpoint:** `POST /pfm/api/v2/equities/user-linked-accounts/holding-broker`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

**Response:**
```json
{
  "totalFiData": 2,
  "totalFiDataToBeFetched": 0,
  "currentValue": 526210.20,
  "holdings": [
    {
      "issuerName": "Reliance Industries Ltd",
      "isin": "INE002A01018",
      "isinDescription": "RELIANCE",
      "units": 50,
      "lastTradedPrice": 2850.50,
      "avgTradedPrice": 2500.00,
      "lastFetchTime": "2025-12-10T10:37:05.171+00:00",
      "currentValue": 142525.00,
      "portfolioWeightagePercent": 27.1,
      "brokers": [
        {
          "brokerName": "Zerodha",
          "brokerId": "ZERODHA",
          "units": 50,
          "lastTradedPrice": 2850.50,
          "avgTradedPrice": 2500.00,
          "currentValue": 142525.00,
          "lastFetchTime": "2025-12-10T10:37:05.171+00:00"
        }
      ]
    }
  ],
  "totalHoldings": 12
}
```

### 7.3 Get Demat Holding
**Endpoint:** `POST /pfm/api/v2/equities/user-linked-accounts/demat-holding`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

### 7.4 Get Broker Holding
**Endpoint:** `POST /pfm/api/v2/equities/user-linked-accounts/broker-holding`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

### 7.5 Get User Details
**Endpoint:** `POST /pfm/api/v2/equities/user-details`

**Request:**
```json
{
  "uniqueIdentifier": "9167073512"
}
```

### 7.6 Get User Account Statement ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/equities/user-account-statement`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
  "brokerId": "optional",
  "isin": "optional",
  "txnOrder": "DESC",
  "dateRangeFrom": "2024-01-01",
  "dateRangeTo": "2025-12-31"
}
```

**Expected Response:**
```json
[
  {
    "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
    "txnId": "TXN001",
    "isin": "INE002A01018",
    "issuerName": "Reliance Industries Ltd",
    "transactionDateTime": "2024-06-15T10:30:00.000+00:00",
    "units": 10,
    "type": "BUY",
    "amount": 25000.00,
    "price": 2500.00
  }
]
```

**Actual Response:** Empty or error

### 7.7 Equities and ETFs - Demat Holding
**Endpoint:** `POST /pfm/api/v2/equities-and-etfs/user-linked-accounts/demat-holding`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "filterZeroValueAccounts": "false",
  "filterZeroValueHoldings": "false"
}
```

### 7.8 Equities and ETFs - User Account Statement ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/equities-and-etfs/user-account-statement`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748",
  "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
  "dateRangeFrom": "2024-01-01",
  "dateRangeTo": "2025-12-31"
}
```

**Expected Response:** Combined equities and ETF transactions

**Actual Response:** Empty or error

---

## 8. Deposit APIs

### 8.1 Get User Linked Accounts
**Endpoint:** `POST /pfm/api/v2/deposit/user-linked-accounts`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791"
}
```

### 8.2 Get User Details
**Endpoint:** `POST /pfm/api/v2/deposit/user-details`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791"
}
```

### 8.3 Get User Account Statement ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/deposit/user-account-statement`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
  "txnOrder": "DESC",
  "dateRangeFrom": "2024-01-01",
  "dateRangeTo": "2025-12-31"
}
```

**Expected Response:**
```json
[
  {
    "txnId": "TXN001",
    "amount": 10000.00,
    "narration": "UPI Transfer",
    "type": "CREDIT",
    "mode": "UPI",
    "balance": 1218000.00,
    "transactionDateTime": "2024-12-10T10:30:00.000+00:00",
    "valueDate": "2024-12-10T00:00:00.000+00:00",
    "reference": "UPI123456789"
  }
]
```

**Actual Response:** Empty or error

### 8.4 Get User Account Statement Download ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/deposit/user-account-statement-download`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
  "dateRangeFrom": "2024-01-01",
  "dateRangeTo": "2025-12-31",
  "format": "PDF"
}
```

**Expected Response:**
```json
{
  "downloadUrl": "https://...",
  "fileName": "statement_2024.pdf",
  "expiryTime": "2025-12-15T12:00:00.000+00:00"
}
```

**Actual Response:** Empty

### 8.5 Get Insights ⚠️ *RETURNS EMPTY*
**Endpoint:** `POST /pfm/api/v2/deposit/insights`

**Request:**
```json
{
  "uniqueIdentifier": "6397585098",
  "accountIds": ["60e38f9b-50da-46b2-bb43-3ddb5b9e63c1"],
  "from": "2024-07-01",
  "to": "2024-08-31",
  "frequency": "MONTHLY"
}
```

**Expected Response:**
```json
{
  "insights": [
    {
      "month": "July 2024",
      "totalCredits": 150000.00,
      "totalDebits": 80000.00,
      "netFlow": 70000.00,
      "averageBalance": 1150000.00,
      "transactionCount": 45
    },
    {
      "month": "August 2024",
      "totalCredits": 120000.00,
      "totalDebits": 52000.00,
      "netFlow": 68000.00,
      "averageBalance": 1218000.00,
      "transactionCount": 38
    }
  ],
  "summary": {
    "totalPeriodCredits": 270000.00,
    "totalPeriodDebits": 132000.00,
    "netPeriodFlow": 138000.00
  }
}
```

**Actual Response:** Empty or error

---

## 9. NPS APIs

### 9.1 Get User Linked Accounts
**Endpoint:** `POST /pfm/api/v2/nps/user-linked-accounts`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791"
}
```

**Response:**
```json
{
  "totalFiData": 1,
  "totalFiDataToBeFetched": 0,
  "fipData": [
    {
      "fipId": "fip@finrepo",
      "fipName": "Finrepo",
      "totalFiData": 1,
      "totalFiDataToBeFetched": 0,
      "linkedAccounts": [
        {
          "fiDataId": "6fd55b32-700d-4c8a-a491-42c54862226a",
          "accountRefNumber": "6fd55b32-700d-4c8a-a491-42c54862226a",
          "dataFetched": true,
          "lastFetchDateTime": "2025-07-14T00:00:00.000+00:00",
          "fiRequestCountOfCurrentMonth": 2,
          "fipId": "fip@finrepo",
          "fipName": "Finrepo",
          "latestConsentPurposeText": "To generate insights...",
          "latestConsentExpiryTime": "2027-12-10T10:26:13.000+00:00",
          "consentPurposeVersion": "others",
          "maskedPranId": "XXXXXXXXXXXX2481",
          "holderName": "",
          "holderDob": "1980-01-01T00:00:00.000+00:00",
          "holderMobile": "8956545791",
          "holderNominee": "REGISTERED",
          "holderPranId": "1208160088348123",
          "holderLandline": "",
          "holderAddress": "S/OTEST 417/193 K RADHAPURAM ROAD Delhi",
          "holderEmail": "info@cookiejar.in",
          "holderPan": "IJFGF4579B",
          "holderCkycCompliance": false,
          "accountCurrentValue": 461.00
        }
      ],
      "currentValue": 461.00
    }
  ],
  "currentValue": 461.00
}
```

---

## 10. Other APIs

### 10.1 Submit Consent Request (V1)
**Endpoint:** `POST /pfm/api/v1/submit-consent-request`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "templateName": "BANK_STATEMENT_PERIODIC"
}
```

### 10.2 Submit Consent Request Plus (V2)
**Endpoint:** `POST /pfm/api/v2/submit-consent-request-plus`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "aaCustId": "8956545791@finvu",
  "templateName": "BANK_STATEMENT_PERIODIC",
  "userSessionId": "sessionid123",
  "redirectUrl": "http://localhost:3000/callback"
}
```

**Response:**
```json
{
  "url": "https://finvu.in/consent?handle=xxx",
  "consentHandle": "xxx"
}
```

### 10.3 Get FIPs
**Endpoint:** `POST /pfm/api/v2/fips`

**Request:**
```json
{}
```

**Response:**
```json
[
  {
    "fipId": "fip@sbi",
    "fipName": "State Bank of India",
    "fiTypes": ["DEPOSIT", "TERM_DEPOSIT"],
    "logoUrl": "https://...",
    "enabled": true
  }
]
```

### 10.4 Get Brokers
**Endpoint:** `POST /pfm/api/v2/brokers`

**Request:**
```json
{}
```

### 10.5 Get Mutual Funds List
**Endpoint:** `POST /pfm/api/v2/mutualfunds`

**Request:**
```json
{}
```

### 10.6 FI Request User
**Endpoint:** `POST /pfm/api/v2/firequest-user`

**Request:**
```json
{
  "uniqueIdentifier": "9823972748"
}
```

### 10.7 FI Request Account
**Endpoint:** `POST /pfm/api/v2/firequest-account`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "b986d95d-709e-45a7-8548-39814173ec9c"
}
```

### 10.8 Account Consents Latest
**Endpoint:** `POST /pfm/api/v2/account-consents-latest`

**Request:**
```json
{
  "uniqueIdentifier": "8956545791",
  "accountId": "b986d95d-709e-45a7-8548-39814173ec9c"
}
```

---

## Summary

### ✅ Working APIs (43)
All user details, linked accounts, insights, and analysis APIs are working correctly.

### ⚠️ APIs Returning Empty (9)
1. Term Deposit - User Account Statement
2. Recurring Deposit - User Account Statement
3. Mutual Fund - MFC Consent Approve
4. ETF - User Account Statement
5. Equities - User Account Statement
6. Equities and ETFs - User Account Statement
7. Deposit - User Account Statement
8. Deposit - User Account Statement Download
9. Deposit - Insights

---

**Document Created:** December 15, 2025  
**Environment:** Sandbox (dhanaprayoga.fiu.finfactor.in)  
**Team:** Handa Uncle

