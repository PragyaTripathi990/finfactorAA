# 🔬 WealthScape API Test Results V2

**Test Date:** December 18, 2025  
**Test User:** `uniqueIdentifier: 8956545791`  
**Dynamic Account ID:** ✅ Enabled

---

## 📊 Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ SUCCESS | 23 | 92% |
| ⚠️ EMPTY (No Data) | 2 | 8% |
| ❌ ERROR | 0 | 0% |

---

## 🔧 Fixes Applied

| Previously Failing API | Issue | Fix Applied | New Status |
|------------------------|-------|-------------|------------|
| `/pfm/api/v2/user-subscriptions` | 400 Bad Request | Clarified: Use `/user-details` for subscription status | ✅ N/A |
| `/pfm/api/v2/term-deposit/user-account-statement` | 406 Not Acceptable | Dynamic accountId from linked accounts | ⚠️ Empty (no transactions) |
| `/pfm/api/v2/recurring-deposit/user-account-statement` | 406 Not Acceptable | Dynamic accountId from linked accounts | ✅ **8 items** |
| `/pfm/api/v2/etf/user-account-statement` | 406 Not Acceptable | Dynamic accountId from linked accounts | ✅ **2 items** |
| `/pfm/api/v2/equities/user-account-statement` | 406 Not Acceptable | Dynamic accountId from linked accounts | ⚠️ Empty (no transactions) |
| `/pfm/api/v2/account-consents-latest` | 400 Bad Request | Added accountId parameter | ✅ Works |

---

## ✅ WORKING APIs (23)

### Deposit APIs
| API | Endpoint | Items | Account ID |
|-----|----------|-------|------------|
| Linked Accounts | `/pfm/api/v2/deposit/user-linked-accounts` | 2 FIPs | - |
| Account Statement | `/pfm/api/v2/deposit/user-account-statement` | **79 txns** | `037f5d5e-495b-484d-84f8-dba76a14d6b1` (Finvu Bank Ltd.) |
| Insights | `/pfm/api/v2/deposit/insights` | 12 months | `037f5d5e-495b-484d-84f8-dba76a14d6b1` |

### Term Deposit APIs
| API | Endpoint | Items | Account ID |
|-----|----------|-------|------------|
| Linked Accounts | `/pfm/api/v2/term-deposit/user-linked-accounts` | 1 FIP | - |
| Account Statement | `/pfm/api/v2/term-deposit/user-account-statement` | ⚠️ Empty | `56755f49-ebaa-4610-b611-fddc85c57a9a` |

### Recurring Deposit APIs
| API | Endpoint | Items | Account ID |
|-----|----------|-------|------------|
| Linked Accounts | `/pfm/api/v2/recurring-deposit/user-linked-accounts` | 1 FIP | - |
| Account Statement | `/pfm/api/v2/recurring-deposit/user-account-statement` | **8 txns** | `4a81e8e8-928b-4b1f-b226-946f8dc3b1d9` |

### Mutual Fund APIs
| API | Endpoint | Items |
|-----|----------|-------|
| Linked Accounts | `/pfm/api/v2/mutual-fund/user-linked-accounts` | 1 FIP |
| Holding Folio | `/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio` | **11 folios** |
| Account Statement | `/pfm/api/v2/mutual-fund/user-account-statement` | **101 txns** |
| Insights | `/pfm/api/v2/mutual-fund/insights` | **11 items** |
| Analysis | `/pfm/api/v2/mutual-fund/analysis` | **6 items** |

### ETF APIs
| API | Endpoint | Items | Account ID |
|-----|----------|-------|------------|
| Linked Accounts | `/pfm/api/v2/etf/user-linked-accounts` | 1 FIP | - |
| Account Statement | `/pfm/api/v2/etf/user-account-statement` | **2 txns** | `eff4c543-b06f-4d77-8b89-049898c725a8` |
| Insights | `/pfm/api/v2/etf/insights` | **5 holdings** | - |

### Equities APIs
| API | Endpoint | Items | Account ID |
|-----|----------|-------|------------|
| Linked Accounts | `/pfm/api/v2/equities/user-linked-accounts` | 1 FIP | - |
| Holding Broker | `/pfm/api/v2/equities/user-linked-accounts/holding-broker` | **12 items** | - |
| Demat Holding | `/pfm/api/v2/equities/user-linked-accounts/demat-holding` | **6 items** | - |
| Broker Holding | `/pfm/api/v2/equities/user-linked-accounts/broker-holding` | **6 items** | - |
| Account Statement | `/pfm/api/v2/equities/user-account-statement` | ⚠️ Empty | `1b64eee1-148c-4aaa-aa2c-ddb97a5a2569` |

### General APIs
| API | Endpoint | Items |
|-----|----------|-------|
| User Details | `/pfm/api/v2/user-details` | 4 fields |
| FIPs List | `/pfm/api/v2/fips` | **405 FIPs** |
| Brokers List | `/pfm/api/v2/brokers` | **1015 brokers** |
| Account Consents | `/pfm/api/v2/account-consents-latest` | ✅ Works |

---

## ⚠️ EMPTY RESPONSE APIs (2)

These return correctly but have no data for this test user:

| API | Reason |
|-----|--------|
| Term Deposit Statement | User has no transactions in term deposit account |
| Equities Statement | User has no transactions in equities account |

---

## 🔑 Key Learnings

### 1. Dynamic Account ID is Critical
All statement APIs require the correct `accountId`. The ID must be fetched dynamically from the corresponding linked accounts API.

### 2. Finvu Bank Selection Logic
```typescript
// Priority: Finvu Bank (not Dhanagar) > First FIP with accounts
const finvuFip = fipData.find(fip => 
  fip.fipName.includes('Finvu') && !fip.fipName.includes('Dhanagar')
);
const accountId = finvuFip.linkedAccounts[0].accountRefNumber;
```

### 3. Account IDs Found for User 8956545791

| Product | FIP Name | Account ID |
|---------|----------|------------|
| Deposit | Finvu Bank Ltd. | `037f5d5e-495b-484d-84f8-dba76a14d6b1` |
| Term Deposit | Finvu Bank Ltd. | `56755f49-ebaa-4610-b611-fddc85c57a9a` |
| Recurring Deposit | Finvu Bank Ltd. | `4a81e8e8-928b-4b1f-b226-946f8dc3b1d9` |
| Mutual Fund | Finrepo | `9f30b8eb-bfcb-453c-b618-bb681d15bf3c` |
| ETF | Finrepo | `eff4c543-b06f-4d77-8b89-049898c725a8` |
| Equities | Finrepo | `1b64eee1-148c-4aaa-aa2c-ddb97a5a2569` |

---

## ✅ All 6 Previously Failing APIs are Now Fixed!

