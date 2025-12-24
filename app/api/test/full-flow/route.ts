import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { makeAuthenticatedRequest } from '@/lib/finfactor';

const TEST_USER_ID = 'FULL_FLOW_TEST_USER';
const REAL_FINFACTOR_USER = '8956545791';

export async function GET() {
  const results: any[] = [];
  const startTime = Date.now();

  try {
    // =========================================
    // STEP 1: Create User (Layer A)
    // =========================================
    const step1Start = Date.now();
    const { data: user, error: userError } = await supabaseAdmin
      .from('app_users')
      .upsert({
        unique_identifier: TEST_USER_ID,
        phone: '2222222222',
        email: 'fullflow_test@finfactor.com',
        subscription_status: 'ACTIVE',
      }, { onConflict: 'unique_identifier' })
      .select()
      .single();

    results.push({
      step: 1,
      layer: 'A',
      name: 'Create User',
      status: user && !userError ? 'PASS' : 'FAIL',
      time: Date.now() - step1Start,
      data: user ? { userId: user.id } : null,
      error: userError?.message,
    });

    if (!user) throw new Error('User creation failed');

    // =========================================
    // STEP 2: Call Finfactor API
    // =========================================
    const step2Start = Date.now();
    let apiResponse: any = null;
    let apiError: string | null = null;

    try {
      apiResponse = await makeAuthenticatedRequest<any>(
        '/pfm/api/v2/deposit/user-linked-accounts',
        { uniqueIdentifier: REAL_FINFACTOR_USER }
      );
    } catch (e: any) {
      apiError = e.message;
    }

    results.push({
      step: 2,
      layer: 'A',
      name: 'Call Finfactor API',
      status: apiResponse?.fipData ? 'PASS' : 'FAIL',
      time: Date.now() - step2Start,
      data: apiResponse ? {
        totalFiData: apiResponse.totalFiData,
        fipCount: apiResponse.fipData?.length,
      } : null,
      error: apiError,
    });

    // =========================================
    // STEP 3: Log API Call (Audit)
    // =========================================
    const step3Start = Date.now();
    const { data: auditLog, error: auditError } = await supabaseAdmin
      .from('tsp_api_calls')
      .insert({
        user_id: user.id,
        endpoint: '/pfm/api/v2/deposit/user-linked-accounts',
        method: 'POST',
        request_payload: { uniqueIdentifier: REAL_FINFACTOR_USER },
        response_payload: { totalFiData: apiResponse?.totalFiData },
        http_status: 200,
        latency_ms: Date.now() - step2Start,
      })
      .select()
      .single();

    results.push({
      step: 3,
      layer: 'A',
      name: 'Log API Call (Audit Trail)',
      status: auditLog && !auditError ? 'PASS' : 'FAIL',
      time: Date.now() - step3Start,
      data: auditLog ? { auditId: auditLog.id } : null,
      error: auditError?.message,
    });

    // =========================================
    // STEP 4: Store Accounts (Layer B)
    // =========================================
    const step4Start = Date.now();
    let accountsStored = 0;
    let storedAccountIds: string[] = [];

    if (apiResponse?.fipData) {
      for (const fip of apiResponse.fipData) {
        // Upsert FIP
        await supabaseAdmin
          .from('fips')
          .upsert({
            fip_id: fip.fipId,
            fip_name: fip.fipName,
          }, { onConflict: 'fip_id' });

        if (fip.linkedAccounts) {
          for (const acc of fip.linkedAccounts) {
            const { data: storedAcc } = await supabaseAdmin
              .from('fi_accounts')
              .upsert({
                user_id: user.id,
                fi_data_id: acc.fiDataId,
                account_ref_number: acc.accountRefNumber,
                masked_acc_number: acc.maskedAccNumber,
                account_type: acc.accountType || 'SAVINGS',
                fi_type: 'DEPOSIT',
                account_name: acc.holderName,
                fip_id_str: fip.fipId,
                fip_name: fip.fipName,
                data_fetched: acc.dataFetched,
                last_fetch_date_time: acc.lastFetchDateTime,
                is_active: true,
              }, { onConflict: 'fi_data_id' })
              .select()
              .single();

            if (storedAcc) {
              accountsStored++;
              storedAccountIds.push(storedAcc.id);
            }
          }
        }
      }
    }

    results.push({
      step: 4,
      layer: 'B',
      name: 'Store Accounts from API',
      status: accountsStored > 0 ? 'PASS' : 'FAIL',
      time: Date.now() - step4Start,
      data: { accountsStored },
    });

    // =========================================
    // STEP 5: Create Deposit Summaries (Layer C)
    // =========================================
    const step5Start = Date.now();
    let summariesCreated = 0;

    for (const accountId of storedAccountIds.slice(0, 3)) { // Limit to 3 for speed
      const { error } = await supabaseAdmin
        .from('fi_deposit_summaries')
        .upsert({
          account_id: accountId,
          current_balance: Math.random() * 100000 + 10000,
          available_balance: Math.random() * 100000 + 10000,
          interest_rate: 4.5,
          last_fetch_time: new Date().toISOString(),
        }, { onConflict: 'account_id' });

      if (!error) summariesCreated++;
    }

    results.push({
      step: 5,
      layer: 'C',
      name: 'Create Deposit Summaries',
      status: summariesCreated > 0 ? 'PASS' : 'FAIL',
      time: Date.now() - step5Start,
      data: { summariesCreated },
    });

    // =========================================
    // STEP 6: Create Financial Snapshot (Layer C)
    // =========================================
    const step6Start = Date.now();
    const totalValue = accountsStored * 50000; // Estimate

    const { data: snapshot, error: snapError } = await supabaseAdmin
      .from('user_financial_snapshots')
      .insert({
        user_id: user.id,
        total_net_worth: totalValue,
        deposits_value: totalValue,
        total_accounts: accountsStored,
        last_fetch_date: new Date().toISOString(),
        snapshot_at: new Date().toISOString(),
      })
      .select()
      .single();

    results.push({
      step: 6,
      layer: 'C',
      name: 'Create Portfolio Snapshot',
      status: snapshot && !snapError ? 'PASS' : 'FAIL',
      time: Date.now() - step6Start,
      data: snapshot ? {
        totalNetWorth: snapshot.total_net_worth,
        totalAccounts: snapshot.total_accounts,
      } : null,
      error: snapError?.message,
    });

    // =========================================
    // STEP 7: Verify Data Integrity
    // =========================================
    const step7Start = Date.now();
    const { data: verifyAccounts } = await supabaseAdmin
      .from('fi_accounts')
      .select('*')
      .eq('user_id', user.id);

    const { data: verifySummaries } = await supabaseAdmin
      .from('fi_deposit_summaries')
      .select('*')
      .in('account_id', storedAccountIds);

    const { data: verifySnapshot } = await supabaseAdmin
      .from('user_financial_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .single();

    results.push({
      step: 7,
      layer: 'ALL',
      name: 'Verify Data Integrity',
      status: verifyAccounts && verifySummaries && verifySnapshot ? 'PASS' : 'FAIL',
      time: Date.now() - step7Start,
      data: {
        accountsInDB: verifyAccounts?.length || 0,
        summariesInDB: verifySummaries?.length || 0,
        snapshotExists: !!verifySnapshot,
      },
    });

    // =========================================
    // SUMMARY
    // =========================================
    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.length;

    return NextResponse.json({
      testType: 'FULL_FLOW',
      description: 'Complete A → B → C data flow test',
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime,
      summary: { 
        passed, 
        total, 
        status: passed === total ? 'ALL_PASS' : 'PARTIAL',
        dataFlow: 'Finfactor API → Layer A (User/Audit) → Layer B (Accounts) → Layer C (Summaries/Snapshot)'
      },
      tests: results,
    });

  } catch (error: any) {
    return NextResponse.json({
      testType: 'FULL_FLOW',
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
      message: 'Full flow test data cleaned',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'FAILED',
      error: error.message,
    }, { status: 500 });
  }
}

