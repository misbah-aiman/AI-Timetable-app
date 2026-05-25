import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  progress?: number;
}

export const StatsCard = ({ title, value, subtitle, icon, color, progress }: StatsCardProps) => {
  return (
    <div className="bg-white dark:bg-[#261f15] rounded-3xl shadow-card border border-primary-50 dark:border-primary-900/20 p-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wide">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{Math.min(Math.round(progress), 100)}%</p>
        </div>
      )}
    </div>
  );
};
