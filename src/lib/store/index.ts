import { create } from "zustand";

// ============================================================
// Active View Store
// Manages which day/week is currently focused in macro vs micro views
// ============================================================

interface ActiveViewState {
  // Task Dashboard: which day is focused (null = macro weekly view)
  activeDayIndex: number | null;
  activeDate: string | null; // ISO date string e.g. "2026-07-04"
  setActiveDay: (index: number | null, date: string | null) => void;
  clearActiveDay: () => void;

  // Habit Dashboard: which week is focused (null = macro monthly view)
  activeWeekIndex: number | null;
  setActiveWeek: (index: number | null) => void;
  clearActiveWeek: () => void;

  // Week start date for the task dashboard
  weekStartDate: string; // ISO date string for Monday of current week
  setWeekStartDate: (date: string) => void;

  // Month/year for the habit dashboard
  habitMonth: number; // 0-indexed (0 = January)
  habitYear: number;
  setHabitMonth: (month: number, year: number) => void;
}

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

const now = new Date();

export const useActiveViewStore = create<ActiveViewState>((set) => ({
  // Task Dashboard state
  activeDayIndex: null,
  activeDate: null,
  setActiveDay: (index, date) =>
    set({ activeDayIndex: index, activeDate: date }),
  clearActiveDay: () => set({ activeDayIndex: null, activeDate: null }),

  // Habit Dashboard state
  activeWeekIndex: null,
  setActiveWeek: (index) => set({ activeWeekIndex: index }),
  clearActiveWeek: () => set({ activeWeekIndex: null }),

  // Week navigation
  weekStartDate: getMonday(now),
  setWeekStartDate: (date) => set({ weekStartDate: date }),

  // Month navigation
  habitMonth: now.getMonth(),
  habitYear: now.getFullYear(),
  setHabitMonth: (month, year) => set({ habitMonth: month, habitYear: year }),
}));
