'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { camelToTitleCase, formatValue } from '@/lib/formatters';

interface DepositLinkedAccountsDisplayProps {
  data: any;
}

export default function DepositLinkedAccountsDisplay({ data }: DepositLinkedAccountsDisplayProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [expandedFIPs, setExpandedFIPs] = useState<Set<string>>(new Set());

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No deposit linked accounts data available</p>
      </div>
    );
  }

  // Handle the API response structure
  const fipData = data.fipData || [];
  const totalFiData = data.totalFiData || 0;
  const totalFiDataToBeFetched = data.totalFiDataToBeFetched || 0;
  const currentBalance = data.currentBalance || 0;

  // Format currency
  const formatCurrency = (amount: number | string) => {
    if (!amount) return '₹0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString: string | number) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle account expansion
  const toggleAccount = (accountId: string) => {
    const newSet = new Set(expandedAccounts);
    if (newSet.has(accountId)) {
      newSet.delete(accountId);
    } else {
      newSet.add(accountId);
    }
    setExpandedAccounts(newSet);
  };

  // Toggle FIP expansion
  const toggleFIP = (fipId: string) => {
    const newSet = new Set(expandedFIPs);
    if (newSet.has(fipId)) {
      newSet.delete(fipId);
    } else {
      newSet.add(fipId);
    }
    setExpandedFIPs(newSet);
  };

  // Render a field value
  const renderField = (key: string, value: any, level: number = 0) => {
    if (value === null || value === undefined) {
      return (
        <div className="text-dark-textSecondary italic text-sm">—</div>
      );
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <div className="text-dark-textSecondary text-sm">Empty array</div>;
      }
      return (
        <div className="space-y-2">
          {value.map((item, idx) => (
            <div key={idx} className="ml-4 border-l-2 border-accent-primary/30 pl-3">
              {typeof item === 'object' ? (
                <div className="space-y-1">
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k} className="text-sm">
                      <span className="text-dark-textSecondary font-medium">{camelToTitleCase(k)}: </span>
                      <span className="text-dark-text">{renderField(k, v, level + 1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-dark-text text-sm">{String(item)}</div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Handle nested objects
    if (typeof value === 'object') {
      return (
        <div className="ml-4 border-l-2 border-accent-primary/30 pl-3 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="text-dark-textSecondary font-medium">{camelToTitleCase(k)}: </span>
              <span className="text-dark-text">{renderField(k, v, level + 1)}</span>
            </div>
          ))}
        </div>
      );
    }

    // Handle special formatting
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('balance') || lowerKey.includes('amount') || lowerKey.includes('value')) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        return <span className="text-accent-success font-semibold">{formatCurrency(value)}</span>;
      }
    }

    if (lowerKey.includes('date') || lowerKey.includes('time')) {
      return <span className="text-dark-text">{formatDate(value)}</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-danger/20 text-accent-danger'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    return <span className="text-dark-text break-words">{String(value)}</span>;
  };

  // Render all fields of an account
  const renderAccountFields = (account: any, accountId: string) => {
    const isExpanded = expandedAccounts.has(accountId);
    const fields = Object.entries(account);
    
    // Group fields by category for better organization
    const accountFields = fields.filter(([key]) => 
      key.toLowerCase().includes('account') || 
      key.toLowerCase().includes('masked') ||
      key.toLowerCase().includes('ref')
    );
    
    const holderFields = fields.filter(([key]) => 
      key.toLowerCase().includes('holder')
    );
    
    const consentFields = fields.filter(([key]) => 
      key.toLowerCase().includes('consent') || 
      key.toLowerCase().includes('purpose')
    );
    
    const otherFields = fields.filter(([key]) => 
      !accountFields.some(([k]) => k === key) &&
      !holderFields.some(([k]) => k === key) &&
      !consentFields.some(([k]) => k === key)
    );

    return (
      <div className="space-y-4">
        {/* Account Information */}
        {accountFields.length > 0 && (
          <div>
            <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
              <span>🏦</span> Account Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {accountFields.map(([key, value]) => (
                <div key={key} className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                    {camelToTitleCase(key)}
                  </div>
                  <div className="text-sm">
                    {renderField(key, value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Holder Information */}
        {holderFields.length > 0 && (
          <div>
            <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
              <span>👤</span> Account Holder Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {holderFields.map(([key, value]) => (
                <div key={key} className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                    {camelToTitleCase(key)}
                  </div>
                  <div className="text-sm">
                    {renderField(key, value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consent Information */}
        {consentFields.length > 0 && (
          <div>
            <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
              <span>✅</span> Consent Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {consentFields.map(([key, value]) => (
                <div key={key} className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                    {camelToTitleCase(key)}
                  </div>
                  <div className="text-sm">
                    {renderField(key, value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Fields - Show all remaining fields */}
        {otherFields.length > 0 && (
          <div>
            <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
              <span>📋</span> Additional Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherFields.map(([key, value]) => (
                <div key={key} className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                    {camelToTitleCase(key)}
                  </div>
                  <div className="text-sm">
                    {renderField(key, value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw JSON View (Collapsible) */}
        <div>
          <button
            onClick={() => toggleAccount(accountId + '-raw')}
            className="w-full text-left glass-effect rounded-lg p-3 hover:border-accent-primary/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-accent-primary flex items-center gap-2">
                <span>🔍</span> View Raw JSON Data
              </span>
              <span className="text-dark-textSecondary">
                {expandedAccounts.has(accountId + '-raw') ? '▼' : '▶'}
              </span>
            </div>
          </button>
          {expandedAccounts.has(accountId + '-raw') && (
            <div className="mt-2 glass-effect rounded-lg p-4">
              <pre className="text-xs text-dark-text overflow-x-auto">
                {JSON.stringify(account, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-sm text-dark-textSecondary">Total FI Data</p>
              <p className="text-2xl font-bold text-dark-text">{totalFiData}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-warning/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⏳</span>
            <div>
              <p className="text-sm text-dark-textSecondary">To Be Fetched</p>
              <p className="text-2xl font-bold text-dark-text">{totalFiDataToBeFetched}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-success/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💰</span>
            <div>
              <p className="text-sm text-dark-textSecondary">Current Balance</p>
              <p className="text-2xl font-bold gradient-text">{formatCurrency(currentBalance)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FIP Data */}
      {fipData.length === 0 ? (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">No FIP data available</p>
        </div>
      ) : (
        fipData.map((fip: any, fipIdx: number) => {
          const fipId = fip.fipId || `fip-${fipIdx}`;
          const linkedAccounts = fip.linkedAccounts || [];
          const isFIPExpanded = expandedFIPs.has(fipId);

          return (
            <motion.div
              key={fipId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: fipIdx * 0.1 }}
              className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20"
            >
              {/* FIP Header */}
              <div className="mb-4 pb-4 border-b border-dark-border">
                <button
                  onClick={() => toggleFIP(fipId)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏦</span>
                      <div>
                        <h3 className="text-xl font-bold text-dark-text">
                          {fip.fipName || fip.fipId || 'Unknown FIP'}
                        </h3>
                        <p className="text-sm text-dark-textSecondary">
                          {linkedAccounts.length} Linked Account{linkedAccounts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-dark-textSecondary text-2xl">
                      {isFIPExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </button>
              </div>

              {/* FIP Details (if expanded) */}
              {isFIPExpanded && (
                <div className="mb-6 space-y-2">
                  <h4 className="text-sm font-bold text-accent-primary mb-2">FIP Information</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(fip)
                      .filter(([key]) => key !== 'linkedAccounts')
                      .map(([key, value]) => (
                        <div key={key} className="glass-effect rounded-lg p-3">
                          <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                            {camelToTitleCase(key)}
                          </div>
                          <div className="text-sm">
                            {renderField(key, value)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Linked Accounts */}
              {linkedAccounts.length === 0 ? (
                <div className="text-center py-6 text-dark-textSecondary">
                  <p>No linked accounts for this FIP</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {linkedAccounts.map((account: any, accIdx: number) => {
                    const accountId = account.fiDataId || account.accountRefNumber || `acc-${fipIdx}-${accIdx}`;
                    const isExpanded = expandedAccounts.has(accountId);

                    return (
                      <motion.div
                        key={accountId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: accIdx * 0.05 }}
                        className="glass-effect rounded-lg p-5 border border-dark-border hover:border-accent-primary/50 transition-all"
                      >
                        {/* Account Header */}
                        <button
                          onClick={() => toggleAccount(accountId)}
                          className="w-full text-left mb-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">💳</span>
                              <div>
                                <h4 className="text-lg font-semibold text-dark-text">
                                  {account.maskedAccNumber || account.accountRefNumber || 'Account'}
                                </h4>
                                {account.accountName && (
                                  <p className="text-sm text-dark-textSecondary">{account.accountName}</p>
                                )}
                                {account.accountType && (
                                  <p className="text-xs text-dark-textSecondary mt-1">
                                    Type: {account.accountType}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {account.accountCurrentBalance && (
                                <p className="text-xl font-bold gradient-text">
                                  {formatCurrency(account.accountCurrentBalance)}
                                </p>
                              )}
                              <span className="text-dark-textSecondary text-sm">
                                {isExpanded ? '▼ Show Less' : '▶ Show All Fields'}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Account Fields (if expanded) */}
                        {isExpanded && (
                          <div className="pt-4 border-t border-dark-border">
                            {renderAccountFields(account, accountId)}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })
      )}

      {/* Show Total Fields Count */}
      {fipData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-effect rounded-xl p-4 border border-accent-primary/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-dark-text">
                📊 Total Accounts: {fipData.reduce((sum: number, fip: any) => sum + (fip.linkedAccounts?.length || 0), 0)}
              </p>
              <p className="text-xs text-dark-textSecondary mt-1">
                All fields from API response are displayed above. Expand any account to see complete details.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

