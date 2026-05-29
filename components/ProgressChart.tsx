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

/**
 * Progression view — metric tiles + curve.
 * Tiles are tinted with the brand palette: brand (validated), brass (constance),
 * olive (streak). Replaces the previous indigo/orange/cyan combo.
 */
export const ProgressChart: React.FC<ProgressChartProps> = ({
  dailyStats, daysElapsed, totalValidatedDays, constance, scheduleStatusMessage, currentStreak, bestStreak
}) => {
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

  const width = 600;
  const height = 300;
  const padding = 40;

  const Tile = ({ icon: Icon, label, value, accent }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string;
    accent: 'brand' | 'brass' | 'olive';
  }) => {
    const styles = {
      brand: 'bg-brand-50 dark:bg-night-surfaceAlt text-brand-500 dark:text-brand-300',
      brass: 'bg-brass-100 dark:bg-brass-soft text-brass-600 dark:text-brass-400',
      olive: 'bg-olive-soft dark:bg-olive-darkSoft text-olive'
    }[accent];
    return (
      <div className="bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border rounded-2xl p-4 flex items-center gap-4 shadow-soft">
        <div className={`p-3 rounded-full ${styles}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-ink-soft dark:text-night-inkMuted font-bold uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-ink dark:text-night-ink mt-0.5">{value}</p>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-paper-surface dark:bg-night-surface rounded-3xl shadow-card border border-paper-border dark:border-night-border p-6 animate-in fade-in zoom-in duration-500">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Tile icon={Award}      label="Jours validés" value="0"  accent="brand" />
          <Tile icon={TrendingUp} label="Constance"     value="0%" accent="brass" />
        </div>
        <p className="text-sm text-ink-muted dark:text-night-inkMuted bg-paper-muted/50 dark:bg-night-surfaceAlt/50 border border-paper-border dark:border-night-border rounded-2xl p-4 mb-4">
          {scheduleStatusMessage}
        </p>
        <p className="text-sm text-ink-soft dark:text-night-inkMuted">Aucune donnée de lecture disponible.</p>
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
    <div className="bg-paper-surface dark:bg-night-surface rounded-3xl shadow-card border border-paper-border dark:border-night-border p-6 animate-in fade-in zoom-in duration-500">

      {/* Metric tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Tile icon={Award}      label="Jours validés" value={`${totalValidatedDays}`} accent="brand" />
        <Tile icon={TrendingUp} label="Constance"     value={`${constance}%`}         accent="brass" />

        <div className="bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border rounded-2xl px-5 py-4 flex flex-col justify-between shadow-soft">
          <span className="text-[11px] font-bold tracking-wider text-ink-soft dark:text-night-inkMuted uppercase">Série</span>
          <p className="text-2xl font-extrabold text-ink dark:text-night-ink mt-1">
            {currentStreak} <span className="text-base font-semibold text-ink-muted dark:text-night-inkMuted">jours</span>
          </p>
          <p className="text-xs text-ink-soft dark:text-night-inkMuted mt-1">
            Record : <span className="font-semibold text-ink dark:text-night-ink">{bestStreak} jours</span>
          </p>
        </div>
      </div>

      {/* Schedule status banner */}
      <p className="text-sm text-ink-muted dark:text-night-inkMuted bg-paper-muted/50 dark:bg-night-surfaceAlt/50 border border-paper-border dark:border-night-border rounded-2xl p-4 mb-6">
        {scheduleStatusMessage}
      </p>

      <h3 className="text-lg font-bold text-ink dark:text-night-ink mb-6 flex items-center gap-2">
        <Calendar size={18} className="text-brand-500 dark:text-brand-300" />
        Évolution de vos lectures (progression journalière)
      </h3>

      {/* SVG chart */}
      <div className="w-full aspect-[2/1] relative select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Background axes */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-paper-border dark:stroke-night-border" strokeWidth="1" />
          <line x1={padding} y1={padding}          x2={padding}        y2={height - padding} className="stroke-paper-border dark:stroke-night-border" strokeWidth="1" />

          {/* Curve area gradient — brand color */}
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#5B4E8F" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5B4E8F" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#curveGradient)" />
          <path d={pathD} fill="none" stroke="#5B4E8F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points + tooltips */}
          {chartData.map((point, index) => {
             if (index % step !== 0 && index !== chartData.length - 1) return null;
             const x = getX(index);
             const y = getY(point.progression);
             return (
               <g key={index} className="group">
                 <circle
                   cx={x}
                   cy={y}
                   r="5"
                   className="fill-paper-surface dark:fill-night-surface transition-all duration-300 group-hover:r-7"
                   stroke={point.isValidated ? '#6B8E4E' : '#5B4E8F'}
                   strokeWidth="3"
                 />
                 <foreignObject x={x - 20} y={y - 42} width="60" height="30" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-ink dark:bg-night-surfaceAlt text-paper-surface dark:text-night-ink text-[10px] py-1 px-2 rounded shadow-soft text-center">
                       {point.progressionPercent}%
                    </div>
                 </foreignObject>
                 <text x={x} y={height - 10} textAnchor="middle" fontSize="10" className="fill-ink-muted dark:fill-night-inkMuted">
                   {point.label}
                 </text>
               </g>
             );
          })}

          {/* Y axis labels */}
          <text x={padding - 10} y={height - padding + 4} textAnchor="end" fontSize="10" className="fill-ink-soft dark:fill-night-inkMuted">0%</text>
          <text x={padding - 10} y={padding + 4}          textAnchor="end" fontSize="10" className="fill-ink-soft dark:fill-night-inkMuted">100%</text>
        </svg>
      </div>
      <p className="text-center text-xs text-ink-soft dark:text-night-inkMuted mt-4 italic">
        Une journée est validée quand Matin, Midi et Soir sont tous cochés ; sa progression suit des paliers successifs jusqu’à validation complète.
      </p>
    </div>
  );
};
