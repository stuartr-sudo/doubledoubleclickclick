-- Run this in modernlongevity.io Supabase: SQL Editor → New query → paste → Run
-- Adds columns needed for the seed script (about section, blog grid title, hero background image).

ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS about_title text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS about_description text;
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS blog_grid_title text DEFAULT 'Latest Articles';
ALTER TABLE public.homepage_content ADD COLUMN IF NOT EXISTS hero_background_image text;
