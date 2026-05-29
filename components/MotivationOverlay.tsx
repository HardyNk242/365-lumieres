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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 dark:bg-night-canvas/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-paper-surface/95 dark:bg-night-surface/95 rounded-3xl shadow-card border border-paper-border dark:border-night-border max-w-md w-[90%] p-6 text-center space-y-3 animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-brass-600 dark:text-brass-400">
          Journée {completedDayIndex} validée
        </p>
        <h3 className="text-xl font-bold text-ink dark:text-night-ink">
          {message}
        </h3>
        {reference && (
          <p className="text-sm text-ink-muted dark:text-night-inkMuted font-serif italic">
            {reference}
          </p>
        )}
      </div>
    </div>
  );
};
