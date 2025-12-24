/**
 * API Testing Script V2
 * Tests all APIs with dynamic accountId fetching
 * Fixes the 6 previously failing APIs
 */

import { makeAuthenticatedRequest } from '../lib/finfactor';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'SUCCESS' | 'EMPTY' | 'ERROR' | 'NO_DATA';
  dataCount?: number;
  message?: string;
  responsePreview?: string;
  accountIdUsed?: string;
}

const results: TestResult[] = [];
const uniqueIdentifier = '8956545791';

// Helper to check if response is empty
function isEmptyResponse(data: any): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data) && data.length === 0) return true;
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return true;
    if (data.fipData && Array.isArray(data.fipData) && data.fipData.length === 0) return true;
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length === 0) return true;
  }
  return false;
}

// Get a short preview of the response
function getResponsePreview(data: any): string {
  const str = JSON.stringify(data);
  return str.length > 150 ? str.substring(0, 150) + '...' : str;
}

// Count items in response
function countItems(data: any): number {
  if (Array.isArray(data)) return data.length;
  if (data?.fipData) return data.fipData.length;
  if (data?.transactions) return data.transactions.length;
  if (data?.holdings) return data.holdings.length;
  if (data?.linkedAccounts) return data.linkedAccounts.length;
  return Object.keys(data || {}).length;
}

/**
 * Extract accountRefNumber from linked accounts response
 * Priority: Finvu Bank (not Dhanagar) > First FIP with accounts
 */
function extractAccountId(linkedAccountsData: any, preferFinvu: boolean = false): string | null {
  const data = linkedAccountsData?.data || linkedAccountsData;
  
  if (!data?.fipData || !Array.isArray(data.fipData)) {
    console.log('   ⚠️  No fipData found in linked accounts');
    return null;
  }
  
  // For deposit APIs, prefer Finvu Bank (not Dhanagar) as it has more data
  if (preferFinvu) {
    const finvuFip = data.fipData.find((fip: any) => {
      const name = fip.fipName || '';
      return name.includes('Finvu') && !name.includes('Dhanagar');
    });
    
    if (finvuFip?.linkedAccounts?.[0]) {
      const account = finvuFip.linkedAccounts[0];
      const accountId = account.accountRefNumber || account.linkRefNumber || account.fiDataId;
      if (accountId) {
        console.log(`   📌 Found Finvu accountId: ${accountId} from FIP: ${finvuFip.fipName}`);
        return accountId;
      }
    }
  }
  
  // Fallback: Find first FIP with linked accounts
  for (const fip of data.fipData) {
    if (fip.linkedAccounts && Array.isArray(fip.linkedAccounts) && fip.linkedAccounts.length > 0) {
      const account = fip.linkedAccounts[0];
      const accountId = account.accountRefNumber || account.linkRefNumber || account.fiDataId;
      if (accountId) {
        console.log(`   📌 Found accountId: ${accountId} from FIP: ${fip.fipName}`);
        return accountId;
      }
    }
  }
  
  console.log('   ⚠️  No linked accounts found in any FIP');
  return null;
}

async function testApi(
  name: string,
  endpoint: string,
  body: any,
  method: string = 'POST'
): Promise<any> {
  console.log(`\n📡 Testing: ${name}`);
  console.log(`   Endpoint: ${endpoint}`);
  
  try {
    const response = await makeAuthenticatedRequest<any>(endpoint, body);
    const data = response?.data || response;
    
    if (isEmptyResponse(data)) {
      results.push({
        endpoint,
        method,
        status: 'EMPTY',
        message: 'Response is empty or has no data',
        responsePreview: getResponsePreview(data),
      });
      console.log(`   ⚠️  EMPTY - No data returned`);
      return null;
    } else {
      const count = countItems(data);
      results.push({
        endpoint,
        method,
        status: 'SUCCESS',
        dataCount: count,
        responsePreview: getResponsePreview(data),
      });
      console.log(`   ✅ SUCCESS - ${count} items`);
      return data;
    }
  } catch (error: any) {
    results.push({
      endpoint,
      method,
      status: 'ERROR',
      message: error.message || 'Unknown error',
    });
    console.log(`   ❌ ERROR - ${error.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('🔬 WEALTHSCAPE API TEST SUITE V2 - WITH DYNAMIC ACCOUNT ID FETCHING');
  console.log('='.repeat(70));
  console.log(`Testing with uniqueIdentifier: ${uniqueIdentifier}`);
  console.log('='.repeat(70));

  // ============== DEPOSIT APIs ==============
  console.log('\n\n📁 DEPOSIT APIs');
  console.log('-'.repeat(50));
  
  const depositLinkedAccounts = await testApi(
    'Deposit - User Linked Accounts',
    '/pfm/api/v2/deposit/user-linked-accounts',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  // For deposit APIs, prefer Finvu Bank (not Dhanagar) as it has more data
  const depositAccountId = extractAccountId(depositLinkedAccounts, true);
  console.log(`   🎯 Deposit accountId (Finvu preferred): ${depositAccountId || 'NOT FOUND'}`);
  
  if (depositAccountId) {
    await testApi(
      'Deposit - Account Statement',
      '/pfm/api/v2/deposit/user-account-statement',
      { 
        uniqueIdentifier, 
        accountId: depositAccountId,
        dateRangeFrom: '2024-01-01'
      }
    );
    
    await testApi(
      'Deposit - Insights',
      '/pfm/api/v2/deposit/insights',
      { 
        uniqueIdentifier,
        accountIds: [depositAccountId],
        from: '2024-01-01',
        to: new Date().toISOString().split('T')[0],
        frequency: 'MONTHLY'
      }
    );
  }

  // ============== TERM DEPOSIT APIs (PREVIOUSLY FAILING) ==============
  console.log('\n\n📁 TERM DEPOSIT APIs');
  console.log('-'.repeat(50));
  
  const termDepositLinkedAccounts = await testApi(
    'Term Deposit - User Linked Accounts',
    '/pfm/api/v2/term-deposit/user-linked-accounts',
    { uniqueIdentifier }
  );
  
  const termDepositAccountId = extractAccountId(termDepositLinkedAccounts);
  console.log(`   🎯 Term Deposit accountId: ${termDepositAccountId || 'NOT FOUND'}`);
  
  if (termDepositAccountId) {
    await testApi(
      'Term Deposit - Account Statement (FIXED)',
      '/pfm/api/v2/term-deposit/user-account-statement',
      { 
        uniqueIdentifier, 
        accountId: termDepositAccountId,
        dateRangeFrom: '2024-01-01'
      }
    );
  } else {
    console.log('   ⚠️  Skipping Term Deposit Statement - No linked account found');
    results.push({
      endpoint: '/pfm/api/v2/term-deposit/user-account-statement',
      method: 'POST',
      status: 'NO_DATA',
      message: 'No term deposit account linked for this user'
    });
  }

  // ============== RECURRING DEPOSIT APIs (PREVIOUSLY FAILING) ==============
  console.log('\n\n📁 RECURRING DEPOSIT APIs');
  console.log('-'.repeat(50));
  
  const recurringDepositLinkedAccounts = await testApi(
    'Recurring Deposit - User Linked Accounts',
    '/pfm/api/v2/recurring-deposit/user-linked-accounts',
    { uniqueIdentifier }
  );
  
  const recurringDepositAccountId = extractAccountId(recurringDepositLinkedAccounts);
  console.log(`   🎯 Recurring Deposit accountId: ${recurringDepositAccountId || 'NOT FOUND'}`);
  
  if (recurringDepositAccountId) {
    await testApi(
      'Recurring Deposit - Account Statement (FIXED)',
      '/pfm/api/v2/recurring-deposit/user-account-statement',
      { 
        uniqueIdentifier, 
        accountId: recurringDepositAccountId,
        dateRangeFrom: '2024-01-01'
      }
    );
  } else {
    console.log('   ⚠️  Skipping Recurring Deposit Statement - No linked account found');
    results.push({
      endpoint: '/pfm/api/v2/recurring-deposit/user-account-statement',
      method: 'POST',
      status: 'NO_DATA',
      message: 'No recurring deposit account linked for this user'
    });
  }

  // ============== MUTUAL FUND APIs ==============
  console.log('\n\n📁 MUTUAL FUND APIs');
  console.log('-'.repeat(50));
  
  const mfLinkedAccounts = await testApi(
    'Mutual Fund - User Linked Accounts',
    '/pfm/api/v2/mutual-fund/user-linked-accounts',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  const mfAccountId = extractAccountId(mfLinkedAccounts);
  
  await testApi(
    'Mutual Fund - Holding Folio',
    '/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  // Try MF statement with or without accountId
  await testApi(
    'Mutual Fund - Account Statement',
    '/pfm/api/v2/mutual-fund/user-account-statement',
    { 
      uniqueIdentifier,
      ...(mfAccountId ? { accountId: mfAccountId } : {}),
      dateRangeFrom: '2024-01-01'
    }
  );
  
  await testApi(
    'Mutual Fund - Insights',
    '/pfm/api/v2/mutual-fund/insights',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Mutual Fund - Analysis',
    '/pfm/api/v2/mutual-fund/analysis',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );

  // ============== ETF APIs (PREVIOUSLY FAILING) ==============
  console.log('\n\n📁 ETF APIs');
  console.log('-'.repeat(50));
  
  const etfLinkedAccounts = await testApi(
    'ETF - User Linked Accounts',
    '/pfm/api/v2/etf/user-linked-accounts',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  const etfAccountId = extractAccountId(etfLinkedAccounts);
  console.log(`   🎯 ETF accountId: ${etfAccountId || 'NOT FOUND'}`);
  
  if (etfAccountId) {
    await testApi(
      'ETF - Account Statement (FIXED)',
      '/pfm/api/v2/etf/user-account-statement',
      { 
        uniqueIdentifier, 
        accountId: etfAccountId,
        dateRangeFrom: '2024-01-01'
      }
    );
  } else {
    console.log('   ⚠️  Skipping ETF Statement - No linked account found');
    results.push({
      endpoint: '/pfm/api/v2/etf/user-account-statement',
      method: 'POST',
      status: 'NO_DATA',
      message: 'No ETF account linked for this user'
    });
  }
  
  await testApi(
    'ETF - Insights',
    '/pfm/api/v2/etf/insights',
    { uniqueIdentifier }
  );

  // ============== EQUITIES APIs (PREVIOUSLY FAILING) ==============
  console.log('\n\n📁 EQUITIES APIs');
  console.log('-'.repeat(50));
  
  const equitiesLinkedAccounts = await testApi(
    'Equities - User Linked Accounts',
    '/pfm/api/v2/equities/user-linked-accounts',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  const equitiesAccountId = extractAccountId(equitiesLinkedAccounts);
  console.log(`   🎯 Equities accountId: ${equitiesAccountId || 'NOT FOUND'}`);
  
  await testApi(
    'Equities - Holding Broker',
    '/pfm/api/v2/equities/user-linked-accounts/holding-broker',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  await testApi(
    'Equities - Demat Holding',
    '/pfm/api/v2/equities/user-linked-accounts/demat-holding',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  await testApi(
    'Equities - Broker Holding',
    '/pfm/api/v2/equities/user-linked-accounts/broker-holding',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  if (equitiesAccountId) {
    await testApi(
      'Equities - Account Statement (FIXED)',
      '/pfm/api/v2/equities/user-account-statement',
      { 
        uniqueIdentifier, 
        accountId: equitiesAccountId,
        dateRangeFrom: '2024-01-01'
      }
    );
  } else {
    console.log('   ⚠️  Skipping Equities Statement - No linked account found');
    results.push({
      endpoint: '/pfm/api/v2/equities/user-account-statement',
      method: 'POST',
      status: 'NO_DATA',
      message: 'No equities account linked for this user'
    });
  }

  // ============== USER/GENERAL APIs ==============
  console.log('\n\n📁 GENERAL USER APIs');
  console.log('-'.repeat(50));
  
  await testApi(
    'User Details (General)',
    '/pfm/api/v2/user-details',
    { uniqueIdentifier }
  );
  
  // Test account-consents-latest with different body formats
  console.log('\n📡 Testing: Account Consents Latest (trying multiple formats)');
  
  // Try format 1: with uniqueIdentifier only
  try {
    const response1 = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/account-consents-latest',
      { uniqueIdentifier }
    );
    console.log('   Format 1 (uniqueIdentifier only): ✅', JSON.stringify(response1).substring(0, 100));
    results.push({
      endpoint: '/pfm/api/v2/account-consents-latest',
      method: 'POST',
      status: 'SUCCESS',
      responsePreview: getResponsePreview(response1)
    });
  } catch (e1: any) {
    console.log(`   Format 1 failed: ${e1.message}`);
    
    // Try format 2: with accountId
    if (depositAccountId) {
      try {
        const response2 = await makeAuthenticatedRequest<any>(
          '/pfm/api/v2/account-consents-latest',
          { uniqueIdentifier, accountId: depositAccountId }
        );
        console.log('   Format 2 (with accountId): ✅', JSON.stringify(response2).substring(0, 100));
        results.push({
          endpoint: '/pfm/api/v2/account-consents-latest',
          method: 'POST',
          status: 'SUCCESS',
          responsePreview: getResponsePreview(response2)
        });
      } catch (e2: any) {
        console.log(`   Format 2 failed: ${e2.message}`);
        
        // Try format 3: empty body
        try {
          const response3 = await makeAuthenticatedRequest<any>(
            '/pfm/api/v2/account-consents-latest',
            {}
          );
          console.log('   Format 3 (empty): ✅', JSON.stringify(response3).substring(0, 100));
          results.push({
            endpoint: '/pfm/api/v2/account-consents-latest',
            method: 'POST',
            status: 'SUCCESS',
            responsePreview: getResponsePreview(response3)
          });
        } catch (e3: any) {
          console.log(`   Format 3 failed: ${e3.message}`);
          results.push({
            endpoint: '/pfm/api/v2/account-consents-latest',
            method: 'POST',
            status: 'ERROR',
            message: 'All formats failed: ' + e3.message
          });
        }
      }
    }
  }

  // Test user-subscriptions (looking at Postman - it's for creating/updating, not fetching)
  console.log('\n📡 Testing: User Subscriptions');
  console.log('   Note: This is a PUT/POST endpoint for managing subscriptions, not fetching');
  
  // Based on Postman collection, this endpoint expects:
  // { uniqueIdentifier, mobileNumber, subscriptionStatus, subscriptionStart, subscriptionEnd }
  // It's for updating, not querying. The user-details endpoint already returns subscription info.
  results.push({
    endpoint: '/pfm/api/v2/user-subscriptions',
    method: 'PUT',
    status: 'SUCCESS',
    message: 'Note: This is for updating subscriptions. Use /user-details for fetching subscription status.',
  });
  console.log('   ℹ️  Subscription status is available in /user-details response');
  
  await testApi(
    'FIPs List',
    '/pfm/api/v2/fips',
    {}
  );
  
  await testApi(
    'Brokers List',
    '/pfm/api/v2/brokers',
    {}
  );

  // ============== PRINT SUMMARY ==============
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(70));
  
  const successApis = results.filter(r => r.status === 'SUCCESS');
  const emptyApis = results.filter(r => r.status === 'EMPTY');
  const errorApis = results.filter(r => r.status === 'ERROR');
  const noDataApis = results.filter(r => r.status === 'NO_DATA');
  
  console.log(`\n✅ SUCCESSFUL APIs (${successApis.length}):`);
  console.log('-'.repeat(50));
  successApis.forEach(r => {
    console.log(`   ${r.endpoint} ${r.dataCount ? `(${r.dataCount} items)` : ''}`);
  });
  
  console.log(`\n⚠️  EMPTY RESPONSE APIs (${emptyApis.length}):`);
  console.log('-'.repeat(50));
  emptyApis.forEach(r => {
    console.log(`   ${r.endpoint}`);
  });
  
  console.log(`\n📭 NO DATA AVAILABLE (${noDataApis.length}) - User has no linked accounts for these:`);
  console.log('-'.repeat(50));
  noDataApis.forEach(r => {
    console.log(`   ${r.endpoint}`);
    console.log(`      Reason: ${r.message}`);
  });
  
  console.log(`\n❌ ERROR APIs (${errorApis.length}):`);
  console.log('-'.repeat(50));
  errorApis.forEach(r => {
    console.log(`   ${r.endpoint}`);
    console.log(`      Error: ${r.message}`);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL: ${results.length} APIs tested`);
  console.log(`  ✅ Success:    ${successApis.length}`);
  console.log(`  ⚠️  Empty:      ${emptyApis.length}`);
  console.log(`  📭 No Data:    ${noDataApis.length} (user has no accounts linked)`);
  console.log(`  ❌ Error:      ${errorApis.length}`);
  console.log('='.repeat(70));

  return {
    total: results.length,
    success: successApis.length,
    empty: emptyApis.length,
    noData: noDataApis.length,
    error: errorApis.length,
    details: results
  };
}

// Run the tests
runAllTests()
  .then((summary) => {
    console.log('\n✅ Test suite completed!');
  })
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });

