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
          <label className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 tracking-tight">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-2xl text-[15px] font-normal tracking-tight
            bg-black/[0.04] dark:bg-white/[0.06]
            text-gray-900 dark:text-white
            placeholder-gray-400/70 dark:placeholder-gray-500
            border border-transparent
            focus:outline-none focus:bg-white dark:focus:bg-white/[0.10]
            focus:border-primary-400/60 dark:focus:border-primary-500/50
            focus:shadow-[0_0_0_3px_rgba(192,22,25,0.12)]
            transition-all duration-200
            ${error ? 'border-red-400/60 bg-red-50/50 dark:bg-red-900/10 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}
            ${className}
          `}
          {...rest}
        />
        {error && <p className="mt-1.5 text-[12px] text-red-500 tracking-tight">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
