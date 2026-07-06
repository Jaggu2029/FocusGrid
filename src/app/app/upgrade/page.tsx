import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Upgrade — FocusGrid",
  description: "Upgrade your FocusGrid experience.",
};

const plans = [
  {
    name: "Monthly",
    price: "$1",
    duration: "1 month",
    features: [
      "Full macro & micro task tracking",
      "Advanced habit analytics",
      "Unlimited daily focus blocks",
      "Priority email support",
    ],
    popular: false,
  },
  {
    name: "Bi-Monthly",
    price: "$1.50",
    duration: "2 months",
    features: [
      "Everything in Monthly",
      "Save 25% compared to Monthly",
      "Custom theme selection",
      "Early access to new features",
    ],
    popular: true,
  },
  {
    name: "Half-Yearly",
    price: "$3",
    duration: "6 months",
    features: [
      "Everything in Bi-Monthly",
      "Save 50% compared to Monthly",
      "Premium onboarding session",
      "Access to beta program",
    ],
    popular: false,
  },
];

export default function UpgradePage() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl mb-4">
          Supercharge your productivity.
        </h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto">
          Choose the plan that fits your focus. Upgrade today and unlock the full potential of FocusGrid.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-3xl p-8 bg-white border ${
              plan.popular ? "border-blue-500 shadow-xl scale-105" : "border-stone-200 shadow-sm"
            } flex flex-col h-full transition-transform`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Most Popular
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-stone-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-stone-900">{plan.price}</span>
                <span className="text-stone-500 font-medium">/ {plan.duration}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? "text-blue-500" : "text-[#7BC142]"}`} />
                  <span className="text-stone-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full py-6 text-base font-semibold rounded-xl ${
                plan.popular
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                  : "bg-stone-900 hover:bg-stone-800 text-white"
              }`}
            >
              <Link href="/app/billing">Choose {plan.name}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
