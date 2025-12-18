/**
 * Schema Gap Analysis Script
 * 
 * This script:
 * 1. Calls all working APIs and captures their response structures
 * 2. Compares API fields with schema columns
 * 3. Generates a detailed report showing:
 *    - Fields in API but NOT in schema (missing columns)
 *    - Columns in schema but ALWAYS NULL (unused columns)
 *    - Columns with data (working correctly)
 * 
 * Run with: npm run analyze:schema-gaps
 */

import { createClient } from '@supabase/supabase-js';
import { makeAuthenticatedRequest } from '../lib/finfactor';
import { extractFieldsWithTypes } from './api-to-schema-mapper';
import * as fs from 'fs';
import * as path from 'path';

// Supabase configuration (optional - only for NULL column analysis)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase is optional - we can still analyze APIs without it
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const UNIQUE_IDENTIFIER = '8956545791';

// =====================================================
// SCHEMA DEFINITIONS (from supervisor-schema.sql)
// =====================================================

const SCHEMA_TABLES: Record<string, string[]> = {
  app_users: ['id', 'phone', 'email', 'unique_identifier', 'created_at', 'updated_at'],
  
  fips: ['id', 'fip_code', 'name', 'type', 'environment', 'is_active', 'fip_id', 'product_types', 'aa_identifier', 'created_at', 'updated_at'],
  
  brokers: ['id', 'broker_id', 'name', 'type', 'is_active', 'created_at', 'updated_at'],
  
  fi_accounts: [
    'id', 'user_id', 'consent_id', 'fetch_run_id', 'fip_id', 'fi_type',
    'fip_account_type', 'fip_account_sub_type', 'aa_linked_ref', 'masked_acc_no',
    'provider_name', 'version', 'account_ref_hash', 'account_ref_number',
    'link_ref_number', 'link_status', 'consent_id_list', 'fip_name', 'last_seen_at', 'created_at'
  ],
  
  fi_account_holders_pii: [
    'id', 'account_id', 'holders_type', 'name', 'dob', 'mobile', 'email',
    'pan', 'address', 'ckyc_registered', 'kyc_compliance', 'nominee', 'created_at'
  ],
  
  fi_transactions: [
    'id', 'account_id', 'fetch_run_id', 'txn_id', 'txn_type', 'mode',
    'amount', 'balance', 'txn_timestamp', 'value_date', 'narration',
    'reference', 'dedupe_hash', 'category', 'sub_category', 'created_at'
  ],
  
  fi_deposit_summaries: [
    'id', 'account_id', 'fetch_run_id', 'current_balance', 'currency',
    'balance_datetime', 'account_type', 'account_sub_type', 'branch',
    'ifsc', 'micr_code', 'opening_date', 'status', 'pending_balance',
    'available_credit_limit', 'drawing_limit', 'created_at'
  ],
  
  fi_term_deposit_summaries: [
    'id', 'account_id', 'fetch_run_id', 'principal_amount', 'current_balance',
    'maturity_amount', 'maturity_date', 'interest_rate', 'interest_payout',
    'opening_date', 'tenure_days', 'tenure_months', 'current_value',
    'compounding_frequency', 'created_at'
  ],
  
  fi_recurring_deposit_summaries: [
    'id', 'account_id', 'fetch_run_id', 'current_balance', 'maturity_amount',
    'maturity_date', 'interest_rate', 'recurring_amount', 'tenure_months',
    'recurring_day', 'principal_amount', 'opening_date', 'current_value', 'created_at'
  ],
  
  fi_mutual_fund_summaries: [
    'id', 'account_id', 'fetch_run_id', 'cost_value', 'current_value',
    'total_investment', 'total_units', 'total_pnl', 'total_pnl_percent', 'created_at'
  ],
  
  fi_mutual_fund_holdings: [
    'id', 'account_id', 'fetch_run_id', 'amc', 'scheme_name', 'scheme_code',
    'scheme_plan', 'scheme_option', 'isin', 'folio_no', 'units', 'nav',
    'nav_date', 'current_value', 'cost_value', 'pnl', 'pnl_percent',
    'scheme_category', 'scheme_type', 'created_at'
  ],
  
  fi_equity_summaries: [
    'id', 'account_id', 'fetch_run_id', 'current_value', 'total_investment',
    'total_pnl', 'total_pnl_percent', 'total_holdings', 'created_at'
  ],
  
  fi_equity_holdings: [
    'id', 'account_id', 'fetch_run_id', 'issuer_name', 'isin', 'isin_desc',
    'units', 'last_price', 'current_value', 'symbol', 'exchange',
    'avg_cost_price', 'cost_value', 'pnl', 'pnl_percent', 'created_at'
  ],
  
  fi_etf_holdings: [
    'id', 'account_id', 'fetch_run_id', 'etf_name', 'isin', 'symbol',
    'units', 'nav', 'nav_date', 'current_value', 'cost_value', 'pnl',
    'pnl_percent', 'created_at'
  ],
  
  user_financial_snapshots: [
    'id', 'user_id', 'consent_id', 'snapshot_type', 'snapshot', 'generated_at'
  ],
};

// =====================================================
// API TO TABLE MAPPING
// =====================================================

interface ApiConfig {
  endpoint: string;
  name: string;
  targetTable: string;
  body: any;
  responseKey?: string; // Key to extract data from response
}

const API_CONFIGS: ApiConfig[] = [
  {
    endpoint: '/pfm/api/v2/fips',
    name: 'FIPs List',
    targetTable: 'fips',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER },
    responseKey: 'fips',
  },
  {
    endpoint: '/pfm/api/v2/brokers',
    name: 'Brokers List',
    targetTable: 'brokers',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER },
    responseKey: 'brokers',
  },
  {
    endpoint: '/pfm/api/v2/deposit/user-linked-accounts',
    name: 'Deposit Linked Accounts',
    targetTable: 'fi_accounts',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' },
    responseKey: 'fipData[].linkedAccounts[]',
  },
  {
    endpoint: '/pfm/api/v2/term-deposit/user-linked-accounts',
    name: 'Term Deposit Linked Accounts',
    targetTable: 'fi_accounts',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' },
    responseKey: 'fipData[].linkedAccounts[]',
  },
  {
    endpoint: '/pfm/api/v2/recurring-deposit/user-linked-accounts',
    name: 'Recurring Deposit Linked Accounts',
    targetTable: 'fi_accounts',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' },
    responseKey: 'fipData[].linkedAccounts[]',
  },
  {
    endpoint: '/pfm/api/v2/mutual-fund/user-linked-accounts',
    name: 'Mutual Fund Linked Accounts',
    targetTable: 'fi_accounts',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' },
    responseKey: 'fipData[].linkedAccounts[]',
  },
  {
    endpoint: '/pfm/api/v2/equities/user-linked-accounts',
    name: 'Equities Linked Accounts',
    targetTable: 'fi_accounts',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' },
    responseKey: 'fipData[].linkedAccounts[]',
  },
  {
    endpoint: '/pfm/api/v2/etf/user-linked-accounts',
    name: 'ETF Linked Accounts',
    targetTable: 'fi_accounts',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' },
    responseKey: 'fipData[].linkedAccounts[]',
  },
  {
    endpoint: '/pfm/api/v2/mutual-fund/holding-folio',
    name: 'Mutual Fund Holdings',
    targetTable: 'fi_mutual_fund_holdings',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER },
    responseKey: 'holdingFolios',
  },
  {
    endpoint: '/pfm/api/v2/equities/demat-holding',
    name: 'Equity Demat Holdings',
    targetTable: 'fi_equity_holdings',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER },
    responseKey: 'holdings',
  },
  {
    endpoint: '/pfm/api/v2/equities/holding-broker',
    name: 'Equity Broker Holdings',
    targetTable: 'fi_equity_holdings',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER },
    responseKey: 'holdingBrokers',
  },
  {
    endpoint: '/pfm/api/v2/deposit/insights',
    name: 'Deposit Insights',
    targetTable: 'user_financial_snapshots',
    body: { uniqueIdentifier: UNIQUE_IDENTIFIER, accountIds: [], from: '2025-01-01', to: '2025-12-18', frequency: 'MONTHLY' },
    responseKey: 'depositInsights',
  },
];

// =====================================================
// ANALYSIS FUNCTIONS
// =====================================================

interface FieldAnalysis {
  apiFields: Map<string, string>; // field path -> data type
  schemaColumns: string[];
  apiOnly: string[];      // In API but not in schema
  schemaOnly: string[];   // In schema but not in API
  matching: string[];     // In both
}

interface ApiAnalysisResult {
  endpoint: string;
  name: string;
  status: 'SUCCESS' | 'EMPTY' | 'ERROR';
  analysis?: FieldAnalysis;
  errorMessage?: string;
  sampleData?: any;
}

function extractDataFromResponse(response: any, responseKey: string): any[] {
  if (!responseKey || !response) return [response];
  
  // Handle nested keys like 'fipData[].linkedAccounts[]'
  const parts = responseKey.split('.');
  let current: any = response;
  
  for (const part of parts) {
    if (!current) return [];
    
    if (part.endsWith('[]')) {
      const key = part.slice(0, -2);
      if (key) {
        current = current[key];
      }
      if (Array.isArray(current)) {
        // Flatten nested arrays
        if (parts.indexOf(part) < parts.length - 1) {
          const remaining = parts.slice(parts.indexOf(part) + 1).join('.');
          const results: any[] = [];
          for (const item of current) {
            const nested = extractDataFromResponse(item, remaining);
            results.push(...nested);
          }
          return results;
        }
        return current;
      }
    } else {
      current = current[part];
    }
  }
  
  return Array.isArray(current) ? current : [current];
}

function flattenFieldPaths(fields: Map<string, string>): string[] {
  const flat: string[] = [];
  
  for (const [path] of fields) {
    // Convert API paths to schema-like names
    // e.g., "accountRefNumber" -> "account_ref_number"
    const schemaName = path
      .replace(/\[\]/g, '')
      .split('.')
      .pop() || path;
    
    flat.push(schemaName);
  }
  
  return [...new Set(flat)];
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function analyzeFields(
  apiFields: Map<string, string>,
  schemaColumns: string[]
): FieldAnalysis {
  // Get flat field names from API
  const apiFieldNames = new Set<string>();
  for (const [path] of apiFields) {
    const parts = path.replace(/\[\]/g, '').split('.');
    const fieldName = parts[parts.length - 1];
    apiFieldNames.add(fieldName);
    apiFieldNames.add(toSnakeCase(fieldName)); // Also add snake_case version
  }
  
  // Schema columns (excluding common ones like id, created_at)
  const schemaSet = new Set(schemaColumns.filter(c => 
    !['id', 'created_at', 'updated_at', 'user_id', 'account_id', 'fetch_run_id', 'consent_id', 'tsp_id', 'fip_id'].includes(c)
  ));
  
  const apiOnly: string[] = [];
  const schemaOnly: string[] = [];
  const matching: string[] = [];
  
  // Find API fields not in schema
  for (const field of apiFieldNames) {
    const snakeField = toSnakeCase(field);
    if (schemaSet.has(field) || schemaSet.has(snakeField)) {
      matching.push(field);
    } else {
      // Only add if it's a simple field name (not nested path)
      if (!field.includes('.') && field.length > 1) {
        apiOnly.push(`${field} (${apiFields.get(field) || 'unknown'})`);
      }
    }
  }
  
  // Find schema columns not in API
  for (const col of schemaSet) {
    const camelCol = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (!apiFieldNames.has(col) && !apiFieldNames.has(camelCol)) {
      schemaOnly.push(col);
    }
  }
  
  return {
    apiFields,
    schemaColumns,
    apiOnly: [...new Set(apiOnly)],
    schemaOnly: [...new Set(schemaOnly)],
    matching: [...new Set(matching)],
  };
}

async function analyzeApi(config: ApiConfig): Promise<ApiAnalysisResult> {
  console.log(`  Analyzing: ${config.name}...`);
  
  try {
    const response = await makeAuthenticatedRequest<any>(config.endpoint, config.body);
    const data = response?.data || response;
    
    if (!data) {
      return {
        endpoint: config.endpoint,
        name: config.name,
        status: 'EMPTY',
      };
    }
    
    // Extract relevant data based on response key
    const items = extractDataFromResponse(data, config.responseKey || '');
    
    if (!items || items.length === 0) {
      return {
        endpoint: config.endpoint,
        name: config.name,
        status: 'EMPTY',
        sampleData: data,
      };
    }
    
    // Extract fields from first item
    const sampleItem = items[0];
    const apiFields = extractFieldsWithTypes(sampleItem);
    
    // Get schema columns for target table
    const schemaColumns = SCHEMA_TABLES[config.targetTable] || [];
    
    // Analyze
    const analysis = analyzeFields(apiFields, schemaColumns);
    
    return {
      endpoint: config.endpoint,
      name: config.name,
      status: 'SUCCESS',
      analysis,
      sampleData: sampleItem,
    };
    
  } catch (error: any) {
    return {
      endpoint: config.endpoint,
      name: config.name,
      status: 'ERROR',
      errorMessage: error.message,
    };
  }
}

async function checkDatabaseNulls(): Promise<Record<string, string[]>> {
  console.log('\n📊 Checking database for NULL columns...');
  const nullColumns: Record<string, string[]> = {};
  
  if (!supabase) {
    console.log('   ⚠️ Supabase not configured - skipping NULL column check');
    return nullColumns;
  }
  
  for (const [table, columns] of Object.entries(SCHEMA_TABLES)) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(10);
      
      if (error || !data || data.length === 0) continue;
      
      const alwaysNull: string[] = [];
      
      for (const col of columns) {
        const allNull = data.every(row => row[col] === null || row[col] === undefined);
        if (allNull) {
          alwaysNull.push(col);
        }
      }
      
      if (alwaysNull.length > 0) {
        nullColumns[table] = alwaysNull;
      }
    } catch (e) {
      // Table might not exist yet
    }
  }
  
  return nullColumns;
}

// =====================================================
// REPORT GENERATION
// =====================================================

function generateReport(
  results: ApiAnalysisResult[],
  nullColumns: Record<string, string[]>
): string {
  let report = `# Schema Gap Analysis Report

**Generated:** ${new Date().toISOString()}  
**Test User:** ${UNIQUE_IDENTIFIER}

---

## Summary

| Status | Count |
|--------|-------|
| ✅ SUCCESS | ${results.filter(r => r.status === 'SUCCESS').length} |
| ⚠️ EMPTY | ${results.filter(r => r.status === 'EMPTY').length} |
| ❌ ERROR | ${results.filter(r => r.status === 'ERROR').length} |

---

## Detailed Analysis by API

`;

  for (const result of results) {
    report += `### ${result.name}\n\n`;
    report += `**Endpoint:** \`${result.endpoint}\`  \n`;
    report += `**Status:** ${result.status}\n\n`;
    
    if (result.status === 'ERROR') {
      report += `**Error:** ${result.errorMessage}\n\n`;
      continue;
    }
    
    if (result.status === 'EMPTY') {
      report += `No data returned from API.\n\n`;
      continue;
    }
    
    if (result.analysis) {
      const { apiOnly, schemaOnly, matching } = result.analysis;
      
      if (apiOnly.length > 0) {
        report += `#### 🔴 API Fields NOT in Schema (Need to Add)\n\n`;
        report += `| Field | Type |\n|-------|------|\n`;
        for (const field of apiOnly.slice(0, 20)) {
          const [name, type] = field.split(' (');
          report += `| ${name} | ${type?.replace(')', '') || 'unknown'} |\n`;
        }
        if (apiOnly.length > 20) {
          report += `| ... | +${apiOnly.length - 20} more |\n`;
        }
        report += '\n';
      }
      
      if (schemaOnly.length > 0) {
        report += `#### 🟡 Schema Columns NOT Populated by API\n\n`;
        report += schemaOnly.map(c => `- \`${c}\``).join('\n') + '\n\n';
      }
      
      if (matching.length > 0) {
        report += `#### 🟢 Working Fields (${matching.length})\n\n`;
        report += `<details><summary>Click to expand</summary>\n\n`;
        report += matching.slice(0, 30).map(c => `- \`${c}\``).join('\n') + '\n';
        if (matching.length > 30) {
          report += `\n... and ${matching.length - 30} more\n`;
        }
        report += `\n</details>\n\n`;
      }
    }
    
    report += '---\n\n';
  }
  
  // Database NULL columns section
  report += `## Database NULL Column Analysis\n\n`;
  report += `These columns exist in the schema but are always NULL in the database:\n\n`;
  
  if (Object.keys(nullColumns).length === 0) {
    report += `✅ No always-NULL columns found (or tables are empty).\n\n`;
  } else {
    for (const [table, cols] of Object.entries(nullColumns)) {
      report += `### ${table}\n\n`;
      report += cols.map(c => `- \`${c}\``).join('\n') + '\n\n';
    }
  }
  
  // Recommendations
  report += `## Recommendations\n\n`;
  report += `### High Priority (Add to Schema)\n\n`;
  
  const allApiOnly = new Set<string>();
  results.forEach(r => {
    r.analysis?.apiOnly.forEach(f => {
      const name = f.split(' (')[0];
      if (!name.includes('Id') && !name.includes('id') && name.length > 3) {
        allApiOnly.add(f);
      }
    });
  });
  
  if (allApiOnly.size > 0) {
    report += `Consider adding these frequently appearing API fields:\n\n`;
    report += `\`\`\`sql\n-- Example ALTER statements\n`;
    Array.from(allApiOnly).slice(0, 10).forEach(field => {
      const [name, type] = field.split(' (');
      const sqlType = type?.includes('number') || type?.includes('integer') ? 'NUMERIC' :
                      type?.includes('boolean') ? 'BOOLEAN' :
                      type?.includes('date') ? 'TIMESTAMPTZ' :
                      type?.includes('array') ? 'TEXT[]' : 'TEXT';
      report += `ALTER TABLE fi_accounts ADD COLUMN IF NOT EXISTS ${toSnakeCase(name)} ${sqlType};\n`;
    });
    report += `\`\`\`\n\n`;
  }
  
  report += `### Low Priority (Review for Removal)\n\n`;
  report += `Schema columns that are never populated might be candidates for removal or indicate missing API integration.\n\n`;
  
  return report;
}

// =====================================================
// MAIN
// =====================================================

async function analyzeSchemaGaps() {
  console.log('🔍 Starting Schema Gap Analysis...\n');
  console.log('='.repeat(60));
  
  // First, get an account ID for insights APIs
  let accountId = '';
  try {
    const linkedAccounts = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/user-linked-accounts',
      { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
    );
    const data = linkedAccounts?.data || linkedAccounts;
    if (data?.fipData?.[0]?.linkedAccounts?.[0]) {
      // Find Finvu Bank account
      for (const fip of data.fipData) {
        if (fip.fipName?.includes('Finvu') && !fip.fipName?.includes('Dhanagar')) {
          if (fip.linkedAccounts?.[0]?.accountRefNumber) {
            accountId = fip.linkedAccounts[0].accountRefNumber;
            break;
          }
        }
      }
      if (!accountId && data.fipData[0].linkedAccounts[0].accountRefNumber) {
        accountId = data.fipData[0].linkedAccounts[0].accountRefNumber;
      }
    }
  } catch (e) {
    console.log('  Could not get account ID for insights APIs');
  }
  
  // Update insights API config with account ID
  for (const config of API_CONFIGS) {
    if (config.endpoint.includes('/insights') && accountId) {
      config.body.accountIds = [accountId];
    }
  }
  
  console.log('\n📡 Calling APIs and analyzing responses...\n');
  
  const results: ApiAnalysisResult[] = [];
  
  for (const config of API_CONFIGS) {
    const result = await analyzeApi(config);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Check database for NULL columns
  const nullColumns = await checkDatabaseNulls();
  
  // Generate report
  console.log('\n📝 Generating report...');
  const report = generateReport(results, nullColumns);
  
  // Save report
  const reportPath = path.join(process.cwd(), 'SCHEMA_ANALYSIS_REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
  
  // Print summary to console
  console.log('\n' + '='.repeat(60));
  console.log('📊 QUICK SUMMARY');
  console.log('='.repeat(60));
  
  let totalApiOnly = 0;
  let totalSchemaOnly = 0;
  
  for (const result of results) {
    if (result.analysis) {
      totalApiOnly += result.analysis.apiOnly.length;
      totalSchemaOnly += result.analysis.schemaOnly.length;
    }
  }
  
  console.log(`\n🔴 Total API fields NOT in schema: ${totalApiOnly}`);
  console.log(`🟡 Total schema columns NOT in API: ${totalSchemaOnly}`);
  console.log(`📊 Tables with NULL columns: ${Object.keys(nullColumns).length}`);
  
  console.log('\n✨ Analysis complete! Check SCHEMA_ANALYSIS_REPORT.md for details.');
}

analyzeSchemaGaps().catch(console.error);

