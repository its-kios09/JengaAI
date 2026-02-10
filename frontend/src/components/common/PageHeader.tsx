import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
