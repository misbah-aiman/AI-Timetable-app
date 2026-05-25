import { ReactNode } from 'react';
import { Navbar } from './Navbar';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#18160f] transition-colors">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-28 md:pb-12">
        {children}
      </main>
    </div>
  );
};
