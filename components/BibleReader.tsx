
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { getBibleText } from '../services/bibleService';
import { PartKey, useReadingNote } from '../services/notesStorage';

interface BibleReaderProps {
  reference: string;
  title: string;
  dayKey: string;
  partKey: PartKey;
  dayNumber: number;
  onBack: () => void;
}

interface ContentItem {
  type: 'heading' | 'verse';
  text: string;
  num?: string;
}

/**
 * Editorial Bible reader.
 *
 * Layout mirrors the Android app: paper-warm canvas, Merriweather body text,
 * brass-colored verse numerals as superscripts, and chapter headers framed by
 * a thin brass rule on each side. Selection highlight uses a soft brass wash
 * rather than the previous yellow.
 */
export const BibleReader: React.FC<BibleReaderProps> = ({ reference, title, dayKey, partKey, dayNumber, onBack }) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { note, setNote } = useReadingNote(dayKey, partKey);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchText = async () => {
      setLoading(true);
      try {
        const result = await getBibleText(reference);
        setContent(result.content);
      } catch (err) {
        console.error(err);
        setContent([{ type: 'heading', text: "Erreur lors du chargement du texte." }]);
      }
      setLoading(false);
    };
    fetchText();
  }, [reference]);

  const partLabel = partKey === 'matin' ? 'Matin' : partKey === 'midi' ? 'Midi' : 'Soir';

  return (
    <div className="min-h-screen bg-paper dark:bg-night-canvas text-ink dark:text-night-ink flex flex-col animate-in slide-in-from-right duration-300">
      {/* Sticky Header */}
      <div className="bg-paper-surface dark:bg-night-surface border-b border-paper-border dark:border-night-border sticky top-0 z-20 px-4 py-4 flex items-center space-x-4 shadow-soft">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-paper-muted dark:hover:bg-night-surfaceAlt text-ink-muted dark:text-night-inkMuted transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="min-w-0">
           <h2 className="text-lg font-bold text-ink dark:text-night-ink leading-none truncate">{title}</h2>
           <p className="text-sm text-brass-600 dark:text-brass-400 font-medium mt-1 flex items-center gap-1.5 truncate">
             <BookOpen size={12} />
             {reference}
           </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-5 pt-8 pb-40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-ink-muted dark:text-night-inkMuted">
              <Loader2 size={32} className="animate-spin text-brand-500 dark:text-brand-300" />
              <p className="text-sm font-medium">Chargement du texte…</p>
            </div>
          ) : (
            <div className="text-[17px] leading-[1.85] font-serif text-ink dark:text-night-ink">
              {content.map((item, idx) => {
                if (item.type === 'heading') {
                  // Chapter heading rendered as a centered uppercase title between two brass rules.
                  return (
                    <div key={idx} className="mt-10 mb-5 first:mt-0 flex items-center gap-4">
                      <span className="h-px flex-1 bg-brass-600/40 dark:bg-brass-400/40" />
                      <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-brass-600 dark:text-brass-400 whitespace-nowrap">
                        {item.text}
                      </h3>
                      <span className="h-px flex-1 bg-brass-600/40 dark:bg-brass-400/40" />
                    </div>
                  );
                }
                return (
                  <span key={idx} className="relative hover:bg-brass-100/60 dark:hover:bg-brass-soft/40 transition-colors rounded px-0.5 group">
                    <sup className="text-[0.6em] font-sans font-bold text-brass-600 dark:text-brass-400 mr-1 select-none top-[-0.45em] relative">
                      {item.num}
                    </sup>
                    <span>{item.text} </span>
                  </span>
                );
              })}

              <div className="mt-12 pt-8 border-t border-paper-border dark:border-night-border text-center text-ink-soft dark:text-night-inkMuted text-sm font-sans">
                 Version : Louis Segond 1910
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Notes Card */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <div className="bg-paper-surface/95 dark:bg-night-surface/95 backdrop-blur border border-paper-border dark:border-night-border shadow-card rounded-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-paper-border dark:border-night-border flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-500 dark:text-brand-300">
                Notes sur ce passage (Jour {dayNumber} – {partLabel})
              </span>
            </div>

            <textarea
              value={note}
              onChange={(e) => {
                const value = e.target.value;
                setNote(value);
                setIsSaving(true);
                setJustSaved(false);

                if (saveTimerRef.current) {
                  window.clearTimeout(saveTimerRef.current);
                }

                saveTimerRef.current = window.setTimeout(() => {
                  setIsSaving(false);
                  setJustSaved(true);
                  window.setTimeout(() => setJustSaved(false), 1500);
                }, 500);
              }}
              rows={3}
              placeholder="Ce que ce passage t’a dit aujourd’hui, une prière, une promesse à retenir…"
              className="w-full px-4 pb-3 pt-2 bg-transparent text-sm leading-relaxed text-ink dark:text-night-ink placeholder:text-ink-soft dark:placeholder:text-night-inkMuted outline-none resize-none"
            />
            <div className="px-4 pb-3">
              <p className="text-xs text-ink-soft dark:text-night-inkMuted font-sans">
                {isSaving && "Enregistrement…"}
                {!isSaving && justSaved && "Enregistré ✔"}
                {!isSaving && !justSaved && "Enregistrement automatique sur cet appareil."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
