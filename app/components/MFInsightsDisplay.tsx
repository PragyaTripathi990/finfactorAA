'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface MFInsightsDisplayProps {
  data: any;
}

export default function MFInsightsDisplay({ data }: MFInsightsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'all-data'>('overview');
  const [expandedHoldings, setExpandedHoldings] = useState<Set<number>>(new Set());
  const [expandedDistributions, setExpandedDistributions] = useState<Set<string>>(new Set());
  const [showRawData, setShowRawData] = useState(false);

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No mutual fund insights available</p>
      </div>
    );
  }

  const overallSummary = data.overallSummary || {};
  const holdings = data.holdings || [];

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

  // Toggle holding expansion
  const toggleHolding = (index: number) => {
    const newSet = new Set(expandedHoldings);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedHoldings(newSet);
  };

  // Toggle distribution expansion
  const toggleDistribution = (distId: string) => {
    const newSet = new Set(expandedDistributions);
    if (newSet.has(distId)) {
      newSet.delete(distId);
    } else {
      newSet.add(distId);
    }
    setExpandedDistributions(newSet);
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
        if (lowerKey.includes('percent') || lowerKey.includes('percentage') || lowerKey.includes('xirr')) {
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
              <p className="text-2xl font-bold gradient-text">{formatCurrency(overallSummary.currentValue || 0)}</p>
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
            <span className="text-3xl">💵</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Invested Value</p>
              <p className="text-2xl font-bold text-accent-warning">{formatCurrency(overallSummary.investedValue || 0)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass-effect rounded-xl p-6 border-2 ${(overallSummary.absoluteReturn || 0) >= 0 ? 'border-accent-success/30' : 'border-accent-danger/30'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{(overallSummary.absoluteReturn || 0) >= 0 ? '📈' : '📉'}</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Absolute Return</p>
              <p className={`text-2xl font-bold ${(overallSummary.absoluteReturn || 0) >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {formatCurrency(overallSummary.absoluteReturn || 0)}
              </p>
              <p className={`text-xs ${(overallSummary.absoluteReturnPercentage || 0) >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {overallSummary.absoluteReturnPercentage !== undefined 
                  ? `${overallSummary.absoluteReturnPercentage >= 0 ? '+' : ''}${overallSummary.absoluteReturnPercentage.toFixed(2)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-secondary/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💼</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Total Holdings</p>
              <p className="text-2xl font-bold text-accent-secondary">{overallSummary.totalHoldings || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overallSummary.xirr !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6 border border-accent-primary/20"
          >
            <p className="text-xs text-dark-textSecondary mb-1">XIRR</p>
            <p className="text-xl font-bold text-accent-primary">{overallSummary.xirr.toFixed(2)}%</p>
          </motion.div>
        )}
        {overallSummary.dailyReturns !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6 border border-accent-success/20"
          >
            <p className="text-xs text-dark-textSecondary mb-1">Daily Returns</p>
            <p className="text-xl font-bold text-accent-success">{formatCurrency(overallSummary.dailyReturns)}</p>
            {overallSummary.dailyReturnsPercent !== undefined && (
              <p className="text-xs text-accent-success mt-1">
                {overallSummary.dailyReturnsPercent >= 0 ? '+' : ''}{overallSummary.dailyReturnsPercent.toFixed(2)}%
              </p>
            )}
          </motion.div>
        )}
        {overallSummary.pan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6 border border-accent-secondary/20"
          >
            <p className="text-xs text-dark-textSecondary mb-1">PAN</p>
            <p className="text-lg font-bold text-dark-text font-mono">{overallSummary.pan}</p>
          </motion.div>
        )}
        {overallSummary.mobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6 border border-accent-secondary/20"
          >
            <p className="text-xs text-dark-textSecondary mb-1">Mobile</p>
            <p className="text-lg font-bold text-dark-text">{overallSummary.mobile}</p>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'holdings', label: `Holdings (${holdings.length})`, icon: '💼' },
          { id: 'all-data', label: 'All Data', icon: '📋' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent-primary text-white shadow-lg'
                : 'glass-effect text-dark-text hover:border-accent-primary/50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Category Distribution */}
          {overallSummary.categoryDistribution && overallSummary.categoryDistribution.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-xl p-6 border border-accent-primary/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
                  <span>📂</span> Category Distribution
                </h4>
                <button
                  onClick={() => toggleDistribution('category')}
                  className="text-xs text-accent-primary hover:text-accent-primary/80"
                >
                  {expandedDistributions.has('category') ? '▼ Collapse' : '▶ Expand All'}
                </button>
              </div>
              <div className="space-y-3">
                {overallSummary.categoryDistribution.map((cat: any, idx: number) => {
                  const maxValue = Math.max(...overallSummary.categoryDistribution.map((c: any) => c.totalCurrentValue || 0));
                  const percentage = maxValue > 0 ? ((cat.totalCurrentValue || 0) / maxValue) * 100 : 0;
                  
                  return (
                    <div key={idx} className="glass-effect rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-dark-text">{cat.category || 'Unknown'}</p>
                          <p className="text-xs text-dark-textSecondary">{cat.totalFunds || 0} fund(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent-success">{formatCurrency(cat.totalCurrentValue || 0)}</p>
                          <p className="text-xs text-dark-textSecondary">{cat.percentage?.toFixed(2) || 0}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-dark-border rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Subcategory Distribution */}
          {overallSummary.subCategoryDistribution && overallSummary.subCategoryDistribution.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-xl p-6 border border-accent-secondary/20"
            >
              <h4 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
                <span>📊</span> Subcategory Distribution
              </h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overallSummary.subCategoryDistribution.map((sub: any, idx: number) => (
                  <div key={idx} className="glass-effect rounded-lg p-3">
                    <p className="text-xs font-semibold text-dark-textSecondary mb-1">{sub.subCategory || 'Unknown'}</p>
                    <p className="text-sm font-bold text-dark-text">{formatCurrency(sub.totalCurrentValue || 0)}</p>
                    <p className="text-xs text-dark-textSecondary">{sub.totalFunds || 0} funds • {sub.percentage?.toFixed(2) || 0}%</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Market Cap Distribution */}
          {overallSummary.mutualFundsMarketCapDistribution && overallSummary.mutualFundsMarketCapDistribution.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-xl p-6 border border-accent-warning/20"
            >
              <h4 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
                <span>📈</span> Market Cap Distribution
              </h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overallSummary.mutualFundsMarketCapDistribution.map((cap: any, idx: number) => (
                  <div key={idx} className="glass-effect rounded-lg p-3">
                    <p className="text-xs font-semibold text-dark-textSecondary mb-1">{cap.marketCap || 'Unknown'}</p>
                    <p className="text-sm font-bold text-dark-text">{formatCurrency(cap.totalCurrentValue || 0)}</p>
                    <p className="text-xs text-dark-textSecondary">{cap.totalFunds || 0} funds • {cap.percentage?.toFixed(2) || 0}%</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AMC Distribution */}
          {overallSummary.mutualFundsAmcDistribution && overallSummary.mutualFundsAmcDistribution.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-xl p-6 border border-accent-primary/20"
            >
              <h4 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
                <span>🏢</span> AMC Distribution
              </h4>
              <div className="space-y-3">
                {overallSummary.mutualFundsAmcDistribution.map((amc: any, idx: number) => {
                  const maxValue = Math.max(...overallSummary.mutualFundsAmcDistribution.map((a: any) => a.totalCurrentValue || 0));
                  const percentage = maxValue > 0 ? ((amc.totalCurrentValue || 0) / maxValue) * 100 : 0;
                  
                  return (
                    <div key={idx} className="glass-effect rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-dark-text">{amc.amc || 'Unknown'}</p>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent-success">{formatCurrency(amc.totalCurrentValue || 0)}</p>
                          <p className="text-xs text-dark-textSecondary">{amc.percentage?.toFixed(2) || 0}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-dark-border rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full h-2"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-dark-textSecondary mt-1">{amc.totalFunds || 0} fund(s)</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Sector Distribution */}
          {overallSummary.mutualFundsSectorDistribution && overallSummary.mutualFundsSectorDistribution.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-xl p-6 border border-accent-success/20"
            >
              <h4 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
                <span>🏭</span> Sector Distribution
              </h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overallSummary.mutualFundsSectorDistribution.map((sector: any, idx: number) => (
                  <div key={idx} className="glass-effect rounded-lg p-3">
                    <p className="text-xs font-semibold text-dark-textSecondary mb-1">{sector.sector || 'Unknown'}</p>
                    <p className="text-sm font-bold text-dark-text">{formatCurrency(sector.totalCurrentValue || 0)}</p>
                    <p className="text-xs text-dark-textSecondary">{sector.totalFunds || 0} funds • {sector.percentage?.toFixed(2) || 0}%</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Holdings Tab */}
      {activeTab === 'holdings' && (
        <div className="space-y-4">
          {holdings.length > 0 ? (
            holdings.map((holding: any, idx: number) => {
              const isExpanded = expandedHoldings.has(idx);
              const gainLoss = (holding.currentValue || 0) - (holding.investedValue || 0);
              const gainLossPercent = (holding.investedValue || 0) > 0 
                ? ((gainLoss / (holding.investedValue || 1)) * 100) 
                : 0;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-effect rounded-xl p-6 border border-accent-primary/20 hover:border-accent-primary/50 transition-all"
                >
                  <button
                    onClick={() => toggleHolding(idx)}
                    className="w-full text-left mb-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-dark-text mb-2">
                          {holding.fundName || holding.isin || 'Unknown Fund'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {holding.isin && (
                            <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded font-mono">
                              {holding.isin}
                            </span>
                          )}
                          {holding.category && (
                            <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                              {holding.category}
                            </span>
                          )}
                          {holding.subcategory && (
                            <span className="text-xs px-2 py-1 bg-accent-warning/20 text-accent-warning rounded">
                              {holding.subcategory}
                            </span>
                          )}
                          {holding.amcName && (
                            <span className="text-xs px-2 py-1 bg-accent-success/20 text-accent-success rounded">
                              {holding.amcName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-dark-textSecondary mb-1">Current Value</p>
                        <p className="text-2xl font-bold gradient-text">{formatCurrency(holding.currentValue || 0)}</p>
                        {holding.investedValue !== undefined && (
                          <div className="mt-1">
                            <p className="text-xs text-dark-textSecondary">Invested: {formatCurrency(holding.investedValue)}</p>
                            <p className={`text-sm font-semibold ${gainLoss >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                              {gainLoss >= 0 ? '▲' : '▼'} {Math.abs(gainLossPercent).toFixed(2)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Quick Stats */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {holding.totalUnits !== undefined && (
                      <div className="glass-effect rounded-lg p-3">
                        <p className="text-xs text-dark-textSecondary mb-1">Total Units</p>
                        <p className="text-sm font-bold text-dark-text">{holding.totalUnits.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                    {holding.currentNav !== undefined && (
                      <div className="glass-effect rounded-lg p-3">
                        <p className="text-xs text-dark-textSecondary mb-1">Current NAV</p>
                        <p className="text-sm font-bold text-accent-success">{formatCurrency(holding.currentNav)}</p>
                      </div>
                    )}
                    {holding.xirr !== undefined && (
                      <div className="glass-effect rounded-lg p-3">
                        <p className="text-xs text-dark-textSecondary mb-1">XIRR</p>
                        <p className="text-sm font-bold text-accent-primary">{holding.xirr.toFixed(2)}%</p>
                      </div>
                    )}
                    {holding.dailyReturnsPercent !== undefined && (
                      <div className="glass-effect rounded-lg p-3">
                        <p className="text-xs text-dark-textSecondary mb-1">Daily Returns</p>
                        <p className={`text-sm font-bold ${holding.dailyReturnsPercent >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                          {holding.dailyReturnsPercent >= 0 ? '+' : ''}{holding.dailyReturnsPercent.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Per Folio Holdings */}
                  {holding.perFolioHoldingInsights && holding.perFolioHoldingInsights.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
                        <span>📁</span> Per Folio Holdings ({holding.perFolioHoldingInsights.length})
                      </h5>
                      <div className="space-y-3">
                        {holding.perFolioHoldingInsights.map((folio: any, folioIdx: number) => (
                          <div key={folioIdx} className="glass-effect rounded-lg p-4 border border-accent-primary/20">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-semibold text-dark-text">Folio: {folio.folio || 'Unknown'}</p>
                                {folio.brokerName && (
                                  <p className="text-xs text-dark-textSecondary">Broker: {folio.brokerName}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-accent-success">{formatCurrency(folio.currentValue || 0)}</p>
                                {folio.absoluteReturnPercentage !== undefined && (
                                  <p className={`text-xs ${folio.absoluteReturnPercentage >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                                    {folio.absoluteReturnPercentage >= 0 ? '+' : ''}{folio.absoluteReturnPercentage.toFixed(2)}%
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-2">
                              {folio.totalUnits !== undefined && (
                                <div>
                                  <p className="text-xs text-dark-textSecondary">Units</p>
                                  <p className="text-sm font-bold text-dark-text">{folio.totalUnits.toLocaleString('en-IN')}</p>
                                </div>
                              )}
                              {folio.averageNav !== undefined && (
                                <div>
                                  <p className="text-xs text-dark-textSecondary">Avg NAV</p>
                                  <p className="text-sm font-bold text-accent-success">{formatCurrency(folio.averageNav)}</p>
                                </div>
                              )}
                              {folio.xirr !== undefined && (
                                <div>
                                  <p className="text-xs text-dark-textSecondary">XIRR</p>
                                  <p className="text-sm font-bold text-accent-primary">{folio.xirr.toFixed(2)}%</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-dark-border">
                      <h5 className="text-sm font-bold text-accent-primary mb-3">All Fields</h5>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(holding)
                          .filter(([key]) => key !== 'perFolioHoldingInsights')
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
                          {JSON.stringify(holding, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-center">
                    <button
                      onClick={() => toggleHolding(idx)}
                      className="text-xs text-accent-primary font-semibold hover:text-accent-primary/80 transition-colors"
                    >
                      {isExpanded ? '▲ Hide Details' : '▼ View All Fields & JSON'}
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12 text-dark-textSecondary">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-lg">No holdings data available</p>
            </div>
          )}
        </div>
      )}

      {/* All Data Tab */}
      {activeTab === 'all-data' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border border-accent-primary/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-dark-text flex items-center gap-2">
              <span>📋</span> Complete API Response Data
            </h4>
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="px-4 py-2 bg-accent-primary/20 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-all text-sm font-semibold"
            >
              {showRawData ? 'Hide' : 'Show'} Raw JSON
            </button>
          </div>

          {/* All Other Fields */}
          <div className="space-y-6 mb-6">
            <div>
              <h5 className="text-sm font-bold text-accent-primary mb-3">All Response Fields</h5>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(data)
                  .filter(([key]) => !['overallSummary', 'holdings'].includes(key))
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
          </div>

          {/* Raw JSON View */}
          {showRawData && (
            <div className="mt-6 pt-6 border-t border-dark-border">
              <h5 className="text-sm font-bold text-accent-primary mb-3">Raw JSON Response</h5>
              <pre className="text-xs text-dark-text overflow-x-auto bg-dark-border/20 rounded-lg p-4 max-h-96 overflow-y-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

