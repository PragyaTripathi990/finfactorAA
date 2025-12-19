import { NextRequest, NextResponse } from 'next/server';

const FINFACTOR_BASE_URL = process.env.FINFACTOR_BASE_URL || 'https://dhanaprayoga.fiu.finfactor.in';
const FINFACTOR_USER_ID = process.env.FINFACTOR_USER_ID || 'pfm@dhanaprayoga';
const FINFACTOR_PASSWORD = process.env.FINFACTOR_PASSWORD || '7777';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const response = await fetch(`${FINFACTOR_BASE_URL}/pfm/api/v2/user-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: FINFACTOR_USER_ID,
      password: FINFACTOR_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.token;
  // Token valid for 24 hours, cache for 23 hours
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  
  return cachedToken!;
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint, body } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Get auth token
    const token = await getAuthToken();

    // Call Finfactor API
    const url = `${FINFACTOR_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body || {}),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || `API error: ${response.status}`, details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Finfactor proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Health check and token status
export async function GET() {
  try {
    const token = await getAuthToken();
    return NextResponse.json({
      status: 'OK',
      hasToken: !!token,
      tokenCached: cachedToken !== null,
      baseUrl: FINFACTOR_BASE_URL,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

