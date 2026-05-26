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
    <div className="bg-white dark:bg-[#200306] rounded-3xl border border-black/[0.05] dark:border-white/[0.06] shadow-card p-4 flex flex-col gap-3">
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {icon}
      </div>

      <div>
        <p className="text-[26px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">
          {value}
        </p>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-[0.06em]">
          {title}
        </p>
        {subtitle && (
          <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5 tracking-tight">
            {subtitle}
          </p>
        )}
      </div>

      {progress !== undefined && (
        <div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}18` }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 tracking-tight">
            {Math.min(Math.round(progress), 100)}% of goal
          </p>
        </div>
      )}
    </div>
  );
};
