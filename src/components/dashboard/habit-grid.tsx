"use client";

import { useHabitStore } from "@/lib/store/habit-store";
import {
  WEEK_COLORS,
  generateMonthGrid,
  getDayOfWeekLabel,
  getDayOfMonth,
} from "@/lib/habit-utils";
import {
  createHabitAction,
  deleteHabitAction,
  toggleHabitLogAction,
  updateHabitAction,
} from "@/app/app/habits/actions";
import { useState, useTransition, useCallback } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HabitGridProps {
  year: number;
  month: number;
}

export function HabitGrid({ year, month }: HabitGridProps) {
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.habitLogs);
  const toggleHabitLog = useHabitStore((s) => s.toggleHabitLog);
  const addHabit = useHabitStore((s) => s.addHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const updateHabitName = useHabitStore((s) => s.updateHabitName);

  const [isPending, startTransition] = useTransition();
  const [newHabitName, setNewHabitName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState("");

  const weeks = generateMonthGrid(year, month);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Toggle a habit log checkbox
  const handleToggle = useCallback(
    (habitId: string, dateStr: string) => {
      if (habitId.startsWith("temp-")) {
        toast.info("Please wait a moment for the habit to save first!");
        return;
      }

      const existing = habitLogs.find(
        (hl) => hl.habit_id === habitId && hl.date === dateStr
      );
      const wasCompleted = existing?.completed ?? false;
      const newCompleted = !wasCompleted;

      // Optimistic update
      toggleHabitLog(habitId, dateStr, newCompleted);

      startTransition(() => {
        toggleHabitLogAction(habitId, dateStr, newCompleted).catch(() => {
          // Revert on error
          toggleHabitLog(habitId, dateStr, wasCompleted);
          toast.error("Failed to save habit log.");
        });
      });
    },
    [habitLogs, toggleHabitLog]
  );

  // Create a new habit
  const handleCreateHabit = () => {
    const name = newHabitName.trim();
    if (!name) {
      setIsAdding(false);
      return;
    }

    setNewHabitName("");
    setIsAdding(false);

    // Optimistic add
    const tempId = `temp-habit-${Date.now()}`;
    addHabit({
      id: tempId,
      user_id: "temp",
      name,
      created_at: new Date().toISOString(),
    });

    startTransition(() => {
      createHabitAction(name).catch(() => {
        removeHabit(tempId);
      });
    });
  };

  // Delete a habit
  const handleDeleteHabit = (habitId: string) => {
    const habitToRestore = habits.find((h) => h.id === habitId);
    const logsToRestore = habitLogs.filter((hl) => hl.habit_id === habitId);
    if (!habitToRestore) return;

    removeHabit(habitId);
    
    let timeoutId: NodeJS.Timeout;

    toast.success("Habit deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          useHabitStore.setState((state) => ({
            habits: [...state.habits, habitToRestore],
            habitLogs: [...state.habitLogs, ...logsToRestore],
          }));
        },
      },
    });

    timeoutId = setTimeout(() => {
      startTransition(() => {
        deleteHabitAction(habitId).catch((err) => {
          console.error("Failed to delete habit:", err);
        });
      });
    }, 4000);
  };

  const handleRenameSubmit = (habitId: string, oldName: string) => {
    const newName = editHabitName.trim();
    if (!newName || newName === oldName) {
      setEditingHabitId(null);
      return;
    }

    updateHabitName(habitId, newName);
    setEditingHabitId(null);

    startTransition(() => {
      updateHabitAction(habitId, newName).catch((err) => {
        console.error("Failed to rename habit:", err);
        updateHabitName(habitId, oldName); // revert
      });
    });
  };

  // Check if a habit is completed on a specific date
  const isCompleted = (habitId: string, dateStr: string): boolean => {
    return (
      habitLogs.find(
        (hl) => hl.habit_id === habitId && hl.date === dateStr
      )?.completed ?? false
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-[0_0_100px_-5px_rgba(57,255,20,0.15)]">
      {/* Section Header */}
      <div className="bg-[#6b87b5] px-6 py-3 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
          Daily Habits
          <span className="text-[10px] font-normal normal-case tracking-normal opacity-80 bg-white/10 px-2 py-0.5 rounded-full">
            (Add min. 10 habits for best tracking)
          </span>
        </h3>
      </div>

      {/* Scrollable Grid */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse min-w-[700px]">
          {/* Column Headers: week labels + day-of-week + date number */}
          <thead>
            {/* Week label row — each label spans its week's columns */}
            <tr>
              <th className="sticky left-0 z-10 bg-white w-52 min-w-[208px]" />
              {weeks.map((weekDays, wi) => {
                const color =
                  WEEK_COLORS[wi] ?? WEEK_COLORS[WEEK_COLORS.length - 1];
                return (
                  <th
                    key={`week-label-${wi}`}
                    colSpan={weekDays.length}
                    className="py-2 text-center"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                      {color.label}
                    </span>
                  </th>
                );
              })}
            </tr>

            {/* Day-of-week row */}
            <tr className="bg-stone-50">
              <th className="sticky left-0 z-10 bg-stone-50 text-left px-4 py-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  #
                </span>
              </th>
              {weeks.map((weekDays, wi) => {
                const color =
                  WEEK_COLORS[wi] ?? WEEK_COLORS[WEEK_COLORS.length - 1];
                return weekDays.map((dateStr) => {
                  const isToday = dateStr === todayStr;
                  return (
                    <th key={dateStr} className="px-0.5 py-1.5 text-center" style={{
                      backgroundColor: isToday ? `${color.hex}1a` : 'transparent'
                    }}>
                      <div
                        className={`mx-auto flex items-center justify-center w-[22px] h-[22px] transition-colors ${
                          isToday ? 'border rounded-sm' : ''
                        }`}
                        style={{ borderColor: isToday ? color.hex : 'transparent' }}
                      >
                        <span
                          className="text-[10px] font-bold uppercase"
                          style={{ color: color.hex }}
                        >
                          {getDayOfWeekLabel(dateStr)}
                        </span>
                      </div>
                    </th>
                  );
                });
              })}
            </tr>

            {/* Date number row */}
            <tr className="bg-stone-50/50 border-b border-stone-200/60">
              <th className="sticky left-0 z-10 bg-stone-50/50 text-left px-4 py-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Habit
                </span>
              </th>
              {weeks.map((weekDays, wi) => {
                const color =
                  WEEK_COLORS[wi] ?? WEEK_COLORS[WEEK_COLORS.length - 1];
                return weekDays.map((dateStr) => {
                  const isToday = dateStr === todayStr;
                  return (
                    <th key={dateStr} className="px-0.5 py-1 text-center" style={{
                      backgroundColor: isToday ? `${color.hex}1a` : 'transparent'
                    }}>
                      <span
                        className="text-[9px] font-bold tabular-nums"
                        style={{ color: color.hex }}
                      >
                        {getDayOfMonth(dateStr)}
                      </span>
                    </th>
                  );
                });
              })}
            </tr>
          </thead>

          {/* Habit Rows */}
          <tbody>
            {habits.map((habit, hi) => (
              <tr
                key={habit.id}
                className="group/row border-b border-stone-100 transition-colors"
              >
                {/* Habit name cell — sticky */}
                <td className="sticky left-0 z-10 bg-white transition-colors px-4 py-2 border-r border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-400 tabular-nums w-5 shrink-0">
                      {hi + 1}
                    </span>
                    {editingHabitId === habit.id ? (
                      <Input
                        autoFocus
                        value={editHabitName}
                        onChange={(e) => setEditHabitName(e.target.value)}
                        onBlur={() => handleRenameSubmit(habit.id, habit.name)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit(habit.id, habit.name);
                          if (e.key === "Escape") setEditingHabitId(null);
                        }}
                        className="h-6 py-0 px-1.5 text-sm w-32 ml-[-6px]"
                      />
                    ) : (
                      <span className="text-sm text-stone-700 font-medium truncate flex-1">
                        {habit.name}
                      </span>
                    )}
                    
                    <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-0.5 ml-auto shrink-0 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingHabitId(habit.id);
                          setEditHabitName(habit.name);
                        }}
                        className="text-stone-400 hover:text-stone-600 p-0.5 transition-colors"
                        title="Rename habit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="text-red-400 hover:text-red-600 p-0.5 transition-colors"
                        title="Delete habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </td>

                {/* Checkbox cells */}
                {weeks.map((weekDays, wi) => {
                  const color =
                    WEEK_COLORS[wi] ?? WEEK_COLORS[WEEK_COLORS.length - 1];
                  return weekDays.map((dateStr) => {
                    const checked = isCompleted(habit.id, dateStr);
                    const isToday = dateStr === todayStr;
                    return (
                      <td key={dateStr} className="px-0.5 py-1.5 text-center transition-colors" style={{
                        backgroundColor: isToday ? `${color.hex}1a` : 'transparent'
                      }}>
                        <button
                          tabIndex={0}
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={`${habit.name} on day ${getDayOfMonth(dateStr)}`}
                          onClick={() => handleToggle(habit.id, dateStr)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              handleToggle(habit.id, dateStr);
                            }
                          }}
                          className="w-5 h-5 rounded-[4px] border-2 flex items-center justify-center mx-auto transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-110 hover:shadow-sm"
                          style={{
                            borderColor: checked ? color.hex : "#d6d3d1",
                            backgroundColor: checked ? color.hex : "transparent",
                            boxShadow: checked
                              ? `0 0 6px ${color.hex}40`
                              : "none",
                          }}
                        >
                          {checked && (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </button>
                      </td>
                    );
                  });
                })}
              </tr>
            ))}

            {/* Empty state */}
            {habits.length === 0 && !isAdding && (
              <tr>
                <td
                  colSpan={weeks.flat().length + 1}
                  className="px-6 py-12 text-center"
                >
                  <p className="text-stone-400 text-sm font-medium">
                    No habits yet. Click &ldquo;Add Habit&rdquo; to get started!
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Habit Footer */}
      <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30">
        {isAdding ? (
          <div className="flex items-center gap-3 max-w-sm">
            <Input
              autoFocus
              placeholder="e.g. Read 10 pages"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateHabit();
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewHabitName("");
                }
              }}
              className="h-8 text-sm bg-white"
            />
            <Button
              size="sm"
              onClick={handleCreateHabit}
              className="h-8 bg-stone-800 hover:bg-stone-700 text-white text-xs"
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewHabitName("");
              }}
              className="h-8 text-xs text-stone-500"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-stone-400 hover:text-stone-700 gap-1.5 h-8 text-xs"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Habit
          </Button>
        )}
      </div>
    </div>
  );
}
