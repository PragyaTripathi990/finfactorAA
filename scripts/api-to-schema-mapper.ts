/**
 * API to Schema Mapper
 * 
 * This module transforms API responses from Finfactor/Finvu APIs
 * into the normalized schema format defined by the supervisor.
 * 
 * The mapping handles:
 * 1. Flattening nested API responses
 * 2. Renaming fields to match schema columns
 * 3. Type conversions (dates, numbers, arrays)
 * 4. Generating dedupe hashes for uniqueness
 */

import crypto from 'crypto';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate SHA256 hash for deduplication
 */
export function generateHash(...parts: (string | number | null | undefined)[]): string {
  const str = parts.filter(p => p != null).join('|');
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 100);
}

/**
 * Parse date string to Date object or null
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse number, handling strings and nulls
 */
export function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? null : num;
}

/**
 * Safely extract nested value from object
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface MappedUser {
  phone: string | null;
  email: string | null;
  unique_identifier: string;
}

export interface MappedFip {
  fip_code: string | null;
  name: string;
  type: string;
  environment: string;
  fip_id: string | null;
  product_types: string[] | null;
  aa_identifier: string[] | null;
}

export interface MappedAccount {
  fi_type: string;
  fip_account_type: string | null;
  fip_account_sub_type: string | null;
  aa_linked_ref: string | null;
  masked_acc_no: string | null;
  provider_name: string | null;
  account_ref_number: string | null;
  link_ref_number: string | null;
  link_status: string | null;
  consent_id_list: string[] | null;
  fip_name: string | null;
  account_ref_hash: string;
}

export interface MappedAccountHolder {
  holders_type: string | null;
  name: string | null;
  dob: Date | null;
  mobile: string | null;
  email: string | null;
  pan: string | null;
  address: string | null;
  ckyc_registered: boolean | null;
  kyc_compliance: string | null;
  nominee: string | null;
}

export interface MappedTransaction {
  txn_id: string | null;
  txn_type: string | null;
  mode: string | null;
  amount: number | null;
  balance: number | null;
  txn_timestamp: Date | null;
  value_date: Date | null;
  narration: string | null;
  reference: string | null;
  category: string | null;
  sub_category: string | null;
  dedupe_hash: string;
}

export interface MappedDepositSummary {
  current_balance: number | null;
  currency: string;
  balance_datetime: Date | null;
  account_type: string | null;
  account_sub_type: string | null;
  branch: string | null;
  ifsc: string | null;
  micr_code: string | null;
  opening_date: Date | null;
  status: string | null;
  pending_balance: number | null;
  available_credit_limit: number | null;
  drawing_limit: number | null;
}

export interface MappedMutualFundHolding {
  amc: string | null;
  scheme_name: string | null;
  scheme_code: string | null;
  scheme_plan: string | null;
  scheme_option: string | null;
  isin: string | null;
  folio_no: string | null;
  units: number | null;
  nav: number | null;
  nav_date: Date | null;
  current_value: number | null;
  cost_value: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  scheme_category: string | null;
  scheme_type: string | null;
}

export interface MappedEquityHolding {
  issuer_name: string | null;
  isin: string | null;
  isin_desc: string | null;
  units: number | null;
  last_price: number | null;
  current_value: number | null;
  symbol: string | null;
  exchange: string | null;
  avg_cost_price: number | null;
  cost_value: number | null;
  pnl: number | null;
  pnl_percent: number | null;
}

export interface MappedBroker {
  broker_id: string;
  name: string;
  type: string | null;
}

// =====================================================
// MAPPING FUNCTIONS
// =====================================================

/**
 * Map User Details API response to app_users table
 */
export function mapUserDetails(apiResponse: any, uniqueIdentifier: string): MappedUser {
  return {
    phone: uniqueIdentifier,
    email: null,
    unique_identifier: uniqueIdentifier,
  };
}

/**
 * Map FIPs API response to fips table
 */
export function mapFips(apiResponse: any): MappedFip[] {
  const fips = apiResponse?.fips || apiResponse?.fipData || [];
  
  return fips.map((fip: any) => ({
    fip_code: fip.fipId || fip.fipCode || null,
    name: fip.fipName || fip.name || 'Unknown',
    type: fip.fiTypes?.[0] || fip.type || 'UNKNOWN',
    environment: 'SANDBOX',
    fip_id: fip.fipId || null,
    product_types: fip.productTypes || fip.fiTypes || null,
    aa_identifier: fip.aaIdentifier ? [fip.aaIdentifier] : null,
  }));
}

/**
 * Map Brokers API response to brokers table
 */
export function mapBrokers(apiResponse: any): MappedBroker[] {
  const brokers = apiResponse?.brokers || [];
  
  return brokers.map((broker: any) => ({
    broker_id: broker.brokerId || broker.id || `broker_${Date.now()}`,
    name: broker.brokerName || broker.name || 'Unknown',
    type: broker.type || 'EQUITY',
  }));
}

/**
 * Map Linked Accounts API response to fi_accounts table
 * This handles the nested fipData[].linkedAccounts[] structure
 */
export function mapLinkedAccounts(
  apiResponse: any, 
  fiType: string,
  uniqueIdentifier: string
): { accounts: MappedAccount[]; holders: MappedAccountHolder[]; fipNames: Map<string, string> } {
  const accounts: MappedAccount[] = [];
  const holders: MappedAccountHolder[] = [];
  const fipNames = new Map<string, string>();
  
  const fipData = apiResponse?.fipData || [];
  
  for (const fip of fipData) {
    const fipName = fip.fipName || fip.name || 'Unknown';
    const linkedAccounts = fip.linkedAccounts || [];
    
    for (const acc of linkedAccounts) {
      const accountRefNumber = acc.accountRefNumber || acc.linkRefNumber || acc.maskedAccNumber;
      
      // Generate hash for deduplication
      const accountRefHash = generateHash(
        uniqueIdentifier,
        fipName,
        accountRefNumber,
        fiType
      );
      
      // Store FIP name for lookup
      fipNames.set(accountRefHash, fipName);
      
      const mappedAccount: MappedAccount = {
        fi_type: fiType,
        fip_account_type: acc.accType || acc.accountType || null,
        fip_account_sub_type: acc.accSubType || null,
        aa_linked_ref: acc.linkRefNumber || null,
        masked_acc_no: acc.maskedAccNumber || null,
        provider_name: fipName,
        account_ref_number: acc.accountRefNumber || null,
        link_ref_number: acc.linkRefNumber || null,
        link_status: acc.linkStatus || acc.status || null,
        consent_id_list: acc.consentIdList || null,
        fip_name: fipName,
        account_ref_hash: accountRefHash,
      };
      
      accounts.push(mappedAccount);
      
      // Extract holder information if available
      const profile = acc.Profile || acc.profile || {};
      const holdersList = profile.Holders?.Holder || [];
      
      for (const holder of holdersList) {
        const mappedHolder: MappedAccountHolder = {
          holders_type: holdersList.length > 1 ? 'JOINT' : 'SINGLE',
          name: holder.name || null,
          dob: parseDate(holder.dob),
          mobile: holder.mobile || null,
          email: holder.email || null,
          pan: holder.pan || null,
          address: holder.address || null,
          ckyc_registered: holder.ckycCompliance === 'true' || holder.ckycCompliance === true,
          kyc_compliance: holder.kycCompliance || null,
          nominee: holder.nominee || null,
        };
        
        holders.push(mappedHolder);
      }
    }
  }
  
  return { accounts, holders, fipNames };
}

/**
 * Map Account Statement API response to fi_transactions table
 */
export function mapTransactions(
  apiResponse: any,
  accountId: string
): MappedTransaction[] {
  const transactions = apiResponse?.transactions || apiResponse?.statement || [];
  
  return transactions.map((txn: any) => {
    const dedupeHash = generateHash(
      accountId,
      txn.amount,
      txn.txnTimestamp || txn.transactionTimestamp || txn.valueDate,
      txn.narration,
      txn.reference || txn.txnId
    );
    
    return {
      txn_id: txn.txnId || txn.transactionId || null,
      txn_type: txn.type || txn.txnType || null,
      mode: txn.mode || txn.transactionMode || null,
      amount: parseNumber(txn.amount),
      balance: parseNumber(txn.balance || txn.currentBalance),
      txn_timestamp: parseDate(txn.txnTimestamp || txn.transactionTimestamp),
      value_date: parseDate(txn.valueDate),
      narration: txn.narration || txn.description || null,
      reference: txn.reference || null,
      category: txn.category || null,
      sub_category: txn.subCategory || null,
      dedupe_hash: dedupeHash,
    };
  });
}

/**
 * Map Deposit Summary from linked account data
 */
export function mapDepositSummary(linkedAccount: any): MappedDepositSummary {
  const summary = linkedAccount.Summary || linkedAccount.summary || {};
  const profile = linkedAccount.Profile || linkedAccount.profile || {};
  
  return {
    current_balance: parseNumber(summary.currentBalance || linkedAccount.currentBalance),
    currency: summary.currency || 'INR',
    balance_datetime: parseDate(summary.balanceDateTime),
    account_type: profile.accType || linkedAccount.accType || null,
    account_sub_type: profile.accSubType || null,
    branch: profile.branch || null,
    ifsc: profile.ifsc || profile.ifscCode || null,
    micr_code: profile.micrCode || null,
    opening_date: parseDate(profile.openingDate),
    status: profile.status || linkedAccount.linkStatus || null,
    pending_balance: parseNumber(summary.pendingBalance),
    available_credit_limit: parseNumber(summary.availableCreditLimit),
    drawing_limit: parseNumber(summary.drawingLimit),
  };
}

/**
 * Map Mutual Fund Holdings from holding-folio API
 */
export function mapMutualFundHoldings(apiResponse: any): MappedMutualFundHolding[] {
  const holdings = apiResponse?.holdingFolios || apiResponse?.holdings || [];
  
  return holdings.map((h: any) => ({
    amc: h.amc || h.amcName || null,
    scheme_name: h.schemeName || h.schemeTitle || null,
    scheme_code: h.schemeCode || null,
    scheme_plan: h.schemePlan || h.planType || null,
    scheme_option: h.schemeOption || h.optionType || null,
    isin: h.isin || null,
    folio_no: h.folioNumber || h.folioNo || null,
    units: parseNumber(h.closingUnits || h.units),
    nav: parseNumber(h.nav || h.currentNav),
    nav_date: parseDate(h.navDate),
    current_value: parseNumber(h.currentMktValue || h.currentValue),
    cost_value: parseNumber(h.costValue || h.investedValue),
    pnl: parseNumber(h.pnl || h.gainLoss),
    pnl_percent: parseNumber(h.pnlPercent || h.returnPercent),
    scheme_category: h.schemeCategory || h.category || null,
    scheme_type: h.schemeType || null,
  }));
}

/**
 * Map Equity Holdings from demat-holding or broker-holding API
 */
export function mapEquityHoldings(apiResponse: any): MappedEquityHolding[] {
  const holdings = apiResponse?.holdings || apiResponse?.dematHoldings || [];
  
  return holdings.map((h: any) => ({
    issuer_name: h.issuerName || h.companyName || h.symbol || null,
    isin: h.isin || null,
    isin_desc: h.isinDescription || h.description || null,
    units: parseNumber(h.freeHoldingUnits || h.units || h.quantity),
    last_price: parseNumber(h.lastTradedPrice || h.ltp || h.price),
    current_value: parseNumber(h.holdingValue || h.currentValue || h.value),
    symbol: h.symbol || h.nseSymbol || h.bseSymbol || null,
    exchange: h.exchange || null,
    avg_cost_price: parseNumber(h.avgCostPrice || h.averagePrice),
    cost_value: parseNumber(h.investedValue || h.costValue),
    pnl: parseNumber(h.pnl || h.unrealizedPnL),
    pnl_percent: parseNumber(h.pnlPercent || h.returnPercent),
  }));
}

/**
 * Map Insights API response to user_financial_snapshots table
 * Insights are stored as JSONB since they're complex aggregated data
 */
export function mapInsights(
  apiResponse: any,
  insightType: string
): { snapshot_type: string; snapshot: any } {
  // Extract the insights object based on type
  const insightKey = `${insightType}Insights`;
  const insights = apiResponse?.[insightKey] || apiResponse?.insights || apiResponse;
  
  return {
    snapshot_type: `${insightType.toUpperCase()}_INSIGHTS`,
    snapshot: insights,
  };
}

// =====================================================
// FIELD EXTRACTION FOR GAP ANALYSIS
// =====================================================

/**
 * Recursively extract all field paths from an object
 * Used for schema gap analysis
 */
export function extractAllFieldPaths(obj: any, prefix: string = ''): string[] {
  const paths: string[] = [];
  
  if (obj === null || obj === undefined) {
    return paths;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      // Sample first item for array structure
      const childPaths = extractAllFieldPaths(obj[0], `${prefix}[]`);
      paths.push(...childPaths);
    }
    return paths;
  }
  
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        paths.push(newPrefix);
      } else if (Array.isArray(value)) {
        paths.push(newPrefix);
        if (value.length > 0 && typeof value[0] === 'object') {
          const childPaths = extractAllFieldPaths(value[0], `${newPrefix}[]`);
          paths.push(...childPaths);
        }
      } else if (typeof value === 'object') {
        const childPaths = extractAllFieldPaths(value, newPrefix);
        paths.push(...childPaths);
      } else {
        paths.push(newPrefix);
      }
    }
  }
  
  return paths;
}

/**
 * Get the data type of a value for schema analysis
 */
export function getValueType(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'decimal';
  if (typeof value === 'boolean') return 'boolean';
  
  // Check if string looks like a date
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date/timestamp';
    if (/^\d+\.?\d*$/.test(value)) return 'numeric_string';
  }
  
  return 'string';
}

/**
 * Extract field information with types for detailed analysis
 */
export function extractFieldsWithTypes(obj: any, prefix: string = ''): Map<string, string> {
  const fields = new Map<string, string>();
  
  if (obj === null || obj === undefined) {
    return fields;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const childFields = extractFieldsWithTypes(obj[0], `${prefix}[]`);
      childFields.forEach((type, path) => fields.set(path, type));
    }
    return fields;
  }
  
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        fields.set(newPrefix, 'array');
        if (value.length > 0 && typeof value[0] === 'object') {
          const childFields = extractFieldsWithTypes(value[0], `${newPrefix}[]`);
          childFields.forEach((type, path) => fields.set(path, type));
        } else if (value.length > 0) {
          fields.set(`${newPrefix}[]`, getValueType(value[0]));
        }
      } else if (value !== null && typeof value === 'object') {
        fields.set(newPrefix, 'object');
        const childFields = extractFieldsWithTypes(value, newPrefix);
        childFields.forEach((type, path) => fields.set(path, type));
      } else {
        fields.set(newPrefix, getValueType(value));
      }
    }
  }
  
  return fields;
}

// =====================================================
// API RESPONSE TYPE DEFINITIONS
// =====================================================

export interface ApiEndpointMapping {
  endpoint: string;
  targetTables: string[];
  mapper: (response: any, ...args: any[]) => any;
}

/**
 * Configuration mapping API endpoints to their target schema tables
 */
export const API_TO_SCHEMA_MAPPING: ApiEndpointMapping[] = [
  {
    endpoint: '/pfm/api/v2/user-details',
    targetTables: ['app_users'],
    mapper: mapUserDetails,
  },
  {
    endpoint: '/pfm/api/v2/fips',
    targetTables: ['fips'],
    mapper: mapFips,
  },
  {
    endpoint: '/pfm/api/v2/brokers',
    targetTables: ['brokers'],
    mapper: mapBrokers,
  },
  {
    endpoint: '/pfm/api/v2/deposit/user-linked-accounts',
    targetTables: ['fi_accounts', 'fi_account_holders_pii', 'fi_deposit_summaries'],
    mapper: (response, uniqueId) => mapLinkedAccounts(response, 'DEPOSIT', uniqueId),
  },
  {
    endpoint: '/pfm/api/v2/deposit/user-account-statement',
    targetTables: ['fi_transactions'],
    mapper: mapTransactions,
  },
  {
    endpoint: '/pfm/api/v2/deposit/insights',
    targetTables: ['user_financial_snapshots'],
    mapper: (response) => mapInsights(response, 'deposit'),
  },
  {
    endpoint: '/pfm/api/v2/term-deposit/user-linked-accounts',
    targetTables: ['fi_accounts', 'fi_account_holders_pii', 'fi_term_deposit_summaries'],
    mapper: (response, uniqueId) => mapLinkedAccounts(response, 'TERM_DEPOSIT', uniqueId),
  },
  {
    endpoint: '/pfm/api/v2/recurring-deposit/user-linked-accounts',
    targetTables: ['fi_accounts', 'fi_account_holders_pii', 'fi_recurring_deposit_summaries'],
    mapper: (response, uniqueId) => mapLinkedAccounts(response, 'RECURRING_DEPOSIT', uniqueId),
  },
  {
    endpoint: '/pfm/api/v2/mutual-fund/user-linked-accounts',
    targetTables: ['fi_accounts', 'fi_account_holders_pii', 'fi_mutual_fund_summaries'],
    mapper: (response, uniqueId) => mapLinkedAccounts(response, 'MUTUAL_FUND', uniqueId),
  },
  {
    endpoint: '/pfm/api/v2/mutual-fund/holding-folio',
    targetTables: ['fi_mutual_fund_holdings'],
    mapper: mapMutualFundHoldings,
  },
  {
    endpoint: '/pfm/api/v2/mutual-fund/insights',
    targetTables: ['user_financial_snapshots'],
    mapper: (response) => mapInsights(response, 'mutualFund'),
  },
  {
    endpoint: '/pfm/api/v2/equities/user-linked-accounts',
    targetTables: ['fi_accounts', 'fi_account_holders_pii', 'fi_equity_summaries'],
    mapper: (response, uniqueId) => mapLinkedAccounts(response, 'EQUITIES', uniqueId),
  },
  {
    endpoint: '/pfm/api/v2/equities/demat-holding',
    targetTables: ['fi_equity_holdings'],
    mapper: mapEquityHoldings,
  },
  {
    endpoint: '/pfm/api/v2/equities/broker-holding',
    targetTables: ['fi_equity_holdings'],
    mapper: mapEquityHoldings,
  },
  {
    endpoint: '/pfm/api/v2/etf/user-linked-accounts',
    targetTables: ['fi_accounts', 'fi_account_holders_pii', 'fi_etf_holdings'],
    mapper: (response, uniqueId) => mapLinkedAccounts(response, 'ETF', uniqueId),
  },
  {
    endpoint: '/pfm/api/v2/etf/insights',
    targetTables: ['user_financial_snapshots'],
    mapper: (response) => mapInsights(response, 'etf'),
  },
];

export default {
  generateHash,
  parseDate,
  parseNumber,
  mapUserDetails,
  mapFips,
  mapBrokers,
  mapLinkedAccounts,
  mapTransactions,
  mapDepositSummary,
  mapMutualFundHoldings,
  mapEquityHoldings,
  mapInsights,
  extractAllFieldPaths,
  extractFieldsWithTypes,
  getValueType,
  API_TO_SCHEMA_MAPPING,
};

