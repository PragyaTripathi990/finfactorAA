import * as dotenv from 'dotenv';
// Load environment variables from .env.local
dotenv.config({ path: '.env' });

/**
 * Seed Supabase Database from Real API Responses
 * 
 * This script:
 * 1. Calls Finfactor APIs to get real data
 * 2. Uses the api-to-schema-mapper to transform responses
 * 3. Seeds the database with normalized data
 * 4. Tracks which APIs succeeded/failed
 * 
 * Run with: npm run seed:from-apis
 */


import { createClient } from '@supabase/supabase-js';
import { makeAuthenticatedRequest } from '../lib/finfactor';
import {
  generateHash,
  mapLinkedAccounts,
  mapTransactions,
  mapMutualFundHoldings,
  mapEquityHoldings,
  mapDepositSummary,
  mapInsights,
  extractFieldsWithTypes,
  parseNumber,
  parseDate,
} from './api-to-schema-mapper';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epxfwxzerivaklmennfo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('❌ Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tracking for API results
interface ApiResult {
  endpoint: string;
  status: 'SUCCESS' | 'EMPTY' | 'ERROR' | 'SKIPPED';
  recordsInserted: number;
  message?: string;
  fieldsFound?: string[];
}

const apiResults: ApiResult[] = [];
const allApiFields: Map<string, Map<string, string>> = new Map();

const UNIQUE_IDENTIFIER = '8956545791';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function callAPI<T>(endpoint: string, body: any): Promise<T | null> {
  try {
    const response = await makeAuthenticatedRequest<any>(endpoint, body);
    
    // Handle nested response structure
    if (response?.data) {
      return response.data as T;
    }
    return response as T;
  } catch (error: any) {
    console.error(`API Error ${endpoint}:`, error.message);
    return null;
  }
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// =====================================================
// SEED FUNCTIONS
// =====================================================

async function seedTSPProvider(): Promise<string | null> {
  console.log('\n🌐 Seeding TSP Provider...');
  
  const { data, error } = await supabase
    .from('tsp_providers')
    .upsert({
      name: 'FINFACTOR',
      environment: 'SANDBOX',
      base_url: 'https://apisetu.finvu.in',
      is_active: true,
    }, { onConflict: 'name,environment' })
    .select()
    .single();
  
  if (error) {
    console.error('❌ TSP Provider error:', error.message);
    return null;
  }
  
  console.log('✅ TSP Provider:', data.id);
  return data.id;
}

async function seedAAGateway(): Promise<string | null> {
  console.log('\n🌐 Seeding AA Gateway...');
  
  const { data, error } = await supabase
    .from('aa_gateways')
    .upsert({
      name: 'FINVU',
      environment: 'SANDBOX',
      gateway_base_url: 'https://apisetu.finvu.in',
      is_active: true,
    }, { onConflict: 'name,environment' })
    .select()
    .single();
  
  if (error) {
    console.error('❌ AA Gateway error:', error.message);
    return null;
  }
  
  console.log('✅ AA Gateway:', data.id);
  return data.id;
}

async function seedAppUser(): Promise<string | null> {
  console.log(`\n👤 Seeding App User: ${UNIQUE_IDENTIFIER}...`);
  
  const { data, error } = await supabase
    .from('app_users')
    .upsert({
      phone: UNIQUE_IDENTIFIER,
      unique_identifier: UNIQUE_IDENTIFIER,
      email: `user${UNIQUE_IDENTIFIER}@example.com`,
    }, { onConflict: 'unique_identifier' })
    .select()
    .single();
  
  if (error) {
    console.error('❌ App User error:', error.message);
    return null;
  }
  
  console.log('✅ App User:', data.id);
  return data.id;
}

async function seedFIPs(): Promise<Map<string, string>> {
  console.log('\n🏦 Seeding FIPs from API...');
  const fipMap = new Map<string, string>();
  
  const response = await callAPI<any>('/pfm/api/v2/fips', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.fips || !Array.isArray(response.fips)) {
    apiResults.push({
      endpoint: '/pfm/api/v2/fips',
      status: 'EMPTY',
      recordsInserted: 0,
      message: 'No FIPs data',
    });
    return fipMap;
  }
  
  // Store API fields for analysis
  if (response.fips.length > 0) {
    allApiFields.set('/pfm/api/v2/fips', extractFieldsWithTypes(response.fips[0]));
  }
  
  let inserted = 0;
  for (const fip of response.fips.slice(0, 50)) { // Limit to 50 for speed
    const fipRecord = {
      fip_code: fip.fipId,
      name: fip.fipName,
      type: fip.fiTypes?.[0] || 'BANK',
      environment: 'SANDBOX',
      fip_id: fip.fipId,
      product_types: fip.fiTypes,
      is_active: true,
    };
    
    const { data, error } = await supabase
      .from('fips')
      .upsert(fipRecord, { onConflict: 'fip_code' })
      .select()
      .single();
    
    if (!error && data) {
      fipMap.set(fip.fipId, data.id);
      inserted++;
    }
  }
  
  apiResults.push({
    endpoint: '/pfm/api/v2/fips',
    status: 'SUCCESS',
    recordsInserted: inserted,
  });
  
  console.log(`✅ Seeded ${inserted} FIPs`);
  return fipMap;
}

async function seedBrokers(): Promise<Map<string, string>> {
  console.log('\n💼 Seeding Brokers from API...');
  const brokerMap = new Map<string, string>();
  
  const response = await callAPI<any>('/pfm/api/v2/brokers', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.brokers || !Array.isArray(response.brokers)) {
    apiResults.push({
      endpoint: '/pfm/api/v2/brokers',
      status: 'EMPTY',
      recordsInserted: 0,
    });
    return brokerMap;
  }
  
  if (response.brokers.length > 0) {
    allApiFields.set('/pfm/api/v2/brokers', extractFieldsWithTypes(response.brokers[0]));
  }
  
  let inserted = 0;
  for (const broker of response.brokers.slice(0, 50)) {
    const { data, error } = await supabase
      .from('brokers')
      .upsert({
        broker_id: broker.brokerId || broker.id,
        name: broker.brokerName || broker.name,
        type: broker.type || 'EQUITY',
        is_active: true,
      }, { onConflict: 'broker_id' })
      .select()
      .single();
    
    if (!error && data) {
      brokerMap.set(broker.brokerId || broker.id, data.id);
      inserted++;
    }
  }
  
  apiResults.push({
    endpoint: '/pfm/api/v2/brokers',
    status: 'SUCCESS',
    recordsInserted: inserted,
  });
  
  console.log(`✅ Seeded ${inserted} Brokers`);
  return brokerMap;
}

async function createFetchRun(
  userId: string,
  tspId: string,
  fetchType: string,
  endpoint: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: fetchType,
      endpoint: endpoint,
      request_id: generateHash(fetchType, UNIQUE_IDENTIFIER, Date.now()),
      status: 'FETCHED',
      requested_at: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  return error ? null : data.id;
}

async function seedLinkedAccounts(
  userId: string,
  tspId: string,
  fipMap: Map<string, string>,
  fiType: string,
  apiPath: string
): Promise<Map<string, string>> {
  console.log(`\n💰 Seeding ${fiType} Linked Accounts...`);
  const accountMap = new Map<string, string>();
  
  const response = await callAPI<any>(apiPath, {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    filterZeroValueAccounts: 'false',
    filterZeroValueHoldings: 'false',
  });
  
  if (!response?.fipData || !Array.isArray(response.fipData)) {
    apiResults.push({
      endpoint: apiPath,
      status: 'EMPTY',
      recordsInserted: 0,
    });
    return accountMap;
  }
  
  // Store API fields
  if (response.fipData.length > 0 && response.fipData[0].linkedAccounts?.length > 0) {
    allApiFields.set(apiPath, extractFieldsWithTypes(response.fipData[0].linkedAccounts[0]));
  }
  
  const fetchRunId = await createFetchRun(userId, tspId, `${fiType}_LINKED_ACCOUNTS`, apiPath);
  
  const { accounts, holders } = mapLinkedAccounts(response, fiType, UNIQUE_IDENTIFIER);
  let insertedAccounts = 0;
  let insertedHolders = 0;
  
  for (const account of accounts) {
    // Find FIP ID from our map
    const fipName = account.fip_name || '';
    let fipId: string | null = null;
    
    // Try to match FIP by name
    for (const [fipCode, fipDbId] of fipMap) {
      if (fipName.toLowerCase().includes(fipCode.toLowerCase())) {
        fipId = fipDbId;
        break;
      }
    }
    
    const { data, error } = await supabase
      .from('fi_accounts')
      .upsert({
        user_id: userId,
        fip_id: fipId,
        fetch_run_id: fetchRunId,
        fi_type: account.fi_type,
        fip_account_type: account.fip_account_type,
        fip_account_sub_type: account.fip_account_sub_type,
        aa_linked_ref: account.aa_linked_ref,
        masked_acc_no: account.masked_acc_no,
        provider_name: account.provider_name,
        account_ref_number: account.account_ref_number,
        link_ref_number: account.link_ref_number,
        link_status: account.link_status,
        consent_id_list: account.consent_id_list,
        fip_name: account.fip_name,
        account_ref_hash: account.account_ref_hash,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'account_ref_hash' })
      .select()
      .single();
    
    if (!error && data) {
      accountMap.set(account.account_ref_number || account.masked_acc_no || '', data.id);
      insertedAccounts++;
    }
  }
  
  // Insert account holders
  for (let i = 0; i < holders.length && i < accounts.length; i++) {
    const holder = holders[i];
    const accountRefHash = accounts[i].account_ref_hash;
    const accountId = accountMap.get(accounts[i].account_ref_number || accounts[i].masked_acc_no || '');
    
    if (accountId && holder.name) {
      const { error } = await supabase
        .from('fi_account_holders_pii')
        .insert({
          account_id: accountId,
          holders_type: holder.holders_type,
          name: holder.name,
          dob: holder.dob,
          mobile: holder.mobile,
          email: holder.email,
          pan: holder.pan,
          address: holder.address,
          ckyc_registered: holder.ckyc_registered,
          kyc_compliance: holder.kyc_compliance,
          nominee: holder.nominee,
        });
      
      if (!error) insertedHolders++;
      else console.error(`❌ Error inserting holder:`, error.message);
    }
  }
  
  // Populate summary tables based on FI type
  let insertedSummaries = 0;
  if (fiType === 'DEPOSIT') {
    insertedSummaries = await seedDepositSummaries(response, accountMap, fetchRunId);
  } else if (fiType === 'TERM_DEPOSIT') {
    insertedSummaries = await seedTermDepositSummaries(response, accountMap, fetchRunId);
  } else if (fiType === 'RECURRING_DEPOSIT') {
    insertedSummaries = await seedRecurringDepositSummaries(response, accountMap, fetchRunId);
  } else if (fiType === 'MUTUAL_FUND') {
    insertedSummaries = await seedMutualFundSummaries(response, accountMap, fetchRunId);
  } else if (fiType === 'EQUITIES') {
    insertedSummaries = await seedEquitySummaries(response, accountMap, fetchRunId);
  }
  
  apiResults.push({
    endpoint: apiPath,
    status: 'SUCCESS',
    recordsInserted: insertedAccounts,
    message: `${insertedAccounts} accounts, ${insertedHolders} holders, ${insertedSummaries} summaries`,
  });
  
  console.log(`✅ Seeded ${insertedAccounts} ${fiType} accounts, ${insertedHolders} holders, ${insertedSummaries} summaries`);
  return accountMap;
}

// =====================================================
// SUMMARY TABLE POPULATION FUNCTIONS
// =====================================================

async function seedDepositSummaries(
  apiResponse: any,
  accountMap: Map<string, string>,
  fetchRunId: string | null
): Promise<number> {
  let inserted = 0;
  const fipData = apiResponse?.fipData || [];
  
  for (const fip of fipData) {
    const linkedAccounts = fip.linkedAccounts || [];
    
    for (const acc of linkedAccounts) {
      const accountRefNumber = acc.accountRefNumber || acc.linkRefNumber || acc.maskedAccNumber;
      const dbAccountId = accountMap.get(accountRefNumber || '');
      
      if (!dbAccountId) continue;
      
      const summary = mapDepositSummary(acc);
      
      const { error } = await supabase
        .from('fi_deposit_summaries')
        .upsert({
          account_id: dbAccountId,
          fetch_run_id: fetchRunId,
          current_balance: summary.current_balance,
          currency: summary.currency,
          balance_datetime: summary.balance_datetime,
          account_type: summary.account_type,
          account_sub_type: summary.account_sub_type,
          branch: summary.branch,
          ifsc: summary.ifsc,
          micr_code: summary.micr_code,
          opening_date: summary.opening_date,
          status: summary.status,
          pending_balance: summary.pending_balance,
          available_credit_limit: summary.available_credit_limit,
          drawing_limit: summary.drawing_limit,
        }, { onConflict: 'account_id' });
      
      if (!error) inserted++;
      else console.error(`❌ Error inserting deposit summary:`, error.message);
    }
  }
  
  return inserted;
}

async function seedTermDepositSummaries(
  apiResponse: any,
  accountMap: Map<string, string>,
  fetchRunId: string | null
): Promise<number> {
  let inserted = 0;
  const fipData = apiResponse?.fipData || [];
  
  for (const fip of fipData) {
    const linkedAccounts = fip.linkedAccounts || [];
    
    for (const acc of linkedAccounts) {
      const accountRefNumber = acc.accountRefNumber || acc.linkRefNumber;
      const dbAccountId = accountMap.get(accountRefNumber || '');
      
      if (!dbAccountId) continue;
      
      const summary = acc.Summary || acc.summary || {};
      const profile = acc.Profile || acc.profile || {};
      
      const { error } = await supabase
        .from('fi_term_deposit_summaries')
        .upsert({
          account_id: dbAccountId,
          fetch_run_id: fetchRunId,
          principal_amount: parseNumber(summary.principalAmount || summary.principal_amount),
          current_balance: parseNumber(summary.currentBalance || summary.current_balance),
          maturity_amount: parseNumber(summary.maturityAmount || summary.maturity_amount),
          maturity_date: parseDate(summary.maturityDate || summary.maturity_date),
          interest_rate: parseNumber(summary.interestRate || summary.interest_rate),
          interest_payout: summary.interestPayout || summary.interest_payout || null,
          opening_date: parseDate(summary.openingDate || profile.openingDate),
          tenure_days: summary.tenureDays || summary.tenure_days || null,
          tenure_months: summary.tenureMonths || summary.tenure_months || null,
          current_value: parseNumber(summary.currentValue || summary.current_value),
          compounding_frequency: summary.compoundingFrequency || summary.compounding_frequency || null,
        }, { onConflict: 'account_id' });
      
      if (!error) inserted++;
      else console.error(`❌ Error inserting term deposit summary:`, error.message);
    }
  }
  
  return inserted;
}

async function seedRecurringDepositSummaries(
  apiResponse: any,
  accountMap: Map<string, string>,
  fetchRunId: string | null
): Promise<number> {
  let inserted = 0;
  const fipData = apiResponse?.fipData || [];
  
  for (const fip of fipData) {
    const linkedAccounts = fip.linkedAccounts || [];
    
    for (const acc of linkedAccounts) {
      const accountRefNumber = acc.accountRefNumber || acc.linkRefNumber;
      const dbAccountId = accountMap.get(accountRefNumber || '');
      
      if (!dbAccountId) continue;
      
      const summary = acc.Summary || acc.summary || {};
      
      const { error } = await supabase
        .from('fi_recurring_deposit_summaries')
        .upsert({
          account_id: dbAccountId,
          fetch_run_id: fetchRunId,
          current_balance: parseNumber(summary.currentBalance || summary.current_balance),
          maturity_amount: parseNumber(summary.maturityAmount || summary.maturity_amount),
          maturity_date: parseDate(summary.maturityDate || summary.maturity_date),
          interest_rate: parseNumber(summary.interestRate || summary.interest_rate),
          recurring_amount: parseNumber(summary.recurringAmount || summary.recurring_amount),
          tenure_months: summary.tenureMonths || summary.tenure_months || null,
          recurring_day: summary.recurringDay || summary.recurring_day || null,
          principal_amount: parseNumber(summary.principalAmount || summary.principal_amount),
          opening_date: parseDate(summary.openingDate),
          current_value: parseNumber(summary.currentValue || summary.current_value),
        }, { onConflict: 'account_id' });
      
      if (!error) inserted++;
      else console.error(`❌ Error inserting RD summary:`, error.message);
    }
  }
  
  return inserted;
}

async function seedMutualFundSummaries(
  apiResponse: any,
  accountMap: Map<string, string>,
  fetchRunId: string | null
): Promise<number> {
  // MF summaries are usually calculated from holdings, so we'll skip for now
  // or calculate from holdings data
  return 0;
}

async function seedEquitySummaries(
  apiResponse: any,
  accountMap: Map<string, string>,
  fetchRunId: string | null
): Promise<number> {
  // Equity summaries are usually calculated from holdings, so we'll skip for now
  return 0;
}

// Note: parseNumber and parseDate are imported from api-to-schema-mapper

async function seedDepositTransactions(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>
): Promise<void> {
  console.log('\n📝 Seeding Deposit Transactions...');
  
  // Get the first account ID to fetch transactions
  const accountIds = Array.from(accountMap.keys());
  if (accountIds.length === 0) {
    apiResults.push({
      endpoint: '/pfm/api/v2/deposit/user-account-statement',
      status: 'SKIPPED',
      recordsInserted: 0,
      message: 'No accounts to fetch transactions for',
    });
    return;
  }
  
  // Find Finvu Bank account (look for UUID-like accountRefNumber)
  let targetAccountId = accountIds[0];
  for (const accId of accountIds) {
    // Account ref numbers from API are UUIDs (36 chars)
    if (accId.length > 30) {
      targetAccountId = accId;
      break;
    }
  }
  
  const response = await callAPI<any>('/pfm/api/v2/deposit/user-account-statement', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    accountId: targetAccountId,
    dateRangeFrom: '2025-01-01',
  });
  
  if (!response?.transactions || !Array.isArray(response.transactions)) {
    apiResults.push({
      endpoint: '/pfm/api/v2/deposit/user-account-statement',
      status: 'EMPTY',
      recordsInserted: 0,
    });
    return;
  }
  
  if (response.transactions.length > 0) {
    allApiFields.set('/pfm/api/v2/deposit/user-account-statement', 
      extractFieldsWithTypes(response.transactions[0]));
  }
  
  // Get database account ID (accountMap key is accountRefNumber, value is DB UUID)
  const dbAccountId = accountMap.get(targetAccountId);
  
  if (!dbAccountId) {
    console.error(`❌ Could not find DB account ID for ${targetAccountId}`);
    apiResults.push({
      endpoint: '/pfm/api/v2/deposit/user-account-statement',
      status: 'ERROR',
      recordsInserted: 0,
      message: `Account ID ${targetAccountId} not found in database`,
    });
    return;
  }
  
  const fetchRunId = await createFetchRun(userId, tspId, 'TRANSACTIONS', '/pfm/api/v2/deposit/user-account-statement');
  
  const transactions = mapTransactions(response, targetAccountId);
  let inserted = 0;
  
  for (const txn of transactions) {
    const { error } = await supabase
      .from('fi_transactions')
      .upsert({
        account_id: dbAccountId,
        fetch_run_id: fetchRunId,
        txn_id: txn.txn_id,
        txn_type: txn.txn_type,
        mode: txn.mode,
        amount: txn.amount,
        balance: txn.balance,
        txn_timestamp: txn.txn_timestamp,
        value_date: txn.value_date,
        narration: txn.narration,
        reference: txn.reference,
        category: txn.category,
        sub_category: txn.sub_category,
        dedupe_hash: txn.dedupe_hash,
      }, { onConflict: 'account_id,dedupe_hash' });
    
    if (!error) inserted++;
    else if (inserted === 0) console.error(`❌ Error inserting transaction:`, error.message);
  }
  
  apiResults.push({
    endpoint: '/pfm/api/v2/deposit/user-account-statement',
    status: 'SUCCESS',
    recordsInserted: inserted,
  });
  
  console.log(`✅ Seeded ${inserted} transactions`);
}

async function seedMutualFundHoldings(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>
): Promise<void> {
  console.log('\n📈 Seeding Mutual Fund Holdings...');
  
  const response = await callAPI<any>('/pfm/api/v2/mutual-fund/holding-folio', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.holdingFolios || !Array.isArray(response.holdingFolios)) {
    apiResults.push({
      endpoint: '/pfm/api/v2/mutual-fund/holding-folio',
      status: 'EMPTY',
      recordsInserted: 0,
    });
    return;
  }
  
  if (response.holdingFolios.length > 0) {
    allApiFields.set('/pfm/api/v2/mutual-fund/holding-folio', 
      extractFieldsWithTypes(response.holdingFolios[0]));
  }
  
  const holdings = mapMutualFundHoldings(response);
  const fetchRunId = await createFetchRun(userId, tspId, 'MF_HOLDINGS', '/pfm/api/v2/mutual-fund/holding-folio');
  
  // Get first MF account (accountMap values are DB UUIDs)
  const mfAccountIds = Array.from(accountMap.values());
  const mfAccountId = mfAccountIds.length > 0 ? mfAccountIds[0] : null;
  
  if (!mfAccountId) {
    console.error('❌ No MF account found in database');
    apiResults.push({
      endpoint: '/pfm/api/v2/mutual-fund/holding-folio',
      status: 'ERROR',
      recordsInserted: 0,
      message: 'No MF account found',
    });
    return;
  }
  
  let inserted = 0;
  
  for (const holding of holdings) {
    const { error } = await supabase
      .from('fi_mutual_fund_holdings')
      .insert({
        account_id: mfAccountId,
        fetch_run_id: fetchRunId,
        amc: holding.amc,
        scheme_name: holding.scheme_name,
        scheme_code: holding.scheme_code,
        scheme_plan: holding.scheme_plan,
        scheme_option: holding.scheme_option,
        isin: holding.isin,
        folio_no: holding.folio_no,
        units: holding.units,
        nav: holding.nav,
        nav_date: holding.nav_date,
        current_value: holding.current_value,
        cost_value: holding.cost_value,
        pnl: holding.pnl,
        pnl_percent: holding.pnl_percent,
        scheme_category: holding.scheme_category,
        scheme_type: holding.scheme_type,
      });
    
    if (!error) inserted++;
    else if (inserted === 0) console.error(`❌ Error inserting MF holding:`, error.message);
  }
  
  apiResults.push({
    endpoint: '/pfm/api/v2/mutual-fund/holding-folio',
    status: 'SUCCESS',
    recordsInserted: inserted,
  });
  
  console.log(`✅ Seeded ${inserted} MF holdings`);
}

async function seedEquityHoldings(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>
): Promise<void> {
  console.log('\n📊 Seeding Equity Holdings (Demat)...');
  
  const response = await callAPI<any>('/pfm/api/v2/equities/demat-holding', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.holdings && !response?.dematHoldings) {
    apiResults.push({
      endpoint: '/pfm/api/v2/equities/demat-holding',
      status: 'EMPTY',
      recordsInserted: 0,
    });
    return;
  }
  
  const holdingsData = response.holdings || response.dematHoldings || [];
  if (holdingsData.length > 0) {
    allApiFields.set('/pfm/api/v2/equities/demat-holding', extractFieldsWithTypes(holdingsData[0]));
  }
  
  const holdings = mapEquityHoldings(response);
  const fetchRunId = await createFetchRun(userId, tspId, 'EQUITY_HOLDINGS', '/pfm/api/v2/equities/demat-holding');
  
  const equityAccountIds = Array.from(accountMap.values());
  const equityAccountId = equityAccountIds.length > 0 ? equityAccountIds[0] : null;
  
  if (!equityAccountId) {
    console.error('❌ No equity account found in database');
    apiResults.push({
      endpoint: '/pfm/api/v2/equities/demat-holding',
      status: 'ERROR',
      recordsInserted: 0,
      message: 'No equity account found',
    });
    return;
  }
  
  let inserted = 0;
  
  for (const holding of holdings) {
    const { error } = await supabase
      .from('fi_equity_holdings')
      .insert({
        account_id: equityAccountId,
        fetch_run_id: fetchRunId,
        issuer_name: holding.issuer_name,
        isin: holding.isin,
        isin_desc: holding.isin_desc,
        units: holding.units,
        last_price: holding.last_price,
        current_value: holding.current_value,
        symbol: holding.symbol,
        exchange: holding.exchange,
        avg_cost_price: holding.avg_cost_price,
        cost_value: holding.cost_value,
        pnl: holding.pnl,
        pnl_percent: holding.pnl_percent,
      });
    
    if (!error) inserted++;
    else if (inserted === 0) console.error(`❌ Error inserting equity holding:`, error.message);
  }
  
  apiResults.push({
    endpoint: '/pfm/api/v2/equities/demat-holding',
    status: 'SUCCESS',
    recordsInserted: inserted,
  });
  
  console.log(`✅ Seeded ${inserted} equity holdings`);
}

async function seedInsights(
  userId: string,
  accountMap: Map<string, string>,
  insightType: string,
  apiPath: string
): Promise<void> {
  console.log(`\n📊 Seeding ${insightType} Insights...`);
  
  // Get account ID for insights
  const accountIds = Array.from(accountMap.keys()).filter(id => id.length > 30);
  if (accountIds.length === 0) {
    apiResults.push({
      endpoint: apiPath,
      status: 'SKIPPED',
      recordsInserted: 0,
      message: 'No accounts for insights',
    });
    return;
  }
  
  const response = await callAPI<any>(apiPath, {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    accountIds: [accountIds[0]],
    from: '2025-01-01',
    to: getTodayDate(),
    frequency: 'MONTHLY',
  });
  
  if (!response) {
    apiResults.push({
      endpoint: apiPath,
      status: 'EMPTY',
      recordsInserted: 0,
    });
    return;
  }
  
  // Store fields for analysis
  allApiFields.set(apiPath, extractFieldsWithTypes(response));
  
  const mapped = mapInsights(response, insightType);
  
  const { error } = await supabase
    .from('user_financial_snapshots')
    .insert({
      user_id: userId,
      snapshot_type: mapped.snapshot_type,
      snapshot: mapped.snapshot,
      generated_at: new Date().toISOString(),
    });
  
  apiResults.push({
    endpoint: apiPath,
    status: error ? 'ERROR' : 'SUCCESS',
    recordsInserted: error ? 0 : 1,
    message: error?.message,
  });
  
  console.log(`✅ Seeded ${insightType} insights`);
}

// =====================================================
// MAIN FUNCTION
// =====================================================

async function seedFromAPIs() {
  console.log('🚀 Starting database seeding from API responses...\n');
  console.log('📋 Using supervisor schema (supervisor-schema.sql)\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Seed infrastructure
    const tspId = await seedTSPProvider();
    const aaGatewayId = await seedAAGateway();
    const userId = await seedAppUser();
    
    if (!tspId || !userId) {
      console.error('❌ Failed to create base records. Exiting.');
      return;
    }
    
    // 2. Seed reference data
    const fipMap = await seedFIPs();
    const brokerMap = await seedBrokers();
    
    // 3. Seed linked accounts for each FI type
    const depositAccounts = await seedLinkedAccounts(
      userId, tspId, fipMap, 'DEPOSIT', '/pfm/api/v2/deposit/user-linked-accounts'
    );
    
    const termDepositAccounts = await seedLinkedAccounts(
      userId, tspId, fipMap, 'TERM_DEPOSIT', '/pfm/api/v2/term-deposit/user-linked-accounts'
    );
    
    const rdAccounts = await seedLinkedAccounts(
      userId, tspId, fipMap, 'RECURRING_DEPOSIT', '/pfm/api/v2/recurring-deposit/user-linked-accounts'
    );
    
    const mfAccounts = await seedLinkedAccounts(
      userId, tspId, fipMap, 'MUTUAL_FUND', '/pfm/api/v2/mutual-fund/user-linked-accounts'
    );
    
    const equityAccounts = await seedLinkedAccounts(
      userId, tspId, fipMap, 'EQUITIES', '/pfm/api/v2/equities/user-linked-accounts'
    );
    
    const etfAccounts = await seedLinkedAccounts(
      userId, tspId, fipMap, 'ETF', '/pfm/api/v2/etf/user-linked-accounts'
    );
    
    // 4. Seed transactions (deposit only, others return 400)
    await seedDepositTransactions(userId, tspId, depositAccounts);
    
    // 5. Seed holdings
    await seedMutualFundHoldings(userId, tspId, mfAccounts);
    await seedEquityHoldings(userId, tspId, equityAccounts);
    
    // 6. Seed insights
    await seedInsights(userId, depositAccounts, 'deposit', '/pfm/api/v2/deposit/insights');
    await seedInsights(userId, mfAccounts, 'mutualFund', '/pfm/api/v2/mutual-fund/insights');
    await seedInsights(userId, etfAccounts, 'etf', '/pfm/api/v2/etf/insights');
    
    // 7. Print summary
    printSummary();
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING SUMMARY');
  console.log('='.repeat(60));
  
  const success = apiResults.filter(r => r.status === 'SUCCESS');
  const empty = apiResults.filter(r => r.status === 'EMPTY');
  const errors = apiResults.filter(r => r.status === 'ERROR');
  const skipped = apiResults.filter(r => r.status === 'SKIPPED');
  
  console.log(`\n✅ SUCCESS: ${success.length} APIs`);
  success.forEach(r => console.log(`   ${r.endpoint}: ${r.recordsInserted} records`));
  
  if (empty.length > 0) {
    console.log(`\n⚠️ EMPTY: ${empty.length} APIs`);
    empty.forEach(r => console.log(`   ${r.endpoint}`));
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ ERROR: ${errors.length} APIs`);
    errors.forEach(r => console.log(`   ${r.endpoint}: ${r.message}`));
  }
  
  if (skipped.length > 0) {
    console.log(`\n⏭️ SKIPPED: ${skipped.length} APIs`);
    skipped.forEach(r => console.log(`   ${r.endpoint}: ${r.message}`));
  }
  
  // Print total records inserted
  const totalRecords = apiResults.reduce((sum, r) => sum + r.recordsInserted, 0);
  console.log(`\n📈 Total Records Inserted: ${totalRecords}`);
  
  // Print API fields discovered
  console.log('\n📋 API Fields Discovered (for schema gap analysis):');
  for (const [endpoint, fields] of allApiFields) {
    console.log(`\n   ${endpoint}:`);
    const fieldList = Array.from(fields.entries()).slice(0, 10);
    fieldList.forEach(([field, type]) => console.log(`      - ${field}: ${type}`));
    if (fields.size > 10) {
      console.log(`      ... and ${fields.size - 10} more fields`);
    }
  }
  
  console.log('\n✨ Seeding completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run analyze:schema-gaps');
  console.log('   2. Review the gap analysis report');
  console.log('   3. Add missing columns to schema if needed');
}

// Run
seedFromAPIs().catch(console.error);
