import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { makeAuthenticatedRequest } from '@/lib/finfactor';

const TEST_USER_ID = 'TEST_LAYER_B_USER';
const REAL_USER_ID = '8956545791';

export async function GET() {
  const results: any[] = [];
  const startTime = Date.now();

  try {
    // =========================================
    // SETUP: Create test user first
    // =========================================
    const { data: testUser } = await supabaseAdmin
      .from('app_users')
      .upsert({
        unique_identifier: TEST_USER_ID,
        phone: '9999999999',
        email: 'layerb@test.com',
      }, { onConflict: 'unique_identifier' })
      .select()
      .single();

    if (!testUser) throw new Error('Failed to create test user');

    // =========================================
    // TEST 1: FETCH from Finfactor API
    // =========================================
    const fetchStart = Date.now();
    let finfactorData: any = null;
    let finfactorError: string | null = null;

    try {
      finfactorData = await makeAuthenticatedRequest<any>(
        '/pfm/api/v2/deposit/user-linked-accounts',
        { uniqueIdentifier: REAL_USER_ID }
      );
    } catch (e: any) {
      finfactorError = e.message;
    }

    results.push({
      name: 'FETCH Finfactor API',
      status: finfactorData?.totalFiData !== undefined ? 'PASS' : 'FAIL',
      time: Date.now() - fetchStart,
      data: finfactorData ? { 
        totalFiData: finfactorData.totalFiData,
        fipCount: finfactorData.fipData?.length,
      } : null,
      error: finfactorError,
    });

    // =========================================
    // TEST 2: CREATE FIP
    // =========================================
    const fipStart = Date.now();
    const { data: fip, error: fipError } = await supabaseAdmin
      .from('fips')
      .upsert({
        fip_id: 'TEST_FIP_001',
        fip_name: 'Test Bank Ltd.',
        code: 'TESTBANK',
        enable: 'true',
        fi_types: ['DEPOSIT', 'TERM_DEPOSIT'],
      }, { onConflict: 'fip_id' })
      .select()
      .single();

    results.push({
      name: 'CREATE FIP',
      status: fip && !fipError ? 'PASS' : 'FAIL',
      time: Date.now() - fipStart,
      data: fip ? { fip_id: fip.fip_id, fip_name: fip.fip_name } : null,
      error: fipError?.message,
    });

    // =========================================
    // TEST 3: CREATE Account
    // =========================================
    const accStart = Date.now();
    const { data: account, error: accError } = await supabaseAdmin
      .from('fi_accounts')
      .upsert({
        user_id: testUser.id,
        fi_data_id: 'TEST_ACC_001',
        account_ref_number: 'TEST_REF_001',
        masked_acc_number: 'XXXX1234',
        account_type: 'SAVINGS',
        fi_type: 'DEPOSIT',
        account_name: 'Test Savings Account',
        fip_id_str: 'TEST_FIP_001',
        fip_name: 'Test Bank Ltd.',
        data_fetched: true,
        is_active: true,
      }, { onConflict: 'fi_data_id' })
      .select()
      .single();

    results.push({
      name: 'CREATE Account',
      status: account && !accError ? 'PASS' : 'FAIL',
      time: Date.now() - accStart,
      data: account ? { id: account.id, masked_acc_number: account.masked_acc_number } : null,
      error: accError?.message,
    });

    if (!account) throw new Error('Account creation failed');

    // =========================================
    // TEST 4: CREATE Transactions
    // =========================================
    const txnStart = Date.now();
    const transactions = [
      { txn_id: 'TXN001', txn_type: 'CREDIT', amount: 50000, narration: 'Salary', mode: 'NEFT' },
      { txn_id: 'TXN002', txn_type: 'DEBIT', amount: 5000, narration: 'ATM Withdrawal', mode: 'ATM' },
      { txn_id: 'TXN003', txn_type: 'DEBIT', amount: 2500, narration: 'UPI Payment', mode: 'UPI' },
    ];

    const { data: txns, error: txnError } = await supabaseAdmin
      .from('fi_transactions')
      .upsert(
        transactions.map(t => ({
          account_id: account.id,
          txn_id: t.txn_id,
          txn_type: t.txn_type,
          amount: t.amount,
          narration: t.narration,
          mode: t.mode,
          transaction_timestamp: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      )
      .select();

    results.push({
      name: 'CREATE Transactions',
      status: txns && txns.length === 3 && !txnError ? 'PASS' : 'FAIL',
      time: Date.now() - txnStart,
      data: { transactionCount: txns?.length || 0 },
      error: txnError?.message,
    });

    // =========================================
    // TEST 5: READ Accounts
    // =========================================
    const readAccStart = Date.now();
    const { data: accounts, error: readAccError } = await supabaseAdmin
      .from('fi_accounts')
      .select('*')
      .eq('user_id', testUser.id);

    results.push({
      name: 'READ Accounts',
      status: accounts && accounts.length > 0 && !readAccError ? 'PASS' : 'FAIL',
      time: Date.now() - readAccStart,
      data: { accountCount: accounts?.length || 0 },
      error: readAccError?.message,
    });

    // =========================================
    // TEST 6: READ Transactions
    // =========================================
    const readTxnStart = Date.now();
    const { data: readTxns, error: readTxnError } = await supabaseAdmin
      .from('fi_transactions')
      .select('*')
      .eq('account_id', account.id)
      .order('transaction_timestamp', { ascending: false });

    results.push({
      name: 'READ Transactions',
      status: readTxns && readTxns.length > 0 && !readTxnError ? 'PASS' : 'FAIL',
      time: Date.now() - readTxnStart,
      data: { 
        transactionCount: readTxns?.length || 0,
        totalCredit: readTxns?.filter(t => t.txn_type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0),
        totalDebit: readTxns?.filter(t => t.txn_type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0),
      },
      error: readTxnError?.message,
    });

    // =========================================
    // SUMMARY
    // =========================================
    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.length;

    return NextResponse.json({
      layer: 'B',
      layerName: 'Canonical Financial Data',
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime,
      summary: { passed, total, status: passed === total ? 'ALL_PASS' : 'PARTIAL' },
      tests: results,
    });

  } catch (error: any) {
    return NextResponse.json({
      layer: 'B',
      layerName: 'Canonical Financial Data',
      error: error.message,
      tests: results,
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clean up test data
    await supabaseAdmin.from('app_users').delete().eq('unique_identifier', TEST_USER_ID);
    await supabaseAdmin.from('fips').delete().eq('fip_id', 'TEST_FIP_001');

    return NextResponse.json({
      status: 'CLEANED',
      message: 'Layer B test data cleaned',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'FAILED',
      error: error.message,
    }, { status: 500 });
  }
}

