'use client';

import { motion } from 'framer-motion';
import { camelToTitleCase, formatValue, flattenObject } from '@/lib/formatters';
import { useState } from 'react';

interface DataTableProps {
  data: any;
  title?: string;
  icon?: string;
  maxItems?: number;
}

export default function DataTable({ data, title, icon = '📊', maxItems = 6 }: DataTableProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No data available</p>
      </div>
    );
  }

  // Handle array data
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-dark-textSecondary">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg">No items found</p>
        </div>
      );
    }

    const displayData = data.slice(0, maxItems);
    const hasMore = data.length > maxItems;

    return (
      <div className="space-y-4">
        {/* Summary card if truncated */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-4 border-2 border-accent-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{icon}</span>
                <div>
                  <p className="font-semibold text-dark-text">
                    Showing {displayData.length} of {data.length} items
                  </p>
                  <p className="text-sm text-dark-textSecondary">
                    Limited to top {maxItems} for performance
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {displayData.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="glass-effect rounded-xl p-6 hover:border-accent-primary/30 transition-all"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(flattenObject(item)).map(([key, value]) => (
                <div key={key} className="group">
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold text-dark-textSecondary text-xs flex items-center gap-2">
                      <span className="w-1 h-3 bg-gradient-to-b from-accent-primary to-accent-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      {camelToTitleCase(key)}
                    </div>
                    <div className="text-dark-text break-words text-sm" title={String(value)}>
                      {formatValue(key, value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Handle object data
  const flattened = flattenObject(data);
  const entries = Object.entries(flattened);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No data fields available</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map(([key, value], idx) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.02 }}
          className="group"
        >
          <div className="glass-effect rounded-xl p-4 hover:border-accent-primary/30 transition-all h-full">
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-dark-textSecondary text-sm flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-accent-primary to-accent-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                {camelToTitleCase(key)}
              </div>
              <div className="text-dark-text break-words" title={String(value)}>
                {formatValue(key, value)}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
