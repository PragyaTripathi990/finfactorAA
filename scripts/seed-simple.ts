/**
 * SIMPLE SEED SCRIPT - Uses INSERT (not UPSERT)
 * 
 * This script doesn't rely on unique constraints - it clears existing data first
 * 
 * Run: npm run seed:simple
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';
import { makeAuthenticatedRequest } from '../lib/finfactor';
import * as crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epxfwxzerivaklmennfo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const UNIQUE_IDENTIFIER = '8956545791';

let totalRecords = 0;

function generateHash(...parts: any[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').substring(0, 64);
}

function parseNum(v: any): number | null {
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function parseDate(v: any): string | null {
  if (!v) return null;
  try {
    return new Date(v).toISOString().split('T')[0];
  } catch { return null; }
}

async function callAPI(endpoint: string, body: any): Promise<any> {
  try {
    console.log(`   📡 ${endpoint}`);
    return await makeAuthenticatedRequest(endpoint, body);
  } catch (e: any) {
    console.error(`   ❌ ${e.message}`);
    return null;
  }
}

async function clearExistingData(userId: string) {
  console.log('\n🧹 Clearing existing data for user...');
  
  // Get existing accounts
  const { data: accounts } = await supabase
    .from('fi_accounts')
    .select('id')
    .eq('user_id', userId);
  
  if (accounts?.length) {
    const accountIds = accounts.map(a => a.id);
    
    // Delete related data
    await supabase.from('fi_deposit_summaries').delete().in('account_id', accountIds);
    await supabase.from('fi_term_deposit_summaries').delete().in('account_id', accountIds);
    await supabase.from('fi_recurring_deposit_summaries').delete().in('account_id', accountIds);
    await supabase.from('fi_mutual_fund_summaries').delete().in('account_id', accountIds);
    await supabase.from('fi_mutual_fund_holdings').delete().in('account_id', accountIds);
    await supabase.from('fi_equity_summaries').delete().in('account_id', accountIds);
    await supabase.from('fi_equity_holdings').delete().in('account_id', accountIds);
    await supabase.from('fi_etf_holdings').delete().in('account_id', accountIds);
    await supabase.from('fi_transactions').delete().in('account_id', accountIds);
    await supabase.from('fi_account_holders_pii').delete().in('account_id', accountIds);
    await supabase.from('fi_accounts').delete().in('id', accountIds);
    
    console.log(`   ✅ Cleared ${accountIds.length} accounts and related data`);
  }
  
  // Clear fetch runs
  await supabase.from('aa_fetch_payloads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('aa_data_fetch_runs').delete().eq('user_id', userId);
  await supabase.from('user_financial_snapshots').delete().eq('user_id', userId);
  
  console.log('   ✅ Cleared fetch runs and snapshots');
}

async function seedAccounts(
  userId: string,
  tspId: string,
  fiType: string,
  apiPath: string,
  summaryTable: string
): Promise<Map<string, string>> {
  console.log(`\n📦 ${fiType}...`);
  const accountMap = new Map<string, string>();
  
  const response = await callAPI(apiPath, {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    filterZeroValueAccounts: 'false',
    filterZeroValueHoldings: 'false',
  });
  
  if (!response?.fipData?.length) {
    console.log(`   ⚠️ No data`);
    return accountMap;
  }
  
  // Create fetch run
  const { data: fetchRun } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: `${fiType}_LINKED_ACCOUNTS`,
      endpoint: apiPath,
      request_id: generateHash(fiType, Date.now()),
      status: 'FETCHED',
      requested_at: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      records_count: response.fipData.reduce((sum: number, fip: any) => sum + (fip.linkedAccounts?.length || 0), 0),
    })
    .select()
    .single();
  
  // Store raw payload
  await supabase.from('aa_fetch_payloads').insert({
    fetch_run_id: fetchRun?.id,
    payload_role: 'RESPONSE',
    raw_payload: response,
    hash_sha256: generateHash(JSON.stringify(response)),
  });
  
  let accounts = 0, holders = 0, summaries = 0;
  
  for (const fip of response.fipData) {
    // Ensure FIP exists
    const { data: fipRecord } = await supabase
      .from('fips')
      .select('id')
      .eq('fip_code', fip.fipId)
      .single();
    
    let fipId = fipRecord?.id;
    if (!fipId) {
      const { data: newFip } = await supabase
        .from('fips')
        .insert({
          fip_code: fip.fipId,
          name: fip.fipName,
          type: 'BANK',
          is_active: true,
        })
        .select()
        .single();
      fipId = newFip?.id;
    }
    
    for (const acc of fip.linkedAccounts || []) {
      // INSERT account
      const { data: accountData, error: accError } = await supabase
        .from('fi_accounts')
        .insert({
          user_id: userId,
          fip_id: fipId,
          fetch_run_id: fetchRun?.id,
          fi_type: fiType,
          fip_account_type: acc.accountType || acc.accType,
          account_ref_number: acc.accountRefNumber,
          link_ref_number: acc.linkRefNumber,
          aa_linked_ref: acc.linkRefNumber,
          masked_acc_no: acc.maskedAccNumber,
          fip_name: fip.fipName,
          fip_id_external: fip.fipId,
          provider_name: fip.fipName,
          link_status: acc.linkStatus || 'LINKED',
          account_ref_hash: generateHash(UNIQUE_IDENTIFIER, fip.fipName, acc.accountRefNumber, fiType),
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (accError) {
        console.error(`   ❌ Insert error:`, accError.message);
        continue;
      }
      
      if (!accountData) continue;
      
      accountMap.set(acc.accountRefNumber || acc.maskedAccNumber, accountData.id);
      accounts++;
      totalRecords++;
      
      // INSERT holder
      if (acc.holderName) {
        const { error: holderError } = await supabase
          .from('fi_account_holders_pii')
          .insert({
            account_id: accountData.id,
            holders_type: acc.holderType || 'SINGLE',
            name: acc.holderName,
            dob: parseDate(acc.holderDob),
            mobile: acc.holderMobile,
            email: acc.holderEmail,
            pan: acc.holderPan,
            address: acc.holderAddress,
            nominee: acc.holderNominee,
          });
        
        if (!holderError) { holders++; totalRecords++; }
      }
      
      // INSERT summary
      if (summaryTable) {
        let summaryData: any = {
          account_id: accountData.id,
          fetch_run_id: fetchRun?.id,
        };
        
        if (fiType === 'DEPOSIT') {
          summaryData = {
            ...summaryData,
            current_balance: parseNum(acc.accountCurrentBalance),
            currency: acc.accountCurrency || 'INR',
            account_type: acc.accountType,
            branch: acc.accountBranch,
            ifsc: acc.accountIfscCode,
            micr_code: acc.accountMicrCode,
            opening_date: parseDate(acc.accountOpeningDate),
            status: acc.accountStatus,
            available_credit_limit: parseNum(acc.accountCurrentODLimit),
            drawing_limit: parseNum(acc.accountDrawingLimit),
            facility_type: acc.accountFacility,
          };
        } else if (fiType === 'TERM_DEPOSIT') {
          summaryData = {
            ...summaryData,
            principal_amount: parseNum(acc.principalAmount || acc.depositAmount),
            current_balance: parseNum(acc.currentValue || acc.accountCurrentBalance),
            maturity_amount: parseNum(acc.maturityAmount),
            maturity_date: parseDate(acc.maturityDate),
            interest_rate: parseNum(acc.interestRate),
          };
        } else if (fiType === 'RECURRING_DEPOSIT') {
          summaryData = {
            ...summaryData,
            current_balance: parseNum(acc.currentValue || acc.accountCurrentBalance),
            maturity_amount: parseNum(acc.maturityAmount),
            maturity_date: parseDate(acc.maturityDate),
            interest_rate: parseNum(acc.interestRate),
            recurring_amount: parseNum(acc.recurringAmount),
          };
        } else if (fiType === 'MUTUAL_FUND') {
          summaryData = {
            ...summaryData,
            cost_value: parseNum(acc.costValue),
            current_value: parseNum(acc.currentValue),
          };
        } else if (fiType === 'EQUITIES') {
          summaryData = {
            ...summaryData,
            current_value: parseNum(acc.currentValue),
          };
        }
        
        const { error: sumError } = await supabase.from(summaryTable).insert(summaryData);
        if (!sumError) { summaries++; totalRecords++; }
      }
    }
  }
  
  console.log(`   ✅ ${accounts} accounts, ${holders} holders, ${summaries} summaries`);
  return accountMap;
}

async function seedTransactions(userId: string, tspId: string, accountMap: Map<string, string>) {
  console.log('\n📦 Transactions...');
  
  let accountRef = '', dbAccountId = '';
  for (const [ref, id] of accountMap) {
    if (ref?.length > 10) { accountRef = ref; dbAccountId = id; break; }
  }
  
  if (!accountRef) { console.log('   ⚠️ No account'); return; }
  
  const response = await callAPI('/pfm/api/v2/deposit/user-account-statement', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    accountId: accountRef,
    dateRangeFrom: '2025-01-01',
  });
  
  if (!response?.transactions?.length) { console.log('   ⚠️ No transactions'); return; }
  
  const { data: fetchRun } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: 'TRANSACTIONS',
      request_id: generateHash('TXN', Date.now()),
      status: 'FETCHED',
    })
    .select()
    .single();
  
  await supabase.from('aa_fetch_payloads').insert({
    fetch_run_id: fetchRun?.id,
    payload_role: 'RESPONSE',
    raw_payload: response,
    hash_sha256: generateHash(JSON.stringify(response)),
  });
  
  let count = 0;
  for (const txn of response.transactions) {
    const { error } = await supabase.from('fi_transactions').insert({
      account_id: dbAccountId,
      fetch_run_id: fetchRun?.id,
      txn_id: txn.txnId,
      txn_type: txn.type,
      mode: txn.mode,
      amount: parseNum(txn.amount),
      balance: parseNum(txn.currentBalance),
      txn_timestamp: txn.transactionTimestamp,
      value_date: parseDate(txn.valueDate),
      narration: txn.narration,
      reference: txn.reference,
      category: txn.category,
      dedupe_hash: generateHash(dbAccountId, txn.amount, txn.transactionTimestamp, txn.narration),
    });
    if (!error) { count++; totalRecords++; }
  }
  
  console.log(`   ✅ ${count} transactions`);
}

async function seedMFHoldings(userId: string, tspId: string, accountMap: Map<string, string>) {
  console.log('\n📦 MF Holdings...');
  
  const response = await callAPI('/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  const holdings = response?.holdings || response?.holdingFolios || [];
  if (!holdings.length) { console.log('   ⚠️ No holdings'); return; }
  
  let dbAccountId = '';
  for (const [_, id] of accountMap) { dbAccountId = id; break; }
  if (!dbAccountId) { console.log('   ⚠️ No account'); return; }
  
  const { data: fetchRun } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: 'MF_HOLDINGS',
      request_id: generateHash('MF', Date.now()),
      status: 'FETCHED',
    })
    .select()
    .single();
  
  await supabase.from('aa_fetch_payloads').insert({
    fetch_run_id: fetchRun?.id,
    payload_role: 'RESPONSE',
    raw_payload: response,
    hash_sha256: generateHash(JSON.stringify(response)),
  });
  
  let count = 0;
  for (const h of holdings) {
    const { error } = await supabase.from('fi_mutual_fund_holdings').insert({
      account_id: dbAccountId,
      fetch_run_id: fetchRun?.id,
      amc: h.amc,
      scheme_name: h.isinDescription || h.schemeName,
      isin: h.isin,
      folio_no: h.folioNo || h.folios?.[0]?.folioNo,
      units: parseNum(h.closingUnits || h.units),
      nav: parseNum(h.nav),
      nav_date: parseDate(h.navDate),
      current_value: parseNum(h.currentValue),
      cost_value: parseNum(h.costValue),
      holding_hash: generateHash(dbAccountId, h.isin, h.folioNo),
    });
    if (!error) { count++; totalRecords++; }
  }
  
  console.log(`   ✅ ${count} MF holdings`);
}

async function seedEquityHoldings(userId: string, tspId: string, accountMap: Map<string, string>) {
  console.log('\n📦 Equity Holdings...');
  
  const response = await callAPI('/pfm/api/v2/equities/user-linked-accounts/holding-broker', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.holdings?.length) { console.log('   ⚠️ No holdings'); return; }
  
  let dbAccountId = '';
  for (const [_, id] of accountMap) { dbAccountId = id; break; }
  if (!dbAccountId) { console.log('   ⚠️ No account'); return; }
  
  const { data: fetchRun } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: 'EQUITY_HOLDINGS',
      request_id: generateHash('EQ', Date.now()),
      status: 'FETCHED',
    })
    .select()
    .single();
  
  await supabase.from('aa_fetch_payloads').insert({
    fetch_run_id: fetchRun?.id,
    payload_role: 'RESPONSE',
    raw_payload: response,
    hash_sha256: generateHash(JSON.stringify(response)),
  });
  
  let count = 0;
  for (const h of response.holdings) {
    const broker = h.brokers?.[0];
    const { error } = await supabase.from('fi_equity_holdings').insert({
      account_id: dbAccountId,
      fetch_run_id: fetchRun?.id,
      issuer_name: h.issuerName,
      isin: h.isin,
      isin_desc: h.isinDescription,
      units: parseNum(h.units),
      last_price: parseNum(h.lastTradedPrice),
      current_value: parseNum(h.currentValue),
      broker_name: broker?.brokerName,
      demat_id: broker?.dematId,
      holding_hash: generateHash(dbAccountId, h.isin, broker?.brokerId),
    });
    if (!error) { count++; totalRecords++; }
  }
  
  console.log(`   ✅ ${count} equity holdings`);
}

async function seedInsights(userId: string, fiType: string, accountMap: Map<string, string>, apiPath: string) {
  console.log(`\n📦 ${fiType} Insights...`);
  
  let accountId = '';
  for (const [ref, _] of accountMap) { if (ref?.length > 10) { accountId = ref; break; } }
  if (!accountId) { console.log('   ⚠️ No account'); return; }
  
  const response = await callAPI(apiPath, {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    accountIds: [accountId],
    from: '2025-01-01',
    to: new Date().toISOString().split('T')[0],
    frequency: 'MONTHLY',
  });
  
  if (!response) { console.log('   ⚠️ No data'); return; }
  
  const { error } = await supabase.from('user_financial_snapshots').insert({
    user_id: userId,
    snapshot_type: `${fiType.toUpperCase()}_INSIGHTS`,
    fi_type: fiType.toUpperCase(),
    snapshot: response,
    generated_at: new Date().toISOString(),
  });
  
  if (!error) { console.log('   ✅ Stored as JSONB'); totalRecords++; }
}

async function main() {
  console.log('🚀 SIMPLE SEED SCRIPT');
  console.log('='.repeat(60));
  
  // Infrastructure
  console.log('\n📦 Infrastructure...');
  
  const { data: tsp } = await supabase
    .from('tsp_providers')
    .select('id')
    .eq('name', 'FINFACTOR')
    .single();
  
  let tspId = tsp?.id;
  if (!tspId) {
    const { data: newTsp } = await supabase
      .from('tsp_providers')
      .insert({ name: 'FINFACTOR', environment: 'SANDBOX', base_url: 'https://pqapi.finfactor.in', is_active: true })
      .select()
      .single();
    tspId = newTsp?.id;
  }
  console.log('   ✅ TSP:', tspId);
  
  const { data: user } = await supabase
    .from('app_users')
    .select('id')
    .eq('unique_identifier', UNIQUE_IDENTIFIER)
    .single();
  
  let userId = user?.id;
  if (!userId) {
    const { data: newUser } = await supabase
      .from('app_users')
      .insert({ phone: UNIQUE_IDENTIFIER, unique_identifier: UNIQUE_IDENTIFIER })
      .select()
      .single();
    userId = newUser?.id;
  }
  console.log('   ✅ User:', userId);
  
  if (!tspId || !userId) {
    console.error('❌ Failed to create infrastructure');
    return;
  }
  
  // Clear existing data
  await clearExistingData(userId);
  
  // Seed all account types
  const depositAccounts = await seedAccounts(userId, tspId, 'DEPOSIT', '/pfm/api/v2/deposit/user-linked-accounts', 'fi_deposit_summaries');
  const tdAccounts = await seedAccounts(userId, tspId, 'TERM_DEPOSIT', '/pfm/api/v2/term-deposit/user-linked-accounts', 'fi_term_deposit_summaries');
  const rdAccounts = await seedAccounts(userId, tspId, 'RECURRING_DEPOSIT', '/pfm/api/v2/recurring-deposit/user-linked-accounts', 'fi_recurring_deposit_summaries');
  const mfAccounts = await seedAccounts(userId, tspId, 'MUTUAL_FUND', '/pfm/api/v2/mutual-fund/user-linked-accounts', 'fi_mutual_fund_summaries');
  const eqAccounts = await seedAccounts(userId, tspId, 'EQUITIES', '/pfm/api/v2/equities/user-linked-accounts', 'fi_equity_summaries');
  await seedAccounts(userId, tspId, 'ETF', '/pfm/api/v2/etf/user-linked-accounts', '');
  
  // Transactions
  await seedTransactions(userId, tspId, depositAccounts);
  
  // Holdings
  await seedMFHoldings(userId, tspId, mfAccounts);
  await seedEquityHoldings(userId, tspId, eqAccounts);
  
  // Insights
  await seedInsights(userId, 'deposit', depositAccounts, '/pfm/api/v2/deposit/insights');
  await seedInsights(userId, 'mutualFund', mfAccounts, '/pfm/api/v2/mutual-fund/insights');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📈 Total Records: ${totalRecords}`);
  console.log('✨ Done!');
}

main().catch(console.error);

