"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function toggleTaskDayAction(
  taskId: string,
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
    .from("task_days")
    .upsert(
      {
        task_id: taskId,
        assigned_date: dateStr,
        completed,
      },
      { onConflict: "task_id, assigned_date" }
    );

  if (error) {
    // Fallback if upsert fails due to missing unique constraint in some setups
    if (error.code === '42P10') { // 42P10 = unique constraint not found
      const { data: existing } = await (supabase as any)
        .from("task_days")
        .select("id")
        .eq("task_id", taskId)
        .eq("assigned_date", dateStr)
        .single();
      
      if (existing) {
        await (supabase as any)
          .from("task_days")
          .update({ completed })
          .eq("id", existing.id);
      } else {
         await (supabase as any)
          .from("task_days")
          .insert({ task_id: taskId, assigned_date: dateStr, completed });
      }
    } else {
      throw new Error(error.message);
    }
  }

  // No need to revalidate path since we use optimistic UI in Zustand,
  // but it's good practice just in case of hard reloads.
  revalidatePath("/app/tasks");
}

export async function createTaskAction(
  title: string,
  description: string,
  assignDates: string[]
) {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Insert the task
  const { data: task, error: taskError } = await (supabase as any)
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      description,
    })
    .select()
    .single();

  if (taskError) {
    throw new Error(taskError.message);
  }

  // Insert the task days
  if (assignDates.length > 0) {
    const daysToInsert = assignDates.map((dateStr) => ({
      task_id: task.id,
      assigned_date: dateStr,
      completed: false,
    }));

    const { error: daysError } = await (supabase as any)
      .from("task_days")
      .insert(daysToInsert);

    if (daysError) {
      throw new Error(daysError.message);
    }
  }

  revalidatePath("/app/tasks");
  return task; // Return the newly created task so the UI can redirect/update
}

export async function deleteTaskAction(taskId: string) {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { error } = await (supabase as any)
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/tasks");
}

export async function updateTaskAction(taskId: string, title: string) {
  const supabase = await createClient();
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const { error } = await (supabase as any)
    .from("tasks")
    .update({ title })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/app/tasks");
}
