"use client";

import { useTaskStore } from "@/lib/store/task-store";
import { format, parseISO } from "date-fns";
import { Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleTaskDayAction } from "@/app/app/tasks/actions";
import { useTransition } from "react";

interface MicroViewProps {
  dateStr: string;
  onBack: () => void;
}

export function MicroView({ dateStr, onBack }: MicroViewProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const taskDays = useTaskStore((state) => state.taskDays);
  const toggleTaskDay = useTaskStore((state) => state.toggleTaskDay);
  
  const [isPending, startTransition] = useTransition();
  const dateObj = parseISO(dateStr);

  // Filter only tasks that are assigned to this specific date
  // For now, based on the add logic, tasks are assigned if they have a taskDay entry
  const dayTasks = tasks.filter((t) => 
    taskDays.some(td => td.task_id === t.id && td.assigned_date === dateStr)
  );

  const handleToggle = (taskId: string) => {
    if (taskId.startsWith("temp-")) {
      toast.info("Please wait a moment for the task to save first!");
      return;
    }

    const existing = taskDays.find(
      (td) => td.task_id === taskId && td.assigned_date === dateStr
    );
    const isCompleted = existing?.completed ?? false;
    const newCompleted = !isCompleted;

    // Optimistic UI update
    toggleTaskDay(taskId, dateStr, newCompleted);

    // Server Action
    startTransition(() => {
      toggleTaskDayAction(taskId, dateStr, newCompleted).catch((err) => {
        console.error("Failed to toggle task:", err);
        // Revert on error
        toggleTaskDay(taskId, dateStr, isCompleted);
      });
    });
  };

  const completedCount = dayTasks.filter(t => {
    const td = taskDays.find(td => td.task_id === t.id && td.assigned_date === dateStr);
    return td?.completed;
  }).length;
  
  const totalCount = dayTasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex flex-col h-full bg-stone-950 rounded-2xl border border-stone-800 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-stone-800 bg-stone-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onBack}
            className="rounded-full w-10 h-10 border-stone-700 bg-transparent hover:bg-stone-800 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-stone-300" />
          </Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-stone-100">
              {format(dateObj, "EEEE")}
            </h2>
            <p className="text-stone-500 font-medium">
              {format(dateObj, "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="w-full sm:w-64 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-stone-300">Daily Focus</span>
            <span className="text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]">{progress}%</span>
          </div>
          <div className="h-3 w-full bg-stone-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.8)] transition-all duration-700 ease-in-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body: Large Task List */}
      <div className="flex-1 overflow-y-auto p-6 bg-stone-950/30">
        <div className="max-w-3xl mx-auto space-y-3">
          {dayTasks.length === 0 ? (
            <div className="text-center py-20 text-stone-500">
              <p className="text-lg font-medium">No tasks assigned for today.</p>
              <p className="text-sm mt-1">Go back to the weekly view to assign tasks.</p>
            </div>
          ) : (
            dayTasks.map((task) => {
              const existing = taskDays.find(
                (td) => td.task_id === task.id && td.assigned_date === dateStr
              );
              const isCompleted = existing?.completed ?? false;

              return (
                <div 
                  key={task.id}
                  onClick={() => handleToggle(task.id)}
                  className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm ${
                    isCompleted 
                      ? "bg-stone-900/40 border-stone-800 opacity-60" 
                      : "bg-stone-900 border-stone-700 hover:border-stone-600 hover:shadow-md"
                  }`}
                >
                  <button
                    className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isCompleted 
                        ? "bg-[#39FF14] border-[#39FF14] text-black shadow-[0_0_15px_rgba(57,255,20,0.4)]" 
                        : "border-stone-600 group-hover:border-stone-500"
                    }`}
                  >
                    {isCompleted && (
                      <Check className="w-5 h-5" strokeWidth={3} />
                    )}
                  </button>
                  <span className={`text-lg font-medium transition-colors ${
                    isCompleted ? "line-through text-stone-600" : "text-stone-100"
                  }`}>
                    {task.title}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
