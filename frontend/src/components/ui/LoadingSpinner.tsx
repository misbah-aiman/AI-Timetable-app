export const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
    <p className="text-gray-400 text-sm font-medium">{message}</p>
  </div>
);
