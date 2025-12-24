'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  subItems?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  activeItem: string;
  activeSubItem?: string;
  onItemClick: (itemId: string) => void;
  onSubItemClick?: (itemId: string, subItemId: string) => void;
}

export default function Sidebar({ items, activeItem, activeSubItem, onItemClick, onSubItemClick }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set([activeItem]));

  const toggleExpand = (itemId: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setExpandedItems(newSet);
  };

  return (
    <div className="w-64 bg-dark-card border-r border-dark-border h-screen overflow-y-auto fixed top-0 left-0 z-50">
      <div className="p-4">
        <h2 className="text-xl font-bold text-dark-text mb-4">Navigation</h2>
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = activeItem === item.id;
            const isExpanded = expandedItems.has(item.id);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleExpand(item.id);
                    } else {
                      onItemClick(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    isActive && !hasSubItems
                      ? 'bg-accent-primary text-white'
                      : 'text-dark-text hover:bg-dark-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {hasSubItems && (
                    <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  )}
                </button>

                {/* Sub Items */}
                {hasSubItems && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 mt-1 space-y-1"
                  >
                    {item.subItems!.map((subItem) => {
                      const isSubActive = activeSubItem === subItem.id && activeItem === item.id;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            if (onSubItemClick) {
                              onSubItemClick(item.id, subItem.id);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
                            isSubActive
                              ? 'bg-accent-primary/20 text-accent-primary border-l-2 border-accent-primary'
                              : 'text-dark-textSecondary hover:bg-dark-border hover:text-dark-text'
                          }`}
                        >
                          <span>{subItem.icon}</span>
                          <span>{subItem.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

