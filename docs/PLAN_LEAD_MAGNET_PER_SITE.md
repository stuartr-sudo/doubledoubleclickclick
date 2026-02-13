# Plan: Lead magnet per site (later)

**Status:** Planned for after template and modernlongevity basic blog homepage are done.

## Goal

- Each site (e.g. Modern Longevity, future clones) has a **brand-specific CTA** that acts as an opt-in (e.g. lead magnet), not a generic “Apply to Work With Us”.
- Homepage hero button and nav/menu CTA already use **hero_cta_text** and **hero_cta_link** from the homepage API, so the CTA *label* and *destination* are already per-site.
- What’s missing is a **lead magnet asset** per site: a concrete offer (e.g. PDF, email course, checklist) and a way to capture emails before granting access.

## Current state

- **Hero CTA:** Uses `hero_cta_text` and `hero_cta_link` from `homepage_content`.
- **Nav/menu CTA:** Same; both header and mobile menu use these values.
- **Lead magnet:** No dedicated field or flow. CTA can point to `/blog`, a signup page, or an external link.

## Proposed (when implementing)

1. **Data**
   - Optional `lead_magnet_title`, `lead_magnet_description`, `lead_magnet_asset_url` (e.g. PDF) on `homepage_content` (or a small `lead_magnets` table keyed by site).
   - Optional `lead_magnet_form_slug` or `lead_magnet_page_path` so the CTA can go to a dedicated “get the guide” page.

2. **Flow**
   - CTA (hero + nav) continues to use `hero_cta_text` / `hero_cta_link`.
   - For “opt-in” sites: set `hero_cta_link` to a signup/landing page that collects email and then delivers or links to the lead magnet (e.g. PDF, course).
   - That landing page can be:
     - A Next.js route (e.g. `/lead-magnet`, `/guide`) that renders a form and, on submit, sends the asset link or triggers an email delivery (e.g. via Resend, ConvertKit, or Supabase Edge Function).

3. **Backend**
   - No change required for “CTA only” usage: keep using `hero_cta_text` and `hero_cta_link`.
   - When adding lead magnets: add columns or a table for title, description, asset URL, and optionally form/page path; optionally an Edge Function or API route to send the asset or add contact to a list.

4. **Order of work**
   - Finish basic blog template and modernlongevity rollout.
   - Then: add optional lead magnet fields and one reference implementation (e.g. Modern Longevity “Get the guide” → `/guide` → form → PDF or email).

## References

- Homepage CTA: `SiteHeader`, `MobileMenu`, hero in `HomePageClient` (all use `heroCTAText` / `heroCTALink` from `homepage_content`).
- Handoff: `docs/MODERNLONGEVITY_ONBOARD_HANDOFF.md`.
