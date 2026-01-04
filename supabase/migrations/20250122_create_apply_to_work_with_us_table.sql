-- Create dedicated table for "Apply to Work With Us" form submissions
CREATE TABLE IF NOT EXISTS public.apply_to_work_with_us (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email_address text NOT NULL,
  website_url text,
  company_description text,
  current_challenges text,
  goals text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apply_to_work_with_us ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
DROP POLICY IF EXISTS p_ins_apply_to_work_with_us ON public.apply_to_work_with_us;
CREATE POLICY p_ins_apply_to_work_with_us
  ON public.apply_to_work_with_us
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create index on email for duplicate checking
CREATE INDEX IF NOT EXISTS idx_apply_to_work_with_us_email 
  ON public.apply_to_work_with_us(email_address);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_apply_to_work_with_us_created_at 
  ON public.apply_to_work_with_us(created_at DESC);
