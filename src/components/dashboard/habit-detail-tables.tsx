"use client";

import { useHabitStore } from "@/lib/store/habit-store";
import {
  generateMonthGrid,
  safePercent,
  computeLongestStreak,
} from "@/lib/habit-utils";

interface HabitDetailTablesProps {
  year: number;
  month: number;
}

export function HabitDetailTables({ year, month }: HabitDetailTablesProps) {
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.habitLogs);

  const weeks = generateMonthGrid(year, month);
  const allDays = weeks.flat();
  const totalDays = allDays.length;

  // Per-habit stats
  const habitStats = habits.map((habit) => {
    const completedCount = habitLogs.filter(
      (hl) =>
        hl.habit_id === habit.id &&
        allDays.includes(hl.date) &&
        hl.completed
    ).length;
    const pct = safePercent(completedCount, totalDays);
    const streak = computeLongestStreak(habitLogs, habit.id);

    return {
      id: habit.id,
      name: habit.name,
      completedCount,
      totalDays,
      pct,
      streak,
    };
  });

  // Top 10 sorted by percentage descending
  const top10 = [...habitStats].sort((a, b) => b.pct - a.pct).slice(0, 10);

  // Overall totals
  const totalCompleted = habitStats.reduce((sum, h) => sum + h.completedCount, 0);
  const totalPossible = habits.length * totalDays;
  const overallPct = safePercent(totalCompleted, totalPossible);

  // Best-performing count (habits at 100%)
  const perfectCount = habitStats.filter((h) => h.pct >= 100).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 10 Habits Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="bg-[#6b87b5]/10 px-6 py-3 border-b border-stone-200/60">
          <h3 className="text-xs font-bold text-[#6b87b5] uppercase tracking-[0.2em]">
            Top 10 Habits
          </h3>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200/60 bg-stone-50/50">
              <th className="text-left px-6 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Daily Habit
              </th>
              <th className="text-right px-6 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {top10.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-sm text-stone-400">
                  No habits tracked yet.
                </td>
              </tr>
            ) : (
              top10.map((h, i) => (
                <tr
                  key={h.id}
                  className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/50 transition-colors"
                >
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-stone-400 tabular-nums w-4">
                        {i + 1}
                      </span>
                      <span className="text-sm text-stone-700 font-medium">
                        {h.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    <span className="text-sm font-bold text-stone-800 tabular-nums">
                      {h.pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {perfectCount > 0 && (
          <div className="px-6 py-2.5 border-t border-stone-100 bg-emerald-50/50">
            <p className="text-xs text-emerald-600 font-medium">
              Over 100% on {perfectCount} habit{perfectCount > 1 ? "s" : ""} — keep
              going! 🚀
            </p>
          </div>
        )}
      </div>

      {/* Daily Progress Details Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="bg-[#6b87b5]/10 px-6 py-3 border-b border-stone-200/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#6b87b5] uppercase tracking-[0.2em]">
            Daily Progress
          </h3>
          <span className="text-xs font-bold text-stone-500 tabular-nums">
            {totalCompleted} / {totalPossible} completed
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-stone-200/60 bg-stone-50/50">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Habit
                </th>
                <th className="text-center px-2 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Goal
                </th>
                <th className="text-center px-2 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-32">
                  Percentage
                </th>
                <th className="text-center px-2 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Count
                </th>
                <th className="text-center px-2 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Longest Streak
                </th>
              </tr>
            </thead>
            <tbody>
              {habitStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-stone-400"
                  >
                    No habits tracked yet.
                  </td>
                </tr>
              ) : (
                habitStats.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-sm text-stone-700 font-medium truncate block max-w-[140px]">
                        {h.name}
                      </span>
                    </td>
                    <td className="text-center px-2 py-2.5">
                      <span className="text-sm font-bold text-stone-600 tabular-nums">
                        {h.totalDays}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-600 tabular-nums w-10 text-right shrink-0">
                          {Math.round(h.pct)}%
                        </span>
                        <div className="flex-1 h-2.5 bg-stone-200/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#6b87b5] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(h.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-2 py-2.5">
                      <span className="text-sm text-stone-600 tabular-nums">
                        {h.completedCount}{" "}
                        <span className="text-stone-400">/ {h.totalDays}</span>
                      </span>
                    </td>
                    <td className="text-center px-2 py-2.5">
                      <span className="text-sm font-bold text-stone-700 tabular-nums">
                        {h.streak}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
