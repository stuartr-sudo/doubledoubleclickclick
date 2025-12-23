-- Create authors table for editable author profiles (bio, LinkedIn, avatar, etc.)
-- Public can read author profiles; writes should be done via server/service role.

CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  bio text,
  linkedin_url text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Basic validation: slug must not be empty
DO $$
BEGIN
  ALTER TABLE public.authors
    ADD CONSTRAINT authors_slug_not_empty CHECK (LENGTH(TRIM(slug)) > 0);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Allow public read authors" ON public.authors;
CREATE POLICY "Allow public read authors" ON public.authors
  FOR SELECT
  USING (true);

-- NOTE: Do NOT add INSERT/UPDATE/DELETE policies. Server/service role bypasses RLS for writes.


