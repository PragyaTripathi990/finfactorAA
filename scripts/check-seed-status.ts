/**
 * Check Seed Status - Diagnostic Tool
 * 
 * This script checks:
 * 1. What data exists in the database
 * 2. What the seed script should be inserting
 * 3. Any errors or missing data
 * 
 * Run: npx tsx scripts/check-seed-status.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epxfwxzerivaklmennfo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('❌ Missing Supabase key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string) {
  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .limit(5);
  
  if (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { count: 0, sample: null };
  }
  
  return { count: count || 0, sample: data };
}

async function main() {
  console.log('🔍 Checking Database Status...\n');
  console.log('='.repeat(60));
  
  // Check Layer A tables
  console.log('\n📋 LAYER A - Flow & Control:');
  const tablesA = [
    'tsp_providers',
    'aa_gateways',
    'app_users',
    'app_integration_apps',
    'tsp_auth_tokens',
    'tsp_api_calls',
    'aa_data_fetch_runs',
  ];
  
  for (const table of tablesA) {
    const { count, sample } = await checkTable(table);
    console.log(`   ${table}: ${count} rows`);
    if (count > 0 && sample && sample.length > 0) {
      console.log(`      Sample: ${JSON.stringify(sample[0]).substring(0, 100)}...`);
    }
  }
  
  // Check Layer B tables
  console.log('\n📋 LAYER B - Canonical Data:');
  const tablesB = [
    'fips',
    'brokers',
    'fi_accounts',
    'fi_account_holders_pii',
    'fi_transactions',
  ];
  
  for (const table of tablesB) {
    const { count, sample } = await checkTable(table);
    console.log(`   ${table}: ${count} rows`);
    if (count > 0 && sample && sample.length > 0) {
      const keys = Object.keys(sample[0]).slice(0, 5);
      console.log(`      Sample keys: ${keys.join(', ')}`);
    }
  }
  
  // Check Layer C tables
  console.log('\n📋 LAYER C - Summaries & Holdings:');
  const tablesC = [
    'fi_deposit_summaries',
    'fi_term_deposit_summaries',
    'fi_recurring_deposit_summaries',
    'fi_mutual_fund_summaries',
    'fi_mutual_fund_holdings',
    'fi_equity_summaries',
    'fi_equity_holdings',
    'user_financial_snapshots',
  ];
  
  for (const table of tablesC) {
    const { count, sample } = await checkTable(table);
    console.log(`   ${table}: ${count} rows`);
    if (count > 0 && sample && sample.length > 0) {
      const keys = Object.keys(sample[0]).slice(0, 5);
      console.log(`      Sample keys: ${keys.join(', ')}`);
    }
  }
  
  // Check for foreign key issues
  console.log('\n🔗 Checking Relationships:');
  
  const { data: accounts } = await supabase
    .from('fi_accounts')
    .select('id, fi_type, fip_id, user_id')
    .limit(5);
  
  if (accounts && accounts.length > 0) {
    console.log(`   ✅ Found ${accounts.length} accounts`);
    const account = accounts[0];
    
    // Check if user exists
    if (account.user_id) {
      const { data: user } = await supabase
        .from('app_users')
        .select('id, unique_identifier')
        .eq('id', account.user_id)
        .single();
      console.log(`   ${user ? '✅' : '❌'} User exists: ${account.user_id}`);
    }
    
    // Check if FIP exists
    if (account.fip_id) {
      const { data: fip } = await supabase
        .from('fips')
        .select('id, name')
        .eq('id', account.fip_id)
        .single();
      console.log(`   ${fip ? '✅' : '❌'} FIP exists: ${account.fip_id}`);
    }
  } else {
    console.log('   ⚠️ No accounts found - seed script may not have run successfully');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const { count: totalAccounts } = await supabase
    .from('fi_accounts')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalUsers } = await supabase
    .from('app_users')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n   Total Users: ${totalUsers || 0}`);
  console.log(`   Total Accounts: ${totalAccounts || 0}`);
  
  if (totalAccounts === 0) {
    console.log('\n   ⚠️ No data found!');
    console.log('   Next steps:');
    console.log('   1. Check if seed script ran: npm run seed:from-apis');
    console.log('   2. Check for errors in seed script output');
    console.log('   3. Verify API credentials are correct');
    console.log('   4. Check if APIs are returning data');
  }
}

main().catch(console.error);

