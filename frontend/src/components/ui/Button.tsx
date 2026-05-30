import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

// Color contrast audit:
// primary-500 (#008080) + white = 4.77:1 — passes AA, but barely.
// primary-600 (#006666) + white = 6.4:1 — comfortable AA/AAA pass.
// FIX: Changed primary variant to use bg-primary-600 as base, hover bg-primary-700.
//      This gives a noticeably richer teal and unambiguous contrast.
//
// secondary: bg-black/[0.05] dark:bg-white/[0.09] was very faint in dark mode.
// FIX: Increased dark opacity to bg-white/[0.12] and added explicit text colors.
//      Hover state also slightly more pronounced.
//
// ghost: text-gray-500 was borderline at small sizes.
// FIX: text-gray-600 dark:text-gray-400 for better base contrast.

const variantClasses = {
  primary:
    'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-soft',
  secondary:
    'bg-black/[0.06] dark:bg-white/[0.12] text-gray-800 dark:text-gray-100 hover:bg-black/[0.10] dark:hover:bg-white/[0.18] active:bg-black/[0.14] dark:active:bg-white/[0.22]',
  danger:
    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
  ghost:
    'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white',
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
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
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
