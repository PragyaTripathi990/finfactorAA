'use client';

import { motion } from 'framer-motion';
import { camelToTitleCase, formatValue } from '@/lib/formatters';

interface FinancialDataDisplayProps {
  data: any;
}

export default function FinancialDataDisplay({ data }: FinancialDataDisplayProps) {
  if (!data) {
    return (
      <div className="text-center py-8 text-dark-textSecondary">
        No financial data available
      </div>
    );
  }

  const { subscriptionStatus, subscriptionStartDate, subscriptionEndDate, fiDatas } = data;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate total portfolio value
  const calculateTotalValue = () => {
    let total = 0;
    if (fiDatas) {
      Object.values(fiDatas).forEach((item: any) => {
        if (item.currentBalance) total += item.currentBalance;
        if (item.currentValue) total += item.currentValue;
      });
    }
    return total;
  };

  const totalValue = calculateTotalValue();

  // Asset type icons and colors
  const assetConfig: Record<string, { icon: string; color: string; label: string }> = {
    DEPOSIT: { icon: '🏦', color: 'from-blue-500 to-blue-600', label: 'Bank Deposits' },
    TERM_DEPOSIT: { icon: '💰', color: 'from-green-500 to-green-600', label: 'Fixed Deposits' },
    RECURRING_DEPOSIT: { icon: '📈', color: 'from-teal-500 to-teal-600', label: 'Recurring Deposits' },
    EQUITIES: { icon: '📊', color: 'from-purple-500 to-purple-600', label: 'Equities' },
    MUTUAL_FUNDS: { icon: '🎯', color: 'from-indigo-500 to-indigo-600', label: 'Mutual Funds' },
    NPS: { icon: '🛡️', color: 'from-orange-500 to-orange-600', label: 'NPS' },
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6 border-2 border-accent-success/30"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">✅</span>
              <h3 className="text-2xl font-bold text-accent-success">Active Subscription</h3>
            </div>
            <div className="text-dark-textSecondary space-y-1">
              <p className="flex items-center gap-2">
                <span className="font-semibold">Started:</span>
                <span>{subscriptionStartDate ? formatDate(subscriptionStartDate) : 'N/A'}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">Expires:</span>
                <span>{subscriptionEndDate ? formatDate(subscriptionEndDate) : 'N/A'}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-textSecondary mb-1">Total Portfolio Value</p>
            <p className="text-4xl font-bold gradient-text">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </motion.div>

      {/* Financial Assets Grid */}
      {fiDatas && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(fiDatas).map(([assetType, assetData]: [string, any], idx) => {
            const config = assetConfig[assetType] || { 
              icon: '💼', 
              color: 'from-gray-500 to-gray-600',
              label: camelToTitleCase(assetType)
            };
            
            const value = assetData.currentBalance || assetData.currentValue || 0;

            return (
              <motion.div
                key={assetType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-effect rounded-2xl p-6 hover:border-accent-primary/50 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {config.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-text group-hover:text-accent-primary transition-colors">
                        {config.label}
                      </h4>
                      <p className="text-xs text-dark-textSecondary">
                        {assetData.totalFiData || 0} Account{assetData.totalFiData !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Value */}
                <div className="mb-4">
                  <p className="text-2xl font-bold text-dark-text mb-1">
                    {formatCurrency(value)}
                  </p>
                  {assetData.costValue && (
                    <p className="text-sm text-dark-textSecondary">
                      Cost: {formatCurrency(assetData.costValue)}
                      <span className={`ml-2 ${value >= assetData.costValue ? 'text-accent-success' : 'text-accent-danger'}`}>
                        {value >= assetData.costValue ? '📈' : '📉'}
                        {' '}
                        {((value - assetData.costValue) / assetData.costValue * 100).toFixed(2)}%
                      </span>
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 pt-4 border-t border-dark-border">
                  {assetData.lastFetchDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-textSecondary">Last Updated</span>
                      <span className="text-dark-text font-medium">
                        {formatDate(assetData.lastFetchDate)}
                      </span>
                    </div>
                  )}
                  
                  {assetData.totalHoldings !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-textSecondary">Holdings</span>
                      <span className="text-dark-text font-medium">{assetData.totalHoldings}</span>
                    </div>
                  )}
                  
                  {assetData.totalBrokers !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-textSecondary">Brokers</span>
                      <span className="text-dark-text font-medium">{assetData.totalBrokers}</span>
                    </div>
                  )}
                  
                  {assetData.totalFiDataToBeFetched > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-textSecondary">Pending</span>
                      <span className="text-accent-primary font-medium">
                        {assetData.totalFiDataToBeFetched} to fetch
                      </span>
                    </div>
                  )}

                  {/* Data Source Details for Mutual Funds */}
                  {assetData.dataSourceDetails && assetData.dataSourceDetails.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-dark-textSecondary mb-1">Data Sources:</p>
                      <div className="flex gap-2 flex-wrap">
                        {assetData.dataSourceDetails.map((source: any, i: number) => (
                          <span 
                            key={i}
                            className="text-xs px-2 py-1 rounded-md bg-accent-primary/20 text-accent-primary"
                          >
                            {source.dataResourceType}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

