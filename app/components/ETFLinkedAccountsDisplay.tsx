'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface ETFLinkedAccountsDisplayProps {
  data: any;
}

export default function ETFLinkedAccountsDisplay({ data }: ETFLinkedAccountsDisplayProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [expandedFIPs, setExpandedFIPs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFields, setShowAllFields] = useState<Set<string>>(new Set());

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No ETF linked accounts data available</p>
      </div>
    );
  }

  // Handle the API response structure - must be before useMemo
  const fipData = data?.fipData || [];

  // Filter accounts based on search query - must be before any early returns
  const filteredFipData = useMemo(() => {
    if (!fipData || fipData.length === 0) return [];
    if (!searchQuery.trim()) return fipData;
    
    const query = searchQuery.toLowerCase();
    return fipData.map((fip: any) => {
      const filteredAccounts = (fip.linkedAccounts || []).filter((account: any) => {
        const accountString = JSON.stringify(account).toLowerCase();
        return accountString.includes(query);
      });
      return { ...fip, linkedAccounts: filteredAccounts };
    }).filter((fip: any) => fip.linkedAccounts.length > 0);
  }, [fipData, searchQuery]);

  // Extract other data values after hooks
  const totalFiData = data?.totalFiData || 0;
  const totalFiDataToBeFetched = data?.totalFiDataToBeFetched || 0;

  // Format currency
  const formatCurrency = (amount: number | string) => {
    if (!amount && amount !== 0) return '₹0.00';
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

  // Toggle showing all fields
  const toggleShowAllFields = (accountId: string) => {
    const newSet = new Set(showAllFields);
    if (newSet.has(accountId)) {
      newSet.delete(accountId);
    } else {
      newSet.add(accountId);
    }
    setShowAllFields(newSet);
  };

  // Render field value
  const renderField = (key: string, value: any, level: number = 0) => {
    if (value === null || value === undefined) {
      return <span className="text-dark-textSecondary italic text-sm">—</span>;
    }

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

    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('balance') || lowerKey.includes('amount') || lowerKey.includes('value') || lowerKey.includes('nav') || lowerKey.includes('cost') || lowerKey.includes('price')) {
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
    const fields = Object.entries(account);
    
    // Group fields by category
    const accountFields = fields.filter(([key]) => 
      key.toLowerCase().includes('account') || 
      key.toLowerCase().includes('masked') ||
      key.toLowerCase().includes('ref') ||
      key.toLowerCase().includes('fidataid') ||
      key.toLowerCase().includes('demat') ||
      key.toLowerCase().includes('broker')
    );
    
    const holdingFields = fields.filter(([key]) => 
      key.toLowerCase().includes('holding') ||
      key.toLowerCase().includes('units') ||
      key.toLowerCase().includes('nav') ||
      key.toLowerCase().includes('isin')
    );
    
    const valueFields = fields.filter(([key]) => 
      key.toLowerCase().includes('value') ||
      key.toLowerCase().includes('cost') ||
      key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('balance') ||
      key.toLowerCase().includes('price')
    );
    
    const consentFields = fields.filter(([key]) => 
      key.toLowerCase().includes('consent') || 
      key.toLowerCase().includes('purpose')
    );

    const dateFields = fields.filter(([key]) => 
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('time')
    );

    const statusFields = fields.filter(([key]) => 
      key.toLowerCase().includes('fetched') ||
      key.toLowerCase().includes('status') ||
      key.toLowerCase().includes('active')
    );

    // Extract fiData separately
    const fiDataField = fields.find(([key]) => key.toLowerCase() === 'fidata');
    const fiDataValue = fiDataField ? fiDataField[1] : null;
    
    const otherFields = fields.filter(([key]) => 
      !accountFields.some(([k]) => k === key) &&
      !holdingFields.some(([k]) => k === key) &&
      !valueFields.some(([k]) => k === key) &&
      !consentFields.some(([k]) => k === key) &&
      !dateFields.some(([k]) => k === key) &&
      !statusFields.some(([k]) => k === key) &&
      key.toLowerCase() !== 'fidata'
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

        {/* Holding Information */}
        {holdingFields.length > 0 && (
          <div>
            <h5 className="text-sm font-bold text-accent-success mb-2 flex items-center gap-2">
              <span>📊</span> Holding Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {holdingFields.map(([key, value]) => (
                <div key={key} className="glass-effect rounded-lg p-3 border border-accent-success/20">
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

        {/* Value & Cost Information */}
        {valueFields.length > 0 && (
          <div>
            <h5 className="text-sm font-bold text-accent-warning mb-2 flex items-center gap-2">
              <span>💰</span> Value & Cost Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {valueFields.map(([key, value]) => (
                <div key={key} className="glass-effect rounded-lg p-3 border border-accent-warning/20">
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

        {/* Date & Time Fields */}
        {dateFields.length > 0 && (
          <div>
            <h5 className="text-sm font-bold text-accent-secondary mb-2 flex items-center gap-2">
              <span>📅</span> Date & Time Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dateFields.map(([key, value]) => (
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

        {/* Status Fields */}
        {statusFields.length > 0 && (
          <div>
            <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
              <span>⚡</span> Status Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {statusFields.map(([key, value]) => (
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

        {/* FI Data */}
        {fiDataValue && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
                <span>📦</span> FI Data (Complete Account Details)
              </h5>
              <button
                onClick={() => toggleShowAllFields(accountId + '-fidata')}
                className="text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
              >
                {showAllFields.has(accountId + '-fidata') ? '▼ Collapse' : '▶ Expand All'}
              </button>
            </div>
            <div className="glass-effect rounded-lg p-4 border-2 border-accent-primary/30">
              {typeof fiDataValue === 'object' && fiDataValue !== null ? (
                <div className="space-y-3">
                  {Object.entries(fiDataValue).map(([key, value]) => {
                    const isComplex = typeof value === 'object' && value !== null;
                    const fieldKey = accountId + '-fidata-' + key;
                    const isAllExpanded = showAllFields.has(accountId + '-fidata');
                    const isFieldExpanded = showAllFields.has(fieldKey);
                    const shouldShowExpanded = isAllExpanded || isFieldExpanded || !isComplex;
                    
                    return (
                      <div key={key} className="border-b border-dark-border/50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-accent-primary mb-1">
                              {camelToTitleCase(key)}
                            </div>
                            {isComplex ? (
                              <div className="mt-2">
                                {shouldShowExpanded ? (
                                  <div className="ml-2 pl-3 border-l-2 border-accent-primary/30">
                                    {renderField(key, value, 1)}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => toggleShowAllFields(fieldKey)}
                                    className="text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
                                  >
                                    ▶ Click to expand ({Array.isArray(value) ? `${value.length} items` : 'Object'})
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm mt-1">
                                {renderField(key, value)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm">
                  {renderField('fiData', fiDataValue)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other Fields */}
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

        {/* Raw JSON View */}
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
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <input
            type="text"
            placeholder="Search accounts, ISIN, brokers, or any field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-dark-text placeholder-dark-textSecondary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-dark-textSecondary hover:text-dark-text transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-dark-textSecondary mt-2">
            Found {filteredFipData.reduce((sum: number, fip: any) => sum + (fip.linkedAccounts?.length || 0), 0)} account(s) matching "{searchQuery}"
          </p>
        )}
      </motion.div>

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
            <span className="text-3xl">💼</span>
            <div>
              <p className="text-sm text-dark-textSecondary">Total Accounts</p>
              <p className="text-2xl font-bold text-dark-text">
                {filteredFipData.reduce((sum: number, fip: any) => sum + (fip.linkedAccounts?.length || 0), 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FIP Data */}
      {filteredFipData.length === 0 ? (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">
            {searchQuery ? 'No accounts found matching your search' : 'No FIP data available'}
          </p>
        </div>
      ) : (
        filteredFipData.map((fip: any, fipIdx: number) => {
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

              {/* FIP Details */}
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
                    const accountId = account.fiDataId || account.accountRefNumber || account.dematId || `acc-${fipIdx}-${accIdx}`;
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
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-2xl">💼</span>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-dark-text">
                                  {account.schemeName || account.isinDescription || account.dematId || account.accountRefNumber || 'Account'}
                                </h4>
                                {account.brokerName && (
                                  <p className="text-sm text-dark-textSecondary">{account.brokerName}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {account.accountType && (
                                    <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded">
                                      {account.accountType}
                                    </span>
                                  )}
                                  {account.fipName && (
                                    <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                                      {account.fipName}
                                    </span>
                                  )}
                                  {account.dataFetched !== undefined && (
                                    <span className={`text-xs px-2 py-1 rounded ${account.dataFetched ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-warning/20 text-accent-warning'}`}>
                                      {account.dataFetched ? '✓ Data Fetched' : '⚠ Not Fetched'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {account.currentValue !== undefined && (
                                <p className="text-xl font-bold gradient-text">
                                  {formatCurrency(account.currentValue)}
                                </p>
                              )}
                              <span className="text-dark-textSecondary text-sm block mt-1">
                                {isExpanded ? '▼ Show Less' : '▶ Show All Fields'}
                              </span>
                              <span className="text-xs text-dark-textSecondary block mt-1">
                                {Object.keys(account).length} fields
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Account Fields */}
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

      {/* Raw JSON View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-effect rounded-xl p-4 border border-accent-secondary/20"
      >
        <button
          onClick={() => toggleAccount('raw-response')}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-accent-secondary flex items-center gap-2">
              <span>🔍</span> View Complete Raw API Response JSON
            </span>
            <span className="text-dark-textSecondary">
              {expandedAccounts.has('raw-response') ? '▼' : '▶'}
            </span>
          </div>
        </button>
        {expandedAccounts.has('raw-response') && (
          <div className="mt-4 glass-effect rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-xs text-dark-text whitespace-pre-wrap break-words">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>
    </div>
  );
}

