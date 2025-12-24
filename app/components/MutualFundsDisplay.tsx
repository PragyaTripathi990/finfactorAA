'use client';

import { motion } from 'framer-motion';
import { camelToTitleCase, formatValue } from '@/lib/formatters';
import { useState } from 'react';

interface MutualFundCardProps {
  fund: any;
  index: number;
}

function MutualFundCard({ fund, index }: MutualFundCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | string) => {
    if (!amount && amount !== 0) return '₹0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const renderField = (key: string, value: any) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Get all fields except the ones already displayed
  const displayedKeys = ['schemeName', 'schemeNavName', 'amc', 'code', 'schemeCategory', 'schemeType', 'schemeStructure', 'launchDate', 'isin', 'logo'];
  const otherFields = Object.entries(fund).filter(([key]) => !displayedKeys.includes(key));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-effect rounded-2xl p-6 hover:border-accent-primary/50 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-dark-border">
        <div className="flex items-start gap-4 flex-1">
          {fund.logo && (
            <div className="w-16 h-16 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={fund.logo}
                alt={fund.amc || 'Logo'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-dark-text mb-1 group-hover:text-accent-primary transition-colors line-clamp-2">
              {fund.schemeName || fund.schemeNavName || 'Unnamed Scheme'}
            </h3>
            {fund.amc && (
              <p className="text-sm text-dark-textSecondary truncate">{fund.amc}</p>
            )}
          </div>
        </div>
        {fund.code && (
          <div className="ml-4 text-right flex-shrink-0">
            <p className="text-xs text-dark-textSecondary mb-1">Code</p>
            <p className="text-sm font-mono font-semibold text-accent-primary">{fund.code}</p>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {fund.schemeCategory && (
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Category</p>
            <p className="text-sm text-dark-text">
              <span className="px-2 py-1 rounded-md bg-accent-primary/20 text-accent-primary text-xs font-medium">
                {fund.schemeCategory}
              </span>
            </p>
          </div>
        )}

        {fund.schemeType && (
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Type</p>
            <p className="text-sm text-dark-text">{fund.schemeType}</p>
          </div>
        )}

        {fund.schemeStructure && (
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Structure</p>
            <p className="text-sm text-dark-text">{fund.schemeStructure}</p>
          </div>
        )}

        {fund.launchDate && (
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Launch Date</p>
            <p className="text-sm text-dark-text">{formatDate(fund.launchDate)}</p>
          </div>
        )}

        {fund.isin && (
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">ISIN</p>
            <p className="text-sm font-mono text-dark-text">{fund.isin}</p>
          </div>
        )}

        {/* Show value fields if available */}
        {fund.currentValue !== undefined && (
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Current Value</p>
            <p className="text-sm font-bold text-accent-success">{formatCurrency(fund.currentValue)}</p>
          </div>
        )}

        {fund.costValue !== undefined && (
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Cost Value</p>
            <p className="text-sm font-bold text-accent-warning">{formatCurrency(fund.costValue)}</p>
          </div>
        )}
      </div>

      {/* Expandable All Fields Section */}
      {otherFields.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left glass-effect rounded-lg p-3 hover:border-accent-primary/50 transition-all mb-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-accent-primary flex items-center gap-2">
                <span>📋</span> All Fields ({otherFields.length})
              </span>
              <span className="text-dark-textSecondary">
                {isExpanded ? '▼' : '▶'}
              </span>
            </div>
          </button>
          {isExpanded && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherFields.map(([key, value]) => (
                <div key={key} className="glass-effect rounded-lg p-3">
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                    {camelToTitleCase(key)}
                  </div>
                  <div className="text-sm text-dark-text break-words">
                    {renderField(key, value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface MutualFundsDisplayProps {
  data: any;
}

export default function MutualFundsDisplay({ data }: MutualFundsDisplayProps) {
  const [showAll, setShowAll] = useState(false);
  const maxItems = showAll ? 1000 : 6;

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📊</p>
        <p className="text-lg">No mutual funds data available</p>
      </div>
    );
  }

  // Handle array or object with array
  let funds: any[] = [];
  if (Array.isArray(data)) {
    funds = data;
  } else if (data.data && Array.isArray(data.data)) {
    funds = data.data;
  } else if (data.schemes && Array.isArray(data.schemes)) {
    funds = data.schemes;
  }

  if (funds.length === 0) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📊</p>
        <p className="text-lg">No mutual fund schemes found</p>
      </div>
    );
  }

  const displayFunds = funds.slice(0, maxItems);
  const hasMore = funds.length > maxItems;

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-4 border-2 border-accent-primary/30 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <p className="font-semibold text-dark-text">
                {showAll ? `Showing all ${funds.length} schemes` : `Showing ${displayFunds.length} of ${funds.length} schemes`}
              </p>
              <p className="text-sm text-dark-textSecondary">
                {showAll ? 'All schemes displayed' : `Limited to top ${maxItems} - click "Show All" to see all`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="px-4 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/80 transition-all text-sm font-semibold"
              >
                Show All ({funds.length})
              </button>
            )}
            {showAll && (
              <button
                onClick={() => setShowAll(false)}
                className="px-4 py-2 rounded-lg bg-dark-border text-dark-textSecondary hover:bg-dark-border/80 transition-all text-sm font-semibold"
              >
                Show Less
              </button>
            )}
            <div className="px-4 py-2 rounded-lg bg-accent-primary/20 border border-accent-primary/30">
              <p className="text-xs font-semibold text-accent-primary">
                {((displayFunds.length / funds.length) * 100).toFixed(1)}% displayed
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Funds Grid */}
      <div className="grid gap-6">
        {displayFunds.map((fund, idx) => (
          <MutualFundCard key={fund.code || fund.isin || idx} fund={fund} index={idx} />
        ))}
      </div>
    </div>
  );
}

