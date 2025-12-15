'use client';

import { motion } from 'framer-motion';

interface FIPCardProps {
  fip: any;
  index: number;
}

function FIPCard({ fip, index }: FIPCardProps) {
  const getFITypeBadges = (fiTypes: any) => {
    if (!fiTypes) return [];
    
    // If it's already an array, return it
    if (Array.isArray(fiTypes)) {
      return fiTypes.map((type: any) => String(type).trim());
    }
    
    // If it's a string, split by comma
    if (typeof fiTypes === 'string') {
      return fiTypes.split(',').map((type: string) => type.trim());
    }
    
    // Fallback: convert to string and split
    return String(fiTypes).split(',').map((type: string) => type.trim());
  };

  const fiTypes = getFITypeBadges(fip.fiTypes);

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
          {(fip.entityLogoUri || fip.entityIconUri) && (
            <div className="w-16 h-16 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={fip.entityLogoUri || fip.entityIconUri}
                alt={fip.fipName || 'FIP Logo'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-dark-text mb-1 group-hover:text-accent-primary transition-colors">
              {fip.fipName || fip.fipId || 'Unnamed FIP'}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {fip.fipId && (
                <p className="text-xs font-mono text-dark-textSecondary bg-dark-card px-2 py-1 rounded">
                  {fip.fipId}
                </p>
              )}
              {fip.enable === 'Y' && (
                <span className="px-2 py-1 rounded-md bg-accent-success/20 text-accent-success text-xs font-medium">
                  ✓ Enabled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FI Types */}
      {fiTypes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-dark-textSecondary mb-2">Financial Instrument Types</p>
          <div className="flex flex-wrap gap-2">
            {fiTypes.map((type: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30 text-accent-primary text-xs font-medium"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {fip.code && fip.code !== fip.fipId && (
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Code</p>
            <p className="text-sm font-mono text-dark-text">{fip.code}</p>
          </div>
        )}

        {fip.otpLength && (
          <div>
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">OTP Length</p>
            <p className="text-sm text-dark-text">{fip.otpLength} digits</p>
          </div>
        )}

        {fip.entityLogoUri && (
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-dark-textSecondary mb-1">Logo URI</p>
            <p className="text-xs text-dark-text break-all font-mono">{fip.entityLogoUri}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface FIPsDisplayProps {
  data: any;
}

export default function FIPsDisplay({ data }: FIPsDisplayProps) {
  const maxItems = 6;

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">🏦</p>
        <p className="text-lg">No FIPs data available</p>
      </div>
    );
  }

  let fips: any[] = [];
  if (Array.isArray(data)) {
    fips = data;
  } else if (data.data && Array.isArray(data.data)) {
    fips = data.data;
  } else if (data.fips && Array.isArray(data.fips)) {
    fips = data.fips;
  }

  if (fips.length === 0) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">🏦</p>
        <p className="text-lg">No Financial Information Providers found</p>
      </div>
    );
  }

  const displayFIPs = fips.slice(0, maxItems);
  const hasMore = fips.length > maxItems;

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
              <span className="text-3xl">🏦</span>
              <div>
                <p className="font-semibold text-dark-text">
                  Showing {displayFIPs.length} of {fips.length} FIPs
                </p>
                <p className="text-sm text-dark-textSecondary">
                  Limited to top {maxItems} for optimal performance
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-accent-primary/20 border border-accent-primary/30">
              <p className="text-xs font-semibold text-accent-primary">
                {((displayFIPs.length / fips.length) * 100).toFixed(1)}% displayed
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* FIPs Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {displayFIPs.map((fip, idx) => (
          <FIPCard key={fip.fipId || idx} fip={fip} index={idx} />
        ))}
      </div>
    </div>
  );
}

