import { useEffect, useState } from 'react';
import { DayProgress } from '../types';

// Reuse the existing parts definition from DayProgress
export type PartKey = keyof DayProgress; // 'matin' | 'midi' | 'soir'

export type BiblePlanNotes = {
  [dayKey: string]: {
    [part in PartKey]?: string;
  };
};

const NOTES_STORAGE_KEY = 'biblePlanNotes_v1';

export function loadNotes(): BiblePlanNotes {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as BiblePlanNotes;
  } catch {
    return {};
  }
}

export function saveNotes(notes: BiblePlanNotes) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore storage errors silently
  }
}

export function getNote(dayKey: string, part: PartKey): string {
  const all = loadNotes();
  return all[dayKey]?.[part] ?? '';
}

export function setStoredNote(dayKey: string, part: PartKey, value: string) {
  const all = loadNotes();
  const trimmed = value.trim();

  if (!all[dayKey]) {
    all[dayKey] = {};
  }

  if (trimmed.length === 0) {
    delete all[dayKey]![part];
    if (Object.keys(all[dayKey]!).length === 0) {
      delete all[dayKey];
    }
  } else {
    all[dayKey]![part] = trimmed;
  }

  saveNotes(all);
}

export function hasNote(dayKey: string, part: PartKey): boolean {
  const text = getNote(dayKey, part);
  return text.trim().length > 0;
}

export function useReadingNote(dayKey: string, part: PartKey) {
  const [note, setNoteState] = useState('');

  useEffect(() => {
    const initial = getNote(dayKey, part);
    setNoteState(initial);
  }, [dayKey, part]);

  const setNote = (value: string) => {
    setNoteState(value);
    setStoredNote(dayKey, part, value);
  };

  const hasNoteFlag = note.trim().length > 0;

  return { note, setNote, hasNote: hasNoteFlag };
}
