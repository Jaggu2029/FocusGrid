"use client";

import { useHabitStore } from "@/lib/store/habit-store";
import {
  WEEK_COLORS,
  generateMonthGrid,
  getWeekIndex,
  getDayOfMonth,
  safePercent,
} from "@/lib/habit-utils";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface HabitBarChartsProps {
  year: number;
  month: number;
}

export function HabitBarCharts({ year, month }: HabitBarChartsProps) {
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.habitLogs);

  const weeks = generateMonthGrid(year, month);
  const allDays = weeks.flat();
  const totalHabits = habits.length;

  // Build per-day bar data
  const barData = allDays.map((dateStr) => {
    const day = getDayOfMonth(dateStr);
    const completedCount = habitLogs.filter(
      (hl) => hl.date === dateStr && hl.completed
    ).length;
    const pct = safePercent(completedCount, totalHabits);
    const weekIdx = getWeekIndex(day);

    return {
      day: day.toString(),
      completed: completedCount,
      pct,
      weekIdx,
      color: WEEK_COLORS[weekIdx]?.hex ?? WEEK_COLORS[0].hex,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
        Daily Breakdown
      </h3>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#a8a29e" }}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                borderRadius: "10px",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
              formatter={(value: unknown, name: unknown) => {
                if (name === "completed") return [`${value}`, "Completed"];
                return [`${value}`, `${name}`];
              }}
              labelFormatter={(label: unknown) => `Day ${label}`}
            />
            <Bar dataKey="completed" radius={[3, 3, 0, 0]} maxBarSize={18}>
              {barData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Percentage labels below chart */}
      <div className="flex mt-1 overflow-x-auto scrollbar-thin">
        {barData.map((entry, i) => (
          <div
            key={i}
            className="flex flex-col items-center shrink-0"
            style={{ width: `${100 / barData.length}%`, minWidth: "20px" }}
          >
            <span
              className="text-[8px] font-bold tabular-nums"
              style={{ color: entry.color }}
            >
              {Math.round(entry.pct)}%
            </span>
            <span className="text-[8px] text-stone-400 tabular-nums">
              {entry.completed}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
