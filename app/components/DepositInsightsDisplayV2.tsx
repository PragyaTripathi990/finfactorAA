'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface DepositInsightsDisplayProps {
  data: any;
}

export default function DepositInsightsDisplay({ data }: DepositInsightsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'balance' | 'incoming' | 'outgoing'>('overview');
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());

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

  // Format date range
  const formatDateRange = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const monthName = fromDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return monthName;
  };

  // Calculate totals
  const totalBalance = balance.reduce((sum: number, item: any) => sum + (parseFloat(item.avg) || 0), 0);
  const totalIncoming = incoming.reduce((sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0);
  const totalOutgoing = outgoing.reduce((sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0);
  const netCashFlow = totalIncoming - totalOutgoing;

  // Get latest balance
  const latestBalance = balance.length > 0 ? balance[balance.length - 1] : null;
  const currentBalance = latestBalance?.endOfPeriod || 0;

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg">
              💰
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-textSecondary">Current Balance</p>
              <p className="text-2xl font-bold gradient-text">{formatCurrency(currentBalance)}</p>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">{balance.length} months tracked</p>
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
          <p className="text-xs text-dark-textSecondary mt-2">{incoming.filter((i: any) => i.total > 0).length} months active</p>
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
          <p className="text-xs text-dark-textSecondary mt-2">{outgoing.filter((o: any) => o.total > 0).length} months active</p>
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
              Balance Trend (Last 12 Months)
            </h4>
            <div className="space-y-4">
              {balance.slice(0, 12).map((month: any, idx: number) => {
                const maxAmount = Math.max(...balance.map((b: any) => b.max || 0));
                const percentage = maxAmount > 0 ? (month.avg / maxAmount) * 100 : 0;
                const change = month.valueChange || 0;
                const percentChange = month.percentChange || 0;
                
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-dark-text">
                        {formatDateRange(month.from, month.to)}
                      </span>
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
                
                const sorted = (Object.values(grouped) as Array<{ type: string; value: number; txnCount: number }>).sort((a, b) => (b?.value || 0) - (a?.value || 0)).slice(0, 5);
                const maxValue = sorted[0]?.value || 1;
                
                return (
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
                
                const sorted = (Object.values(grouped) as Array<{ type: string; value: number; txnCount: number }>).sort((a, b) => (b?.value || 0) - (a?.value || 0)).slice(0, 5);
                const maxValue = sorted[0]?.value || 1;
                
                return (
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
                );
              })()}
            </motion.div>
          </div>
        </div>
      )}

      {/* Balance Tab */}
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
                        {formatDateRange(month.from, month.to)}
                      </h4>
                      <p className="text-sm text-dark-textSecondary">
                        {month.hasFullPeriodData ? 'Full month data' : 'Partial data'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-dark-textSecondary mb-1">Average Balance</p>
                      <p className="text-2xl font-bold gradient-text">{formatCurrency(month.avg)}</p>
                      {change !== 0 && (
                        <p className={`text-sm font-medium mt-1 ${change >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                          {change >= 0 ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Start</p>
                      <p className="text-sm font-bold text-dark-text">{formatCurrency(month.startOfPeriod)}</p>
                    </div>
                    <div className="text-center glass-effect rounded-lg p-3 border-2 border-accent-warning/30">
                      <p className="text-xs text-dark-textSecondary mb-1">Min - Max</p>
                      <p className="text-sm font-bold text-accent-warning">
                        {formatCurrency(month.min)} - {formatCurrency(month.max)}
                      </p>
                    </div>
                    <div className="text-center glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">End</p>
                      <p className="text-sm font-bold text-dark-text">{formatCurrency(month.endOfPeriod)}</p>
                    </div>
                  </div>
                </button>

                <div className="mt-3 text-center">
                  <span className="text-xs text-accent-primary font-semibold">
                    {isExpanded ? '▲ Hide Details' : '▼ View Full Details'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <pre className="text-xs text-dark-text overflow-x-auto bg-dark-border/20 rounded-lg p-4">
                      {JSON.stringify(month, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Incoming Tab */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {incoming.filter((m: any) => m.total > 0).map((month: any, idx: number) => {
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
                      {formatDateRange(month.from, month.to)}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dark-textSecondary mb-1">Total Incoming</p>
                    <p className="text-3xl font-bold text-accent-success">{formatCurrency(month.total)}</p>
                  </div>
                </div>

                {/* Category Split */}
                {month.categorySplit && month.categorySplit.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-accent-success mb-3">By Category</h5>
                    <div className="space-y-2">
                      {month.categorySplit.map((cat: any, catIdx: number) => (
                        <div key={catIdx} className="glass-effect rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-sm font-semibold text-dark-text">{cat.type}</p>
                              <p className="text-xs text-dark-textSecondary">{cat.txnCount} transaction{cat.txnCount !== 1 ? 's' : ''}</p>
                            </div>
                            <p className="text-lg font-bold text-accent-success">{formatCurrency(cat.value)}</p>
                          </div>
                          {/* Subcategories */}
                          {cat.subCategorySplit && cat.subCategorySplit.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-accent-success/30 space-y-1">
                              {cat.subCategorySplit.map((sub: any, subIdx: number) => (
                                <div key={subIdx} className="flex justify-between text-xs">
                                  <span className="text-dark-textSecondary">{sub.type}</span>
                                  <span className="text-dark-text font-medium">{formatCurrency(sub.value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode Split */}
                {month.modeSplit && month.modeSplit.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <h5 className="text-sm font-bold text-accent-success mb-3">By Payment Mode</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {month.modeSplit.map((mode: any, modeIdx: number) => (
                        <div key={modeIdx} className="glass-effect rounded-lg p-3 text-center">
                          <p className="text-xs text-dark-textSecondary mb-1">{mode.type}</p>
                          <p className="text-sm font-bold text-dark-text">{formatCurrency(mode.value)}</p>
                          <p className="text-xs text-dark-textSecondary">{mode.txnCount} txn</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => toggleMonth(idx + 1000)}
                  className="w-full mt-4 text-center text-xs font-semibold text-accent-primary"
                >
                  {isExpanded ? '▲ Hide JSON' : '▼ View JSON'}
                </button>

                {isExpanded && (
                  <div className="mt-3">
                    <pre className="text-xs text-dark-text overflow-x-auto bg-dark-border/20 rounded-lg p-4">
                      {JSON.stringify(month, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Outgoing Tab */}
      {activeTab === 'outgoing' && (
        <div className="space-y-4">
          {outgoing.filter((m: any) => m.total > 0).map((month: any, idx: number) => {
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
                      {formatDateRange(month.from, month.to)}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dark-textSecondary mb-1">Total Outgoing</p>
                    <p className="text-3xl font-bold text-accent-danger">{formatCurrency(month.total)}</p>
                  </div>
                </div>

                {/* Category Split */}
                {month.categorySplit && month.categorySplit.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-accent-danger mb-3">By Category</h5>
                    <div className="space-y-2">
                      {month.categorySplit.map((cat: any, catIdx: number) => (
                        <div key={catIdx} className="glass-effect rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-sm font-semibold text-dark-text">{cat.type}</p>
                              <p className="text-xs text-dark-textSecondary">{cat.txnCount} transaction{cat.txnCount !== 1 ? 's' : ''}</p>
                            </div>
                            <p className="text-lg font-bold text-accent-danger">{formatCurrency(cat.value)}</p>
                          </div>
                          {/* Subcategories */}
                          {cat.subCategorySplit && cat.subCategorySplit.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-accent-danger/30 space-y-1">
                              {cat.subCategorySplit.map((sub: any, subIdx: number) => (
                                <div key={subIdx} className="flex justify-between text-xs">
                                  <span className="text-dark-textSecondary">{sub.type}</span>
                                  <span className="text-dark-text font-medium">{formatCurrency(sub.value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode Split */}
                {month.modeSplit && month.modeSplit.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <h5 className="text-sm font-bold text-accent-danger mb-3">By Payment Mode</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {month.modeSplit.map((mode: any, modeIdx: number) => (
                        <div key={modeIdx} className="glass-effect rounded-lg p-3 text-center">
                          <p className="text-xs text-dark-textSecondary mb-1">{mode.type}</p>
                          <p className="text-sm font-bold text-dark-text">{formatCurrency(mode.value)}</p>
                          <p className="text-xs text-dark-textSecondary">{mode.txnCount} txn</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => toggleMonth(idx + 2000)}
                  className="w-full mt-4 text-center text-xs font-semibold text-accent-primary"
                >
                  {isExpanded ? '▲ Hide JSON' : '▼ View JSON'}
                </button>

                {isExpanded && (
                  <div className="mt-3">
                    <pre className="text-xs text-dark-text overflow-x-auto bg-dark-border/20 rounded-lg p-4">
                      {JSON.stringify(month, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

