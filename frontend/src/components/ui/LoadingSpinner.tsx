export const LoadingSpinner = ({ message = 'Loading…' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
    <div className="relative w-10 h-10">
      <div className="w-10 h-10 rounded-full border-[3px] border-black/[0.06] dark:border-white/[0.08]" />
      <div className="absolute inset-0 w-10 h-10 rounded-full border-[3px] border-transparent border-t-primary-500 dark:border-t-primary-400 animate-spin" />
    </div>
    <p className="text-[13px] text-gray-700 dark:text-gray-400 font-medium tracking-tight">{message}</p>
  </div>
);
