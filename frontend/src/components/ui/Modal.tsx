import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const titleId  = 'modal-title';
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (!focusable.length) { e.preventDefault(); return; }

        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    // Move focus into modal on open
    const raf = requestAnimationFrame(() => {
      const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      firstFocusable?.focus();
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      cancelAnimationFrame(raf);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="
          relative w-full sm:max-w-[440px]
          bg-white dark:bg-[#021a1a]
          rounded-t-[2rem] sm:rounded-[1.75rem]
          border border-black/[0.08] dark:border-white/[0.11]
          shadow-sheet
          animate-sheet-up sm:animate-scale-in
          max-h-[92dvh] flex flex-col
        "
      >
        {/* Handle bar — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0" aria-hidden="true">
          <div className="w-9 h-[4px] rounded-full bg-black/10 dark:bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 sm:pt-5 pb-3.5 border-b border-black/[0.08] dark:border-white/[0.10] shrink-0">
          <h2
            id={titleId}
            className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-black/[0.06] dark:bg-white/[0.09] text-gray-500 dark:text-gray-400 hover:bg-black/[0.10] dark:hover:bg-white/[0.14] transition-colors active:scale-90"
            aria-label="Close dialog"
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
