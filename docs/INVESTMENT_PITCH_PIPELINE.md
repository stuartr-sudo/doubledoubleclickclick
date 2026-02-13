# Investment Pitch: Full Pipeline Walkthrough

**One-line summary:** From a niche idea, we autonomously build a live blog (brand, domain, infra, deploy), onboard it with products and a full topical map, schedule and write articles via our Flash workflow, and publish to the site’s CMS—with human involvement only to approve brand/domain, buy the domain, add DNS, and add affiliate products.

---

## Part 1: From Niche to Live Site (Fully Autonomous)

**Input:** A niche idea (e.g. “longevity supplements”, “standing desks”, “AI productivity tools”).

**Output:** A live, branded blog with its own domain, database, hosting, and publishing API. No human in the loop except domain purchase and DNS.

| Phase | What Happens | Autonomy |
|-------|--------------|----------|
| **1. Strategic research** | Market size, competition, audience, monetization potential. 8–10 brand names, positioning, voice, color palette, content pillars. Brand image style (for AI-generated visuals). | AI-driven; human approves brand + domain only. |
| **2. Domain** | 10+ domain options with availability/pricing. Human buys chosen domain. | AI suggests; human buys. |
| **3. Code setup** | New GitHub repo, clone of template, 20+ find/replace steps (brand, domain, emails, colors, tagline). Commit and push. | Fully automated. |
| **4. Infrastructure** | Elestio: provision Supabase (~$32/mo). Poll until ready. Run single SQL migration (tables, RLS, storage, default admin). | Fully automated. |
| **5. Deployment** | Vercel project from repo, 5 env vars (Supabase, Resend, site URL), deploy, add custom domain. Human adds DNS records. | Automated except DNS. |
| **6. Verification** | Check homepage, /blog, /admin, API. Confirm no template branding leaked. Generate handoff payload. | Fully automated. |

**Handoff document** (to next stage): brand username, display name, domain, target market, brand blurb, publishing API credentials, seed keywords, brand image style, infra references.

**Human touchpoints:** (1) Approve brand + domain, (2) Buy domain, (3) Add DNS. Everything else is automated.

---

## Part 2: Onboarding the Brand (Fully Autonomous)

**Input:** Handoff from Part 1.

**Output:** Brand fully onboarded with topical map, clusters, and article queue; ready for content production.

| Phase | What Happens | Autonomy |
|-------|--------------|----------|
| **Brand registration** | Create brand in system (username, display name, domain, target market, brand blurb). Store brand image style for visuals. | Fully automated. |
| **Product association** | Attach selected affiliate products to the brand. (Human adds products once; optional ongoing adds.) | Human adds products; system associates. |
| **Keyword expansion** | 10–15 seed keywords → 250–350 keywords via research. | Fully automated. |
| **Topical map** | Build topic taxonomy: pillars, subtopics, question clusters. | Fully automated. |
| **Content clusters** | Map keywords to clusters; define pillar + cluster articles. | Fully automated. |
| **Article selection** | Choose which articles to produce (priority, coverage, commercial intent). | Fully automated. |
| **Scheduling** | Queue articles with deadlines/order for the content pipeline. | Fully automated. |
| **Publishing credentials** | Store blog API URL, categories API, admin URL. Ready for publish step. | From handoff; automated. |

**Human touchpoint:** Adding/curating affiliate products (upfront and optionally later). Rest is autonomous.

---

## Part 3: Content Production & Publish (Fully Autonomous)

**Input:** Scheduled articles (title, cluster, keywords, product context).

**Output:** Published posts on the new site’s CMS.

| Phase | What Happens | Autonomy |
|-------|--------------|----------|
| **Scheduled writing** | Content pipeline picks up scheduled items. Briefs generated from topical map + keywords + products. | Fully automated. |
| **Flash workflow** | Research, draft, edit, fact-check, formatting, SEO. Custom workflow for every article. | Fully automated. |
| **Publish to CMS** | `POST` to `https://www.{domain}/api/blog` with postId, title, content, slug, meta, category, tags. Upsert by postId. | Fully automated. |

**Human touchpoint:** None in steady state. Optional editorial review if desired.

---

## Positioning

**“We turn a niche and a product list into a live, monetized content site and keep it filled with on-strategy, publishable articles—with almost no ongoing human work. The only recurring human input we need is adding and updating affiliate products.”**

---

## Pitch Checklist

- [ ] **Competitive frame:** Who’s closest (agencies, site builders, affiliate networks, AI writers)? One slide: “We’re not X, we’re not Y, we’re the only Z.”
- [ ] **Scale + quality:** Sites live, articles/month; quality (Core Web Vitals, indexing, conversion) and how it’s enforced.
- [ ] **Flash workflow:** Name it; 3–5 steps; custom structure process every article. Optimized for AI GEO and SEO.
- [ ] **Unit economics:** Cost per new site; revenue per site; time to profitability.
- [ ] **Risks and moats:** Platform risk (Google, affiliate TOS), AI dependency; what’s hard to copy (pipeline, handoffs, Flash, template + APIs).
