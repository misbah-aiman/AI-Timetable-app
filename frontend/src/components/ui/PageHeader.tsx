import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const PageHeader = ({ eyebrow, title, action, className = '' }: PageHeaderProps) => (
  <div className={`mb-6 flex items-start justify-between animate-slide-up ${className}`}>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-primary-500 dark:text-primary-400 uppercase tracking-[0.14em] mb-0.5">
        {eyebrow}
      </p>
      <h1 className="text-[30px] md:text-[34px] font-bold text-gray-900 dark:text-white tracking-[-0.5px] leading-[1.1]">
        {title}
      </h1>
    </div>
    {action && <div className="shrink-0 mt-2 ml-4">{action}</div>}
  </div>
);
