/**
 * Seed Supabase Database from Real API Responses
 * 
 * This script:
 * 1. Calls your APIs to get real data
 * 2. Transforms API responses to match the new schema
 * 3. Detects missing fields in schema vs API responses
 * 4. Seeds the database
 * 
 * Run with: npm run seed:from-apis
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { makeAuthenticatedRequest } from '../lib/finfactor';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epxfwxzerivaklmennfo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_9HffItjyNohPc6GIDQx-PQ_RuPjCto-';

const supabase = createClient(supabaseUrl, supabaseKey);

// Field detection storage
const missingFields: Record<string, Set<string>> = {};

/**
 * Helper to detect missing fields in API response vs schema
 */
function detectMissingFields(tableName: string, apiData: any, schemaFields: string[]) {
  if (!missingFields[tableName]) {
    missingFields[tableName] = new Set();
  }
  
  const apiFields = Object.keys(apiData || {});
  const missing = apiFields.filter(field => !schemaFields.includes(field));
  
  missing.forEach(field => {
    missingFields[tableName].add(field);
  });
}

/**
 * Generate hash for deduplication
 */
function generateHash(...values: (string | number | null | undefined)[]): string {
  const str = values.filter(v => v != null).map(v => String(v)).join('|');
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 100);
}

/**
 * Seed TSP Provider
 */
async function seedTSPProvider() {
  console.log('\n🌐 Seeding TSP Provider...');
  
  const tspData = {
    name: 'FINFACTOR',
    environment: 'SANDBOX',
    base_url: 'https://dhanaprayoga.fiu.finfactor.in',
    is_active: true,
  };
  
  const { data, error } = await supabase
    .from('tsp_providers')
    .upsert(tspData, { onConflict: 'name,environment' })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error seeding TSP Provider:', error.message);
    return null;
  }
  
  console.log('✅ TSP Provider seeded:', data.id);
  return data.id;
}

/**
 * Seed AA Gateway
 */
async function seedAAGateway() {
  console.log('\n🌐 Seeding AA Gateway...');
  
  const gatewayData = {
    name: 'FINVU',
    environment: 'SANDBOX',
    gateway_base_url: 'https://finvu.in',
    is_active: true,
  };
  
  const { data, error } = await supabase
    .from('aa_gateways')
    .upsert(gatewayData, { onConflict: 'name,environment' })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error seeding AA Gateway:', error.message);
    return null;
  }
  
  console.log('✅ AA Gateway seeded:', data.id);
  return data.id;
}

/**
 * Seed App User
 */
async function seedAppUser(uniqueIdentifier: string) {
  console.log(`\n👤 Seeding App User: ${uniqueIdentifier}...`);
  
  const userData = {
    phone: uniqueIdentifier,
    email: `user${uniqueIdentifier}@example.com`,
  };
  
  const { data, error } = await supabase
    .from('app_users')
    .upsert(userData, { onConflict: 'phone' })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error seeding App User:', error.message);
    return null;
  }
  
  console.log('✅ App User seeded:', data.id);
  return data.id;
}

/**
 * Helper to call API and handle response
 */
async function callAPI(endpoint: string, body: any): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(endpoint, body);
    if (response && typeof response === 'object') {
      if (response.success && response.data) {
        return response.data;
      }
      if (response.data && !response.success) {
        return response.data;
      }
      if (!response.success && !response.message) {
        return response;
      }
    }
    return response || null;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return null;
  }
}

/**
 * Seed FIPs from API
 */
async function seedFIPs() {
  console.log('\n🏦 Seeding FIPs from API...');
  
  try {
    const fipsData = await callAPI('/pfm/api/v2/fips', {});
    
    if (!fipsData || !Array.isArray(fipsData)) {
      console.log('⚠️ No FIPs data from API');
      return {};
    }
  
    const fipMap: Record<string, string> = {};
    
    for (const fip of fipsData) {
      const fipRecord = {
        fip_code: fip.fipId || fip.fip_id,
        name: fip.fipName || fip.name,
        type: fip.bankType || fip.type || 'UNKNOWN',
        environment: 'SANDBOX',
        is_active: fip.enabled !== false,
      };
      
      // Detect missing fields
      detectMissingFields('fips', fip, [
        'fip_code', 'name', 'type', 'environment', 'is_active',
        'fipId', 'fipName', 'bankType', 'enabled', 'logoUrl', 'category',
        'website', 'support_email', 'support_phone', 'fi_types'
      ]);
      
      const { data, error } = await supabase
        .from('fips')
        .upsert(fipRecord, { onConflict: 'fip_code' })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error seeding FIP ${fipRecord.name}:`, error.message);
      } else {
        console.log(`✅ FIP seeded: ${fipRecord.name} (${data.id})`);
        fipMap[fip.fipId || fip.fip_id] = data.id;
      }
    }
    
    return fipMap;
  } catch (error) {
    console.error('❌ Error fetching FIPs:', error);
    return {};
  }
}

/**
 * Seed User Details and create consent/fetch run
 */
async function seedUserDetails(userId: string, uniqueIdentifier: string, tspId: string) {
  console.log(`\n📊 Seeding User Details for ${uniqueIdentifier}...`);
  
  try {
    const userDetails = await callAPI('/pfm/api/v2/user-details', {
      uniqueIdentifier: uniqueIdentifier,
    });
    
    if (!userDetails) {
      console.log('⚠️ No user details from API');
      return null;
    }
    
    // Store raw response for analysis
    console.log('📝 User Details Response Structure:', JSON.stringify(Object.keys(userDetails), null, 2));
    
    // Create a data fetch run to track this API call
    const fetchRun = {
      user_id: userId,
      tsp_id: tspId,
      fetch_type: 'USER_DETAILS',
      endpoint: '/pfm/api/v2/user-details',
      request_id: generateHash('user-details', uniqueIdentifier, Date.now()),
      status: 'FETCHED',
      requested_at: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      records_count: 1,
    };
    
    const { data: fetchRunData, error: fetchError } = await supabase
      .from('aa_data_fetch_runs')
      .insert(fetchRun)
      .select()
      .single();
    
    if (fetchError) {
      console.error('❌ Error creating fetch run:', fetchError.message);
    } else {
      console.log('✅ Fetch run created:', fetchRunData.id);
    }
    
    // Store the raw response as a payload
    if (fetchRunData) {
      const payload = {
        fetch_run_id: fetchRunData.id,
        payload_role: 'RESPONSE',
        content_format: 'JSON',
        hash_sha256: generateHash(JSON.stringify(userDetails)),
      };
      
      await supabase.from('aa_fetch_payloads').insert(payload);
    }
    
    // Process fiDatas if available
    if (userDetails.fiDatas) {
      console.log('📋 Processing fiDatas...');
      
      for (const [fiType, fiData] of Object.entries(userDetails.fiDatas)) {
        console.log(`  Processing ${fiType}...`);
        
        // Detect missing fields
        detectMissingFields(`user_details_fiDatas_${fiType}`, fiData, [
          'totalFiData', 'totalFiDataToBeFetched', 'lastFetchDate',
          'currentBalance', 'currentValue', 'costValue', 'totalHoldings',
          'totalBrokers', 'dataSourceDetails', 'fipData'
        ]);
      }
    }
    
    return fetchRunData;
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    return null;
  }
}

/**
 * Seed Deposit Accounts
 */
async function seedDepositAccounts(userId: string, uniqueIdentifier: string, fipMap: Record<string, string>, fetchRunId: string) {
  console.log(`\n💰 Seeding Deposit Accounts for ${uniqueIdentifier}...`);
  
  try {
    const linkedAccounts = await callAPI('/pfm/api/v2/deposit/user-linked-accounts', {
      uniqueIdentifier: uniqueIdentifier,
    });
    
    if (!linkedAccounts) {
      console.log('⚠️ No deposit accounts from API');
      return;
    }
    
    console.log('📝 Deposit Accounts Response Structure:', JSON.stringify(Object.keys(linkedAccounts), null, 2));
    
    // Process fipData array
    if (linkedAccounts.fipData && Array.isArray(linkedAccounts.fipData)) {
      for (const fipData of linkedAccounts.fipData) {
        const fipId = fipMap[fipData.fipId] || null;
        
        if (fipData.linkedAccounts && Array.isArray(fipData.linkedAccounts)) {
          for (const account of fipData.linkedAccounts) {
            // Detect missing fields
            detectMissingFields('deposit_linked_accounts', account, [
              'fiDataId', 'accountType', 'maskedAccNumber', 'accountRefNumber',
              'dataFetched', 'accountName', 'lastFetchDateTime', 'fipId', 'fipName',
              'latestConsentPurposeText', 'latestConsentExpiryTime', 'consentPurposeVersion'
            ]);
            
            const accountRefHash = generateHash(
              userId,
              fipId,
              account.fiDataId || account.accountRefNumber,
              account.maskedAccNumber,
              'DEPOSIT'
            );
            
            const accountRecord = {
              user_id: userId,
              fetch_run_id: fetchRunId,
              fip_id: fipId,
              fi_type: 'DEPOSIT',
              fip_account_type: account.accountType,
              aa_linked_ref: account.accountRefNumber,
              masked_acc_no: account.maskedAccNumber,
              provider_name: account.fipName,
              account_ref_hash: accountRefHash,
              last_seen_at: account.lastFetchDateTime || new Date().toISOString(),
            };
            
            const { data: accountData, error: accountError } = await supabase
              .from('fi_accounts')
              .upsert(accountRecord, { onConflict: 'account_ref_hash' })
              .select()
              .single();
            
            if (accountError) {
              console.error('❌ Error seeding account:', accountError.message);
            } else {
              console.log(`✅ Account seeded: ${account.maskedAccNumber} (${accountData.id})`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching deposit accounts:', error);
  }
}

/**
 * Seed Recurring Deposit Accounts
 */
async function seedRecurringDepositAccounts(userId: string, uniqueIdentifier: string, fipMap: Record<string, string>, fetchRunId: string) {
  console.log(`\n🔄 Seeding Recurring Deposit Accounts for ${uniqueIdentifier}...`);
  
  try {
    const linkedAccounts = await callAPI('/pfm/api/v2/recurring-deposit/user-linked-accounts', {
      uniqueIdentifier: uniqueIdentifier,
    });
    
    if (!linkedAccounts) {
      console.log('⚠️ No recurring deposit accounts from API');
      return;
    }
    
    // Similar structure to deposit accounts
    if (linkedAccounts.fipData && Array.isArray(linkedAccounts.fipData)) {
      for (const fipData of linkedAccounts.fipData) {
        const fipId = fipMap[fipData.fipId] || null;
        
        if (fipData.linkedAccounts && Array.isArray(fipData.linkedAccounts)) {
          for (const account of fipData.linkedAccounts) {
            detectMissingFields('recurring_deposit_linked_accounts', account, [
              'fiDataId', 'accountType', 'maskedAccNumber', 'accountRefNumber',
              'dataFetched', 'accountName', 'lastFetchDateTime', 'fipId', 'fipName'
            ]);
            
            const accountRefHash = generateHash(
              userId,
              fipId,
              account.fiDataId || account.accountRefNumber,
              account.maskedAccNumber,
              'RECURRING_DEPOSIT'
            );
            
            const accountRecord = {
              user_id: userId,
              fetch_run_id: fetchRunId,
              fip_id: fipId,
              fi_type: 'RECURRING_DEPOSIT',
              aa_linked_ref: account.accountRefNumber,
              masked_acc_no: account.maskedAccNumber,
              provider_name: account.fipName,
              account_ref_hash: accountRefHash,
              last_seen_at: account.lastFetchDateTime || new Date().toISOString(),
            };
            
            const { data: accountData, error: accountError } = await supabase
              .from('fi_accounts')
              .upsert(accountRecord, { onConflict: 'account_ref_hash' })
              .select()
              .single();
            
            if (!accountError && accountData) {
              // Try to get detailed RD data from user-linked-accounts endpoint
              // This would need a separate API call to get RD details
              console.log(`✅ RD Account seeded: ${account.maskedAccNumber}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching recurring deposit accounts:', error);
  }
}

/**
 * Seed Mutual Fund Holdings
 */
async function seedMutualFundHoldings(userId: string, uniqueIdentifier: string, fipMap: Record<string, string>, fetchRunId: string) {
  console.log(`\n📈 Seeding Mutual Fund Holdings for ${uniqueIdentifier}...`);
  
  try {
    const holdings = await callAPI('/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio', {
      uniqueIdentifier: uniqueIdentifier,
    });
    
    if (!holdings) {
      console.log('⚠️ No mutual fund holdings from API');
      return;
    }
  
    console.log('📝 MF Holdings Response Structure:', JSON.stringify(Object.keys(holdings), null, 2));
    
    if (holdings.holdings && Array.isArray(holdings.holdings)) {
      for (const holding of holdings.holdings) {
        // Detect missing fields
        detectMissingFields('mf_holdings', holding, [
          'amc', 'registrar', 'schemeCode', 'schemaOption', 'schemaTypes',
          'schemaCategory', 'isin', 'isinDescription', 'ucc', 'amfiCode',
          'closingUnits', 'lienUnits', 'nav', 'avgNav', 'navDate', 'lockingUnits',
          'lastFetchTime', 'currentValue', 'folios'
        ]);
        
        // Process folios
        if (holding.folios && Array.isArray(holding.folios)) {
          for (const folio of holding.folios) {
            const fipId = fipMap[folio.fipId] || null;
            
            const accountRefHash = generateHash(
              userId,
              fipId,
              folio.fiDataId || folio.folioNo,
              folio.maskedAccNumber,
              'MUTUAL_FUNDS'
            );
            
            // Create or get account
            const accountRecord = {
              user_id: userId,
              fetch_run_id: fetchRunId,
              fip_id: fipId,
              fi_type: 'MUTUAL_FUNDS',
              aa_linked_ref: folio.accountRefNumber,
              masked_acc_no: folio.maskedAccNumber,
              account_ref_hash: accountRefHash,
              last_seen_at: folio.lastFetchTime || new Date().toISOString(),
            };
            
            const { data: accountData, error: accountError } = await supabase
              .from('fi_accounts')
              .upsert(accountRecord, { onConflict: 'account_ref_hash' })
              .select()
              .single();
            
            if (accountError || !accountData) {
              console.error('❌ Error creating MF account:', accountError?.message);
              continue;
            }
            
            // Create holding
            const holdingRecord = {
              account_id: accountData.id,
              fetch_run_id: fetchRunId,
              amc: holding.amc,
              scheme_name: holding.isinDescription,
              scheme_code: holding.schemeCode,
              scheme_option: holding.schemaOption,
              isin: holding.isin,
              folio_no: folio.folioNo,
              units: holding.closingUnits,
              nav: folio.nav || holding.nav,
              nav_date: folio.navDate || holding.navDate,
              current_value: folio.currentValue || holding.currentValue,
            };
            
            const { error: holdingError } = await supabase
              .from('fi_mutual_fund_holdings')
              .insert(holdingRecord);
            
            if (holdingError) {
              console.error('❌ Error seeding MF holding:', holdingError.message);
            } else {
              console.log(`✅ MF Holding seeded: ${holding.isinDescription}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching MF holdings:', error);
  }
}

/**
 * Seed Equities Holdings
 */
async function seedEquitiesHoldings(userId: string, uniqueIdentifier: string, fipMap: Record<string, string>, fetchRunId: string) {
  console.log(`\n📊 Seeding Equities Holdings for ${uniqueIdentifier}...`);
  
  try {
    const holdings = await callAPI('/pfm/api/v2/equities/user-linked-accounts/holding-broker', {
      uniqueIdentifier: uniqueIdentifier,
      filterZeroValueAccounts: 'false',
      filterZeroValueHoldings: 'false',
    });
    
    if (!holdings) {
      console.log('⚠️ No equities holdings from API');
      return;
    }
  
    console.log('📝 Equities Holdings Response Structure:', JSON.stringify(Object.keys(holdings), null, 2));
    
    if (holdings.holdings && Array.isArray(holdings.holdings)) {
      for (const holding of holdings.holdings) {
        // Detect missing fields
        detectMissingFields('equities_holdings', holding, [
          'issuerName', 'isin', 'isinDescription', 'units', 'lastTradedPrice',
          'avgTradedPrice', 'lastFetchTime', 'currentValue', 'portfolioWeightagePercent',
          'brokers', 'prevDetails'
        ]);
        
        // Process brokers
        if (holding.brokers && Array.isArray(holding.brokers)) {
          for (const broker of holding.brokers) {
            // For equities, we might need to create a demat account
            // This is simplified - you may need to adjust based on actual API structure
            const accountRefHash = generateHash(
              userId,
              broker.brokerId,
              holding.isin,
              'EQUITIES'
            );
            
            const accountRecord = {
              user_id: userId,
              fetch_run_id: fetchRunId,
              fi_type: 'EQUITIES',
              provider_name: broker.brokerName,
              account_ref_hash: accountRefHash,
              last_seen_at: broker.lastFetchTime || holding.lastFetchTime || new Date().toISOString(),
            };
            
            const { data: accountData, error: accountError } = await supabase
              .from('fi_accounts')
              .upsert(accountRecord, { onConflict: 'account_ref_hash' })
              .select()
              .single();
            
            if (accountError || !accountData) {
              console.error('❌ Error creating equity account:', accountError?.message);
              continue;
            }
            
            // Create equity holding
            const equityHolding = {
              account_id: accountData.id,
              fetch_run_id: fetchRunId,
              issuer_name: holding.issuerName,
              isin: holding.isin,
              isin_desc: holding.isinDescription,
              units: holding.units,
              last_price: holding.lastTradedPrice,
              current_value: holding.currentValue,
            };
            
            const { error: holdingError } = await supabase
              .from('fi_equity_holdings')
              .insert(equityHolding);
            
            if (holdingError) {
              console.error('❌ Error seeding equity holding:', holdingError.message);
            } else {
              console.log(`✅ Equity Holding seeded: ${holding.isinDescription}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching equities holdings:', error);
  }
}

/**
 * Print missing fields report
 */
function printMissingFieldsReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 MISSING FIELDS REPORT');
  console.log('='.repeat(60));
  
  if (Object.keys(missingFields).length === 0) {
    console.log('✅ No missing fields detected!');
    return;
  }
  
  for (const [table, fields] of Object.entries(missingFields)) {
    if (fields.size > 0) {
      console.log(`\n📌 ${table}:`);
      Array.from(fields).sort().forEach(field => {
        console.log(`   - ${field}`);
      });
    }
  }
  
  console.log('\n💡 Add these fields to your schema if they are important!');
}

/**
 * Main seed function
 */
async function seedFromAPIs() {
  console.log('🚀 Starting database seeding from API responses...\n');
  console.log('📋 Make sure you have run the SQL schema first!\n');
  
  const uniqueIdentifier = '8956545791'; // Default test user
  
  try {
    // 1. Seed TSP Provider and AA Gateway
    const tspId = await seedTSPProvider();
    const aaGatewayId = await seedAAGateway();
    
    if (!tspId) {
      console.error('❌ Failed to seed TSP Provider. Exiting.');
      return;
    }
    
    // 2. Seed App User
    const userId = await seedAppUser(uniqueIdentifier);
    if (!userId) {
      console.error('❌ Failed to seed App User. Exiting.');
      return;
    }
    
    // 3. Seed FIPs
    const fipMap = await seedFIPs();
    
    // 4. Seed User Details (creates fetch run)
    const fetchRun = await seedUserDetails(userId, uniqueIdentifier, tspId);
    const fetchRunId = fetchRun?.id || null;
    
    if (!fetchRunId) {
      console.log('⚠️ No fetch run created, but continuing...');
    }
    
    // 5. Seed various account types
    await seedDepositAccounts(userId, uniqueIdentifier, fipMap, fetchRunId || '');
    await seedRecurringDepositAccounts(userId, uniqueIdentifier, fipMap, fetchRunId || '');
    await seedMutualFundHoldings(userId, uniqueIdentifier, fipMap, fetchRunId || '');
    await seedEquitiesHoldings(userId, uniqueIdentifier, fipMap, fetchRunId || '');
    
    // 6. Print missing fields report
    printMissingFieldsReport();
    
    console.log('\n✨ Seeding completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review the missing fields report above');
    console.log('   2. Add important missing fields to the schema');
    console.log('   3. Re-run this script to test');
    
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
  }
}

// Run the seed
seedFromAPIs().catch(console.error);

