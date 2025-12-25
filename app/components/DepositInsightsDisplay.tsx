'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface DepositInsightsDisplayProps {
  data: any;
}

export default function DepositInsightsDisplay({ data }: DepositInsightsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'balance' | 'incoming' | 'outgoing' | 'all-data'>('overview');
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [showRawData, setShowRawData] = useState(false);

  console.log('DepositInsightsDisplay received data:', data);

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No deposit insights available</p>
      </div>
    );
  }

  const accountIds = data.accountIds || [];
  const balance = data.balance || [];
  const incoming = data.incoming || [];
  const outgoing = data.outgoing || [];

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
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date range
  const formatDateRange = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const fromStr = fromDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    const toStr = toDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fromStr} - ${toStr}`;
  };

  // Format month name
  const formatMonthName = (from: string) => {
    const fromDate = new Date(from);
    return fromDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Calculate totals
  const totalBalance = balance.reduce((sum: number, item: any) => sum + (parseFloat(item.avg) || 0), 0);
  const totalIncoming = incoming.reduce((sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0);
  const totalOutgoing = outgoing.reduce((sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0);
  const netCashFlow = totalIncoming - totalOutgoing;
  const avgBalance = balance.length > 0 ? totalBalance / balance.length : 0;

  // Get latest balance
  const latestBalance = balance.length > 0 ? balance[balance.length - 1] : null;
  const currentBalance = latestBalance?.endOfPeriod || 0;

  // Get date range from data
  const firstDate = balance.length > 0 ? balance[0]?.from : null;
  const lastDate = balance.length > 0 ? balance[balance.length - 1]?.to : null;

  // Toggle month expansion
  const toggleMonth = (index: number) => {
    const newSet = new Set(expandedMonths);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedMonths(newSet);
  };

  // Render field value helper
  const renderField = (key: string, value: any, level: number = 0) => {
    if (value === null || value === undefined) {
      return <span className="text-dark-textSecondary italic">—</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-dark-textSecondary text-sm">Empty array</span>;
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
    if (lowerKey.includes('balance') || lowerKey.includes('amount') || lowerKey.includes('value') || lowerKey.includes('total')) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        return <span className="text-accent-success font-semibold">{formatCurrency(value)}</span>;
      }
    }

    if (lowerKey.includes('date') || lowerKey.includes('time')) {
      return <span className="text-dark-text">{formatDate(String(value))}</span>;
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
      {/* Header with Account IDs and Date Range */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
              <span>🏦</span> Account IDs
            </h3>
            <div className="flex flex-wrap gap-2">
              {accountIds.length > 0 ? (
                accountIds.map((id: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-lg text-sm font-mono"
                  >
                    {id}
                  </span>
                ))
              ) : (
                <span className="text-dark-textSecondary text-sm">No account IDs</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
              <span>📅</span> Date Range
            </h3>
            <p className="text-dark-text">
              {firstDate && lastDate ? formatDateRange(firstDate, lastDate) : '—'}
            </p>
            <p className="text-xs text-dark-textSecondary mt-1">
              {balance.length} month{balance.length !== 1 ? 's' : ''} of data
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg">
              💰
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-textSecondary">Current Balance</p>
              <p className="text-2xl font-bold gradient-text">{formatCurrency(currentBalance)}</p>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">
            Avg: {formatCurrency(avgBalance)} • {balance.length} months
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-success/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-2xl shadow-lg">
              ⬇️
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-textSecondary">Total Incoming</p>
              <p className="text-2xl font-bold text-accent-success">{formatCurrency(totalIncoming)}</p>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">
            {incoming.filter((i: any) => i.total > 0).length} active month{incoming.filter((i: any) => i.total > 0).length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-danger/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-2xl shadow-lg">
              ⬆️
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-textSecondary">Total Outgoing</p>
              <p className="text-2xl font-bold text-accent-danger">{formatCurrency(totalOutgoing)}</p>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">
            {outgoing.filter((o: any) => o.total > 0).length} active month{outgoing.filter((o: any) => o.total > 0).length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`glass-effect rounded-xl p-6 border-2 ${netCashFlow >= 0 ? 'border-accent-success/30' : 'border-accent-danger/30'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${netCashFlow >= 0 ? 'from-teal-500 to-teal-600' : 'from-orange-500 to-orange-600'} flex items-center justify-center text-2xl shadow-lg`}>
              {netCashFlow >= 0 ? '📈' : '📉'}
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-textSecondary">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {formatCurrency(netCashFlow)}
              </p>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">
            {netCashFlow >= 0 ? 'Positive savings' : 'Deficit'}
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'balance', label: `Balance (${balance.length})`, icon: '💰' },
          { id: 'incoming', label: `Incoming (${incoming.filter((i: any) => i.total > 0).length})`, icon: '⬇️' },
          { id: 'outgoing', label: `Outgoing (${outgoing.filter((o: any) => o.total > 0).length})`, icon: '⬆️' },
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
          {/* Balance Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6 border border-accent-primary/20"
          >
            <h4 className="text-lg font-bold text-dark-text mb-6 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Balance Trend
            </h4>
            <div className="space-y-4">
              {balance.map((month: any, idx: number) => {
                const maxAmount = Math.max(...balance.map((b: any) => b.max || 0));
                const percentage = maxAmount > 0 ? ((month.avg || 0) / maxAmount) * 100 : 0;
                const change = month.valueChange || 0;
                const percentChange = month.percentChange || 0;
                
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-semibold text-dark-text">
                          {formatMonthName(month.from)}
                        </span>
                        <span className="text-xs text-dark-textSecondary ml-2">
                          ({formatDateRange(month.from, month.to)})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-accent-primary mr-3">
                          {formatCurrency(month.avg)}
                        </span>
                        {change !== 0 && (
                          <span className={`text-xs font-medium ${change >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                            {change >= 0 ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-dark-border rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full h-3 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-dark-textSecondary mt-1">
                      <span>Min: {formatCurrency(month.min)}</span>
                      <span>Max: {formatCurrency(month.max)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Categories */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Incoming Categories */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-effect rounded-xl p-6 border border-accent-success/20"
            >
              <h4 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
                <span className="text-2xl">⬇️</span>
                Top Incoming Categories
              </h4>
              {(() => {
                const allIncomingCategories: any[] = [];
                incoming.forEach((month: any) => {
                  month.categorySplit?.forEach((cat: any) => {
                    allIncomingCategories.push(cat);
                  });
                });
                
                const grouped = allIncomingCategories.reduce((acc: any, cat: any) => {
                  if (!acc[cat.type]) {
                    acc[cat.type] = { type: cat.type, value: 0, txnCount: 0 };
                  }
                  acc[cat.type].value += cat.value || 0;
                  acc[cat.type].txnCount += cat.txnCount || 0;
                  return acc;
                }, {} as Record<string, { type: string; value: number; txnCount: number }>);
                
                const sorted = (Object.values(grouped) as Array<{ type: string; value: number; txnCount: number }>).sort((a, b) => b.value - a.value).slice(0, 5);
                const maxValue = sorted[0]?.value || 1;
                
                return sorted.length > 0 ? (
                  <div className="space-y-3">
                    {sorted.map((cat: any, idx: number) => (
                      <div key={idx} className="glass-effect rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-dark-text">{cat.type}</span>
                          <span className="text-sm font-bold text-accent-success">{formatCurrency(cat.value)}</span>
                        </div>
                        <div className="w-full bg-dark-border rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 rounded-full h-2"
                            style={{ width: `${(cat.value / maxValue) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-dark-textSecondary mt-1">{cat.txnCount} transactions</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-textSecondary text-sm">No incoming categories</p>
                );
              })()}
            </motion.div>

            {/* Top Outgoing Categories */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-effect rounded-xl p-6 border border-accent-danger/20"
            >
              <h4 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
                <span className="text-2xl">⬆️</span>
                Top Outgoing Categories
              </h4>
              {(() => {
                const allOutgoingCategories: any[] = [];
                outgoing.forEach((month: any) => {
                  month.categorySplit?.forEach((cat: any) => {
                    allOutgoingCategories.push(cat);
                  });
                });
                
                const grouped = allOutgoingCategories.reduce((acc: any, cat: any) => {
                  if (!acc[cat.type]) {
                    acc[cat.type] = { type: cat.type, value: 0, txnCount: 0 };
                  }
                  acc[cat.type].value += cat.value || 0;
                  acc[cat.type].txnCount += cat.txnCount || 0;
                  return acc;
                }, {} as Record<string, { type: string; value: number; txnCount: number }>);
                
                const sorted = (Object.values(grouped) as Array<{ type: string; value: number; txnCount: number }>).sort((a, b) => b.value - a.value).slice(0, 5);
                const maxValue = sorted[0]?.value || 1;
                
                return sorted.length > 0 ? (
                  <div className="space-y-3">
                    {sorted.map((cat: any, idx: number) => (
                      <div key={idx} className="glass-effect rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-dark-text">{cat.type}</span>
                          <span className="text-sm font-bold text-accent-danger">{formatCurrency(cat.value)}</span>
                        </div>
                        <div className="w-full bg-dark-border rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 rounded-full h-2"
                            style={{ width: `${(cat.value / maxValue) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-dark-textSecondary mt-1">{cat.txnCount} transactions</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-textSecondary text-sm">No outgoing categories</p>
                );
              })()}
            </motion.div>
          </div>
        </div>
      )}

      {/* Balance Tab - Enhanced with all fields */}
      {activeTab === 'balance' && (
        <div className="space-y-4">
          {balance.map((month: any, idx: number) => {
            const isExpanded = expandedMonths.has(idx);
            const change = month.valueChange || 0;
            const percentChange = month.percentChange || 0;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-effect rounded-xl p-6 border border-accent-primary/20 hover:border-accent-primary/50 transition-all"
              >
                <button
                  onClick={() => toggleMonth(idx)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-dark-text">
                        {formatMonthName(month.from)}
                      </h4>
                      <p className="text-sm text-dark-textSecondary">
                        {formatDateRange(month.from, month.to)}
                      </p>
                      {month.hasFullPeriodData !== undefined && (
                        <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          month.hasFullPeriodData 
                            ? 'bg-accent-success/20 text-accent-success' 
                            : 'bg-accent-warning/20 text-accent-warning'
                        }`}>
                          {month.hasFullPeriodData ? '✓ Full Period Data' : '⚠ Partial Data'}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-dark-textSecondary mb-1">Average Balance</p>
                      <p className="text-2xl font-bold gradient-text">{formatCurrency(month.avg)}</p>
                      {change !== 0 && (
                        <p className={`text-sm font-medium mt-1 ${change >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                          {change >= 0 ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}% ({formatCurrency(Math.abs(change))})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Start</p>
                      <p className="text-sm font-bold text-dark-text">{formatCurrency(month.startOfPeriod)}</p>
                    </div>
                    <div className="text-center glass-effect rounded-lg p-3 border-2 border-accent-warning/30">
                      <p className="text-xs text-dark-textSecondary mb-1">Min</p>
                      <p className="text-sm font-bold text-accent-warning">{formatCurrency(month.min)}</p>
                    </div>
                    <div className="text-center glass-effect rounded-lg p-3 border-2 border-accent-warning/30">
                      <p className="text-xs text-dark-textSecondary mb-1">Max</p>
                      <p className="text-sm font-bold text-accent-warning">{formatCurrency(month.max)}</p>
                    </div>
                    <div className="text-center glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">End</p>
                      <p className="text-sm font-bold text-dark-text">{formatCurrency(month.endOfPeriod)}</p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <h5 className="text-sm font-bold text-accent-primary mb-3">All Fields</h5>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(month).map(([key, value]) => (
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
                        {JSON.stringify(month, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-center">
                  <button
                    onClick={() => toggleMonth(idx)}
                    className="text-xs text-accent-primary font-semibold hover:text-accent-primary/80 transition-colors"
                  >
                    {isExpanded ? '▲ Hide Details' : '▼ View All Fields'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Incoming Tab - Enhanced */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incoming.length > 0 ? (
            incoming.map((month: any, idx: number) => {
              const isExpanded = expandedMonths.has(idx + 1000);
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-effect rounded-xl p-6 border border-accent-success/20 hover:border-accent-success/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-dark-text">
                        {formatMonthName(month.from)}
                      </h4>
                      <p className="text-sm text-dark-textSecondary">
                        {formatDateRange(month.from, month.to)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-dark-textSecondary mb-1">Total Incoming</p>
                      <p className="text-3xl font-bold text-accent-success">{formatCurrency(month.total)}</p>
                    </div>
                  </div>

                  {/* Category Split */}
                  {month.categorySplit && month.categorySplit.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-accent-success mb-3 flex items-center gap-2">
                        <span>📂</span> By Category ({month.categorySplit.length})
                      </h5>
                      <div className="space-y-3">
                        {month.categorySplit.map((cat: any, catIdx: number) => (
                          <div key={catIdx} className="glass-effect rounded-lg p-4 border border-accent-success/20">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="text-sm font-semibold text-dark-text">{cat.type || 'Unknown'}</p>
                                <p className="text-xs text-dark-textSecondary">{cat.txnCount || 0} transaction{(cat.txnCount || 0) !== 1 ? 's' : ''}</p>
                              </div>
                              <p className="text-lg font-bold text-accent-success">{formatCurrency(cat.value || 0)}</p>
                            </div>
                            {/* Subcategories */}
                            {cat.subCategorySplit && cat.subCategorySplit.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-dark-border/50">
                                <p className="text-xs font-semibold text-dark-textSecondary mb-2">Subcategories:</p>
                                <div className="space-y-2">
                                  {cat.subCategorySplit.map((sub: any, subIdx: number) => (
                                    <div key={subIdx} className="flex justify-between items-center pl-3 border-l-2 border-accent-success/30">
                                      <div>
                                        <span className="text-xs text-dark-text">{sub.type || 'Unknown'}</span>
                                        <span className="text-xs text-dark-textSecondary ml-2">({sub.txnCount || 0} txn)</span>
                                      </div>
                                      <span className="text-xs font-medium text-dark-text">{formatCurrency(sub.value || 0)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode Split */}
                  {month.modeSplit && month.modeSplit.length > 0 && (
                    <div className="mb-4 pt-4 border-t border-dark-border">
                      <h5 className="text-sm font-bold text-accent-success mb-3 flex items-center gap-2">
                        <span>💳</span> By Payment Mode ({month.modeSplit.length})
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {month.modeSplit.map((mode: any, modeIdx: number) => (
                          <div key={modeIdx} className="glass-effect rounded-lg p-3 text-center border border-accent-success/20">
                            <p className="text-xs text-dark-textSecondary mb-1">{mode.type || 'Unknown'}</p>
                            <p className="text-sm font-bold text-dark-text">{formatCurrency(mode.value || 0)}</p>
                            <p className="text-xs text-dark-textSecondary mt-1">{mode.txnCount || 0} txn</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Fields View */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-dark-border">
                      <h5 className="text-sm font-bold text-accent-primary mb-3">All Fields</h5>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {Object.entries(month)
                          .filter(([key]) => !['categorySplit', 'modeSplit'].includes(key))
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
                      <pre className="text-xs text-dark-text overflow-x-auto bg-dark-border/20 rounded-lg p-4">
                        {JSON.stringify(month, null, 2)}
                      </pre>
                    </div>
                  )}

                  <button
                    onClick={() => toggleMonth(idx + 1000)}
                    className="w-full mt-4 text-center text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors"
                  >
                    {isExpanded ? '▲ Hide All Fields' : '▼ View All Fields & JSON'}
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12 text-dark-textSecondary">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-lg">No incoming data available</p>
            </div>
          )}
        </div>
      )}

      {/* Outgoing Tab - Enhanced */}
      {activeTab === 'outgoing' && (
        <div className="space-y-4">
          {outgoing.length > 0 ? (
            outgoing.map((month: any, idx: number) => {
              const isExpanded = expandedMonths.has(idx + 2000);
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-effect rounded-xl p-6 border border-accent-danger/20 hover:border-accent-danger/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-dark-text">
                        {formatMonthName(month.from)}
                      </h4>
                      <p className="text-sm text-dark-textSecondary">
                        {formatDateRange(month.from, month.to)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-dark-textSecondary mb-1">Total Outgoing</p>
                      <p className="text-3xl font-bold text-accent-danger">{formatCurrency(month.total)}</p>
                    </div>
                  </div>

                  {/* Category Split */}
                  {month.categorySplit && month.categorySplit.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-accent-danger mb-3 flex items-center gap-2">
                        <span>📂</span> By Category ({month.categorySplit.length})
                      </h5>
                      <div className="space-y-3">
                        {month.categorySplit.map((cat: any, catIdx: number) => (
                          <div key={catIdx} className="glass-effect rounded-lg p-4 border border-accent-danger/20">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="text-sm font-semibold text-dark-text">{cat.type || 'Unknown'}</p>
                                <p className="text-xs text-dark-textSecondary">{cat.txnCount || 0} transaction{(cat.txnCount || 0) !== 1 ? 's' : ''}</p>
                              </div>
                              <p className="text-lg font-bold text-accent-danger">{formatCurrency(cat.value || 0)}</p>
                            </div>
                            {/* Subcategories */}
                            {cat.subCategorySplit && cat.subCategorySplit.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-dark-border/50">
                                <p className="text-xs font-semibold text-dark-textSecondary mb-2">Subcategories:</p>
                                <div className="space-y-2">
                                  {cat.subCategorySplit.map((sub: any, subIdx: number) => (
                                    <div key={subIdx} className="flex justify-between items-center pl-3 border-l-2 border-accent-danger/30">
                                      <div>
                                        <span className="text-xs text-dark-text">{sub.type || 'Unknown'}</span>
                                        <span className="text-xs text-dark-textSecondary ml-2">({sub.txnCount || 0} txn)</span>
                                      </div>
                                      <span className="text-xs font-medium text-dark-text">{formatCurrency(sub.value || 0)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode Split */}
                  {month.modeSplit && month.modeSplit.length > 0 && (
                    <div className="mb-4 pt-4 border-t border-dark-border">
                      <h5 className="text-sm font-bold text-accent-danger mb-3 flex items-center gap-2">
                        <span>💳</span> By Payment Mode ({month.modeSplit.length})
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {month.modeSplit.map((mode: any, modeIdx: number) => (
                          <div key={modeIdx} className="glass-effect rounded-lg p-3 text-center border border-accent-danger/20">
                            <p className="text-xs text-dark-textSecondary mb-1">{mode.type || 'Unknown'}</p>
                            <p className="text-sm font-bold text-dark-text">{formatCurrency(mode.value || 0)}</p>
                            <p className="text-xs text-dark-textSecondary mt-1">{mode.txnCount || 0} txn</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Fields View */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-dark-border">
                      <h5 className="text-sm font-bold text-accent-primary mb-3">All Fields</h5>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {Object.entries(month)
                          .filter(([key]) => !['categorySplit', 'modeSplit'].includes(key))
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
                      <pre className="text-xs text-dark-text overflow-x-auto bg-dark-border/20 rounded-lg p-4">
                        {JSON.stringify(month, null, 2)}
                      </pre>
                    </div>
                  )}

                  <button
                    onClick={() => toggleMonth(idx + 2000)}
                    className="w-full mt-4 text-center text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors"
                  >
                    {isExpanded ? '▲ Hide All Fields' : '▼ View All Fields & JSON'}
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12 text-dark-textSecondary">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-lg">No outgoing data available</p>
            </div>
          )}
        </div>
      )}

      {/* All Data Tab - Complete Raw Data View */}
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

          {/* Structured View */}
          <div className="space-y-6">
            {/* Account IDs Section */}
            <div>
              <h5 className="text-sm font-bold text-accent-primary mb-3">Account IDs</h5>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {accountIds.map((id: string, idx: number) => (
                  <div key={idx} className="glass-effect rounded-lg p-3">
                    <div className="text-xs font-semibold text-dark-textSecondary mb-1">Account ID {idx + 1}</div>
                    <div className="text-sm font-mono text-dark-text break-all">{id}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Statistics */}
            <div>
              <h5 className="text-sm font-bold text-accent-primary mb-3">Summary Statistics</h5>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">Balance Records</div>
                  <div className="text-lg font-bold text-dark-text">{balance.length}</div>
                </div>
                <div className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">Incoming Records</div>
                  <div className="text-lg font-bold text-dark-text">{incoming.length}</div>
                </div>
                <div className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">Outgoing Records</div>
                  <div className="text-lg font-bold text-dark-text">{outgoing.length}</div>
                </div>
                <div className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">Total Fields</div>
                  <div className="text-lg font-bold text-dark-text">
                    {Object.keys(data).length + balance.length * 10 + incoming.length * 5 + outgoing.length * 5}
                  </div>
                </div>
              </div>
            </div>

            {/* All Other Fields */}
            <div>
              <h5 className="text-sm font-bold text-accent-primary mb-3">All Response Fields</h5>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(data)
                  .filter(([key]) => !['accountIds', 'balance', 'incoming', 'outgoing'].includes(key))
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
