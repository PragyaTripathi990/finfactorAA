/**
 * API Testing Script
 * Tests all 52 APIs from the WealthScape Postman collection
 * Reports which ones return data, empty, or errors
 */

import { makeAuthenticatedRequest } from '../lib/finfactor';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'SUCCESS' | 'EMPTY' | 'ERROR' | 'NO_DATA';
  dataCount?: number;
  message?: string;
  responsePreview?: string;
}

const results: TestResult[] = [];

// Helper to check if response is empty
function isEmptyResponse(data: any): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data) && data.length === 0) return true;
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return true;
    // Check for common "empty" patterns
    if (data.fipData && Array.isArray(data.fipData) && data.fipData.length === 0) return true;
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length === 0) return true;
  }
  return false;
}

// Get a short preview of the response
function getResponsePreview(data: any): string {
  const str = JSON.stringify(data);
  return str.length > 100 ? str.substring(0, 100) + '...' : str;
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

async function testApi(
  name: string,
  endpoint: string,
  body: any,
  method: string = 'POST'
): Promise<void> {
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
    }
  } catch (error: any) {
    results.push({
      endpoint,
      method,
      status: 'ERROR',
      message: error.message || 'Unknown error',
    });
    console.log(`   ❌ ERROR - ${error.message}`);
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🔬 WEALTHSCAPE API TEST SUITE');
  console.log('='.repeat(60));
  console.log('Testing all APIs with uniqueIdentifier: 8956545791');
  console.log('='.repeat(60));

  const uniqueIdentifier = '8956545791';
  
  // ============== USER SUBSCRIPTION APIs ==============
  console.log('\n\n📁 USER SUBSCRIPTION APIs');
  console.log('-'.repeat(40));
  
  await testApi(
    'Get User Subscriptions',
    '/pfm/api/v2/user-subscriptions',
    { uniqueIdentifier }
  );

  // ============== DEPOSIT APIs ==============
  console.log('\n\n📁 DEPOSIT APIs');
  console.log('-'.repeat(40));
  
  await testApi(
    'Deposit - User Details',
    '/pfm/api/v2/deposit/user-details',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Deposit - User Linked Accounts',
    '/pfm/api/v2/deposit/user-linked-accounts',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  await testApi(
    'Deposit - Account Statement',
    '/pfm/api/v2/deposit/user-account-statement',
    { 
      uniqueIdentifier, 
      accountId: '037f5d5e-495b-484d-84f8-dba76a14d6b1',
      dateRangeFrom: '2025-01-01'
    }
  );
  
  await testApi(
    'Deposit - Insights',
    '/pfm/api/v2/deposit/insights',
    { 
      uniqueIdentifier,
      accountIds: ['037f5d5e-495b-484d-84f8-dba76a14d6b1'],
      from: '2025-01-01',
      to: '2025-12-18',
      frequency: 'MONTHLY'
    }
  );

  // ============== TERM DEPOSIT APIs ==============
  console.log('\n\n📁 TERM DEPOSIT APIs');
  console.log('-'.repeat(40));
  
  await testApi(
    'Term Deposit - User Details',
    '/pfm/api/v2/term-deposit/user-details',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Term Deposit - User Linked Accounts',
    '/pfm/api/v2/term-deposit/user-linked-accounts',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Term Deposit - Account Statement',
    '/pfm/api/v2/term-deposit/user-account-statement',
    { 
      uniqueIdentifier, 
      accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
      dateRangeFrom: '2024-01-01'
    }
  );

  // ============== RECURRING DEPOSIT APIs ==============
  console.log('\n\n📁 RECURRING DEPOSIT APIs');
  console.log('-'.repeat(40));
  
  await testApi(
    'Recurring Deposit - User Details',
    '/pfm/api/v2/recurring-deposit/user-details',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Recurring Deposit - User Linked Accounts',
    '/pfm/api/v2/recurring-deposit/user-linked-accounts',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Recurring Deposit - Account Statement',
    '/pfm/api/v2/recurring-deposit/user-account-statement',
    { 
      uniqueIdentifier, 
      accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
      dateRangeFrom: '2024-01-01'
    }
  );

  // ============== MUTUAL FUND APIs ==============
  console.log('\n\n📁 MUTUAL FUND APIs');
  console.log('-'.repeat(40));
  
  await testApi(
    'Mutual Fund - User Details',
    '/pfm/api/v2/mutual-fund/user-details',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Mutual Fund - User Linked Accounts',
    '/pfm/api/v2/mutual-fund/user-linked-accounts',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  await testApi(
    'Mutual Fund - Holding Folio',
    '/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio',
    { uniqueIdentifier, filterZeroValueAccounts: 'true', filterZeroValueHoldings: 'true' }
  );
  
  await testApi(
    'Mutual Fund - Account Statement',
    '/pfm/api/v2/mutual-fund/user-account-statement',
    { uniqueIdentifier }
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

  // ============== ETF APIs ==============
  console.log('\n\n📁 ETF APIs');
  console.log('-'.repeat(40));
  
  await testApi(
    'ETF - User Linked Accounts',
    '/pfm/api/v2/etf/user-linked-accounts',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
  await testApi(
    'ETF - Account Statement',
    '/pfm/api/v2/etf/user-account-statement',
    { 
      uniqueIdentifier, 
      accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
      dateRangeFrom: '2024-01-01'
    }
  );
  
  await testApi(
    'ETF - Insights',
    '/pfm/api/v2/etf/insights',
    { uniqueIdentifier }
  );

  // ============== EQUITIES APIs ==============
  console.log('\n\n📁 EQUITIES APIs');
  console.log('-'.repeat(40));
  
  await testApi(
    'Equities - User Linked Accounts',
    '/pfm/api/v2/equities/user-linked-accounts',
    { uniqueIdentifier, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
  );
  
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
  
  await testApi(
    'Equities - Account Statement',
    '/pfm/api/v2/equities/user-account-statement',
    { 
      uniqueIdentifier, 
      accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
      dateRangeFrom: '2024-01-01'
    }
  );

  // ============== USER/GENERAL APIs ==============
  console.log('\n\n📁 GENERAL USER APIs');
  console.log('-'.repeat(40));
  
  await testApi(
    'User Details (General)',
    '/pfm/api/v2/user-details',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Account Consents Latest',
    '/pfm/api/v2/account-consents-latest',
    { uniqueIdentifier }
  );
  
  await testApi(
    'FIPs List',
    '/pfm/api/v2/fips',
    { uniqueIdentifier }
  );
  
  await testApi(
    'Brokers List',
    '/pfm/api/v2/brokers',
    { uniqueIdentifier }
  );

  // ============== PRINT SUMMARY ==============
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const successApis = results.filter(r => r.status === 'SUCCESS');
  const emptyApis = results.filter(r => r.status === 'EMPTY');
  const errorApis = results.filter(r => r.status === 'ERROR');
  
  console.log(`\n✅ SUCCESSFUL APIs (${successApis.length}):`);
  console.log('-'.repeat(40));
  successApis.forEach(r => {
    console.log(`   ${r.endpoint} (${r.dataCount} items)`);
  });
  
  console.log(`\n⚠️  EMPTY RESPONSE APIs (${emptyApis.length}):`);
  console.log('-'.repeat(40));
  emptyApis.forEach(r => {
    console.log(`   ${r.endpoint}`);
    if (r.responsePreview) {
      console.log(`      Preview: ${r.responsePreview}`);
    }
  });
  
  console.log(`\n❌ ERROR APIs (${errorApis.length}):`);
  console.log('-'.repeat(40));
  errorApis.forEach(r => {
    console.log(`   ${r.endpoint}`);
    console.log(`      Error: ${r.message}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${results.length} APIs tested`);
  console.log(`  ✅ Success: ${successApis.length}`);
  console.log(`  ⚠️  Empty:   ${emptyApis.length}`);
  console.log(`  ❌ Error:   ${errorApis.length}`);
  console.log('='.repeat(60));

  // Return results for further processing
  return {
    total: results.length,
    success: successApis.length,
    empty: emptyApis.length,
    error: errorApis.length,
    details: results
  };
}

// Run the tests
runAllTests()
  .then((summary) => {
    console.log('\n\n📋 JSON Summary:');
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });

