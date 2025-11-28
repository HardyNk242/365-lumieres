import React, { useMemo } from 'react';
import { DailyStats } from '../types';
import { TrendingUp, Award, Calendar } from 'lucide-react';

interface ProgressChartProps {
  dailyStats: DailyStats[];
  daysElapsed: number;
  totalValidatedDays: number;
  constance: number;
  scheduleStatusMessage: string;
  currentStreak: number;
  bestStreak: number;
}

const parseLocalISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(n => parseInt(n, 10));
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const ProgressChart: React.FC<ProgressChartProps> = ({ dailyStats, daysElapsed, totalValidatedDays, constance, scheduleStatusMessage, currentStreak, bestStreak }) => {
  const chartData = useMemo(() => {
    const maxProgressDay = dailyStats.reduce((max, stat) => {
      return stat.completedSlots > 0 ? Math.max(max, stat.dayIndex) : max;
    }, 0);
    const targetDays = Math.max(daysElapsed || 0, maxProgressDay || 0);
    const daysToShow = Math.min(targetDays, dailyStats.length);
    return dailyStats
      .filter(stat => stat.dayIndex <= daysToShow)
      .map(stat => {
        const date = parseLocalISO(stat.date);
        return {
          label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          progression: stat.progression,
          progressionPercent: Math.round(stat.progression * 100),
          isValidated: stat.isValidated,
        };
      });
  }, [dailyStats, daysElapsed]);

  // Dimensions du graphique SVG
  const width = 600;
  const height = 300;
  const padding = 40;

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 animate-in fade-in zoom-in duration-500">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-indigo-50 p-4 rounded-2xl flex items-center space-x-4">
            <div className="bg-indigo-200 p-3 rounded-full text-indigo-700">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Jours validés</p>
              <p className="text-2xl font-extrabold text-indigo-900">0</p>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl flex items-center space-x-4">
            <div className="bg-orange-200 p-3 rounded-full text-orange-700">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Constance</p>
              <p className="text-2xl font-extrabold text-orange-900">0%</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
          {scheduleStatusMessage}
        </p>
        <p className="text-sm text-slate-500">Aucune donnée de lecture disponible.</p>
      </div>
    );
  }

  const getX = (index: number) => {
    if (chartData.length <= 1) return width / 2;
    return padding + (index / (chartData.length - 1)) * (width - 2 * padding);
  };
  const getY = (value: number) => height - padding - (value / 1) * (height - 2 * padding);

  const pathD = chartData.map((point, index) => {
    const x = getX(index);
    const y = getY(point.progression);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaD = `${pathD} L ${getX(chartData.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  const step = Math.max(1, Math.ceil(chartData.length / 10));

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 animate-in fade-in zoom-in duration-500">
      
      {/* Résumé en haut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-indigo-50 p-4 rounded-2xl flex items-center space-x-4">
           <div className="bg-indigo-200 p-3 rounded-full text-indigo-700">
             <Award size={24} />
           </div>
           <div>
             <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Jours validés</p>
             <p className="text-2xl font-extrabold text-indigo-900">{totalValidatedDays}</p>
           </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl flex items-center space-x-4">
           <div className="bg-orange-200 p-3 rounded-full text-orange-700">
             <TrendingUp size={24} />
           </div>
           <div>
             <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Constance</p>
             <p className="text-2xl font-extrabold text-orange-900">{constance}%</p>
           </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Streak</span>
          </div>
          <div className="mt-2">
            <div className="relative group inline-flex flex-col items-start">
              <p className="text-2xl font-extrabold text-slate-900">
                {currentStreak} <span className="text-base font-semibold text-slate-500">jours</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Record : <span className="font-semibold text-slate-700">{bestStreak} jours</span>
              </p>

              {/* Tooltip custom, positionnee au-dessus, centree sur le texte */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="relative bg-white/95 border border-slate-200/60 shadow-[0_4px_15px_rgba(0,0,0,0.1)] rounded-md px-4 py-3 text-left min-w-[220px]">
                  <p className="text-xs font-semibold text-slate-700">Série actuelle</p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Jours validés consécutivement (jours futurs ignorés).
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Record : <span className="font-semibold text-slate-700">meilleure série</span>.
                  </p>
                  <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-white/95 border-l border-b border-slate-200/60 shadow-[0_4px_15px_rgba(0,0,0,0.1)] rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
        {scheduleStatusMessage}
      </p>

      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calendar size={18} className="text-indigo-500"/>
        Évolution de vos lectures (progression journalière)
      </h3>

      {/* Le Graphique SVG */}
      <div className="w-full aspect-[2/1] relative select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grille de fond */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />

          {/* Dégradé sous la courbe */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#gradient)" />

          {/* La courbe principale */}
          <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {chartData.map((point, index) => {
             if (index % step !== 0 && index !== chartData.length - 1) return null;

             const x = getX(index);
             const y = getY(point.progression);
             
             return (
               <g key={index} className="group">
                 <circle cx={x} cy={y} r="5" fill="white" stroke={point.isValidated ? '#22c55e' : '#4f46e5'} strokeWidth="3" className="transition-all duration-300 group-hover:r-7" />
                 
                 {/* Tooltip simple au survol */}
                 <foreignObject x={x - 20} y={y - 42} width="60" height="30" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-md text-center">
                       {point.progressionPercent}%
                    </div>
                 </foreignObject>
                 
                 {/* Label Axe X */}
                 <text x={x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">
                   {point.label}
                 </text>
               </g>
             );
          })}

          {/* Labels Axe Y (0 et 100%) */}
          <text x={padding - 10} y={height - padding + 4} textAnchor="end" fontSize="10" fill="#94a3b8">0%</text>
          <text x={padding - 10} y={padding + 4} textAnchor="end" fontSize="10" fill="#94a3b8">100%</text>
        </svg>
      </div>
      <p className="text-center text-xs text-slate-400 mt-4 italic">
        Une journée est validée quand Matin, Midi et Soir sont tous cochés; sa progression suit des paliers successifs jusqu’à validation complète.
      </p>
    </div>
  );
};
