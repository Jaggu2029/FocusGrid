"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { toast } from "sonner";

interface AppNavProps {
  userEmail: string;
  userName?: string;
  avatarUrl?: string;
  isSubscribed: boolean;
}

export function AppNav({ userEmail, userName, avatarUrl, isSubscribed }: AppNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/app/tasks", label: "Tasks", icon: TasksIcon },
    { href: "/app/habits", label: "Habits", icon: HabitsIcon },
  ];

  useEffect(() => {
    // Show trial activation toast for this specific user
    const storageKey = `trial_toast_shown_${userEmail}`;
    if (isSubscribed && !localStorage.getItem(storageKey)) {
      // Use setTimeout to ensure the toast fires after the page fully renders
      setTimeout(() => {
        toast.success("Free one month Pro trial activated!", {
          duration: 5000,
        });
      }, 500);
      localStorage.setItem(storageKey, "true");
    }
  }, [isSubscribed, userEmail]);

  const displayString = userName || userEmail;
  const initials = userName 
    ? userName.charAt(0).toUpperCase() 
    : userEmail.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-[#faf9f6]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/app/tasks" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="#39FF14"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
                <line x1="12" y1="1" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="1" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="23" y2="12" />
              </svg>
            </div>
            <span className="font-semibold text-stone-900 dark:text-stone-100 hidden sm:inline-block">
              FocusGrid
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  prefetch={true}
                  className={buttonVariants({
                    variant: isActive ? "secondary" : "ghost",
                    size: "sm",
                    className: `gap-2 ${
                      /* @ts-ignore - special exists on some links but removed here */
                      link.special
                        ? "bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        : isActive
                        ? "bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
                        : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                    }`
                  })}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User menu */}
        <div className="flex items-center gap-3">
          <UserButton 
            appearance={{
              variables: {
                colorPrimary: "#39FF14",
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}

// Inline icon components — keeps the nav self-contained
function TasksIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function HabitsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
