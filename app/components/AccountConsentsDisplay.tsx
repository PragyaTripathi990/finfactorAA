'use client';

import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { camelToTitleCase } from '@/lib/formatters';

interface AccountConsentsDisplayProps {
  data: any;
}

export default function AccountConsentsDisplay({ data }: AccountConsentsDisplayProps) {
  // Handle the API response structure - must be before useMemo
  let consents: any[] = [];
  
  if (data) {
    if (Array.isArray(data)) {
      consents = data;
    } else if (data.consents && Array.isArray(data.consents)) {
      consents = data.consents;
    } else if (data.data && Array.isArray(data.data)) {
      consents = data.data;
    } else if (typeof data === 'object') {
      // If it's a single consent object, wrap it in an array
      consents = [data];
    }
  }

  const [expandedConsents, setExpandedConsents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-expand all consents when data is loaded
  useEffect(() => {
    if (consents.length > 0) {
      const allConsentIds = new Set<string>();
      consents.forEach((consent: any, idx: number) => {
        const consentId = consent.consentId || consent.consentHandle || consent.id || `consent-${idx}`;
        allConsentIds.add(consentId);
      });
      setExpandedConsents(allConsentIds);
    }
  }, [data]);

  // Filter consents based on search query - must be before any early returns
  const filteredConsents = useMemo(() => {
    if (!consents || consents.length === 0) return [];
    if (!searchQuery.trim()) return consents;
    
    const query = searchQuery.toLowerCase();
    return consents.filter((consent: any) => {
      const consentString = JSON.stringify(consent).toLowerCase();
      return consentString.includes(query);
    });
  }, [consents, searchQuery]);

  // Early return after all hooks
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No account consents data available</p>
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
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle consent expansion
  const toggleConsent = (consentId: string) => {
    setExpandedConsents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(consentId)) {
        newSet.delete(consentId);
      } else {
        newSet.add(consentId);
      }
      return newSet;
    });
  };

  // Recursive render function for nested objects/arrays
  const renderField = (key: string, value: any, level: number = 0) => {
    if (value === null || value === undefined || value === '') {
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
    if (lowerKey.includes('date') || lowerKey.includes('time')) {
      return <span className="text-accent-secondary">{formatDate(value)}</span>;
    }
    if (lowerKey.includes('value') || lowerKey.includes('price') || lowerKey.includes('amount') || lowerKey.includes('cost') || lowerKey.includes('balance')) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        return <span className="text-accent-success font-semibold">{formatCurrency(value)}</span>;
      }
    }
    if (typeof value === 'boolean') {
      return (
        <span className={`font-semibold ${value ? 'text-accent-success' : 'text-accent-danger'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    return <span className="text-dark-text">{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-dark-textSecondary">Total Consents</p>
          <p className="text-2xl font-bold text-accent-primary">{filteredConsents.length}</p>
        </div>
        <span className="text-4xl opacity-50">✅</span>
      </motion.div>

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
            placeholder="Search consents, account IDs, FIPs..."
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
            Found {filteredConsents.length} consent(s) matching "{searchQuery}"
          </p>
        )}
      </motion.div>

      {/* Consents List */}
      {filteredConsents.length === 0 ? (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">
            {searchQuery ? 'No consents found matching your search' : 'No account consents data available'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConsents.map((consent: any, idx: number) => {
            const consentId = consent.consentId || consent.consentHandle || consent.id || `consent-${idx}`;
            const isExpanded = expandedConsents.has(consentId);
            const fields = Object.entries(consent);

            // Group fields by category
            const consentFields = fields.filter(([key]) => 
              key.toLowerCase().includes('consent') || 
              key.toLowerCase().includes('handle') ||
              key.toLowerCase().includes('reference')
            );
            
            const accountFields = fields.filter(([key]) => 
              key.toLowerCase().includes('account') || 
              key.toLowerCase().includes('fidata')
            );
            
            const statusFields = fields.filter(([key]) => 
              key.toLowerCase().includes('status') ||
              key.toLowerCase().includes('state') ||
              key.toLowerCase().includes('active')
            );

            const dateFields = fields.filter(([key]) => 
              key.toLowerCase().includes('date') ||
              key.toLowerCase().includes('time')
            );

            const fipFields = fields.filter(([key]) =>
              key.toLowerCase().includes('fip')
            );

            const purposeFields = fields.filter(([key]) =>
              key.toLowerCase().includes('purpose') ||
              key.toLowerCase().includes('fiType') ||
              key.toLowerCase().includes('fitype')
            );

            const otherFields = fields.filter(([key]) => 
              !consentFields.some(([k]) => k === key) &&
              !accountFields.some(([k]) => k === key) &&
              !statusFields.some(([k]) => k === key) &&
              !dateFields.some(([k]) => k === key) &&
              !fipFields.some(([k]) => k === key) &&
              !purposeFields.some(([k]) => k === key)
            );

            return (
              <motion.div
                key={consentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20 hover:border-accent-primary/50 transition-all"
              >
                {/* Consent Header */}
                <button
                  onClick={() => toggleConsent(consentId)}
                  className="w-full text-left mb-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-dark-text mb-2">
                        {consent.consentHandle || consent.consentId || `Consent ${idx + 1}`}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {consent.consentId && (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded font-mono">
                            ID: {consent.consentId}
                          </span>
                        )}
                        {consent.accountId && (
                          <span className="text-xs px-2 py-1 bg-accent-info/20 text-accent-info rounded font-mono">
                            Account: {consent.accountId.substring(0, 8)}...
                          </span>
                        )}
                        {consent.status && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            consent.status === 'ACTIVE' || consent.status === 'APPROVED' 
                              ? 'bg-accent-success/20 text-accent-success' 
                              : consent.status === 'PENDING'
                              ? 'bg-accent-warning/20 text-accent-warning'
                              : 'bg-accent-danger/20 text-accent-danger'
                          }`}>
                            {consent.status}
                          </span>
                        )}
                        {consent.fipId && (
                          <span className="text-xs px-2 py-1 bg-accent-secondary/20 text-accent-secondary rounded">
                            {consent.fipId}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl text-dark-textSecondary transition-transform duration-200">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {/* Consent Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 space-y-4"
                  >
                    {/* Consent Information */}
                    {consentFields.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
                          <span>✅</span> Consent Information
                        </h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {consentFields.map(([key, value]) => (
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

                    {/* Account Information */}
                    {accountFields.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-accent-info mb-2 flex items-center gap-2">
                          <span>🏦</span> Account Information
                        </h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {accountFields.map(([key, value]) => (
                            <div key={key} className="glass-effect rounded-lg p-3 border border-accent-info/20">
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

                    {/* Status Information */}
                    {statusFields.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
                          <span>⚡</span> Status Information
                        </h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {statusFields.map(([key, value]) => (
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

                    {/* FIP Information */}
                    {fipFields.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-accent-secondary mb-2 flex items-center gap-2">
                          <span>🏢</span> FIP Information
                        </h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {fipFields.map(([key, value]) => (
                            <div key={key} className="glass-effect rounded-lg p-3 border border-accent-secondary/20">
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

                    {/* Purpose & FI Types */}
                    {purposeFields.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-accent-success mb-2 flex items-center gap-2">
                          <span>🎯</span> Purpose & FI Types
                        </h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {purposeFields.map(([key, value]) => (
                            <div key={key} className="glass-effect rounded-lg p-3 border border-accent-success/20">
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

                    {/* Date & Time Fields */}
                    {dateFields.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-accent-secondary mb-2 flex items-center gap-2">
                          <span>📅</span> Date & Time Information
                        </h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dateFields.map(([key, value]) => (
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

                    {/* Other Fields */}
                    {otherFields.length > 0 && (
                      <div>
                        <h5 className="text-sm font-bold text-accent-primary mb-2 flex items-center gap-2">
                          <span>📋</span> Additional Information
                        </h5>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {otherFields.map(([key, value]) => (
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
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

