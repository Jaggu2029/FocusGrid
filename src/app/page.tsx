import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/app/tasks");
  }

  // Phase 5 will replace this with a full landing page.
  // For now, redirect unauthenticated users to sign in.
  redirect("/sign-in");
}
