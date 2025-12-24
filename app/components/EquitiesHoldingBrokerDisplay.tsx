'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface EquitiesHoldingBrokerDisplayProps {
  data: any;
}

export default function EquitiesHoldingBrokerDisplay({ data }: EquitiesHoldingBrokerDisplayProps) {
  const [expandedHoldings, setExpandedHoldings] = useState<Set<string>>(new Set());
  const [expandedBrokers, setExpandedBrokers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Extract data - must be before useMemo
  const holdings = data?.holdings || [];

  // Filter holdings based on search query - must be before any early returns
  const filteredHoldings = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];
    if (!searchQuery.trim()) return holdings;
    
    const query = searchQuery.toLowerCase();
    return holdings.filter((holding: any) => {
      const holdingString = JSON.stringify(holding).toLowerCase();
      return holdingString.includes(query);
    });
  }, [holdings, searchQuery]);

  // Extract other data values after hooks
  const totalFiData = data?.totalFiData || 0;
  const currentValue = data?.currentValue || 0;
  const totalHoldings = data?.totalHoldings || 0;

  // Early return after all hooks
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No equities holding broker data available</p>
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

  // Toggle broker expansion
  const toggleBroker = (brokerId: string) => {
    const newSet = new Set(expandedBrokers);
    if (newSet.has(brokerId)) {
      newSet.delete(brokerId);
    } else {
      newSet.add(brokerId);
    }
    setExpandedBrokers(newSet);
  };

  // Render field value
  const renderField = (key: string, value: any, level: number = 0) => {
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
    if (lowerKey.includes('value') || lowerKey.includes('price') || lowerKey.includes('amount') || lowerKey.includes('cost')) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        return <span className="text-accent-success font-semibold">{formatCurrency(value)}</span>;
      }
    }

    if (lowerKey.includes('percent') || lowerKey.includes('percentage') || lowerKey.includes('weightage')) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        return <span className="text-accent-warning font-semibold">{Number(value).toFixed(2)}%</span>;
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
            placeholder="Search holdings, ISIN, issuer names, brokers..."
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
        {searchQuery && (
          <p className="text-xs text-dark-textSecondary mt-2">
            Found {filteredHoldings.length} holding(s) matching "{searchQuery}"
          </p>
        )}
      </motion.div>

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
              <p className="text-sm text-dark-textSecondary">Total FI Data</p>
              <p className="text-2xl font-bold text-dark-text">{totalFiData}</p>
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
            <span className="text-3xl">💰</span>
            <div>
              <p className="text-sm text-dark-textSecondary">Current Value</p>
              <p className="text-2xl font-bold gradient-text">{formatCurrency(currentValue)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6 border-2 border-accent-secondary/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💼</span>
            <div>
              <p className="text-sm text-dark-textSecondary">Total Holdings</p>
              <p className="text-2xl font-bold text-accent-secondary">{totalHoldings}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Holdings List */}
      {filteredHoldings.length === 0 ? (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">
            {searchQuery ? 'No holdings found matching your search' : 'No holdings available'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHoldings.map((holding: any, idx: number) => {
            const holdingId = holding.isin || `holding-${idx}`;
            const isExpanded = expandedHoldings.has(holdingId);
            const brokers = holding.brokers || [];

            return (
              <motion.div
                key={holdingId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20 hover:border-accent-primary/50 transition-all"
              >
                {/* Holding Header */}
                <button
                  onClick={() => toggleHolding(holdingId)}
                  className="w-full text-left mb-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-dark-text mb-2">
                        {holding.issuerName || holding.isinDescription || holding.isin || 'Unknown Holding'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {holding.isin && (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded font-mono">
                            ISIN: {holding.isin}
                          </span>
                        )}
                        {holding.symbol && (
                          <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                            {holding.symbol}
                          </span>
                        )}
                        {holding.exchange && (
                          <span className="text-xs px-2 py-1 bg-accent-warning/20 text-accent-warning rounded">
                            {holding.exchange}
                          </span>
                        )}
                        {brokers.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-dark-border text-dark-textSecondary rounded">
                            {brokers.length} Broker{brokers.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {holding.portfolioWeightagePercent !== undefined && (
                          <span className="text-xs px-2 py-1 bg-accent-success/20 text-accent-success rounded">
                            {holding.portfolioWeightagePercent.toFixed(2)}% of portfolio
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold gradient-text">{formatCurrency(holding.currentValue || 0)}</p>
                      {holding.units !== undefined && (
                        <p className="text-xs text-dark-textSecondary mt-1">{holding.units} units</p>
                      )}
                      <span className="text-xs text-dark-textSecondary block mt-2">
                        {isExpanded ? '▼ Hide Details' : '▶ Show All Fields'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {holding.units !== undefined && (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Units</p>
                      <p className="text-sm font-bold text-dark-text">{holding.units.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {holding.lastTradedPrice !== undefined && (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Last Traded Price</p>
                      <p className="text-sm font-bold text-accent-success">{formatCurrency(holding.lastTradedPrice)}</p>
                    </div>
                  )}
                  {holding.avgTradedPrice !== undefined && (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Avg Traded Price</p>
                      <p className="text-sm font-bold text-accent-warning">{formatCurrency(holding.avgTradedPrice)}</p>
                    </div>
                  )}
                  {holding.lastFetchTime && (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Last Fetch</p>
                      <p className="text-sm font-bold text-dark-text">{formatDate(holding.lastFetchTime)}</p>
                    </div>
                  )}
                </div>

                {/* Brokers Section */}
                {brokers.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
                      <span>🏢</span> Brokers ({brokers.length})
                    </h5>
                    <div className="space-y-3">
                      {brokers.map((broker: any, brokerIdx: number) => {
                        const brokerId = broker.brokerId || `broker-${idx}-${brokerIdx}`;
                        const isBrokerExpanded = expandedBrokers.has(brokerId);

                        return (
                          <div
                            key={brokerId}
                            className="glass-effect rounded-lg p-4 border border-accent-primary/20"
                          >
                            <button
                              onClick={() => toggleBroker(brokerId)}
                              className="w-full text-left mb-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h6 className="text-sm font-semibold text-dark-text">
                                    {broker.brokerName || broker.brokerId || 'Unknown Broker'}
                                  </h6>
                                  {broker.brokerId && (
                                    <p className="text-xs text-dark-textSecondary mt-1">ID: {broker.brokerId}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-accent-success">{formatCurrency(broker.currentValue || 0)}</p>
                                  <span className="text-xs text-dark-textSecondary">
                                    {isBrokerExpanded ? '▼' : '▶'}
                                  </span>
                                </div>
                              </div>
                            </button>

                            {/* Quick Broker Stats */}
                            <div className="grid md:grid-cols-3 gap-2 mb-3">
                              {broker.units !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">Units</p>
                                  <p className="text-sm font-bold text-dark-text">{broker.units.toLocaleString('en-IN')}</p>
                                </div>
                              )}
                              {broker.lastTradedPrice !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">Last Price</p>
                                  <p className="text-sm font-bold text-accent-success">{formatCurrency(broker.lastTradedPrice)}</p>
                                </div>
                              )}
                              {broker.avgTradedPrice !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">Avg Price</p>
                                  <p className="text-sm font-bold text-accent-warning">{formatCurrency(broker.avgTradedPrice)}</p>
                                </div>
                              )}
                            </div>

                            {/* Expanded Broker Details */}
                            {isBrokerExpanded && (
                              <div className="pt-3 border-t border-dark-border/50">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(broker).map(([key, value]) => (
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
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-4 border-t border-dark-border">
                    <h5 className="text-sm font-bold text-accent-primary mb-3">All Holding Fields</h5>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(holding)
                        .filter(([key]) => key !== 'brokers')
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
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

