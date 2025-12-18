/**
 * Supabase Database Seed Script for WealthScape APIs
 * Based on Official Finfactor/Finvu API Documentation
 * 
 * Run with: npm run seed:supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epxfwxzerivaklmennfo.supabase.co';
const supabaseKey = 'sb_publishable_9HffItjyNohPc6GIDQx-PQ_RuPjCto-';

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// DUMMY DATA BASED ON OFFICIAL API STRUCTURE
// ============================================

// Users (matches /pfm/api/v2/user-subscriptions)
const usersData = [
  {
    unique_identifier: '8956545791',
    mobile_number: '8956545791',
    pan: 'IJFGF4579B',
    email: 'test.user1@example.com',
    subscription_status: 'YES',
    subscription_start: '2024-01-01',
    subscription_end: '2026-02-01',
    total_portfolio_value: 2456789.50
  },
  {
    unique_identifier: '9823972748',
    mobile_number: '9823972748',
    pan: 'ABCDE1234F',
    email: 'test.user2@example.com',
    subscription_status: 'YES',
    subscription_start: '2024-03-15',
    subscription_end: '2025-03-14',
    total_portfolio_value: 3567890.75
  },
  {
    unique_identifier: '9167073512',
    mobile_number: '9167073512',
    pan: 'FGHIJ5678K',
    email: 'test.user3@example.com',
    subscription_status: 'NO',
    subscription_start: null,
    subscription_end: null,
    total_portfolio_value: 987654.25
  },
  {
    unique_identifier: '7008281184',
    mobile_number: '7008281184',
    pan: 'KLMNO9012P',
    email: 'test.user4@example.com',
    subscription_status: 'YES',
    subscription_start: '2024-06-01',
    subscription_end: '2025-06-01',
    total_portfolio_value: 1234567.00
  },
  {
    unique_identifier: '9239874560',
    mobile_number: '9239874560',
    pan: 'ANKPJ4391C',
    email: 'test.user5@example.com',
    subscription_status: 'YES',
    subscription_start: '2024-01-01',
    subscription_end: '2026-01-01',
    total_portfolio_value: 567890.50
  },
  {
    unique_identifier: '9820707135',
    mobile_number: '9820707135',
    pan: 'PQRST3456U',
    email: 'test.user6@example.com',
    subscription_status: 'YES',
    subscription_start: '2024-02-15',
    subscription_end: '2025-02-15',
    total_portfolio_value: 2345678.00
  },
  {
    unique_identifier: '6397585098',
    mobile_number: '6397585098',
    pan: 'UVWXY7890Z',
    email: 'test.user7@example.com',
    subscription_status: 'YES',
    subscription_start: '2024-07-01',
    subscription_end: '2025-07-01',
    total_portfolio_value: 890123.45
  }
];

// FI Data Summary (fiDatas from /pfm/api/v2/user-details response)
const fiDataSummaryData = [
  // User 8956545791
  {
    unique_identifier: '8956545791',
    fi_type: 'DEPOSIT',
    total_fi_data: 2,
    total_fi_data_to_be_fetched: 0,
    last_fetch_date: new Date().toISOString(),
    current_balance: 215135.25,
    current_value: 215135.25,
    total_holdings: 2,
    total_brokers: 0,
    data_source_details: [{ dataResourceType: 'AA', lastFetchDate: new Date().toISOString() }]
  },
  {
    unique_identifier: '8956545791',
    fi_type: 'TERM_DEPOSIT',
    total_fi_data: 2,
    total_fi_data_to_be_fetched: 0,
    last_fetch_date: new Date().toISOString(),
    current_balance: null,
    current_value: 702000.00,
    cost_value: 650000.00,
    total_holdings: 2,
    total_brokers: 0,
    data_source_details: [{ dataResourceType: 'AA', lastFetchDate: new Date().toISOString() }]
  },
  {
    unique_identifier: '8956545791',
    fi_type: 'MUTUAL_FUNDS',
    total_fi_data: 4,
    total_fi_data_to_be_fetched: 0,
    last_fetch_date: new Date().toISOString(),
    current_balance: null,
    current_value: 483622.57,
    cost_value: 433117.71,
    total_holdings: 4,
    total_brokers: 0,
    data_source_details: [
      { dataResourceType: 'AA', lastFetchDate: new Date().toISOString() },
      { dataResourceType: 'MFC', lastFetchDate: new Date().toISOString() }
    ]
  },
  {
    unique_identifier: '8956545791',
    fi_type: 'NPS',
    total_fi_data: 1,
    total_fi_data_to_be_fetched: 0,
    last_fetch_date: new Date().toISOString(),
    current_balance: null,
    current_value: 567890.50,
    cost_value: null,
    total_holdings: 1,
    total_brokers: 0,
    data_source_details: [{ dataResourceType: 'AA', lastFetchDate: new Date().toISOString() }]
  },
  // User 9823972748
  {
    unique_identifier: '9823972748',
    fi_type: 'EQUITIES',
    total_fi_data: 4,
    total_fi_data_to_be_fetched: 0,
    last_fetch_date: new Date().toISOString(),
    current_balance: null,
    current_value: 550045.00,
    cost_value: 458650.00,
    total_holdings: 4,
    total_brokers: 2,
    data_source_details: [{ dataResourceType: 'AA', lastFetchDate: new Date().toISOString() }]
  },
  {
    unique_identifier: '9823972748',
    fi_type: 'ETF',
    total_fi_data: 2,
    total_fi_data_to_be_fetched: 0,
    last_fetch_date: new Date().toISOString(),
    current_balance: null,
    current_value: 58975.00,
    cost_value: 52100.00,
    total_holdings: 2,
    total_brokers: 1,
    data_source_details: [{ dataResourceType: 'AA', lastFetchDate: new Date().toISOString() }]
  },
  {
    unique_identifier: '9823972748',
    fi_type: 'MUTUAL_FUNDS',
    total_fi_data: 3,
    total_fi_data_to_be_fetched: 0,
    last_fetch_date: new Date().toISOString(),
    current_balance: null,
    current_value: 318024.60,
    cost_value: 284197.47,
    total_holdings: 3,
    total_brokers: 0,
    data_source_details: [{ dataResourceType: 'AA', lastFetchDate: new Date().toISOString() }]
  },
  {
    unique_identifier: '9823972748',
    fi_type: 'RECURRING_DEPOSIT',
    total_fi_data: 1,
    total_fi_data_to_be_fetched: 0,
    last_fetch_date: new Date().toISOString(),
    current_balance: null,
    current_value: 45000.00,
    cost_value: 45000.00,
    total_holdings: 1,
    total_brokers: 0,
    data_source_details: [{ dataResourceType: 'AA', lastFetchDate: new Date().toISOString() }]
  }
];

// FIPs (Financial Information Providers)
const fipsData = [
  {
    fip_id: 'HDFC-FIP',
    fip_name: 'HDFC Bank',
    fi_types: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT'],
    enabled: true,
    logo_url: 'https://logo.clearbit.com/hdfcbank.com',
    bank_type: 'BANK',
    category: 'Private Sector Bank',
    website: 'https://www.hdfcbank.com',
    support_email: 'support@hdfcbank.com',
    support_phone: '1800-22-1006'
  },
  {
    fip_id: 'ICICI-FIP',
    fip_name: 'ICICI Bank',
    fi_types: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'MUTUAL_FUNDS'],
    enabled: true,
    logo_url: 'https://logo.clearbit.com/icicibank.com',
    bank_type: 'BANK',
    category: 'Private Sector Bank',
    website: 'https://www.icicibank.com',
    support_email: 'support@icicibank.com',
    support_phone: '1800-200-3344'
  },
  {
    fip_id: 'SBI-FIP',
    fip_name: 'State Bank of India',
    fi_types: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'NPS'],
    enabled: true,
    logo_url: 'https://logo.clearbit.com/sbi.co.in',
    bank_type: 'BANK',
    category: 'Public Sector Bank',
    website: 'https://www.sbi.co.in',
    support_email: 'support@sbi.co.in',
    support_phone: '1800-11-2211'
  },
  {
    fip_id: 'CAMS-FIP',
    fip_name: 'CAMS',
    fi_types: ['MUTUAL_FUNDS'],
    enabled: true,
    logo_url: 'https://logo.clearbit.com/camsonline.com',
    bank_type: 'REGISTRAR',
    category: 'Mutual Fund Registrar',
    website: 'https://www.camsonline.com',
    support_email: 'support@camsonline.com',
    support_phone: '1800-419-2267'
  },
  {
    fip_id: 'KFINTECH-FIP',
    fip_name: 'KFintech',
    fi_types: ['MUTUAL_FUNDS'],
    enabled: true,
    logo_url: 'https://logo.clearbit.com/kfintech.com',
    bank_type: 'REGISTRAR',
    category: 'Mutual Fund Registrar',
    website: 'https://www.kfintech.com',
    support_email: 'support@kfintech.com',
    support_phone: '1800-309-4001'
  },
  {
    fip_id: 'CDSL-FIP',
    fip_name: 'CDSL Depository',
    fi_types: ['EQUITIES', 'ETF'],
    enabled: true,
    logo_url: 'https://logo.clearbit.com/cdslindia.com',
    bank_type: 'DEPOSITORY',
    category: 'Securities Depository',
    website: 'https://www.cdslindia.com',
    support_email: 'helpdesk@cdslindia.com',
    support_phone: '1800-200-5533'
  },
  {
    fip_id: 'NSDL-FIP',
    fip_name: 'NSDL Depository',
    fi_types: ['EQUITIES', 'ETF'],
    enabled: true,
    logo_url: 'https://logo.clearbit.com/nsdl.co.in',
    bank_type: 'DEPOSITORY',
    category: 'Securities Depository',
    website: 'https://www.nsdl.co.in',
    support_email: 'info@nsdl.co.in',
    support_phone: '1800-22-7100'
  }
];

// Brokers
const brokersData = [
  {
    broker_id: 'ZERODHA',
    broker_name: 'Zerodha',
    broker_code: 'ZRD',
    enabled: true,
    logo_url: 'https://logo.clearbit.com/zerodha.com',
    broker_type: 'DISCOUNT',
    supported_assets: ['EQUITIES', 'ETF', 'MUTUAL_FUNDS'],
    sebi_reg_no: 'INZ000031633',
    exchanges: ['NSE', 'BSE'],
    website: 'https://zerodha.com',
    support_email: 'support@zerodha.com',
    support_phone: '080-47181888'
  },
  {
    broker_id: 'GROWW',
    broker_name: 'Groww',
    broker_code: 'GRW',
    enabled: true,
    logo_url: 'https://logo.clearbit.com/groww.in',
    broker_type: 'DISCOUNT',
    supported_assets: ['EQUITIES', 'ETF', 'MUTUAL_FUNDS'],
    sebi_reg_no: 'INZ000186937',
    exchanges: ['NSE', 'BSE'],
    website: 'https://groww.in',
    support_email: 'support@groww.in',
    support_phone: '080-46042552'
  },
  {
    broker_id: 'ICICI_DIRECT',
    broker_name: 'ICICI Direct',
    broker_code: 'ICID',
    enabled: true,
    logo_url: 'https://logo.clearbit.com/icicidirect.com',
    broker_type: 'FULL_SERVICE',
    supported_assets: ['EQUITIES', 'ETF', 'MUTUAL_FUNDS', 'BONDS'],
    sebi_reg_no: 'INZ000183631',
    exchanges: ['NSE', 'BSE', 'MCX'],
    website: 'https://www.icicidirect.com',
    support_email: 'helpdesk@icicidirect.com',
    support_phone: '1800-102-1234'
  },
  {
    broker_id: 'ANGEL_ONE',
    broker_name: 'Angel One',
    broker_code: 'ANGL',
    enabled: true,
    logo_url: 'https://logo.clearbit.com/angelone.in',
    broker_type: 'DISCOUNT',
    supported_assets: ['EQUITIES', 'ETF', 'MUTUAL_FUNDS', 'COMMODITIES'],
    sebi_reg_no: 'INZ000161534',
    exchanges: ['NSE', 'BSE', 'MCX'],
    website: 'https://www.angelone.in',
    support_email: 'support@angelone.in',
    support_phone: '080-47480048'
  }
];

// Linked Accounts (generic structure)
const linkedAccountsData = [
  // Deposit accounts for user 8956545791
  {
    unique_identifier: '8956545791',
    fi_data_id: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
    account_ref_number: 'ACC001234567890',
    masked_acc_number: 'XXXX1234',
    account_name: 'Savings Account',
    account_type: 'DEPOSIT',
    fip_id: 'HDFC-FIP',
    fip_name: 'HDFC Bank',
    data_fetched: true,
    last_fetch_datetime: new Date().toISOString(),
    latest_consent_purpose_text: 'For personal financial management',
    latest_consent_expiry_time: '2025-12-31T23:59:59Z',
    consent_purpose_version: 'V1.0'
  },
  {
    unique_identifier: '8956545791',
    fi_data_id: 'b986d95d-709e-45a7-8548-39814173ec9c',
    account_ref_number: 'ACC009876543210',
    masked_acc_number: 'XXXX5678',
    account_name: 'Salary Account',
    account_type: 'DEPOSIT',
    fip_id: 'ICICI-FIP',
    fip_name: 'ICICI Bank',
    data_fetched: true,
    last_fetch_datetime: new Date().toISOString(),
    latest_consent_purpose_text: 'For personal financial management',
    latest_consent_expiry_time: '2025-12-31T23:59:59Z',
    consent_purpose_version: 'V1.0'
  },
  // Term deposit for user 8956545791
  {
    unique_identifier: '8956545791',
    fi_data_id: '037f5d5e-495b-484d-84f8-dba76a14d6b1',
    account_ref_number: 'TD001234567',
    masked_acc_number: 'XXXX7890',
    account_name: 'Fixed Deposit',
    account_type: 'TERM_DEPOSIT',
    fip_id: 'HDFC-FIP',
    fip_name: 'HDFC Bank',
    data_fetched: true,
    last_fetch_datetime: new Date().toISOString(),
    latest_consent_purpose_text: 'For personal financial management',
    latest_consent_expiry_time: '2025-12-31T23:59:59Z',
    consent_purpose_version: 'V1.0'
  },
  // Recurring deposit for user 8956545791
  {
    unique_identifier: '8956545791',
    fi_data_id: '4a81e8e8-928b-4b1f-b226-946f8dc3b1d9',
    account_ref_number: 'RD001234567',
    masked_acc_number: 'XXXX1111',
    account_name: 'Recurring Deposit',
    account_type: 'RECURRING_DEPOSIT',
    fip_id: 'HDFC-FIP',
    fip_name: 'HDFC Bank',
    data_fetched: true,
    last_fetch_datetime: new Date().toISOString(),
    latest_consent_purpose_text: 'For personal financial management',
    latest_consent_expiry_time: '2025-12-31T23:59:59Z',
    consent_purpose_version: 'V1.0'
  },
  // Equities for user 9823972748
  {
    unique_identifier: '9823972748',
    fi_data_id: 'eq-demat-001',
    account_ref_number: 'DEMAT001234567',
    masked_acc_number: 'XXXX2222',
    account_name: 'Demat Account',
    account_type: 'EQUITIES',
    fip_id: 'CDSL-FIP',
    fip_name: 'CDSL Depository',
    data_fetched: true,
    last_fetch_datetime: new Date().toISOString(),
    latest_consent_purpose_text: 'For investment tracking',
    latest_consent_expiry_time: '2025-12-31T23:59:59Z',
    consent_purpose_version: 'V1.0'
  }
];

// Deposit Accounts (extended details)
const depositAccountsData = [
  {
    unique_identifier: '8956545791',
    fi_data_id: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
    current_balance: 125678.50,
    available_balance: 125000.00,
    account_status: 'ACTIVE',
    ifsc_code: 'HDFC0001234',
    micr_code: '400240012',
    branch: 'Mumbai - Andheri West'
  },
  {
    unique_identifier: '8956545791',
    fi_data_id: 'b986d95d-709e-45a7-8548-39814173ec9c',
    current_balance: 89456.75,
    available_balance: 89000.00,
    account_status: 'ACTIVE',
    ifsc_code: 'ICIC0005678',
    micr_code: '400229015',
    branch: 'Mumbai - Bandra'
  }
];

// Deposit Transactions
const depositTransactionsData = [
  {
    unique_identifier: '8956545791',
    account_id: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
    txn_id: 'TXN-DEP-001',
    amount: 50000.00,
    narration: 'Salary Credit - Dec 2024',
    type: 'CREDIT',
    mode: 'NEFT',
    balance: 125678.50,
    transaction_datetime: '2024-12-01T10:30:00Z',
    value_date: '2024-12-01',
    reference: 'NEFT-REF-001234'
  },
  {
    unique_identifier: '8956545791',
    account_id: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
    txn_id: 'TXN-DEP-002',
    amount: 5000.00,
    narration: 'ATM Withdrawal',
    type: 'DEBIT',
    mode: 'ATM',
    balance: 120678.50,
    transaction_datetime: '2024-12-05T14:20:00Z',
    value_date: '2024-12-05',
    reference: 'ATM-WDL-5678'
  },
  {
    unique_identifier: '8956545791',
    account_id: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
    txn_id: 'TXN-DEP-003',
    amount: 15000.00,
    narration: 'UPI/john@upi/Payment',
    type: 'DEBIT',
    mode: 'UPI',
    balance: 105678.50,
    transaction_datetime: '2024-12-10T09:15:00Z',
    value_date: '2024-12-10',
    reference: 'UPI-REF-9012'
  }
];

// Term Deposits
const termDepositsData = [
  {
    unique_identifier: '8956545791',
    fi_data_id: '037f5d5e-495b-484d-84f8-dba76a14d6b1',
    fip_id: 'HDFC-FIP',
    fip_name: 'HDFC Bank',
    deposit_type: 'FIXED_DEPOSIT',
    principal_amount: 500000.00,
    maturity_amount: 556750.00,
    current_value: 540000.00,
    interest_rate: 7.25,
    interest_payout_frequency: 'ON_MATURITY',
    tenure_months: 24,
    opening_date: '2023-06-15',
    maturity_date: '2025-06-15',
    account_status: 'ACTIVE'
  }
];

// Recurring Deposits
const recurringDepositsData = [
  {
    unique_identifier: '8956545791',
    fi_data_id: '4a81e8e8-928b-4b1f-b226-946f8dc3b1d9',
    fip_id: 'HDFC-FIP',
    fip_name: 'HDFC Bank',
    monthly_deposit: 10000.00,
    interest_rate: 6.75,
    tenure_months: 36,
    opening_date: '2023-01-10',
    maturity_date: '2026-01-10',
    total_deposits: 240000.00,
    maturity_amount: 275000.00,
    current_value: 185000.00,
    installments_paid: 24,
    total_installments: 36,
    account_status: 'ACTIVE'
  }
];

// Mutual Fund Holdings (holding-folio structure)
const mutualFundHoldingsData = [
  {
    unique_identifier: '8956545791',
    isin: 'INF179K01UT0',
    amfi_code: '100032',
    scheme_code: 'HDFC001',
    amc: 'HDFC Asset Management Company',
    registrar: 'CAMS',
    schema_option: 'GROWTH',
    schema_types: 'EQUITY',
    schema_category: 'Large Cap',
    isin_description: 'HDFC Top 100 Fund - Growth',
    closing_units: 245.678,
    lien_units: 0,
    locking_units: 0,
    nav: 925.45,
    avg_nav: 780.50,
    nav_date: '2024-12-15',
    current_value: 227385.78,
    cost_value: 191757.81,
    prev_details: {
      percentageChange: 1.25,
      priceChange: 2815.45,
      lastFetchTime: new Date(Date.now() - 86400000).toISOString(),
      holdingIsin: 'INF179K01UT0',
      totalUnits: 245.678,
      currentValue: 224570.33
    },
    folios: [
      {
        fipId: 'CAMS-FIP',
        fiDataId: 'mf-folio-001',
        maskedAccNumber: 'XXXX1234',
        accountRefNumber: 'FOLIO001234',
        currentValue: 227385.78,
        folioNo: 'FOLIO001234',
        closingUnits: 245.678,
        lienUnits: 0,
        nav: 925.45,
        navDate: '2024-12-15',
        lockingUnits: 0,
        lastFetchTime: new Date().toISOString()
      }
    ],
    last_fetch_time: new Date().toISOString()
  },
  {
    unique_identifier: '9823972748',
    isin: 'INF846K01DP8',
    amfi_code: '100091',
    scheme_code: 'AXIS003',
    amc: 'Axis Asset Management Company',
    registrar: 'KFINTECH',
    schema_option: 'GROWTH',
    schema_types: 'EQUITY',
    schema_category: 'Mid Cap',
    isin_description: 'Axis Midcap Fund - Growth',
    closing_units: 1234.567,
    lien_units: 0,
    locking_units: 0,
    nav: 95.60,
    avg_nav: 68.20,
    nav_date: '2024-12-15',
    current_value: 118024.60,
    cost_value: 84197.47,
    prev_details: {
      percentageChange: 0.85,
      priceChange: 998.21,
      lastFetchTime: new Date(Date.now() - 86400000).toISOString(),
      holdingIsin: 'INF846K01DP8',
      totalUnits: 1234.567,
      currentValue: 117026.39
    },
    folios: [
      {
        fipId: 'KFINTECH-FIP',
        fiDataId: 'mf-folio-002',
        maskedAccNumber: 'XXXX5678',
        accountRefNumber: 'FOLIO005678',
        currentValue: 118024.60,
        folioNo: 'FOLIO005678',
        closingUnits: 1234.567,
        lienUnits: 0,
        nav: 95.60,
        navDate: '2024-12-15',
        lockingUnits: 0,
        lastFetchTime: new Date().toISOString()
      }
    ],
    last_fetch_time: new Date().toISOString()
  }
];

// Mutual Fund Transactions
const mutualFundTransactionsData = [
  {
    unique_identifier: '8956545791',
    account_id: 'mf-folio-001',
    txn_id: 'MF-TXN-001',
    isin: 'INF179K01UT0',
    isin_description: 'HDFC Top 100 Fund - Growth',
    amc: 'HDFC AMC',
    amfi_code: '100032',
    registrar: 'CAMS',
    folio_no: 'FOLIO001234',
    transaction_datetime: '2024-11-15T10:00:00Z',
    type: 'PURCHASE',
    mode: 'SIP',
    narration: 'SIP Purchase - November 2024',
    units: 12.345,
    amount: 10000.00,
    nav: 810.20,
    nav_date: '2024-11-15',
    stt_tax: 1.50,
    stamp_duty: 0.50,
    txn_charge: 0,
    data_source: 'AA'
  },
  {
    unique_identifier: '7008281184',
    account_id: 'mf-folio-003',
    txn_id: 'MF-TXN-002',
    isin: 'INF090I01JG2',
    isin_description: 'ICICI Prudential Bluechip Fund - Growth',
    amc: 'ICICI Prudential AMC',
    amfi_code: '100053',
    registrar: 'CAMS',
    folio_no: 'FOLIO009999',
    transaction_datetime: '2024-10-20T11:30:00Z',
    type: 'PURCHASE',
    mode: 'LUMPSUM',
    narration: 'Lumpsum Investment',
    units: 523.456,
    amount: 50000.00,
    nav: 95.50,
    nav_date: '2024-10-20',
    stt_tax: 7.50,
    stamp_duty: 2.50,
    txn_charge: 0,
    data_source: 'MFC'
  }
];

// Mutual Fund Insights
const mutualFundInsightsData = [
  {
    unique_identifier: '9823972748',
    pan: 'ABCDE1234F',
    mobile: '9823972748',
    total_holdings: 3,
    current_value: 318024.60,
    invested_value: 284197.47,
    absolute_return: 33827.13,
    absolute_return_percentage: 11.90,
    xirr: 15.5,
    daily_returns: 2150.25,
    daily_returns_percent: 0.68,
    category_distribution: [
      { category: 'EQUITY', totalFunds: 2, totalCurrentValue: 268024.60, percentage: 84.3 },
      { category: 'DEBT', totalFunds: 1, totalCurrentValue: 50000.00, percentage: 15.7 }
    ],
    sub_category_distribution: [
      { subCategory: 'Large Cap', totalFunds: 1, totalCurrentValue: 150000.00, percentage: 47.2 },
      { subCategory: 'Mid Cap', totalFunds: 1, totalCurrentValue: 118024.60, percentage: 37.1 },
      { subCategory: 'Short Duration', totalFunds: 1, totalCurrentValue: 50000.00, percentage: 15.7 }
    ],
    market_cap_distribution: [
      { marketCap: 'Large Cap', totalFunds: 1, totalCurrentValue: 150000.00, percentage: 47.2 },
      { marketCap: 'Mid Cap', totalFunds: 1, totalCurrentValue: 118024.60, percentage: 37.1 },
      { marketCap: 'N/A', totalFunds: 1, totalCurrentValue: 50000.00, percentage: 15.7 }
    ],
    amc_distribution: [
      { amc: 'Axis AMC', totalFunds: 1, totalCurrentValue: 118024.60, percentage: 37.1 },
      { amc: 'HDFC AMC', totalFunds: 1, totalCurrentValue: 150000.00, percentage: 47.2 },
      { amc: 'SBI MF', totalFunds: 1, totalCurrentValue: 50000.00, percentage: 15.7 }
    ]
  }
];

// Equities Holdings (holding-broker structure)
const equitiesHoldingsData = [
  {
    unique_identifier: '9823972748',
    isin: 'INE002A01018',
    issuer_name: 'Reliance Industries Limited',
    isin_description: 'RELIANCE',
    units: 50,
    last_traded_price: 2456.75,
    avg_traded_price: 2100.50,
    current_value: 122837.50,
    portfolio_weightage_percent: 22.3,
    prev_details: {
      percentageChange: 1.5,
      priceChange: 1825.00,
      lastFetchTime: new Date(Date.now() - 86400000).toISOString(),
      holdingIsin: 'INE002A01018',
      totalUnits: 50,
      currentValue: 121012.50
    },
    brokers: [
      {
        brokerName: 'Zerodha',
        brokerId: 'ZERODHA',
        units: 50,
        lastTradedPrice: 2456.75,
        avgTradedPrice: 2100.50,
        currentValue: 122837.50,
        lastFetchTime: new Date().toISOString()
      }
    ],
    last_fetch_time: new Date().toISOString()
  },
  {
    unique_identifier: '9823972748',
    isin: 'INE009A01021',
    issuer_name: 'Infosys Limited',
    isin_description: 'INFY',
    units: 100,
    last_traded_price: 1890.25,
    avg_traded_price: 1650.00,
    current_value: 189025.00,
    portfolio_weightage_percent: 34.4,
    prev_details: {
      percentageChange: 0.85,
      priceChange: 1598.75,
      lastFetchTime: new Date(Date.now() - 86400000).toISOString(),
      holdingIsin: 'INE009A01021',
      totalUnits: 100,
      currentValue: 187426.25
    },
    brokers: [
      {
        brokerName: 'Groww',
        brokerId: 'GROWW',
        units: 100,
        lastTradedPrice: 1890.25,
        avgTradedPrice: 1650.00,
        currentValue: 189025.00,
        lastFetchTime: new Date().toISOString()
      }
    ],
    last_fetch_time: new Date().toISOString()
  },
  {
    unique_identifier: '9823972748',
    isin: 'INE040A01034',
    issuer_name: 'HDFC Bank Limited',
    isin_description: 'HDFCBANK',
    units: 75,
    last_traded_price: 1756.80,
    avg_traded_price: 1500.00,
    current_value: 131760.00,
    portfolio_weightage_percent: 23.9,
    prev_details: {
      percentageChange: -0.45,
      priceChange: -595.50,
      lastFetchTime: new Date(Date.now() - 86400000).toISOString(),
      holdingIsin: 'INE040A01034',
      totalUnits: 75,
      currentValue: 132355.50
    },
    brokers: [
      {
        brokerName: 'Zerodha',
        brokerId: 'ZERODHA',
        units: 75,
        lastTradedPrice: 1756.80,
        avgTradedPrice: 1500.00,
        currentValue: 131760.00,
        lastFetchTime: new Date().toISOString()
      }
    ],
    last_fetch_time: new Date().toISOString()
  },
  {
    unique_identifier: '9823972748',
    isin: 'INE062A01020',
    issuer_name: 'Tata Consultancy Services Limited',
    isin_description: 'TCS',
    units: 25,
    last_traded_price: 4256.90,
    avg_traded_price: 3800.00,
    current_value: 106422.50,
    portfolio_weightage_percent: 19.4,
    prev_details: {
      percentageChange: 0.92,
      priceChange: 972.50,
      lastFetchTime: new Date(Date.now() - 86400000).toISOString(),
      holdingIsin: 'INE062A01020',
      totalUnits: 25,
      currentValue: 105450.00
    },
    brokers: [
      {
        brokerName: 'Groww',
        brokerId: 'GROWW',
        units: 25,
        lastTradedPrice: 4256.90,
        avgTradedPrice: 3800.00,
        currentValue: 106422.50,
        lastFetchTime: new Date().toISOString()
      }
    ],
    last_fetch_time: new Date().toISOString()
  }
];

// ETF Holdings
const etfHoldingsData = [
  {
    unique_identifier: '9823972748',
    isin: 'INF204KB14I2',
    issuer_name: 'Nippon India ETF Nifty BeES',
    isin_description: 'NIFTYBEES',
    units: 200,
    last_traded_price: 265.50,
    avg_traded_price: 235.00,
    current_value: 53100.00,
    nav: 265.30,
    nav_date: '2024-12-15',
    portfolio_weightage_percent: 90.0,
    prev_details: {
      percentageChange: 0.75,
      priceChange: 396.00,
      lastFetchTime: new Date(Date.now() - 86400000).toISOString(),
      holdingIsin: 'INF204KB14I2',
      totalUnits: 200,
      currentValue: 52704.00
    },
    brokers: [
      {
        brokerName: 'Zerodha',
        brokerId: 'ZERODHA',
        units: 200,
        lastTradedPrice: 265.50,
        currentValue: 53100.00
      }
    ],
    last_fetch_time: new Date().toISOString()
  },
  {
    unique_identifier: '9823972748',
    isin: 'INF204KB17I5',
    issuer_name: 'Nippon India ETF Gold BeES',
    isin_description: 'GOLDBEES',
    units: 100,
    last_traded_price: 58.75,
    avg_traded_price: 52.00,
    current_value: 5875.00,
    nav: 58.70,
    nav_date: '2024-12-15',
    portfolio_weightage_percent: 10.0,
    prev_details: {
      percentageChange: 0.25,
      priceChange: 14.75,
      lastFetchTime: new Date(Date.now() - 86400000).toISOString(),
      holdingIsin: 'INF204KB17I5',
      totalUnits: 100,
      currentValue: 5860.25
    },
    brokers: [
      {
        brokerName: 'Zerodha',
        brokerId: 'ZERODHA',
        units: 100,
        lastTradedPrice: 58.75,
        currentValue: 5875.00
      }
    ],
    last_fetch_time: new Date().toISOString()
  }
];

// ETF Insights
const etfInsightsData = [
  {
    unique_identifier: '9823972748',
    current_value: 58975.00,
    total_holdings: 2,
    total_demats: 1,
    returns_summary: {
      dailyReturns: 410.75,
      dailyReturnsPercentage: 0.70
    },
    demat_wise_distribution: [
      {
        dematId: 'DEMAT-001',
        brokerName: 'Zerodha',
        brokerCode: 'ZRD',
        totalHoldings: 2,
        currentValue: 58975.00,
        dematValuePercentage: 100,
        returnsSummary: { dailyReturns: 410.75, dailyReturnsPercentage: 0.70 },
        holdingsInsights: [
          { schemeName: 'Nippon India ETF Nifty BeES', isin: 'INF204KB14I2', currentValue: 53100.00, totalUnits: 200, currentNAV: 265.30 },
          { schemeName: 'Nippon India ETF Gold BeES', isin: 'INF204KB17I5', currentValue: 5875.00, totalUnits: 100, currentNAV: 58.70 }
        ]
      }
    ]
  }
];

// NPS Accounts
const npsAccountsData = [
  {
    unique_identifier: '8956545791',
    fi_data_id: 'nps-001-uuid',
    fip_id: 'SBI-FIP',
    fip_name: 'SBI Pension Fund',
    masked_pran_id: 'XXXX1234567890',
    holder_pran_id: 'PRAN1234567890',
    holder_name: 'Test User One',
    holder_dob: '1985-05-15',
    holder_mobile: '8956545791',
    holder_email: 'test.user1@example.com',
    holder_pan: 'IJFGF4579B',
    holder_ckyc_compliance: true,
    account_current_value: 567890.50
  }
];

// Account Consents
const accountConsentsData = [
  {
    unique_identifier: '8956545791',
    account_id: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
    consent_id: 'consent-001-uuid',
    consent_handle: 'HANDLE001',
    consent_status: 'ACTIVE',
    fip_id: 'HDFC-FIP',
    fi_types: ['DEPOSIT', 'TERM_DEPOSIT'],
    consent_start: '2024-01-01T00:00:00Z',
    consent_expiry: '2025-12-31T23:59:59Z',
    fetch_type: 'PERIODIC',
    frequency_unit: 'MONTH',
    frequency_value: 1,
    data_life_unit: 'YEAR',
    data_life_value: 5,
    purpose_code: 'BANK_STATEMENT_PERIODIC',
    purpose_text: 'For personal financial management'
  },
  {
    unique_identifier: '9823972748',
    account_id: 'eq-demat-001',
    consent_id: 'consent-002-uuid',
    consent_handle: 'HANDLE002',
    consent_status: 'ACTIVE',
    fip_id: 'CDSL-FIP',
    fi_types: ['EQUITIES', 'ETF'],
    consent_start: '2024-03-15T00:00:00Z',
    consent_expiry: '2025-03-14T23:59:59Z',
    fetch_type: 'PERIODIC',
    frequency_unit: 'WEEK',
    frequency_value: 1,
    data_life_unit: 'YEAR',
    data_life_value: 2,
    purpose_code: 'INVESTMENT_TRACKING',
    purpose_text: 'For equity and ETF portfolio management'
  }
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedTable(tableName: string, data: any[]) {
  console.log(`\n🌱 Seeding ${tableName}...`);
  
  if (data.length === 0) {
    console.log(`   ⚠️ No data to seed for ${tableName}`);
    return true;
  }
  
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select();
  
  if (error) {
    console.error(`❌ Error seeding ${tableName}:`, error.message);
    return false;
  }
  
  console.log(`✅ Seeded ${result?.length || 0} rows into ${tableName}`);
  return true;
}

async function seedAllData() {
  console.log('🚀 Starting WealthScape Supabase database seeding...\n');
  console.log('📋 Make sure you have run the SQL schema first in Supabase Dashboard!\n');
  
  // Seed in order of dependencies
  const results = {
    users: await seedTable('users', usersData),
    fi_data_summary: await seedTable('fi_data_summary', fiDataSummaryData),
    fips: await seedTable('fips', fipsData),
    brokers: await seedTable('brokers', brokersData),
    linked_accounts: await seedTable('linked_accounts', linkedAccountsData),
    deposit_accounts: await seedTable('deposit_accounts', depositAccountsData),
    deposit_transactions: await seedTable('deposit_transactions', depositTransactionsData),
    term_deposits: await seedTable('term_deposits', termDepositsData),
    recurring_deposits: await seedTable('recurring_deposits', recurringDepositsData),
    mutual_fund_holdings: await seedTable('mutual_fund_holdings', mutualFundHoldingsData),
    mutual_fund_transactions: await seedTable('mutual_fund_transactions', mutualFundTransactionsData),
    mutual_fund_insights: await seedTable('mutual_fund_insights', mutualFundInsightsData),
    equities_holdings: await seedTable('equities_holdings', equitiesHoldingsData),
    etf_holdings: await seedTable('etf_holdings', etfHoldingsData),
    etf_insights: await seedTable('etf_insights', etfInsightsData),
    nps_accounts: await seedTable('nps_accounts', npsAccountsData),
    account_consents: await seedTable('account_consents', accountConsentsData),
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SEED SUMMARY');
  console.log('='.repeat(50));
  
  const successful = Object.entries(results).filter(([_, success]) => success);
  const failed = Object.entries(results).filter(([_, success]) => !success);
  
  console.log(`✅ Successful: ${successful.length} tables`);
  successful.forEach(([table]) => console.log(`   - ${table}`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length} tables`);
    failed.forEach(([table]) => console.log(`   - ${table}`));
    console.log('\n⚠️  Some tables failed. Make sure you ran the SQL schema first!');
    console.log('   Run scripts/supabase-schema.sql in your Supabase SQL Editor.');
  } else {
    console.log('\n✨ All data seeded successfully!');
  }
  
  console.log('\n📝 Test Users Created:');
  console.log('   - 8956545791 (Deposits, Term Deposits, MF, NPS)');
  console.log('   - 9823972748 (Equities, ETF, MF, RD)');
  console.log('   - 9167073512, 7008281184, 9239874560, 9820707135, 6397585098');
}

// Run the seed
seedAllData().catch(console.error);
