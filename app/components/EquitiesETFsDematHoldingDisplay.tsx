'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface EquitiesETFsDematHoldingDisplayProps {
  data: any;
}

export default function EquitiesETFsDematHoldingDisplay({ data }: EquitiesETFsDematHoldingDisplayProps) {
  const [expandedDemats, setExpandedDemats] = useState<Set<string>>(new Set());
  const [expandedEquityHoldings, setExpandedEquityHoldings] = useState<Set<string>>(new Set());
  const [expandedETFHoldings, setExpandedETFHoldings] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Extract data - must be before useMemo
  // Based on Postman response: { totalFiData, currentValue, demat: [...], prevDetails }
  let dematData: any[] = [];
  
  if (data) {
    // Primary structure: data.demat is an array
    if (Array.isArray(data.demat)) {
      dematData = data.demat;
    }
    // Fallback: if data itself is an array
    else if (Array.isArray(data)) {
      dematData = data;
    }
    // Fallback: if demat exists but is not an array, wrap it
    else if (data.demat) {
      dematData = [data.demat];
    }
  }

  // Filter demats based on search query - must be before any early returns
  const filteredDematData = useMemo(() => {
    if (!dematData || dematData.length === 0) return [];
    if (!searchQuery.trim()) return dematData;
    
    const query = searchQuery.toLowerCase();
    return dematData.filter((demat: any) => {
      const dematString = JSON.stringify(demat).toLowerCase();
      return dematString.includes(query);
    });
  }, [dematData, searchQuery]);

  // Early return after all hooks
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No equities & ETFs demat holding data available</p>
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

  // Toggle demat expansion
  const toggleDemat = (dematId: string) => {
    const newSet = new Set(expandedDemats);
    if (newSet.has(dematId)) {
      newSet.delete(dematId);
    } else {
      newSet.add(dematId);
    }
    setExpandedDemats(newSet);
  };

  // Toggle holding expansion
  const toggleEquityHolding = (holdingId: string) => {
    const newSet = new Set(expandedEquityHoldings);
    if (newSet.has(holdingId)) {
      newSet.delete(holdingId);
    } else {
      newSet.add(holdingId);
    }
    setExpandedEquityHoldings(newSet);
  };

  const toggleETFHolding = (holdingId: string) => {
    const newSet = new Set(expandedETFHoldings);
    if (newSet.has(holdingId)) {
      newSet.delete(holdingId);
    } else {
      newSet.add(holdingId);
    }
    setExpandedETFHoldings(newSet);
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
            placeholder="Search demat accounts, ISIN, brokers, equity/ETF holdings..."
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
            Found {filteredDematData.length} demat account(s) matching "{searchQuery}"
          </p>
        )}
      </motion.div>

      {/* Demat Accounts List */}
      {filteredDematData.length === 0 ? (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">
            {searchQuery ? 'No demat accounts found matching your search' : 'No equities & ETFs demat holding data available'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDematData.map((demat: any, idx: number) => {
            const dematId = demat.dematId || demat.fiDataId || `demat-${idx}`;
            const isExpanded = expandedDemats.has(dematId);
            
            // Extract equity and ETF holdings from the holdings array
            // Based on Postman response: holdings is an array containing both equity and ETF items
            let equityHoldings: any[] = [];
            let etfHoldings: any[] = [];
            
            if (Array.isArray(demat.holdings)) {
              // Separate equity and ETF holdings
              demat.holdings.forEach((holding: any) => {
                // ETF typically has schemeName, equity has issuerName
                if (holding.schemeName || holding.type === 'ETF' || holding.holdingType === 'ETF') {
                  etfHoldings.push(holding);
                } else if (holding.issuerName || holding.type === 'EQUITY' || holding.holdingType === 'EQUITY') {
                  equityHoldings.push(holding);
                } else {
                  // Default to equity if unclear
                  equityHoldings.push(holding);
                }
              });
            }
            
            const totalEquityValue = equityHoldings.reduce((sum: number, h: any) => sum + (parseFloat(h.currentValue || h.value || 0) || 0), 0);
            const totalETFValue = etfHoldings.reduce((sum: number, h: any) => sum + (parseFloat(h.currentValue || h.value || 0) || 0), 0);

            return (
              <motion.div
                key={dematId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20 hover:border-accent-primary/50 transition-all"
              >
                {/* Demat Header */}
                <button
                  onClick={() => toggleDemat(dematId)}
                  className="w-full text-left mb-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-dark-text mb-2">
                        {demat.brokerName || demat.dematId || 'Unknown Demat Account'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {demat.dematId && (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded font-mono">
                            {demat.dematId}
                          </span>
                        )}
                        {demat.brokerCode && (
                          <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                            {demat.brokerCode}
                          </span>
                        )}
                        {equityHoldings.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-accent-success/20 text-accent-success rounded">
                            {equityHoldings.length} Equity{equityHoldings.length !== 1 ? 'ies' : ''}
                          </span>
                        )}
                        {etfHoldings.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-accent-warning/20 text-accent-warning rounded">
                            {etfHoldings.length} ETF{etfHoldings.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {demat.currentValue !== undefined && (
                        <p className="text-2xl font-bold gradient-text">{formatCurrency(demat.currentValue)}</p>
                      )}
                      <div className="text-xs text-dark-textSecondary mt-1">
                        {totalEquityValue > 0 && <div>Equity: {formatCurrency(totalEquityValue)}</div>}
                        {totalETFValue > 0 && <div>ETF: {formatCurrency(totalETFValue)}</div>}
                      </div>
                      <span className="text-xs text-dark-textSecondary block mt-2">
                        {isExpanded ? '▼ Hide Details' : '▶ Show All Fields'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Equity Holdings */}
                {equityHoldings.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-accent-success mb-3 flex items-center gap-2">
                      <span>📈</span> Equity Holdings ({equityHoldings.length})
                    </h5>
                    <div className="space-y-3">
                      {equityHoldings.map((holding: any, holdingIdx: number) => {
                        const holdingId = holding.isin || `equity-${idx}-${holdingIdx}`;
                        const isHoldingExpanded = expandedEquityHoldings.has(holdingId);

                        return (
                          <div
                            key={holdingId}
                            className="glass-effect rounded-lg p-4 border border-accent-success/20"
                          >
                            <button
                              onClick={() => toggleEquityHolding(holdingId)}
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
                                  <p className="text-sm font-bold text-accent-success">{formatCurrency(holding.currentValue || holding.value || 0)}</p>
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

                {/* ETF Holdings */}
                {etfHoldings.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-accent-warning mb-3 flex items-center gap-2">
                      <span>💎</span> ETF Holdings ({etfHoldings.length})
                    </h5>
                    <div className="space-y-3">
                      {etfHoldings.map((holding: any, holdingIdx: number) => {
                        const holdingId = holding.isin || `etf-${idx}-${holdingIdx}`;
                        const isHoldingExpanded = expandedETFHoldings.has(holdingId);

                        return (
                          <div
                            key={holdingId}
                            className="glass-effect rounded-lg p-4 border border-accent-warning/20"
                          >
                            <button
                              onClick={() => toggleETFHolding(holdingId)}
                              className="w-full text-left mb-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h6 className="text-sm font-semibold text-dark-text">
                                    {holding.schemeName || holding.isinDescription || holding.isin || 'Unknown'}
                                  </h6>
                                  {holding.isin && (
                                    <p className="text-xs text-dark-textSecondary font-mono mt-1">ISIN: {holding.isin}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-accent-warning">{formatCurrency(holding.currentValue || holding.value || 0)}</p>
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
                              {holding.currentNAV !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">NAV</p>
                                  <p className="text-sm font-bold text-accent-warning">{formatCurrency(holding.currentNAV)}</p>
                                </div>
                              )}
                              {holding.nav !== undefined && (
                                <div className="text-center">
                                  <p className="text-xs text-dark-textSecondary">NAV</p>
                                  <p className="text-sm font-bold text-accent-warning">{formatCurrency(holding.nav)}</p>
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

                {/* Expanded Demat Details */}
                {isExpanded && (
                  <div className="pt-4 border-t border-dark-border">
                    <h5 className="text-sm font-bold text-accent-primary mb-3">All Demat Fields</h5>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(demat)
                        .filter(([key]) => !['equityHoldings', 'etfHoldings', 'equity_holdings', 'etf_holdings', 'holdings'].includes(key))
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

