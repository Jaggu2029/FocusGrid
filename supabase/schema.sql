-- ============================================================
-- FocusGrid — Supabase Schema + Row Level Security Policies
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Tasks: user to-do items
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text DEFAULT '',
  completed   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Task Days: many-to-many mapping of tasks to assigned dates
-- A single task can be assigned to multiple days.
-- `completed` here tracks per-day completion (a task can be done on Monday but not Tuesday).
CREATE TABLE IF NOT EXISTS public.task_days (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  assigned_date date NOT NULL,
  completed     boolean NOT NULL DEFAULT false,
  UNIQUE(task_id, assigned_date)
);

-- Habits: named habits per user
CREATE TABLE IF NOT EXISTS public.habits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habit Logs: daily completion log for each habit
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id  uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date      date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  UNIQUE(habit_id, date)
);

-- Subscriptions: Stripe subscription state managed by webhooks
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      text NOT NULL,
  stripe_subscription_id  text NOT NULL UNIQUE,
  status                  text NOT NULL DEFAULT 'incomplete',
  current_period_end      timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES (performance for RLS subqueries + common queries)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_days_task_id ON public.task_days(task_id);
CREATE INDEX IF NOT EXISTS idx_task_days_assigned_date ON public.task_days(assigned_date);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES — tasks
-- ============================================================

CREATE POLICY "Users can select their own tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5. RLS POLICIES — task_days (join table, no direct user_id)
--    Uses EXISTS subquery to verify ownership via tasks table
-- ============================================================

CREATE POLICY "Users can select their own task_days"
  ON public.task_days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_days.task_id
        AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own task_days"
  ON public.task_days FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_days.task_id
        AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own task_days"
  ON public.task_days FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_days.task_id
        AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_days.task_id
        AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own task_days"
  ON public.task_days FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_days.task_id
        AND tasks.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. RLS POLICIES — habits
-- ============================================================

CREATE POLICY "Users can select their own habits"
  ON public.habits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own habits"
  ON public.habits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 7. RLS POLICIES — habit_logs (join table, no direct user_id)
--    Uses EXISTS subquery to verify ownership via habits table
-- ============================================================

CREATE POLICY "Users can select their own habit_logs"
  ON public.habit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_logs.habit_id
        AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own habit_logs"
  ON public.habit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_logs.habit_id
        AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own habit_logs"
  ON public.habit_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_logs.habit_id
        AND habits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_logs.habit_id
        AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own habit_logs"
  ON public.habit_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_logs.habit_id
        AND habits.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. RLS POLICIES — subscriptions
--    Users can only READ their own subscription.
--    INSERT/UPDATE/DELETE restricted to service_role (Stripe webhook).
-- ============================================================

CREATE POLICY "Users can select their own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role bypasses RLS by default, so no explicit INSERT/UPDATE/DELETE
-- policies are needed for the webhook handler. Authenticated users are
-- blocked from writing to this table because there are no permissive
-- INSERT/UPDATE/DELETE policies for the 'authenticated' role.

-- ============================================================
-- 9. HELPER: updated_at trigger for subscriptions
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
