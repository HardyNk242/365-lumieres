import React from 'react';

interface MotivationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  reference?: string;
  completedDayIndex: number;
}

export const MotivationOverlay: React.FC<MotivationOverlayProps> = ({
  isOpen,
  onClose,
  message,
  reference,
  completedDayIndex,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white/95 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-[90%] p-6 text-center space-y-3 animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          Journée {completedDayIndex} validée
        </p>
        <h3 className="text-xl font-bold text-slate-800">
          {message}
        </h3>
        {reference && (
          <p className="text-sm text-slate-500 font-serif italic">
            {reference}
          </p>
        )}
      </div>
    </div>
  );
};
