'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface EquitiesAccountStatementDisplayProps {
  data: any;
}

export default function EquitiesAccountStatementDisplay({ data }: EquitiesAccountStatementDisplayProps) {
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle array of transactions - must be before useMemo
  let transactions: any[] = [];
  if (data) {
    if (Array.isArray(data)) {
      transactions = data;
    } else if (data.data && Array.isArray(data.data)) {
      transactions = data.data;
    } else if (data.transactions && Array.isArray(data.transactions)) {
      transactions = data.transactions;
    } else {
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayKeys.length > 0) {
        transactions = data[arrayKeys[0]];
      }
    }
  }

  // Filter transactions - must be before any early returns
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter((txn: any) => {
        const txnType = (txn.type || txn.transactionType || '').toUpperCase();
        return txnType === filterType;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((txn: any) => {
        const txnString = JSON.stringify(txn).toLowerCase();
        return txnString.includes(query);
      });
    }

    return filtered;
  }, [transactions, filterType, searchQuery]);

  // Get unique transaction types - must be before early returns
  const transactionTypes = useMemo(() => {
    const types = new Set<string>();
    transactions.forEach((txn: any) => {
      const type = txn.type || txn.transactionType || 'UNKNOWN';
      types.add(type.toUpperCase());
    });
    return Array.from(types);
  }, [transactions]);

  // Early return after all hooks
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No equities account statement data available</p>
      </div>
    );
  }

  // Early return after hooks
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No transactions found</p>
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

  // Toggle transaction expansion
  const toggleTransaction = (index: number) => {
    const newSet = new Set(expandedTransactions);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedTransactions(newSet);
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
    if (lowerKey.includes('amount') || lowerKey.includes('value') || lowerKey.includes('price') || lowerKey.includes('units') || lowerKey.includes('balance')) {
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

  // Calculate totals
  const totalBuys = filteredTransactions
    .filter((txn: any) => (txn.type || txn.transactionType || '').toUpperCase().includes('BUY'))
    .reduce((sum: number, txn: any) => sum + (parseFloat(txn.amount || txn.value || 0) || 0), 0);
  
  const totalSells = filteredTransactions
    .filter((txn: any) => (txn.type || txn.transactionType || '').toUpperCase().includes('SELL'))
    .reduce((sum: number, txn: any) => sum + (parseFloat(txn.amount || txn.value || 0) || 0), 0);

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
              <p className="text-xs text-dark-textSecondary">Total Transactions</p>
              <p className="text-2xl font-bold text-dark-text">{filteredTransactions.length}</p>
              <p className="text-xs text-dark-textSecondary mt-1">of {transactions.length} total</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-success/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⬇️</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Total Buys</p>
              <p className="text-2xl font-bold text-accent-success">{formatCurrency(totalBuys)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-danger/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⬆️</span>
            <div>
              <p className="text-xs text-dark-textSecondary">Total Sells</p>
              <p className="text-2xl font-bold text-accent-danger">{formatCurrency(totalSells)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <input
                type="text"
                placeholder="Search transactions, ISIN, issuer name, narration..."
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
          </div>
          <div className="flex gap-2">
            {['ALL', ...transactionTypes].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterType === type
                    ? 'bg-accent-primary text-white'
                    : 'glass-effect text-dark-text hover:border-accent-primary/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">No transactions found matching your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((txn: any, idx: number) => {
            const isExpanded = expandedTransactions.has(idx);
            const txnType = (txn.type || txn.transactionType || 'UNKNOWN').toUpperCase();
            const isBuy = txnType.includes('BUY');
            const amount = parseFloat(txn.amount || txn.value || (txn.price || 0) * (txn.units || 0) || 0);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`glass-effect rounded-xl p-6 border-2 ${
                  isBuy ? 'border-accent-success/30' : 'border-accent-danger/30'
                } hover:border-accent-primary/50 transition-all`}
              >
                <button
                  onClick={() => toggleTransaction(idx)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-2xl ${isBuy ? 'text-accent-success' : 'text-accent-danger'}`}>
                          {isBuy ? '⬇️' : '⬆️'}
                        </span>
                        <div>
                          <h4 className="text-lg font-bold text-dark-text">
                            {txn.issuerName || txn.isinDescription || txn.narration || txn.isin || 'Transaction'}
                          </h4>
                          {txn.isin && (
                            <p className="text-xs text-dark-textSecondary font-mono mt-1">ISIN: {txn.isin}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          isBuy ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-danger/20 text-accent-danger'
                        }`}>
                          {txnType}
                        </span>
                        {txn.transactionDateTime && (
                          <span className="text-xs px-2 py-1 bg-dark-border text-dark-textSecondary rounded">
                            {formatDate(txn.transactionDateTime)}
                          </span>
                        )}
                        {txn.brokerId && (
                          <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                            {txn.brokerId}
                          </span>
                        )}
                        {txn.units && (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded">
                            {txn.units} Units
                          </span>
                        )}
                        {txn.price && (
                          <span className="text-xs px-2 py-1 bg-accent-warning/20 text-accent-warning rounded">
                            Price: {formatCurrency(txn.price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold gradient-text">{formatCurrency(amount)}</p>
                      <span className="text-xs text-dark-textSecondary block mt-2">
                        {isExpanded ? '▼ Hide Details' : '▶ Show All Fields'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-4 border-t border-dark-border">
                    <h5 className="text-sm font-bold text-accent-primary mb-3">All Transaction Fields</h5>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(txn).map(([key, value]) => (
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
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

