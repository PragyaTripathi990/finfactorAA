'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Suspense } from 'react';
import { camelToTitleCase, truncate } from '@/lib/formatters';

function CallbackContent() {
  const searchParams = useSearchParams();
  
  // Get all URL parameters
  const allParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  const receiptItems = Object.entries(allParams);

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-success/10 via-transparent to-accent-primary/10" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-accent-success/20 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="glass-effect rounded-3xl p-12"
        >
          {/* Success Checkmark Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-8 relative"
          >
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-accent-success to-accent-primary rounded-full flex items-center justify-center shadow-2xl shadow-accent-success/50">
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
                className="w-20 h-20 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </div>

            {/* Pulsing rings */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-32 h-32 mx-auto border-4 border-accent-success rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute inset-0 w-32 h-32 mx-auto border-4 border-accent-success rounded-full"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-5xl font-bold mb-4 text-center gradient-text"
          >
            Success!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-xl text-dark-textSecondary mb-8 text-center"
          >
            Account aggregation flow completed successfully
          </motion.p>

          {/* Transaction Receipt */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-accent-primary to-accent-secondary rounded-full" />
              Transaction Receipt
            </h2>
            
            <div className="bg-dark-bg/50 rounded-xl border border-dark-border overflow-hidden">
              {receiptItems.length > 0 ? (
                <div className="divide-y divide-dark-border">
                  {receiptItems.map(([key, value], idx) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + idx * 0.05, duration: 0.3 }}
                      className="group hover:bg-accent-primary/5 transition-colors"
                    >
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="font-semibold text-dark-textSecondary min-w-[180px] flex items-center gap-2">
                          <span className="w-1 h-4 bg-gradient-to-b from-accent-success to-accent-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          {camelToTitleCase(key)}
                        </div>
                        <div 
                          className="flex-1 text-dark-text font-mono text-sm break-all"
                          title={value}
                        >
                          <span className="inline-block max-w-full">
                            {value.length > 60 ? (
                              <span title={value}>
                                {truncate(value, 60)}
                              </span>
                            ) : (
                              value
                            )}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-dark-textSecondary">
                  <p>No parameters received</p>
                  <p className="text-sm mt-2">The callback URL did not contain any query parameters</p>
                </div>
              )}
            </div>

            {/* Receipt Footer */}
            {receiptItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="mt-4 text-center text-dark-textSecondary text-sm"
              >
                <p>Received at {new Date().toLocaleString()}</p>
                <p className="mt-1">Total Parameters: {receiptItems.length}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Return to Dashboard Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-center"
          >
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-accent-primary/50 hover:shadow-accent-primary/70 transition-all flex items-center gap-2 mx-auto"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Return to Dashboard
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating particles animation */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [-20, -120],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
            className="absolute w-2 h-2 bg-accent-success rounded-full"
            style={{
              left: `${15 + i * 10}%`,
              bottom: '15%',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark-bg flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
