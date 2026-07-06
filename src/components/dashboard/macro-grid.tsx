"use client";

import { useTaskStore } from "@/lib/store/task-store";
import { format, parseISO } from "date-fns";
import { Check, Plus, Maximize2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleTaskDayAction, createTaskAction, deleteTaskAction, updateTaskAction } from "@/app/app/tasks/actions";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";

interface MacroGridProps {
  weekDays: string[];
  onSelectDay: (dateStr: string) => void;
}

export function MacroGrid({ weekDays, onSelectDay }: MacroGridProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const taskDays = useTaskStore((state) => state.taskDays);
  const toggleTaskDay = useTaskStore((state) => state.toggleTaskDay);
  const updateTaskTitle = useTaskStore((state) => state.updateTaskTitle);
  
  const [isPending, startTransition] = useTransition();
  const [addingForDay, setAddingForDay] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");

  const handleToggle = (taskId: string, dateStr: string) => {
    if (taskId.startsWith("temp-")) {
      toast.info("Please wait a moment for the task to save first!");
      return;
    }

    const existing = taskDays.find(
      (td) => td.task_id === taskId && td.assigned_date === dateStr
    );
    const isCompleted = existing?.completed ?? false;
    const newCompleted = !isCompleted;

    toggleTaskDay(taskId, dateStr, newCompleted);

    startTransition(() => {
      toggleTaskDayAction(taskId, dateStr, newCompleted).catch((err) => {
        console.error("Failed to toggle task:", err);
        toggleTaskDay(taskId, dateStr, isCompleted);
      });
    });
  };

  const handleCreateTask = (dateStr: string) => {
    if (!newTaskTitle.trim()) {
      setAddingForDay(null);
      return;
    }
    
    const title = newTaskTitle.trim();
    setNewTaskTitle("");
    setAddingForDay(null);

    // Optimistic UI for create
    const tempTaskId = `temp-task-${Date.now()}`;
    const tempTaskDayId = `temp-td-${Date.now()}`;
    
    useTaskStore.setState((state) => ({
      tasks: [...state.tasks, { 
        id: tempTaskId, 
        user_id: "temp", 
        title, 
        description: "", 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      }],
      taskDays: [...state.taskDays, { 
        id: tempTaskDayId, 
        task_id: tempTaskId, 
        assigned_date: dateStr, 
        completed: false, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      }],
    }));

    startTransition(() => {
      createTaskAction(title, "", [dateStr]).catch((err) => {
        console.error("Failed to create task:", err);
        // On error, revert optimistic add
        useTaskStore.setState((state) => ({
          tasks: state.tasks.filter((t) => t.id !== tempTaskId),
          taskDays: state.taskDays.filter((td) => td.id !== tempTaskDayId),
        }));
      });
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToRestore = tasks.find((t) => t.id === taskId);
    const daysToRestore = taskDays.filter((td) => td.task_id === taskId);
    if (!taskToRestore) return;

    // Optimistic delete: remove from store
    useTaskStore.setState((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      taskDays: state.taskDays.filter((td) => td.task_id !== taskId),
    }));
    
    let timeoutId: NodeJS.Timeout;

    toast.success("Task deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          useTaskStore.setState((state) => ({
            tasks: [...state.tasks, taskToRestore],
            taskDays: [...state.taskDays, ...daysToRestore],
          }));
        },
      },
    });

    timeoutId = setTimeout(() => {
      startTransition(() => {
        deleteTaskAction(taskId).catch((err) => {
          console.error("Failed to delete task:", err);
        });
      });
    }, 4000);
  };

  const handleRenameSubmit = (taskId: string, oldTitle: string) => {
    const newTitle = editTaskTitle.trim();
    if (!newTitle || newTitle === oldTitle) {
      setEditingTaskId(null);
      return;
    }

    updateTaskTitle(taskId, newTitle);
    setEditingTaskId(null);

    startTransition(() => {
      updateTaskAction(taskId, newTitle).catch((err) => {
        console.error("Failed to rename task:", err);
        updateTaskTitle(taskId, oldTitle); // revert
      });
    });
  };

  const getDayStats = (dateStr: string) => {
    const daysForDate = taskDays.filter((td) => td.assigned_date === dateStr);
    const total = daysForDate.length;
    const completed = daysForDate.filter((td) => td.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress, daysForDate };
  };

  const overallData = weekDays.map((dateStr) => {
    const stats = getDayStats(dateStr);
    return {
      day: format(parseISO(dateStr), "EEE"),
      completed: stats.completed,
      total: stats.total,
    };
  });
  
  const totalCompletedWeek = overallData.reduce((acc, curr) => acc + curr.completed, 0);
  const totalAssignedWeek = overallData.reduce((acc, curr) => acc + curr.total, 0);
  const weekProgress = totalAssignedWeek === 0 ? 0 : Math.round((totalCompletedWeek / totalAssignedWeek) * 100);

  return (
    <div className="flex flex-col w-full min-h-screen pb-12">
      
      {/* Top: Overall Progress (Bar Chart + Donut) */}
      <div className="mb-4 bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-x-auto">
        <div className="p-6 flex flex-row gap-8 items-center min-w-[600px]">
          
          {/* Left Side: Bar Chart */}
          <div className="flex-1 w-full flex flex-col h-40">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2 text-left">
              Overall Progress
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overallData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#78716c" }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {overallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.completed > 0 ? "#86efac" : "#e7e5e4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Big Donut Chart */}
        <div className="w-48 flex flex-col items-center justify-center shrink-0">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                className="text-stone-200 dark:text-stone-800"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
                r="50"
                cx="64"
                cy="64"
              />
              <circle
                className="text-[#39FF14] transition-all duration-1000 ease-in-out"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={(2 * Math.PI * 50) - (weekProgress / 100) * (2 * Math.PI * 50)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="50"
                cx="64"
                cy="64"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-stone-800 dark:text-stone-100">{weekProgress}%</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-stone-500 mt-2">
            {totalCompletedWeek} / {totalAssignedWeek} completed
          </span>
        </div>
        </div>
      </div>

      {/* Body: 7 Columns Grid */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[800px] grid grid-cols-7 gap-px bg-stone-200 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
           {weekDays.map((dateStr) => {
              const dateObj = parseISO(dateStr);
              const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
              const stats = getDayStats(dateStr);
              const radius = 24;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (stats.progress / 100) * circumference;
  
              return (
                <div key={dateStr} className={`flex flex-col bg-white dark:bg-stone-950 h-full ${isToday ? "ring-2 ring-inset ring-[#7BC142] rounded z-10" : ""}`}>
                   {/* Header matching image style */}
                   <div className={`p-3 text-center border-b border-stone-200 dark:border-stone-800 transition-colors ${isToday ? "bg-[#5c77a3]" : "bg-[#6b87b5]"}`}>
                     <div className="font-bold text-white">{format(dateObj, "EEEE")}</div>
                     <div className="text-xs font-medium opacity-90 text-stone-200">{format(dateObj, "dd.MM.yyyy")}</div>
                   </div>
  
                   {/* Ring section */}
                   <div 
                     className="p-4 flex justify-center relative group cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
                     onClick={() => onSelectDay(dateStr)}
                   >
                     <div className="relative w-16 h-16 flex items-center justify-center">
                       <svg className="w-16 h-16 transform -rotate-90">
                          <circle className="text-stone-200 dark:text-stone-800" strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx="32" cy="32" />
                          <circle className="text-[#39FF14] transition-all duration-700 ease-in-out" strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="32" cy="32" />
                       </svg>
                       <span className="absolute text-xs font-bold text-stone-700 dark:text-stone-300">{stats.progress}%</span>
                     </div>
                     {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 backdrop-blur-[2px]">
                       <div className="flex flex-col items-center text-white">
                         <Maximize2 className="w-5 h-5 mb-1" />
                         <span className="text-xs font-medium">Focus</span>
                       </div>
                     </div>
                   </div>
  
                   {/* Task Title "Tasks" header */}
                   <div className="bg-[#26344A] py-1 text-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-white">Tasks</span>
                   </div>
  
                   {/* Task List */}
                   <div className="flex-1 p-2 flex flex-col gap-1">
                     {stats.daysForDate.map(td => {
                       const task = tasks.find(t => t.id === td.task_id);
                       return (
                          <div 
                            key={td.id} 
                            className="flex flex-row items-start justify-between p-1.5 rounded group/task gap-1 cursor-pointer transition-colors"
                            onClick={() => {
                              if (editingTaskId !== td.task_id) {
                                handleToggle(td.task_id, dateStr);
                              }
                            }}
                          >
                            {editingTaskId === td.task_id ? (
                              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  autoFocus
                                  value={editTaskTitle}
                                  onChange={(e) => setEditTaskTitle(e.target.value)}
                                  onBlur={() => handleRenameSubmit(td.task_id, task?.title || "")}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameSubmit(td.task_id, task?.title || "");
                                    if (e.key === "Escape") setEditingTaskId(null);
                                  }}
                                  className="h-6 py-0 px-1.5 text-xs w-full"
                                />
                              </div>
                            ) : (
                              <span className={`text-sm flex-1 leading-tight break-all ${td.completed ? "line-through text-stone-400 dark:text-stone-600" : "text-stone-700 dark:text-stone-300"}`}>
                                {task?.title || "Untitled Task"}
                              </span>
                            )}
                            
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTaskId(td.task_id);
                                  setEditTaskTitle(task?.title || "");
                                }}
                                className="opacity-0 group-hover/task:opacity-100 text-stone-400 hover:text-stone-600 p-0.5 transition-opacity"
                                title="Rename task"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(td.task_id);
                                }}
                                className="opacity-0 group-hover/task:opacity-100 text-red-400 hover:text-red-600 p-0.5 transition-opacity"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                             
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleToggle(td.task_id, dateStr);
                               }}
                               className={`shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                                 td.completed 
                                   ? "bg-stone-800 border-stone-800 text-white dark:bg-stone-200 dark:border-stone-200 dark:text-stone-900" 
                                   : "border-stone-300 dark:border-stone-600 hover:border-stone-400"
                               }`}
                             >
                               {td.completed && <Check className="w-2.5 h-2.5" strokeWidth={4} />}
                             </button>
                           </div>
                         </div>
                       );
                     })}
  
                     {addingForDay === dateStr ? (
                       <div className="flex items-center gap-2 pt-2 mt-2">
                         <Input 
                           autoFocus
                           placeholder="New task..."
                           value={newTaskTitle}
                           onChange={(e) => setNewTaskTitle(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') handleCreateTask(dateStr);
                             if (e.key === 'Escape') setAddingForDay(null);
                           }}
                           className="h-7 text-xs px-2 bg-transparent"
                         />
                       </div>
                     ) : (
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 w-full justify-start gap-1 h-7 text-xs mt-2"
                         onClick={() => setAddingForDay(dateStr)}
                       >
                         <Plus className="w-3 h-3" />
                         Add
                       </Button>
                     )}
                   </div>
  
                   {/* Column Footer */}
                   <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex flex-col gap-1.5 mt-auto">
                     <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                       <span className="text-stone-700 dark:text-stone-300">Done</span>
                       <span className="text-stone-900 dark:text-stone-100 text-sm">{stats.completed}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                       <span className="text-stone-500">Left</span>
                       <span className="text-stone-900 dark:text-stone-100 text-sm">{stats.total - stats.completed}</span>
                     </div>
                     <div className="h-1 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden mt-1">
                       <div className="h-full bg-[#39FF14] transition-all duration-500" style={{ width: `${stats.progress}%` }} />
                     </div>
                   </div>
  
                </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}
