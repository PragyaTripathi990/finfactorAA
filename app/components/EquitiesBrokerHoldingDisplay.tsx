'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface EquitiesBrokerHoldingDisplayProps {
  data: any;
}

export default function EquitiesBrokerHoldingDisplay({ data }: EquitiesBrokerHoldingDisplayProps) {
  const [expandedBrokers, setExpandedBrokers] = useState<Set<string>>(new Set());
  const [expandedHoldings, setExpandedHoldings] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Extract data - must be before useMemo
  // Handle multiple possible response structures - prioritize broker-specific keys
  let brokerData: any[] = [];
  
  if (data) {
    // First, try broker-specific keys
    if (Array.isArray(data.brokerData)) {
      brokerData = data.brokerData;
    }
    else if (Array.isArray(data.brokers)) {
      brokerData = data.brokers;
    }
    else if (Array.isArray(data.brokerAccounts)) {
      brokerData = data.brokerAccounts;
    }
    // Then try generic structures
    else if (Array.isArray(data)) {
      brokerData = data;
    }
    else if (Array.isArray(data.fipData)) {
      brokerData = data.fipData;
    }
    else if (Array.isArray(data.data)) {
      brokerData = data.data;
    }
    // If brokerData is an object, try to extract arrays from it
    else if (data.brokerData && typeof data.brokerData === 'object' && !Array.isArray(data.brokerData)) {
      if (Array.isArray(data.brokerData.brokers)) {
        brokerData = data.brokerData.brokers;
      } else if (Array.isArray(data.brokerData.accounts)) {
        brokerData = data.brokerData.accounts;
      } else {
        brokerData = [data.brokerData];
      }
    }
    // If brokers is an object, convert to array
    else if (data.brokers && typeof data.brokers === 'object' && !Array.isArray(data.brokers)) {
      brokerData = Object.values(data.brokers);
    }
  }

  // Filter brokers based on search query - must be before any early returns
  const filteredBrokerData = useMemo(() => {
    if (!brokerData || brokerData.length === 0) return [];
    if (!searchQuery.trim()) return brokerData;
    
    const query = searchQuery.toLowerCase();
    return brokerData.filter((broker: any) => {
      const brokerString = JSON.stringify(broker).toLowerCase();
      return brokerString.includes(query);
    });
  }, [brokerData, searchQuery]);

  // Early return after all hooks
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No equities broker holding data available</p>
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
            placeholder="Search brokers, ISIN, holdings..."
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
            Found {filteredBrokerData.length} broker(s) matching "{searchQuery}"
          </p>
        )}
      </motion.div>

      {/* Brokers List */}
      {filteredBrokerData.length === 0 ? (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">
            {searchQuery ? 'No brokers found matching your search' : 'No broker holding data available'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBrokerData.map((broker: any, idx: number) => {
            const brokerId = broker.brokerId || broker.brokerName || `broker-${idx}`;
            const isExpanded = expandedBrokers.has(brokerId);
            const holdings = broker.holdings || [];

            return (
              <motion.div
                key={brokerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20 hover:border-accent-primary/50 transition-all"
              >
                {/* Broker Header */}
                <button
                  onClick={() => toggleBroker(brokerId)}
                  className="w-full text-left mb-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-dark-text mb-2">
                        {broker.brokerName || broker.brokerId || 'Unknown Broker'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {broker.brokerId && (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded">
                            {broker.brokerId}
                          </span>
                        )}
                        {broker.brokerCode && (
                          <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                            {broker.brokerCode}
                          </span>
                        )}
                        {holdings.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-accent-success/20 text-accent-success rounded">
                            {holdings.length} Holding{holdings.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {broker.currentValue !== undefined && (
                        <p className="text-2xl font-bold gradient-text">{formatCurrency(broker.currentValue)}</p>
                      )}
                      <span className="text-xs text-dark-textSecondary block mt-2">
                        {isExpanded ? '▼ Hide Details' : '▶ Show All Fields'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Holdings */}
                {holdings.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
                      <span>📊</span> Holdings ({holdings.length})
                    </h5>
                    <div className="space-y-3">
                      {holdings.map((holding: any, holdingIdx: number) => {
                        const holdingId = holding.isin || `holding-${idx}-${holdingIdx}`;
                        const isHoldingExpanded = expandedHoldings.has(holdingId);

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
                                    {holding.issuerName || holding.isinDescription || holding.isin || 'Unknown'}
                                  </h6>
                                  {holding.isin && (
                                    <p className="text-xs text-dark-textSecondary font-mono mt-1">ISIN: {holding.isin}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-accent-success">{formatCurrency(holding.currentValue || 0)}</p>
                                  <span className="text-xs text-dark-textSecondary">
                                    {isHoldingExpanded ? '▼' : '▶'}
                                  </span>
                                </div>
                              </div>
                            </button>

                            {/* Quick Holding Stats */}
                            <div className="grid md:grid-cols-3 gap-2 mb-3">
                              {holding.units !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">Units</p>
                                  <p className="text-sm font-bold text-dark-text">{holding.units.toLocaleString('en-IN')}</p>
                                </div>
                              )}
                              {holding.lastTradedPrice !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">Last Price</p>
                                  <p className="text-sm font-bold text-accent-success">{formatCurrency(holding.lastTradedPrice)}</p>
                                </div>
                              )}
                              {holding.avgTradedPrice !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">Avg Price</p>
                                  <p className="text-sm font-bold text-accent-warning">{formatCurrency(holding.avgTradedPrice)}</p>
                                </div>
                              )}
                            </div>

                            {/* Expanded Holding Details */}
                            {isHoldingExpanded && (
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
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded Broker Details */}
                {isExpanded && (
                  <div className="pt-4 border-t border-dark-border">
                    <h5 className="text-sm font-bold text-accent-primary mb-3">All Broker Fields</h5>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(broker)
                        .filter(([key]) => key !== 'holdings')
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

