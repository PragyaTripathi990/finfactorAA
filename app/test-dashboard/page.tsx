'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'RUNNING';
  time?: number;
  data?: any;
  error?: string;
  step?: number;
  layer?: string;
}

interface LayerResult {
  layer: string;
  layerName: string;
  timestamp: string;
  totalTime: number;
  summary: {
    passed: number;
    total: number;
    status: string;
  };
  tests: TestResult[];
  error?: string;
}

export default function TestDashboard() {
  const [results, setResults] = useState<Record<string, LayerResult | null>>({
    A: null,
    B: null,
    C: null,
    FULL: null,
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
    FULL: false,
    ALL: false,
    CLEANUP: false,
  });
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);

  const runTest = async (layer: string, endpoint: string) => {
    setLoading(prev => ({ ...prev, [layer]: true }));
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setResults(prev => ({ ...prev, [layer]: data }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [layer]: {
          layer,
          layerName: `Layer ${layer}`,
          timestamp: new Date().toISOString(),
          totalTime: 0,
          summary: { passed: 0, total: 1, status: 'FAIL' },
          tests: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [layer]: false }));
    }
  };

  const runAllTests = async () => {
    setLoading(prev => ({ ...prev, ALL: true }));
    await runTest('A', '/api/test/layer-a');
    await runTest('B', '/api/test/layer-b');
    await runTest('C', '/api/test/layer-c');
    await runTest('FULL', '/api/test/full-flow');
    setLoading(prev => ({ ...prev, ALL: false }));
  };

  const cleanupAll = async () => {
    setLoading(prev => ({ ...prev, CLEANUP: true }));
    setCleanupStatus('Cleaning...');
    try {
      await fetch('/api/test/layer-a', { method: 'DELETE' });
      await fetch('/api/test/layer-b', { method: 'DELETE' });
      await fetch('/api/test/layer-c', { method: 'DELETE' });
      await fetch('/api/test/full-flow', { method: 'DELETE' });
      setCleanupStatus('✅ All test data cleaned!');
      setResults({ A: null, B: null, C: null, FULL: null });
    } catch (error) {
      setCleanupStatus('❌ Cleanup failed');
    } finally {
      setLoading(prev => ({ ...prev, CLEANUP: false }));
      setTimeout(() => setCleanupStatus(null), 3000);
    }
  };

  const layers = [
    { id: 'A', name: 'Layer A', subtitle: 'Flow & Control', endpoint: '/api/test/layer-a', color: 'from-violet-500 to-purple-600' },
    { id: 'B', name: 'Layer B', subtitle: 'Financial Data', endpoint: '/api/test/layer-b', color: 'from-blue-500 to-cyan-600' },
    { id: 'C', name: 'Layer C', subtitle: 'State & Holdings', endpoint: '/api/test/layer-c', color: 'from-emerald-500 to-teal-600' },
    { id: 'FULL', name: 'Full Flow', subtitle: 'A → B → C', endpoint: '/api/test/full-flow', color: 'from-amber-500 to-orange-600' },
  ];

  const totalPassed = Object.values(results).reduce((sum, r) => sum + (r?.summary?.passed || 0), 0);
  const totalTests = Object.values(results).reduce((sum, r) => sum + (r?.summary?.total || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🧪</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Test Dashboard
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/live-tester"
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <span>🔌</span>
                Live Tester
              </Link>
              <Link
                href="/api-reference"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <span>📚</span>
                API Reference
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <span>🏠</span>
                Home
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Finfactor AA Integration Tests
          </h1>
          <p className="text-slate-400">
            Test all database layers and Finfactor API integration
          </p>
        </motion.div>

        {/* Summary Bar */}
        {totalTests > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  <span className={totalPassed === totalTests ? 'text-emerald-400' : 'text-amber-400'}>
                    {totalPassed}
                  </span>
                  <span className="text-slate-500">/{totalTests}</span>
                </div>
                <div className="text-slate-400">Tests Passed</div>
              </div>
              <div className={`text-6xl ${totalPassed === totalTests ? 'text-emerald-400' : 'text-amber-400'}`}>
                {totalPassed === totalTests ? '✓' : '!'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {layers.map(layer => (
            <motion.button
              key={layer.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => runTest(layer.id, layer.endpoint)}
              disabled={loading[layer.id] || loading.ALL}
              className={`p-4 rounded-xl bg-gradient-to-r ${layer.color} disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
            >
              {loading[layer.id] ? (
                <div className="animate-spin text-2xl">⏳</div>
              ) : (
                <>
                  <div className="font-bold">{layer.name}</div>
                  <div className="text-xs opacity-80">{layer.subtitle}</div>
                </>
              )}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runAllTests}
            disabled={loading.ALL}
            className="p-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.ALL ? (
              <div className="animate-spin text-2xl">⏳</div>
            ) : (
              <>
                <div className="font-bold">Run All</div>
                <div className="text-xs opacity-80">A + B + C + Full</div>
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={cleanupAll}
            disabled={loading.CLEANUP}
            className="p-4 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.CLEANUP ? (
              <div className="animate-spin text-2xl">🧹</div>
            ) : (
              <>
                <div className="font-bold">Cleanup</div>
                <div className="text-xs opacity-80">Remove test data</div>
              </>
            )}
          </motion.button>
        </div>

        {/* Cleanup Status */}
        <AnimatePresence>
          {cleanupStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-slate-800/50 rounded-xl text-center"
            >
              {cleanupStatus}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {layers.map(layer => {
            const result = results[layer.id];
            if (!result) return null;
            
            return (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
                  {/* Layer Header */}
                  <div className={`bg-gradient-to-r ${layer.color} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{result.layerName || layer.name}</h2>
                        <p className="text-sm opacity-80">{layer.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${result.summary.status === 'ALL_PASS' ? 'text-white' : 'text-amber-300'}`}>
                          {result.summary.passed}/{result.summary.total}
                        </div>
                        <div className="text-sm opacity-80">{result.totalTime}ms</div>
                      </div>
                    </div>
                  </div>

                  {/* Tests List */}
                  <div className="p-4">
                    <div className="space-y-2">
                      {result.tests.map((test, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-3 rounded-lg flex items-center justify-between ${
                            test.status === 'PASS' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                            test.status === 'FAIL' ? 'bg-red-500/10 border border-red-500/20' :
                            'bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏳'}
                            </span>
                            <div>
                              <div className="font-medium">
                                {test.step && <span className="text-slate-400 mr-2">Step {test.step}:</span>}
                                {test.name}
                              </div>
                              {test.data && (
                                <div className="text-sm text-slate-400 mt-1">
                                  {JSON.stringify(test.data)}
                                </div>
                              )}
                              {test.error && (
                                <div className="text-sm text-red-400 mt-1">
                                  ⚠️ {test.error}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-slate-400 text-sm">
                            {test.time}ms
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center text-slate-500 mt-12">
          <p>Finfactor Account Aggregator • Integration Testing Suite</p>
          <p className="text-sm mt-1">
            Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...
          </p>
        </div>
      </div>
    </div>
  );
}
