import { create } from "zustand";
import type { Task, TaskDay } from "@/types/database";

interface TaskState {
  tasks: Task[];
  taskDays: TaskDay[];
  setInitialData: (tasks: Task[], taskDays: TaskDay[]) => void;
  toggleTaskDay: (taskId: string, dateStr: string, completed: boolean) => void;
  addTask: (task: Task, days: TaskDay[]) => void;
  updateTaskTitle: (taskId: string, title: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  taskDays: [],

  setInitialData: (tasks, taskDays) => {
    set({ tasks, taskDays });
  },

  toggleTaskDay: (taskId, dateStr, completed) => {
    set((state) => {
      // Find if the taskDay already exists
      const existingIndex = state.taskDays.findIndex(
        (td) => td.task_id === taskId && td.assigned_date === dateStr
      );

      if (existingIndex >= 0) {
        // Update existing
        const newDays = [...state.taskDays];
        newDays[existingIndex] = { ...newDays[existingIndex], completed };
        return { taskDays: newDays };
      } else {
        // Add new (optimistic ID, since server will assign real one)
        const newDay: TaskDay = {
          id: `temp-${Date.now()}`,
          task_id: taskId,
          assigned_date: dateStr,
          completed,
        };
        return { taskDays: [...state.taskDays, newDay] };
      }
    });
  },

  addTask: (task, days) => {
    set((state) => ({
      tasks: [...state.tasks, task],
      taskDays: [...state.taskDays, ...days],
    }));
  },

  updateTaskTitle: (taskId, title) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
    }));
  },
}));
