'use client';

import { motion } from 'framer-motion';

interface NPSAccount {
  fiDataId: string;
  accountRefNumber: string;
  dataFetched: boolean;
  lastFetchDateTime: string;
  fipName: string;
  maskedPranId?: string;
  holderName?: string;
  holderMobile?: string;
  holderEmail?: string;
  holderPan?: string;
  accountCurrentValue: number;
  latestConsentExpiryTime?: string;
  [key: string]: any;
) : null}

interface FIPData {
  fipId: string;
  fipName: string;
  totalFiData: number;
  linkedAccounts: NPSAccount[];
  currentValue: number;
) : null}

interface NPSDisplayProps {
  data: {
    totalFiData: number;
    fipData: FIPData[];
    currentValue: number;
  } | null;
) : null}

export default function NPSLinkedAccountsDisplay({ data }: NPSDisplayProps) {
  if (!data || !data.fipData || data.fipData.length === 0) {
    return (
      <div className="text-center py-12 text-dark-textSecondary">
        <p className="text-5xl mb-3">🛡️</p>
        <p className="text-lg">No NPS linked accounts found</p>
      </div>
    );
  ) : null}

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-6 border-2 border-accent-success/30"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-3xl shadow-lg">
              🛡️
            </div>
            <div>
              <h3 className="text-2xl font-bold text-dark-text">NPS Accounts</h3>
              <p className="text-dark-textSecondary">
                {data.totalFiData} Total Account{data.totalFiData !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-textSecondary mb-1">Total Value</p>
            <p className="text-3xl font-bold gradient-text">{formatCurrency(data.currentValue)}</p>
          </div>
        </div>
      </motion.div>

      {/* FIP Data */}
      {data.fipData.map((fip, fipIdx) => (
        <motion.div
          key={fip.fipId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: fipIdx * 0.1 }}
          className="space-y-4"
        >
          {/* FIP Header */}
          <div className="glass-effect rounded-xl p-4 border-l-4 border-accent-primary">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-xl font-semibold text-dark-text">{fip.fipName}</h4>
                <p className="text-sm text-dark-textSecondary">
                  {fip.linkedAccounts.length} Linked Account{fip.linkedAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-dark-textSecondary">FIP Value</p>
                <p className="text-2xl font-bold text-dark-text">{formatCurrency(fip.currentValue)}</p>
              </div>
            </div>
          </div>

          {/* Linked Accounts */}
          <div className="grid gap-4">
            {fip.linkedAccounts.map((account, accIdx) => (
              <motion.div
                key={account.fiDataId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + accIdx * 0.05 }}
                className="glass-effect rounded-xl p-6 hover:border-accent-primary/50 transition-all"
              >
                {/* Account Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-dark-border">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">💼</span>
                      <h5 className="text-lg font-semibold text-dark-text">
                        {account.maskedPranId || 'NPS Account'}
                      </h5>
                    </div>
                    {account.holderName ? (
                      <p className="text-dark-textSecondary">{account.holderName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dark-textSecondary mb-1">Current Value</p>
                    <p className="text-2xl font-bold gradient-text">
                      {formatCurrency(account.accountCurrentValue)}
                    </p>
                  </div>
                </div>

                {/* Account Details Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-dark-textSecondary">PRAN ID</p>
                    <p className="text-sm text-dark-text font-mono">
                      {account.holderPranId || account.maskedPranId || '—'}
                    </p>
                  </div>

                  {account.holderPan ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dark-textSecondary">PAN</p>
                      <p className="text-sm text-dark-text font-mono">{account.holderPan}</p>
                    </div>
                  )}

                  {account.holderMobile ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dark-textSecondary">Mobile</p>
                      <p className="text-sm text-dark-text">{account.holderMobile}</p>
                    </div>
                  )}

                  {account.holderEmail ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dark-textSecondary">Email</p>
                      <p className="text-sm text-dark-text break-all">{account.holderEmail}</p>
                    </div>
                  )}

                  {account.holderDob ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dark-textSecondary">Date of Birth</p>
                      <p className="text-sm text-dark-text">{formatDate(account.holderDob)}</p>
                    </div>
                  )}

                  {account.holderNominee ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dark-textSecondary">Nominee Status</p>
                      <p className="text-sm text-dark-text">{account.holderNominee}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-dark-textSecondary">Data Status</p>
                    <p className="text-sm">
                      <span
                        className={`px-2 py-1 rounded-md ${
                          account.dataFetched
                            ? 'bg-accent-success/20 text-accent-success'
                            : 'bg-accent-danger/20 text-accent-danger'
                        }`}
                      >
                        {account.dataFetched ? '✓ Fetched' : '✗ Not Fetched'}
                      </span>
                    </p>
                  </div>

                  {account.lastFetchDateTime ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dark-textSecondary">Last Updated</p>
                      <p className="text-sm text-dark-text">{formatDate(account.lastFetchDateTime)}</p>
                    </div>
                  )}

                  {account.latestConsentExpiryTime ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dark-textSecondary">Consent Expiry</p>
                      <p className="text-sm text-dark-text">
                        {formatDate(account.latestConsentExpiryTime)}
                      </p>
                    </div>
                  )}

                  {account.fiRequestCountOfCurrentMonth !== undefined ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dark-textSecondary">
                        FI Requests (This Month)
                      </p>
                      <p className="text-sm text-dark-text">{account.fiRequestCountOfCurrentMonth}</p>
                    </div>
                  )}
                </div>

                {/* Address if available */}
                {account.holderAddress ? (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <p className="text-xs font-semibold text-dark-textSecondary mb-1">Address</p>
                    <p className="text-sm text-dark-text">{account.holderAddress}</p>
                  </div>
                )}

                {/* Consent Purpose if available */}
                {account.latestConsentPurposeText ? (
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <p className="text-xs font-semibold text-dark-textSecondary mb-1">
                      Consent Purpose
                    </p>
                    <p className="text-sm text-dark-text italic">{account.latestConsentPurposeText}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
) : null}

