'use client';

import { motion } from 'framer-motion';
import { camelToTitleCase, formatValue } from '@/lib/formatters';
import { useState } from 'react';

interface MutualFundCardProps {
  fund: any;
  index: number;
}

function MutualFundCard({ fund, index }: MutualFundCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
      <div className="grid md:grid-cols-2 gap-4">
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
      </div>
    </motion.div>
  );
}

interface MutualFundsDisplayProps {
  data: any;
}

export default function MutualFundsDisplay({ data }: MutualFundsDisplayProps) {
  const maxItems = 6;

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
      {hasMore && (
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
                  Showing {displayFunds.length} of {funds.length} schemes
                </p>
                <p className="text-sm text-dark-textSecondary">
                  Limited to top {maxItems} for optimal performance
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-accent-primary/20 border border-accent-primary/30">
              <p className="text-xs font-semibold text-accent-primary">
                {((displayFunds.length / funds.length) * 100).toFixed(1)}% displayed
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Funds Grid */}
      <div className="grid gap-6">
        {displayFunds.map((fund, idx) => (
          <MutualFundCard key={fund.code || fund.isin || idx} fund={fund} index={idx} />
        ))}
      </div>
    </div>
  );
}

