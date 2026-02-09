import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type TabsContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within a Tabs provider');
  return ctx;
}

type TabsProps = {
  defaultTab: string;
  children: ReactNode;
  className?: string;
};

export function Tabs({ defaultTab, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext>
  );
}

type TabListProps = { children: ReactNode; className?: string };

export function TabList({ children, className = '' }: TabListProps) {
  return (
    <div className={`flex gap-1 border-b border-surface-200 dark:border-surface-700 ${className}`}>
      {children}
    </div>
  );
}

type TabProps = { value: string; children: ReactNode };

export function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
        ${
          isActive
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
        }`}
    >
      {children}
    </button>
  );
}

type TabPanelProps = { value: string; children: ReactNode; className?: string };

export function TabPanel({ value, children, className = '' }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;
  return <div className={`pt-4 ${className}`}>{children}</div>;
}
