export interface DayPlan {
  jour_semaine: string;
  matin_ancien_testament: string;
  midi_sagesse_poesie: string;
  soir_nouveau_testament: string;
}

export interface ReadingData {
  [key: string]: DayPlan;
}

export interface DayProgress {
  matin: boolean;
  midi: boolean;
  soir: boolean;
}

export interface ReadingProgress {
  [key: string]: DayProgress;
}

export interface DailyStats {
  date: string;          // ISO local date (YYYY-MM-DD)
  dayIndex: number;      // 1..365
  completedSlots: number; // 0..3
  progression: number;   // 0, 1/3, 2/3, 1
  isValidated: boolean;  // progression === 1
}

export enum ViewMode {
  READER = 'READER',
  CALENDAR = 'CALENDAR',
  TEXT_VIEW = 'TEXT_VIEW',
  STATS = 'STATS',
}

export interface ScheduleStatusInput {
  startDate: Date;
  today: Date;
  totalDays?: number;
  dailyStats: DailyStats[];
}

export type ScheduleStatusLabel = 'ahead' | 'onTime' | 'behind' | 'notStarted';

export interface ScheduleStatus {
  daysElapsed: number;
  validatedElapsed: number;
  diff: number;
  label: ScheduleStatusLabel;
}
