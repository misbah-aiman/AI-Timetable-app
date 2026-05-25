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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#221e15] rounded-t-[2rem] sm:rounded-3xl shadow-soft-lg w-full max-w-[430px] border border-primary-50 dark:border-primary-900/20 animate-in">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-surface-100 dark:border-primary-900/20">
          <h2 className="text-base font-bold text-gray-800 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center bg-surface-100 dark:bg-primary-900/20 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-surface-200 dark:hover:bg-primary-900/30 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
