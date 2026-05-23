import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantClasses = {
  primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-soft',
  secondary: 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  ghost: 'text-gray-500 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-gray-800',
};

const sizeClasses = {
  sm: 'px-3.5 py-1.5 text-sm rounded-2xl',
  md: 'px-5 py-2.5 text-sm rounded-2xl',
  lg: 'px-6 py-3.5 text-base rounded-3xl',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-150 active:scale-[0.97]
        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
};
