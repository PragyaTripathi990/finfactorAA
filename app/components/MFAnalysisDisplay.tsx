'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface MFAnalysisDisplayProps {
  data: any;
}

export default function MFAnalysisDisplay({ data }: MFAnalysisDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showRawData, setShowRawData] = useState(false);

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No mutual fund analysis data available</p>
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
    if (lowerKey.includes('value') || lowerKey.includes('cost') || lowerKey.includes('amount')) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        return <span className="text-accent-success font-semibold">{formatCurrency(value)}</span>;
      }
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

  const totalFiData = data.totalFiData || 0;
  const currentValue = data.currentValue || 0;
  const costValue = data.costValue || 0;
  const totalHoldings = data.totalHoldings || 0;
  const gainLoss = currentValue - costValue;
  const gainLossPercent = costValue > 0 ? ((gainLoss / costValue) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏢</span>
            <div>
              <p className="text-xs text-dark-textSecondary">FIP</p>
              <p className="text-sm font-bold text-dark-text">{data.fipName || data.fipId || '—'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Total FI Data</p>
              <p className="text-2xl font-bold text-dark-text">{totalFiData}</p>
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
              <p className="text-xs text-dark-textSecondary">Current Value</p>
              <p className="text-2xl font-bold gradient-text">{formatCurrency(currentValue)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-warning/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💵</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Cost Value</p>
              <p className="text-2xl font-bold text-accent-warning">{formatCurrency(costValue)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`glass-effect rounded-xl p-6 border-2 ${gainLoss >= 0 ? 'border-accent-success/30' : 'border-accent-danger/30'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{gainLoss >= 0 ? '📈' : '📉'}</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Gain/Loss</p>
              <p className={`text-2xl font-bold ${gainLoss >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {formatCurrency(gainLoss)}
              </p>
              <p className={`text-xs ${gainLoss >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scheme Category Analysis */}
      {data.schemeCategory && data.schemeCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border border-accent-primary/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <span>📂</span> Scheme Category Analysis
            </h4>
            <button
              onClick={() => toggleSection('schemeCategory')}
              className="text-xs text-accent-primary hover:text-accent-primary/80"
            >
              {expandedSections.has('schemeCategory') ? '▼ Collapse' : '▶ Expand All'}
            </button>
          </div>
          <div className="space-y-3">
            {data.schemeCategory.map((cat: any, idx: number) => {
              const maxValue = Math.max(...data.schemeCategory.map((c: any) => c.currentValue || 0));
              const percentage = maxValue > 0 ? ((cat.currentValue || 0) / maxValue) * 100 : 0;
              
              return (
                <div key={idx} className="glass-effect rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-dark-text">{cat.schemeCategory || 'Unknown'}</p>
                      <p className="text-xs text-dark-textSecondary">{cat.totalHoldings || 0} holding(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent-success">{formatCurrency(cat.currentValue || 0)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-dark-border rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {expandedSections.has('schemeCategory') && (
                    <div className="mt-3 pt-3 border-t border-dark-border/50">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(cat).map(([key, value]) => (
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
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Scheme Type Analysis */}
      {data.schemeType && data.schemeType.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border border-accent-secondary/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <span>📊</span> Scheme Type Analysis
            </h4>
            <button
              onClick={() => toggleSection('schemeType')}
              className="text-xs text-accent-primary hover:text-accent-primary/80"
            >
              {expandedSections.has('schemeType') ? '▼ Collapse' : '▶ Expand All'}
            </button>
          </div>
          <div className="space-y-3">
            {data.schemeType.map((type: any, idx: number) => {
              const maxValue = Math.max(...data.schemeType.map((t: any) => t.currentValue || 0));
              const percentage = maxValue > 0 ? ((type.currentValue || 0) / maxValue) * 100 : 0;
              
              return (
                <div key={idx} className="glass-effect rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-dark-text">{type.schemeTypes || 'Unknown'}</p>
                      <p className="text-xs text-dark-textSecondary">{type.totalHoldings || 0} holding(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent-success">{formatCurrency(type.currentValue || 0)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-dark-border rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-accent-secondary to-accent-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {expandedSections.has('schemeType') && (
                    <div className="mt-3 pt-3 border-t border-dark-border/50">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(type).map(([key, value]) => (
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
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* All Other Fields */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6 border border-accent-secondary/20"
      >
        <button
          onClick={() => toggleSection('all-fields')}
          className="w-full text-left mb-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <span>📋</span> All Response Fields
            </h4>
            <span className="text-dark-textSecondary">
              {expandedSections.has('all-fields') ? '▼' : '▶'}
            </span>
          </div>
        </button>
        {expandedSections.has('all-fields') && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data)
              .filter(([key]) => !['schemeCategory', 'schemeType'].includes(key))
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

