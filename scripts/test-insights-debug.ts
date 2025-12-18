/**
 * Debug script to test the deposit insights API flow
 */

import { makeAuthenticatedRequest } from '../lib/finfactor';

async function testInsights() {
  console.log('=== STEP 1: Fetch Linked Accounts ===');
  
  const linkedResponse = await makeAuthenticatedRequest<any>(
    '/pfm/api/v2/deposit/user-linked-accounts',
    {
      uniqueIdentifier: '8956545791',
      filterZeroValueAccounts: 'false',
      filterZeroValueHoldings: 'false',
    }
  );
  
  const linkedAccounts = linkedResponse.data || linkedResponse;
  console.log('FIPs found:', linkedAccounts?.fipData?.map((f: any) => f.fipName));
  
  // Find first FIP with linked accounts
  let targetFip = null;
  
  // Try Finvu first
  targetFip = linkedAccounts?.fipData?.find((fip: any) => {
    return fip.fipName?.includes('Finvu') && !fip.fipName?.includes('Dhanagar');
  });
  
  // Fallback to first available
  if (!targetFip) {
    console.log('Finvu not found, using first FIP with accounts');
    targetFip = linkedAccounts?.fipData?.find((fip: any) => 
      fip.linkedAccounts?.length > 0
    );
  }
  
  console.log('\n=== STEP 2: Found FIP ===');
  console.log('Target FIP:', targetFip?.fipName);
  console.log('Linked accounts count:', targetFip?.linkedAccounts?.length);
  
  const account = targetFip?.linkedAccounts?.[0];
  const targetId = account?.accountRefNumber;
  
  console.log('\n=== STEP 3: Account Details ===');
  console.log('Account object:', JSON.stringify(account, null, 2));
  console.log('Target ID (accountRefNumber):', targetId);
  
  if (!targetId) {
    console.error('❌ No accountId found!');
    return;
  }
  
  console.log('\n=== STEP 4: Call Insights API ===');
  const today = new Date().toISOString().split('T')[0];
  
  const requestBody = {
    uniqueIdentifier: '8956545791',
    accountIds: [targetId],
    from: '2025-01-01',
    to: today,
    frequency: 'MONTHLY',
  };
  
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  
  const insightsResponse = await makeAuthenticatedRequest<any>(
    '/pfm/api/v2/deposit/insights',
    requestBody
  );
  
  console.log('\n=== STEP 5: Insights Response ===');
  console.log('Raw response (first 500 chars):', JSON.stringify(insightsResponse).substring(0, 500));
  
  // Check different response structures
  const hasDepositInsights = !!insightsResponse?.depositInsights;
  const hasDataDepositInsights = !!insightsResponse?.data?.depositInsights;
  const hasData = !!insightsResponse?.data;
  
  console.log('\nResponse structure:');
  console.log('- Has depositInsights directly?', hasDepositInsights);
  console.log('- Has data.depositInsights?', hasDataDepositInsights);
  console.log('- Has data?', hasData);
  
  // Extract insights based on structure
  let insights = null;
  if (hasDepositInsights) {
    insights = insightsResponse.depositInsights;
    console.log('Using: response.depositInsights');
  } else if (hasDataDepositInsights) {
    insights = insightsResponse.data.depositInsights;
    console.log('Using: response.data.depositInsights');
  } else if (hasData) {
    insights = insightsResponse.data;
    console.log('Using: response.data');
  } else {
    insights = insightsResponse;
    console.log('Using: response directly');
  }
  
  console.log('\n=== STEP 6: Insights Data ===');
  console.log('- accountIds:', insights?.accountIds);
  console.log('- balance count:', insights?.balance?.length || 0);
  console.log('- incoming count:', insights?.incoming?.length || 0);
  console.log('- outgoing count:', insights?.outgoing?.length || 0);
  
  if (insights?.balance?.length > 0) {
    console.log('\nFirst balance entry:');
    console.log(JSON.stringify(insights.balance[0], null, 2));
  }
  
  console.log('\n✅ Test complete!');
}

testInsights().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

