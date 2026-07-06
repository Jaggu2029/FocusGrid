import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/dashboard/app-nav";
import { checkSubscriptionAccess } from "@/lib/subscription";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  
  const user = await currentUser();
  const supabase = await createClient();

  // Check subscription status — allow access to billing regardless
  // so users can subscribe. For all other /app/* routes, require active sub.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .single() as { data: { status: string; current_period_end: string | null } | null };

  const { isSubscribed } = checkSubscriptionAccess(user, subscription);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav 
        userEmail={user?.primaryEmailAddress?.emailAddress || ""} 
        userName={user?.firstName || "User"}
        avatarUrl={user?.imageUrl}
        isSubscribed={isSubscribed}
      />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
