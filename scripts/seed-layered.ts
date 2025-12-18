/**
 * LAYERED SEED SCRIPT
 * 
 * This script follows the 3-layer architecture:
 * 
 * LAYER A: Store raw JSON from APIs
 *   - aa_data_fetch_runs: Track each API call
 *   - aa_fetch_payloads: Store raw JSON response
 *   - tsp_api_calls: Audit log with response_payload
 * 
 * LAYER B: Parse and normalize data
 *   - fips, brokers: Reference data
 *   - fi_accounts: All linked accounts
 *   - fi_transactions: All transactions
 * 
 * LAYER C: Derive summaries and holdings
 *   - fi_*_summaries: Account summaries
 *   - fi_*_holdings: Holdings data
 *   - user_financial_snapshots: Insights as JSONB
 * 
 * Run: npm run seed:layered
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';
import { makeAuthenticatedRequest } from '../lib/finfactor';
import * as crypto from 'crypto';

// =====================================================
// CONFIGURATION
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epxfwxzerivaklmennfo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const UNIQUE_IDENTIFIER = '8956545791';

// Track results
interface SeedResult {
  layer: 'A' | 'B' | 'C';
  table: string;
  records: number;
  status: 'SUCCESS' | 'ERROR' | 'EMPTY';
  message?: string;
}

const results: SeedResult[] = [];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateHash(...parts: (string | number | undefined)[]): string {
  const content = parts.filter(p => p !== undefined).join('|');
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 64);
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}

function parseDate(value: any): string | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

async function callAPI<T>(endpoint: string, body: any): Promise<T | null> {
  try {
    const response = await makeAuthenticatedRequest<T>(endpoint, body);
    return response?.data || response;
  } catch (error: any) {
    console.error(`   API Error ${endpoint}:`, error.message);
    return null;
  }
}

// =====================================================
// LAYER A: INFRASTRUCTURE & RAW DATA
// =====================================================

async function seedLayerA_Infrastructure(): Promise<{
  tspId: string | null;
  aaGatewayId: string | null;
  userId: string | null;
}> {
  console.log('\n📦 LAYER A: Seeding Infrastructure...\n');
  
  // TSP Provider
  const { data: tsp, error: tspError } = await supabase
    .from('tsp_providers')
    .upsert({ 
      name: 'FINFACTOR', 
      environment: 'SANDBOX',
      base_url: 'https://pqapi.finfactor.in',
      is_active: true 
    }, { onConflict: 'name,environment' })
    .select()
    .single();
  
  if (tspError) console.error('   ❌ TSP:', tspError.message);
  else console.log('   ✅ TSP Provider:', tsp.id);
  
  // AA Gateway
  const { data: aa, error: aaError } = await supabase
    .from('aa_gateways')
    .upsert({ 
      name: 'FINVU', 
      environment: 'SANDBOX',
      gateway_base_url: 'https://webvwdev.finvu.in',
      is_active: true 
    }, { onConflict: 'name,environment' })
    .select()
    .single();
  
  if (aaError) console.error('   ❌ AA Gateway:', aaError.message);
  else console.log('   ✅ AA Gateway:', aa.id);
  
  // App User
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .upsert({
      phone: UNIQUE_IDENTIFIER,
      unique_identifier: UNIQUE_IDENTIFIER,
      email: `user${UNIQUE_IDENTIFIER}@example.com`,
    }, { onConflict: 'unique_identifier' })
    .select()
    .single();
  
  if (userError) console.error('   ❌ App User:', userError.message);
  else console.log('   ✅ App User:', user.id);
  
  return {
    tspId: tsp?.id || null,
    aaGatewayId: aa?.id || null,
    userId: user?.id || null,
  };
}

async function storeRawPayload(
  userId: string,
  tspId: string,
  fetchType: string,
  endpoint: string,
  rawResponse: any
): Promise<string | null> {
  // Create fetch run
  const requestId = generateHash(fetchType, UNIQUE_IDENTIFIER, Date.now());
  
  const { data: fetchRun, error: runError } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: fetchType,
      endpoint: endpoint,
      request_id: requestId,
      status: 'FETCHED',
      requested_at: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      records_count: Array.isArray(rawResponse) ? rawResponse.length : 1,
    })
    .select()
    .single();
  
  if (runError) {
    console.error(`   ❌ Fetch run error:`, runError.message);
    return null;
  }
  
  // Store raw payload
  const payloadHash = generateHash(JSON.stringify(rawResponse));
  
  const { error: payloadError } = await supabase
    .from('aa_fetch_payloads')
    .insert({
      fetch_run_id: fetchRun.id,
      payload_role: 'RESPONSE',
      content_format: 'JSON',
      raw_payload: rawResponse,  // ★ RAW JSON stored here!
      hash_sha256: payloadHash,
    });
  
  if (payloadError) {
    console.error(`   ❌ Payload storage error:`, payloadError.message);
  }
  
  results.push({
    layer: 'A',
    table: 'aa_fetch_payloads',
    records: 1,
    status: 'SUCCESS',
    message: `${fetchType} raw data stored`,
  });
  
  return fetchRun.id;
}

// =====================================================
// LAYER B: CANONICAL DATA
// =====================================================

async function seedLayerB_FIPs(): Promise<Map<string, string>> {
  console.log('\n📦 LAYER B: Seeding FIPs...');
  const fipMap = new Map<string, string>();
  
  const response = await callAPI<any>('/pfm/api/v2/fips', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.fips?.length) {
    console.log('   ⚠️ No FIPs returned');
    return fipMap;
  }
  
  let inserted = 0;
  for (const fip of response.fips.slice(0, 100)) {
    const { data, error } = await supabase
      .from('fips')
      .upsert({
        fip_code: fip.fipId,
        name: fip.fipName,
        type: fip.fiTypes?.[0] || 'BANK',
        fi_types: fip.fiTypes,
        environment: 'SANDBOX',
        is_active: true,
      }, { onConflict: 'fip_code' })
      .select()
      .single();
    
    if (!error && data) {
      fipMap.set(fip.fipId, data.id);
      fipMap.set(fip.fipName, data.id);
      inserted++;
    }
  }
  
  console.log(`   ✅ Seeded ${inserted} FIPs`);
  results.push({ layer: 'B', table: 'fips', records: inserted, status: 'SUCCESS' });
  return fipMap;
}

async function seedLayerB_Brokers(): Promise<Map<string, string>> {
  console.log('\n📦 LAYER B: Seeding Brokers...');
  const brokerMap = new Map<string, string>();
  
  const response = await callAPI<any>('/pfm/api/v2/brokers', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.brokers?.length) {
    console.log('   ⚠️ No brokers returned');
    return brokerMap;
  }
  
  let inserted = 0;
  for (const broker of response.brokers) {
    const { data, error } = await supabase
      .from('brokers')
      .upsert({
        broker_code: broker.brokerId,
        name: broker.brokerName,
        type: 'EQUITY',
        is_active: true,
      }, { onConflict: 'broker_code' })
      .select()
      .single();
    
    if (!error && data) {
      brokerMap.set(broker.brokerId, data.id);
      brokerMap.set(broker.brokerName, data.id);
      inserted++;
    }
  }
  
  console.log(`   ✅ Seeded ${inserted} Brokers`);
  results.push({ layer: 'B', table: 'brokers', records: inserted, status: 'SUCCESS' });
  return brokerMap;
}

async function seedLayerB_Accounts(
  userId: string,
  tspId: string,
  fipMap: Map<string, string>,
  fiType: string,
  apiPath: string
): Promise<{ accountMap: Map<string, string>; rawResponse: any; fetchRunId: string | null }> {
  console.log(`\n📦 LAYER B: Seeding ${fiType} Accounts...`);
  const accountMap = new Map<string, string>();
  
  const response = await callAPI<any>(apiPath, {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    filterZeroValueAccounts: 'false',
    filterZeroValueHoldings: 'false',
  });
  
  if (!response?.fipData?.length) {
    console.log(`   ⚠️ No ${fiType} accounts returned`);
    results.push({ layer: 'B', table: 'fi_accounts', records: 0, status: 'EMPTY', message: fiType });
    return { accountMap, rawResponse: null, fetchRunId: null };
  }
  
  // Store raw response in Layer A
  const fetchRunId = await storeRawPayload(userId, tspId, `${fiType}_LINKED_ACCOUNTS`, apiPath, response);
  
  let insertedAccounts = 0;
  let insertedHolders = 0;
  
  for (const fip of response.fipData) {
    const fipName = fip.fipName || 'Unknown';
    const fipId = fipMap.get(fip.fipId) || fipMap.get(fipName) || null;
    
    for (const acc of fip.linkedAccounts || []) {
      const accountRefNumber = acc.accountRefNumber || acc.linkRefNumber || acc.maskedAccNumber;
      const accountHash = generateHash(UNIQUE_IDENTIFIER, fipName, accountRefNumber, fiType);
      
      const { data, error } = await supabase
        .from('fi_accounts')
        .upsert({
          user_id: userId,
          fip_id: fipId,
          fetch_run_id: fetchRunId,
          fi_type: fiType,
          fip_account_type: acc.accType || acc.accountType,
          fip_account_sub_type: acc.accSubType,
          aa_linked_ref: acc.linkRefNumber,
          masked_acc_no: acc.maskedAccNumber,
          provider_name: fipName,
          account_ref_number: acc.accountRefNumber,
          link_ref_number: acc.linkRefNumber,
          fip_name: fipName,
          fip_id_external: fip.fipId,
          link_status: acc.linkStatus || 'LINKED',
          consent_id_list: acc.consentIdList,
          account_ref_hash: accountHash,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'account_ref_hash' })
        .select()
        .single();
      
      if (!error && data) {
        accountMap.set(accountRefNumber, data.id);
        accountMap.set(acc.maskedAccNumber || '', data.id);
        insertedAccounts++;
        
        // Insert holder info
        const profile = acc.Profile || acc.profile || {};
        const holders = profile.Holders?.Holder || [];
        
        for (const holder of holders) {
          if (holder.name) {
            const { error: holderError } = await supabase
              .from('fi_account_holders_pii')
              .insert({
                account_id: data.id,
                holders_type: holders.length > 1 ? 'JOINT' : 'SINGLE',
                name: holder.name,
                dob: parseDate(holder.dob),
                mobile: holder.mobile,
                email: holder.email,
                pan: holder.pan,
                address: holder.address,
                ckyc_registered: holder.ckycCompliance === 'true',
                kyc_compliance: holder.kycCompliance,
                nominee: holder.nominee,
              });
            
            if (!holderError) insertedHolders++;
          }
        }
      }
    }
  }
  
  console.log(`   ✅ Seeded ${insertedAccounts} ${fiType} accounts, ${insertedHolders} holders`);
  results.push({ layer: 'B', table: 'fi_accounts', records: insertedAccounts, status: 'SUCCESS', message: fiType });
  
  return { accountMap, rawResponse: response, fetchRunId };
}

async function seedLayerB_Transactions(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>
): Promise<void> {
  console.log('\n📦 LAYER B: Seeding Transactions...');
  
  // Get first account ID for transactions
  let accountId = '';
  for (const [ref, id] of accountMap) {
    if (ref && ref.length > 10) {
      accountId = ref;
      break;
    }
  }
  
  if (!accountId) {
    console.log('   ⚠️ No account ID available for transactions');
    return;
  }
  
  const response = await callAPI<any>('/pfm/api/v2/deposit/user-account-statement', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    accountId: accountId,
    dateRangeFrom: '2025-01-01',
  });
  
  if (!response?.transactions?.length) {
    console.log('   ⚠️ No transactions returned');
    results.push({ layer: 'B', table: 'fi_transactions', records: 0, status: 'EMPTY' });
    return;
  }
  
  // Store raw in Layer A
  const fetchRunId = await storeRawPayload(userId, tspId, 'DEPOSIT_TRANSACTIONS', '/pfm/api/v2/deposit/user-account-statement', response);
  
  const dbAccountId = accountMap.get(accountId);
  if (!dbAccountId) {
    console.log('   ⚠️ Could not find account in DB');
    return;
  }
  
  let inserted = 0;
  for (const txn of response.transactions) {
    const dedupeHash = generateHash(
      dbAccountId,
      txn.amount,
      txn.transactionTimestamp,
      txn.narration,
      txn.reference
    );
    
    const { error } = await supabase
      .from('fi_transactions')
      .upsert({
        account_id: dbAccountId,
        fetch_run_id: fetchRunId,
        txn_id: txn.txnId,
        txn_type: txn.type,
        mode: txn.mode,
        amount: parseNumber(txn.amount),
        balance: parseNumber(txn.currentBalance),
        txn_timestamp: txn.transactionTimestamp,
        value_date: parseDate(txn.valueDate),
        narration: txn.narration,
        reference: txn.reference,
        category: txn.category,
        sub_category: txn.subCategory,
        dedupe_hash: dedupeHash,
      }, { onConflict: 'account_id,dedupe_hash' });
    
    if (!error) inserted++;
  }
  
  console.log(`   ✅ Seeded ${inserted} transactions`);
  results.push({ layer: 'B', table: 'fi_transactions', records: inserted, status: 'SUCCESS' });
}

// =====================================================
// LAYER C: DERIVED DATA (SUMMARIES & HOLDINGS)
// =====================================================

async function seedLayerC_DepositSummaries(
  rawResponse: any,
  accountMap: Map<string, string>,
  fetchRunId: string | null
): Promise<void> {
  console.log('\n📦 LAYER C: Deriving Deposit Summaries...');
  
  if (!rawResponse?.fipData) return;
  
  let inserted = 0;
  for (const fip of rawResponse.fipData) {
    for (const acc of fip.linkedAccounts || []) {
      const accountRef = acc.accountRefNumber || acc.linkRefNumber || acc.maskedAccNumber;
      const dbAccountId = accountMap.get(accountRef);
      
      if (!dbAccountId) continue;
      
      const summary = acc.Summary || acc.summary || {};
      const profile = acc.Profile || acc.profile || {};
      
      const { error } = await supabase
        .from('fi_deposit_summaries')
        .upsert({
          account_id: dbAccountId,
          fetch_run_id: fetchRunId,
          current_balance: parseNumber(summary.currentBalance || acc.currentBalance),
          currency: summary.currency || 'INR',
          balance_datetime: summary.balanceDateTime,
          account_type: profile.accType || acc.accType,
          account_sub_type: profile.accSubType,
          branch: profile.branch,
          ifsc: profile.ifsc || profile.ifscCode,
          micr_code: profile.micrCode,
          opening_date: parseDate(profile.openingDate),
          status: profile.status || acc.linkStatus,
          available_balance: parseNumber(summary.availableBalance),
          pending_balance: parseNumber(summary.pendingBalance),
          available_credit_limit: parseNumber(summary.availableCreditLimit),
          drawing_limit: parseNumber(summary.drawingLimit),
          facility_type: profile.facilityType,
        }, { onConflict: 'account_id' });
      
      if (!error) inserted++;
    }
  }
  
  console.log(`   ✅ Derived ${inserted} deposit summaries`);
  results.push({ layer: 'C', table: 'fi_deposit_summaries', records: inserted, status: 'SUCCESS' });
}

async function seedLayerC_TermDepositSummaries(
  rawResponse: any,
  accountMap: Map<string, string>,
  fetchRunId: string | null
): Promise<void> {
  console.log('\n📦 LAYER C: Deriving Term Deposit Summaries...');
  
  if (!rawResponse?.fipData) return;
  
  let inserted = 0;
  for (const fip of rawResponse.fipData) {
    for (const acc of fip.linkedAccounts || []) {
      const accountRef = acc.accountRefNumber || acc.linkRefNumber || acc.maskedAccNumber;
      const dbAccountId = accountMap.get(accountRef);
      
      if (!dbAccountId) continue;
      
      const { error } = await supabase
        .from('fi_term_deposit_summaries')
        .upsert({
          account_id: dbAccountId,
          fetch_run_id: fetchRunId,
          principal_amount: parseNumber(acc.principalAmount || acc.depositAmount),
          current_balance: parseNumber(acc.currentValue || acc.currentBalance),
          maturity_amount: parseNumber(acc.maturityAmount),
          maturity_date: parseDate(acc.maturityDate),
          interest_rate: parseNumber(acc.interestRate),
          interest_payout: acc.interestPayout,
          tenure_months: acc.tenureMonths,
          tenure_days: acc.tenureDays,
          opening_date: parseDate(acc.openingDate),
        }, { onConflict: 'account_id' });
      
      if (!error) inserted++;
    }
  }
  
  console.log(`   ✅ Derived ${inserted} term deposit summaries`);
  results.push({ layer: 'C', table: 'fi_term_deposit_summaries', records: inserted, status: 'SUCCESS' });
}

async function seedLayerC_RecurringDepositSummaries(
  rawResponse: any,
  accountMap: Map<string, string>,
  fetchRunId: string | null
): Promise<void> {
  console.log('\n📦 LAYER C: Deriving Recurring Deposit Summaries...');
  
  if (!rawResponse?.fipData) return;
  
  let inserted = 0;
  for (const fip of rawResponse.fipData) {
    for (const acc of fip.linkedAccounts || []) {
      const accountRef = acc.accountRefNumber || acc.linkRefNumber || acc.maskedAccNumber;
      const dbAccountId = accountMap.get(accountRef);
      
      if (!dbAccountId) continue;
      
      const { error } = await supabase
        .from('fi_recurring_deposit_summaries')
        .upsert({
          account_id: dbAccountId,
          fetch_run_id: fetchRunId,
          current_balance: parseNumber(acc.currentValue || acc.currentBalance),
          maturity_amount: parseNumber(acc.maturityAmount),
          maturity_date: parseDate(acc.maturityDate),
          interest_rate: parseNumber(acc.interestRate),
          recurring_amount: parseNumber(acc.recurringAmount || acc.installmentAmount),
          tenure_months: acc.tenureMonths,
          recurring_day: acc.recurringDay,
          installments_paid: acc.installmentsPaid,
          installments_remaining: acc.installmentsRemaining,
          opening_date: parseDate(acc.openingDate),
        }, { onConflict: 'account_id' });
      
      if (!error) inserted++;
    }
  }
  
  console.log(`   ✅ Derived ${inserted} recurring deposit summaries`);
  results.push({ layer: 'C', table: 'fi_recurring_deposit_summaries', records: inserted, status: 'SUCCESS' });
}

async function seedLayerC_MutualFundHoldings(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>
): Promise<void> {
  console.log('\n📦 LAYER C: Seeding Mutual Fund Holdings...');
  
  const response = await callAPI<any>('/pfm/api/v2/mutual-fund/holding-folio', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.holdings?.length) {
    console.log('   ⚠️ No MF holdings returned');
    return;
  }
  
  // Store raw in Layer A
  const fetchRunId = await storeRawPayload(userId, tspId, 'MF_HOLDINGS', '/pfm/api/v2/mutual-fund/holding-folio', response);
  
  // Get first account ID
  let dbAccountId: string | null = null;
  for (const [_, id] of accountMap) {
    dbAccountId = id;
    break;
  }
  
  if (!dbAccountId) {
    console.log('   ⚠️ No MF account found');
    return;
  }
  
  let inserted = 0;
  for (const holding of response.holdings) {
    const holdingHash = generateHash(
      dbAccountId,
      holding.isin,
      holding.folios?.[0]?.folioNo
    );
    
    const { error } = await supabase
      .from('fi_mutual_fund_holdings')
      .upsert({
        account_id: dbAccountId,
        fetch_run_id: fetchRunId,
        amc: holding.amc,
        scheme_name: holding.isinDescription || holding.schemeName,
        scheme_code: holding.schemeCode,
        scheme_plan: holding.schemePlan,
        scheme_option: holding.schemeOption,
        scheme_category: holding.schemeCategory,
        scheme_type: holding.schemeType,
        isin: holding.isin,
        folio_no: holding.folios?.[0]?.folioNo,
        units: parseNumber(holding.closingUnits),
        nav: parseNumber(holding.nav),
        nav_date: parseDate(holding.navDate),
        current_value: parseNumber(holding.currentValue),
        cost_value: parseNumber(holding.costValue),
        returns_absolute: parseNumber(holding.returnsAbsolute),
        returns_percentage: parseNumber(holding.returnsPercentage),
        holding_hash: holdingHash,
      }, { onConflict: 'account_id,holding_hash' });
    
    if (!error) inserted++;
  }
  
  console.log(`   ✅ Seeded ${inserted} MF holdings`);
  results.push({ layer: 'C', table: 'fi_mutual_fund_holdings', records: inserted, status: 'SUCCESS' });
}

async function seedLayerC_EquityHoldings(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>,
  brokerMap: Map<string, string>
): Promise<void> {
  console.log('\n📦 LAYER C: Seeding Equity Holdings...');
  
  const response = await callAPI<any>('/pfm/api/v2/equities/holding-broker', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.holdings?.length) {
    console.log('   ⚠️ No equity holdings returned');
    return;
  }
  
  // Store raw in Layer A
  const fetchRunId = await storeRawPayload(userId, tspId, 'EQUITY_HOLDINGS', '/pfm/api/v2/equities/holding-broker', response);
  
  // Get first account ID
  let dbAccountId: string | null = null;
  for (const [_, id] of accountMap) {
    dbAccountId = id;
    break;
  }
  
  if (!dbAccountId) {
    console.log('   ⚠️ No equity account found');
    return;
  }
  
  let inserted = 0;
  for (const holding of response.holdings) {
    const holdingHash = generateHash(
      dbAccountId,
      holding.isin,
      holding.brokers?.[0]?.brokerId
    );
    
    const broker = holding.brokers?.[0];
    const brokerId = broker?.brokerId ? brokerMap.get(broker.brokerId) : null;
    
    const { error } = await supabase
      .from('fi_equity_holdings')
      .upsert({
        account_id: dbAccountId,
        fetch_run_id: fetchRunId,
        broker_id: brokerId,
        issuer_name: holding.issuerName,
        isin: holding.isin,
        isin_desc: holding.isinDescription,
        units: parseNumber(holding.units),
        avg_buy_price: parseNumber(holding.avgBuyPrice),
        last_price: parseNumber(holding.lastTradedPrice),
        current_value: parseNumber(holding.currentValue),
        cost_value: parseNumber(holding.costValue),
        broker_name: broker?.brokerName,
        demat_id: broker?.dematId,
        returns_absolute: parseNumber(holding.returnsAbsolute),
        returns_percentage: parseNumber(holding.returnsPercentage),
        portfolio_weight_percent: parseNumber(holding.portfolioWeightPercent),
        holding_hash: holdingHash,
      }, { onConflict: 'account_id,holding_hash' });
    
    if (!error) inserted++;
  }
  
  console.log(`   ✅ Seeded ${inserted} equity holdings`);
  results.push({ layer: 'C', table: 'fi_equity_holdings', records: inserted, status: 'SUCCESS' });
}

async function seedLayerC_Insights(
  userId: string,
  fiType: string,
  accountMap: Map<string, string>,
  apiPath: string
): Promise<void> {
  console.log(`\n📦 LAYER C: Storing ${fiType} Insights as JSONB...`);
  
  // Get first account ID
  let accountId = '';
  for (const [ref, _] of accountMap) {
    if (ref && ref.length > 10) {
      accountId = ref;
      break;
    }
  }
  
  if (!accountId) {
    console.log(`   ⚠️ No account for ${fiType} insights`);
    return;
  }
  
  const response = await callAPI<any>(apiPath, {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    accountIds: [accountId],
    from: '2025-01-01',
    to: new Date().toISOString().split('T')[0],
    frequency: 'MONTHLY',
  });
  
  if (!response) {
    console.log(`   ⚠️ No ${fiType} insights returned`);
    return;
  }
  
  // Store full insights as JSONB snapshot
  const { error } = await supabase
    .from('user_financial_snapshots')
    .insert({
      user_id: userId,
      snapshot_type: `${fiType.toUpperCase()}_INSIGHTS`,
      fi_type: fiType.toUpperCase(),
      snapshot: response,  // ★ Full insights stored as JSONB
      generated_at: new Date().toISOString(),
    });
  
  if (!error) {
    console.log(`   ✅ Stored ${fiType} insights snapshot`);
    results.push({ layer: 'C', table: 'user_financial_snapshots', records: 1, status: 'SUCCESS', message: fiType });
  }
}

// =====================================================
// MAIN
// =====================================================

async function seedAllLayers() {
  console.log('🚀 Starting Layered Database Seeding...\n');
  console.log('='.repeat(60));
  
  // Layer A: Infrastructure
  const { tspId, aaGatewayId, userId } = await seedLayerA_Infrastructure();
  
  if (!tspId || !userId) {
    console.error('❌ Failed to create infrastructure. Exiting.');
    return;
  }
  
  // Layer B: Reference Data
  const fipMap = await seedLayerB_FIPs();
  const brokerMap = await seedLayerB_Brokers();
  
  // Layer B: Accounts (+ Layer A raw storage)
  const depositResult = await seedLayerB_Accounts(userId, tspId, fipMap, 'DEPOSIT', '/pfm/api/v2/deposit/user-linked-accounts');
  const termDepositResult = await seedLayerB_Accounts(userId, tspId, fipMap, 'TERM_DEPOSIT', '/pfm/api/v2/term-deposit/user-linked-accounts');
  const rdResult = await seedLayerB_Accounts(userId, tspId, fipMap, 'RECURRING_DEPOSIT', '/pfm/api/v2/recurring-deposit/user-linked-accounts');
  const mfResult = await seedLayerB_Accounts(userId, tspId, fipMap, 'MUTUAL_FUND', '/pfm/api/v2/mutual-fund/user-linked-accounts');
  const equityResult = await seedLayerB_Accounts(userId, tspId, fipMap, 'EQUITIES', '/pfm/api/v2/equities/user-linked-accounts');
  const etfResult = await seedLayerB_Accounts(userId, tspId, fipMap, 'ETF', '/pfm/api/v2/etf/user-linked-accounts');
  
  // Layer B: Transactions
  await seedLayerB_Transactions(userId, tspId, depositResult.accountMap);
  
  // Layer C: Summaries (derived from raw data)
  await seedLayerC_DepositSummaries(depositResult.rawResponse, depositResult.accountMap, depositResult.fetchRunId);
  await seedLayerC_TermDepositSummaries(termDepositResult.rawResponse, termDepositResult.accountMap, termDepositResult.fetchRunId);
  await seedLayerC_RecurringDepositSummaries(rdResult.rawResponse, rdResult.accountMap, rdResult.fetchRunId);
  
  // Layer C: Holdings
  await seedLayerC_MutualFundHoldings(userId, tspId, mfResult.accountMap);
  await seedLayerC_EquityHoldings(userId, tspId, equityResult.accountMap, brokerMap);
  
  // Layer C: Insights as JSONB
  await seedLayerC_Insights(userId, 'deposit', depositResult.accountMap, '/pfm/api/v2/deposit/insights');
  await seedLayerC_Insights(userId, 'mutualFund', mfResult.accountMap, '/pfm/api/v2/mutual-fund/insights');
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING SUMMARY');
  console.log('='.repeat(60));
  
  const layerA = results.filter(r => r.layer === 'A');
  const layerB = results.filter(r => r.layer === 'B');
  const layerC = results.filter(r => r.layer === 'C');
  
  console.log('\n📦 LAYER A (Raw Data):');
  layerA.forEach(r => console.log(`   ${r.table}: ${r.records} records ${r.message || ''}`));
  
  console.log('\n📦 LAYER B (Canonical):');
  layerB.forEach(r => console.log(`   ${r.table}: ${r.records} records ${r.message || ''}`));
  
  console.log('\n📦 LAYER C (Derived):');
  layerC.forEach(r => console.log(`   ${r.table}: ${r.records} records ${r.message || ''}`));
  
  const total = results.reduce((sum, r) => sum + r.records, 0);
  console.log(`\n📈 Total Records: ${total}`);
  console.log('\n✨ Seeding completed!');
}

seedAllLayers().catch(console.error);

