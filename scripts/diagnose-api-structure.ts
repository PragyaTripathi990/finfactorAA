/**
 * API Structure Diagnostic Tool
 * 
 * This script calls the APIs and shows:
 * 1. What fields the API actually returns
 * 2. What we're trying to map
 * 3. What's missing or empty
 * 
 * Run: npm run diagnose:api-structure
 */

import { makeAuthenticatedRequest } from '../lib/finfactor';
import * as fs from 'fs';
import * as path from 'path';

const UNIQUE_IDENTIFIER = '8956545791';

interface FieldAnalysis {
  fieldPath: string;
  value: any;
  type: string;
  isEmpty: boolean;
}

function analyzeObject(obj: any, prefix: string = '', depth: number = 0): FieldAnalysis[] {
  const fields: FieldAnalysis[] = [];
  
  if (depth > 5) return fields; // Prevent infinite recursion
  
  if (obj === null || obj === undefined) {
    fields.push({
      fieldPath: prefix || 'root',
      value: null,
      type: 'null',
      isEmpty: true,
    });
    return fields;
  }
  
  if (Array.isArray(obj)) {
    fields.push({
      fieldPath: prefix || 'root',
      value: `[Array of ${obj.length} items]`,
      type: 'array',
      isEmpty: obj.length === 0,
    });
    
    if (obj.length > 0 && typeof obj[0] === 'object') {
      const childFields = analyzeObject(obj[0], `${prefix}[]`, depth + 1);
      fields.push(...childFields);
    }
    return fields;
  }
  
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        fields.push({
          fieldPath,
          value: null,
          type: 'null',
          isEmpty: true,
        });
      } else if (Array.isArray(value)) {
        fields.push({
          fieldPath,
          value: `[Array of ${value.length} items]`,
          type: 'array',
          isEmpty: value.length === 0,
        });
        if (value.length > 0 && typeof value[0] === 'object') {
          const childFields = analyzeObject(value[0], `${fieldPath}[]`, depth + 1);
          fields.push(...childFields);
        }
      } else if (typeof value === 'object') {
        fields.push({
          fieldPath,
          value: '{object}',
          type: 'object',
          isEmpty: Object.keys(value).length === 0,
        });
        const childFields = analyzeObject(value, fieldPath, depth + 1);
        fields.push(...childFields);
      } else {
        fields.push({
          fieldPath,
          value: String(value).substring(0, 100), // Truncate long values
          type: typeof value,
          isEmpty: value === '' || value === null || value === undefined,
        });
      }
    }
  }
  
  return fields;
}

async function diagnoseAPI(endpoint: string, body: any, name: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Diagnosing: ${name}`);
  console.log(`📡 Endpoint: ${endpoint}`);
  console.log('='.repeat(60));
  
  try {
    const response = await makeAuthenticatedRequest<any>(endpoint, body);
    const data = response?.data || response;
    
    if (!data) {
      console.log('❌ No data returned');
      return null;
    }
    
    // Analyze the structure
    const fields = analyzeObject(data);
    
    // Group by category
    const nonEmptyFields = fields.filter(f => !f.isEmpty && f.type !== 'null');
    const emptyFields = fields.filter(f => f.isEmpty || f.type === 'null');
    const nestedObjects = fields.filter(f => f.type === 'object' || f.type === 'array');
    
    console.log(`\n📊 Statistics:`);
    console.log(`   Total fields found: ${fields.length}`);
    console.log(`   Non-empty fields: ${nonEmptyFields.length}`);
    console.log(`   Empty/null fields: ${emptyFields.length}`);
    console.log(`   Nested objects/arrays: ${nestedObjects.length}`);
    
    // Show key fields we're looking for
    console.log(`\n🔑 Key Fields We're Mapping:`);
    const keyFields = [
      'fipData',
      'linkedAccounts',
      'Summary',
      'summary',
      'Profile',
      'profile',
      'Holders',
      'currentBalance',
      'accountRefNumber',
      'maskedAccNumber',
      'accountType',
      'transactions',
      'holdings',
      'holdingFolios',
    ];
    
    for (const keyField of keyFields) {
      const found = fields.find(f => 
        f.fieldPath.toLowerCase().includes(keyField.toLowerCase())
      );
      if (found) {
        console.log(`   ✅ ${found.fieldPath}: ${found.type} ${found.isEmpty ? '(empty)' : '(has data)'}`);
      } else {
        console.log(`   ❌ ${keyField}: NOT FOUND`);
      }
    }
    
    // Show sample of actual structure
    console.log(`\n📋 Sample Structure (first 20 fields):`);
    fields.slice(0, 20).forEach(f => {
      const indicator = f.isEmpty ? '⚪' : '🟢';
      console.log(`   ${indicator} ${f.fieldPath}: ${f.type} = ${f.value}`);
    });
    
    // Save full response to file for inspection
    const outputDir = path.join(process.cwd(), 'api-responses');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const outputFile = path.join(outputDir, `${safeName}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`\n💾 Full response saved to: ${outputFile}`);
    
    return {
      endpoint,
      name,
      fields,
      nonEmptyFields,
      emptyFields,
      sampleData: data,
    };
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

async function diagnoseAll() {
  console.log('🚀 Starting API Structure Diagnosis...\n');
  
  // Get account ID for APIs that need it
  let depositAccountId = '';
  try {
    const linkedAccounts = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/user-linked-accounts',
      { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' }
    );
    const data = linkedAccounts?.data || linkedAccounts;
    if (data?.fipData?.[0]?.linkedAccounts?.[0]) {
      for (const fip of data.fipData) {
        if (fip.fipName?.includes('Finvu') && !fip.fipName?.includes('Dhanagar')) {
          if (fip.linkedAccounts?.[0]?.accountRefNumber) {
            depositAccountId = fip.linkedAccounts[0].accountRefNumber;
            break;
          }
        }
      }
      if (!depositAccountId && data.fipData[0].linkedAccounts[0].accountRefNumber) {
        depositAccountId = data.fipData[0].linkedAccounts[0].accountRefNumber;
      }
    }
  } catch (e) {
    console.log('⚠️ Could not get account ID');
  }
  
  const results: any[] = [];
  
  // Diagnose each API
  results.push(await diagnoseAPI(
    '/pfm/api/v2/deposit/user-linked-accounts',
    { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' },
    'Deposit Linked Accounts'
  ));
  
  results.push(await diagnoseAPI(
    '/pfm/api/v2/term-deposit/user-linked-accounts',
    { uniqueIdentifier: UNIQUE_IDENTIFIER, filterZeroValueAccounts: 'false', filterZeroValueHoldings: 'false' },
    'Term Deposit Linked Accounts'
  ));
  
  if (depositAccountId) {
    results.push(await diagnoseAPI(
      '/pfm/api/v2/deposit/user-account-statement',
      { uniqueIdentifier: UNIQUE_IDENTIFIER, accountId: depositAccountId, dateRangeFrom: '2025-01-01' },
      'Deposit Account Statement'
    ));
  }
  
  results.push(await diagnoseAPI(
    '/pfm/api/v2/mutual-fund/holding-folio',
    { uniqueIdentifier: UNIQUE_IDENTIFIER },
    'Mutual Fund Holdings'
  ));
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSIS SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r !== null);
  console.log(`\n✅ Successfully analyzed: ${successful.length} APIs`);
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Check the api-responses/ folder for full JSON responses');
  console.log('   2. Compare actual API structure with what we\'re mapping');
  console.log('   3. Update mapper functions if field names don\'t match');
  console.log('   4. Add missing fields to schema if needed');
  
  // Save summary
  const summaryFile = path.join(process.cwd(), 'API_STRUCTURE_DIAGNOSIS.md');
  let summary = `# API Structure Diagnosis Report\n\n`;
  summary += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  for (const result of successful) {
    summary += `## ${result.name}\n\n`;
    summary += `**Endpoint:** \`${result.endpoint}\`\n\n`;
    summary += `- Total fields: ${result.fields.length}\n`;
    summary += `- Non-empty: ${result.nonEmptyFields.length}\n`;
    summary += `- Empty: ${result.emptyFields.length}\n\n`;
    
    summary += `### Key Fields Found:\n\n`;
    const importantFields = result.fields.filter(f => 
      !f.isEmpty && (f.fieldPath.includes('Summary') || 
                     f.fieldPath.includes('Profile') ||
                     f.fieldPath.includes('account') ||
                     f.fieldPath.includes('balance') ||
                     f.fieldPath.includes('transaction'))
    );
    
    importantFields.slice(0, 30).forEach(f => {
      summary += `- \`${f.fieldPath}\`: ${f.type}\n`;
    });
    
    summary += `\n---\n\n`;
  }
  
  fs.writeFileSync(summaryFile, summary);
  console.log(`\n📄 Summary report saved to: ${summaryFile}`);
}

diagnoseAll().catch(console.error);

