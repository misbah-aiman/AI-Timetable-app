// Full-page centered spinner with optional message
export const LoadingSpinner = ({ message = 'Loading…' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3" role="status" aria-label={message}>
    <div className="relative w-11 h-11" aria-hidden="true">
      <div className="w-11 h-11 rounded-full border-[3px] border-black/[0.07] dark:border-white/[0.09]" />
      <div className="absolute inset-0 w-11 h-11 rounded-full border-[3px] border-transparent border-t-primary-500 dark:border-t-primary-400 animate-spin" />
    </div>
    <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium tracking-tight">{message}</p>
  </div>
);

// Inline small spinner (e.g. inside a button or row)
export const Spinner = ({ className = '' }: { className?: string }) => (
  <div
    className={`relative w-5 h-5 shrink-0 ${className}`}
    role="status"
    aria-label="Loading"
    aria-hidden="true"
  >
    <div className="w-5 h-5 rounded-full border-2 border-black/[0.07] dark:border-white/[0.09]" />
    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 dark:border-t-primary-400 animate-spin" />
  </div>
);
