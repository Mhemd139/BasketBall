-- ============================================================
-- Basketball Manager — RLS Security Hardening
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 0. Standardize trainer roles (migration)
-- ============================================================

-- Set seed head coaches
UPDATE trainers SET role = 'headcoach' WHERE phone IN ('972543299106', '972587131002');
-- Normalize all other trainers
UPDATE trainers SET role = 'trainer' WHERE role IS NULL OR role NOT IN ('headcoach', 'trainer');

-- ============================================================
-- 1. Fix function search_path warnings
-- ============================================================

ALTER FUNCTION private.is_admin() SET search_path = private, public, pg_temp;
ALTER FUNCTION private.current_trainer_id() SET search_path = private, public, pg_temp;

-- Also fix create_trainer and update_trainer_profile if they exist
DO $$
BEGIN
  ALTER FUNCTION public.create_trainer(text) SET search_path = public, pg_temp;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$
BEGIN
  ALTER FUNCTION public.update_trainer_profile(uuid, text, text, text) SET search_path = public, pg_temp;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- ============================================================
-- 2. Enable RLS on unprotected tables
-- ============================================================

ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. SELECT policies (allow reads via anon key)
-- The app uses custom auth — middleware verifies session cookie
-- before the page even loads. Anon key is only available to
-- authenticated users.
-- ============================================================

CREATE POLICY "anon_select" ON public.halls FOR SELECT USING (true);
CREATE POLICY "anon_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "anon_select" ON public.classes FOR SELECT USING (true);
CREATE POLICY "anon_select" ON public.trainees FOR SELECT USING (true);
CREATE POLICY "anon_select" ON public.attendance FOR SELECT USING (true);

-- ============================================================
-- 4. WRITE policies — block direct anon writes
-- All mutations go through SECURITY DEFINER RPCs below
-- ============================================================

-- halls
CREATE POLICY "block_insert" ON public.halls FOR INSERT WITH CHECK (false);
CREATE POLICY "block_update" ON public.halls FOR UPDATE USING (false);
CREATE POLICY "block_delete" ON public.halls FOR DELETE USING (false);

-- events
CREATE POLICY "block_insert" ON public.events FOR INSERT WITH CHECK (false);
CREATE POLICY "block_update" ON public.events FOR UPDATE USING (false);
CREATE POLICY "block_delete" ON public.events FOR DELETE USING (false);

-- classes
CREATE POLICY "block_insert" ON public.classes FOR INSERT WITH CHECK (false);
CREATE POLICY "block_update" ON public.classes FOR UPDATE USING (false);
CREATE POLICY "block_delete" ON public.classes FOR DELETE USING (false);

-- trainees
CREATE POLICY "block_insert" ON public.trainees FOR INSERT WITH CHECK (false);
CREATE POLICY "block_update" ON public.trainees FOR UPDATE USING (false);
CREATE POLICY "block_delete" ON public.trainees FOR DELETE USING (false);

-- attendance
CREATE POLICY "block_insert" ON public.attendance FOR INSERT WITH CHECK (false);
CREATE POLICY "block_update" ON public.attendance FOR UPDATE USING (false);
CREATE POLICY "block_delete" ON public.attendance FOR DELETE USING (false);

-- ============================================================
-- 5. Fix payment_logs permissive policy
-- ============================================================

DROP POLICY IF EXISTS "Enable read/write for auth users" ON public.payment_logs;
CREATE POLICY "anon_select_logs" ON public.payment_logs FOR SELECT USING (true);
CREATE POLICY "block_insert_logs" ON public.payment_logs FOR INSERT WITH CHECK (false);
CREATE POLICY "block_update_logs" ON public.payment_logs FOR UPDATE USING (false);
CREATE POLICY "block_delete_logs" ON public.payment_logs FOR DELETE USING (false);

-- ============================================================
-- 6. SECURITY DEFINER RPC functions for mutations
-- These bypass RLS and are called from server actions
-- ============================================================

-- === EVENTS ===

CREATE OR REPLACE FUNCTION upsert_event(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_data->>'id' IS NOT NULL AND p_data->>'id' != '' THEN
    UPDATE events SET
      hall_id = (p_data->>'hall_id')::uuid,
      trainer_id = CASE WHEN p_data->>'trainer_id' IS NOT NULL THEN (p_data->>'trainer_id')::uuid ELSE trainer_id END,
      type = COALESCE(p_data->>'type', type),
      title_en = COALESCE(p_data->>'title_en', title_en),
      title_ar = COALESCE(p_data->>'title_ar', title_ar),
      title_he = COALESCE(p_data->>'title_he', title_he),
      event_date = COALESCE((p_data->>'event_date')::date, event_date),
      start_time = COALESCE((p_data->>'start_time')::time, start_time),
      end_time = COALESCE((p_data->>'end_time')::time, end_time),
      notes_en = p_data->>'notes_en',
      notes_ar = p_data->>'notes_ar',
      notes_he = p_data->>'notes_he',
      updated_at = now()
    WHERE id = (p_data->>'id')::uuid
    RETURNING to_jsonb(events.*) INTO result;
  ELSE
    INSERT INTO events (hall_id, trainer_id, type, title_en, title_ar, title_he, event_date, start_time, end_time, notes_en, notes_ar, notes_he)
    VALUES (
      (p_data->>'hall_id')::uuid,
      CASE WHEN p_data->>'trainer_id' IS NOT NULL THEN (p_data->>'trainer_id')::uuid ELSE NULL END,
      COALESCE(p_data->>'type', 'training'),
      p_data->>'title_en',
      p_data->>'title_ar',
      p_data->>'title_he',
      (p_data->>'event_date')::date,
      (p_data->>'start_time')::time,
      (p_data->>'end_time')::time,
      p_data->>'notes_en',
      p_data->>'notes_ar',
      p_data->>'notes_he'
    )
    RETURNING to_jsonb(events.*) INTO result;
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION delete_event(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM events WHERE id = p_id;
END;
$$;

-- === HALLS ===

CREATE OR REPLACE FUNCTION update_hall_rpc(p_id uuid, p_name_en text, p_name_ar text, p_name_he text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE halls SET name_en = p_name_en, name_ar = p_name_ar, name_he = p_name_he, updated_at = now()
  WHERE id = p_id
  RETURNING to_jsonb(halls.*) INTO result;
  RETURN result;
END;
$$;

-- === CLASSES ===

CREATE OR REPLACE FUNCTION insert_class(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  INSERT INTO classes (name_en, name_ar, name_he, trainer_id, hall_id, schedule_info)
  VALUES (
    p_data->>'name_en',
    p_data->>'name_ar',
    p_data->>'name_he',
    CASE WHEN p_data->>'trainer_id' IS NOT NULL AND p_data->>'trainer_id' != '' THEN (p_data->>'trainer_id')::uuid ELSE NULL END,
    CASE WHEN p_data->>'hall_id' IS NOT NULL AND p_data->>'hall_id' != '' THEN (p_data->>'hall_id')::uuid ELSE NULL END,
    p_data->>'schedule_info'
  )
  RETURNING to_jsonb(classes.*) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION insert_hall(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  INSERT INTO halls (name_en, name_ar, name_he)
  VALUES (
    p_data->>'name_en',
    p_data->>'name_ar',
    p_data->>'name_he'
  )
  RETURNING to_jsonb(halls.*) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION update_class(p_id uuid, p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE classes SET
    name_en = COALESCE(p_data->>'name_en', name_en),
    name_ar = COALESCE(p_data->>'name_ar', name_ar),
    name_he = COALESCE(p_data->>'name_he', name_he),
    trainer_id = CASE WHEN p_data ? 'trainer_id' THEN
      CASE WHEN p_data->>'trainer_id' IS NOT NULL AND p_data->>'trainer_id' != '' THEN (p_data->>'trainer_id')::uuid ELSE NULL END
    ELSE trainer_id END,
    hall_id = CASE WHEN p_data ? 'hall_id' THEN
      CASE WHEN p_data->>'hall_id' IS NOT NULL AND p_data->>'hall_id' != '' THEN (p_data->>'hall_id')::uuid ELSE NULL END
    ELSE hall_id END,
    updated_at = now()
  WHERE id = p_id
  RETURNING to_jsonb(classes.*) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION delete_class(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM classes WHERE id = p_id;
END;
$$;

-- === TRAINEES ===

CREATE OR REPLACE FUNCTION insert_trainee(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  INSERT INTO trainees (class_id, name_en, name_ar, name_he, phone, jersey_number, is_paid, gender)
  VALUES (
    (p_data->>'class_id')::uuid,
    p_data->>'name_en',
    p_data->>'name_ar',
    p_data->>'name_he',
    p_data->>'phone',
    CASE WHEN p_data->>'jersey_number' IS NOT NULL THEN (p_data->>'jersey_number')::int ELSE NULL END,
    COALESCE((p_data->>'is_paid')::boolean, false),
    COALESCE(p_data->>'gender', 'male')
  )
  RETURNING to_jsonb(trainees.*) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION update_trainee_rpc(p_id uuid, p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE trainees SET
    name_en = COALESCE(p_data->>'name_en', name_en),
    name_ar = COALESCE(p_data->>'name_ar', name_ar),
    name_he = COALESCE(p_data->>'name_he', name_he),
    phone = COALESCE(p_data->>'phone', phone),
    jersey_number = CASE WHEN p_data ? 'jersey_number' THEN (p_data->>'jersey_number')::int ELSE jersey_number END,
    class_id = CASE WHEN p_data ? 'class_id' THEN (p_data->>'class_id')::uuid ELSE class_id END,
    is_paid = CASE WHEN p_data ? 'is_paid' THEN (p_data->>'is_paid')::boolean ELSE is_paid END,
    amount_paid = CASE WHEN p_data ? 'amount_paid' THEN (p_data->>'amount_paid')::numeric ELSE amount_paid END,
    gender = CASE WHEN p_data ? 'gender' THEN p_data->>'gender' ELSE gender END,
    updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_trainee(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM trainees WHERE id = p_id;
END;
$$;

-- === ATTENDANCE ===

CREATE OR REPLACE FUNCTION upsert_attendance(p_trainee_id uuid, p_event_id uuid, p_status text, p_marked_by uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO attendance (trainee_id, event_id, status, marked_by, marked_at)
  VALUES (p_trainee_id, p_event_id, p_status, p_marked_by, now())
  ON CONFLICT (trainee_id, event_id)
  DO UPDATE SET status = p_status, marked_by = p_marked_by, marked_at = now();
END;
$$;

-- === PAYMENT LOGS ===

CREATE OR REPLACE FUNCTION insert_payment_log(p_trainee_id uuid, p_amount numeric, p_note text DEFAULT NULL, p_season text DEFAULT '2025-2026')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO payment_logs (trainee_id, amount, note, season, payment_date)
  VALUES (p_trainee_id, p_amount, p_note, p_season, now());
END;
$$;

CREATE OR REPLACE FUNCTION update_trainee_payment_rpc(p_trainee_id uuid, p_amount numeric, p_comment text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE trainees SET
    amount_paid = p_amount,
    payment_comment_en = p_comment,
    payment_comment_ar = p_comment,
    payment_comment_he = p_comment,
    updated_at = now()
  WHERE id = p_trainee_id;
END;
$$;

-- === TRAINERS ===

CREATE OR REPLACE FUNCTION update_trainer_rpc(p_id uuid, p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE trainers SET
    name_en = COALESCE(p_data->>'name_en', name_en),
    name_ar = COALESCE(p_data->>'name_ar', name_ar),
    name_he = COALESCE(p_data->>'name_he', name_he),
    phone = CASE WHEN p_data ? 'phone' THEN p_data->>'phone' ELSE phone END,
    gender = CASE WHEN p_data ? 'gender' THEN p_data->>'gender' ELSE gender END,
    role = CASE WHEN p_data ? 'role' THEN p_data->>'role' ELSE role END,
    availability = CASE WHEN p_data ? 'availability' THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'availability')) ELSE availability END,
    updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_trainer_rpc(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM trainers WHERE id = p_id;
END;
$$;

-- === BULK ATTENDANCE ===

CREATE OR REPLACE FUNCTION bulk_upsert_attendance(p_records jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO attendance (trainee_id, event_id, status, marked_at)
  SELECT
    (rec->>'trainee_id')::uuid,
    (rec->>'event_id')::uuid,
    rec->>'status',
    now()
  FROM jsonb_array_elements(p_records) AS rec
  ON CONFLICT (trainee_id, event_id)
  DO UPDATE SET status = EXCLUDED.status, marked_at = now();
END;
$$;
