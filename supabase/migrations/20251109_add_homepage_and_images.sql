-- Create homepage_content table
CREATE TABLE IF NOT EXISTS public.homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title text,
  hero_description text,
  hero_image text,
  hero_cta_text text,
  hero_cta_link text,
  about_title text,
  about_description text,
  services_title text,
  services jsonb DEFAULT '[]'::jsonb,
  contact_email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.homepage_content
  FOR SELECT
  USING (true);

-- Allow authenticated insert/update (you can add auth later)
CREATE POLICY "Allow all insert" ON public.homepage_content
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update" ON public.homepage_content
  FOR UPDATE
  USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images');

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images');

