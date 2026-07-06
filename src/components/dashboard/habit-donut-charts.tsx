"use client";

import { useHabitStore } from "@/lib/store/habit-store";
import {
  WEEK_COLORS,
  generateMonthGrid,
  safePercent,
} from "@/lib/habit-utils";

interface HabitDonutChartsProps {
  year: number;
  month: number;
}

export function HabitDonutCharts({ year, month }: HabitDonutChartsProps) {
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.habitLogs);

  const weeks = generateMonthGrid(year, month);
  const totalHabits = habits.length;

  // Compute per-week stats
  const weekStats = weeks.map((weekDays, weekIdx) => {
    const totalPossible = totalHabits * weekDays.length;
    const completedCount = habitLogs.filter(
      (hl) => weekDays.includes(hl.date) && hl.completed
    ).length;
    const pct = safePercent(completedCount, totalPossible);
    const color = WEEK_COLORS[weekIdx] ?? WEEK_COLORS[WEEK_COLORS.length - 1];

    return {
      label: color.label,
      pct,
      completedCount,
      totalPossible,
      hex: color.hex,
      bgLight: color.bgLight,
    };
  });

  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-5">
        Weekly Progress
      </h3>

      <div className="flex flex-wrap justify-center gap-6">
        {weekStats.map((ws, i) => {
          const offset = circumference - (ws.pct / 100) * circumference;

          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    strokeWidth="10"
                    stroke={ws.bgLight}
                    fill="transparent"
                    r={radius}
                    cx="56"
                    cy="56"
                  />
                  <circle
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke={ws.hex}
                    fill="transparent"
                    r={radius}
                    cx="56"
                    cy="56"
                    className="transition-all duration-700 ease-in-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span
                    className="text-lg font-black tabular-nums"
                    style={{ color: ws.hex }}
                  >
                    {ws.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                {ws.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
