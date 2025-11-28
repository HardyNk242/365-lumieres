import React from 'react';
import { DailyStats } from '../types';

interface Props {
  dailyStats: DailyStats[];
  weeks: string[][];
}

export const GlobalProgressWidget: React.FC<Props> = ({ dailyStats, weeks }) => {
  const totalDays = 365;
  const totalWeeks = weeks.length;

  const dayStatsByKey: Record<string, DailyStats> = {};
  dailyStats.forEach(day => {
    dayStatsByKey[`day_${day.dayIndex}`] = day;
  });

  const validatedDaysCount = dailyStats.filter(day => day.isValidated).length;
  let validatedWeeksCount = 0;

  weeks.forEach(weekDays => {
    let weekComplete = true;
    weekDays.forEach(dayKey => {
      const isDayComplete = dayStatsByKey[dayKey]?.isValidated;
      if (!isDayComplete) {
        weekComplete = false;
      }
    });
    if (weekComplete) validatedWeeksCount++;
  });

  const percentage = totalDays === 0 ? 0 : Math.min(100, Math.round((validatedDaysCount / totalDays) * 100));
  
  // SVG Parameters for Desktop Ring
  const radius = 56;
  const stroke = 5;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      {/* Desktop Widget - Fixed Position */}
      <div className="hidden lg:flex fixed top-[88px] right-[24px] z-20 flex-col items-center animate-in slide-in-from-right-4 fade-in duration-700">
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl text-white ring-4 ring-white/50">
          {/* SVG Progress Ring */}
          <svg
            height={radius * 2}
            width={radius * 2}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-90deg]"
          >
             {/* Background Track */}
            <circle
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={stroke}
              fill="transparent"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Foreground Progress */}
            <circle
              stroke="#4ade80" // green-400
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
              strokeLinecap="round"
              fill="transparent"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>

          <div className="text-center z-10 p-1 flex flex-col items-center justify-center select-none">
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-1">
              PROGRESSION GLOBALE
            </div>
            <div className="text-xl font-extrabold leading-tight tracking-tight">
              {validatedDaysCount}
              <span className="text-xs font-normal opacity-70 block -mt-0.5">/ {totalDays} jours</span>
            </div>
            <div className="text-[10px] font-bold opacity-90 mt-2 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
              {validatedWeeksCount} / {totalWeeks} semaines
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Widget - Inline Flow */}
      <div className="lg:hidden bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-4 rounded-2xl shadow-lg mb-6 flex items-center justify-between mx-1 ring-1 ring-white/20">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            PROGRESSION GLOBALE
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold">{validatedDaysCount}</span>
            <span className="text-xs opacity-80">/ {totalDays} jours validés</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs font-medium opacity-90 mb-1.5">
            {validatedWeeksCount} / {totalWeeks} semaines
          </div>
          {/* Simple bar for mobile */}
          <div className="w-28 h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] transition-all duration-700" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
