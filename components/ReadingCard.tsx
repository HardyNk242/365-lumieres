import React from 'react';
import { DayPlan, DayProgress } from '../types';
import { Sun, Moon, BookOpen, Square, CheckSquare, ChevronRight, CheckCircle2 } from 'lucide-react';
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

  const ReadingSection = ({ 
    title, 
    icon: Icon, 
    content, 
    partKey, 
    colorClass, 
    bgClass 
  }: { 
    title: string, 
    icon: any, 
    content: string, 
    partKey: PartKey,
    colorClass: string,
    bgClass: string
  }) => (
    <div 
      className={`flex items-stretch rounded-xl transition-all border overflow-hidden ${progress[partKey] ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md'}`}
    >
      {/* Clickable Main Area -> Opens Reader */}
      <div 
        onClick={() => onOpenReading({ ref: content, title, dayKey, partKey, dayNumber })}
        className="flex-1 flex items-start p-4 cursor-pointer group"
      >
        <div className={`p-2.5 rounded-xl mt-1 shrink-0 transition-colors ${progress[partKey] ? 'bg-slate-200 text-slate-400' : bgClass + ' ' + colorClass}`}>
          <Icon size={20} />
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${progress[partKey] ? 'text-slate-400' : 'text-slate-500'}`}>{title}</span>
            <div className="flex items-center gap-2">
              {hasNote(dayKey, partKey) && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-600 flex items-center gap-1">
                  ✍️ Note
                </span>
              )}
              <ChevronRight size={16} className={`text-slate-300 transition-transform group-hover:translate-x-1 ${progress[partKey] ? 'hidden' : ''}`} />
            </div>
          </div>
          <p className={`font-serif text-lg leading-relaxed transition-colors ${progress[partKey] ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800 group-hover:text-indigo-900'}`}>
            {content}
          </p>
        </div>
      </div>

      {/* Checkbox Area -> Toggles Progress */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onTogglePart(dayId, partKey);
        }}
        className={`w-16 flex items-center justify-center border-l cursor-pointer transition-colors ${progress[partKey] ? 'border-slate-200 hover:bg-slate-100' : 'border-slate-50 bg-slate-50 hover:bg-green-50'}`}
      >
        <div className={`${progress[partKey] ? 'text-green-500' : 'text-slate-300 hover:text-green-400'}`}>
          {progress[partKey] ? <CheckSquare size={24} /> : <Square size={24} />}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-500 ${isFullyComplete ? 'ring-2 ring-green-500/20' : ''}`}>
      {/* Header */}
      <div className="bg-white p-6 pb-2 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Jour {dayNumber}</h2>
                
                {/* Bouton Tout Cocher */}
                {!isFullyComplete && (
                    <button 
                        onClick={() => onMarkAllDone(dayId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold transition-colors shadow-sm border border-indigo-100 group"
                        title="Marquer tout comme lu"
                    >
                        <CheckCircle2 size={14} className="group-hover:scale-110 transition-transform" />
                        <span>Tout valider</span>
                    </button>
                )}
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">{plan.jour_semaine} - {date}</p>
          </div>
          {isFullyComplete && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full animate-in fade-in zoom-in flex items-center gap-1">
              <CheckCircle2 size={12} /> Terminé
            </span>
          )}
        </div>
      </div>

      {/* Readings */}
      <div className="p-4 space-y-3 pb-6">
        <ReadingSection 
          title="Matin (A.T.)" 
          icon={Sun} 
          content={plan.matin_ancien_testament} 
          partKey="matin"
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
        
        <ReadingSection 
          title="Midi (Sagesse)" 
          icon={BookOpen} 
          content={plan.midi_sagesse_poesie} 
          partKey="midi"
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />

        <ReadingSection 
          title="Soir (N.T.)" 
          icon={Moon} 
          content={plan.soir_nouveau_testament} 
          partKey="soir"
          colorClass="text-slate-700"
          bgClass="bg-slate-100"
        />
      </div>
    </div>
  );
};
