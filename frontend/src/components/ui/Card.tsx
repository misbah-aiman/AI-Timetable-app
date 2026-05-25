import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export const Card = ({ children, className = '', padding = 'md' }: CardProps) => {
  return (
    <div
      className={`
        bg-white dark:bg-[#261f15] rounded-3xl shadow-card border border-primary-50 dark:border-primary-900/20
        ${paddingClasses[padding]} ${className}
      `}
    >
      {children}
    </div>
  );
};
