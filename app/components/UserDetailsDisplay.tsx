'use client';

import { motion } from 'framer-motion';

interface UserDetailsDisplayProps {
  data: any;
}

export default function UserDetailsDisplay({ data }: UserDetailsDisplayProps) {
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No user details available</p>
      </div>
    );
  }

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

  const subscriptionStatus = data.subscriptionStatus;
  const subscriptionStartDate = data.subscriptionStartDate;
  const subscriptionEndDate = data.subscriptionEndDate;
  const fiDatas = data.fiDatas || {};

  return (
    <div className="space-y-6">
      {/* Subscription Information */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-dark-text">
          <span className="text-2xl">✅</span>
          Subscription Information
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6 border-2 border-accent-success/30"
          >
            <div className="text-sm font-semibold text-dark-textSecondary mb-2">
              Subscription Status
            </div>
            <div className="text-2xl font-bold text-accent-success">
              {subscriptionStatus === 'YES' ? 'Active' : subscriptionStatus || '—'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
          >
            <div className="text-sm font-semibold text-dark-textSecondary mb-2">
              Subscription Start Date
            </div>
            <div className="text-lg font-semibold text-dark-text">
              {formatDate(subscriptionStartDate)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
          >
            <div className="text-sm font-semibold text-dark-textSecondary mb-2">
              Subscription End Date
            </div>
            <div className="text-lg font-semibold text-dark-text">
              {formatDate(subscriptionEndDate)}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Financial Information by Type */}
      {Object.keys(fiDatas).length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-dark-text">
            <span className="text-2xl">💰</span>
            Financial Information
          </h3>
          
          <div className="space-y-4">
            {Object.entries(fiDatas).map(([fiType, fiData]: [string, any], idx) => (
              <motion.div
                key={fiType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20"
              >
                <h4 className="text-lg font-bold text-accent-primary mb-4 flex items-center gap-2">
                  <span className="text-xl">
                    {fiType === 'DEPOSIT' && '🏦'}
                    {fiType === 'TERM_DEPOSIT' && '💰'}
                    {fiType === 'RECURRING_DEPOSIT' && '📈'}
                    {fiType === 'EQUITIES' && '📊'}
                    {fiType === 'MUTUAL_FUNDS' && '🎯'}
                    {fiType === 'NPS' && '🛡️'}
                    {!['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'EQUITIES', 'MUTUAL_FUNDS', 'NPS'].includes(fiType) && '💼'}
                  </span>
                  {fiType.replace('_', ' ')}
                </h4>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {fiData.totalFiData !== undefined && (
                    <div className="glass-effect rounded-lg p-4">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        Total Accounts
                      </div>
                      <div className="text-xl font-bold text-dark-text">
                        {fiData.totalFiData}
                      </div>
                    </div>
                  )}

                  {fiData.totalFiDataToBeFetched !== undefined && (
                    <div className="glass-effect rounded-lg p-4">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        Pending Fetch
                      </div>
                      <div className="text-xl font-bold text-accent-warning">
                        {fiData.totalFiDataToBeFetched}
                      </div>
                    </div>
                  )}

                  {fiData.lastFetchDate && (
                    <div className="glass-effect rounded-lg p-4">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        Last Fetch Date
                      </div>
                      <div className="text-sm font-semibold text-dark-text">
                        {formatDate(fiData.lastFetchDate)}
                      </div>
                    </div>
                  )}

                  {fiData.currentBalance !== undefined && (
                    <div className="glass-effect rounded-lg p-4 border-2 border-accent-success/30">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        Current Balance
                      </div>
                      <div className="text-xl font-bold gradient-text">
                        {formatCurrency(fiData.currentBalance)}
                      </div>
                    </div>
                  )}

                  {fiData.currentValue !== undefined && (
                    <div className="glass-effect rounded-lg p-4 border-2 border-accent-success/30">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        Current Value
                      </div>
                      <div className="text-xl font-bold gradient-text">
                        {formatCurrency(fiData.currentValue)}
                      </div>
                    </div>
                  )}

                  {fiData.costValue !== undefined && (
                    <div className="glass-effect rounded-lg p-4">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        Cost Value
                      </div>
                      <div className="text-xl font-bold text-dark-text">
                        {formatCurrency(fiData.costValue)}
                      </div>
                    </div>
                  )}

                  {fiData.totalHoldings !== undefined && (
                    <div className="glass-effect rounded-lg p-4">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        Total Holdings
                      </div>
                      <div className="text-xl font-bold text-dark-text">
                        {fiData.totalHoldings}
                      </div>
                    </div>
                  )}

                  {fiData.totalBrokers !== undefined && (
                    <div className="glass-effect rounded-lg p-4">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        Total Brokers
                      </div>
                      <div className="text-xl font-bold text-dark-text">
                        {fiData.totalBrokers}
                      </div>
                    </div>
                  )}
                </div>

                {/* Show any additional fields */}
                {Object.entries(fiData).some(([key]) => 
                  !['totalFiData', 'totalFiDataToBeFetched', 'lastFetchDate', 'currentBalance', 'currentValue', 'costValue', 'totalHoldings', 'totalBrokers'].includes(key)
                ) && (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <h5 className="text-sm font-semibold text-dark-textSecondary mb-3">Additional Information</h5>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(fiData)
                        .filter(([key]) => 
                          !['totalFiData', 'totalFiDataToBeFetched', 'lastFetchDate', 'currentBalance', 'currentValue', 'costValue', 'totalHoldings', 'totalBrokers'].includes(key)
                        )
                        .map(([key, value]) => (
                          <div key={key} className="glass-effect rounded-lg p-3">
                            <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                            </div>
                            <div className="text-sm text-dark-text">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Show any other top-level fields */}
      {Object.entries(data).some(([key]) => 
        !['subscriptionStatus', 'subscriptionStartDate', 'subscriptionEndDate', 'fiDatas'].includes(key)
      ) && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-dark-text">
            <span className="text-2xl">📋</span>
            Additional Information
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data)
              .filter(([key]) => 
                !['subscriptionStatus', 'subscriptionStartDate', 'subscriptionEndDate', 'fiDatas'].includes(key)
              )
              .map(([key, value]) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-effect rounded-lg p-4"
                >
                  <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                  </div>
                  <div className="text-sm text-dark-text break-words">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

