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
    <div className="min-h-screen bg-paper dark:bg-night-canvas flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-500 dark:bg-brand-700 rounded-b-[3rem] shadow-card z-0"></div>

      <div className="max-w-md w-full bg-paper-surface dark:bg-night-surface rounded-3xl shadow-card p-8 md:p-12 border border-paper-border dark:border-night-border z-10 mt-10 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-brand-50 dark:bg-night-surfaceAlt rounded-full flex items-center justify-center mx-auto mb-8 text-brand-500 dark:text-brand-300 ring-4 ring-paper-surface dark:ring-night-surface">
          <Book size={48} />
        </div>

        <h1 className="text-3xl font-extrabold text-ink dark:text-night-ink mb-4 tracking-tight">365 lumières</h1>
        <p className="text-ink-muted dark:text-night-inkMuted mb-10 leading-relaxed">
          Votre parcours quotidien à travers la Bible.
          Indiquez votre date de départ, et nous organiserons vos lectures Matin, Midi et Soir.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-ink dark:text-night-ink mb-2 ml-1">
              Date de début
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted dark:text-night-inkMuted">
                <CalendarIcon size={18} />
              </div>
              <input
                id="startDate"
                type="date"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="block w-full pl-10 pr-4 py-4 bg-paper dark:bg-night-canvas border border-paper-border dark:border-night-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-medium text-ink dark:text-night-ink"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-500 hover:bg-brand-700 active:scale-[0.98] text-paper-surface font-bold py-4 rounded-xl shadow-soft transition-all duration-200 flex items-center justify-center space-x-2 text-lg"
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
      <div className="min-h-screen bg-paper dark:bg-night-canvas">
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
    <div className="min-h-screen bg-paper dark:bg-night-canvas text-ink dark:text-night-ink flex flex-col">
      <MotivationOverlay
        isOpen={motivationState.open}
        onClose={() => setMotivationState(s => ({ ...s, open: false }))}
        message={motivationState.message}
        reference={motivationState.reference}
        completedDayIndex={motivationState.completedDayIndex}
      />

      {/* Header */}
      <header className="bg-paper-surface dark:bg-night-surface border-b border-paper-border dark:border-night-border sticky top-0 z-30 shadow-soft">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={goToToday}>
              <div className="bg-brand-500 text-paper-surface p-1.5 rounded-lg">
                 <Book size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-ink dark:text-night-ink leading-none">365 lumières</h1>
                <span className="text-xs text-ink-muted dark:text-night-inkMuted">Jour {currentActualDayNum} / 365</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
                {/* View Mode Toggles */}
                <div className="bg-paper-muted dark:bg-night-surfaceAlt p-1 rounded-lg flex mr-2">
                    <button
                        onClick={() => setViewMode(ViewMode.READER)}
                        className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.READER ? 'bg-paper-surface dark:bg-night-surface text-brand-500 dark:text-brand-300 shadow-soft' : 'text-ink-soft dark:text-night-inkMuted hover:text-ink dark:hover:text-night-ink'}`}
                        title="Lecteur"
                    >
                        <Book size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode(ViewMode.CALENDAR)}
                        className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.CALENDAR ? 'bg-paper-surface dark:bg-night-surface text-brand-500 dark:text-brand-300 shadow-soft' : 'text-ink-soft dark:text-night-inkMuted hover:text-ink dark:hover:text-night-ink'}`}
                        title="Semaines"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode(ViewMode.STATS)}
                        className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.STATS ? 'bg-paper-surface dark:bg-night-surface text-brand-500 dark:text-brand-300 shadow-soft' : 'text-ink-soft dark:text-night-inkMuted hover:text-ink dark:hover:text-night-ink'}`}
                        title="Statistiques"
                    >
                        <BarChart2 size={18} />
                    </button>
                </div>

                <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-ink-soft dark:text-night-inkMuted hover:text-ink dark:hover:text-night-ink hover:bg-paper-muted dark:hover:bg-night-surfaceAlt rounded-full transition-colors"
                title="Paramètres"
                >
                <Settings size={20} />
                </button>
            </div>
          </div>
        </div>

        {/* Progress Line */}
        <div className="w-full h-1 bg-paper-muted dark:bg-night-surfaceAlt">
            <div className="h-full bg-brass-600 dark:bg-brass-400 transition-all duration-700" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-paper-surface dark:bg-night-surface border-b border-paper-border dark:border-night-border p-6 animate-in slide-in-from-top-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-ink dark:text-night-ink flex items-center gap-2">
                  <Settings size={16} /> Paramètres
                </h3>
                <span className="text-xs text-ink-muted dark:text-night-inkMuted bg-paper-muted dark:bg-night-surfaceAlt px-2 py-1 rounded">v1.1</span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-night-ink mb-2">Date de début du plan</label>
                <input
                  type="date"
                  value={formatDateISO(startDateLocal)}
                  onChange={(e) => {
                     const d = parseDateInput(e.target.value);
                     if (!isNaN(d.getTime())) {
                         handleStart(d);
                     }
                  }}
                  className="block w-full px-4 py-3 bg-paper dark:bg-night-canvas border border-paper-border dark:border-night-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all text-ink dark:text-night-ink"
                />
              </div>

              <div className="pt-4 border-t border-paper-border dark:border-night-border flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleResetApp}
                    className="text-sm font-medium text-brick hover:text-brick px-4 py-2 bg-brick-soft dark:bg-night-surfaceAlt rounded-lg hover:bg-brick-soft/80 transition-colors text-center flex-1"
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
                    className="p-3 rounded-full bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border text-ink-muted dark:text-night-inkMuted shadow-soft hover:bg-brand-50 dark:hover:bg-night-surfaceAlt hover:text-brand-500 dark:hover:text-brand-300 disabled:opacity-30 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="text-center cursor-pointer hover:opacity-70 transition-opacity" onClick={goToToday}>
                    <span className="text-xs font-bold text-ink-soft dark:text-night-inkMuted uppercase tracking-wider block mb-1">Lecture en cours</span>
                    <span className="text-lg font-semibold text-ink dark:text-night-ink capitalize block leading-none">
                        {calculateDateForDay(viewingDayNum)}
                    </span>
                </div>

                <button
                    onClick={goToNextDay}
                    disabled={viewingDayNum >= 365}
                    className="p-3 rounded-full bg-paper-surface dark:bg-night-surface border border-paper-border dark:border-night-border text-ink-muted dark:text-night-inkMuted shadow-soft hover:bg-brand-50 dark:hover:bg-night-surfaceAlt hover:text-brand-500 dark:hover:text-brand-300 disabled:opacity-30 transition-all"
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
                                className="mx-auto mt-6 flex items-center space-x-2 text-sm font-medium text-ink-muted dark:text-night-inkMuted hover:text-brand-500 dark:hover:text-brand-300 px-4 py-2 bg-paper-surface dark:bg-night-surface rounded-full shadow-soft border border-paper-border dark:border-night-border transition-all"
                             >
                                 <RotateCcw size={14} />
                                 <span>Revenir à aujourd'hui (Jour {currentActualDayNum})</span>
                             </button>
                         )}
                     </div>
                ) : (
                    <div className="text-center p-10 text-ink-muted dark:text-night-inkMuted">
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
                        ref={isCurrentWeek ? activeWeekRef : null}
                        className="bg-paper-surface dark:bg-night-surface rounded-2xl border border-paper-border dark:border-night-border shadow-soft overflow-hidden scroll-mt-24"
                     >
                         {/* Week Header */}
                         <div className="bg-paper-muted/50 dark:bg-night-surfaceAlt/40 px-5 py-3 border-b border-paper-border dark:border-night-border flex items-center justify-between">
                            <div>
                                <h3 className={`font-bold text-base ${isCurrentWeek ? 'text-brand-500 dark:text-brand-300' : 'text-ink dark:text-night-ink'}`}>
                                    Semaine {weekIndex + 1}
                                </h3>
                                <p className="text-xs text-ink-muted dark:text-night-inkMuted mt-0.5">
                                    du {formatRangeDate(startDateOfWeek)} au {formatRangeDate(endDateOfWeek)}
                                </p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${completedDaysCount === 7 ? 'bg-olive-soft dark:bg-olive-darkSoft text-olive' : 'bg-paper-muted dark:bg-night-surfaceAlt text-ink-muted dark:text-night-inkMuted'}`}>
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
                                 
                                 // Day-chip styling — palette-aligned with the slot tints.
                                 //   1 done = aube (dawn warm wash)
                                 //   2 done = brass-soft (almost there)
                                 //   3 done = olive (validated)
                                 let bgClass = 'bg-paper-surface dark:bg-night-surface';
                                 let borderClass = 'border-paper-border dark:border-night-border';

                                 if (isToday) {
                                     bgClass = 'bg-brand-50 dark:bg-night-surfaceAlt';
                                     borderClass = 'border-brand-500 ring-1 ring-brand-500';
                                 } else if (isComplete) {
                                     bgClass = 'bg-olive-soft dark:bg-olive-darkSoft';
                                     borderClass = 'border-olive/40 hover:border-olive/60';
                                 } else if (doneCount === 1) {
                                     bgClass = 'bg-slot-dawn dark:bg-slot-dawnDark';
                                     borderClass = 'border-brass-100 dark:border-brass-soft';
                                 } else if (doneCount === 2) {
                                     bgClass = 'bg-brass-100 dark:bg-brass-soft';
                                     borderClass = 'border-brass-400/30 dark:border-brass-400/30';
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
                                            ${bgClass} ${borderClass} hover:shadow-soft
                                        `}
                                     >
                                         {isToday && (
                                             <span className="absolute -top-2 -right-2 bg-brand-500 text-paper-surface text-[9px] font-bold px-2 py-0.5 rounded-full shadow-soft z-10">
                                                 Aujourd'hui
                                             </span>
                                         )}

                                         <div className="w-full">
                                             <span className={`text-lg font-extrabold block leading-tight ${isComplete ? 'text-olive' : 'text-ink dark:text-night-ink'}`}>
                                                 {dayNum}
                                             </span>
                                             <span className="text-[10px] font-medium text-ink-soft dark:text-night-inkMuted uppercase tracking-wide block mt-1">
                                                 {formatShortDate(dayDate)}
                                             </span>
                                         </div>

                                         {/* Status dots — olive when done, neutral when pending */}
                                         <div className="flex items-center gap-1.5 mt-auto">
                                             <div className={`w-2.5 h-2.5 rounded-full transition-colors ${dayProgress.matin ? 'bg-olive' : 'bg-paper-border dark:bg-night-border'}`} title="Matin"></div>
                                             <div className={`w-2.5 h-2.5 rounded-full transition-colors ${dayProgress.midi ? 'bg-olive' : 'bg-paper-border dark:bg-night-border'}`} title="Midi"></div>
                                             <div className={`w-2.5 h-2.5 rounded-full transition-colors ${dayProgress.soir ? 'bg-olive' : 'bg-paper-border dark:bg-night-border'}`} title="Soir"></div>
                                         </div>

                                         {/* Tooltip on hover (desktop) */}
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-ink dark:bg-night-surfaceAlt text-paper-surface dark:text-night-ink text-xs rounded-lg py-2 px-3 shadow-card opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 hidden sm:block">
                                             <div className="text-left space-y-1">
                                                 <p><span className="text-paper-surface/60 dark:text-night-inkMuted">Matin:</span> {dayPlan.matin_ancien_testament}</p>
                                                 <p><span className="text-paper-surface/60 dark:text-night-inkMuted">Midi:</span> {dayPlan.midi_sagesse_poesie}</p>
                                                 <p><span className="text-paper-surface/60 dark:text-night-inkMuted">Soir:</span> {dayPlan.soir_nouveau_testament}</p>
                                             </div>
                                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink dark:border-t-night-surfaceAlt"></div>
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
