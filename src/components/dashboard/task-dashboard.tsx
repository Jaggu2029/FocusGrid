"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MacroGrid } from "./macro-grid";
import { MicroView } from "./micro-view";
import { useTaskStore } from "@/lib/store/task-store";
import type { Task, TaskDay } from "@/types/database";
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";

interface TaskDashboardProps {
  initialTasks: Task[];
  initialTaskDays: TaskDay[];
}

export function TaskDashboard({ initialTasks, initialTaskDays }: TaskDashboardProps) {
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Sync server state with client store safely outside render cycle
  const initialized = useRef(false);
  
  useEffect(() => {
    if (!initialized.current) {
      useTaskStore.setState({ tasks: initialTasks, taskDays: initialTaskDays });
      initialized.current = true;
    } else {
      // On subsequent renders (after optimistic updates or server revalidation)
      useTaskStore.setState({ tasks: initialTasks, taskDays: initialTaskDays });
    }
  }, [initialTasks, initialTaskDays]);

  // Calculate the current week (Monday start)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(date => 
    format(date, "yyyy-MM-dd")
  );

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!selectedDateStr ? (
          <motion.div
            key="macro-grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            <MacroGrid 
              weekDays={weekDays} 
              onSelectDay={(dateStr) => setSelectedDateStr(dateStr)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="micro-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            <MicroView 
              dateStr={selectedDateStr} 
              onBack={() => setSelectedDateStr(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
