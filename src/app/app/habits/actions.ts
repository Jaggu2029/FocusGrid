"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createHabitAction(name: string) {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data: habit, error } = await (supabase as any)
    .from("habits")
    .insert({
      user_id: userId,
      name,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/habits");
  return habit;
}

export async function deleteHabitAction(habitId: string) {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // CASCADE on the FK will delete related habit_logs automatically
  const { error } = await (supabase as any)
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/habits");
}

export async function toggleHabitLogAction(
  habitId: string,
  dateStr: string,
  completed: boolean
) {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Upsert to handle race conditions where double-clicking causes two concurrent inserts
  const { error } = await (supabase as any)
    .from("habit_logs")
    .upsert(
      {
        habit_id: habitId,
        date: dateStr,
        completed,
      },
      { onConflict: "habit_id, date" }
    );

  if (error) {
    // Fallback if upsert fails due to missing unique constraint in some setups
    if (error.code === '42P10') { // 42P10 = unique constraint not found
      const { data: existing } = await (supabase as any)
        .from("habit_logs")
        .select("id")
        .eq("habit_id", habitId)
        .eq("date", dateStr)
        .single();
      
      if (existing) {
        await (supabase as any)
          .from("habit_logs")
          .update({ completed })
          .eq("id", existing.id);
      } else {
         await (supabase as any)
          .from("habit_logs")
          .insert({ habit_id: habitId, date: dateStr, completed });
      }
    } else {
      throw new Error(error.message);
    }
  }

  revalidatePath("/app/habits");
}

export async function updateHabitAction(habitId: string, name: string) {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const { error } = await (supabase as any)
    .from("habits")
    .update({ name })
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/app/habits");
}
