-- Fix RLS policy for apply_to_work_with_us table
-- Drop all existing policies first
DROP POLICY IF EXISTS p_ins_apply_to_work_with_us ON public.apply_to_work_with_us;

-- Create a permissive policy that allows anonymous inserts
CREATE POLICY p_ins_apply_to_work_with_us
  ON public.apply_to_work_with_us
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also allow service role to insert (for admin operations)
CREATE POLICY p_ins_apply_to_work_with_us_service_role
  ON public.apply_to_work_with_us
  FOR INSERT
  TO service_role
  WITH CHECK (true);
