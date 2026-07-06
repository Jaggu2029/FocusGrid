import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { checkSubscriptionAccess } from "@/lib/subscription";
import { TaskDashboard } from "@/components/dashboard/task-dashboard";
import { startOfWeek, endOfWeek, format } from "date-fns";

export const metadata = {
  title: "Tasks — FocusGrid",
  description: "Your weekly task drill-down dashboard.",
};

export default async function TasksPage() {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  // Check subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .single() as { data: { status: string } | null };

  const { isSubscribed } = checkSubscriptionAccess(user, subscription);

  if (!isSubscribed) {
    return <SubscriptionGate />;
  }

  // Fetch user's tasks
  const { data: tasks } = await (supabase as any)
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Calculate the current week to fetch relevant task_days
  // We fetch task_days for the current week. Actually, we can fetch all task_days for these tasks,
  // but to be efficient, we filter by the current week's date range if we want, or just fetch all
  // for the user if it's small. Let's fetch task_days using an IN clause for the task IDs.
  
  const taskIds = tasks?.map((t: any) => t.id) || [];
  
  let taskDays: any[] = [];
  if (taskIds.length > 0) {
    const { data: td } = await (supabase as any)
      .from("task_days")
      .select("*")
      .in("task_id", taskIds);
    taskDays = td || [];
  }

  return (
    <TaskDashboard 
      initialTasks={tasks || []} 
      initialTaskDays={taskDays} 
    />
  );
}
