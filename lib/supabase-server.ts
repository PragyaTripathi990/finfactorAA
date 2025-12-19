import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =====================================================
// USER OPERATIONS
// =====================================================

/**
 * Create or update a user in the database
 */
export async function upsertUser(uniqueIdentifier: string, data?: {
  phone?: string;
  email?: string;
  subscriptionStatus?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}) {
  const { data: user, error } = await supabaseAdmin
    .from('app_users')
    .upsert({
      unique_identifier: uniqueIdentifier,
      phone: data?.phone || uniqueIdentifier,
      email: data?.email,
      subscription_status: data?.subscriptionStatus,
      subscription_start_date: data?.subscriptionStartDate,
      subscription_end_date: data?.subscriptionEndDate,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'unique_identifier',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user:', error);
    throw error;
  }

  return user;
}

/**
 * Get user by unique identifier
 */
export async function getUserByIdentifier(uniqueIdentifier: string) {
  const { data: user, error } = await supabaseAdmin
    .from('app_users')
    .select('*')
    .eq('unique_identifier', uniqueIdentifier)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching user:', error);
    throw error;
  }

  return user;
}

// =====================================================
// FIP OPERATIONS
// =====================================================

/**
 * Upsert FIP (Financial Information Provider)
 */
export async function upsertFip(fipData: {
  fipId: string;
  fipName: string;
  code?: string;
  enable?: string;
  fiTypes?: string[];
  entityIconUri?: string;
  entityLogoUri?: string;
  entityLogoWithNameUri?: string;
  otpLength?: number;
}) {
  const { data: fip, error } = await supabaseAdmin
    .from('fips')
    .upsert({
      fip_id: fipData.fipId,
      fip_name: fipData.fipName,
      code: fipData.code,
      enable: fipData.enable,
      fi_types: fipData.fiTypes,
      entity_icon_uri: fipData.entityIconUri,
      entity_logo_uri: fipData.entityLogoUri,
      entity_logo_with_name_uri: fipData.entityLogoWithNameUri,
      otp_length: fipData.otpLength,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'fip_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting FIP:', error);
    throw error;
  }

  return fip;
}

/**
 * Get all FIPs
 */
export async function getAllFips() {
  const { data: fips, error } = await supabaseAdmin
    .from('fips')
    .select('*')
    .order('fip_name');

  if (error) {
    console.error('Error fetching FIPs:', error);
    throw error;
  }

  return fips;
}

// =====================================================
// ACCOUNT OPERATIONS
// =====================================================

/**
 * Upsert a financial account
 */
export async function upsertAccount(userId: string, accountData: {
  fiDataId: string;
  accountRefNumber?: string;
  maskedAccNumber?: string;
  accountType: string;
  fiType: string;
  accountName?: string;
  fipId?: string;
  fipName?: string;
  dataFetched?: boolean;
  lastFetchDateTime?: string;
  latestConsentPurposeText?: string;
  latestConsentExpiryTime?: string;
  consentPurposeVersion?: string;
}) {
  // First, get the user's UUID
  const user = await getUserByIdentifier(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const { data: account, error } = await supabaseAdmin
    .from('fi_accounts')
    .upsert({
      user_id: user.id,
      fi_data_id: accountData.fiDataId,
      account_ref_number: accountData.accountRefNumber,
      masked_acc_number: accountData.maskedAccNumber,
      account_type: accountData.accountType,
      fi_type: accountData.fiType,
      account_name: accountData.accountName,
      fip_id_str: accountData.fipId,
      fip_name: accountData.fipName,
      data_fetched: accountData.dataFetched,
      last_fetch_date_time: accountData.lastFetchDateTime,
      latest_consent_purpose_text: accountData.latestConsentPurposeText,
      latest_consent_expiry_time: accountData.latestConsentExpiryTime,
      consent_purpose_version: accountData.consentPurposeVersion,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'fi_data_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting account:', error);
    throw error;
  }

  return account;
}

/**
 * Get all accounts for a user
 */
export async function getAccountsByUser(uniqueIdentifier: string) {
  const user = await getUserByIdentifier(uniqueIdentifier);
  if (!user) {
    return [];
  }

  const { data: accounts, error } = await supabaseAdmin
    .from('fi_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }

  return accounts;
}

// =====================================================
// DEPOSIT SUMMARY OPERATIONS
// =====================================================

/**
 * Upsert deposit summary
 */
export async function upsertDepositSummary(accountId: string, summaryData: {
  currentBalance?: number;
  availableBalance?: number;
  interestRate?: number;
  openingDate?: string;
  maturityDate?: string;
  branch?: string;
  ifscCode?: string;
}) {
  const { data: summary, error } = await supabaseAdmin
    .from('fi_deposit_summaries')
    .upsert({
      account_id: accountId,
      current_balance: summaryData.currentBalance,
      available_balance: summaryData.availableBalance,
      interest_rate: summaryData.interestRate,
      opening_date: summaryData.openingDate,
      maturity_date: summaryData.maturityDate,
      branch: summaryData.branch,
      ifsc_code: summaryData.ifscCode,
      last_fetch_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'account_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting deposit summary:', error);
    throw error;
  }

  return summary;
}

// =====================================================
// TRANSACTION OPERATIONS
// =====================================================

/**
 * Insert transactions (bulk)
 */
export async function insertTransactions(accountId: string, transactions: Array<{
  txnId?: string;
  txnType: string;
  mode?: string;
  amount: number;
  transactionTimestamp: string;
  narration?: string;
  currentBalance?: number;
  category?: string;
}>) {
  const txnData = transactions.map(txn => ({
    account_id: accountId,
    txn_id: txn.txnId,
    txn_type: txn.txnType,
    mode: txn.mode,
    amount: txn.amount,
    transaction_timestamp: txn.transactionTimestamp,
    narration: txn.narration,
    current_balance: txn.currentBalance,
    category: txn.category,
  }));

  const { data, error } = await supabaseAdmin
    .from('fi_transactions')
    .insert(txnData)
    .select();

  if (error) {
    console.error('Error inserting transactions:', error);
    throw error;
  }

  return data;
}

/**
 * Get transactions for an account
 */
export async function getTransactionsByAccount(accountId: string, limit = 100) {
  const { data: transactions, error } = await supabaseAdmin
    .from('fi_transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('transaction_timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  return transactions;
}

// =====================================================
// API CALL LOGGING
// =====================================================

/**
 * Log an API call for audit purposes
 */
export async function logApiCall(data: {
  userId?: string;
  endpoint: string;
  method: string;
  requestPayload?: any;
  responsePayload?: any;
  httpStatus?: number;
  errorMessage?: string;
  latencyMs?: number;
}) {
  let userUuid = null;
  if (data.userId) {
    const user = await getUserByIdentifier(data.userId);
    userUuid = user?.id;
  }

  const { error } = await supabaseAdmin
    .from('tsp_api_calls')
    .insert({
      user_id: userUuid,
      endpoint: data.endpoint,
      method: data.method,
      request_payload: data.requestPayload,
      response_payload: data.responsePayload,
      http_status: data.httpStatus,
      error_message: data.errorMessage,
      latency_ms: data.latencyMs,
    });

  if (error) {
    console.error('Error logging API call:', error);
    // Don't throw - logging shouldn't break the app
  }
}

// =====================================================
// USER FINANCIAL SNAPSHOT
// =====================================================

/**
 * Update user's financial snapshot (portfolio overview)
 */
export async function updateFinancialSnapshot(uniqueIdentifier: string, snapshot: {
  totalNetWorth?: number;
  depositsValue?: number;
  termDepositsValue?: number;
  recurringDepositsValue?: number;
  mutualFundsValue?: number;
  equitiesValue?: number;
  etfValue?: number;
  npsValue?: number;
  totalAccounts?: number;
}) {
  const user = await getUserByIdentifier(uniqueIdentifier);
  if (!user) {
    throw new Error(`User not found: ${uniqueIdentifier}`);
  }

  const { data, error } = await supabaseAdmin
    .from('user_financial_snapshots')
    .insert({
      user_id: user.id,
      total_net_worth: snapshot.totalNetWorth,
      deposits_value: snapshot.depositsValue,
      term_deposits_value: snapshot.termDepositsValue,
      recurring_deposits_value: snapshot.recurringDepositsValue,
      mutual_funds_value: snapshot.mutualFundsValue,
      equities_value: snapshot.equitiesValue,
      etf_value: snapshot.etfValue,
      nps_value: snapshot.npsValue,
      total_accounts: snapshot.totalAccounts,
      last_fetch_date: new Date().toISOString(),
      snapshot_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating financial snapshot:', error);
    throw error;
  }

  return data;
}

/**
 * Get latest financial snapshot for user
 */
export async function getLatestSnapshot(uniqueIdentifier: string) {
  const user = await getUserByIdentifier(uniqueIdentifier);
  if (!user) {
    return null;
  }

  const { data: snapshot, error } = await supabaseAdmin
    .from('user_financial_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching snapshot:', error);
    throw error;
  }

  return snapshot;
}

