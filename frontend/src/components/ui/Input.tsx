import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-2xl border text-sm
            bg-surface-50 dark:bg-[#1e1b2e]
            text-gray-900 dark:text-gray-100
            border-primary-100 dark:border-primary-900/30
            placeholder-gray-300 dark:placeholder-gray-600
            focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent
            transition-all duration-150
            ${error ? 'border-red-400 focus:ring-red-300' : ''}
            ${className}
          `}
          {...rest}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
