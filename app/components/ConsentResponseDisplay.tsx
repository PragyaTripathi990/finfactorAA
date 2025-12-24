'use client';

import { motion } from 'framer-motion';
import { camelToTitleCase } from '@/lib/formatters';

interface ConsentResponseDisplayProps {
  data: any;
}

export default function ConsentResponseDisplay({ data }: ConsentResponseDisplayProps) {
  if (!data) {
    return null;
  }

  // Format date
  const formatDate = (dateString: string | number) => {
    if (!dateString || dateString === '-') return '—';
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

  // Get status badge color
  const getStatusColor = (status: string) => {
    const upperStatus = String(status || '').toUpperCase();
    if (upperStatus === 'REQUESTED' || upperStatus === 'PENDING') {
      return 'bg-accent-warning/20 text-accent-warning border-accent-warning/30';
    }
    if (upperStatus === 'APPROVED' || upperStatus === 'ACTIVE' || upperStatus === 'SUCCESS') {
      return 'bg-accent-success/20 text-accent-success border-accent-success/30';
    }
    if (upperStatus === 'REJECTED' || upperStatus === 'FAILED' || upperStatus === 'EXPIRED') {
      return 'bg-accent-danger/20 text-accent-danger border-accent-danger/30';
    }
    return 'bg-accent-primary/20 text-accent-primary border-accent-primary/30';
  };

  // Group fields by category
  const fields = Object.entries(data);
  
  const identityFields = fields.filter(([key]) => 
    key.toLowerCase().includes('cust') ||
    key.toLowerCase().includes('id') ||
    key.toLowerCase().includes('handle') ||
    key.toLowerCase().includes('aa')
  );

  const consentFields = fields.filter(([key]) => 
    key.toLowerCase().includes('consent') ||
    key.toLowerCase().includes('purpose') ||
    key.toLowerCase().includes('description')
  );

  const statusFields = fields.filter(([key]) => 
    key.toLowerCase().includes('status') ||
    key.toLowerCase().includes('state')
  );

  const dateFields = fields.filter(([key]) => 
    key.toLowerCase().includes('date') ||
    key.toLowerCase().includes('time') ||
    key.toLowerCase().includes('range')
  );

  const requestFields = fields.filter(([key]) => 
    key.toLowerCase().includes('request') ||
    key.toLowerCase().includes('session')
  );

  const otherFields = fields.filter(([key]) => 
    !identityFields.some(([k]) => k === key) &&
    !consentFields.some(([k]) => k === key) &&
    !statusFields.some(([k]) => k === key) &&
    !dateFields.some(([k]) => k === key) &&
    !requestFields.some(([k]) => k === key)
  );

  // Render field value
  const renderField = (key: string, value: any) => {
    if (value === null || value === undefined || value === '' || value === '-') {
      return <span className="text-dark-textSecondary italic">—</span>;
    }

    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('date') || lowerKey.includes('time')) {
      return <span className="text-accent-secondary font-medium">{formatDate(value)}</span>;
    }

    if (lowerKey.includes('status')) {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(value)}`}>
          {String(value)}
        </span>
      );
    }

    if (lowerKey.includes('handle') || lowerKey.includes('id')) {
      return <span className="text-accent-primary font-mono text-sm break-all">{String(value)}</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`font-semibold ${value ? 'text-accent-success' : 'text-accent-danger'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    return <span className="text-dark-text break-words">{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Status Badge */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold text-dark-text mb-2">Consent Response</h3>
          <p className="text-dark-textSecondary">Consent request submitted successfully</p>
        </div>
        {data.consentStatus && (
          <div className={`px-4 py-2 rounded-xl border ${getStatusColor(data.consentStatus)}`}>
            <div className="text-xs font-semibold mb-1">Status</div>
            <div className="text-lg font-bold uppercase">{data.consentStatus}</div>
          </div>
        )}
      </div>

      {/* Identity & Reference Information */}
      {identityFields.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
            <span>🆔</span> Identity & Reference Information
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {identityFields.map(([key, value]) => (
              <div key={key} className="glass-effect rounded-lg p-4 border border-accent-primary/20">
                <div className="text-xs font-semibold text-dark-textSecondary mb-2">
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

      {/* Consent Details */}
      {consentFields.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-accent-success mb-3 flex items-center gap-2">
            <span>✅</span> Consent Details
          </h4>
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
            {consentFields.map(([key, value]) => (
              <div key={key} className="glass-effect rounded-lg p-4 border border-accent-success/20">
                <div className="text-xs font-semibold text-dark-textSecondary mb-2">
                  {camelToTitleCase(key)}
                </div>
                <div className="text-sm leading-relaxed">
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
          <h4 className="text-sm font-bold text-accent-warning mb-3 flex items-center gap-2">
            <span>⚡</span> Status Information
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusFields.map(([key, value]) => (
              <div key={key} className="glass-effect rounded-lg p-4 border border-accent-warning/20">
                <div className="text-xs font-semibold text-dark-textSecondary mb-2">
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

      {/* Date & Time Range */}
      {dateFields.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-accent-secondary mb-3 flex items-center gap-2">
            <span>📅</span> Date & Time Information
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dateFields.map(([key, value]) => (
              <div key={key} className="glass-effect rounded-lg p-4 border border-accent-secondary/20">
                <div className="text-xs font-semibold text-dark-textSecondary mb-2">
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

      {/* Request Information */}
      {requestFields.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-accent-info mb-3 flex items-center gap-2">
            <span>📋</span> Request Information
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requestFields.map(([key, value]) => (
              <div key={key} className="glass-effect rounded-lg p-4 border border-accent-info/20">
                <div className="text-xs font-semibold text-dark-textSecondary mb-2">
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
          <h4 className="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
            <span>📄</span> Additional Information
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherFields.map(([key, value]) => (
              <div key={key} className="glass-effect rounded-lg p-4">
                <div className="text-xs font-semibold text-dark-textSecondary mb-2">
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

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6 border-2 border-accent-primary/30"
      >
        <h4 className="text-sm font-bold text-accent-primary mb-4 flex items-center gap-2">
          <span>📊</span> Quick Summary
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.consentHandle && (
            <div>
              <div className="text-xs font-semibold text-dark-textSecondary mb-1">Consent Handle</div>
              <div className="text-sm font-mono text-accent-primary break-all">{data.consentHandle}</div>
            </div>
          )}
          {data.consentStatus && (
            <div>
              <div className="text-xs font-semibold text-dark-textSecondary mb-1">Status</div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(data.consentStatus)}`}>
                {data.consentStatus}
              </div>
            </div>
          )}
          {data.requestDate && (
            <div>
              <div className="text-xs font-semibold text-dark-textSecondary mb-1">Request Date</div>
              <div className="text-sm text-dark-text">{formatDate(data.requestDate)}</div>
            </div>
          )}
          {data.fetchType && (
            <div>
              <div className="text-xs font-semibold text-dark-textSecondary mb-1">Fetch Type</div>
              <div className="text-sm text-dark-text font-semibold">{data.fetchType}</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

