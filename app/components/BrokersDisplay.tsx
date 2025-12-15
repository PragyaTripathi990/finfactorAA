'use client';

import { motion } from 'framer-motion';

interface BrokerCardProps {
  broker: any;
  index: number;
}

function BrokerCard({ broker, index }: BrokerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-effect rounded-2xl p-6 hover:border-accent-primary/50 transition-all group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Logo Placeholder */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30 flex items-center justify-center flex-shrink-0">
            {broker.logo ? (
              <img
                src={broker.logo}
                alt={broker.brokerName || 'Broker Logo'}
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-2xl ${broker.logo ? 'hidden' : ''}`}>💹</span>
          </div>

          {/* Broker Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-dark-text mb-1 group-hover:text-accent-primary transition-colors truncate">
              {broker.brokerName || broker.name || 'Unnamed Broker'}
            </h3>
            {broker.brokerId && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-dark-textSecondary">ID:</span>
                <span className="text-sm font-mono font-semibold text-accent-primary">
                  {broker.brokerId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Broker ID Badge */}
        {broker.brokerId && (
          <div className="flex-shrink-0">
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30">
              <p className="text-xs font-semibold text-dark-textSecondary mb-0.5">Broker ID</p>
              <p className="text-lg font-bold text-accent-primary">{broker.brokerId}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface BrokersDisplayProps {
  data: any;
}

export default function BrokersDisplay({ data }: BrokersDisplayProps) {
  const maxItems = 6;

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">💹</p>
        <p className="text-lg">No brokers data available</p>
      </div>
    );
  }

  let brokers: any[] = [];
  if (Array.isArray(data)) {
    brokers = data;
  } else if (data.data && Array.isArray(data.data)) {
    brokers = data.data;
  } else if (data.brokers && Array.isArray(data.brokers)) {
    brokers = data.brokers;
  }

  if (brokers.length === 0) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">💹</p>
        <p className="text-lg">No brokers found</p>
      </div>
    );
  }

  const displayBrokers = brokers.slice(0, maxItems);
  const hasMore = brokers.length > maxItems;

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
              <span className="text-3xl">💹</span>
              <div>
                <p className="font-semibold text-dark-text">
                  Showing {displayBrokers.length} of {brokers.length} brokers
                </p>
                <p className="text-sm text-dark-textSecondary">
                  Limited to top {maxItems} for optimal performance
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-accent-primary/20 border border-accent-primary/30">
              <p className="text-xs font-semibold text-accent-primary">
                {((displayBrokers.length / brokers.length) * 100).toFixed(1)}% displayed
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Brokers Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {displayBrokers.map((broker, idx) => (
          <BrokerCard key={broker.brokerId || idx} broker={broker} index={idx} />
        ))}
      </div>
    </div>
  );
}

