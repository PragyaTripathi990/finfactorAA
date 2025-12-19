import { NextResponse } from 'next/server';
import { 
  getFIPs, 
  getBrokers, 
  getMFHoldingFolio,
  getEquitiesUserLinkedAccounts,
  getETFUserLinkedAccounts,
  getNPSLinkedAccounts,
} from '@/app/actions';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    synced: {},
  };

  // 1. Sync FIPs
  console.log('📦 [1/6] Syncing FIPs...');
  try {
    const fips = await getFIPs();
    results.synced.fips = { success: true, count: Array.isArray(fips) ? fips.length : 0 };
  } catch (e: any) {
    results.synced.fips = { success: false, error: e.message };
  }

  // 2. Sync Brokers  
  console.log('📦 [2/6] Syncing Brokers...');
  try {
    const brokers = await getBrokers();
    results.synced.brokers = { success: true, count: Array.isArray(brokers) ? brokers.length : 0 };
  } catch (e: any) {
    results.synced.brokers = { success: false, error: e.message };
  }

  // 3. Sync MF Holdings
  console.log('📦 [3/6] Syncing MF Holdings...');
  try {
    const mf = await getMFHoldingFolio();
    results.synced.mf_holdings = { success: true, hasData: !!mf };
  } catch (e: any) {
    results.synced.mf_holdings = { success: false, error: e.message };
  }

  // 4. Sync Equity Holdings
  console.log('📦 [4/6] Syncing Equity Holdings...');
  try {
    const equities = await getEquitiesUserLinkedAccounts();
    results.synced.equity_holdings = { success: true, hasData: !!equities };
  } catch (e: any) {
    results.synced.equity_holdings = { success: false, error: e.message };
  }

  // 5. Sync ETF Holdings
  console.log('📦 [5/6] Syncing ETF Holdings...');
  try {
    const etf = await getETFUserLinkedAccounts();
    results.synced.etf_holdings = { success: true, hasData: !!etf };
  } catch (e: any) {
    results.synced.etf_holdings = { success: false, error: e.message };
  }

  // 6. Sync NPS Holdings
  console.log('📦 [6/6] Syncing NPS Holdings...');
  try {
    const nps = await getNPSLinkedAccounts();
    results.synced.nps_holdings = { success: true, hasData: !!nps };
  } catch (e: any) {
    results.synced.nps_holdings = { success: false, error: e.message };
  }

  results.complete = true;
  return NextResponse.json(results);
}

