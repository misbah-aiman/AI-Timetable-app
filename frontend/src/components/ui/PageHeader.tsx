import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const PageHeader = ({ eyebrow, title, action, className = '' }: PageHeaderProps) => (
  <div className={`mb-6 flex items-start justify-between animate-slide-up ${className}`}>
    <div className="flex items-start gap-3 min-w-0">
      {/* Left accent bar */}
      <div className="w-1 h-full rounded-full bg-gradient-to-b from-primary-400 to-primary-600 self-stretch mt-0.5 shrink-0 hidden sm:block" aria-hidden="true" />
      <div>
        <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-[0.12em] mb-1">
          {eyebrow}
        </p>
        <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h1>
      </div>
    </div>
    {action && <div className="shrink-0 mt-1.5 ml-4">{action}</div>}
  </div>
);
