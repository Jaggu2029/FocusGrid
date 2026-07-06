"use client";

import { useEffect, useRef } from "react";
import { useHabitStore } from "@/lib/store/habit-store";
import { useActiveViewStore } from "@/lib/store";
import { getMonthName } from "@/lib/habit-utils";
import type { Habit, HabitLog } from "@/types/database";
import { HabitTrendChart } from "./habit-trend-chart";
import { HabitBarCharts } from "./habit-bar-charts";
import { HabitDonutCharts } from "./habit-donut-charts";
import { HabitGrid } from "./habit-grid";
import { HabitDetailTables } from "./habit-detail-tables";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HabitDashboardProps {
  initialHabits: Habit[];
  initialHabitLogs: HabitLog[];
}

export function HabitDashboard({
  initialHabits,
  initialHabitLogs,
}: HabitDashboardProps) {
  const habitMonth = useActiveViewStore((s) => s.habitMonth);
  const habitYear = useActiveViewStore((s) => s.habitYear);
  const setHabitMonth = useActiveViewStore((s) => s.setHabitMonth);

  // Sync server state with client store
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      useHabitStore.setState({
        habits: initialHabits,
        habitLogs: initialHabitLogs,
      });
      initialized.current = true;
    } else {
      useHabitStore.setState({
        habits: initialHabits,
        habitLogs: initialHabitLogs,
      });
    }
  }, [initialHabits, initialHabitLogs]);

  // Month navigation
  const goToPrevMonth = () => {
    if (habitMonth === 0) {
      setHabitMonth(11, habitYear - 1);
    } else {
      setHabitMonth(habitMonth - 1, habitYear);
    }
  };

  const goToNextMonth = () => {
    if (habitMonth === 11) {
      setHabitMonth(0, habitYear + 1);
    } else {
      setHabitMonth(habitMonth + 1, habitYear);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setHabitMonth(now.getMonth(), now.getFullYear());
  };

  const isCurrentMonth =
    habitMonth === new Date().getMonth() &&
    habitYear === new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Page Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Habit Dashboard
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Track your daily habits and build consistency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevMonth}
            className="h-8 w-8 rounded-full border-stone-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <button
            onClick={goToCurrentMonth}
            className="px-3 py-1 rounded-lg text-sm font-bold text-stone-700 hover:bg-stone-100 transition-colors tabular-nums"
          >
            {getMonthName(habitMonth)} {habitYear}
          </button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8 rounded-full border-stone-200"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {!isCurrentMonth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToCurrentMonth}
              className="text-xs text-stone-500 ml-1"
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Section 1: Top Analytics — Trend Chart + Summary Cards */}
      <HabitTrendChart year={habitYear} month={habitMonth} />

      {/* Section 2: Mid Analytics — Bar Charts + Donut Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <HabitBarCharts year={habitYear} month={habitMonth} />
        </div>
        <div>
          <HabitDonutCharts year={habitYear} month={habitMonth} />
        </div>
      </div>

      {/* Section 3: Interactive Grid */}
      <HabitGrid year={habitYear} month={habitMonth} />

      {/* Section 4: Detail Tables */}
      <HabitDetailTables year={habitYear} month={habitMonth} />
    </div>
  );
}
