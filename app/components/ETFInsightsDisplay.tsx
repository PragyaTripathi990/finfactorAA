'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface ETFInsightsDisplayProps {
  data: any;
}

export default function ETFInsightsDisplay({ data }: ETFInsightsDisplayProps) {
  const [expandedDemats, setExpandedDemats] = useState<Set<number>>(new Set());
  const [expandedHoldings, setExpandedHoldings] = useState<Set<string>>(new Set());
  const [showRawData, setShowRawData] = useState(false);

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No ETF insights available</p>
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
    });
  };

  // Toggle demat expansion
  const toggleDemat = (index: number) => {
    const newSet = new Set(expandedDemats);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedDemats(newSet);
  };

  // Toggle holding expansion
  const toggleHolding = (holdingId: string) => {
    const newSet = new Set(expandedHoldings);
    if (newSet.has(holdingId)) {
      newSet.delete(holdingId);
    } else {
      newSet.add(holdingId);
    }
    setExpandedHoldings(newSet);
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
    if (lowerKey.includes('value') || lowerKey.includes('return') || lowerKey.includes('nav') || lowerKey.includes('amount') || lowerKey.includes('price') || lowerKey.includes('units')) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        if (lowerKey.includes('percent') || lowerKey.includes('percentage')) {
          return <span className="text-accent-warning font-semibold">{Number(value).toFixed(2)}%</span>;
        }
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

  const currentValue = data.currentValue || 0;
  const totalHoldings = data.totalHoldings || 0;
  const totalDemats = data.totalDemats || 0;
  const returnsSummary = data.returnsSummary || {};
  const dematWiseDistribution = data.dematWiseDistribution || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
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
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-secondary/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💼</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Total Holdings</p>
              <p className="text-2xl font-bold text-accent-secondary">{totalHoldings}</p>
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
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Total Demats</p>
              <p className="text-2xl font-bold text-accent-success">{totalDemats}</p>
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
            <span className="text-3xl">📈</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Daily Returns</p>
              <p className="text-2xl font-bold text-accent-warning">
                {formatCurrency(returnsSummary.dailyReturns || 0)}
              </p>
              {returnsSummary.dailyReturnsPercentage !== undefined ? (
                <p className={`text-xs mt-1 ${returnsSummary.dailyReturnsPercentage >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                  {returnsSummary.dailyReturnsPercentage >= 0 ? '+' : ''}                  {returnsSummary.dailyReturnsPercentage.toFixed(2)}%
                </p>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Returns Summary */}
      {returnsSummary && Object.keys(returnsSummary).length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border border-accent-primary/20"
        >
          <h4 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
            <span>📈</span> Returns Summary
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(returnsSummary).map(([key, value]) => (
              <div key={key} className="glass-effect rounded-lg p-4">
                <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                  {camelToTitleCase(key)}
                </div>
                <div className="text-sm font-bold text-dark-text">
                  {renderField(key, value)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Demat-wise Distribution */}
      {dematWiseDistribution.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
            <span>🏦</span> Demat-wise Distribution ({dematWiseDistribution.length})
          </h4>
          {dematWiseDistribution.map((demat: any, idx: number) => {
            const isExpanded = expandedDemats.has(idx);
            const dematReturns = demat.returnsSummary || {};
            const holdingsInsights = demat.holdingsInsights || [];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20 hover:border-accent-primary/50 transition-all"
              >
                <button
                  onClick={() => toggleDemat(idx)}
                  className="w-full text-left mb-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h5 className="text-xl font-bold text-dark-text mb-2">
                        {demat.brokerName || demat.dematId || `Demat ${idx + 1}`}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {demat.dematId ? (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded font-mono">
                            {demat.dematId}
                          </span>
                        ) : null}
                        {demat.brokerCode ? (
                          <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                            {demat.brokerCode}
                          </span>
                        ) : null}
                        <span className="text-xs px-2 py-1 bg-accent-success/20 text-accent-success rounded">
                          {demat.totalHoldings || 0} Holdings
                        </span>
                        {demat.dematValuePercentage !== undefined ? (
                          <span className="text-xs px-2 py-1 bg-accent-warning/20 text-accent-warning rounded">
                            {demat.dematValuePercentage.toFixed(2)}%
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold gradient-text">{formatCurrency(demat.currentValue || 0)}</p>
                      {dematReturns.dailyReturnsPercentage !== undefined ? (
                        <p className={`text-sm font-semibold mt-1 ${dematReturns.dailyReturnsPercentage >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                          {dematReturns.dailyReturnsPercentage >= 0 ? '▲' : '▼'}                           {Math.abs(dematReturns.dailyReturnsPercentage).toFixed(2)}%
                        </p>
                      ) : null}
                      <span className="text-xs text-dark-textSecondary block mt-2">
                        {isExpanded ? '▼ Hide Details' : '▶ Show All Fields'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {demat.totalHoldings !== undefined ? (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Total Holdings</p>
                      <p className="text-sm font-bold text-dark-text">{demat.totalHoldings}</p>
                    </div>
                  ) : null}
                  {dematReturns.dailyReturns !== undefined ? (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Daily Returns</p>
                      <p className="text-sm font-bold text-accent-success">{formatCurrency(dematReturns.dailyReturns)}</p>
                    </div>
                  ) : null}
                  {dematReturns.dailyReturnsPercentage !== undefined ? (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Daily Returns %</p>
                      <p className={`text-sm font-bold ${dematReturns.dailyReturnsPercentage >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                        {dematReturns.dailyReturnsPercentage >= 0 ? '+' : ''}{dematReturns.dailyReturnsPercentage.toFixed(2)}%
                      </p>
                    </div>
                  ) : null}
                  {demat.dematValuePercentage !== undefined ? (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Portfolio %</p>
                      <p className="text-sm font-bold text-accent-warning">{demat.dematValuePercentage.toFixed(2)}%</p>
                    </div>
                  ) : null}
                </div>

                {/* Holdings Insights */}
                {holdingsInsights.length > 0 ? (
                  <div className="mb-4">
                    <h6 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
                      <span>📊</span> Holdings Insights ({holdingsInsights.length})
                    </h6>
                    <div className="space-y-3">
                      {holdingsInsights.map((holding: any, holdingIdx: number) => {
                        const holdingId = holding.isin || `holding-${idx}-${holdingIdx}`;
                        const isHoldingExpanded = expandedHoldings.has(holdingId);
                        const holdingReturns = holding.returnsSummary || {};

                        return (
                          <div
                            key={holdingId}
                            className="glass-effect rounded-lg p-4 border border-accent-primary/20"
                          >
                            <button
                              onClick={() => toggleHolding(holdingId)}
                              className="w-full text-left mb-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h6 className="text-sm font-semibold text-dark-text">
                                    {holding.schemeName || holding.isin || 'Unknown ETF'}
                                  </h6>
                                  {holding.isin ? (
                                    <p className="text-xs text-dark-textSecondary font-mono mt-1">ISIN: {holding.isin}</p>
                                  ) : null}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-accent-success">{formatCurrency(holding.currentValue || 0)}</p>
                                  {holdingReturns.dailyReturnsPercentage !== undefined ? (
                                    <p className={`text-xs ${holdingReturns.dailyReturnsPercentage >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                                      {holdingReturns.dailyReturnsPercentage >= 0 ? '+' : ''}{holdingReturns.dailyReturnsPercentage.toFixed(2)}%
                                    </p>
                                  ) : null}
                                  <span className="text-xs text-dark-textSecondary">
                                    {isHoldingExpanded ? '▼' : '▶'}
                                  </span>
                                </div>
                              </div>
                            </button>

                            {/* Quick Holding Stats */}
                            <div className="grid md:grid-cols-3 gap-2 mb-3">
                              {holding.totalUnits !== undefined ? (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">Units</p>
                                    <p className="text-sm font-bold text-dark-text">{holding.totalUnits.toLocaleString('en-IN')}</p>
                                </div>
                              ) : null}
                              {holding.currentNAV !== undefined ? (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">NAV</p>
                                    <p className="text-sm font-bold text-accent-success">{formatCurrency(holding.currentNAV)}</p>
                                </div>
                              ) : null}
                              {holding.currentNAVDate ? (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">NAV Date</p>
                                    <p className="text-sm font-bold text-dark-text">{formatDate(holding.currentNAVDate)}</p>
                                </div>
                              ) : null}
                            </div>

                            {/* Expanded Holding Details */}
                            {isHoldingExpanded ? (
                              <div className="pt-3 border-t border-dark-border/50">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(holding).map(([key, value]) => (
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
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Expanded Demat Details */}
                {isExpanded ? (
                  <div className="pt-4 border-t border-dark-border">
                    <h6 className="text-sm font-bold text-accent-primary mb-3">All Demat Fields</h6>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(demat)
                        .filter(([key]) => !['holdingsInsights'].includes(key))
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
                    <div className="mt-4">
                      <pre className="text-xs text-dark-text overflow-x-auto bg-dark-border/20 rounded-lg p-4">
                        {JSON.stringify(demat, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">No demat-wise distribution data available</p>
        </div>
      )}

      {/* All Other Fields */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6 border border-accent-secondary/20"
      >
        <h4 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
          <span>📋</span> All Response Fields
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data)
            .filter(([key]) => !['dematWiseDistribution', 'returnsSummary'].includes(key))
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
      </motion.div>

      {/* Raw JSON View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
        {showRawData ? (
          <div className="mt-4 glass-effect rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-xs text-dark-text whitespace-pre-wrap break-words">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

