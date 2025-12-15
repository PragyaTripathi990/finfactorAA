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
 */
export async function getFIRequestUser(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/firequest-user',
      {
        uniqueIdentifier: '9823972748',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching FI request user:', error);
    return null;
  }
}

/**
 * Get FI request account data
 */
export async function getFIRequestAccount(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/firequest-account',
      {
        uniqueIdentifier: '8956545791',
        accountId: 'b986d95d-709e-45a7-8548-39814173ec9c',
      }
    );
    return response.data || response;
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
    return response.data || response;
  } catch (error) {
    console.error('Error fetching NPS linked accounts:', error);
    return null;
  }
}

/**
 * Get account consents latest
 */
export async function getAccountConsents(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/account-consents-latest',
      {
        uniqueIdentifier: '8956545791',
        accountId: 'b986d95d-709e-45a7-8548-39814173ec9c',
      }
    );
    return response.data || response;
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
    return response.data || response;
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
    return response.data || response;
  } catch (error) {
    console.error('Error fetching term deposit user details:', error);
    return null;
  }
}

/**
 * Term Deposit - Get account statement
 */
export async function getTermDepositAccountStatement(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/term-deposit/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: '037f5d5e-495b-484d-84f8-dba76a14d6b1',
        dateRangeFrom: '2023-01-01',
      }
    );
    return response.data || response;
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
    return response.data || response;
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
        uniqueIdentifier: '9823972748',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching recurring deposit user details:', error);
    return null;
  }
}

/**
 * Recurring Deposit - Get account statement
 */
export async function getRecurringDepositAccountStatement(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/recurring-deposit/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: '4a81e8e8-928b-4b1f-b226-946f8dc3b1d9',
        dateRangeFrom: '2020-01-01',
        dateRangeTo: '2025-12-31',
      }
    );
    return response.data || response;
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
    return response.data || response;
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
      }
    );
    return response.data || response;
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
        uniqueIdentifier: '9167073512',
      }
    );
    return response.data || response;
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
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/mutual-fund/user-account-statement',
      {
        uniqueIdentifier: '7008281184',
      }
    );
    return response.data || response;
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
        uniqueIdentifier: '9823972748',
      }
    );
    return response.data || response;
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
        uniqueIdentifier: '9823972748',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    return response.data || response;
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
        uniqueIdentifier: '9823972748',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    return response.data || response;
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
        uniqueIdentifier: '9823972748',
      }
    );
    return response.data || response;
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
        uniqueIdentifier: '9823972748',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching equities user linked accounts:', error);
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
        uniqueIdentifier: '9823972748',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    return response.data || response;
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
        uniqueIdentifier: '9823972748',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching equities demat holding:', error);
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
      {}
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching equities broker holding:', error);
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
        uniqueIdentifier: '9167073512',
      }
    );
    return response.data || response;
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
        uniqueIdentifier: '9823972748',
        filterZeroValueAccounts: 'false',
        filterZeroValueHoldings: 'false',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching equities and ETFs demat holding:', error);
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
 * Deposit - Get insights
 */
export async function getDepositInsights(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/insights',
      {
        uniqueIdentifier: '6397585098',
        accountIds: [],
        from: '2024-07-01',
        to: '2024-08-31',
        frequency: 'MONTHLY',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching deposit insights:', error);
    return null;
  }
}

/**
 * ETF - Get user account statement
 */
export async function getETFAccountStatement(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/etf/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
        dateRangeFrom: '2024-01-01',
      }
    );
    return response.data || response;
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
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities/user-account-statement',
      {
        uniqueIdentifier: '9823972748',
        accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
        dateRangeFrom: '2024-01-01',
      }
    );
    return response.data || response;
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
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/equities-and-etfs/user-account-statement',
      {
        uniqueIdentifier: '9823972748',
        accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
        dateRangeFrom: '2024-01-01',
      }
    );
    return response.data || response;
  } catch (error) {
    console.error('Error fetching equities and ETFs account statement:', error);
    return null;
  }
}

/**
 * Deposit - Get user account statement
 */
export async function getDepositAccountStatement(): Promise<any> {
  try {
    const response = await makeAuthenticatedRequest<any>(
      '/pfm/api/v2/deposit/user-account-statement',
      {
        uniqueIdentifier: '8956545791',
        accountId: '60e38f9b-50da-46b2-bb43-3ddb5b9e63c1',
        dateRangeFrom: '2024-01-01',
      }
    );
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
