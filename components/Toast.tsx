import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  reference?: string;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, reference, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 max-w-sm w-[calc(100%-2rem)] md:w-auto">
      <div className="bg-olive-soft dark:bg-olive-darkSoft border border-olive/30 text-ink dark:text-night-ink rounded-2xl shadow-card p-4 flex items-start gap-3 relative">
        <div className="bg-olive/20 p-2 rounded-full shrink-0 text-olive">
          <CheckCircle2 size={20} />
        </div>
        <div className="pr-6">
          <p className="text-sm font-medium leading-snug">
            {message}
          </p>
          {reference && (
            <p className="text-xs text-olive mt-1 font-serif italic">
              {reference}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-2 right-2 text-olive/60 hover:text-olive p-1 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
