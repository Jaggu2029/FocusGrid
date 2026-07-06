"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Subscription } from "@/types/database";

interface BillingClientProps {
  isSubscribed: boolean;
  isTrial: boolean;
  trialEndDate: string | null;
  subscription: Subscription | null;
  userEmail: string;
}

export function BillingClient({
  isSubscribed,
  isTrial,
  trialEndDate,
  subscription,
  userEmail,
}: BillingClientProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No portal URL returned");
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setLoading(false);
    }
  }

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const formattedTrialEnd = trialEndDate
    ? new Date(trialEndDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and payment method.
        </p>
      </div>

      <Card className="border-stone-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Current Plan</CardTitle>
          <CardDescription>
            {isSubscribed
              ? "You have an active FocusGrid Pro subscription."
              : "You are currently on the Free plan."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-stone-900">
                {isSubscribed ? (isTrial ? "FocusGrid Pro (Trial)" : "FocusGrid Pro") : "Free"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? isTrial 
                    ? `Free trial ends ${formattedTrialEnd}`
                    : `$2.00/month • Renews ${periodEnd ?? "soon"}`
                  : "Limited access"}
              </p>
            </div>
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                isSubscribed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-stone-100 text-stone-500 border border-stone-200"
              }`}
            >
              {isSubscribed
                ? (subscription?.status === "trialing" || isTrial)
                  ? "Trial"
                  : "Active"
                : "Inactive"}
            </div>
          </div>

          <Separator />

          {isSubscribed && !isTrial ? (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Opening portal…" : "Manage Subscription"}
            </Button>
          ) : (
            <div className="space-y-3">
              {isTrial && (
                <div className="rounded-lg bg-amber-50 border border-amber-200/60 p-4 text-sm text-amber-800">
                  You are currently on a free trial. You can subscribe now to ensure uninterrupted access after your trial ends.
                </div>
              )}
              <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
                <p className="text-sm text-stone-600">
                  You are currently on the Free plan. Upgrade to unlock full access to all dashboards, progress tracking, and advanced features.
                </p>
              </div>
              <Link
                href="/app/upgrade"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                View Upgrade Plans
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
