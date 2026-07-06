import type { Subscription } from "@/types/database";

export function checkSubscriptionAccess(
  user: { createdAt: number } | null,
  subscription: Subscription | { status: string; current_period_end?: string | null } | null
) {
  if (!user) {
    return { isSubscribed: false, isTrial: false };
  }

  const isStripeSubscribed =
    subscription?.status === "active" || subscription?.status === "trialing";

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const isTrial =
    user.createdAt > Date.now() - thirtyDaysMs;

  return {
    isSubscribed: isStripeSubscribed || isTrial,
    isTrial: !isStripeSubscribed && isTrial,
    trialEndDate: isTrial
      ? new Date(user.createdAt + thirtyDaysMs)
      : null,
  };
}
