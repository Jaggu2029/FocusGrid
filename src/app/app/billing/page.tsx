import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { BillingClient } from "./billing-client";
import type { Subscription } from "@/types/database";
import { checkSubscriptionAccess } from "@/lib/subscription";

export const metadata = {
  title: "Billing — FocusGrid",
  description: "Manage your FocusGrid subscription.",
};

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single() as { data: Subscription | null };

  const { isSubscribed, isTrial, trialEndDate } = checkSubscriptionAccess(user, subscription);

  return (
    <BillingClient
      isSubscribed={isSubscribed}
      isTrial={isTrial}
      trialEndDate={trialEndDate ? trialEndDate.toISOString() : null}
      subscription={subscription}
      userEmail={user?.primaryEmailAddress?.emailAddress ?? ""}
    />
  );
}
