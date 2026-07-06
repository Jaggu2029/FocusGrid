"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SubscriptionGate() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-stone-200/80 shadow-lg shadow-stone-200/50">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 mb-3">
            <svg
              className="w-7 h-7 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <CardTitle className="text-xl">Unlock FocusGrid</CardTitle>
          <CardDescription className="text-base">
            Subscribe to access your task and habit dashboards with
            real-time progress tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-stone-900">$2</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cancel anytime. No hidden fees.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex items-center gap-2">
              <CheckIcon />
              Weekly task drill-down dashboard
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Monthly habit matrix with trends
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Real-time progress visualization
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon />
              Macro ↔ micro focus transitions
            </li>
          </ul>

          <Link href="/app/billing" className="block">
            <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-sm">
              Subscribe Now
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-emerald-500 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
