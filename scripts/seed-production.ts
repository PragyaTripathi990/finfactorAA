/**
 * PRODUCTION SEED SCRIPT - Fixed for actual API structure
 * 
 * The API returns FLAT structure (not nested Summary/Profile objects):
 * - accountCurrentBalance (not Summary.currentBalance)
 * - accountBranch (not Profile.branch)
 * - holderName (not Profile.Holders.Holder[].name)
 * 
 * Run: npm run seed:production
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
let totalRecords = 0;

// =====================================================
// HELPERS
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
    console.log(`   📡 Calling ${endpoint}...`);
    const response = await makeAuthenticatedRequest<T>(endpoint, body);
    return response as T;
  } catch (error: any) {
    console.error(`   ❌ API Error: ${error.message}`);
    return null;
  }
}

// =====================================================
// LAYER A: INFRASTRUCTURE
// =====================================================

async function seedInfrastructure(): Promise<{ tspId: string; userId: string } | null> {
  console.log('\n📦 LAYER A: Infrastructure...');
  
  // TSP Provider
  const { data: tsp } = await supabase
    .from('tsp_providers')
    .upsert({ name: 'FINFACTOR', environment: 'SANDBOX', base_url: 'https://pqapi.finfactor.in', is_active: true }, { onConflict: 'name,environment' })
    .select()
    .single();
  
  if (!tsp) {
    console.error('   ❌ Failed to create TSP Provider');
    return null;
  }
  console.log('   ✅ TSP Provider:', tsp.id);
  
  // AA Gateway
  await supabase
    .from('aa_gateways')
    .upsert({ name: 'FINVU', environment: 'SANDBOX', gateway_base_url: 'https://webvwdev.finvu.in', is_active: true }, { onConflict: 'name,environment' });
  console.log('   ✅ AA Gateway created');
  
  // App User
  const { data: user } = await supabase
    .from('app_users')
    .upsert({ phone: UNIQUE_IDENTIFIER, unique_identifier: UNIQUE_IDENTIFIER }, { onConflict: 'unique_identifier' })
    .select()
    .single();
  
  if (!user) {
    console.error('   ❌ Failed to create App User');
    return null;
  }
  console.log('   ✅ App User:', user.id);
  
  return { tspId: tsp.id, userId: user.id };
}

// =====================================================
// LAYER B & C: ACCOUNTS + SUMMARIES (Combined)
// =====================================================

async function seedAccountsAndSummaries(
  userId: string,
  tspId: string,
  fiType: string,
  apiPath: string,
  summaryTable: string
): Promise<Map<string, string>> {
  console.log(`\n📦 Seeding ${fiType}...`);
  const accountMap = new Map<string, string>();
  
  const response = await callAPI<any>(apiPath, {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    filterZeroValueAccounts: 'false',
    filterZeroValueHoldings: 'false',
  });
  
  if (!response?.fipData?.length) {
    console.log(`   ⚠️ No ${fiType} data returned`);
    return accountMap;
  }
  
  console.log(`   📊 Found ${response.fipData.length} FIPs`);
  
  // Create fetch run
  const fetchRunId = generateHash(fiType, UNIQUE_IDENTIFIER, Date.now());
  const { data: fetchRun } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: `${fiType}_LINKED_ACCOUNTS`,
      endpoint: apiPath,
      request_id: fetchRunId,
      status: 'FETCHED',
      requested_at: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  // Store raw payload
  await supabase
    .from('aa_fetch_payloads')
    .insert({
      fetch_run_id: fetchRun?.id,
      payload_role: 'RESPONSE',
      content_format: 'JSON',
      raw_payload: response,
      hash_sha256: generateHash(JSON.stringify(response)),
    });
  
  let insertedAccounts = 0;
  let insertedHolders = 0;
  let insertedSummaries = 0;
  
  for (const fip of response.fipData) {
    const fipName = fip.fipName || 'Unknown';
    
    // First, ensure FIP exists
    let fipId: string | null = null;
    const { data: existingFip } = await supabase
      .from('fips')
      .upsert({
        fip_code: fip.fipId,
        name: fipName,
        type: 'BANK',
        environment: 'SANDBOX',
        is_active: true,
      }, { onConflict: 'fip_code' })
      .select()
      .single();
    
    if (existingFip) {
      fipId = existingFip.id;
    }
    
    for (const acc of fip.linkedAccounts || []) {
      // Generate hash for dedup
      const accountHash = generateHash(
        UNIQUE_IDENTIFIER,
        fipName,
        acc.accountRefNumber || acc.maskedAccNumber,
        fiType
      );
      
      // Insert account (Layer B)
      const { data: accountData, error: accountError } = await supabase
        .from('fi_accounts')
        .upsert({
          user_id: userId,
          fip_id: fipId,
          fetch_run_id: fetchRun?.id,
          fi_type: fiType,
          fip_account_type: acc.accountType || acc.accType,
          fip_account_sub_type: acc.accountSubType || acc.accSubType,
          account_ref_number: acc.accountRefNumber,
          link_ref_number: acc.linkRefNumber,
          aa_linked_ref: acc.linkRefNumber,
          masked_acc_no: acc.maskedAccNumber,
          fip_name: fipName,
          fip_id_external: fip.fipId,
          provider_name: fipName,
          link_status: acc.linkStatus || 'LINKED',
          account_ref_hash: accountHash,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'account_ref_hash' })
        .select()
        .single();
      
      if (accountError) {
        console.error(`   ❌ Account error:`, accountError.message);
        continue;
      }
      
      if (accountData) {
        accountMap.set(acc.accountRefNumber || acc.maskedAccNumber, accountData.id);
        insertedAccounts++;
        totalRecords++;
        
        // Insert holder (Layer B) - Data is FLAT in API response
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
              ckyc_registered: acc.holderCkycCompliance === 'true' || acc.holderCkycCompliance === true,
              nominee: acc.holderNominee,
            });
          
          if (!holderError) {
            insertedHolders++;
            totalRecords++;
          }
        }
        
        // Insert summary (Layer C) - Data is FLAT
        if (summaryTable) {
          let summaryData: any = {
            account_id: accountData.id,
            fetch_run_id: fetchRun?.id,
          };
          
          if (fiType === 'DEPOSIT') {
            summaryData = {
              ...summaryData,
              current_balance: parseNumber(acc.accountCurrentBalance),
              currency: acc.accountCurrency || 'INR',
              account_type: acc.accountType,
              branch: acc.accountBranch,
              ifsc: acc.accountIfscCode,
              micr_code: acc.accountMicrCode,
              opening_date: parseDate(acc.accountOpeningDate),
              status: acc.accountStatus,
              available_credit_limit: parseNumber(acc.accountCurrentODLimit),
              drawing_limit: parseNumber(acc.accountDrawingLimit),
              facility_type: acc.accountFacility,
            };
          } else if (fiType === 'TERM_DEPOSIT') {
            summaryData = {
              ...summaryData,
              principal_amount: parseNumber(acc.principalAmount || acc.depositAmount),
              current_balance: parseNumber(acc.currentValue || acc.accountCurrentBalance),
              maturity_amount: parseNumber(acc.maturityAmount),
              maturity_date: parseDate(acc.maturityDate),
              interest_rate: parseNumber(acc.interestRate),
              interest_payout: acc.interestPayout,
              tenure_months: acc.tenureMonths,
              opening_date: parseDate(acc.openingDate || acc.accountOpeningDate),
            };
          } else if (fiType === 'RECURRING_DEPOSIT') {
            summaryData = {
              ...summaryData,
              current_balance: parseNumber(acc.currentValue || acc.accountCurrentBalance),
              maturity_amount: parseNumber(acc.maturityAmount),
              maturity_date: parseDate(acc.maturityDate),
              interest_rate: parseNumber(acc.interestRate),
              recurring_amount: parseNumber(acc.recurringAmount || acc.installmentAmount),
              tenure_months: acc.tenureMonths,
              recurring_day: acc.recurringDay,
              installments_paid: acc.installmentsPaid,
              installments_remaining: acc.installmentsRemaining,
            };
          } else if (fiType === 'MUTUAL_FUND') {
            summaryData = {
              ...summaryData,
              cost_value: parseNumber(acc.costValue),
              current_value: parseNumber(acc.currentValue || acc.accountCurrentBalance),
              total_holdings: acc.totalHoldings,
            };
          } else if (fiType === 'EQUITIES') {
            summaryData = {
              ...summaryData,
              current_value: parseNumber(acc.currentValue || acc.accountCurrentBalance),
              total_holdings: acc.totalHoldings,
            };
          }
          
          const { error: summaryError } = await supabase
            .from(summaryTable)
            .upsert(summaryData, { onConflict: 'account_id' });
          
          if (!summaryError) {
            insertedSummaries++;
            totalRecords++;
          } else {
            console.error(`   ❌ Summary error:`, summaryError.message);
          }
        }
      }
    }
  }
  
  console.log(`   ✅ ${fiType}: ${insertedAccounts} accounts, ${insertedHolders} holders, ${insertedSummaries} summaries`);
  return accountMap;
}

// =====================================================
// TRANSACTIONS
// =====================================================

async function seedTransactions(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>
): Promise<void> {
  console.log('\n📦 Seeding Transactions...');
  
  // Get first account ID
  let accountRefNumber = '';
  let dbAccountId = '';
  for (const [ref, id] of accountMap) {
    if (ref && ref.length > 10) {
      accountRefNumber = ref;
      dbAccountId = id;
      break;
    }
  }
  
  if (!accountRefNumber) {
    console.log('   ⚠️ No account available for transactions');
    return;
  }
  
  const response = await callAPI<any>('/pfm/api/v2/deposit/user-account-statement', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
    accountId: accountRefNumber,
    dateRangeFrom: '2025-01-01',
  });
  
  if (!response?.transactions?.length) {
    console.log('   ⚠️ No transactions returned');
    return;
  }
  
  console.log(`   📊 Found ${response.transactions.length} transactions`);
  
  // Create fetch run
  const fetchRunId = generateHash('TRANSACTIONS', UNIQUE_IDENTIFIER, Date.now());
  const { data: fetchRun } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: 'DEPOSIT_TRANSACTIONS',
      endpoint: '/pfm/api/v2/deposit/user-account-statement',
      request_id: fetchRunId,
      status: 'FETCHED',
    })
    .select()
    .single();
  
  // Store raw
  await supabase
    .from('aa_fetch_payloads')
    .insert({
      fetch_run_id: fetchRun?.id,
      payload_role: 'RESPONSE',
      content_format: 'JSON',
      raw_payload: response,
      hash_sha256: generateHash(JSON.stringify(response)),
    });
  
  let inserted = 0;
  for (const txn of response.transactions) {
    const dedupeHash = generateHash(
      dbAccountId,
      txn.amount,
      txn.transactionTimestamp,
      txn.narration
    );
    
    const { error } = await supabase
      .from('fi_transactions')
      .upsert({
        account_id: dbAccountId,
        fetch_run_id: fetchRun?.id,
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
        dedupe_hash: dedupeHash,
      }, { onConflict: 'account_id,dedupe_hash' });
    
    if (!error) {
      inserted++;
      totalRecords++;
    }
  }
  
  console.log(`   ✅ Transactions: ${inserted} inserted`);
}

// =====================================================
// HOLDINGS
// =====================================================

async function seedMutualFundHoldings(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>
): Promise<void> {
  console.log('\n📦 Seeding Mutual Fund Holdings...');
  
  const response = await callAPI<any>('/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.holdings?.length && !response?.holdingFolios?.length) {
    console.log('   ⚠️ No MF holdings returned');
    return;
  }
  
  const holdings = response.holdings || response.holdingFolios || [];
  console.log(`   📊 Found ${holdings.length} MF holdings`);
  
  // Get first MF account
  let dbAccountId = '';
  for (const [_, id] of accountMap) {
    dbAccountId = id;
    break;
  }
  
  if (!dbAccountId) {
    console.log('   ⚠️ No MF account found');
    return;
  }
  
  const fetchRunId = generateHash('MF_HOLDINGS', UNIQUE_IDENTIFIER, Date.now());
  const { data: fetchRun } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: 'MF_HOLDINGS',
      request_id: fetchRunId,
      status: 'FETCHED',
    })
    .select()
    .single();
  
  // Store raw
  await supabase
    .from('aa_fetch_payloads')
    .insert({
      fetch_run_id: fetchRun?.id,
      payload_role: 'RESPONSE',
      raw_payload: response,
      hash_sha256: generateHash(JSON.stringify(response)),
    });
  
  let inserted = 0;
  for (const holding of holdings) {
    const holdingHash = generateHash(
      dbAccountId,
      holding.isin,
      holding.folioNo || holding.folios?.[0]?.folioNo
    );
    
    const { error } = await supabase
      .from('fi_mutual_fund_holdings')
      .upsert({
        account_id: dbAccountId,
        fetch_run_id: fetchRun?.id,
        amc: holding.amc,
        scheme_name: holding.isinDescription || holding.schemeName,
        scheme_code: holding.schemeCode,
        isin: holding.isin,
        folio_no: holding.folioNo || holding.folios?.[0]?.folioNo,
        units: parseNumber(holding.closingUnits || holding.units),
        nav: parseNumber(holding.nav),
        nav_date: parseDate(holding.navDate),
        current_value: parseNumber(holding.currentValue),
        cost_value: parseNumber(holding.costValue),
        holding_hash: holdingHash,
      }, { onConflict: 'account_id,holding_hash' });
    
    if (!error) {
      inserted++;
      totalRecords++;
    }
  }
  
  console.log(`   ✅ MF Holdings: ${inserted} inserted`);
}

async function seedEquityHoldings(
  userId: string,
  tspId: string,
  accountMap: Map<string, string>
): Promise<void> {
  console.log('\n📦 Seeding Equity Holdings...');
  
  const response = await callAPI<any>('/pfm/api/v2/equities/user-linked-accounts/holding-broker', {
    uniqueIdentifier: UNIQUE_IDENTIFIER,
  });
  
  if (!response?.holdings?.length) {
    console.log('   ⚠️ No equity holdings returned');
    return;
  }
  
  console.log(`   📊 Found ${response.holdings.length} equity holdings`);
  
  // Get first equity account
  let dbAccountId = '';
  for (const [_, id] of accountMap) {
    dbAccountId = id;
    break;
  }
  
  if (!dbAccountId) {
    console.log('   ⚠️ No equity account found');
    return;
  }
  
  const fetchRunId = generateHash('EQUITY_HOLDINGS', UNIQUE_IDENTIFIER, Date.now());
  const { data: fetchRun } = await supabase
    .from('aa_data_fetch_runs')
    .insert({
      user_id: userId,
      tsp_id: tspId,
      fetch_type: 'EQUITY_HOLDINGS',
      request_id: fetchRunId,
      status: 'FETCHED',
    })
    .select()
    .single();
  
  // Store raw
  await supabase
    .from('aa_fetch_payloads')
    .insert({
      fetch_run_id: fetchRun?.id,
      payload_role: 'RESPONSE',
      raw_payload: response,
      hash_sha256: generateHash(JSON.stringify(response)),
    });
  
  let inserted = 0;
  for (const holding of response.holdings) {
    const holdingHash = generateHash(
      dbAccountId,
      holding.isin,
      holding.brokers?.[0]?.brokerId
    );
    
    const broker = holding.brokers?.[0];
    
    const { error } = await supabase
      .from('fi_equity_holdings')
      .upsert({
        account_id: dbAccountId,
        fetch_run_id: fetchRun?.id,
        issuer_name: holding.issuerName,
        isin: holding.isin,
        isin_desc: holding.isinDescription,
        units: parseNumber(holding.units),
        last_price: parseNumber(holding.lastTradedPrice),
        current_value: parseNumber(holding.currentValue),
        broker_name: broker?.brokerName,
        demat_id: broker?.dematId,
        holding_hash: holdingHash,
      }, { onConflict: 'account_id,holding_hash' });
    
    if (!error) {
      inserted++;
      totalRecords++;
    }
  }
  
  console.log(`   ✅ Equity Holdings: ${inserted} inserted`);
}

// =====================================================
// INSIGHTS (as JSONB)
// =====================================================

async function seedInsights(
  userId: string,
  fiType: string,
  accountMap: Map<string, string>,
  apiPath: string
): Promise<void> {
  console.log(`\n📦 Seeding ${fiType} Insights...`);
  
  // Get first account
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
  
  // Store as JSONB snapshot
  const { error } = await supabase
    .from('user_financial_snapshots')
    .insert({
      user_id: userId,
      snapshot_type: `${fiType.toUpperCase()}_INSIGHTS`,
      fi_type: fiType.toUpperCase(),
      snapshot: response,
      generated_at: new Date().toISOString(),
    });
  
  if (!error) {
    console.log(`   ✅ ${fiType} insights stored as JSONB`);
    totalRecords++;
  }
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('🚀 PRODUCTION SEED SCRIPT');
  console.log('='.repeat(60));
  console.log('📝 Using FLAT API structure (not nested Summary/Profile)');
  console.log('='.repeat(60));
  
  // Infrastructure
  const infra = await seedInfrastructure();
  if (!infra) {
    console.error('❌ Failed to create infrastructure');
    return;
  }
  
  // Accounts + Summaries for each FI type
  const depositAccounts = await seedAccountsAndSummaries(
    infra.userId, infra.tspId, 'DEPOSIT',
    '/pfm/api/v2/deposit/user-linked-accounts',
    'fi_deposit_summaries'
  );
  
  const termDepositAccounts = await seedAccountsAndSummaries(
    infra.userId, infra.tspId, 'TERM_DEPOSIT',
    '/pfm/api/v2/term-deposit/user-linked-accounts',
    'fi_term_deposit_summaries'
  );
  
  const rdAccounts = await seedAccountsAndSummaries(
    infra.userId, infra.tspId, 'RECURRING_DEPOSIT',
    '/pfm/api/v2/recurring-deposit/user-linked-accounts',
    'fi_recurring_deposit_summaries'
  );
  
  const mfAccounts = await seedAccountsAndSummaries(
    infra.userId, infra.tspId, 'MUTUAL_FUND',
    '/pfm/api/v2/mutual-fund/user-linked-accounts',
    'fi_mutual_fund_summaries'
  );
  
  const equityAccounts = await seedAccountsAndSummaries(
    infra.userId, infra.tspId, 'EQUITIES',
    '/pfm/api/v2/equities/user-linked-accounts',
    'fi_equity_summaries'
  );
  
  await seedAccountsAndSummaries(
    infra.userId, infra.tspId, 'ETF',
    '/pfm/api/v2/etf/user-linked-accounts',
    ''  // No separate ETF summary table
  );
  
  // Transactions
  await seedTransactions(infra.userId, infra.tspId, depositAccounts);
  
  // Holdings
  await seedMutualFundHoldings(infra.userId, infra.tspId, mfAccounts);
  await seedEquityHoldings(infra.userId, infra.tspId, equityAccounts);
  
  // Insights
  await seedInsights(infra.userId, 'deposit', depositAccounts, '/pfm/api/v2/deposit/insights');
  await seedInsights(infra.userId, 'mutualFund', mfAccounts, '/pfm/api/v2/mutual-fund/insights');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n📈 Total Records Inserted: ${totalRecords}`);
  console.log('\n✨ Done!');
}

main().catch(console.error);

