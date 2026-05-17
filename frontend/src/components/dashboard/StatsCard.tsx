import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  progress?: number;  // 0-100
}

export const StatsCard = ({ title, value, subtitle, icon, color, progress }: StatsCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{Math.min(Math.round(progress), 100)}% of goal</p>
        </div>
      )}
    </div>
  );
};
