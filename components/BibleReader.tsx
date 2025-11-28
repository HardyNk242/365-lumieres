
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 px-4 py-4 flex items-center space-x-4 shadow-sm">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
           <h2 className="text-lg font-bold text-slate-900 leading-none">{title}</h2>
           <p className="text-sm text-indigo-600 font-medium mt-1 flex items-center gap-1">
             <BookOpen size={12} />
             {reference}
           </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-slate-400">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Chargement du texte...</p>
            </div>
          ) : (
            <div className="text-lg leading-loose font-serif text-slate-800">
              {content.map((item, idx) => {
                if (item.type === 'heading') {
                  return (
                    <h3 key={idx} className="font-sans text-xl font-bold text-indigo-900 mt-8 mb-4 first:mt-0 border-b border-indigo-50 pb-2">
                      {item.text}
                    </h3>
                  );
                }
                return (
                  <span key={idx} className="relative hover:bg-yellow-50 transition-colors rounded px-0.5 group">
                    <sup className="text-[0.65em] font-sans font-bold text-indigo-400 mr-1 select-none top-[-0.4em] relative opacity-70 group-hover:opacity-100">
                      {item.num}
                    </sup>
                    <span>{item.text} </span>
                  </span>
                );
              })}

              <div className="mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm font-sans">
                 Version : Louis Segond 1910
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Notes Card */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <div className="bg-white/95 backdrop-blur border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
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
              placeholder="Ce que ce passage t’a dit aujourd’hui, une prière, une promesse à retenir..."
              className="w-full px-4 pb-3 pt-2 bg-transparent text-sm leading-relaxed text-slate-800 outline-none resize-none"
            />
            <div className="px-4 pb-3">
              <p className="text-xs text-slate-500 font-sans">
                {isSaving && "Enregistrement..."}
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
