import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// FIX: bg-black/[0.04] (4% opacity) was nearly invisible on the white/mint page bg.
//      Users couldn't distinguish input fields at a glance.
//      Changed to bg-gray-100 dark:bg-white/[0.09] — solid, clearly visible backgrounds.
// FIX: focus:bg-white was correct but focus:shadow was very subtle at 12% opacity.
//      Increased focus ring to 15% opacity for clearer interaction feedback.
// FIX: The label text was text-gray-500 at 13px which is borderline; kept but clarified.

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-medium text-gray-600 dark:text-gray-400 mb-1.5 tracking-tight">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-2xl text-[15px] font-normal tracking-tight
            bg-gray-100 dark:bg-white/[0.09]
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            border border-transparent
            focus:outline-none
            focus:bg-white dark:focus:bg-white/[0.13]
            focus:border-primary-500 dark:focus:border-primary-500
            focus:shadow-[0_0_0_3px_rgba(0,128,128,0.15)]
            transition-all duration-200
            ${error
              ? 'border-red-500 bg-red-50/60 dark:bg-red-900/15 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
              : ''}
            ${className}
          `}
          {...rest}
        />
        {error && (
          <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400 tracking-tight font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
