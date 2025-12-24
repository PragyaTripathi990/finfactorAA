import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const TEST_USER_ID = 'TEST_LAYER_C_USER';

export async function GET() {
  const results: any[] = [];
  const startTime = Date.now();

  try {
    // =========================================
    // SETUP: Create test user and account
    // =========================================
    const { data: testUser } = await supabaseAdmin
      .from('app_users')
      .upsert({
        unique_identifier: TEST_USER_ID,
        phone: '8888888888',
        email: 'layerc@test.com',
      }, { onConflict: 'unique_identifier' })
      .select()
      .single();

    if (!testUser) throw new Error('Failed to create test user');

    const { data: testAccount } = await supabaseAdmin
      .from('fi_accounts')
      .upsert({
        user_id: testUser.id,
        fi_data_id: 'TEST_LAYER_C_ACC',
        account_type: 'SAVINGS',
        fi_type: 'DEPOSIT',
        masked_acc_number: 'XXXX5678',
        is_active: true,
      }, { onConflict: 'fi_data_id' })
      .select()
      .single();

    if (!testAccount) throw new Error('Failed to create test account');

    // =========================================
    // TEST 1: CREATE Deposit Summary
    // =========================================
    const depStart = Date.now();
    const { data: depositSummary, error: depError } = await supabaseAdmin
      .from('fi_deposit_summaries')
      .upsert({
        account_id: testAccount.id,
        current_balance: 125000.50,
        available_balance: 120000.00,
        interest_rate: 4.5,
        opening_date: '2023-01-15',
        branch: 'Mumbai Main Branch',
        ifsc_code: 'TEST0001234',
        last_fetch_time: new Date().toISOString(),
      }, { onConflict: 'account_id' })
      .select()
      .single();

    results.push({
      name: 'CREATE Deposit Summary',
      status: depositSummary && !depError ? 'PASS' : 'FAIL',
      time: Date.now() - depStart,
      data: depositSummary ? { 
        balance: depositSummary.current_balance,
        interest_rate: depositSummary.interest_rate,
      } : null,
      error: depError?.message,
    });

    // =========================================
    // TEST 2: UPDATE Deposit Summary
    // =========================================
    const updateDepStart = Date.now();
    const { data: updatedDep, error: updateDepError } = await supabaseAdmin
      .from('fi_deposit_summaries')
      .update({
        current_balance: 130000.75,
        updated_at: new Date().toISOString(),
      })
      .eq('account_id', testAccount.id)
      .select()
      .single();

    results.push({
      name: 'UPDATE Deposit Summary',
      status: updatedDep?.current_balance === 130000.75 && !updateDepError ? 'PASS' : 'FAIL',
      time: Date.now() - updateDepStart,
      data: updatedDep ? { newBalance: updatedDep.current_balance } : null,
      error: updateDepError?.message,
    });

    // =========================================
    // TEST 3: CREATE Financial Snapshot
    // =========================================
    const snapStart = Date.now();
    const { data: snapshot, error: snapError } = await supabaseAdmin
      .from('user_financial_snapshots')
      .insert({
        user_id: testUser.id,
        total_net_worth: 500000,
        deposits_value: 130000,
        term_deposits_value: 100000,
        mutual_funds_value: 150000,
        equities_value: 120000,
        total_accounts: 5,
        last_fetch_date: new Date().toISOString(),
        snapshot_at: new Date().toISOString(),
      })
      .select()
      .single();

    results.push({
      name: 'CREATE Financial Snapshot',
      status: snapshot && !snapError ? 'PASS' : 'FAIL',
      time: Date.now() - snapStart,
      data: snapshot ? { 
        totalNetWorth: snapshot.total_net_worth,
        breakdown: {
          deposits: snapshot.deposits_value,
          termDeposits: snapshot.term_deposits_value,
          mutualFunds: snapshot.mutual_funds_value,
          equities: snapshot.equities_value,
        }
      } : null,
      error: snapError?.message,
    });

    // =========================================
    // TEST 4: READ Snapshot History
    // =========================================
    const readSnapStart = Date.now();
    const { data: snapshots, error: readSnapError } = await supabaseAdmin
      .from('user_financial_snapshots')
      .select('*')
      .eq('user_id', testUser.id)
      .order('snapshot_at', { ascending: false });

    results.push({
      name: 'READ Snapshot History',
      status: snapshots && snapshots.length > 0 && !readSnapError ? 'PASS' : 'FAIL',
      time: Date.now() - readSnapStart,
      data: { snapshotCount: snapshots?.length || 0 },
      error: readSnapError?.message,
    });

    // =========================================
    // TEST 5: CREATE Deposit Insights
    // =========================================
    const insightStart = Date.now();
    const { data: insight, error: insightError } = await supabaseAdmin
      .from('fi_deposit_insights')
      .insert({
        user_id: testUser.id,
        period_from: '2025-01-01',
        period_to: '2025-12-31',
        frequency: 'MONTHLY',
        balance_avg: 125000,
        balance_min: 50000,
        balance_max: 200000,
        balance_start_of_period: 100000,
        balance_end_of_period: 130000,
        balance_value_change: 30000,
        balance_percent_change: 30.0,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    results.push({
      name: 'CREATE Deposit Insights',
      status: insight && !insightError ? 'PASS' : 'FAIL',
      time: Date.now() - insightStart,
      data: insight ? {
        avgBalance: insight.balance_avg,
        growth: `${insight.balance_percent_change}%`,
      } : null,
      error: insightError?.message,
    });

    // =========================================
    // SUMMARY
    // =========================================
    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.length;

    return NextResponse.json({
      layer: 'C',
      layerName: 'Financial State & Holdings',
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime,
      summary: { passed, total, status: passed === total ? 'ALL_PASS' : 'PARTIAL' },
      tests: results,
    });

  } catch (error: any) {
    return NextResponse.json({
      layer: 'C',
      layerName: 'Financial State & Holdings',
      error: error.message,
      tests: results,
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await supabaseAdmin.from('app_users').delete().eq('unique_identifier', TEST_USER_ID);

    return NextResponse.json({
      status: 'CLEANED',
      message: 'Layer C test data cleaned',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'FAILED',
      error: error.message,
    }, { status: 500 });
  }
}

