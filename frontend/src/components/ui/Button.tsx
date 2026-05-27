import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantClasses = {
  primary:   'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-soft',
  secondary: 'bg-black/[0.05] dark:bg-white/[0.09] text-gray-700 dark:text-gray-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.13] active:bg-black/[0.12]',
  danger:    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white',
  ghost:     'text-gray-500 dark:text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-[13px] rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-[14px] rounded-2xl gap-2',
  lg: 'px-6 py-[13px] text-[15px] rounded-2xl gap-2',
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
        inline-flex items-center justify-center font-semibold tracking-tight
        transition-all duration-150
        active:scale-[0.96] active:opacity-90
        focus:outline-none
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-[15px] w-[15px] shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
};
