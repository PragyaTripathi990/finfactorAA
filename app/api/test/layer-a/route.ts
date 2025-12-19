import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const TEST_USER_ID = 'TEST_LAYER_A_USER';

export async function GET() {
  const results: any[] = [];
  const startTime = Date.now();

  try {
    // =========================================
    // TEST 1: CREATE User
    // =========================================
    const createStart = Date.now();
    const { data: createdUser, error: createError } = await supabaseAdmin
      .from('app_users')
      .upsert({
        unique_identifier: TEST_USER_ID,
        phone: '1111111111',
        email: 'layera_test@finfactor.com',
        subscription_status: 'ACTIVE',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'unique_identifier' })
      .select()
      .single();

    results.push({
      name: 'CREATE User',
      status: createdUser && !createError ? 'PASS' : 'FAIL',
      time: Date.now() - createStart,
      data: createdUser ? { id: createdUser.id, unique_identifier: createdUser.unique_identifier } : null,
      error: createError?.message,
    });

    if (!createdUser) throw new Error('User creation failed');

    // =========================================
    // TEST 2: READ User
    // =========================================
    const readStart = Date.now();
    const { data: readUser, error: readError } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('unique_identifier', TEST_USER_ID)
      .single();

    results.push({
      name: 'READ User',
      status: readUser && !readError ? 'PASS' : 'FAIL',
      time: Date.now() - readStart,
      data: readUser ? { id: readUser.id, subscription_status: readUser.subscription_status } : null,
      error: readError?.message,
    });

    // =========================================
    // TEST 3: UPDATE User
    // =========================================
    const updateStart = Date.now();
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('app_users')
      .update({ 
        subscription_status: 'PREMIUM',
        updated_at: new Date().toISOString(),
      })
      .eq('unique_identifier', TEST_USER_ID)
      .select()
      .single();

    results.push({
      name: 'UPDATE User',
      status: updatedUser?.subscription_status === 'PREMIUM' && !updateError ? 'PASS' : 'FAIL',
      time: Date.now() - updateStart,
      data: updatedUser ? { subscription_status: updatedUser.subscription_status } : null,
      error: updateError?.message,
    });

    // =========================================
    // TEST 4: LOG API Call (Audit Trail)
    // =========================================
    const logStart = Date.now();
    const { data: logData, error: logError } = await supabaseAdmin
      .from('tsp_api_calls')
      .insert({
        user_id: createdUser.id,
        endpoint: '/api/test/layer-a',
        method: 'GET',
        request_payload: { test: true },
        response_payload: { status: 'testing' },
        http_status: 200,
        latency_ms: 100,
      })
      .select()
      .single();

    results.push({
      name: 'CREATE API Log (Audit)',
      status: logData && !logError ? 'PASS' : 'FAIL',
      time: Date.now() - logStart,
      data: logData ? { id: logData.id, endpoint: logData.endpoint } : null,
      error: logError?.message,
    });

    // =========================================
    // TEST 5: READ API Logs
    // =========================================
    const readLogStart = Date.now();
    const { data: logs, error: readLogError } = await supabaseAdmin
      .from('tsp_api_calls')
      .select('*')
      .eq('user_id', createdUser.id)
      .order('called_at', { ascending: false })
      .limit(5);

    results.push({
      name: 'READ API Logs',
      status: logs && logs.length > 0 && !readLogError ? 'PASS' : 'FAIL',
      time: Date.now() - readLogStart,
      data: { logCount: logs?.length || 0 },
      error: readLogError?.message,
    });

    // =========================================
    // SUMMARY
    // =========================================
    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.length;

    return NextResponse.json({
      layer: 'A',
      layerName: 'Flow & Control',
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime,
      summary: { passed, total, status: passed === total ? 'ALL_PASS' : 'PARTIAL' },
      tests: results,
    });

  } catch (error: any) {
    return NextResponse.json({
      layer: 'A',
      layerName: 'Flow & Control',
      error: error.message,
      tests: results,
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clean up test user and cascaded data
    const { error } = await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('unique_identifier', TEST_USER_ID);

    if (error) throw error;

    return NextResponse.json({
      status: 'CLEANED',
      message: `Deleted test user ${TEST_USER_ID} and related data`,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'FAILED',
      error: error.message,
    }, { status: 500 });
  }
}

