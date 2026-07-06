import { create } from "zustand";
import type { Habit, HabitLog } from "@/types/database";

interface HabitState {
  habits: Habit[];
  habitLogs: HabitLog[];

  /** Bulk set from server page data */
  setInitialData: (habits: Habit[], habitLogs: HabitLog[]) => void;

  /** Optimistic toggle a single habit log entry */
  toggleHabitLog: (
    habitId: string,
    dateStr: string,
    completed: boolean
  ) => void;

  /** Optimistic add a new habit */
  addHabit: (habit: Habit) => void;

  /** Optimistic remove a habit (and its logs) */
  removeHabit: (habitId: string) => void;

  /** Optimistic update a habit name */
  updateHabitName: (habitId: string, name: string) => void;
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],
  habitLogs: [],

  setInitialData: (habits, habitLogs) => {
    set({ habits, habitLogs });
  },

  toggleHabitLog: (habitId, dateStr, completed) => {
    set((state) => {
      const existingIndex = state.habitLogs.findIndex(
        (hl) => hl.habit_id === habitId && hl.date === dateStr
      );

      if (existingIndex >= 0) {
        // Update existing log
        const newLogs = [...state.habitLogs];
        newLogs[existingIndex] = { ...newLogs[existingIndex], completed };
        return { habitLogs: newLogs };
      } else {
        // Create new log entry (optimistic — server will assign real ID)
        const newLog: HabitLog = {
          id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          habit_id: habitId,
          date: dateStr,
          completed,
        };
        return { habitLogs: [...state.habitLogs, newLog] };
      }
    });
  },

  addHabit: (habit) => {
    set((state) => ({
      habits: [...state.habits, habit],
    }));
  },

  removeHabit: (habitId) => {
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
      habitLogs: state.habitLogs.filter((hl) => hl.habit_id !== habitId),
    }));
  },

  updateHabitName: (habitId, name) => {
    set((state) => ({
      habits: state.habits.map((h) => (h.id === habitId ? { ...h, name } : h)),
    }));
  },
}));
