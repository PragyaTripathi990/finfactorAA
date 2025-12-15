# Email to Finvu - API Issues Report

**Subject:** API Issues Report - Empty Responses in Sandbox Environment

---

**Dear Finvu Team,**

We have successfully implemented all 52 APIs from the Postman collection. However, we are encountering empty responses or errors with several APIs when testing in the sandbox environment. We would appreciate your assistance in resolving these issues.

## APIs Returning Empty Responses

### 1. **Term Deposit - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/term-deposit/user-account-statement`
- **Request:** `{ "uniqueIdentifier": "8956545791", "accountId": "037f5d5e-495b-484d-84f8-dba76a14d6b1", "dateRangeFrom": "2023-01-01" }`
- **Issue:** Returns empty array `[]`

### 2. **Recurring Deposit - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/recurring-deposit/user-account-statement`
- **Request:** `{ "uniqueIdentifier": "8956545791", "accountId": "4a81e8e8-928b-4b1f-b226-946f8dc3b1d9", "dateRangeFrom": "2020-01-01", "dateRangeTo": "2025-12-31" }`
- **Issue:** Returns empty array `[]`

### 3. **Mutual Fund - MFC Consent Approve**
- **Endpoint:** `POST /pfm/api/v2/mutual-fund/mfc/consent-approve`
- **Request:** `{ "uniqueIdentifier": "8956545791", "clientReferenceId": "...", "enteredOtp": "..." }`
- **Issue:** Returns empty response or error
- **Question:** How do we get valid `clientReferenceId` and test OTP?

### 4. **ETF - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/etf/user-account-statement`
- **Request:** `{ "uniqueIdentifier": "8956545791", "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1", "dateRangeFrom": "2024-01-01" }`
- **Issue:** Returns empty response or error

### 5. **Equities - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/equities/user-account-statement`
- **Request:** `{ "uniqueIdentifier": "9823972748", "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1", "dateRangeFrom": "2024-01-01" }`
- **Issue:** Returns empty response or error

### 6. **Equities and ETFs - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/equities-and-etfs/user-account-statement`
- **Request:** `{ "uniqueIdentifier": "9823972748", "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1", "dateRangeFrom": "2024-01-01" }`
- **Issue:** Returns empty response or error

### 7. **Deposit - User Account Statement**
- **Endpoint:** `POST /pfm/api/v2/deposit/user-account-statement`
- **Request:** `{ "uniqueIdentifier": "8956545791", "accountId": "60e38f9b-50da-46b2-bb43-3ddb5b9e63c1", "dateRangeFrom": "2024-01-01" }`
- **Issue:** Returns empty response or error

### 8. **Deposit - User Account Statement Download**
- **Endpoint:** `POST /pfm/api/v2/deposit/user-account-statement-download`
- **Request:** `{}` (empty)
- **Issue:** Returns empty response
- **Question:** What parameters are required for this API?

### 9. **Deposit - Insights**
- **Endpoint:** `POST /pfm/api/v2/deposit/insights`
- **Request:** `{ "uniqueIdentifier": "6397585098", "accountIds": [], "from": "2024-07-01", "to": "2024-08-31", "frequency": "MONTHLY" }`
- **Issue:** Returns empty response or error
- **Question:** Should `accountIds` array contain valid accountIds instead of empty array?

---

## Questions

1. **Account IDs:** How do we get valid `accountId` values for testing? Should we extract them from `user-linked-accounts` API responses?

2. **Test Data:** Which `uniqueIdentifier` values have test data available for statement APIs?

3. **Date Ranges:** What date ranges should we use for testing statement APIs?

4. **MFC Consent Flow:** What is the process to get valid `clientReferenceId` and test OTP for consent-approve API?

5. **Empty Responses:** Are empty responses expected when no data exists, or should we receive proper error messages?

---

## Working APIs

The following APIs are working correctly:
- ✅ User authentication & details
- ✅ Account delink
- ✅ Consent requests
- ✅ Mutual Funds, ETF, Equities (linked accounts, insights, details)
- ✅ Term Deposit, RD (linked accounts, user details)
- ✅ NPS, FIPs, Brokers
- ✅ FI Request, Account Consents

**Total: 43 out of 52 APIs working correctly**

---

## Request

We would appreciate if you could:
1. Provide valid test data for the above APIs
2. Share test accountIds for each uniqueIdentifier
3. Clarify expected behavior for empty responses
4. Provide documentation for MFC consent OTP flow
5. Confirm required parameters for statement download API

Thank you for your support!

**Best regards,**  
**Handa Uncle Team**  
**Email:** vikas.bansal@handauncle.com

---

**Environment:** Sandbox (dhanaprayoga.fiu.finfactor.in)  
**Date:** December 15, 2025

