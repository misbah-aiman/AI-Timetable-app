import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  glass?: boolean;
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export const Card = ({ children, className = '', padding = 'md', glass = false }: CardProps) => {
  return (
    <div
      className={`
        rounded-3xl border
        ${glass
          ? 'bg-white/75 dark:bg-[#200306]/75 backdrop-blur-2xl border-black/[0.06] dark:border-white/[0.07]'
          : 'bg-white dark:bg-[#200306] border-black/[0.05] dark:border-white/[0.06]'}
        shadow-card
        ${paddingClasses[padding]} ${className}
      `}
    >
      {children}
    </div>
  );
};
