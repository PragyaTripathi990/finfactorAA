'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface MFHoldingFolioDisplayProps {
  data: any;
}

export default function MFHoldingFolioDisplay({ data }: MFHoldingFolioDisplayProps) {
  const [expandedHoldings, setExpandedHoldings] = useState<Set<string>>(new Set());
  const [expandedFolios, setExpandedFolios] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showRawData, setShowRawData] = useState(false);

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

  // Early return after all hooks
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No mutual fund holding folio data available</p>
      </div>
    );
  }

  // Extract other data values after hooks
  const totalFiData = data.totalFiData || 0;
  const currentValue = data.currentValue || 0;
  const costValue = data.costValue || 0;
  const totalHoldings = data.totalHoldings || 0;

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

  // Toggle folio expansion
  const toggleFolio = (folioId: string) => {
    const newSet = new Set(expandedFolios);
    if (newSet.has(folioId)) {
      newSet.delete(folioId);
    } else {
      newSet.add(folioId);
    }
    setExpandedFolios(newSet);
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
    if (lowerKey.includes('value') || lowerKey.includes('cost') || lowerKey.includes('nav') || lowerKey.includes('amount') || lowerKey.includes('price')) {
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

  // Calculate gain/loss
  const gainLoss = currentValue - costValue;
  const gainLossPercent = costValue > 0 ? ((gainLoss / costValue) * 100) : 0;

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
            placeholder="Search holdings, ISIN, AMC, scheme names..."
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
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          className="glass-effect rounded-xl p-6 border-2 border-accent-warning/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💵</span>
            <div>
              <p className="text-sm text-dark-textSecondary">Cost Value</p>
              <p className="text-2xl font-bold text-accent-warning">{formatCurrency(costValue)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`glass-effect rounded-xl p-6 border-2 ${gainLoss >= 0 ? 'border-accent-success/30' : 'border-accent-danger/30'}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{gainLoss >= 0 ? '📈' : '📉'}</span>
            <div>
              <p className="text-sm text-dark-textSecondary">Gain/Loss</p>
              <p className={`text-2xl font-bold ${gainLoss >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {formatCurrency(gainLoss)}
              </p>
              <p className={`text-xs ${gainLoss >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
            const folios = holding.folios || [];
            const holdingGainLoss = (holding.currentValue || 0) - (holding.costValue || 0);
            const holdingGainLossPercent = (holding.costValue || 0) > 0 
              ? ((holdingGainLoss / (holding.costValue || 1)) * 100) 
              : 0;

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
                        {holding.isinDescription || holding.schemeName || holding.isin || 'Unknown Holding'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {holding.isin && (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded font-mono">
                            ISIN: {holding.isin}
                          </span>
                        )}
                        {holding.amc && (
                          <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                            {holding.amc}
                          </span>
                        )}
                        {holding.schemaCategory && (
                          <span className="text-xs px-2 py-1 bg-accent-warning/20 text-accent-warning rounded">
                            {holding.schemaCategory}
                          </span>
                        )}
                        {holding.schemaTypes && (
                          <span className="text-xs px-2 py-1 bg-accent-success/20 text-accent-success rounded">
                            {holding.schemaTypes}
                          </span>
                        )}
                        {folios.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-dark-border text-dark-textSecondary rounded">
                            {folios.length} Folio{folios.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-dark-textSecondary mb-1">Current Value</p>
                      <p className="text-2xl font-bold gradient-text">{formatCurrency(holding.currentValue || 0)}</p>
                      {holding.costValue !== undefined && (
                        <div className="mt-1">
                          <p className="text-xs text-dark-textSecondary">Cost: {formatCurrency(holding.costValue)}</p>
                          <p className={`text-sm font-semibold ${holdingGainLoss >= 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                            {holdingGainLoss >= 0 ? '▲' : '▼'} {Math.abs(holdingGainLossPercent).toFixed(2)}%
                          </p>
                        </div>
                      )}
                      <span className="text-xs text-dark-textSecondary block mt-2">
                        {isExpanded ? '▼ Hide Details' : '▶ Show All Fields'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {holding.closingUnits !== undefined && (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Closing Units</p>
                      <p className="text-sm font-bold text-dark-text">{holding.closingUnits.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {holding.nav !== undefined && (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">NAV</p>
                      <p className="text-sm font-bold text-accent-success">{formatCurrency(holding.nav)}</p>
                    </div>
                  )}
                  {holding.avgNav !== undefined && (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">Avg NAV</p>
                      <p className="text-sm font-bold text-accent-warning">{formatCurrency(holding.avgNav)}</p>
                    </div>
                  )}
                  {holding.navDate && (
                    <div className="glass-effect rounded-lg p-3">
                      <p className="text-xs text-dark-textSecondary mb-1">NAV Date</p>
                      <p className="text-sm font-bold text-dark-text">{formatDate(holding.navDate)}</p>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-4 border-t border-dark-border space-y-4">
                    {/* All Holding Fields */}
                    <div>
                      <h5 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
                        <span>📋</span> All Holding Fields
                      </h5>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(holding)
                          .filter(([key]) => key !== 'folios')
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

                    {/* Folios Section */}
                    {folios.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
                          <span>📁</span> Folios ({folios.length})
                        </h5>
                        <div className="space-y-3">
                          {folios.map((folio: any, folioIdx: number) => {
                            const folioId = folio.folioNo || `folio-${idx}-${folioIdx}`;
                            const isFolioExpanded = expandedFolios.has(folioId);

                            return (
                              <div
                                key={folioId}
                                className="glass-effect rounded-lg p-4 border border-accent-primary/20"
                              >
                                <button
                                  onClick={() => toggleFolio(folioId)}
                                  className="w-full text-left mb-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h6 className="text-sm font-bold text-dark-text">
                                        Folio: {folio.folioNo || folio.fiDataId || 'Unknown'}
                                      </h6>
                                      {folio.maskedAccNumber && (
                                        <p className="text-xs text-dark-textSecondary">Account: {folio.maskedAccNumber}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-accent-success">
                                        {formatCurrency(folio.currentValue || 0)}
                                      </p>
                                      <span className="text-xs text-dark-textSecondary">
                                        {isFolioExpanded ? '▼' : '▶'}
                                      </span>
                                    </div>
                                  </div>
                                </button>

                                {/* Quick Folio Stats */}
                                <div className="grid md:grid-cols-3 gap-2 mb-3">
                                  {folio.closingUnits !== undefined && (
                                    <div className="text-center">
                                      <p className="text-xs text-dark-textSecondary">Units</p>
                                      <p className="text-sm font-bold text-dark-text">{folio.closingUnits.toLocaleString('en-IN')}</p>
                                    </div>
                                  )}
                                  {folio.nav !== undefined && (
                                    <div className="text-center">
                                      <p className="text-xs text-dark-textSecondary">NAV</p>
                                      <p className="text-sm font-bold text-accent-success">{formatCurrency(folio.nav)}</p>
                                    </div>
                                  )}
                                  {folio.navDate && (
                                    <div className="text-center">
                                      <p className="text-xs text-dark-textSecondary">NAV Date</p>
                                      <p className="text-sm font-bold text-dark-text">{formatDate(folio.navDate)}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Expanded Folio Details */}
                                {isFolioExpanded && (
                                  <div className="pt-3 border-t border-dark-border/50">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {Object.entries(folio).map(([key, value]) => (
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
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

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
              <span>🔍</span> View Complete Raw API Response JSON
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

