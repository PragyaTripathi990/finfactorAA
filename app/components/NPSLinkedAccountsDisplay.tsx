'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface NPSAccount {
  fiDataId: string;
  accountRefNumber: string;
  dataFetched: boolean;
  lastFetchDateTime: string;
  fipName: string;
  maskedPranId?: string;
  holderPranId?: string;
  holderName?: string;
  holderMobile?: string;
  holderEmail?: string;
  holderPan?: string;
  holderDob?: string;
  holderAddress?: string;
  holderNominee?: string;
  accountCurrentValue: number;
  latestConsentExpiryTime?: string;
  latestConsentPurposeText?: string;
  fiRequestCountOfCurrentMonth?: number;
  tierType?: string;
  schemeName?: string;
  schemeNav?: number;
  navDate?: string;
  units?: number;
  totalContribution?: number;
  employeeContribution?: number;
  employerContribution?: number;
  voluntaryContribution?: number;
  tier1Value?: number;
  tier2Value?: number;
  pfmName?: string;
  [key: string]: any;
}

interface FIPData {
  fipId: string;
  fipName: string;
  totalFiData: number;
  linkedAccounts: NPSAccount[];
  currentValue: number;
}

interface NPSDisplayProps {
  data: {
    totalFiData: number;
    fipData: FIPData[];
    currentValue: number;
  } | null;
}

export default function NPSLinkedAccountsDisplay({ data }: NPSDisplayProps) {
  // Auto-expand all sections by default
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(() => {
    const allAccountIds = new Set<string>();
    if (data?.fipData) {
      data.fipData.forEach((fip) => {
        fip.linkedAccounts.forEach((account) => {
          allAccountIds.add(account.fiDataId);
        });
      });
    }
    return allAccountIds;
  });
  
  const [expandedFIPs, setExpandedFIPs] = useState<Set<string>>(() => {
    const allFIPIds = new Set<string>();
    if (data?.fipData) {
      data.fipData.forEach((fip) => {
        allFIPIds.add(fip.fipId);
      });
    }
    return allFIPIds;
  });

  if (!data || !data.fipData || data.fipData.length === 0) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">🛡️</p>
        <p className="text-lg">No NPS linked accounts found</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleAccount = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const toggleFIP = (fipId: string) => {
    const newExpanded = new Set(expandedFIPs);
    if (newExpanded.has(fipId)) {
      newExpanded.delete(fipId);
    } else {
      newExpanded.add(fipId);
    }
    setExpandedFIPs(newExpanded);
  };

  const renderField = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('value') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('contribution') || key.toLowerCase().includes('nav')) {
        return formatCurrency(value);
      }
      return value.toLocaleString('en-IN');
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return formatDate(value);
    }
    return String(value);
  };

  const getAllAccountFields = (account: NPSAccount) => {
    const fields: Array<[string, any]> = [];
    const excludedKeys = ['fiDataId', 'accountRefNumber', 'fipName', 'maskedPranId'];
    
    Object.entries(account).forEach(([key, value]) => {
      if (!excludedKeys.includes(key) && value !== null && value !== undefined && value !== '') {
        fields.push([key, value]);
      }
    });
    
    return fields.sort((a, b) => {
      const priority = ['holderPranId', 'holderName', 'accountCurrentValue', 'holderPan', 'holderEmail', 'holderMobile', 'holderDob', 'holderAddress', 'dataFetched', 'lastFetchDateTime', 'latestConsentExpiryTime'];
      const aIndex = priority.indexOf(a[0]);
      const bIndex = priority.indexOf(b[0]);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-8 border-2 border-accent-success/30 bg-gradient-to-br from-accent-success/5 to-transparent"
      >
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl flex items-center justify-center text-4xl shadow-2xl transform hover:scale-105 transition-transform">
              🛡️
            </div>
            <div>
              <h3 className="text-3xl font-bold text-dark-text mb-2">NPS Accounts</h3>
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-dark-textSecondary text-lg">
                  {data.totalFiData} Total Account{data.totalFiData !== 1 ? 's' : ''}
                </p>
                <span className="text-dark-textSecondary">•</span>
                <p className="text-dark-textSecondary text-lg">
                  {data.fipData.length} FIP{data.fipData.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-textSecondary mb-2 font-semibold">Total Portfolio Value</p>
            <p className="text-4xl font-bold gradient-text mb-1">{formatCurrency(data.currentValue)}</p>
            <p className="text-xs text-dark-textSecondary">All NPS Accounts Combined</p>
          </div>
        </div>
      </motion.div>

      {/* FIP Data */}
      {data.fipData.map((fip, fipIdx) => {
        const isFIPExpanded = expandedFIPs.has(fip.fipId);
        return (
          <motion.div
            key={fip.fipId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: fipIdx * 0.1 }}
            className="space-y-4"
          >
            {/* Enhanced FIP Header */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="glass-effect rounded-xl p-6 border-l-4 border-accent-primary hover:border-accent-primary/80 transition-all cursor-pointer"
              onClick={() => toggleFIP(fip.fipId)}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-dark-text mb-1">{fip.fipName}</h4>
                    <div className="flex items-center gap-3 text-sm text-dark-textSecondary">
                      <span>{fip.linkedAccounts.length} Linked Account{fip.linkedAccounts.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{fip.totalFiData} Total FI Data</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-dark-textSecondary mb-1">FIP Portfolio Value</p>
                    <p className="text-2xl font-bold gradient-text">{formatCurrency(fip.currentValue)}</p>
                  </div>
                  <div className="text-accent-primary">
                    <span className="text-2xl">{isFIPExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Linked Accounts */}
            <AnimatePresence>
              {isFIPExpanded ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid gap-6"
                >
                  {fip.linkedAccounts.map((account, accIdx) => {
                    const isExpanded = expandedAccounts.has(account.fiDataId);
                    const allFields = getAllAccountFields(account);
                    const primaryFields = allFields.slice(0, 9);
                    const additionalFields = allFields.slice(9);

                    return (
                      <motion.div
                        key={account.fiDataId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: accIdx * 0.05 }}
                        className="glass-effect rounded-xl p-6 hover:border-accent-primary/50 transition-all border-2 border-dark-border"
                      >
                        {/* Enhanced Account Header */}
                        <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-dark-border">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-14 h-14 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-xl flex items-center justify-center">
                                <span className="text-3xl">💼</span>
                              </div>
                              <div>
                                <h5 className="text-xl font-bold text-dark-text mb-1">
                                  {account.maskedPranId || account.accountRefNumber || 'NPS Account'}
                                </h5>
                                {account.holderName ? (
                                  <p className="text-dark-textSecondary font-medium">{account.holderName}</p>
                                ) : null}
                              </div>
                            </div>
                            {account.schemeName ? (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-accent-info/20 text-accent-info rounded">
                                  {account.schemeName}
                                </span>
                                {account.tierType ? (
                                  <span className="text-xs px-2 py-1 bg-accent-warning/20 text-accent-warning rounded">
                                    {account.tierType}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-dark-textSecondary mb-1 font-semibold">Current Value</p>
                            <p className="text-3xl font-bold gradient-text mb-2">
                              {formatCurrency(account.accountCurrentValue)}
                            </p>
                            {account.schemeNav ? (
                              <p className="text-xs text-dark-textSecondary">
                                NAV: {formatCurrency(account.schemeNav)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Primary Account Details Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {primaryFields.map(([key, value]) => (
                            <div key={key} className="glass-effect rounded-lg p-3 border border-dark-border/50">
                              <p className="text-xs font-semibold text-dark-textSecondary mb-1">
                                {camelToTitleCase(key)}
                              </p>
                              <p className="text-sm text-dark-text font-medium break-words">
                                {renderField(key, value)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Additional Fields - Expandable */}
                        {additionalFields.length > 0 ? (
                          <div>
                            <button
                              onClick={() => toggleAccount(account.fiDataId)}
                              className="w-full flex items-center justify-between p-3 glass-effect rounded-lg hover:bg-dark-border/30 transition-all mb-4"
                            >
                              <span className="text-sm font-semibold text-dark-text">
                                {isExpanded ? 'Hide' : 'Show'} Additional Fields ({additionalFields.length})
                              </span>
                              <span className="text-accent-primary">{isExpanded ? '▼' : '▶'}</span>
                            </button>

                            <AnimatePresence>
                              {isExpanded ? (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
                                >
                                  {additionalFields.map(([key, value]) => (
                                    <div key={key} className="glass-effect rounded-lg p-3 border border-dark-border/50">
                                      <p className="text-xs font-semibold text-dark-textSecondary mb-1">
                                        {camelToTitleCase(key)}
                                      </p>
                                      <p className="text-sm text-dark-text font-medium break-words">
                                        {renderField(key, value)}
                                      </p>
                                    </div>
                                  ))}
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        ) : null}

                        {/* Contribution Breakdown if available */}
                        {(account.totalContribution !== undefined || account.employeeContribution !== undefined || account.employerContribution !== undefined) ? (
                          <div className="mt-6 pt-6 border-t-2 border-dark-border">
                            <h6 className="text-sm font-bold text-accent-primary mb-4 flex items-center gap-2">
                              <span>💰</span> Contribution Breakdown
                            </h6>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {account.totalContribution !== undefined ? (
                                <div className="glass-effect rounded-lg p-4 border border-accent-success/30">
                                  <p className="text-xs text-dark-textSecondary mb-1">Total Contribution</p>
                                  <p className="text-lg font-bold text-accent-success">
                                    {formatCurrency(account.totalContribution)}
                                  </p>
                                </div>
                              ) : null}
                              {account.employeeContribution !== undefined ? (
                                <div className="glass-effect rounded-lg p-4 border border-accent-primary/30">
                                  <p className="text-xs text-dark-textSecondary mb-1">Employee Contribution</p>
                                  <p className="text-lg font-bold text-accent-primary">
                                    {formatCurrency(account.employeeContribution)}
                                  </p>
                                </div>
                              ) : null}
                              {account.employerContribution !== undefined ? (
                                <div className="glass-effect rounded-lg p-4 border border-accent-secondary/30">
                                  <p className="text-xs text-dark-textSecondary mb-1">Employer Contribution</p>
                                  <p className="text-lg font-bold text-accent-secondary">
                                    {formatCurrency(account.employerContribution)}
                                  </p>
                                </div>
                              ) : null}
                              {account.voluntaryContribution !== undefined ? (
                                <div className="glass-effect rounded-lg p-4 border border-accent-warning/30">
                                  <p className="text-xs text-dark-textSecondary mb-1">Voluntary Contribution</p>
                                  <p className="text-lg font-bold text-accent-warning">
                                    {formatCurrency(account.voluntaryContribution)}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        {/* Tier Values if available */}
                        {(account.tier1Value !== undefined || account.tier2Value !== undefined) ? (
                          <div className="mt-6 pt-6 border-t-2 border-dark-border">
                            <h6 className="text-sm font-bold text-accent-info mb-4 flex items-center gap-2">
                              <span>📊</span> Tier Breakdown
                            </h6>
                            <div className="grid md:grid-cols-2 gap-4">
                              {account.tier1Value !== undefined ? (
                                <div className="glass-effect rounded-lg p-4 border border-accent-info/30">
                                  <p className="text-xs text-dark-textSecondary mb-1">Tier I Value</p>
                                  <p className="text-xl font-bold text-accent-info">
                                    {formatCurrency(account.tier1Value)}
                                  </p>
                                </div>
                              ) : null}
                              {account.tier2Value !== undefined ? (
                                <div className="glass-effect rounded-lg p-4 border border-accent-info/30">
                                  <p className="text-xs text-dark-textSecondary mb-1">Tier II Value</p>
                                  <p className="text-xl font-bold text-accent-info">
                                    {formatCurrency(account.tier2Value)}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        {/* Raw JSON View */}
                        <div className="mt-6 pt-6 border-t-2 border-dark-border">
                          <details className="cursor-pointer">
                            <summary className="text-sm font-semibold text-dark-textSecondary hover:text-dark-text transition-colors">
                              View Raw JSON Data
                            </summary>
                            <div className="mt-4 glass-effect rounded-lg p-4 max-h-96 overflow-auto">
                              <pre className="text-xs text-dark-text whitespace-pre-wrap break-words">
                                {JSON.stringify(account, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

