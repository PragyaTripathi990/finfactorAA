// API Service for Finfactor Account Aggregator
const BASE_URL = process.env.FINFACTOR_BASE_URL || 'https://dhanaprayoga.fiu.finfactor.in';

interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
  };
  message?: string;
}

// In-memory token storage
let authToken: string | null = null;

/**
 * Authenticate with Finfactor API and store the token
 */
export async function authenticate(): Promise<string> {
  // Return cached token if available
  if (authToken) {
    return authToken;
  }

  try {
    const response = await fetch(`${BASE_URL}/pfm/api/v2/user-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: process.env.FINFACTOR_USER_ID || 'pfm@dhanaprayoga',
        password: process.env.FINFACTOR_PASSWORD || '7777',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data: any = await response.json();
    
    // Try multiple possible response structures
    let token: string | null = null;
    
    // Check various possible token locations
    if (data.token) {
      token = data.token;
    } else if (data.data?.token) {
      token = data.data.token;
    } else if (data.data?.data?.token) {
      token = data.data.data.token;
    } else if (data.accessToken) {
      token = data.accessToken;
    } else if (data.data?.accessToken) {
      token = data.data.accessToken;
    } else if (typeof data === 'string') {
      // Sometimes APIs return just the token as a string
      token = data;
    }
    
    if (!token) {
      // Log the actual response for debugging
      console.error('Authentication response structure:', JSON.stringify(data, null, 2));
      throw new Error(`Authentication failed: No token found in response. Response: ${JSON.stringify(data)}`);
    }

    authToken = token;
    return authToken;
  } catch (error) {
    // Reset token on error
    authToken = null;
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Authentication failed: Unknown error occurred');
  }
}

/**
 * Make an authenticated API request
 */
export async function makeAuthenticatedRequest<T>(
  endpoint: string,
  body: Record<string, any>
): Promise<T> {
  try {
    const token = await authenticate();

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // If it's an auth error, reset token and retry once
      if (response.status === 401 || response.status === 403) {
        authToken = null;
        throw new Error(`Authentication expired. Please refresh the page.`);
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    // Get the response as text first
    const responseText = await response.text();
    
    // Try to parse as JSON, if it fails, handle plain text response
    try {
      const data = JSON.parse(responseText);
      return data as T;
    } catch (jsonError) {
      // If response is plain text (like "SUCCESS"), wrap it in an object
      if (responseText) {
        return { 
          success: true, 
          message: responseText,
          data: responseText 
        } as T;
      }
      throw new Error('API returned empty response');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('API request failed: Unknown error occurred');
  }
}

/**
 * Reset authentication (useful for debugging)
 */
export function resetAuth() {
  authToken = null;
}
