-- Add editable fields for quiz lead capture sections on homepage
alter table public.homepage_content
  add column if not exists quiz_form_title text default 'Want More SEO Traffic?',
  add column if not exists quiz_form_description text default 'Answer 5 quick questions and I will give you a step-by-step 7-week action plan showing you exactly what you need to do to get more traffic.',
  add column if not exists quiz_form_placeholder text default 'What is the URL of your website?',
  add column if not exists quiz_form_cta_text text default 'NEXT',
  add column if not exists quiz_form_cta_link text default '/quiz';

comment on column public.homepage_content.quiz_form_title is 'Headline used for the inline quiz CTA sections.';
comment on column public.homepage_content.quiz_form_description is 'Description text for the inline quiz CTA sections.';
comment on column public.homepage_content.quiz_form_placeholder is 'Input placeholder for the inline quiz CTA sections.';
comment on column public.homepage_content.quiz_form_cta_text is 'Button text for the inline quiz CTA sections.';
comment on column public.homepage_content.quiz_form_cta_link is 'Button link for the inline quiz CTA sections.';

