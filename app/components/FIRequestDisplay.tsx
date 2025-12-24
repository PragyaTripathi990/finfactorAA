'use client';

import { motion } from 'framer-motion';
import { camelToTitleCase } from '@/lib/formatters';

interface FIRequestDisplayProps {
  data: any;
  title: string;
  icon: string;
}

export default function FIRequestDisplay({ data, title, icon }: FIRequestDisplayProps) {
  if (!data) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">📭</p>
        <p className="text-lg">No {title.toLowerCase()} data available</p>
      </div>
    );
  }

  // Handle text/plain response (API returns string)
  const isTextResponse = typeof data === 'string' || (data.message && typeof data.message === 'string');
  const responseText = typeof data === 'string' ? data : (data.message || data.data || JSON.stringify(data, null, 2));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6 border-2 border-accent-primary/20"
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
        </h3>

        {/* Text Response Display */}
        {isTextResponse && (
          <div className="space-y-4">
            <div className="glass-effect rounded-lg p-4 border border-accent-primary/30">
              <div className="text-sm font-semibold text-dark-textSecondary mb-2">Response:</div>
              <div className="text-dark-text font-mono text-sm whitespace-pre-wrap break-words">
                {responseText}
              </div>
            </div>
          </div>
        )}

        {/* Structured Data Display */}
        {!isTextResponse && typeof data === 'object' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            {data.success !== undefined && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="glass-effect rounded-lg p-4">
                  <div className="text-sm font-semibold text-dark-textSecondary mb-1">Status</div>
                  <div className={`text-lg font-bold ${data.success ? 'text-accent-success' : 'text-accent-danger'}`}>
                    {data.success ? '✅ Success' : '❌ Failed'}
                  </div>
                </div>
                {data.accountId && (
                  <div className="glass-effect rounded-lg p-4">
                    <div className="text-sm font-semibold text-dark-textSecondary mb-1">Account ID</div>
                    <div className="text-lg font-mono text-dark-text break-all">{data.accountId}</div>
                  </div>
                )}
              </div>
            )}

            {/* All Fields */}
            <div>
              <h4 className="text-sm font-bold text-accent-primary mb-3">All Fields</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(data).map(([key, value]) => {
                  if (key === 'success' || key === 'accountId') return null;
                  
                  return (
                    <div key={key} className="glass-effect rounded-lg p-3">
                      <div className="text-xs font-semibold text-dark-textSecondary mb-1">
                        {camelToTitleCase(key)}
                      </div>
                      <div className="text-sm text-dark-text break-words">
                        {typeof value === 'object' ? (
                          <pre className="text-xs overflow-auto">{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          String(value)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raw JSON View */}
            <details className="cursor-pointer">
              <summary className="text-sm font-semibold text-accent-primary mb-2">
                🔍 View Raw JSON
              </summary>
              <div className="mt-2 glass-effect rounded-lg p-4">
                <pre className="text-xs text-dark-text overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </motion.div>
    </div>
  );
}

