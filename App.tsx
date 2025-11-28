import React, { useState, useEffect, useMemo, useRef } from 'react';
import { biblePlanData } from './data';
import { ReadingProgress, ViewMode, DayProgress, DailyStats, ScheduleStatus } from './types';
import { ReadingCard } from './components/ReadingCard';
import { BibleReader } from './components/BibleReader';
import { ProgressChart } from './components/ProgressChart';
import { GlobalProgressWidget } from './components/GlobalProgressWidget';
import { MotivationOverlay } from './components/MotivationOverlay';
import { getWeeklyMotivation } from './data/motivations';
import { getScheduleStatus, getScheduleStatusMessage } from './services/scheduleStatus';
import { PartKey } from './services/notesStorage';
import { List, Settings, Book, ArrowRight, Calendar as CalendarIcon, ArrowLeft, RotateCcw, BarChart2, CheckCircle2 } from 'lucide-react';

// --- Utility for Progress Migration ---
const migrateProgress = (saved: any): ReadingProgress => {
  if (!saved) return {};
  const newProgress: ReadingProgress = {};
  
  Object.keys(saved).forEach(key => {
      const val = saved[key];
      if (typeof val === 'boolean') {
           if (val) {
               newProgress[key] = { matin: true, midi: true, soir: true };
           }
      } else if (typeof val === 'object') {
          newProgress[key] = val as DayProgress;
      }
  });
  return newProgress;
}

const normalizeToUserDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseDateInput = (value: string) => {
  const [y, m, d] = value.split('-').map(n => parseInt(n, 10));
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const countDoneParts = (day: DayProgress) => {
  let done = 0;
  if (day.matin) done++;
  if (day.midi) done++;
  if (day.soir) done++;
  return done;
};

const formatDateISO = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(n => parseInt(n, 10));
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const differenceInCalendarDays = (left: Date, right: Date) => {
  const l = normalizeToUserDay(left);
  const r = normalizeToUserDay(right);
  return Math.floor((l.getTime() - r.getTime()) / (1000 * 60 * 60 * 24));
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const computeCurrentStreak = (dailyStats: DailyStats[], today: Date): number => {
  const todayEnd = endOfDay(today);
  let streak = 0;

  for (let i = dailyStats.length - 1; i >= 0; i--) {
    const day = dailyStats[i];
    const date = parseISODate(day.date);

    if (date > todayEnd) {
      continue; // futur, on ignore
    }

    if (day.isValidated) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const computeBestStreak = (dailyStats: DailyStats[], today: Date): number => {
  const todayEnd = endOfDay(today);
  let best = 0;
  let streak = 0;

  for (const day of dailyStats) {
    const date = parseISODate(day.date);
    if (date > todayEnd) {
      break;
    }

    if (day.isValidated) {
      streak++;
      if (streak > best) best = streak;
    } else {
      streak = 0;
    }
  }

  return best;
};

const buildDailyStats = (startDate: Date, progress: ReadingProgress): DailyStats[] => {
  const start = normalizeToUserDay(startDate);
  const totalDays = 365;

  const stats: DailyStats[] = [];
  for (let dayIndex = 1; dayIndex <= totalDays; dayIndex++) {
    const date = new Date(start);
    date.setDate(start.getDate() + (dayIndex - 1));
    const dayKey = `day_${dayIndex}`;
    const dayProgress = progress[dayKey] || { matin: false, midi: false, soir: false };
    const completedSlots = countDoneParts(dayProgress);
    const progression = completedSlots / 3;

    stats.push({
      date: formatDateISO(date),
      dayIndex,
      completedSlots,
      progression,
      isValidated: progression === 1
    });
  }

  return stats;
};

const logDayStats = (dayId: string, progress: DayProgress) => {
  const done = countDoneParts(progress);
  const progression = done / 3;
  const jourValide = done === 3;
  console.log(`[Stats] ${dayId} -> lectures terminées: ${done}/3 | progression=${progression.toFixed(2)} | jour_valide=${jourValide}`);
};

// --- Welcome Screen Component ---
const WelcomeScreen: React.FC<{ onStart: (date: Date) => void }> = ({ onStart }) => {
  const [dateInput, setDateInput] = useState(formatDateISO(normalizeToUserDay(new Date())));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(parseDateInput(dateInput));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-indigo-600 rounded-b-[3rem] shadow-lg z-0"></div>
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100 z-10 mt-10 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner ring-4 ring-white">
          <Book size={48} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">365 lumières</h1>
        <p className="text-slate-600 mb-10 leading-relaxed">
          Votre parcours quotidien à travers la Bible.
          Indiquez votre date de départ, et nous organiserons vos lectures Matin, Midi et Soir.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
              Date de début
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <CalendarIcon size={18} />
              </div>
              <input
                id="startDate"
                type="date"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="block w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 shadow-sm"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center space-x-2 text-lg"
          >
            <span>Commencer</span>
            <ArrowRight size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main Application Component ---
const App: React.FC = () => {
  // -- State --
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    return !!localStorage.getItem('biblePlanStartDate');
  });

  const [startDate, setStartDate] = useState<Date>(() => {
    const saved = localStorage.getItem('biblePlanStartDate');
    return saved ? new Date(saved) : new Date();
  });

  const [progress, setProgress] = useState<ReadingProgress>(() => {
    const saved = localStorage.getItem('biblePlanProgress');
    const parsed = saved ? JSON.parse(saved) : {};
    return migrateProgress(parsed);
  });

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.READER);
  const [showSettings, setShowSettings] = useState(false);
  
  // Motivation overlay state
  const [motivationState, setMotivationState] = useState<{ open: boolean; message: string; reference?: string; completedDayIndex: number }>({
    open: false,
    message: '',
    reference: '',
    completedDayIndex: 0
  });

  // Reading Logic State
  const [viewingDayNum, setViewingDayNum] = useState<number>(1);
  type SelectedReading = { ref: string; title: string; dayKey: string; partKey: PartKey; dayNumber: number };
  const [selectedReading, setSelectedReading] = useState<SelectedReading | null>(null);

  // Ref for scrolling to active week
  const activeWeekRef = useRef<HTMLDivElement>(null);

  const startDateLocal = useMemo(() => normalizeToUserDay(startDate), [startDate]);

  // -- Calculated current actual day based on date --
  const currentActualDayNum = useMemo(() => {
    const today = normalizeToUserDay(new Date());
    let day = Math.floor((today.getTime() - startDateLocal.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (day < 1) day = 1;
    return day;
  }, [startDateLocal]);

  useEffect(() => {
    setViewingDayNum(currentActualDayNum > 365 ? 365 : currentActualDayNum);
  }, [currentActualDayNum]);

  useEffect(() => {
    if (hasStarted) {
      localStorage.setItem('biblePlanStartDate', startDateLocal.toISOString());
    }
  }, [startDateLocal, hasStarted]);

  useEffect(() => {
    localStorage.setItem('biblePlanProgress', JSON.stringify(progress));
  }, [progress]);

  // Auto-close motivation overlay
  useEffect(() => {
    if (!motivationState.open) return;
    const timer = setTimeout(() => {
      setMotivationState(s => ({ ...s, open: false }));
    }, 5000);
    return () => clearTimeout(timer);
  }, [motivationState.open]);

  // Scroll to active week when switching to calendar view
  useEffect(() => {
    if (viewMode === ViewMode.CALENDAR && activeWeekRef.current) {
      setTimeout(() => {
        activeWeekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [viewMode]);

  // -- Motivation helper (keep message selection logic) --
  const getMotivationForDay = (dayId: string) => {
    const dayNum = parseInt(dayId.replace('day_', ''), 10);
    if (Number.isNaN(dayNum)) return null;
    const weekNum = Math.ceil(dayNum / 7);
    const motivation = getWeeklyMotivation(weekNum, dayNum);
    return {
      dayNum,
      message: motivation.texte,
      reference: motivation.reference
    };
  };

  const handleDayJustCompleted = (dayId: string) => {
    const motivation = getMotivationForDay(dayId);
    if (!motivation) return;
    const { dayNum, message, reference } = motivation;

    const nextDay = dayNum + 1;

    const openOverlay = () => {
      setMotivationState({
        open: true,
        message,
        reference,
        completedDayIndex: dayNum
      });
    };

    if (nextDay <= 365) {
      setTimeout(() => {
        setViewingDayNum(current => (current === dayNum ? nextDay : current));
        setTimeout(openOverlay, 300);
      }, 1500);
    } else {
      setTimeout(openOverlay, 300);
    }
  };

  // -- Handlers --
  const handleStart = (date: Date) => {
    const normalized = normalizeToUserDay(date);
    setStartDate(normalized);
    setHasStarted(true);
    const today = normalizeToUserDay(new Date());
    let day = Math.floor((today.getTime() - normalized.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (day < 1) day = 1;
    setViewingDayNum(day > 365 ? 365 : day);
  };

  const handleResetApp = () => {
    if (confirm("Tout réinitialiser ? Cela effacera votre progression et vous ramènera à l'écran d'accueil.")) {
      localStorage.removeItem('biblePlanStartDate');
      localStorage.removeItem('biblePlanProgress');
      setProgress({});
      setHasStarted(false);
      setShowSettings(false);
      setViewMode(ViewMode.READER);
      setSelectedReading(null);
    }
  };

  const handleOpenReading = (reading: SelectedReading) => {
    setSelectedReading(reading);
    setViewMode(ViewMode.TEXT_VIEW);
  };

  const handleCloseReading = () => {
    setSelectedReading(null);
    setViewMode(ViewMode.READER);
  };

  const sortedDays = useMemo(() => {
    return Object.keys(biblePlanData).sort((a, b) => {
      const numA = parseInt(a.replace('day_', ''));
      const numB = parseInt(b.replace('day_', ''));
      return numA - numB;
    });
  }, []);

  // Group days into weeks
  const weeks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < sortedDays.length; i += 7) {
      chunks.push(sortedDays.slice(i, i + 7));
    }
    return chunks;
  }, [sortedDays]);

  const getDayNumber = (dayKey: string) => parseInt(dayKey.replace('day_', ''));

  const calculateDateForDay = (dayNum: number) => {
    const date = new Date(startDateLocal);
    date.setDate(startDateLocal.getDate() + (dayNum - 1));
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', weekday: 'long' });
  };

  const getDateObjForDay = (dayNum: number) => {
    const date = new Date(startDateLocal);
    date.setDate(startDateLocal.getDate() + (dayNum - 1));
    return date;
  };

  // Format for Card (Dim. 27 nov.)
  const formatShortDate = (date: Date) => {
    const str = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    // Capitalize first letter
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Format for Accessibility (Mardi 29 novembre)
  const formatLongDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // Format for Week Range (27 nov.)
  const formatRangeDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  const dailyStats: DailyStats[] = useMemo(() => {
    return buildDailyStats(startDateLocal, progress);
  }, [startDateLocal, progress]);

  const todayLocal = normalizeToUserDay(new Date());

  const daysElapsed = Math.min(365, Math.max(0, differenceInCalendarDays(todayLocal, startDateLocal) + 1));

  const validatedDaysCount = dailyStats.filter(d => d.isValidated).length;

  const validatedElapsed = dailyStats.filter(
    d => d.isValidated && parseISODate(d.date) <= endOfDay(todayLocal)
  ).length;

  const constance = daysElapsed === 0
    ? 0
    : Math.min(100, Math.max(0, Math.round((validatedElapsed / daysElapsed) * 100)));

  const currentStreak = useMemo(
    () => computeCurrentStreak(dailyStats, todayLocal),
    [dailyStats, todayLocal]
  );

  const bestStreak = useMemo(
    () => computeBestStreak(dailyStats, todayLocal),
    [dailyStats, todayLocal]
  );

  const scheduleStatus: ScheduleStatus = useMemo(() => getScheduleStatus({
    startDate: startDateLocal,
    today: todayLocal,
    totalDays: 365,
    dailyStats,
  }), [startDateLocal, todayLocal, dailyStats]);

  const scheduleStatusMessage = useMemo(
    () => getScheduleStatusMessage(scheduleStatus),
    [scheduleStatus]
  );

  const dayStatsByKey = useMemo(() => {
    const map: Record<string, DailyStats> = {};
    dailyStats.forEach(day => { map[`day_${day.dayIndex}`] = day; });
    return map;
  }, [dailyStats]);

  const togglePart = (dayId: string, part: keyof DayProgress) => {
    setProgress(prev => {
      const currentDay = prev[dayId] || { matin: false, midi: false, soir: false };
      const wasComplete = currentDay.matin && currentDay.midi && currentDay.soir;
      
      const nextDay = {
        ...currentDay,
        [part]: !currentDay[part]
      };
      
      const isNowComplete = nextDay.matin && nextDay.midi && nextDay.soir;

      if (!wasComplete && isNowComplete) {
        handleDayJustCompleted(dayId);
      }

      logDayStats(dayId, nextDay);

      return {
        ...prev,
        [dayId]: nextDay
      };
    });
  };

  // NEW: Mark all parts of the day as done
  const markAllDone = (dayId: string) => {
      setProgress(prev => {
          const currentDay = prev[dayId] || { matin: false, midi: false, soir: false };
          const wasComplete = currentDay.matin && currentDay.midi && currentDay.soir;
          
          if (!wasComplete) {
              handleDayJustCompleted(dayId);
          }

          logDayStats(dayId, { matin: true, midi: true, soir: true });

          return {
            ...prev,
            [dayId]: { matin: true, midi: true, soir: true }
          };
      });
  };

  // Navigation
  const goToNextDay = () => {
    if (viewingDayNum < 365) setViewingDayNum(n => n + 1);
  };

  const goToPrevDay = () => {
    if (viewingDayNum > 1) setViewingDayNum(n => n - 1);
  };

  const goToToday = () => {
    const day = currentActualDayNum > 365 ? 365 : currentActualDayNum;
    setViewingDayNum(day);
  };

  // View Data
  const viewingDayKey = `day_${viewingDayNum}`;
  
  // Calculate detailed stats
  const totalParts = 365 * 3;
  const completedParts = Object.values(progress).reduce((sum, day) => sum + countDoneParts(day), 0);
  const progressPercentage = totalParts === 0 ? 0 : Math.min(100, Math.round((completedParts / totalParts) * 100));

  // -- Conditional Render: Welcome Screen --
  if (!hasStarted) {
    return <WelcomeScreen onStart={handleStart} />;
  }

  // -- Render: Bible Text Reader Mode --
  if (viewMode === ViewMode.TEXT_VIEW && selectedReading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <BibleReader 
          reference={selectedReading.ref}
          title={selectedReading.title}
          dayKey={selectedReading.dayKey}
          partKey={selectedReading.partKey}
          dayNumber={selectedReading.dayNumber}
          onBack={handleCloseReading}
        />
      </div>
    );
  }

  // -- Main Dashboard Render --
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <MotivationOverlay
        isOpen={motivationState.open}
        onClose={() => setMotivationState(s => ({ ...s, open: false }))}
        message={motivationState.message}
        reference={motivationState.reference}
        completedDayIndex={motivationState.completedDayIndex}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={goToToday}>
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                 <Book size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-none">365 lumières</h1>
                <span className="text-xs text-slate-500">Jour {currentActualDayNum} / 365</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
                {/* View Mode Toggles */}
                <div className="bg-slate-100 p-1 rounded-lg flex mr-2">
                    <button 
                        onClick={() => setViewMode(ViewMode.READER)}
                        className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.READER ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Lecteur"
                    >
                        <Book size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode(ViewMode.CALENDAR)}
                        className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.CALENDAR ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Semaines"
                    >
                        <List size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode(ViewMode.STATS)}
                        className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.STATS ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Statistiques"
                    >
                        <BarChart2 size={18} />
                    </button>
                </div>

                <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Paramètres"
                >
                <Settings size={20} />
                </button>
            </div>
          </div>
        </div>
        
        {/* Progress Line */}
        <div className="w-full h-1 bg-slate-100">
            <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white border-b border-slate-200 p-6 animate-in slide-in-from-top-2 shadow-inner">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Settings size={16} /> Paramètres
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">v1.1</span>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date de début du plan</label>
                <input
                  type="date"
                  value={formatDateISO(startDateLocal)}
                  onChange={(e) => {
                     const d = parseDateInput(e.target.value);
                     if (!isNaN(d.getTime())) {
                         handleStart(d); // Use handleStart to reset view logic too
                     }
                  }}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={handleResetApp} 
                    className="text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center flex-1"
                >
                    Tout réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col">
        {viewMode === ViewMode.READER ? (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            
            {/* Navigation Header for Reader */}
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={goToPrevDay}
                    disabled={viewingDayNum <= 1}
                    className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="text-center cursor-pointer hover:opacity-70 transition-opacity" onClick={goToToday}>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Lecture en cours</span>
                    <span className="text-lg font-semibold text-slate-800 capitalize block leading-none">
                        {calculateDateForDay(viewingDayNum)}
                    </span>
                </div>

                <button 
                    onClick={goToNextDay}
                    disabled={viewingDayNum >= 365}
                    className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all"
                >
                    <ArrowRight size={20} />
                </button>
            </div>

            {/* Single Card View */}
            <div className="flex-1 flex items-start justify-center pb-10">
                {biblePlanData[viewingDayKey] ? (
                     <div className="w-full max-w-xl">
                         <ReadingCard
                           key={viewingDayKey}
                           dayId={viewingDayKey}
                           dayNumber={viewingDayNum}
                           date={calculateDateForDay(viewingDayNum)}
                           plan={biblePlanData[viewingDayKey]}
                           progress={progress[viewingDayKey] || { matin: false, midi: false, soir: false }}
                           onTogglePart={togglePart}
                           onMarkAllDone={markAllDone}
                           onOpenReading={handleOpenReading}
                         />
                         
                         {viewingDayNum !== currentActualDayNum && (
                             <button 
                                onClick={goToToday}
                                className="mx-auto mt-6 flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-indigo-600 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 transition-all"
                             >
                                 <RotateCcw size={14} />
                                 <span>Revenir à aujourd'hui (Jour {currentActualDayNum})</span>
                             </button>
                         )}
                     </div>
                ) : (
                    <div className="text-center p-10">
                        <p>Contenu non disponible pour ce jour.</p>
                    </div>
                )}
            </div>

          </div>
        ) : viewMode === ViewMode.CALENDAR ? (
          // Week Grid View - Detailed
          <div className="space-y-8 pb-10 animate-in slide-in-from-bottom-4 fade-in duration-500">
             
             {/* Global Progress Widget inserted here */}
             <GlobalProgressWidget dailyStats={dailyStats} weeks={weeks} />

             {weeks.map((weekDays, weekIndex) => {
                 const weekStartDay = getDayNumber(weekDays[0]);
                 const weekEndDay = getDayNumber(weekDays[weekDays.length - 1]);
                 const startDateOfWeek = getDateObjForDay(weekStartDay);
                 const endDateOfWeek = getDateObjForDay(weekEndDay);
                 
                 // Calculate completed days in this week using unified stats
                 const completedDaysCount = weekDays.filter(dayKey => dayStatsByKey[dayKey]?.isValidated).length;

                 const isCurrentWeek = weekDays.some(dayKey => getDayNumber(dayKey) === currentActualDayNum);
                 
                 return (
                     <div 
                        key={weekIndex} 
                        // Attach ref to the current week to enable scrolling
                        ref={isCurrentWeek ? activeWeekRef : null}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-24"
                     >
                         {/* Week Header */}
                         <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className={`font-bold text-base ${isCurrentWeek ? 'text-indigo-700' : 'text-slate-700'}`}>
                                    Semaine {weekIndex + 1}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    du {formatRangeDate(startDateOfWeek)} au {formatRangeDate(endDateOfWeek)}
                                </p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${completedDaysCount === 7 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                {completedDaysCount}/7 jours validés
                            </span>
                         </div>
                         
                         {/* Days Grid */}
                         <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                             {weekDays.map(dayKey => {
                                 const dayNum = getDayNumber(dayKey);
                                 const isToday = dayNum === currentActualDayNum;
                                 const dayPlan = biblePlanData[dayKey];
                                 const dayProgress = progress[dayKey] || { matin: false, midi: false, soir: false };
                                 const dayStat = dayStatsByKey[dayKey];
                                 
                                 const doneCount = dayStat?.completedSlots ?? 0;
                                 const isComplete = !!dayStat?.isValidated;
                                 const dayDate = dayStat ? parseISODate(dayStat.date) : getDateObjForDay(dayNum);
                                 
                                 // Determine card styling based on progress
                                 let bgClass = 'bg-white';
                                 let borderClass = 'border-slate-200';
                                 
                                 if (isToday) {
                                     bgClass = 'bg-indigo-50/50';
                                     borderClass = 'border-indigo-500 shadow-md shadow-indigo-100 ring-1 ring-indigo-500';
                                 } else if (isComplete) {
                                     bgClass = 'bg-green-50';
                                     borderClass = 'border-green-200 hover:border-green-300';
                                 } else if (doneCount === 1) {
                                     bgClass = 'bg-orange-50';
                                     borderClass = 'border-orange-200 hover:border-orange-300';
                                 } else if (doneCount === 2) {
                                     bgClass = 'bg-yellow-50';
                                     borderClass = 'border-yellow-200 hover:border-yellow-300';
                                 }

                                 return (
                                     <button
                                        key={dayKey}
                                        onClick={() => {
                                            setViewingDayNum(dayNum);
                                            setViewMode(ViewMode.READER);
                                        }}
                                        aria-label={`Jour ${dayNum} - ${formatLongDate(dayDate)} - ${doneCount} lectures sur 3 complétées`}
                                        className={`
                                            group relative flex flex-col items-center justify-between p-3 rounded-xl transition-all duration-200 border text-center h-28
                                            ${bgClass} ${borderClass} hover:shadow-md
                                        `}
                                     >
                                         {isToday && (
                                             <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                                                 Aujourd'hui
                                             </span>
                                         )}

                                         <div className="w-full">
                                             <span className={`text-lg font-extrabold block leading-tight ${isComplete ? 'text-green-700' : 'text-slate-700'}`}>
                                                 {dayNum}
                                             </span>
                                             <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide block mt-1">
                                                 {formatShortDate(dayDate)}
                                             </span>
                                         </div>
                                         
                                         {/* Status Dots */}
                                         <div className="flex items-center gap-1.5 mt-auto">
                                             {/* Matin */}
                                             <div className={`w-2.5 h-2.5 rounded-full border-0 transition-colors ${dayProgress.matin ? 'bg-green-500' : 'bg-slate-200'}`} title="Matin"></div>
                                             {/* Midi */}
                                             <div className={`w-2.5 h-2.5 rounded-full border-0 transition-colors ${dayProgress.midi ? 'bg-green-500' : 'bg-slate-200'}`} title="Midi"></div>
                                             {/* Soir */}
                                             <div className={`w-2.5 h-2.5 rounded-full border-0 transition-colors ${dayProgress.soir ? 'bg-green-500' : 'bg-slate-200'}`} title="Soir"></div>
                                         </div>

                                         {/* Tooltip on Hover (Desktop) */}
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 hidden sm:block">
                                             <div className="text-left space-y-1">
                                                 <p><span className="text-slate-400">Matin:</span> {dayPlan.matin_ancien_testament}</p>
                                                 <p><span className="text-slate-400">Midi:</span> {dayPlan.midi_sagesse_poesie}</p>
                                                 <p><span className="text-slate-400">Soir:</span> {dayPlan.soir_nouveau_testament}</p>
                                             </div>
                                             {/* Arrow */}
                                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                         </div>
                                     </button>
                                 );
                             })}
                         </div>
                     </div>
                 );
             })}
          </div>
        ) : (
          // STATS View
          <div className="pb-10 animate-in slide-in-from-bottom-4 fade-in duration-500">
             <ProgressChart 
               dailyStats={dailyStats}
               daysElapsed={daysElapsed}
               totalValidatedDays={validatedDaysCount}
               constance={constance}
               scheduleStatusMessage={scheduleStatusMessage}
               currentStreak={currentStreak}
               bestStreak={bestStreak}
             />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
