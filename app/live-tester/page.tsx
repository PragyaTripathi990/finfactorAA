'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  time: number;
}

export default function LiveTesterPage() {
  const [uniqueIdentifier, setUniqueIdentifier] = useState('8956545791');
  const [accountId, setAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2025-12-31');
  const [loading, setLoading] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [selectedApi, setSelectedApi] = useState<string | null>(null);

  const callApi = async (apiName: string, endpoint: string, body: object) => {
    setLoading(apiName);
    setSelectedApi(apiName);
    setResponse(null);
    
    const startTime = Date.now();
    
    try {
      const res = await fetch('/api/finfactor-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, body }),
      });
      
      const data = await res.json();
      const time = Date.now() - startTime;
      
      setResponse({
        success: res.ok && !data.error,
        data: data,
        error: data.error,
        time,
      });
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        time: Date.now() - startTime,
      });
    } finally {
      setLoading(null);
    }
  };

  const apis = [
    {
      category: 'Deposits',
      icon: '🏦',
      color: 'from-blue-500 to-cyan-600',
      endpoints: [
        {
          name: 'Get Linked Accounts',
          key: 'deposit-accounts',
          endpoint: '/pfm/api/v2/deposit/user-linked-accounts',
          getBody: () => ({ uniqueIdentifier }),
          description: 'Fetch all linked bank accounts',
        },
        {
          name: 'Get Account Statement',
          key: 'deposit-statement',
          endpoint: '/pfm/api/v2/deposit/user-account-statement',
          getBody: () => ({ 
            uniqueIdentifier, 
            accountId: accountId || 'SAVINGS-001',
            from: dateFrom,
            to: dateTo,
          }),
          description: 'Get transactions for an account',
          needsAccountId: true,
        },
        {
          name: 'Get Deposit Insights',
          key: 'deposit-insights',
          endpoint: '/pfm/api/v2/deposit/insights',
          getBody: () => ({ 
            uniqueIdentifier,
            accountIds: [],
            from: dateFrom,
            to: dateTo,
            frequency: 'MONTHLY',
          }),
          description: 'Analytics: balance, income, expenses',
        },
      ],
    },
    {
      category: 'Mutual Funds',
      icon: '📈',
      color: 'from-emerald-500 to-teal-600',
      endpoints: [
        {
          name: 'Get Holdings',
          key: 'mf-holdings',
          endpoint: '/pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio',
          getBody: () => ({ uniqueIdentifier, filterZeroValueAccounts: 'true' }),
          description: 'Fetch MF holdings with folio details',
        },
        {
          name: 'Get Transactions',
          key: 'mf-transactions',
          endpoint: '/pfm/api/v2/mutual-fund/user-linked-accounts/transactions',
          getBody: () => ({ uniqueIdentifier, from: dateFrom, to: dateTo }),
          description: 'MF transaction history',
        },
      ],
    },
    {
      category: 'Equity',
      icon: '📊',
      color: 'from-violet-500 to-purple-600',
      endpoints: [
        {
          name: 'Get Holdings',
          key: 'equity-holdings',
          endpoint: '/pfm/api/v2/equity/user-linked-accounts/holdings',
          getBody: () => ({ uniqueIdentifier }),
          description: 'Stock holdings from demat',
        },
        {
          name: 'Get Transactions',
          key: 'equity-transactions',
          endpoint: '/pfm/api/v2/equity/user-linked-accounts/transactions',
          getBody: () => ({ uniqueIdentifier, from: dateFrom, to: dateTo }),
          description: 'Stock transaction history',
        },
      ],
    },
    {
      category: 'ETF & NPS',
      icon: '💼',
      color: 'from-amber-500 to-orange-600',
      endpoints: [
        {
          name: 'Get ETF Holdings',
          key: 'etf-holdings',
          endpoint: '/pfm/api/v2/etf/user-linked-accounts/holdings',
          getBody: () => ({ uniqueIdentifier }),
          description: 'ETF holdings',
        },
        {
          name: 'Get NPS Holdings',
          key: 'nps-holdings',
          endpoint: '/pfm/api/v2/nps/user-linked-accounts/holdings',
          getBody: () => ({ uniqueIdentifier }),
          description: 'NPS account details',
        },
      ],
    },
    {
      category: 'System',
      icon: '⚙️',
      color: 'from-slate-500 to-slate-600',
      endpoints: [
        {
          name: 'Get All FIPs',
          key: 'fips',
          endpoint: '/pfm/api/v2/fips',
          getBody: () => ({}),
          description: 'List all Financial Information Providers',
        },
        {
          name: 'Get User Details',
          key: 'user-details',
          endpoint: '/pfm/api/v2/user-details',
          getBody: () => ({ uniqueIdentifier }),
          description: 'User consent and FI summary',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🔌</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Live API Tester
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/test-dashboard"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <span>🧪</span>
                Test Dashboard
              </Link>
              <Link
                href="/api-reference"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <span>📚</span>
                API Reference
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Finfactor Live API Tester
          </h1>
          <p className="text-slate-400">
            Test real API calls with actual data
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📝</span> Input Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Unique Identifier (Phone)</label>
              <input
                type="text"
                value={uniqueIdentifier}
                onChange={(e) => setUniqueIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Account ID (for statements)</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
                placeholder="e.g., SAVINGS-001"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-sm text-slate-400">
            💡 <strong>Tip:</strong> Default test user is <code className="text-amber-400">8956545791</code>. 
            Enter a different identifier to test with other users.
          </div>
        </motion.div>

        {/* API Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {apis.map((category, catIdx) => (
            <motion.div
              key={catIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${category.color} px-6 py-4`}>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.category}
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {category.endpoints.map((endpoint) => (
                  <button
                    key={endpoint.key}
                    onClick={() => callApi(endpoint.key, endpoint.endpoint, endpoint.getBody())}
                    disabled={loading !== null}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      loading === endpoint.key
                        ? 'bg-amber-500/20 border-2 border-amber-500'
                        : selectedApi === endpoint.key && response
                        ? response.success
                          ? 'bg-emerald-500/10 border-2 border-emerald-500/50'
                          : 'bg-red-500/10 border-2 border-red-500/50'
                        : 'bg-slate-900/50 border border-slate-700 hover:border-slate-500'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {loading === endpoint.key && (
                            <span className="animate-spin">⏳</span>
                          )}
                          {selectedApi === endpoint.key && response && (
                            <span>{response.success ? '✅' : '❌'}</span>
                          )}
                          {endpoint.name}
                        </div>
                        <div className="text-sm text-slate-400">{endpoint.description}</div>
                      </div>
                      <span className="text-slate-500">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Response Section */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border overflow-hidden ${
                response.success ? 'border-emerald-500/50' : 'border-red-500/50'
              }`}
            >
              <div className={`px-6 py-4 ${response.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>{response.success ? '✅' : '❌'}</span>
                    API Response
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      response.success ? 'bg-emerald-500/30 text-emerald-400' : 'bg-red-500/30 text-red-400'
                    }`}>
                      {response.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                    <span className="text-slate-400">{response.time}ms</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {/* Response Summary */}
                {response.data && !response.error && (
                  <div className="mb-4 p-4 bg-slate-900/50 rounded-xl">
                    <h4 className="font-semibold text-slate-300 mb-2">📊 Quick Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {response.data.totalFiData !== undefined && (
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="text-slate-400">Total FI Data</div>
                          <div className="text-2xl font-bold text-cyan-400">{response.data.totalFiData}</div>
                        </div>
                      )}
                      {response.data.fipData && (
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="text-slate-400">FIPs</div>
                          <div className="text-2xl font-bold text-cyan-400">{response.data.fipData.length}</div>
                        </div>
                      )}
                      {response.data.transactions && (
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="text-slate-400">Transactions</div>
                          <div className="text-2xl font-bold text-cyan-400">{response.data.transactions.length}</div>
                        </div>
                      )}
                      {response.data.holdings && (
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="text-slate-400">Holdings</div>
                          <div className="text-2xl font-bold text-cyan-400">{response.data.holdings.length}</div>
                        </div>
                      )}
                      {Array.isArray(response.data) && (
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="text-slate-400">Items</div>
                          <div className="text-2xl font-bold text-cyan-400">{response.data.length}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw JSON */}
                <div>
                  <h4 className="font-semibold text-slate-300 mb-2">📄 Raw Response</h4>
                  <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(response.data || response.error, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center text-slate-500 mt-12">
          <p>Finfactor Account Aggregator • Live API Testing</p>
        </div>
      </div>
    </div>
  );
}

