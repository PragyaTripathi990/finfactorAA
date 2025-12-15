# API Issues Report - Finfactor Account Aggregator

**Date:** December 15, 2025  
**Environment:** Sandbox (dhanaprayoga.fiu.finfactor.in)  
**Reported By:** Handa Uncle Team

---

## Overview

We have implemented all 52 APIs from the Postman collection. However, several APIs are returning empty responses or errors when tested with the provided request bodies. This document lists all APIs that are not working as expected.

---

## APIs Returning Empty Responses

### 1. **Term Deposit - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/term-deposit/user-account-statement`
- **Request Body:**
  ```json
  {
    "uniqueIdentifier": "8956545791",
    "accountId": "037f5d5e-495b-484d-84f8-dba76a14d6b1",
    "dateRangeFrom": "2023-01-01"
  }
  ```
- **Status:** Returns empty array `[]`
- **Expected:** Transaction list with txnId, amount, narration, type, mode, balance, transactionDateTime, etc.

---

### 2. **Recurring Deposit - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/recurring-deposit/user-account-statement`
- **Request Body:**
  ```json
  {
    "uniqueIdentifier": "8956545791",
    "accountId": "4a81e8e8-928b-4b1f-b226-946f8dc3b1d9",
    "dateRangeFrom": "2020-01-01",
    "dateRangeTo": "2025-12-31"
  }
  ```
- **Status:** Returns empty array `[]`
- **Expected:** Transaction list with txnId, amount, narration, type, mode, balance, transactionDateTime, etc.

---

### 3. **Mutual Fund - MFC Consent Approve**
- **Endpoint:** `POST /pfm/api/v2/mutual-fund/mfc/consent-approve`
- **Request Body:**
  ```json
  {
    "uniqueIdentifier": "8956545791",
    "clientReferenceId": "68538337-f9f5-47f5-80d7-a1c4e9b2896b",
    "enteredOtp": "124391"
  }
  ```
- **Status:** Returns empty response or error
- **Expected:** Success confirmation after OTP validation
- **Note:** Requires valid `clientReferenceId` from `consent-request` API and valid OTP

---

### 4. **ETF - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/etf/user-account-statement`
- **Request Body:**
  ```json
  {
    "uniqueIdentifier": "8956545791",
    "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
    "dateRangeFrom": "2024-01-01"
  }
  ```
- **Status:** Returns empty response or error
- **Expected:** 
  ```json
  {
    "transactions": [
      {
        "accountId": "...",
        "brokerId": "...",
        "txnId": "...",
        "isin": "...",
        "isinDescription": "...",
        "transactionDateTime": "...",
        "units": 0.0,
        "type": "...",
        "narration": "...",
        "nav": 0.0
      }
    ]
  }
  ```

---

### 5. **Equities - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/equities/user-account-statement`
- **Request Body:**
  ```json
  {
    "uniqueIdentifier": "9823972748",
    "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
    "dateRangeFrom": "2024-01-01"
  }
  ```
- **Status:** Returns empty response or error
- **Expected:** Transaction list with accountId, txnId, isin, units, type, amount, etc.

---

### 6. **Equities and ETFs - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/equities-and-etfs/user-account-statement`
- **Request Body:**
  ```json
  {
    "uniqueIdentifier": "9823972748",
    "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
    "dateRangeFrom": "2024-01-01"
  }
  ```
- **Status:** Returns empty response or error
- **Expected:** Combined transaction list for equities and ETFs

---

### 7. **Deposit - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/deposit/user-account-statement`
- **Request Body:**
  ```json
  {
    "uniqueIdentifier": "8956545791",
    "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1",
    "dateRangeFrom": "2024-01-01"
  }
  ```
- **Status:** Returns empty response or error
- **Expected:** Transaction list with txnId, amount, narration, type, mode, balance, etc.

---

### 8. **Deposit - User Account Statement Download**
- **Endpoint:** `POST /pfm/api/v2/deposit/user-account-statement-download`
- **Request Body:** `{}` (empty)
- **Status:** Returns empty response
- **Expected:** File download or download URL
- **Note:** May require additional parameters (accountId, dateRange, etc.)

---

### 9. **Deposit - Insights**
- **Endpoint:** `POST /pfm/api/v2/deposit/insights`
- **Request Body:**
  ```json
  {
    "uniqueIdentifier": "6397585098",
    "accountIds": [],
    "from": "2024-07-01",
    "to": "2024-08-31",
    "frequency": "MONTHLY"
  }
  ```
- **Status:** Returns empty response or error
- **Expected:** Insights data with monthly breakdown, trends, etc.
- **Note:** May need valid accountIds array instead of empty array

---

## APIs That May Need Valid AccountIds

The following APIs work but may return empty if wrong `accountId` is used. We need guidance on:
1. How to get valid `accountId` values for each user
2. Which `uniqueIdentifier` values have test data
3. Valid date ranges for testing

### APIs Affected:
- All statement APIs (Term Deposit, RD, ETF, Equities, Deposit)
- Account-specific APIs that require `accountId` parameter

---

## Working APIs (For Reference)

The following APIs are working correctly:
- ✅ User login & authentication
- ✅ User details
- ✅ User account delink
- ✅ Consent requests (V1 and Plus)
- ✅ Mutual Funds list
- ✅ FI Request (user & account)
- ✅ FIPs
- ✅ Brokers
- ✅ NPS linked accounts
- ✅ Account consents latest
- ✅ User subscriptions (POST/PUT)
- ✅ Term Deposit (linked accounts, user details)
- ✅ Recurring Deposit (linked accounts, user details)
- ✅ Mutual Fund (all APIs except consent-approve)
- ✅ ETF (linked accounts, insights)
- ✅ Equities (linked accounts, holding-broker, demat-holding, broker-holding, user-details)
- ✅ Equities and ETFs (demat-holding)
- ✅ Deposit (user-details)

---

## Questions for Finvu Team

1. **Account IDs:** How do we get valid `accountId` values for testing? Should we:
   - First call `user-linked-accounts` API and extract `accountId` from response?
   - Use specific test accountIds provided by Finvu?

2. **Test Data:** Which `uniqueIdentifier` values have test data available?
   - `8956545791` - Has some data
   - `9823972748` - Has some data
   - `9167073512` - Has some data
   - `7008281184` - Has some data
   - `6397585098` - Has some data

3. **Date Ranges:** What date ranges should we use for testing statement APIs?
   - Current year (2024-01-01 to 2024-12-31)?
   - Specific test date ranges?

4. **MFC Consent Approve:** 
   - How do we get a valid `clientReferenceId` for testing?
   - What is the test OTP format/process?

5. **Deposit Statement Download:**
   - What parameters are required for this API?
   - Should it return a file URL or direct download?

6. **Empty Responses:**
   - Are empty responses expected when no data exists?
   - Should we get a proper error message instead of empty arrays?

---

## Technical Details

- **Base URL:** `https://dhanaprayoga.fiu.finfactor.in`
- **Authentication:** Bearer token (auto-fetched from `/pfm/api/v2/user-login`)
- **Request Format:** All requests are POST with JSON body
- **Response Format:** Expected JSON, but some APIs return plain text (e.g., "SUCCESS")

---

## Next Steps

1. Please provide valid test data for the above APIs
2. Clarify which APIs should return empty vs error messages
3. Provide test accountIds for each uniqueIdentifier
4. Share documentation for MFC consent flow (OTP process)
5. Confirm expected behavior for statement download API

---

**Contact Information:**
- **Team:** Handa Uncle
- **Email:** vikas.bansal@handauncle.com
- **Project:** Finfactor Account Aggregator Integration

---

Thank you for your support!

