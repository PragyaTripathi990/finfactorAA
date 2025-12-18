/**
 * API Field Presence Check Script
 * 
 * This script:
 * 1. Calls all APIs
 * 2. Logs which fields are present in API responses
 * 3. Compares with what we're storing
 * 4. Identifies fields that API doesn't send
 * 
 * Run with: npm run check:api-fields
 */

import { makeAuthenticatedRequest } from '../lib/finfactor';

interface FieldPresence {
  always: string[];
  sometimes: string[];
  never: string[];
  sampleValue: any;
}

const apiFieldAnalysis: Record<string, FieldPresence> = {};

/**
 * Helper to call API
 */
async function callAPI(endpoint: string, body: any): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(endpoint, body);
    if (response && typeof response === 'object') {
      if (response.success && response.data) return response.data;
      if (response.data && !response.success) return response.data;
      if (!response.success && !response.message) return response;
    }
    return response || null;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return null;
  }
}

/**
 * Extract all field names from an object (recursively)
 */
function extractFields(obj: any, prefix: string = ''): string[] {
  const fields: string[] = [];
  
  if (obj === null || obj === undefined) {
    return fields;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      // Check first element
      fields.push(...extractFields(obj[0], prefix));
    }
    return fields;
  }
  
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      fields.push(fullKey);
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        fields.push(...extractFields(value, fullKey));
      } else if (Array.isArray(value) && value.length > 0) {
        fields.push(...extractFields(value[0], fullKey));
      }
    }
  }
  
  return fields;
}

/**
 * Check Deposit Accounts API
 */
async function checkDepositAccounts() {
  console.log('\n💰 Checking Deposit Accounts API...');
  
  const uniqueIdentifier = '8956545791';
  const response = await callAPI('/pfm/api/v2/deposit/user-linked-accounts', {
    uniqueIdentifier: uniqueIdentifier,
  });
  
  if (!response) {
    console.log('   ⚠️ No response from API');
    return;
  }
  
  console.log('   📝 API Response Structure:');
  console.log('   ', JSON.stringify(Object.keys(response), null, 2));
  
  // Extract fields from linked accounts
  const allFields = new Set<string>();
  const sampleAccount: any = {};
  
  if (response.fipData && Array.isArray(response.fipData)) {
    for (const fip of response.fipData) {
      if (fip.linkedAccounts && Array.isArray(fip.linkedAccounts)) {
        for (const account of fip.linkedAccounts) {
          const fields = extractFields(account);
          fields.forEach(f => allFields.add(f));
          
          // Store first account as sample
          if (Object.keys(sampleAccount).length === 0) {
            Object.assign(sampleAccount, account);
          }
        }
      }
    }
  }
  
  console.log(`\n   ✅ Found ${allFields.size} unique fields in API response`);
  console.log('\n   📋 All Fields in API:');
  Array.from(allFields).sort().forEach(field => {
    console.log(`      - ${field}`);
  });
  
  // Check which fields we're NOT storing
  const fieldsWeStore = [
    'fiDataId',
    'accountType',
    'maskedAccNumber',
    'accountRefNumber',
    'dataFetched',
    'accountName',
    'lastFetchDateTime',
    'fipId',
    'fipName',
  ];
  
  const fieldsNotStored = Array.from(allFields).filter(f => 
    !fieldsWeStore.some(stored => f.includes(stored))
  );
  
  console.log('\n   ❌ Fields in API but NOT being stored:');
  fieldsNotStored.forEach(field => {
    console.log(`      - ${field}`);
  });
  
  // Store analysis
  apiFieldAnalysis['deposit_accounts'] = {
    always: Array.from(allFields),
    sometimes: [],
    never: [],
    sampleValue: sampleAccount,
  };
}

/**
 * Check Recurring Deposit API
 */
async function checkRecurringDeposits() {
  console.log('\n🔄 Checking Recurring Deposit API...');
  
  const uniqueIdentifier = '8956545791';
  const response = await callAPI('/pfm/api/v2/recurring-deposit/user-linked-accounts', {
    uniqueIdentifier: uniqueIdentifier,
  });
  
  if (!response) {
    console.log('   ⚠️ No response from API');
    return;
  }
  
  const allFields = new Set<string>();
  const sampleAccount: any = {};
  
  if (response.fipData && Array.isArray(response.fipData)) {
    for (const fip of response.fipData) {
      if (fip.linkedAccounts && Array.isArray(fip.linkedAccounts)) {
        for (const account of fip.linkedAccounts) {
          const fields = extractFields(account);
          fields.forEach(f => allFields.add(f));
          
          if (Object.keys(sampleAccount).length === 0) {
            Object.assign(sampleAccount, account);
          }
        }
      }
    }
  }
  
  console.log(`   ✅ Found ${allFields.size} unique fields`);
  console.log('\n   📋 All Fields:');
  Array.from(allFields).sort().forEach(field => {
    console.log(`      - ${field}`);
  });
  
  apiFieldAnalysis['recurring_deposits'] = {
    always: Array.from(allFields),
    sometimes: [],
    never: [],
    sampleValue: sampleAccount,
  };
}

/**
 * Check Mutual Fund Holdings API
 */
async function checkMutualFunds() {
  console.log('\n📈 Checking Mutual Fund Holdings API...');
  
  const uniqueIdentifier = '8956545791';
  const response = await callAPI('/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio', {
    uniqueIdentifier: uniqueIdentifier,
  });
  
  if (!response) {
    console.log('   ⚠️ No response from API');
    return;
  }
  
  const allFields = new Set<string>();
  const sampleHolding: any = {};
  
  if (response.holdings && Array.isArray(response.holdings)) {
    for (const holding of response.holdings) {
      const fields = extractFields(holding);
      fields.forEach(f => allFields.add(f));
      
      if (Object.keys(sampleHolding).length === 0) {
        Object.assign(sampleHolding, holding);
      }
    }
  }
  
  console.log(`   ✅ Found ${allFields.size} unique fields`);
  console.log('\n   📋 All Fields:');
  Array.from(allFields).sort().forEach(field => {
    console.log(`      - ${field}`);
  });
  
  apiFieldAnalysis['mutual_fund_holdings'] = {
    always: Array.from(allFields),
    sometimes: [],
    never: [],
    sampleValue: sampleHolding,
  };
}

/**
 * Check Equities Holdings API
 */
async function checkEquities() {
  console.log('\n📊 Checking Equities Holdings API...');
  
  const uniqueIdentifier = '8956545791';
  const response = await callAPI('/pfm/api/v2/equities/user-linked-accounts/holding-broker', {
    uniqueIdentifier: uniqueIdentifier,
    filterZeroValueAccounts: 'false',
    filterZeroValueHoldings: 'false',
  });
  
  if (!response) {
    console.log('   ⚠️ No response from API');
    return;
  }
  
  const allFields = new Set<string>();
  const sampleHolding: any = {};
  
  if (response.holdings && Array.isArray(response.holdings)) {
    for (const holding of response.holdings) {
      const fields = extractFields(holding);
      fields.forEach(f => allFields.add(f));
      
      if (Object.keys(sampleHolding).length === 0) {
        Object.assign(sampleHolding, holding);
      }
    }
  }
  
  console.log(`   ✅ Found ${allFields.size} unique fields`);
  console.log('\n   📋 All Fields:');
  Array.from(allFields).sort().forEach(field => {
    console.log(`      - ${field}`);
  });
  
  apiFieldAnalysis['equity_holdings'] = {
    always: Array.from(allFields),
    sometimes: [],
    never: [],
    sampleValue: sampleHolding,
  };
}

/**
 * Generate Summary Report
 */
function generateSummaryReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 API FIELD PRESENCE SUMMARY');
  console.log('='.repeat(70));
  
  for (const [endpoint, analysis] of Object.entries(apiFieldAnalysis)) {
    console.log(`\n📌 ${endpoint}:`);
    console.log(`   Total fields in API: ${analysis.always.length}`);
    console.log(`   Sample fields: ${analysis.always.slice(0, 10).join(', ')}...`);
  }
  
  console.log('\n💡 This tells us:');
  console.log('   1. What fields API actually sends');
  console.log('   2. What fields we should be storing');
  console.log('   3. What fields are missing from our schema');
}

/**
 * Main function
 */
async function checkAPIFields() {
  console.log('🚀 Starting API Field Presence Check...\n');
  console.log('📋 This will show what fields the API actually sends\n');
  
  await checkDepositAccounts();
  await checkRecurringDeposits();
  await checkMutualFunds();
  await checkEquities();
  
  generateSummaryReport();
  
  console.log('\n✨ API field check completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Compare API fields with schema fields');
  console.log('   2. Add missing fields to schema (migration)');
  console.log('   3. Update seed script to capture all fields');
}

// Run the check
checkAPIFields().catch(console.error);

