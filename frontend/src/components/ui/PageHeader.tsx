import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const PageHeader = ({ eyebrow, title, action, className = '' }: PageHeaderProps) => (
  <div className={`mb-8 flex items-start justify-between ${className}`}>
    <div>
      <p className="text-xs font-medium text-primary-400 uppercase tracking-widest mb-1.5">{eyebrow}</p>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{title}</h1>
    </div>
    {action && <div className="shrink-0 mt-1">{action}</div>}
  </div>
);
