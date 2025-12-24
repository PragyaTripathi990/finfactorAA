'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface MFUserDetailsDisplayProps {
  data: any;
}

export default function MFUserDetailsDisplay({ data }: MFUserDetailsDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showRawData, setShowRawData] = useState(false);

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No mutual fund user details available</p>
      </div>
    );
  }

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

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    setExpandedSections(newSet);
  };

  // Render field value
  const renderField = (key: string, value: any) => {
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
                      <span className="text-dark-text">{renderField(k, v)}</span>
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
              <span className="text-dark-text">{renderField(k, v)}</span>
            </div>
          ))}
        </div>
      );
    }

    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('value') || lowerKey.includes('cost') || lowerKey.includes('amount') || lowerKey.includes('balance')) {
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

  const subscriptionStatus = data.subscriptionStatus || 'N/A';
  const subscriptionStartDate = data.subscriptionStartDate;
  const subscriptionEndDate = data.subscriptionEndDate;
  const fiDatas = data.fiDatas || {};
  const mfData = fiDatas.MUTUAL_FUNDS || {};

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
      >
        <h3 className="text-xl font-bold text-dark-text mb-4 flex items-center gap-2">
          <span>📋</span> Subscription Information
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Subscription Status</p>
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
              subscriptionStatus === 'YES' 
                ? 'bg-accent-success/20 text-accent-success' 
                : 'bg-accent-danger/20 text-accent-danger'
            }`}>
              {subscriptionStatus}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Start Date</p>
            <p className="text-sm font-semibold text-dark-text">{formatDate(subscriptionStartDate)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">End Date</p>
            <p className="text-sm font-semibold text-dark-text">{formatDate(subscriptionEndDate)}</p>
          </div>
        </div>
      </motion.div>

      {/* Mutual Funds Data Section */}
      {mfData && Object.keys(mfData).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-success/30"
        >
          <h3 className="text-xl font-bold text-dark-text mb-4 flex items-center gap-2">
            <span>💼</span> Mutual Funds Portfolio Summary
          </h3>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-effect rounded-lg p-4 border border-accent-primary/20">
              <p className="text-xs font-semibold text-dark-textSecondary mb-1">Total FI Data</p>
              <p className="text-2xl font-bold text-accent-primary">{mfData.totalFiData || 0}</p>
            </div>
            <div className="glass-effect rounded-lg p-4 border border-accent-warning/20">
              <p className="text-xs font-semibold text-dark-textSecondary mb-1">To Be Fetched</p>
              <p className="text-2xl font-bold text-accent-warning">{mfData.totalFiDataToBeFetched || 0}</p>
            </div>
            <div className="glass-effect rounded-lg p-4 border border-accent-success/20">
              <p className="text-xs font-semibold text-dark-textSecondary mb-1">Current Value</p>
              <p className="text-2xl font-bold gradient-text">{formatCurrency(mfData.currentValue || 0)}</p>
            </div>
            <div className="glass-effect rounded-lg p-4 border border-accent-secondary/20">
              <p className="text-xs font-semibold text-dark-textSecondary mb-1">Total Holdings</p>
              <p className="text-2xl font-bold text-accent-secondary">{mfData.totalHoldings || 0}</p>
            </div>
          </div>

          {/* Cost Value */}
          {mfData.costValue !== undefined && (
            <div className="mb-6">
              <div className="glass-effect rounded-lg p-4 border border-accent-warning/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-dark-textSecondary mb-1">Cost Value</p>
                    <p className="text-2xl font-bold text-accent-warning">{formatCurrency(mfData.costValue)}</p>
                  </div>
                  {mfData.currentValue && mfData.costValue && (
                    <div className="text-right">
                      <p className="text-xs font-semibold text-dark-textSecondary mb-1">Gain/Loss</p>
                      <p className={`text-xl font-bold ${(mfData.currentValue - mfData.costValue) >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                        {formatCurrency(mfData.currentValue - mfData.costValue)}
                      </p>
                      <p className={`text-sm ${(mfData.currentValue - mfData.costValue) >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                        ({(((mfData.currentValue - mfData.costValue) / mfData.costValue) * 100).toFixed(2)}%)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Last Fetch Date */}
          {mfData.lastFetchDate && (
            <div className="mb-6">
              <div className="glass-effect rounded-lg p-4">
                <p className="text-xs font-semibold text-dark-textSecondary mb-1">Last Fetch Date</p>
                <p className="text-sm font-semibold text-dark-text">{formatDate(mfData.lastFetchDate)}</p>
              </div>
            </div>
          )}

          {/* Data Source Details */}
          {mfData.dataSourceDetails && mfData.dataSourceDetails.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
                <span>📡</span> Data Source Details
              </h4>
              <div className="space-y-3">
                {mfData.dataSourceDetails.map((source: any, idx: number) => (
                  <div key={idx} className="glass-effect rounded-lg p-4 border border-accent-primary/20">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-dark-textSecondary mb-1">Data Resource Type</p>
                        <p className="text-sm font-semibold text-dark-text">{source.dataResourceType || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-dark-textSecondary mb-1">Last Fetch Date</p>
                        <p className="text-sm font-semibold text-dark-text">{formatDate(source.lastFetchDate)}</p>
                      </div>
                    </div>
                    {/* Show all other fields */}
                    {Object.entries(source)
                      .filter(([key]) => !['dataResourceType', 'lastFetchDate'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="mt-2">
                          <p className="text-xs font-semibold text-dark-textSecondary mb-1">
                            {camelToTitleCase(key)}
                          </p>
                          <div className="text-sm">
                            {renderField(key, value)}
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Other Fields */}
          <div>
            <button
              onClick={() => toggleSection('mf-all-fields')}
              className="w-full text-left glass-effect rounded-lg p-3 hover:border-accent-primary/50 transition-all mb-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-accent-primary flex items-center gap-2">
                  <span>📋</span> All Mutual Funds Data Fields
                </span>
                <span className="text-dark-textSecondary">
                  {expandedSections.has('mf-all-fields') ? '▼' : '▶'}
                </span>
              </div>
            </button>
            {expandedSections.has('mf-all-fields') && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(mfData)
                  .filter(([key]) => !['dataSourceDetails'].includes(key))
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
            )}
          </div>
        </motion.div>
      )}

      {/* All Other Fields from Response */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-effect rounded-xl p-6 border border-accent-secondary/20"
      >
        <button
          onClick={() => toggleSection('all-fields')}
          className="w-full text-left mb-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <span>📋</span> All Response Fields
            </h3>
            <span className="text-dark-textSecondary">
              {expandedSections.has('all-fields') ? '▼' : '▶'}
            </span>
          </div>
        </button>
        {expandedSections.has('all-fields') && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data)
              .filter(([key]) => !['subscriptionStatus', 'subscriptionStartDate', 'subscriptionEndDate', 'fiDatas'].includes(key))
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
        )}
      </motion.div>

      {/* Raw JSON View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-effect rounded-xl p-4 border border-accent-secondary/20"
      >
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-accent-secondary flex items-center gap-2">
              <span>🔍</span> View Raw JSON Response
            </span>
            <span className="text-dark-textSecondary">
              {showRawData ? '▼' : '▶'}
            </span>
          </div>
        </button>
        {showRawData && (
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

