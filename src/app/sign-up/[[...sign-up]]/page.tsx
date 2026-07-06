import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-stone-50">
      <SignUp fallbackRedirectUrl="/app/tasks" />
    </div>
  );
}
