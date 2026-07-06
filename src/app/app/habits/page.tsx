import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { checkSubscriptionAccess } from "@/lib/subscription";
import { HabitDashboard } from "@/components/dashboard/habit-dashboard";

export const metadata = {
  title: "Habits — FocusGrid",
  description: "Your monthly habit matrix dashboard.",
};

export default async function HabitsPage() {
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

  // Fetch user's habits
  const { data: habits } = await (supabase as any)
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  // Fetch habit logs for these habits
  const habitIds = habits?.map((h: any) => h.id) || [];

  let habitLogs: any[] = [];
  if (habitIds.length > 0) {
    const { data: logs } = await (supabase as any)
      .from("habit_logs")
      .select("*")
      .in("habit_id", habitIds);
    habitLogs = logs || [];
  }

  return (
    <HabitDashboard
      initialHabits={habits || []}
      initialHabitLogs={habitLogs}
    />
  );
}
