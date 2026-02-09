import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300',
  success: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400',
  info: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
