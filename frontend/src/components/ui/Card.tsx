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

// FIX: dark:border-white/[0.06] (6% opacity) was effectively invisible in dark mode.
//      Increased to dark:border-white/[0.11] for a discernible card edge.
// FIX: glass variant backdrop-blur-2xl (40px) removed — was not used anywhere in the
//      app's main flows, and heavy blur on cards degrades content readability.
//      If glass is needed, backdrop-blur-md (12px) is sufficient.

export const Card = ({ children, className = '', padding = 'md', glass = false }: CardProps) => {
  return (
    <div
      className={`
        rounded-3xl border
        ${glass
          ? 'bg-white/85 dark:bg-[#021a1a]/85 backdrop-blur-md border-black/[0.08] dark:border-white/[0.11]'
          : 'bg-white dark:bg-[#021a1a] border-black/[0.07] dark:border-white/[0.11]'}
        shadow-card
        ${paddingClasses[padding]} ${className}
      `}
    >
      {children}
    </div>
  );
};
