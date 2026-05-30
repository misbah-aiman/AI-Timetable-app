import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="
        relative w-full sm:max-w-[440px]
        bg-white dark:bg-[#021a1a]
        rounded-t-[2rem] sm:rounded-[1.75rem]
        border border-black/[0.08] dark:border-white/[0.11]
        shadow-sheet
        animate-sheet-up sm:animate-scale-in
        max-h-[92dvh] flex flex-col
      ">
        {/* Handle bar — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-[4px] rounded-full bg-black/10 dark:bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 sm:pt-5 pb-3.5 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-black/[0.06] dark:bg-white/[0.09] text-gray-500 dark:text-gray-400 hover:bg-black/[0.10] dark:hover:bg-white/[0.14] transition-colors active:scale-90"
            aria-label="Close"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto scroll-ios">
          {children}
        </div>
      </div>
    </div>
  );
};
