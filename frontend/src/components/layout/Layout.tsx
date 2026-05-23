import { ReactNode } from 'react';
import { Navbar } from './Navbar';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen bg-surface-50 dark:bg-[#16141f] shadow-soft-lg flex flex-col">
        <main className="flex-1 px-4 pt-6 pb-28 overflow-y-auto">
          {children}
        </main>
        <Navbar />
      </div>
    </div>
  );
};
