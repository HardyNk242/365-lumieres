import React from 'react';
import { DayPlan, DayProgress } from '../types';
import { Sun, Moon, BookOpen, ChevronRight, Check, CheckCircle2, PenLine } from 'lucide-react';
import { hasNote, PartKey } from '../services/notesStorage';

interface ReadingCardProps {
  dayId: string;
  dayNumber: number;
  date: string;
  plan: DayPlan;
  progress: DayProgress;
  onTogglePart: (dayId: string, part: keyof DayProgress) => void;
  onMarkAllDone: (dayId: string) => void;
  onOpenReading: (reading: { ref: string; title: string; dayKey: string; partKey: PartKey; dayNumber: number }) => void;
}

/**
 * One reading slot (matin / midi / soir) styled as a bento tile.
 * Each slot carries its own time-of-day tint so the day card reads visually
 * like a rhythm — dawn / noon / dusk — rather than a flat list.
 */
const ReadingSection: React.FC<{
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  content: string;
  partKey: PartKey;
  dayId: string;
  dayNumber: number;
  dayKey: string;
  isDone: boolean;
  /** Light-mode tint */
  tint: string;
  /** Dark-mode tint */
  darkTint: string;
  onToggle: () => void;
  onOpen: () => void;
}> = ({
  title, icon: Icon, content, partKey, dayKey,
  isDone, tint, darkTint, onToggle, onOpen
}) => {
  const showNoteBadge = hasNote(dayKey, partKey);

  return (
    <div className={`flex items-stretch rounded-2xl overflow-hidden transition-colors ${tint} ${darkTint}`}>
      <button
        onClick={onOpen}
        type="button"
        className="flex-1 flex items-start gap-4 p-4 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-2xl"
      >
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-surface/60 text-ink/70 dark:bg-night-surface/40 dark:text-night-ink/70">
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDone ? 'text-ink/50 dark:text-night-ink/50' : 'text-ink/70 dark:text-night-ink/70'}`}>
              {title}
            </span>
            {showNoteBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brass-100 dark:bg-brass-soft px-2 py-0.5 text-[10px] font-semibold text-brass-600 dark:text-brass-400">
                <PenLine size={10} /> Note
              </span>
            )}
            <ChevronRight size={14} className="ml-auto text-ink/30 dark:text-night-ink/30 transition-transform group-hover:translate-x-1" />
          </div>
          <p
            className={`mt-1 font-serif text-[17px] leading-snug ${isDone ? 'text-ink/50 line-through decoration-ink/30 dark:text-night-ink/50' : 'text-ink dark:text-night-ink'}`}
          >
            {content}
          </p>
        </div>
      </button>
      <button
        onClick={onToggle}
        type="button"
        aria-label={isDone ? `Désactiver ${title}` : `Valider ${title}`}
        className="w-14 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-colors ${
            isDone
              ? 'border-olive bg-olive text-paper-surface'
              : 'border-ink/30 dark:border-night-ink/30 bg-transparent text-transparent hover:border-olive/70'
          }`}
        >
          <Check size={18} />
        </span>
      </button>
    </div>
  );
};

export const ReadingCard: React.FC<ReadingCardProps> = ({
  dayId,
  dayNumber,
  date,
  plan,
  progress,
  onTogglePart,
  onMarkAllDone,
  onOpenReading
}) => {
  const isFullyComplete = progress.matin && progress.midi && progress.soir;
  const dayKey = dayId;

  return (
    <div className={`rounded-3xl bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border shadow-card overflow-hidden transition-all`}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-paper-border/60 dark:border-night-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink dark:text-night-ink">
              Jour {dayNumber}
            </h2>
            <p className="mt-0.5 text-sm text-ink-muted dark:text-night-inkMuted truncate">
              {plan.jour_semaine ? `${plan.jour_semaine} – ${date}` : date}
            </p>
          </div>

          {isFullyComplete ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-olive-soft dark:bg-olive-darkSoft px-3 py-1 text-xs font-semibold text-olive">
              <CheckCircle2 size={14} /> Terminé
            </span>
          ) : (
            <button
              onClick={() => onMarkAllDone(dayId)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-brass-600 dark:text-brass-400 hover:bg-brass-100 dark:hover:bg-brass-soft transition-colors"
              title="Marquer tout comme lu"
            >
              <CheckCircle2 size={14} /> Tout valider
            </button>
          )}
        </div>
      </div>

      {/* Readings — bento with time-of-day accents */}
      <div className="px-4 pb-5 pt-4 space-y-3">
        <ReadingSection
          title="Matin (A.T.)"
          icon={Sun}
          content={plan.matin_ancien_testament}
          partKey="matin"
          dayId={dayId}
          dayNumber={dayNumber}
          dayKey={dayKey}
          isDone={!!progress.matin}
          tint="bg-slot-dawn"
          darkTint="dark:bg-slot-dawnDark"
          onToggle={() => onTogglePart(dayId, 'matin')}
          onOpen={() => onOpenReading({
            ref: plan.matin_ancien_testament,
            title: 'Matin (A.T.)',
            dayKey, partKey: 'matin', dayNumber
          })}
        />
        <ReadingSection
          title="Midi (Sagesse)"
          icon={BookOpen}
          content={plan.midi_sagesse_poesie}
          partKey="midi"
          dayId={dayId}
          dayNumber={dayNumber}
          dayKey={dayKey}
          isDone={!!progress.midi}
          tint="bg-slot-noon"
          darkTint="dark:bg-slot-noonDark"
          onToggle={() => onTogglePart(dayId, 'midi')}
          onOpen={() => onOpenReading({
            ref: plan.midi_sagesse_poesie,
            title: 'Midi (Sagesse)',
            dayKey, partKey: 'midi', dayNumber
          })}
        />
        <ReadingSection
          title="Soir (N.T.)"
          icon={Moon}
          content={plan.soir_nouveau_testament}
          partKey="soir"
          dayId={dayId}
          dayNumber={dayNumber}
          dayKey={dayKey}
          isDone={!!progress.soir}
          tint="bg-slot-dusk"
          darkTint="dark:bg-slot-duskDark"
          onToggle={() => onTogglePart(dayId, 'soir')}
          onOpen={() => onOpenReading({
            ref: plan.soir_nouveau_testament,
            title: 'Soir (N.T.)',
            dayKey, partKey: 'soir', dayNumber
          })}
        />
      </div>
    </div>
  );
};
