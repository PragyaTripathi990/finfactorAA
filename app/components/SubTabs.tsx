'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubTab {
  id: string;
  label: string;
  icon?: string;
}

interface SubTabsProps {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  category: string;
}

export default function SubTabs({ tabs, activeTab, onTabChange, category }: SubTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-4 py-2 rounded-lg font-medium transition-all text-sm
                flex items-center gap-2 whitespace-nowrap
                ${
                  isActive
                    ? 'text-white bg-accent-primary shadow-lg shadow-accent-primary/30'
                    : 'text-dark-textSecondary hover:text-dark-text hover:bg-dark-card'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.icon && <span className="text-base">{tab.icon}</span>}
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

