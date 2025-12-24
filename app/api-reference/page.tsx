'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Type definitions
interface ApiEndpoint {
  name: string;
  method: string;
  url: string;
  curl: string;
  description: string;
  sampleInput?: string;
  sampleOutput?: string;
}

interface ApiCategory {
  category: string;
  icon: string;
  description: string;
  endpoints: ApiEndpoint[];
}

// API Reference Data
const apiEndpoints: ApiCategory[] = [
  {
    category: 'Test Endpoints',
    icon: '🧪',
    description: 'Internal API routes for testing database operations',
    endpoints: [
      {
        name: 'Run Layer A Tests',
        method: 'GET',
        url: '/api/test/layer-a',
        curl: 'curl -s http://localhost:3000/api/test/layer-a | jq .',
        description: 'Tests User CRUD, API logging, Consent management',
        sampleOutput: '{ "summary": { "passed": 5, "total": 5, "status": "ALL_PASS" } }',
      } as ApiEndpoint,
      {
        name: 'Run Layer B Tests',
        method: 'GET',
        url: '/api/test/layer-b',
        curl: 'curl -s http://localhost:3000/api/test/layer-b | jq .',
        description: 'Tests Accounts, Transactions, Finfactor API integration',
        sampleOutput: '{ "summary": { "passed": 6, "total": 6, "status": "ALL_PASS" } }',
      },
      {
        name: 'Run Layer C Tests',
        method: 'GET',
        url: '/api/test/layer-c',
        curl: 'curl -s http://localhost:3000/api/test/layer-c | jq .',
        description: 'Tests Summaries, Snapshots, Financial Insights',
        sampleOutput: '{ "summary": { "passed": 5, "total": 5, "status": "ALL_PASS" } }',
      },
      {
        name: 'Run Full Flow Test',
        method: 'GET',
        url: '/api/test/full-flow',
        curl: 'curl -s http://localhost:3000/api/test/full-flow | jq .',
        description: 'Tests complete A→B→C data flow with real Finfactor API',
        sampleOutput: '{ "summary": { "passed": 7, "total": 7, "dataFlow": "Finfactor API → Layer A → Layer B → Layer C" } }',
      },
      {
        name: 'Cleanup Layer A',
        method: 'DELETE',
        url: '/api/test/layer-a',
        curl: 'curl -s -X DELETE http://localhost:3000/api/test/layer-a | jq .',
        description: 'Removes Layer A test data',
        sampleOutput: '{ "status": "CLEANED", "message": "Deleted test user..." }',
      },
      {
        name: 'Cleanup Layer B',
        method: 'DELETE',
        url: '/api/test/layer-b',
        curl: 'curl -s -X DELETE http://localhost:3000/api/test/layer-b | jq .',
        description: 'Removes Layer B test data',
        sampleOutput: '{ "status": "CLEANED" }',
      },
      {
        name: 'Cleanup Layer C',
        method: 'DELETE',
        url: '/api/test/layer-c',
        curl: 'curl -s -X DELETE http://localhost:3000/api/test/layer-c | jq .',
        description: 'Removes Layer C test data',
        sampleOutput: '{ "status": "CLEANED" }',
      },
      {
        name: 'Cleanup All',
        method: 'DELETE',
        url: '/api/test/full-flow',
        curl: 'curl -s -X DELETE http://localhost:3000/api/test/full-flow | jq .',
        description: 'Removes all test data',
        sampleOutput: '{ "status": "CLEANED" }',
      },
    ],
  },
  {
    category: 'Finfactor Authentication',
    icon: '🔐',
    description: 'Get access token for Finfactor API calls',
    endpoints: [
      {
        name: 'Login / Get Token',
        method: 'POST',
        url: 'https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/user-login',
        curl: `curl -s -X POST https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/user-login \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "pfm@dhanaprayoga", "password": "7777"}' | jq '.token'`,
        description: 'Authenticate and get JWT token (valid for 24 hours)',
        sampleInput: '{ "userId": "pfm@dhanaprayoga", "password": "7777" }',
        sampleOutput: '{ "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." }',
      },
    ],
  },
  {
    category: 'Deposit APIs',
    icon: '🏦',
    description: 'Bank account and deposit management',
    endpoints: [
      {
        name: 'Get Linked Accounts',
        method: 'POST',
        url: 'https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/deposit/user-linked-accounts',
        curl: `curl -s -X POST https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/deposit/user-linked-accounts \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -d '{"uniqueIdentifier": "8956545791"}' | jq '.totalFiData'`,
        description: 'Fetch all linked bank accounts for a user',
        sampleInput: '{ "uniqueIdentifier": "8956545791" }',
        sampleOutput: '{ "totalFiData": 17, "fipData": [{ "fipName": "Dhanagar Finvu Bank", "linkedAccounts": [...] }] }',
      },
      {
        name: 'Get Account Statement',
        method: 'POST',
        url: 'https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/deposit/user-account-statement',
        curl: `curl -s -X POST https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/deposit/user-account-statement \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -d '{"uniqueIdentifier": "8956545791", "accountId": "SAVINGS-001", "from": "2025-01-01", "to": "2025-12-31"}' | jq '.transactions | length'`,
        description: 'Get transaction history for a specific account',
        sampleInput: '{ "uniqueIdentifier": "8956545791", "accountId": "SAVINGS-001", "from": "2025-01-01", "to": "2025-12-31" }',
        sampleOutput: '{ "transactions": [{ "txnId": "TXN001", "amount": 5000, "type": "CREDIT" }, ...] }',
      },
      {
        name: 'Get Deposit Insights',
        method: 'POST',
        url: 'https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/deposit/insights',
        curl: `curl -s -X POST https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/deposit/insights \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -d '{"uniqueIdentifier": "8956545791", "accountIds": [], "from": "2025-01-01", "to": "2025-12-31", "frequency": "MONTHLY"}' | jq '.depositInsights'`,
        description: 'Get analytics: balance trends, income, expenses',
        sampleInput: '{ "uniqueIdentifier": "8956545791", "accountIds": [], "from": "2025-01-01", "to": "2025-12-31", "frequency": "MONTHLY" }',
        sampleOutput: '{ "depositInsights": { "balance": [...], "incoming": [...], "outgoing": [...] } }',
      },
    ],
  },
  {
    category: 'Mutual Fund APIs',
    icon: '📊',
    description: 'Mutual fund holdings and transactions',
    endpoints: [
      {
        name: 'Get MF Holdings',
        method: 'POST',
        url: 'https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/mutual-fund/user-linked-accounts',
        curl: `curl -s -X POST https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/mutual-fund/user-linked-accounts \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -d '{"uniqueIdentifier": "8956545791", "filterZeroValueAccounts": "true"}' | jq '.totalHoldings'`,
        description: 'Fetch mutual fund holdings with folio details',
        sampleInput: '{ "uniqueIdentifier": "8956545791", "filterZeroValueAccounts": "true" }',
        sampleOutput: '{ "totalHoldings": 5, "currentValue": 150000.50, "holdings": [...] }',
      },
      {
        name: 'Get MF Transactions',
        method: 'POST',
        url: 'https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/mutual-fund/user-account-statement',
        curl: `curl -s -X POST https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/mutual-fund/user-account-statement \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -d '{"uniqueIdentifier": "8956545791", "from": "2024-01-01", "to": "2025-12-31"}' | jq '.transactions | length'`,
        description: 'Get mutual fund transaction history',
        sampleInput: '{ "uniqueIdentifier": "8956545791", "from": "2024-01-01", "to": "2025-12-31" }',
        sampleOutput: '{ "transactions": [{ "schemeName": "HDFC Flexi Cap", "amount": 10000, "type": "PURCHASE" }] }',
      },
    ],
  },
  {
    category: 'Equities APIs',
    icon: '📈',
    description: 'Stock holdings and equity data',
    endpoints: [
      {
        name: 'Get Equity Holdings',
        method: 'POST',
        url: 'https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/equities/user-linked-accounts',
        curl: `curl -s -X POST https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/equities/user-linked-accounts \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -d '{"uniqueIdentifier": "8956545791"}' | jq '.holdings'`,
        description: 'Get stock holdings from demat accounts',
        sampleInput: '{ "uniqueIdentifier": "8956545791" }',
        sampleOutput: '{ "holdings": [{ "symbol": "RELIANCE", "quantity": 50, "currentValue": 125000 }] }',
      },
    ],
  },
  {
    category: 'FIP Management',
    icon: '🏢',
    description: 'Financial Information Provider management',
    endpoints: [
      {
        name: 'List All FIPs',
        method: 'GET',
        url: 'https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/fips',
        curl: `curl -s -X GET https://dhanaprayoga.fiu.finfactor.in/pfm/api/v2/fips \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" | jq '.[0:5]'`,
        description: 'List all available Financial Information Providers',
        sampleInput: '{}',
        sampleOutput: '[{ "fipId": "HDFC-FIP", "fipName": "HDFC Bank", "fiTypes": ["DEPOSIT"] }, ...]',
      },
    ],
  },
];

export default function ApiReferencePage() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            API Reference
          </h1>
          <p className="text-slate-400 text-lg">
            Complete documentation for all Finfactor Account Aggregator endpoints
          </p>
          <Link
            href="/test-dashboard"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </motion.div>

        {/* API Categories */}
        <div className="space-y-6">
          {apiEndpoints.map((category) => {
            const isExpanded = expandedCategories.has(category.category);
            return (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700"
              >
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="w-full text-left flex items-center justify-between mb-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold">{category.category}</h2>
                      <p className="text-slate-400 text-sm">{category.description}</p>
                    </div>
                  </div>
                  <span className="text-2xl text-slate-400">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="space-y-4 mt-6">
                    {category.endpoints.map((endpoint: ApiEndpoint, idx) => {
                      const cmdId = `${category.category}-${idx}`;
                      return (
                        <div
                          key={idx}
                          className="bg-slate-900 rounded-lg p-5 border border-slate-700"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  endpoint.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                                  endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                                  endpoint.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                                  'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {endpoint.method}
                                </span>
                                <span className="font-semibold">{endpoint.name}</span>
                              </div>
                              <p className="text-slate-400 text-sm">{endpoint.description}</p>
                              {endpoint.url && (
                                <code className="text-xs text-cyan-400 mt-1 block">{endpoint.url}</code>
                              )}
                            </div>
                            <button
                              onClick={() => copyToClipboard(endpoint.curl, cmdId)}
                              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                copiedCmd === cmdId
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-700 hover:bg-slate-600 text-white'
                              }`}
                            >
                              {copiedCmd === cmdId ? '✓ Copied!' : '📋 Copy'}
                            </button>
                          </div>
                          
                          {/* Curl Command */}
                          <div className="bg-slate-950 rounded-lg p-3 overflow-x-auto">
                            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                              <code>{endpoint.curl}</code>
                            </pre>
                          </div>

                          {/* Sample Input/Output */}
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {endpoint.sampleInput && (
                              <div>
                                <div className="text-xs text-slate-500 mb-1">Sample Input:</div>
                                <div className="bg-slate-950 rounded-lg p-2 overflow-x-auto">
                                  <pre className="text-xs text-amber-400 font-mono">{endpoint.sampleInput}</pre>
                                </div>
                              </div>
                            )}
                            {endpoint.sampleOutput && (
                              <div>
                                <div className="text-xs text-slate-500 mb-1">Sample Output:</div>
                                <div className="bg-slate-950 rounded-lg p-2 overflow-x-auto">
                                  <pre className="text-xs text-emerald-400 font-mono">{endpoint.sampleOutput}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 mt-12">
          <p>Finfactor Account Aggregator • API Documentation</p>
        </div>
      </div>
    </div>
  );
}

