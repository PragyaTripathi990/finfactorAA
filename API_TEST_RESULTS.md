# 🔬 WealthScape API Test Results

**Test Date:** December 18, 2025  
**Test User:** `uniqueIdentifier: 8956545791`  
**Total APIs Tested:** 29

---

## 📊 Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ SUCCESS | 22 | 76% |
| ⚠️ EMPTY | 1 | 3% |
| ❌ ERROR | 6 | 21% |

---

## ✅ WORKING APIs (22)

These APIs return valid data:

### Deposit APIs
| API | Endpoint | Items |
|-----|----------|-------|
| Deposit - User Details | `/pfm/api/v2/deposit/user-details` | 4 |
| Deposit - Linked Accounts | `/pfm/api/v2/deposit/user-linked-accounts` | 2 FIPs |
| Deposit - Account Statement | `/pfm/api/v2/deposit/user-account-statement` | 79 transactions |
| Deposit - Insights | `/pfm/api/v2/deposit/insights` | 12 months data |

### Term Deposit APIs
| API | Endpoint | Items |
|-----|----------|-------|
| Term Deposit - User Details | `/pfm/api/v2/term-deposit/user-details` | 4 |
| Term Deposit - Linked Accounts | `/pfm/api/v2/term-deposit/user-linked-accounts` | 1 FIP |

### Recurring Deposit APIs
| API | Endpoint | Items |
|-----|----------|-------|
| Recurring Deposit - User Details | `/pfm/api/v2/recurring-deposit/user-details` | 4 |
| Recurring Deposit - Linked Accounts | `/pfm/api/v2/recurring-deposit/user-linked-accounts` | 1 FIP |

### Mutual Fund APIs
| API | Endpoint | Items |
|-----|----------|-------|
| Mutual Fund - User Details | `/pfm/api/v2/mutual-fund/user-details` | 4 |
| Mutual Fund - Linked Accounts | `/pfm/api/v2/mutual-fund/user-linked-accounts` | 1 FIP |
| Mutual Fund - Holding Folio | `/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio` | 10 holdings |
| Mutual Fund - Insights | `/pfm/api/v2/mutual-fund/insights` | 11 holdings |
| Mutual Fund - Analysis | `/pfm/api/v2/mutual-fund/analysis` | 6 categories |

### ETF APIs
| API | Endpoint | Items |
|-----|----------|-------|
| ETF - Linked Accounts | `/pfm/api/v2/etf/user-linked-accounts` | 1 FIP |
| ETF - Insights | `/pfm/api/v2/etf/insights` | 5 holdings |

### Equities APIs
| API | Endpoint | Items |
|-----|----------|-------|
| Equities - Linked Accounts | `/pfm/api/v2/equities/user-linked-accounts` | 1 FIP |
| Equities - Holding Broker | `/pfm/api/v2/equities/user-linked-accounts/holding-broker` | 12 holdings |
| Equities - Demat Holding | `/pfm/api/v2/equities/user-linked-accounts/demat-holding` | 6 demats |
| Equities - Broker Holding | `/pfm/api/v2/equities/user-linked-accounts/broker-holding` | 6 brokers |

### General APIs
| API | Endpoint | Items |
|-----|----------|-------|
| User Details | `/pfm/api/v2/user-details` | 4 |
| FIPs List | `/pfm/api/v2/fips` | 405 FIPs |
| Brokers List | `/pfm/api/v2/brokers` | 1015 brokers |

---

## ⚠️ EMPTY RESPONSE APIs (1)

These APIs return empty arrays/objects:

| API | Endpoint | Response | Reason |
|-----|----------|----------|--------|
| Mutual Fund - Account Statement | `/pfm/api/v2/mutual-fund/user-account-statement` | `[]` | No transactions for this user |

**Fix:** This is likely because the test user has no mutual fund transactions in the date range.

---

## ❌ ERROR APIs (6)

These APIs return errors:

### 1. User Subscriptions
| Endpoint | `/pfm/api/v2/user-subscriptions` |
|----------|-----------------------------------|
| Status | 400 Bad Request |
| Message | "Invalid Request" |
| **Fix** | This endpoint expects different parameters. Check Postman collection for correct body. |

### 2. Term Deposit - Account Statement
| Endpoint | `/pfm/api/v2/term-deposit/user-account-statement` |
|----------|---------------------------------------------------|
| Status | 406 Not Acceptable |
| Message | "Account is not linked" |
| **Fix** | Need to use a valid `accountId` from the linked accounts response. |

### 3. Recurring Deposit - Account Statement
| Endpoint | `/pfm/api/v2/recurring-deposit/user-account-statement` |
|----------|--------------------------------------------------------|
| Status | 406 Not Acceptable |
| Message | "Account is not linked" |
| **Fix** | Need to use a valid `accountId` from the linked accounts response. |

### 4. ETF - Account Statement
| Endpoint | `/pfm/api/v2/etf/user-account-statement` |
|----------|------------------------------------------|
| Status | 406 Not Acceptable |
| Message | "Account is not linked" |
| **Fix** | Need to use a valid `accountId` from the linked accounts response. |

### 5. Equities - Account Statement
| Endpoint | `/pfm/api/v2/equities/user-account-statement` |
|----------|-----------------------------------------------|
| Status | 406 Not Acceptable |
| Message | "Account is not linked" |
| **Fix** | Need to use a valid `accountId` from the linked accounts response. |

### 6. Account Consents Latest
| Endpoint | `/pfm/api/v2/account-consents-latest` |
|----------|---------------------------------------|
| Status | 400 Bad Request |
| Message | "Invalid Request" |
| **Fix** | Check if additional parameters are required (e.g., `accountId`). |

---

## 📋 APIs Not Yet Tested

These APIs from the Postman collection were not tested yet:

| Category | API | Notes |
|----------|-----|-------|
| User Subscriptions | Add user subscription | Requires different payload |
| User Subscriptions | Update user subscription | Requires different payload |
| Mutual Fund | MFC Consent Request | Requires PAN |
| Mutual Fund | MFC Consent Approve | Requires OTP flow |
| NPS | User Linked Accounts | Different user may have data |
| General | Submit Consent Request Plus | Requires redirect URL |
| General | User Account Delink | Would delink an account |
| General | FI Request Account | Not tested |
| General | FI Request User | Not tested |
| Deposit | Statement Download | Returns file, not JSON |

---

## 🔧 How to Fix Error APIs

### Account Statement Errors (406 - Account not linked)

The error occurs because we're using a hardcoded `accountId` that doesn't match the user's linked accounts.

**Solution:** Dynamically fetch the correct `accountId`:

```typescript
// Step 1: Get linked accounts
const linkedAccounts = await makeAuthenticatedRequest(
  '/pfm/api/v2/term-deposit/user-linked-accounts',
  { uniqueIdentifier: '8956545791' }
);

// Step 2: Extract accountId from first account
const accountId = linkedAccounts.fipData[0]?.linkedAccounts[0]?.accountRefNumber;

// Step 3: Use it for statement
const statement = await makeAuthenticatedRequest(
  '/pfm/api/v2/term-deposit/user-account-statement',
  { 
    uniqueIdentifier: '8956545791',
    accountId: accountId,
    dateRangeFrom: '2024-01-01'
  }
);
```

### User Subscriptions Error (400 - Invalid Request)

The GET endpoint for subscriptions may not exist. The Postman collection shows only PUT and POST methods.

---

## 🎯 Recommendations

1. **Fix Account Statement APIs**: Implement dynamic `accountId` fetching (like we did for Deposit Insights)

2. **Test with Different Users**: Some APIs may return data for different `uniqueIdentifier` values

3. **MFC APIs**: These require an OTP flow and can't be automated easily

4. **Add Missing Endpoints to UI**: 
   - ETF Insights ✅ (working, add to UI)
   - Equities Holding Broker ✅ (working, add to UI)
   - Equities Demat Holding ✅ (working, add to UI)
   - Mutual Fund Analysis ✅ (working, add to UI)

---

## 🚀 Run the Test Again

```bash
cd /Users/pragyatripathi/Desktop/HandaUncle/NfinvuHU
npx tsx scripts/test-all-apis.ts
```

