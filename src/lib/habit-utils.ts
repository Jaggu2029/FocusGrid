import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
} from "date-fns";
import type { HabitLog } from "@/types/database";

// ============================================================
// Week Color Configuration — single source of truth
// Every chart, checkbox, and stat derives its color from here.
// ============================================================

export interface WeekColor {
  id: string;
  label: string;
  /** CSS variable value, e.g. "var(--week-1)" */
  bg: string;
  /** Hex for Recharts (CSS vars don't work in SVG fill attrs) */
  hex: string;
  /** Light tint for backgrounds */
  bgLight: string;
  /** Tailwind ring/border class suffix */
  tw: string;
}

export const WEEK_COLORS: WeekColor[] = [
  {
    id: "week-1",
    label: "Week 1",
    bg: "var(--week-1)",
    hex: "#93c5fd",
    bgLight: "#eff6ff",
    tw: "blue",
  },
  {
    id: "week-2",
    label: "Week 2",
    bg: "var(--week-2)",
    hex: "#f9a8d4",
    bgLight: "#fdf2f8",
    tw: "pink",
  },
  {
    id: "week-3",
    label: "Week 3",
    bg: "var(--week-3)",
    hex: "#5eead4",
    bgLight: "#f0fdfa",
    tw: "teal",
  },
  {
    id: "week-4",
    label: "Week 4",
    bg: "var(--week-4)",
    hex: "#facc15",
    bgLight: "#fef9c3",
    tw: "amber",
  },
  {
    id: "week-5",
    label: "Week 5",
    bg: "#c4b5fd",
    hex: "#c4b5fd",
    bgLight: "#f5f3ff",
    tw: "violet",
  },
];

// ============================================================
// Month Grid Generator
// Returns an array of weeks, each containing ISO date strings.
// Week boundaries: days 1-7 = Week 1, 8-14 = Week 2, etc.
// ============================================================

export function generateMonthGrid(
  year: number,
  month: number // 0-indexed (0 = January)
): string[][] {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(new Date(year, month, 1));

  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(
    (d) => format(d, "yyyy-MM-dd")
  );

  const weeks: string[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return weeks;
}

// ============================================================
// Day-of-week label for a date string
// ============================================================

const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function getDayOfWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return DOW_LABELS[getDay(d)];
}

// ============================================================
// Get week index (0-based) for a day-of-month (1-based)
// ============================================================

export function getWeekIndex(dayOfMonth: number): number {
  return Math.floor((dayOfMonth - 1) / 7);
}

// ============================================================
// Compute longest streak of consecutive completed days
// ============================================================

export function computeLongestStreak(
  logs: HabitLog[],
  habitId: string
): number {
  const completedDates = logs
    .filter((l) => l.habit_id === habitId && l.completed)
    .map((l) => l.date)
    .sort();

  if (completedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1] + "T00:00:00");
    const curr = new Date(completedDates[i] + "T00:00:00");
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

// ============================================================
// Safe percentage — guards against division by zero
// ============================================================

export function safePercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 10000) / 100; // e.g. 79.14
}

// ============================================================
// Get the day-of-month from an ISO date string
// ============================================================

export function getDayOfMonth(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDate();
}

// ============================================================
// Month name helper
// ============================================================

export function getMonthName(month: number): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return names[month];
}
