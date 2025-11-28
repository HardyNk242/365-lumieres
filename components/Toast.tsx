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
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto dismiss after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 max-w-sm w-[calc(100%-2rem)] md:w-auto">
      <div className="bg-green-50 border border-green-200 text-green-900 rounded-2xl shadow-xl p-4 flex items-start gap-3 relative">
        <div className="bg-green-100 p-2 rounded-full shrink-0 text-green-600">
          <CheckCircle2 size={20} />
        </div>
        <div className="pr-6">
          <p className="text-sm font-medium leading-snug">
            {message}
          </p>
          {reference && (
            <p className="text-xs text-green-700 mt-1 font-serif italic">
              {reference}
            </p>
          )}
        </div>
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-green-400 hover:text-green-600 p-1 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};