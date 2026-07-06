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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HabitTrendChartProps {
  year: number;
  month: number;
}

export function HabitTrendChart({ year, month }: HabitTrendChartProps) {
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.habitLogs);

  const weeks = generateMonthGrid(year, month);
  const allDays = weeks.flat();
  const totalHabits = habits.length;

  // Build daily data for the area chart
  const dailyData = allDays.map((dateStr) => {
    const day = getDayOfMonth(dateStr);
    const completedCount = habitLogs.filter(
      (hl) => hl.date === dateStr && hl.completed
    ).length;
    const pct = safePercent(completedCount, totalHabits);
    const weekIdx = getWeekIndex(day);

    return {
      date: day.toString(),
      pct,
      weekIdx,
      fill: WEEK_COLORS[weekIdx]?.hex ?? WEEK_COLORS[0].hex,
    };
  });

  // Overall totals
  const totalPossible = totalHabits * allDays.length;
  const totalCompleted = habitLogs.filter(
    (hl) => allDays.includes(hl.date) && hl.completed
  ).length;
  const overallPct = safePercent(totalCompleted, totalPossible);

  // Progress ring constants
  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (overallPct / 100) * ringCircumference;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 flex flex-col lg:flex-row gap-6">
      {/* Area Chart */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
          Overall Trend
        </h3>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#a8a29e" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#a8a29e" }}
                tickFormatter={(v: unknown) => `${v}%`}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
                formatter={(value: unknown) => [`${value}%`, "Completion"]}
                labelFormatter={(label: unknown) => `Day ${label}`}
              />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#60a5fa"
                strokeWidth={2.5}
                fill="url(#trendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-row lg:flex-col gap-4 lg:w-56 shrink-0">
        {/* Daily Progress Card */}
        <div className="flex-1 bg-stone-50/80 rounded-xl border border-stone-100 p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
            Daily Progress
          </span>
          <span className="text-4xl font-black text-stone-800 tabular-nums">
            {overallPct.toFixed(2)}%
          </span>
        </div>

        {/* Habits Ring Card */}
        <div className="flex-1 bg-stone-50/80 rounded-xl border border-stone-100 p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
            Habits
          </span>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                className="text-stone-200"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r={ringRadius}
                cx="48"
                cy="48"
              />
              <circle
                strokeWidth="8"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                stroke="#f472b6"
                fill="transparent"
                r={ringRadius}
                cx="48"
                cy="48"
                className="transition-all duration-700 ease-in-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-black text-stone-800 tabular-nums leading-tight">
                {totalCompleted}
              </span>
              <span className="text-[10px] text-stone-400 font-medium">
                / {totalPossible}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
