import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: ReactNode;
};

function getAutoComplete(type?: string, label?: string): string | undefined {
  const l = label?.toLowerCase() || '';
  if (type === 'email') return 'email';
  if (l.includes('confirm') || l.includes('new')) return 'new-password';
  if (type === 'password') return 'current-password';
  if (l.includes('name')) return 'name';
  return undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, autoComplete, type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            autoComplete={autoComplete || getAutoComplete(type, label)}
            className={`w-full rounded-lg border bg-white dark:bg-surface-800
              border-surface-300 dark:border-surface-600
              text-surface-900 dark:text-surface-100
              placeholder:text-surface-400 dark:placeholder:text-surface-500
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:opacity-50 disabled:cursor-not-allowed
              px-3 py-2 text-sm
              ${icon ? 'pl-10' : ''}
              ${isPassword ? 'pr-10' : ''}
              ${error ? 'border-danger-500 focus:ring-danger-500' : ''}
              ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
