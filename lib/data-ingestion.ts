// =====================================================
// COMPLETE DATA INGESTION - ALL LAYERS
// =====================================================
// This file handles complete data flow:
// Layer A: Raw payload storage
// Layer B: Canonical data parsing
// Layer C: Derived data computation
// =====================================================

import { supabaseAdmin } from './supabase-server';
import { makeAuthenticatedRequest } from './finfactor';
import {
  getUserByIdentifier,
  upsertFip,
  upsertAccount,
  insertTransactions,
  upsertMFHoldings,
  upsertEquityHoldings,
  upsertETFHoldings,
  upsertNPSHoldings,
} from './supabase-server';

/**
 * Complete data ingestion flow for all layers
 */
export async function ingestCompleteData(
  uniqueIdentifier: string,
  apiEndpoint: string,
  requestBody: any,
  fiType: string
) {
  console.log(`🔄 Starting ingestion for ${fiType}...`);
  
  // ============================================
  // STEP 1: Create Fetch Run (Layer A)
  // ============================================
  const fetchRun = await createFetchRun(uniqueIdentifier, apiEndpoint, fiType);
  console.log(`✅ Fetch run created: ${fetchRun.id}`);
  
  // ============================================
  // STEP 2: Call API and Store Raw Payload (Layer A)
  // ============================================
  console.log(`📡 Calling API: ${apiEndpoint}`);
  const apiResponse = await makeAuthenticatedRequest(apiEndpoint, requestBody);
  
  await storeRawPayload(fetchRun.id, apiResponse, fiType);
  console.log(`✅ Raw payload stored`);
  
  // ============================================
  // STEP 3: Parse and Store Layer B Data
  // ============================================
  console.log(`📊 Parsing Layer B data...`);
  const layerBData = await parseAndStoreLayerB(
    uniqueIdentifier,
    fetchRun.id,
    apiResponse,
    fiType
  );
  console.log(`✅ Layer B: ${layerBData.accounts.length} accounts, ${layerBData.transactions.length} transactions`);
  
  // ============================================
  // STEP 4: Compute and Store Layer C Data
  // ============================================
  console.log(`🧮 Computing Layer C data...`);
  await computeAndStoreLayerC(
    uniqueIdentifier,
    fetchRun.id,
    layerBData,
    fiType
  );
  console.log(`✅ Layer C computed`);
  
  // Update fetch run status
  await supabaseAdmin
    .from('aa_data_fetch_runs')
    .update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      records_count: layerBData.accounts.length + layerBData.transactions.length,
    })
    .eq('id', fetchRun.id);
  
  return {
    fetchRunId: fetchRun.id,
    accountsStored: layerBData.accounts.length,
    transactionsStored: layerBData.transactions.length,
    summariesComputed: layerBData.accounts.length
  };
}

/**
 * Create fetch run record
 */
async function createFetchRun(
  uniqueIdentifier: string,
  endpoint: string,
  fiType: string
) {
  const user = await getUserByIdentifier(uniqueIdentifier);
  if (!user) throw new Error(`User not found: ${uniqueIdentifier}`);
  
  // Get or create TSP provider (assuming FINFACTOR)
  const { data: tsp } = await supabaseAdmin
    .from('tsp_providers')
    .select('id')
    .eq('name', 'FINFACTOR')
    .eq('environment', 'SANDBOX')
    .single();
  
  const tspId = tsp?.id || null;
  
  const { data: fetchRun, error } = await supabaseAdmin
    .from('aa_data_fetch_runs')
    .insert({
      user_id: user.id,
      tsp_id: tspId,
      fetch_type: `${fiType}_FETCH`,
      endpoint: endpoint,
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'INITIATED',
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return fetchRun;
}

/**
 * Store raw payload (Layer A)
 */
async function storeRawPayload(
  fetchRunId: string,
  apiResponse: any,
  fiType: string
) {
  const hash = await generateHash(JSON.stringify(apiResponse));
  
  const { error } = await supabaseAdmin
    .from('aa_fetch_payloads')
    .insert({
      fetch_run_id: fetchRunId,
      raw_payload: apiResponse,
      fi_type: fiType,
      payload_role: 'RESPONSE',
      content_format: 'JSON',
      hash_sha256: hash,
    });
  
  if (error) throw error;
}

/**
 * Parse and store Layer B data
 */
async function parseAndStoreLayerB(
  uniqueIdentifier: string,
  fetchRunId: string,
  apiResponse: any,
  fiType: string
) {
  const user = await getUserByIdentifier(uniqueIdentifier);
  if (!user) throw new Error(`User not found: ${uniqueIdentifier}`);
  
  const accounts: string[] = [];
  const transactions: string[] = [];
  
  // Handle different response structures
  if (apiResponse.fipData) {
    // Standard structure: fipData -> linkedAccounts
    for (const fip of apiResponse.fipData) {
      // Upsert FIP
      await upsertFip({
        fipId: fip.fipId,
        fipName: fip.fipName,
        code: fip.code,
        fiTypes: fip.fiTypes,
      });
      
      // Parse accounts
      for (const acc of fip.linkedAccounts || []) {
        const account = await upsertAccount(uniqueIdentifier, {
          fiDataId: acc.fiDataId || acc.accountRefNumber,
          accountRefNumber: acc.accountRefNumber,
          maskedAccNumber: acc.maskedAccNumber,
          accountType: acc.accountType || acc.accType,
          fiType: fiType,
          fipId: fip.fipId,
          fipName: fip.fipName,
          dataFetched: acc.dataFetched,
          lastFetchDateTime: acc.lastFetchDateTime,
        });
        
        if (account?.id) {
          accounts.push(account.id);
          
          // Store account holders
          if (acc.holderName) {
            await supabaseAdmin
              .from('fi_account_holders_pii')
              .upsert({
                account_id: account.id,
                holders_type: acc.holderType || 'SINGLE',
                name: acc.holderName,
                dob: acc.holderDob ? new Date(acc.holderDob).toISOString().split('T')[0] : null,
                mobile: acc.holderMobile,
                email: acc.holderEmail,
                pan: acc.holderPan,
                address: acc.holderAddress,
              }, {
                onConflict: 'account_id'
              });
          }
        }
      }
    }
  } else if (apiResponse.holdings) {
    // Holdings structure (for MF, Equity, ETF)
    // Accounts are created implicitly from holdings
    if (fiType === 'MUTUAL_FUNDS') {
      await upsertMFHoldings(uniqueIdentifier, apiResponse);
    } else if (fiType === 'EQUITIES') {
      await upsertEquityHoldings(uniqueIdentifier, apiResponse);
    } else if (fiType === 'ETF') {
      await upsertETFHoldings(uniqueIdentifier, apiResponse);
    }
  } else if (apiResponse.accounts) {
    // NPS structure
    await upsertNPSHoldings(uniqueIdentifier, apiResponse);
  }
  
  // Parse transactions if present
  if (apiResponse.transactions) {
    for (const txn of apiResponse.transactions) {
      // Find account by ref number
      const { data: account } = await supabaseAdmin
        .from('fi_accounts')
        .select('id')
        .eq('account_ref_number', txn.accountRefNumber)
        .eq('user_id', user.id)
        .single();
      
      if (account) {
        await insertTransactions(account.id, [{
          txnId: txn.txnId,
          txnType: txn.type,
          mode: txn.mode,
          amount: txn.amount,
          transactionTimestamp: txn.transactionTimestamp,
          narration: txn.narration,
          currentBalance: txn.currentBalance,
          category: txn.category,
        }]);
        transactions.push(txn.txnId);
      }
    }
  }
  
  return { accounts, transactions };
}

/**
 * Compute and store Layer C data
 */
async function computeAndStoreLayerC(
  uniqueIdentifier: string,
  fetchRunId: string,
  layerBData: any,
  fiType: string
) {
  const user = await getUserByIdentifier(uniqueIdentifier);
  if (!user) return;
  
  // Import computation functions
  const {
    computeDepositSummaries,
    computeTermDepositSummaries,
    computeRecurringDepositSummaries,
    computeMutualFundSummaries,
    computeEquitySummaries,
  } = await import('./supabase-server');
  
  // Compute summaries based on FI type
  switch (fiType) {
    case 'DEPOSIT':
      await computeDepositSummaries(user.id, fetchRunId);
      break;
    case 'TERM_DEPOSIT':
      await computeTermDepositSummaries(user.id, fetchRunId);
      break;
    case 'RECURRING_DEPOSIT':
      await computeRecurringDepositSummaries(user.id, fetchRunId);
      break;
    case 'MUTUAL_FUNDS':
      await computeMutualFundSummaries(user.id, fetchRunId);
      break;
    case 'EQUITIES':
      await computeEquitySummaries(user.id, fetchRunId);
      break;
  }
}

/**
 * Generate hash for deduplication
 */
async function generateHash(...args: string[]): Promise<string> {
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(args.join('|'));
  return hash.digest('hex');
}

