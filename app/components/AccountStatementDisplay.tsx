'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface AccountStatementDisplayProps {
  data: any;
}

export default function AccountStatementDisplay({ data }: AccountStatementDisplayProps) {
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No account statement data available</p>
        <p className="text-sm mt-2">Please check the browser console for errors</p>
      </div>
    );
  }

  // Handle array of transactions
  // API returns array directly, or wrapped in data property
  let transactions: any[] = [];
  if (Array.isArray(data)) {
    transactions = data;
  } else if (data.data && Array.isArray(data.data)) {
    transactions = data.data;
  } else if (data.transactions && Array.isArray(data.transactions)) {
    transactions = data.transactions;
  } else if (data.transactionList && Array.isArray(data.transactionList)) {
    transactions = data.transactionList;
  } else {
    // If it's an object, try to find any array property
    const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
    if (arrayKeys.length > 0) {
      transactions = data[arrayKeys[0]];
    }
  }
  
  // Debug: Log transaction structure to help identify issues
  if (transactions.length > 0) {
    console.log('📊 Transaction Sample:', JSON.stringify(transactions[0], null, 2));
    console.log('📊 Total Transactions:', transactions.length);
    console.log('📊 Transaction Types:', transactions.map((t: any) => t.type || 'NO_TYPE'));
    console.log('📊 Transaction Amounts:', transactions.map((t: any) => t.amount || t.transactionAmount || 'NO_AMOUNT'));
  }

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
    if (!amount) return '₹0.00';
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

  // Helper function to determine if transaction is credit
  const isCreditTransaction = (transaction: any): boolean => {
    // Check multiple possible fields and formats
    const type = transaction.type || transaction.transactionType || transaction.txnType || transaction.transactionTypeCode || '';
    const amount = parseFloat(transaction.amount || transaction.transactionAmount || transaction.amountValue || 0);
    
    // Check type field (case-insensitive)
    if (type && String(type).trim() !== '') {
      const upperType = String(type).toUpperCase().trim();
      if (upperType === 'CREDIT' || upperType === 'CR' || upperType === 'CREDIT_TRANSACTION' || upperType === 'IN' || upperType === 'CREDIT_TRANSFER') {
        return true;
      }
      if (upperType === 'DEBIT' || upperType === 'DR' || upperType === 'DEBIT_TRANSACTION' || upperType === 'OUT' || upperType === 'DEBIT_TRANSFER') {
        return false;
      }
    }
    
    // For RD, check if it's a deposit (credit) or withdrawal (debit)
    // Check narration or description for keywords
    const narration = String(transaction.narration || transaction.description || transaction.remarks || '').toUpperCase();
    if (narration.includes('DEPOSIT') || narration.includes('CREDIT') || narration.includes('INTEREST') || narration.includes('MATURITY')) {
      return true;
    }
    if (narration.includes('WITHDRAWAL') || narration.includes('DEBIT') || narration.includes('TDS') || narration.includes('DEDUCTION')) {
      return false;
    }
    
    // If no type field, check amount sign
    // For RD: positive amount usually means deposit (credit), negative means withdrawal (debit)
    // But also check if amount is negative - negative amounts are typically debits
    if (amount < 0) return false;
    if (amount > 0) return true;
    
    // Default: if amount is 0 or undefined, check other indicators
    // If there's a balance field, check if it increased or decreased
    if (transaction.balance !== undefined && transaction.previousBalance !== undefined) {
      const balance = parseFloat(transaction.balance) || 0;
      const prevBalance = parseFloat(transaction.previousBalance) || 0;
      return balance > prevBalance;
    }
    
    // Default: assume credit if amount is positive or zero
    return amount >= 0;
  };

  // Helper function to get transaction type for filtering
  const getTransactionType = (transaction: any): 'CREDIT' | 'DEBIT' => {
    return isCreditTransaction(transaction) ? 'CREDIT' : 'DEBIT';
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(transactions.map((t: any) => t.category))).sort();

  // Filter transactions
  const filteredTransactions = transactions.filter((t: any) => {
    const transactionType = getTransactionType(t);
    const typeMatch = filterType === 'ALL' || transactionType === filterType;
    const categoryMatch = filterCategory === 'ALL' || t.category === filterCategory;
    return typeMatch && categoryMatch;
  });

  // Calculate totals
  const totalCredits = filteredTransactions
    .filter((t: any) => isCreditTransaction(t))
    .reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount || t.transactionAmount || 0);
      return sum + Math.abs(amount);
    }, 0);
  
  const totalDebits = filteredTransactions
    .filter((t: any) => !isCreditTransaction(t))
    .reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount || t.transactionAmount || 0);
      return sum + Math.abs(amount);
    }, 0);

  const netAmount = totalCredits - totalDebits;

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
    if (value === null || value === undefined || value === '') {
      return <span className="text-dark-textSecondary italic">—</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-dark-textSecondary">Empty</span>;
      }
      return (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div key={idx} className="text-sm">
              {typeof item === 'object' ? (
                <div className="ml-4 border-l-2 border-accent-primary/30 pl-2">
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-dark-textSecondary font-medium">{k}: </span>
                      <span className="text-dark-text">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span>{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="ml-4 border-l-2 border-accent-primary/30 pl-2 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="text-dark-textSecondary font-medium">{k}: </span>
              <span className="text-dark-text">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('amount') || lowerKey.includes('balance')) {
      return <span className="font-semibold">{formatCurrency(value)}</span>;
    }

    if (lowerKey.includes('date') || lowerKey.includes('time')) {
      return <span>{formatDate(value)}</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-accent-success/20 text-accent-success' : 'bg-accent-danger/20 text-accent-danger'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    return <span className="break-words">{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
        >
          <div className="text-sm font-semibold text-dark-textSecondary mb-2">Total Transactions</div>
          <div className="text-2xl font-bold text-dark-text">{filteredTransactions.length}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-success/30"
        >
          <div className="text-sm font-semibold text-dark-textSecondary mb-2">Total Credits</div>
          <div className="text-2xl font-bold gradient-text">{formatCurrency(totalCredits)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-danger/30"
        >
          <div className="text-sm font-semibold text-dark-textSecondary mb-2">Total Debits</div>
          <div className="text-2xl font-bold text-accent-danger">{formatCurrency(totalDebits)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
        >
          <div className="text-sm font-semibold text-dark-textSecondary mb-2">Net Amount</div>
          <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
            {formatCurrency(netAmount)}
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="glass-effect rounded-xl p-4 border border-accent-primary/20">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-semibold text-dark-textSecondary mb-2 block">Filter by Type</label>
            <div className="flex gap-2">
              {(['ALL', 'CREDIT', 'DEBIT'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === type
                      ? 'bg-accent-primary text-white'
                      : 'bg-dark-border text-dark-text hover:bg-dark-border/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-dark-textSecondary mb-2 block">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 rounded-lg bg-dark-border text-dark-text border border-dark-border focus:border-accent-primary focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction: any, index: number) => {
          const isExpanded = expandedTransactions.has(index);
          const isCredit = isCreditTransaction(transaction);
          const amount = parseFloat(transaction.amount || transaction.transactionAmount || 0);
          const absAmount = Math.abs(amount);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`glass-effect rounded-xl p-5 border-2 transition-all ${
                isCredit
                  ? 'border-accent-success/30 hover:border-accent-success/50'
                  : 'border-accent-danger/30 hover:border-accent-danger/50'
              }`}
            >
              {/* Transaction Header */}
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  isCredit
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                    : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                }`}>
                  {isCredit ? '⬇' : '⬆'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-xl font-bold text-dark-text">
                          {transaction.category || 'Transaction'}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          isCredit
                            ? 'bg-accent-success text-white'
                            : 'bg-accent-danger text-white'
                        }`}>
                          {transaction.type || (isCredit ? 'CREDIT' : 'DEBIT')}
                        </span>
                      </div>
                      {transaction.subCategory && (
                        <p className="text-sm text-dark-textSecondary font-medium mb-2">
                          {transaction.subCategory}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-3xl font-bold ${
                        isCredit ? 'text-accent-success' : 'text-accent-danger'
                      }`}>
                        {isCredit ? '+' : '-'}{formatCurrency(absAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Narration */}
                  {transaction.narration && (
                    <div className="glass-effect rounded-lg p-3 mb-3">
                      <p className="text-sm text-dark-text">{transaction.narration}</p>
                    </div>
                  )}

                  {/* Transaction Details Grid */}
                  <div className="grid md:grid-cols-3 gap-3 mb-3">
                    {transaction.valueDate && (
                      <div className="glass-effect rounded-lg p-3">
                        <p className="text-xs font-semibold text-dark-textSecondary mb-1">Date</p>
                        <p className="text-sm font-medium text-dark-text">📅 {formatDate(transaction.valueDate)}</p>
                      </div>
                    )}
                    {transaction.mode && (
                      <div className="glass-effect rounded-lg p-3">
                        <p className="text-xs font-semibold text-dark-textSecondary mb-1">Mode</p>
                        <p className="text-sm font-medium text-dark-text">💳 {transaction.mode}</p>
                      </div>
                    )}
                    {transaction.currentBalance && (
                      <div className="glass-effect rounded-lg p-3 border-2 border-accent-primary/30">
                        <p className="text-xs font-semibold text-dark-textSecondary mb-1">Balance</p>
                        <p className="text-sm font-bold text-accent-primary">{formatCurrency(transaction.currentBalance)}</p>
                      </div>
                    )}
                  </div>

                  {/* Merchants */}
                  {transaction.merchants && transaction.merchants.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-dark-textSecondary mb-2">Merchants</p>
                      <div className="flex gap-2 flex-wrap">
                        {transaction.merchants.map((merchant: any, idx: number) => (
                          <div key={idx} className="glass-effect rounded-lg px-3 py-2 flex items-center gap-2">
                            <span className="text-sm">🏪</span>
                            <div>
                              <p className="text-sm font-semibold text-dark-text">{merchant.merchantName}</p>
                              {merchant.category && (
                                <p className="text-xs text-dark-textSecondary">{merchant.category}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleTransaction(index)}
                    className="w-full glass-effect rounded-lg p-3 hover:border-accent-primary/50 transition-all text-center"
                  >
                    <span className="text-sm font-semibold text-accent-primary">
                      {isExpanded ? '▲ Hide Details' : '▼ Show All Fields'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(transaction).map(([key, value]) => {
                      // Skip fields already shown in header
                      if (['category', 'type', 'amount', 'narration', 'valueDate', 'mode', 'txnMode', 'currentBalance'].includes(key)) {
                        return null;
                      }
                      
                      return (
                        <div key={key} className="glass-effect rounded-lg p-3">
                          <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                          </div>
                          <div className="text-sm">
                            {renderField(key, value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Raw JSON View */}
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-semibold text-accent-primary mb-2">
                        🔍 View Raw JSON
                      </summary>
                      <div className="mt-2 glass-effect rounded-lg p-4">
                        <pre className="text-xs text-dark-text overflow-x-auto">
                          {JSON.stringify(transaction, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="glass-effect rounded-xl p-4 border border-accent-primary/20">
        <div className="text-sm text-dark-textSecondary text-center">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>
    </div>
  );
}

