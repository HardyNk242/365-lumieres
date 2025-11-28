import { DailyStats, ScheduleStatus, ScheduleStatusInput, ScheduleStatusLabel } from '../types';

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(n => parseInt(n, 10));
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isBefore = (date: Date, compare: Date) => {
  return startOfDay(date).getTime() < startOfDay(compare).getTime();
};

const isAfter = (date: Date, compare: Date) => {
  return startOfDay(date).getTime() > startOfDay(compare).getTime();
};

const differenceInCalendarDays = (left: Date, right: Date) => {
  const l = startOfDay(left);
  const r = startOfDay(right);
  return Math.floor((l.getTime() - r.getTime()) / (1000 * 60 * 60 * 24));
};

export function getScheduleStatus({
  startDate,
  today,
  totalDays = 365,
  dailyStats,
}: ScheduleStatusInput): ScheduleStatus {
  const start = startOfDay(startDate);
  const current = startOfDay(today);

  if (isBefore(current, start)) {
    return {
      daysElapsed: 0,
      validatedElapsed: 0,
      diff: 0,
      label: 'notStarted',
    };
  }

  const daysElapsed = Math.min(
    totalDays,
    differenceInCalendarDays(current, start) + 1
  );

  const validatedElapsed = dailyStats.filter(d => {
    const dDate = parseISODate(d.date);
    return d.isValidated && !isAfter(dDate, current);
  }).length;

  const diff = validatedElapsed - daysElapsed;

  let label: ScheduleStatusLabel;
  if (daysElapsed === 0) {
    label = 'notStarted';
  } else if (diff > 0) {
    label = 'ahead';
  } else if (diff < 0) {
    label = 'behind';
  } else {
    label = 'onTime';
  }

  return { daysElapsed, validatedElapsed, diff, label };
}

export function getScheduleStatusMessage(status: ScheduleStatus): string {
  const absDiff = Math.abs(status.diff);

  switch (status.label) {
    case 'ahead':
      return `Tu es en avance de ${status.diff} jour${status.diff > 1 ? 's' : ''} sur ton plan. Continue comme ça !`;
    case 'behind':
      return `Tu as ${absDiff} jour${absDiff > 1 ? 's' : ''} de retard sur ton plan, mais tu peux rattraper en avançant un peu plus chaque jour.`;
    case 'onTime':
      return "Tu es à l'heure dans ton plan de lecture. Garde ce rythme !";
    case 'notStarted':
    default:
      return "Ton plan de lecture n'a pas encore commencé. Prépare ton coeur pour le grand départ.";
  }
}
