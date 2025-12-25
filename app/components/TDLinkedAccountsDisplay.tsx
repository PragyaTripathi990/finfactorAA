'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { camelToTitleCase, formatValue } from '@/lib/formatters';

interface TDLinkedAccountsDisplayProps {
  data: any;
}

export default function TDLinkedAccountsDisplay({ data }: TDLinkedAccountsDisplayProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [expandedFIPs, setExpandedFIPs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFields, setShowAllFields] = useState<Set<string>>(new Set());

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

  // Early return after all hooks
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No term deposit linked accounts data available</p>
      </div>
    );
  }

  // Extract other data values after hooks
  const totalFiData = data.totalFiData || 0;
  const totalFiDataToBeFetched = data.totalFiDataToBeFetched || 0;
  const currentBalance = data.currentBalance || 0;
  const lastFetchDate = data.lastFetchDate || null;

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
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  // Toggle FIP expansion
  const toggleFIP = (fipId: string) => {
    setExpandedFIPs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fipId)) {
        newSet.delete(fipId);
      } else {
        newSet.add(fipId);
      }
      return newSet;
    });
  };

  // Toggle all fields expansion
  const toggleShowAllFields = (id: string) => {
    setShowAllFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Bulk expand/collapse
  const expandAll = () => {
    const allAccountIds = new Set<string>();
    filteredFipData.forEach((fip: any) => {
      (fip.linkedAccounts || []).forEach((account: any) => {
        const accountId = account.accountRefNumber || account.fiDataId || account.accountId;
        if (accountId) allAccountIds.add(accountId);
      });
    });
    setExpandedAccounts(allAccountIds);
  };

  const collapseAll = () => {
    setExpandedAccounts(new Set());
  };

  // Recursive render function for nested objects/arrays
  const renderField = (key: string, value: any, level: number = 0) => {
    if (value === null || value === undefined || value === '') {
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
    if (lowerKey.includes('date') || lowerKey.includes('time')) {
      return <span className="text-accent-secondary">{formatDate(value)}</span>;
    }
    if (lowerKey.includes('value') || lowerKey.includes('price') || lowerKey.includes('amount') || lowerKey.includes('cost') || lowerKey.includes('balance')) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        return <span className="text-accent-success font-semibold">{formatCurrency(value)}</span>;
      }
    }
    if (typeof value === 'boolean') {
      return (
        <span className={`font-semibold ${value ? 'text-accent-success' : 'text-accent-danger'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    return <span className="text-dark-text">{String(value)}</span>;
  };

  const renderAccountFields = (account: any, accountId: string) => {
    const fields = Object.entries(account);
    
    // Group fields by category
    const accountFields = fields.filter(([key]) => 
      key.toLowerCase().includes('account') || 
      key.toLowerCase().includes('masked') ||
      key.toLowerCase().includes('ref') ||
      key.toLowerCase().includes('fidataid') ||
      key.toLowerCase().includes('linkedaccounttype')
    );
    
    const balanceFields = fields.filter(([key]) => 
      key.toLowerCase().includes('balance') ||
      key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('value') ||
      key.toLowerCase().includes('price')
    );
    
    const dateFields = fields.filter(([key]) => 
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('time')
    );

    const statusFields = fields.filter(([key]) => 
      key.toLowerCase().includes('fetched') ||
      key.toLowerCase().includes('status') ||
      key.toLowerCase().includes('compliance')
    );

    const holderFields = fields.filter(([key]) =>
      key.toLowerCase().includes('holder') ||
      key.toLowerCase().includes('pan') ||
      key.toLowerCase().includes('kyc')
    );

    const consentFields = fields.filter(([key]) => 
      key.toLowerCase().includes('consent') || 
      key.toLowerCase().includes('purpose')
    );

    // Extract fiData separately
    const fiDataField = fields.find(([key]) => key.toLowerCase() === 'fidata');
    const fiDataValue = fiDataField ? fiDataField[1] : null;
    
    const otherFields = fields.filter(([key]) => 
      !accountFields.some(([k]) => k === key) &&
      !balanceFields.some(([k]) => k === key) &&
      !dateFields.some(([k]) => k === key) &&
      !statusFields.some(([k]) => k === key) &&
      !holderFields.some(([k]) => k === key) &&
      !consentFields.some(([k]) => k === key) &&
      key.toLowerCase() !== 'fidata' &&
      key.toLowerCase() !== 'fipid' &&
      key.toLowerCase() !== 'fipname'
    );

    return (
      <div className="space-y-4">
        {/* Account Information */}
        {accountFields.length > 0 ? (
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
        ) : null}

        {/* Balance & Amount Information */}
        {balanceFields.length > 0 ? (
          <div>
            <h5 className="text-sm font-bold text-accent-success mb-2 flex items-center gap-2">
              <span>💰</span> Balance & Amount Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {balanceFields.map(([key, value]) => (
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
        ) : null}

        {holderFields.length > 0 ? (
          <div>
            <h5 className="text-sm font-bold text-accent-info mb-2 flex items-center gap-2">
              <span>👤</span> Holder Information
            </h5>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {holderFields.map(([key, value]) => (
                <div key={key} className="glass-effect rounded-lg p-3 border border-accent-info/20">
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
        ) : null}

        {/* Date & Time Fields */}
        {dateFields.length > 0 ? (
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
        ) : null}

        {/* Status Fields */}
        {statusFields.length > 0 ? (
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
        ) : null}

        {/* Consent Information */}
        {consentFields.length > 0 ? (
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
        ) : null}

        {/* FI Data */}
        {fiDataValue ? (
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
                                    ▶ Click to expand (${Array.isArray(value) ? `${value.length} items` : 'Object'})
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
                <div className="text-dark-text text-sm">{String(fiDataValue)}</div>
              )}
            </div>
          </div>
        ) : null}

        {/* Other Fields */}
        {otherFields.length > 0 ? (
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
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <div className="glass-effect rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-textSecondary">Total FI Data</p>
            <p className="text-2xl font-bold text-accent-primary">{totalFiData}</p>
          </div>
          <span className="text-4xl opacity-50">📦</span>
        </div>
        <div className="glass-effect rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-textSecondary">To Be Fetched</p>
            <p className="text-2xl font-bold text-accent-warning">{totalFiDataToBeFetched}</p>
          </div>
          <span className="text-4xl opacity-50">⏳</span>
        </div>
        <div className="glass-effect rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-textSecondary">Current Balance</p>
            <p className="text-2xl font-bold text-accent-success">{formatCurrency(currentBalance)}</p>
          </div>
          <span className="text-4xl opacity-50">💰</span>
        </div>
        {lastFetchDate ? (
          <div className="glass-effect rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-textSecondary">Last Fetch</p>
              <p className="text-lg font-bold text-accent-secondary">{formatDate(lastFetchDate)}</p>
            </div>
            <span className="text-4xl opacity-50">📅</span>
          </div>
        ) : null}
      </motion.div>

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
            placeholder="Search accounts, account numbers, FIPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-dark-text placeholder-dark-textSecondary"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="text-dark-textSecondary hover:text-dark-text transition-colors"
            >
              ✕
            </button>
          ) : null}
        </div>
        {searchQuery ? (
          <p className="text-xs text-dark-textSecondary mt-2">
            Found {filteredFipData.reduce((sum: number, fip: any) => sum + (fip.linkedAccounts?.length || 0), 0)} account(s) matching "{searchQuery}"
          </p>
        ) : null}
      </motion.div>

      {/* Bulk Actions */}
      {filteredFipData.length > 0 ? (
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-accent-primary/20 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-colors text-sm"
          >
            ▶ Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-accent-secondary/20 text-accent-secondary rounded-lg hover:bg-accent-secondary/30 transition-colors text-sm"
          >
            ▼ Collapse All
          </button>
        </div>
      ) : null}

      {/* FIP Data */}
      {filteredFipData.length === 0 ? (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">
            {searchQuery ? 'No accounts found matching your search' : 'No term deposit linked accounts data available'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFipData.map((fip: any, fipIdx: number) => {
            const fipId = fip.fipId || `fip-${fipIdx}`;
            const linkedAccounts = fip.linkedAccounts || [];
            const isFIPExpanded = expandedFIPs.has(fipId);

            return (
              <motion.div
                key={fipId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: fipIdx * 0.1 }}
                className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20 hover:border-accent-primary/50 transition-all"
              >
                {/* FIP Header */}
                <button
                  onClick={() => toggleFIP(fipId)}
                  className="w-full text-left mb-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-dark-text mb-2">
                        {fip.fipName || fip.fipId || 'Unknown FIP'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {fip.fipId ? (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded font-mono">
                            {fip.fipId}
                          </span>
                        ) : null}
                        {linkedAccounts.length > 0 ? (
                          <span className="text-xs px-2 py-1 bg-accent-info/20 text-accent-info rounded">
                            {linkedAccounts.length} Account{linkedAccounts.length !== 1 ? 's' : ''}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-2xl text-dark-textSecondary transition-transform duration-200">
                      {isFIPExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {/* FIP Details */}
                {isFIPExpanded ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 space-y-4"
                  >
                    <h4 className="text-sm font-bold text-accent-primary mb-2">FIP Information</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(fip)
                        .filter(([key]) => !['linkedAccounts'].includes(key))
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

                    <h4 className="text-sm font-bold text-accent-primary mb-2 mt-6">Linked Accounts</h4>
                    {linkedAccounts.length === 0 ? (
                      <p className="text-dark-textSecondary">No linked accounts for this FIP</p>
                    ) : (
                      <div className="space-y-4">
                        {linkedAccounts.map((account: any, accIdx: number) => {
                          const accountId = account.accountRefNumber || account.fiDataId || account.accountId || `acc-${fipIdx}-${accIdx}`;
                          const isAccountExpanded = expandedAccounts.has(accountId);

                          return (
                            <motion.div
                              key={accountId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: accIdx * 0.05 }}
                              className="glass-effect rounded-lg p-4 border border-dark-border hover:border-accent-secondary/50 transition-all"
                            >
                              <button
                                onClick={() => toggleAccount(accountId)}
                                className="w-full text-left mb-3"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <h5 className="text-lg font-semibold text-dark-text mb-1">
                                      {account.maskedAccNumber || account.accountRefNumber || 'Unknown Account'}
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                      {account.linkedAccountType ? (
                                        <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded">
                                          {camelToTitleCase(account.linkedAccountType)}
                                        </span>
                                      ) : null}
                                      {account.accountRefNumber ? (
                                        <span className="text-xs px-2 py-1 bg-accent-info/20 text-accent-info rounded font-mono">
                                          Ref: {account.accountRefNumber}
                                        </span>
                                      ) : null}
                                      {account.dataFetched ? (
                                        <span className="text-xs px-2 py-1 bg-accent-success/20 text-accent-success rounded">
                                          Data Fetched
                                        </span>
                                      ) : null}
                                      {account.currentBalance !== undefined ? (
                                        <span className="text-xs px-2 py-1 bg-accent-success/20 text-accent-success rounded">
                                          {formatCurrency(account.currentBalance)}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                  <span className="text-xl text-dark-textSecondary transition-transform duration-200">
                                    {isAccountExpanded ? '▼' : '▶'}
                                  </span>
                                </div>
                              </button>

                              {isAccountExpanded ? (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-4"
                                >
                                  {renderAccountFields(account, accountId)}
                                </motion.div>
                              ) : null}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

