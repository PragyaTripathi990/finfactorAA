'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: number | string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-6 py-3 rounded-xl font-semibold transition-all
                flex items-center gap-2 whitespace-nowrap
                ${
                  isActive
                    ? 'text-white'
                    : 'text-dark-textSecondary hover:text-dark-text glass-effect'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 text-xl">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                  relative z-10 px-2 py-0.5 rounded-full text-xs font-bold
                  ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-accent-primary/20 text-accent-primary'
                  }
                `}
                >
                  {tab.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

