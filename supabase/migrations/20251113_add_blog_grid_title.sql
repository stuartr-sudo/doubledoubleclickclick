-- Add title for homepage blog grid section
alter table public.homepage_content
  add column if not exists blog_grid_title text default 'Latest from the blog';

comment on column public.homepage_content.blog_grid_title is 'Heading displayed above the homepage blog grid.';

