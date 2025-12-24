'use server';

import { makeAuthenticatedRequest } from '@/lib/finfactor';

/**
 * Get user details - returns the full data object
 */
export async function getUserDetails(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/user-details',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
    if (response && typeof response === 'object') {
      // If response has success and data
      if (response.success && response.data) {
        return response.data;
      }
      // If response itself is the data
      if (response.data && !response.success) {
        return response.data;
      }
      // If response is directly the data object
      if (!response.success && !response.message) {
        return response;
      }
    }
    
    // If we get here, try to return the response anyway
    return response || {};
  } catch (error) {
    console.error('Error fetching user details:', error);
    // Return empty object instead of throwing to prevent page crash
    return null;
  }
}

/**
 * Delink a user account
 */
export async function delinkAccount(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/user-account-delink',
      {
        uniqueIdentifier: '8956545791',
        accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
      }
    );
    return response;
  } catch (error) {
    console.error('Error delinking account:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Initiate consent request (Plus version) with redirect - returns the URL
 */
export async function initiateConsentPlus(): Promise<string> {
  try {
    // Get the current origin dynamically
    const currentOrigin = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3002';
    
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/submit-consent-request-plus',
      {
        uniqueIdentifier: '8956545791',
        aaCustId: '8956545791@finvu',
        templateName: 'BANK_STATEMENT_PERIODIC',
        userSessionId: 'sessionid123',
        redirectUrl: `${currentOrigin}/callback`,
      }
    );
    
    // Handle different response structures
    let url = null;
    if (response.data?.url) {
      url = response.data.url;
    } else if (response.url) {
      url = response.url;
    } else if (typeof response === 'string') {
      url = response;
    }
    
    if (url) {
      return url;
    }
    
    throw new Error('Failed to get consent URL from response');
  } catch (error) {
    console.error('Error initiating consent plus:', error);
    throw error;
  }
}

/**
 * Submit consent request (V1) - returns the full response object
 */
export async function submitConsentV1(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v1/submit-consent-request',
      {
        uniqueIdentifier: '8956545791',
        templateName: 'BANK_STATEMENT_PERIODIC',
      }
    );
    
    // Handle different response structures
    if (response.data) {
      return response.data;
    }
    
    return response;
  } catch (error) {
    console.error('Error submitting consent V1:', error);
    throw error;
  }
}

/**
 * Get mutual funds data
 */
export async function getMutualFunds(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutualfunds',
      {}
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching mutual funds:', error);
    return null;
  }
}

/**
 * Get FI request user data
 * API returns text/plain response, not JSON
 */
export async function getFIRequestUser(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/firequest-user',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle text/plain response (API returns string, not JSON)
    if (typeof response === 'string') {
      return {
        success: true,
        message: response,
        data: response
      };
    }
    
    // Handle JSON response if API changes
    if (response && typeof response === 'object') {
      if (response.success && response.data) {
        return response.data;
      }
      if (response.data && !response.success) {
        return response.data;
      }
      return response;
    }
    
    return response || null;
  } catch (error) {
    console.error('Error fetching FI request user:', error);
    return null;
  }
}

/**
 * Get FI request account data
 * Dynamically fetches accountId from deposit linked accounts
 * API returns text/plain response, not JSON
 */
export async function getFIRequestAccount(): Promise<any> {
  try {
    // First, get linked accounts to extract accountId
    const linkedAccounts = await getDepositUserLinkedAccounts();
    
    // Extract accountId from linked accounts
    let accountId = '';
    
    if (linkedAccounts) {
      // Check for fipData structure
      if (linkedAccounts.fipData && Array.isArray(linkedAccounts.fipData)) {
        for (const fip of linkedAccounts.fipData) {
          if (fip.linkedAccounts && Array.isArray(fip.linkedAccounts)) {
            const account = fip.linkedAccounts.find((acc: any) => acc.accountRefNumber || acc.fiDataId || acc.accountId);
            if (account?.accountRefNumber) {
              accountId = account.accountRefNumber;
              break;
            } else if (account?.fiDataId) {
              accountId = account.fiDataId;
              break;
            } else if (account?.accountId) {
              accountId = account.accountId;
              break;
            }
          }
        }
      }
      // Check for direct array structure
      else if (Array.isArray(linkedAccounts)) {
        const account = linkedAccounts.find((acc: any) => acc.accountRefNumber || acc.fiDataId || acc.accountId);
        if (account?.accountRefNumber) {
          accountId = account.accountRefNumber;
        } else if (account?.fiDataId) {
          accountId = account.fiDataId;
        } else if (account?.accountId) {
          accountId = account.accountId;
        }
      }
      // Check for direct object with accountId
      else if (linkedAccounts.accountRefNumber) {
        accountId = linkedAccounts.accountRefNumber;
      } else if (linkedAccounts.fiDataId) {
        accountId = linkedAccounts.fiDataId;
      } else if (linkedAccounts.accountId) {
        accountId = linkedAccounts.accountId;
      }
    }
    
    if (!accountId) {
      console.warn('No accountId found in linked accounts, using fallback');
      return null;
    }
    
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/firequest-account',
      {
        uniqueIdentifier: '8956545791',
        accountId: accountId,
      }
    );
    
    // Handle text/plain response (API returns string, not JSON)
    if (typeof response === 'string') {
      return {
        success: true,
        message: response,
        data: response,
        accountId: accountId
      };
    }
    
    // Handle JSON response if API changes
    if (response && typeof response === 'object') {
      if (response.success && response.data) {
        return { ...response.data, accountId };
      }
      if (response.data && !response.success) {
        return { ...response.data, accountId };
      }
      return { ...response, accountId };
    }
    
    return response || null;
  } catch (error) {
    console.error('Error fetching FI request account:', error);
    return null;
  }
}

/**
 * Get FIPs (Financial Information Providers)
 */
export async function getFIPs(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/fips',
      {}
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching FIPs:', error);
    return null;
  }
}

/**
 * Get brokers data
 */
export async function getBrokers(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/brokers',
      {}
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching brokers:', error);
    return null;
  }
}

/**
 * Get NPS user linked accounts
 */
export async function getNPSLinkedAccounts(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/nps/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching NPS linked accounts:', error);
    return null;
  }
}

/**
 * Get account consents latest
 * Dynamically fetches accountId from deposit linked accounts
 */
export async function getAccountConsents(): Promise<any> {
  try {
    // First, get linked accounts to extract accountId
    const linkedAccounts = await getDepositUserLinkedAccounts();
    
    // Extract accountId from linked accounts
    let accountId = '';
    
    if (linkedAccounts) {
      // Check for fipData structure
      if (linkedAccounts.fipData && Array.isArray(linkedAccounts.fipData)) {
        for (const fip of linkedAccounts.fipData) {
          if (fip.linkedAccounts && Array.isArray(fip.linkedAccounts)) {
            const account = fip.linkedAccounts.find((acc: any) => acc.accountRefNumber || acc.fiDataId || acc.accountId);
            if (account?.accountRefNumber) {
              accountId = account.accountRefNumber;
              break;
            } else if (account?.fiDataId) {
              accountId = account.fiDataId;
              break;
            } else if (account?.accountId) {
              accountId = account.accountId;
              break;
            }
          }
        }
      }
      // Check for direct array structure
      else if (Array.isArray(linkedAccounts)) {
        const account = linkedAccounts.find((acc: any) => acc.accountRefNumber || acc.fiDataId || acc.accountId);
        if (account?.accountRefNumber) {
          accountId = account.accountRefNumber;
        } else if (account?.fiDataId) {
          accountId = account.fiDataId;
        } else if (account?.accountId) {
          accountId = account.accountId;
        }
      }
      // Check for direct object with accountId
      else if (linkedAccounts.accountRefNumber) {
        accountId = linkedAccounts.accountRefNumber;
      } else if (linkedAccounts.fiDataId) {
        accountId = linkedAccounts.fiDataId;
      } else if (linkedAccounts.accountId) {
        accountId = linkedAccounts.accountId;
      }
    }
    
    if (!accountId) {
      console.warn('No accountId found in linked accounts, using fallback');
      return null;
    }
    
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/account-consents-latest',
      {
        uniqueIdentifier: '8956545791',
        accountId: accountId,
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching account consents:', error);
    return null;
  }
}

/**
 * Create/Update user subscription
 */
export async function createUserSubscription(data: {
  uniqueIdentifier: string;
  mobileNumber: string;
  subscriptionStatus: string;
  subscriptionStart: string;
  subscriptionEnd: string;
}): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/user-subscriptions',
      data
    );
    return response.data || response;
  } catch (error) {
    console.error('Error creating user subscription:', error);
    return null;
  }
}

/**
 * Term Deposit - Get user linked accounts
 */
export async function getTermDepositLinkedAccounts(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/term-deposit/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching term deposit linked accounts:', error);
    return null;
  }
}

/**
 * Term Deposit - Get user details
 */
export async function getTermDepositUserDetails(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/term-deposit/user-details',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching term deposit user details:', error);
    return null;
  }
}

/**
 * Term Deposit - Get account statement
 * Dynamically fetches accountId from linked accounts
 */
export async function getTermDepositAccountStatement(): Promise<any> {
  try {
    // First, get linked accounts to extract accountId
    const linkedAccounts = await getTermDepositLinkedAccounts();
    
    // Extract accountId from linked accounts
    let accountId = '';
    
    if (linkedAccounts) {
      // Check for fipData structure
      if (linkedAccounts.fipData && Array.isArray(linkedAccounts.fipData)) {
        for (const fip of linkedAccounts.fipData) {
          if (fip.linkedAccounts && Array.isArray(fip.linkedAccounts)) {
            const account = fip.linkedAccounts.find((acc: any) => acc.accountRefNumber || acc.fiDataId || acc.accountId);
            if (account?.accountRefNumber) {
              accountId = account.accountRefNumber;
              break;
            } else if (account?.fiDataId) {
              accountId = account.fiDataId;
              break;
            } else if (account?.accountId) {
              accountId = account.accountId;
              break;
            }
          }
        }
      }
      // Check for direct array structure
      else if (Array.isArray(linkedAccounts)) {
        const account = linkedAccounts.find((acc: any) => acc.accountRefNumber || acc.fiDataId || acc.accountId);
        if (account?.accountRefNumber) {
          accountId = account.accountRefNumber;
        } else if (account?.fiDataId) {
          accountId = account.fiDataId;
        } else if (account?.accountId) {
          accountId = account.accountId;
        }
      }
      // Check for direct object with accountId
      else if (linkedAccounts.accountRefNumber) {
        accountId = linkedAccounts.accountRefNumber;
      } else if (linkedAccounts.fiDataId) {
        accountId = linkedAccounts.fiDataId;
      } else if (linkedAccounts.accountId) {
        accountId = linkedAccounts.accountId;
      }
    }
    
    if (!accountId) {
      console.warn('No accountId found in linked accounts, using fallback');
      return null;
    }
    
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/term-deposit/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: accountId,
        dateRangeFrom: '2020-01-01',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching term deposit account statement:', error);
    return null;
  }
}

/**
 * Recurring Deposit - Get user linked accounts
 */
export async function getRecurringDepositLinkedAccounts(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/recurring-deposit/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching recurring deposit linked accounts:', error);
    return null;
  }
}

/**
 * Recurring Deposit - Get user details
 */
export async function getRecurringDepositUserDetails(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/recurring-deposit/user-details',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching recurring deposit user details:', error);
    return null;
  }
}

/**
 * Recurring Deposit - Get account statement
 * Dynamically fetches accountId from linked accounts
 */
export async function getRecurringDepositAccountStatement(): Promise<any> {
  try {
    // First, get linked accounts to extract accountRefNumber
    const linkedAccounts = await getRecurringDepositLinkedAccounts();
    
    // Extract accountRefNumber from linked accounts
    let accountId = '';
    
    if (linkedAccounts) {
      // Check for fipData structure
      if (linkedAccounts.fipData && Array.isArray(linkedAccounts.fipData)) {
        for (const fip of linkedAccounts.fipData) {
          if (fip.linkedAccounts && Array.isArray(fip.linkedAccounts)) {
            const account = fip.linkedAccounts.find((acc: any) => acc.accountRefNumber);
            if (account?.accountRefNumber) {
              accountId = account.accountRefNumber;
              break;
            }
          }
        }
      }
      // Check for direct array structure
      else if (Array.isArray(linkedAccounts)) {
        const account = linkedAccounts.find((acc: any) => acc.accountRefNumber);
        if (account?.accountRefNumber) {
          accountId = account.accountRefNumber;
        }
      }
      // Check for direct object with accountRefNumber
      else if (linkedAccounts.accountRefNumber) {
        accountId = linkedAccounts.accountRefNumber;
      }
    }
    
    if (!accountId) {
      console.warn('No accountRefNumber found in linked accounts, using fallback');
      return null;
    }
    
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/recurring-deposit/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: accountId,
        dateRangeFrom: '2024-01-01',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching recurring deposit account statement:', error);
    return null;
  }
}

/**
 * Mutual Fund - Get user linked accounts
 */
export async function getMFUserLinkedAccounts(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching MF user linked accounts:', error);
    return null;
  }
}

/**
 * Mutual Fund - Get holding folio
 */
export async function getMFHoldingFolio(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'true',
        filterZeroValueHoldings: 'true',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching MF holding folio:', error);
    return null;
  }
}

/**
 * Mutual Fund - Get user details
 */
export async function getMFUserDetails(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/user-details',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching MF user details:', error);
    return null;
  }
}

/**
 * Mutual Fund - Get account statement
 */
export async function getMFAccountStatement(): Promise<any> {
  try {
    // First, get the MF account ID from linked accounts
    const linkedAccountsResponse = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    let accountId = null;
    
    // Handle different response structures
    let fipData = null;
    if (linkedAccountsResponse?.fipData && Array.isArray(linkedAccountsResponse.fipData) && linkedAccountsResponse.fipData.length > 0) {
      fipData = linkedAccountsResponse.fipData;
    } else if (linkedAccountsResponse?.data?.fipData && Array.isArray(linkedAccountsResponse.data.fipData) && linkedAccountsResponse.data.fipData.length > 0) {
      fipData = linkedAccountsResponse.data.fipData;
    }
    
    // Get accountId from fipData[0].linkedAccounts[0].accountRefNumber
    if (fipData && fipData[0]?.linkedAccounts && Array.isArray(fipData[0].linkedAccounts) && fipData[0].linkedAccounts.length > 0) {
      const firstAccount = fipData[0].linkedAccounts[0];
      accountId = firstAccount.accountRefNumber || firstAccount.fiDataId || firstAccount.accountId;
    }
    
    if (!accountId) {
      console.error('❌ No accountId found from MF linked accounts');
      return null;
    }
    
    console.log('✅ Using accountId for MF account statement:', accountId);
    
    // Now fetch the account statement with the accountId
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: accountId,
        dateRangeFrom: '2025-01-01',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching MF account statement:', error);
    return null;
  }
}

/**
 * Mutual Fund - Get insights
 */
export async function getMFInsights(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/insights',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
    if (response && typeof response === 'object') {
      // If response has success and data
      if (response.success && response.data) {
        return response.data;
      }
      // If response itself is the data
      if (response.data && !response.success) {
        return response.data;
      }
      // If response is directly the data object
      if (!response.success && !response.message) {
        return response;
      }
    }
    
    // If we get here, try to return the response anyway
    return response || null;
  } catch (error) {
    console.error('Error fetching MF insights:', error);
    return null;
  }
}

/**
 * Mutual Fund - Get analysis
 */
export async function getMFAnalysis(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/analysis',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    // Handle different response structures
    if (response && typeof response === 'object') {
      // If response has success and data
      if (response.success && response.data) {
        return response.data;
      }
      // If response itself is the data
      if (response.data && !response.success) {
        return response.data;
      }
      // If response is directly the data object
      if (!response.success && !response.message) {
        return response;
      }
    }
    
    // If we get here, try to return the response anyway
    return response || null;
  } catch (error) {
    console.error('Error fetching MF analysis:', error);
    return null;
  }
}

/**
 * Mutual Fund - MFC Consent Request
 */
export async function getMFCConsentRequest(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/mfc/consent-request',
      {
        uniqueIdentifier: '8956545791',
        pan: 'IJFGF4579B',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching MFC consent request:', error);
    return null;
  }
}

/**
 * Mutual Fund - MFC Consent Approve (requires clientReferenceId and OTP)
 */
export async function getMFCConsentApprove(
  clientReferenceId: string,
  enteredOtp: string,
  uniqueIdentifier: string = '8956545791'
): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/mfc/consent-approve',
      {
        uniqueIdentifier,
        clientReferenceId,
        enteredOtp,
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching MFC consent approve:', error);
    return null;
  }
}

/**
 * ETF - Get user linked accounts
 */
export async function getETFUserLinkedAccounts(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/etf/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching ETF user linked accounts:', error);
    return null;
  }
}

/**
 * ETF - Get insights
 */
export async function getETFInsights(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/etf/insights',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching ETF insights:', error);
    return null;
  }
}

/**
 * Equities - Get user linked accounts
 */
export async function getEquitiesUserLinkedAccounts(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    console.log('📊 Equities User Linked Accounts API Response:', JSON.stringify(response, null, 2));
    console.log('📊 Response type:', typeof response);
    console.log('📊 Is array:', Array.isArray(response));
    console.log('📊 Response keys:', response && typeof response === 'object' && !Array.isArray(response) ? Object.keys(response) : 'N/A');
    console.log('📊 Has fipData:', response?.fipData ? `Yes (${Array.isArray(response.fipData) ? `Array[${response.fipData.length}]` : typeof response.fipData})` : 'No');
    
    // Handle different response structures
    if (response && typeof response === 'object') {
      // If response has fipData, totalFiData, etc. (the structure you showed), return it directly
      if (response.fipData || response.totalFiData !== undefined || response.currentValue !== undefined) {
        console.log('✅ Returning response with fipData structure');
        return response;
      }
      
      if (response.success && response.data) {
        console.log('✅ Returning response.data');
        return response.data;
      }
      if (response.data && !response.success) {
        console.log('✅ Returning response.data (no success flag)');
        return response.data;
      }
      if (!response.success && !response.message) {
        console.log('✅ Returning full response object');
        return response;
      }
    }
    
    console.log('⚠️ Returning response or null:', response ? 'has response' : 'null');
    return response || null;
  } catch (error) {
    console.error('❌ Error fetching equities user linked accounts:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
    }
    return null;
  }
}

/**
 * Equities - Get holding broker
 */
export async function getEquitiesHoldingBroker(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-linked-accounts/holding-broker',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching equities holding broker:', error);
    return null;
  }
}

/**
 * Equities - Get demat holding
 */
export async function getEquitiesDematHolding(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-linked-accounts/demat-holding',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    console.log('📊 Equities Demat Holding API Response:', JSON.stringify(response, null, 2));
    
    // Handle different response structures
    if (response && typeof response === 'object') {
      if (response.success && response.data) {
        console.log('✅ Returning response.data');
        return response.data;
      }
      if (response.data && !response.success) {
        console.log('✅ Returning response.data (no success flag)');
        return response.data;
      }
      if (!response.success && !response.message) {
        console.log('✅ Returning full response object');
        return response;
      }
    }
    
    console.log('⚠️ Returning response or null:', response ? 'has response' : 'null');
    return response || null;
  } catch (error) {
    console.error('❌ Error fetching equities demat holding:', error);
    return null;
  }
}

/**
 * Equities - Get broker holding
 */
export async function getEquitiesBrokerHolding(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-linked-accounts/broker-holding',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    console.log('📊 Equities Broker Holding API Response:', JSON.stringify(response, null, 2));
    console.log('📊 Response type:', typeof response);
    console.log('📊 Is array:', Array.isArray(response));
    console.log('📊 Response keys:', response && typeof response === 'object' && !Array.isArray(response) ? Object.keys(response) : 'N/A');
    console.log('📊 Has brokerData:', response?.brokerData ? `Yes (${Array.isArray(response.brokerData) ? 'Array' : typeof response.brokerData})` : 'No');
    console.log('📊 Has brokers:', response?.brokers ? `Yes (${Array.isArray(response.brokers) ? 'Array' : typeof response.brokers})` : 'No');
    console.log('📊 Has demat:', response?.demat ? `Yes (${Array.isArray(response.demat) ? 'Array' : typeof response.demat})` : 'No');
    
    // Handle different response structures
    if (response && typeof response === 'object') {
      // If it's an array, return it directly
      if (Array.isArray(response)) {
        console.log('✅ Returning array response directly');
        return response;
      }
      
      // Check for nested data structures
      if (response.brokerData && Array.isArray(response.brokerData)) {
        console.log('✅ Returning response.brokerData');
        return response.brokerData;
      }
      
      if (response.fipData && Array.isArray(response.fipData)) {
        console.log('✅ Returning response.fipData');
        return response.fipData;
      }
      
      if (response.data) {
        // If data is an array, return it
        if (Array.isArray(response.data)) {
          console.log('✅ Returning response.data (array)');
          return response.data;
        }
        // If data is an object, check for nested arrays
        if (response.data.brokerData && Array.isArray(response.data.brokerData)) {
          console.log('✅ Returning response.data.brokerData');
          return response.data.brokerData;
        }
        if (response.data.fipData && Array.isArray(response.data.fipData)) {
          console.log('✅ Returning response.data.fipData');
          return response.data.fipData;
        }
        console.log('✅ Returning response.data');
        return response.data;
      }
      
      if (response.success && response.data) {
        console.log('✅ Returning response.data (with success flag)');
        return response.data;
      }
      
      // Return the full response if it's an object with data
      if (!response.success && !response.message) {
        console.log('✅ Returning full response object');
        return response;
      }
    }
    
    console.log('⚠️ Returning response or null:', response ? 'has response' : 'null');
    return response || null;
  } catch (error) {
    console.error('❌ Error fetching equities broker holding:', error);
    return null;
  }
}

/**
 * Equities - Get user details
 */
export async function getEquitiesUserDetails(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-details',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching equities user details:', error);
    return null;
  }
}

/**
 * Equities and ETFs - Get demat holding
 */
export async function getEquitiesETFsDematHolding(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities-and-etfs/user-linked-accounts/demat-holding',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    // Based on Postman response structure:
    // Response is an object with: totalFiData, totalFiDataToBeFetched, totalEquityDematAccounts,
    // totalETFDematAccounts, currentValue, demat (array), prevDetails
    if (response && typeof response === 'object') {
      // Return the full response object (it contains demat array and other metadata)
      return response;
    }
    
    return response || null;
  } catch (error) {
    return null;
  }
}

/**
 * Term Deposit - Get user linked accounts (with filters)
 */
export async function getTermDepositLinkedAccountsFiltered(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/term-deposit/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching term deposit linked accounts (filtered):', error);
    return null;
  }
}

/**
 * Deposit - Get user details
 */
export async function getDepositUserDetails(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/user-details',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching deposit user details:', error);
    return null;
  }
}

/**
 * Deposit - Get account statement download
 */
export async function getDepositAccountStatementDownload(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/user-account-statement-download',
      {}
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching deposit account statement download:', error);
    return null;
  }
}

/**
 * Helper function to get accountId from Finvu Bank
 */
async function getFinvuBankAccountId(uniqueIdentifier: string): Promise<string | null> {
  try {
    console.log('🔍 Step 1: Calling user-linked-accounts API...');
    
    // Get linked accounts
    const linkedAccountsResponse = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/user-linked-accounts',
      {
        uniqueIdentifier: uniqueIdentifier,
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    const linkedAccounts = linkedAccountsResponse.data || linkedAccountsResponse;
    
    console.log('📦 Step 2: Received linked accounts response');
    
    if (!linkedAccounts?.fipData || !Array.isArray(linkedAccounts.fipData)) {
      console.error('❌ No fipData found in linked accounts');
      console.log('Full response:', JSON.stringify(linkedAccounts, null, 2));
      return null;
    }
    
    console.log('📋 Available FIPs:', linkedAccounts.fipData.map((fip: any) => fip.fipName));
    
    // Find the first available account in fipData list
    // Look for Finvu first, then fallback to first FIP with accounts
    let targetFip: any = null;
    
    // Try to find Finvu Bank (excluding Dhanagar)
    targetFip = linkedAccounts.fipData.find((fip: any) => {
      const fipName = fip.fipName || '';
      return fipName.includes('Finvu') && !fipName.includes('Dhanagar');
    });
    
    // If Finvu not found, use first FIP with linked accounts
    if (!targetFip) {
      console.log('⚠️ Finvu Bank not found, using first available FIP');
      targetFip = linkedAccounts.fipData.find((fip: any) => 
        fip.linkedAccounts && Array.isArray(fip.linkedAccounts) && fip.linkedAccounts.length > 0
      );
    }
    
    if (!targetFip) {
      console.error('❌ No FIP found with linked accounts');
      return null;
    }
    
    console.log('✅ Step 3: Found FIP:', targetFip.fipName);
    
    if (!targetFip.linkedAccounts || !Array.isArray(targetFip.linkedAccounts) || targetFip.linkedAccounts.length === 0) {
      console.error('❌ FIP has no linked accounts');
      return null;
    }
    
    // Extract accountRefNumber from first account
    const account = targetFip.linkedAccounts[0];
    const targetId = account.accountRefNumber;
    
    console.log('🎯 Step 4: Extracted accountRefNumber:', targetId);
    console.log('📄 Full account object:', JSON.stringify(account, null, 2));
    
    return targetId;
  } catch (error) {
    console.error('❌ Error getting account ID:', error);
    return null;
  }
}

/**
 * Deposit - Get insights
 */
export async function getDepositInsights(): Promise<any> {
  try {
    const uniqueIdentifier = '8956545791';
    
    // Step 1: Get accountId from Finvu Bank using the helper
    const targetId = await getFinvuBankAccountId(uniqueIdentifier);
    
    if (!targetId) {
      console.error('❌ No accountId found from Finvu Bank for insights');
      return null;
    }
    
    console.log('✅ Using accountId for insights:', targetId);
    
    // Step 2: Calculate date range (from 2025-01-01 to today)
    const today = new Date();
    const toDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Step 3: Build request body - MUST use accountIds as ARRAY
    const requestBody = {
      uniqueIdentifier: uniqueIdentifier,
      accountIds: [targetId], // ✅ Array format - crucial!
      from: '2025-01-01',
      to: toDate,
      frequency: 'MONTHLY',
    };
    
    console.log('📤 Insights API Request:', JSON.stringify(requestBody, null, 2));
    
    // Step 4: Make the API call
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/insights',
      requestBody
    );
    
    console.log('📥 Insights API Response:', JSON.stringify(response, null, 2));
    
    // Handle nested response structure
    // API returns: { depositInsights: { accountIds, balance, incoming, outgoing } }
    if (response?.depositInsights) {
      return response.depositInsights;
    }
    
    if (response?.data?.depositInsights) {
      return response.data.depositInsights;
    }
    
    return response.data || response;
  } catch (error) {
    console.error('❌ Error fetching deposit insights:', error);
    return null;
  }
}

/**
 * ETF - Get user account statement
 */
export async function getETFAccountStatement(): Promise<any> {
  try {
    // First, get the ETF account ID from linked accounts
    const linkedAccountsResponse = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/etf/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    let accountId = null;
    const linkedAccounts = linkedAccountsResponse?.fipData?.[0]?.linkedAccounts || linkedAccountsResponse?.data?.fipData?.[0]?.linkedAccounts || [];
    if (linkedAccounts.length > 0) {
      accountId = linkedAccounts[0].fiDataId || linkedAccounts[0].accountId || linkedAccounts[0].accountRefNumber;
    }
    
    // If no accountId found, use the provided one as fallback
    if (!accountId) {
      accountId = 'eff4c543-b06f-4d77-8b89-049898c725a8';
    }
    
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/etf/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: accountId,
        dateRangeFrom: '2020-01-01',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching ETF account statement:', error);
    return null;
  }
}

/**
 * Equities - Get user account statement
 */
export async function getEquitiesAccountStatement(): Promise<any> {
  try {
    // First, get the Equities account ID from linked accounts
    const linkedAccountsResponse = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    let accountId = null;
    
    // Handle different response structures
    let fipData = null;
    if (linkedAccountsResponse?.fipData && Array.isArray(linkedAccountsResponse.fipData) && linkedAccountsResponse.fipData.length > 0) {
      fipData = linkedAccountsResponse.fipData;
    } else if (linkedAccountsResponse?.data?.fipData && Array.isArray(linkedAccountsResponse.data.fipData) && linkedAccountsResponse.data.fipData.length > 0) {
      fipData = linkedAccountsResponse.data.fipData;
    }
    
    // Get accountId from fipData[0].linkedAccounts[0].accountRefNumber or fiDataId
    if (fipData && fipData[0]?.linkedAccounts && Array.isArray(fipData[0].linkedAccounts) && fipData[0].linkedAccounts.length > 0) {
      const firstAccount = fipData[0].linkedAccounts[0];
      accountId = firstAccount.accountRefNumber || firstAccount.fiDataId || firstAccount.accountId;
    }
    
    if (!accountId) {
      console.error('❌ No accountId found from Equities linked accounts');
      return null;
    }
    
    console.log('✅ Using accountId for Equities account statement:', accountId);
    
    // Now fetch the account statement
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: accountId,
        dateRangeFrom: '2020-01-01',
      }
    );
    
    // Handle different response structures
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
    console.error('Error fetching equities account statement:', error);
    return null;
  }
}

/**
 * Equities and ETFs - Get user account statement
 */
export async function getEquitiesETFsAccountStatement(): Promise<any> {
  try {
    // First, get the account ID from linked accounts
    const linkedAccountsResponse = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    
    let accountId = null;
    
    // Handle different response structures
    let fipData = null;
    if (linkedAccountsResponse?.fipData && Array.isArray(linkedAccountsResponse.fipData) && linkedAccountsResponse.fipData.length > 0) {
      fipData = linkedAccountsResponse.fipData;
    } else if (linkedAccountsResponse?.data?.fipData && Array.isArray(linkedAccountsResponse.data.fipData) && linkedAccountsResponse.data.fipData.length > 0) {
      fipData = linkedAccountsResponse.data.fipData;
    }
    
    // Get accountId from fipData[0].linkedAccounts[0].accountRefNumber or fiDataId
    if (fipData && fipData[0]?.linkedAccounts && Array.isArray(fipData[0].linkedAccounts) && fipData[0].linkedAccounts.length > 0) {
      const firstAccount = fipData[0].linkedAccounts[0];
      accountId = firstAccount.accountRefNumber || firstAccount.fiDataId || firstAccount.accountId;
    }
    
    if (!accountId) {
      console.error('❌ No accountId found from Equities linked accounts for ETF statement');
      return null;
    }
    
    console.log('✅ Using accountId for Equities & ETFs account statement:', accountId);
    
    // Now fetch the account statement
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities-and-etfs/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: accountId,
        dateRangeFrom: '2020-01-01',
      }
    );
    
    console.log('📊 Equities & ETFs Account Statement API Response:', JSON.stringify(response, null, 2));
    
    // Handle different response structures
    if (response && typeof response === 'object') {
      if (Array.isArray(response)) {
        console.log('✅ Returning array response directly');
        return response;
      }
      if (response.success && response.data) {
        console.log('✅ Returning response.data');
        return response.data;
      }
      if (response.data && !response.success) {
        console.log('✅ Returning response.data (no success flag)');
        return response.data;
      }
      if (!response.success && !response.message) {
        console.log('✅ Returning full response object');
        return response;
      }
    }
    
    console.log('⚠️ Returning response or null:', response ? 'has response' : 'null');
    return response || null;
  } catch (error) {
    console.error('❌ Error fetching equities and ETFs account statement:', error);
    return null;
  }
}

/**
 * Deposit - Get user account statement
 */
export async function getDepositAccountStatement(): Promise<any> {
  try {
    const uniqueIdentifier = '8956545791';
    
    // Get accountId from Finvu Bank
    const accountId = await getFinvuBankAccountId(uniqueIdentifier);
    
    if (!accountId) {
      console.error('No accountId found from Finvu Bank');
      return null;
    }
    
    // Now fetch the account statement
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/user-account-statement',
      {
        uniqueIdentifier: uniqueIdentifier,
        accountId: accountId,
        dateRangeFrom: '2025-01-01',
      }
    );
    
    // Handle array response directly
    if (Array.isArray(response)) {
      return response;
    }
    
    return response.data || response;
  } catch (error) {
    console.error('Error fetching deposit account statement:', error);
    return null;
  }
}

/**
 * Deposit - Get user linked accounts
 */
export async function getDepositUserLinkedAccounts(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/user-linked-accounts',
      {
        uniqueIdentifier: '8956545791',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching deposit user linked accounts:', error);
    return null;
  }
}
