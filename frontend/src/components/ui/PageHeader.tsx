import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const PageHeader = ({ eyebrow, title, action, className = '' }: PageHeaderProps) => (
  <div className={`mb-6 flex items-start justify-between animate-slide-up ${className}`}>
    <div>
      <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-[0.10em] mb-1">
        {eyebrow}
      </p>
      <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
        {title}
      </h1>
    </div>
    {action && <div className="shrink-0 mt-1.5">{action}</div>}
  </div>
);
