/**
 * Data Quality Check Script
 * 
 * This script:
 * 1. Checks what fields in database are empty/null
 * 2. Compares with API responses to find missing data points
 * 3. Generates a comprehensive report
 * 
 * Run with: npm run check:data-quality
 */

import { createClient } from '@supabase/supabase-js';
import { makeAuthenticatedRequest } from '../lib/finfactor';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epxfwxzerivaklmennfo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_9HffItjyNohPc6GIDQx-PQ_RuPjCto-';

const supabase = createClient(supabaseUrl, supabaseKey);

interface FieldStats {
  total: number;
  empty: number;
  percentage: number;
}

interface TableStats {
  [field: string]: FieldStats;
}

const emptyFieldsReport: Record<string, TableStats> = {};
const missingDataPoints: Record<string, string[]> = {};

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
 * Check empty fields in a table
 */
async function checkEmptyFields(tableName: string, fields: string[]) {
  console.log(`\n🔍 Checking ${tableName}...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1000);
  
  if (error) {
    console.error(`❌ Error fetching ${tableName}:`, error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log(`   ⚠️ No data in ${tableName}`);
    return;
  }
  
  const stats: TableStats = {};
  
  for (const field of fields) {
    const total = data.length;
    const empty = data.filter(row => 
      row[field] === null || 
      row[field] === undefined || 
      row[field] === '' ||
      (Array.isArray(row[field]) && row[field].length === 0) ||
      (typeof row[field] === 'object' && Object.keys(row[field] || {}).length === 0)
    ).length;
    
    stats[field] = {
      total,
      empty,
      percentage: total > 0 ? (empty / total) * 100 : 0
    };
  }
  
  emptyFieldsReport[tableName] = stats;
  
  console.log(`   ✅ Checked ${data.length} records`);
}

/**
 * Compare API response with database to find missing data points
 */
async function findMissingDataPoints() {
  console.log('\n🔍 Comparing API responses with database...');
  
  const uniqueIdentifier = '8956545791';
  
  // 1. Check Deposit Accounts
  try {
    const apiDepositAccounts = await callAPI('/pfm/api/v2/deposit/user-linked-accounts', {
      uniqueIdentifier: uniqueIdentifier,
    });
    
    if (apiDepositAccounts?.fipData) {
      const apiAccounts: any[] = [];
      apiDepositAccounts.fipData.forEach((fip: any) => {
        if (fip.linkedAccounts) {
          apiAccounts.push(...fip.linkedAccounts);
        }
      });
      
      const { data: userData } = await supabase
        .from('app_users')
        .select('id')
        .eq('phone', uniqueIdentifier)
        .single();
      
      const { data: dbAccounts } = await supabase
        .from('fi_accounts')
        .select('*')
        .eq('fi_type', 'DEPOSIT')
        .eq('user_id', userData?.id);
      
      if (apiAccounts.length > 0 && dbAccounts) {
        const apiAccount = apiAccounts[0];
        const dbAccount = dbAccounts[0];
        
        const missing: string[] = [];
        
        // Check fields that exist in API but not stored in DB
        if (apiAccount.accountBranch && !dbAccount?.account_branch) {
          missing.push('accountBranch');
        }
        if (apiAccount.accountIfscCode && !dbAccount?.account_ifsc_code) {
          missing.push('accountIfscCode');
        }
        if (apiAccount.accountStatus && !dbAccount?.account_status) {
          missing.push('accountStatus');
        }
        if (apiAccount.accountCurrentBalance && !dbAccount?.account_current_balance) {
          missing.push('accountCurrentBalance');
        }
        if (apiAccount.holderName && !dbAccount?.holder_name) {
          missing.push('holderName');
        }
        if (apiAccount.holderPan && !dbAccount?.holder_pan) {
          missing.push('holderPan');
        }
        
        if (missing.length > 0) {
          missingDataPoints['deposit_accounts'] = missing;
        }
      }
    }
  } catch (error) {
    console.error('Error checking deposit accounts:', error);
  }
  
  // 2. Check Recurring Deposits
  try {
    const apiRD = await callAPI('/pfm/api/v2/recurring-deposit/user-linked-accounts', {
      uniqueIdentifier: uniqueIdentifier,
    });
    
    if (apiRD?.fipData) {
      const apiAccounts: any[] = [];
      apiRD.fipData.forEach((fip: any) => {
        if (fip.linkedAccounts) {
          apiAccounts.push(...fip.linkedAccounts);
        }
      });
      
      if (apiAccounts.length > 0) {
        const apiAccount = apiAccounts[0];
        const missing: string[] = [];
        
        // Check RD-specific fields
        if (apiAccount.accountInterestRate) missing.push('accountInterestRate');
        if (apiAccount.accountMaturityDate) missing.push('accountMaturityDate');
        if (apiAccount.accountRecurringAmount) missing.push('accountRecurringAmount');
        if (apiAccount.accountTenureMonths) missing.push('accountTenureMonths');
        
        if (missing.length > 0) {
          missingDataPoints['recurring_deposits'] = missing;
        }
      }
    }
  } catch (error) {
    console.error('Error checking RD accounts:', error);
  }
  
  // 3. Check Mutual Funds
  try {
    const apiMF = await callAPI('/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio', {
      uniqueIdentifier: uniqueIdentifier,
    });
    
    if (apiMF?.holdings && apiMF.holdings.length > 0) {
      const apiHolding = apiMF.holdings[0];
      const missing: string[] = [];
      
      if (apiHolding.prevDetails) missing.push('prevDetails');
      
      if (missing.length > 0) {
        missingDataPoints['mutual_fund_holdings'] = missing;
      }
    }
  } catch (error) {
    console.error('Error checking MF holdings:', error);
  }
  
  // 4. Check Equities
  try {
    const apiEquities = await callAPI('/pfm/api/v2/equities/user-linked-accounts/holding-broker', {
      uniqueIdentifier: uniqueIdentifier,
      filterZeroValueAccounts: 'false',
      filterZeroValueHoldings: 'false',
    });
    
    if (apiEquities?.holdings && apiEquities.holdings.length > 0) {
      const apiHolding = apiEquities.holdings[0];
      const missing: string[] = [];
      
      if (apiHolding.bseSymbol) missing.push('bseSymbol');
      if (apiHolding.nseSymbol) missing.push('nseSymbol');
      if (apiHolding.marketCapCategory) missing.push('marketCapCategory');
      
      if (missing.length > 0) {
        missingDataPoints['equity_holdings'] = missing;
      }
    }
  } catch (error) {
    console.error('Error checking equity holdings:', error);
  }
}

/**
 * Print empty fields report
 */
function printEmptyFieldsReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 EMPTY FIELDS REPORT');
  console.log('='.repeat(70));
  
  for (const [table, stats] of Object.entries(emptyFieldsReport)) {
    console.log(`\n📌 ${table}:`);
    
    const emptyFields = Object.entries(stats)
      .filter(([_, stat]) => stat.empty > 0)
      .sort(([_, a], [__, b]) => b.percentage - a.percentage);
    
    if (emptyFields.length === 0) {
      console.log('   ✅ All fields have data!');
      continue;
    }
    
    for (const [field, stat] of emptyFields) {
      const bar = '█'.repeat(Math.floor(stat.percentage / 5));
      console.log(`   ${field.padEnd(30)} ${stat.empty}/${stat.total} empty (${stat.percentage.toFixed(1)}%) ${bar}`);
    }
  }
}

/**
 * Print missing data points report
 */
function printMissingDataPointsReport() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 MISSING DATA POINTS REPORT');
  console.log('(Fields in API but not stored in database)');
  console.log('='.repeat(70));
  
  if (Object.keys(missingDataPoints).length === 0) {
    console.log('\n✅ No missing data points! All API fields are being stored.');
    return;
  }
  
  for (const [table, fields] of Object.entries(missingDataPoints)) {
    console.log(`\n📌 ${table}:`);
    fields.forEach(field => {
      console.log(`   ❌ ${field} - Available in API but not stored`);
    });
  }
  
  console.log('\n💡 Solution: Run migration-add-missing-fields.sql and update seed script');
}

/**
 * Generate summary statistics
 */
async function generateSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📈 SUMMARY STATISTICS');
  console.log('='.repeat(70));
  
  // Count records in each table
  const tables = [
    'app_users',
    'fips',
    'fi_accounts',
    'fi_account_holders_pii',
    'fi_deposit_summaries',
    'fi_recurring_deposit_summaries',
    'fi_mutual_fund_holdings',
    'fi_equity_holdings',
  ];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`   ${table.padEnd(35)} ${count || 0} records`);
    }
  }
}

/**
 * Main function
 */
async function checkDataQuality() {
  console.log('🚀 Starting Data Quality Check...\n');
  
  // 1. Check empty fields in key tables
  await checkEmptyFields('fi_accounts', [
    'account_branch',
    'account_ifsc_code',
    'account_status',
    'account_current_balance',
    'account_currency',
    'fip_account_type',
  ]);
  
  await checkEmptyFields('fi_account_holders_pii', [
    'name',
    'pan',
    'dob',
    'mobile',
    'email',
    'address',
  ]);
  
  await checkEmptyFields('fi_deposit_summaries', [
    'current_balance',
    'account_type',
    'branch',
    'ifsc',
  ]);
  
  await checkEmptyFields('fi_recurring_deposit_summaries', [
    'current_balance',
    'maturity_amount',
    'interest_rate',
    'recurring_amount',
    'tenure_months',
  ]);
  
  await checkEmptyFields('fi_mutual_fund_holdings', [
    'isin',
    'units',
    'nav',
    'current_value',
    'prev_details',
  ]);
  
  await checkEmptyFields('fi_equity_holdings', [
    'isin',
    'units',
    'last_price',
    'current_value',
    'bse_symbol',
    'nse_symbol',
  ]);
  
  // 2. Find missing data points
  await findMissingDataPoints();
  
  // 3. Generate summary
  await generateSummary();
  
  // 4. Print reports
  printEmptyFieldsReport();
  printMissingDataPointsReport();
  
  console.log('\n✨ Data quality check completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review empty fields - these need data');
  console.log('   2. Review missing data points - these need schema columns');
  console.log('   3. Run migration if needed');
  console.log('   4. Update seed script to capture missing fields');
}

// Run the check
checkDataQuality().catch(console.error);

