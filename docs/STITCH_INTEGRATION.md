# Stitch integration for seed-homepage

Use **Stitch** for AI-generated **static images** (hero, logo, about, etc.) when seeding the homepage. Stitch also provides video (Jumpstart) and other endpoints; seed-homepage uses **Imagineer** only.

---

## Base URL and auth

| Env var | Default | Description |
|---------|---------|-------------|
| `STITCH_URL` | `http://localhost:3003` | Stitch server (per Stitch Video API doc). Use 4390 if your instance runs there. |
| `STITCH_API_TOKEN` | `stitch_dev_token_2024` | Bearer token. Production: set via Stitch’s `STITCH_API_TOKEN`. |

**Headers for every request:**

```
Authorization: Bearer <STITCH_API_TOKEN>
Content-Type: application/json
```

---

## Imagineer: image generation (async)

Image generation is **asynchronous**. You must:

1. Call **`POST {STITCH_URL}/api/imagineer/generate`** to start generation → returns `requestId`.
2. Poll **`POST {STITCH_URL}/api/imagineer/result`** with `{ "requestId": "..." }` until `status: "completed"` (then use `imageUrl`).

### Start generation

**Endpoint:** `POST {STITCH_URL}/api/imagineer/generate`

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Text description of the image. |
| `style` | string | No | Style preset (see below). |
| `dimensions` | string | No | Aspect ratio, e.g. `16:9`, `9:16`, `1:1`. |

**Example:**

```json
{
  "prompt": "A calm wellness scene: soft greens and cream, supplement bottles on a minimal shelf, natural light",
  "style": "instagram-candid",
  "dimensions": "16:9"
}
```

**Response (async):**

```json
{
  "success": true,
  "requestId": "717c53a23def49a38936cf9d956519ed",
  "status": "created",
  "pollEndpoint": "/api/imagineer/result",
  "message": "Image generation started. Poll /api/imagineer/result with requestId to check status."
}
```

### Poll for result

**Endpoint:** `POST {STITCH_URL}/api/imagineer/result`

**Request:** `{ "requestId": "717c53a23def49a38936cf9d956519ed" }`

**Response (processing):** `{ "success": true, "status": "processing", "requestId": "...", "imageUrl": null }`

**Response (completed):** `{ "success": true, "status": "completed", "requestId": "...", "imageUrl": "https://storage.wavespeed.ai/outputs/..." }`

**Response (failed):** `{ "success": false, "status": "failed", "error": "..." }`

- **Poll interval:** 2–3 seconds (per Stitch doc).
- Use the returned `imageUrl` in `homepage_content` (e.g. `hero_image`, `logo_image`).

**Available styles (from Stitch doc):**

- `iphone-selfie` – Raw iPhone aesthetic  
- `ugc-testimonial` – Authentic testimonial shot  
- `tiktok-style` – TikTok photo aesthetic  
- `instagram-candid` – Lifestyle photography  
- `facetime-screenshot` – Video call quality  
- `mirror-selfie` – Mirror selfie  
- `car-selfie` – Car selfie  
- `gym-selfie` – Fitness photo  
- `golden-hour-selfie` – Warm sunset lighting  
- `casual-snapshot` – Candid moment  

---

## Homepage image slots and mapping

Seed-homepage should request one image per slot and map the result into `homepage_content`:

| homepage_content field | Slot | Suggested dimensions | Prompt / style hint |
|-------------------------|------|----------------------|----------------------|
| `hero_image` | hero | 16:9 | Hero visual for the brand/niche; use `imageStyle` from handoff. |
| `hero_background_image` | hero_background | 16:9 or 21:9 | Background, can be more abstract or gradient-like. |
| `logo_image` | logo | 1:1 | Logo or wordmark-style image; square. |
| (about section image, if present) | about | 4:3 or 1:1 | About / team / story visual. |

Build the **prompt** for each slot from the handoff’s `brandImageStyle` (visualStyle, colorPalette, mood, composition, lighting) plus the slot name. Example for hero:

- “Editorial wellness style, clean and modern, soft natural lighting, warm neutrals and soft teal, [niche] theme, no clinical imagery.”

Choose **style** from the list above (e.g. `instagram-candid` for lifestyle, `casual-snapshot` for candid).

---

## Flow from seed-homepage route

1. Generate **text** for `homepage_content` via LLM (hero_title, hero_description, about_title, etc.).
2. For each image slot (hero, hero_background, logo, about):
   - Build `prompt` from `imageStyle` + slot.
   - `POST {STITCH_URL}/api/imagineer/generate` with `{ prompt, style, dimensions }` → get `requestId`.
   - Poll `POST {STITCH_URL}/api/imagineer/result` with `{ requestId }` every 2–3s until `status: "completed"`, then read `imageUrl`.
   - Add `imageUrl` to payload (e.g. `hero_image`, `hero_background_image`, `logo_image`).
3. Merge text payload + image URLs.
4. Update `homepage_content` (e.g. via existing Supabase client / `POST /api/homepage` or direct DB update).

The script **`scripts/seed-modernlongevity-homepage.js`** implements this flow (generate → poll result → extract `imageUrl`).

---

## Stitch doc reference

The full Stitch API (video Jumpstart, edit, extend, Imagineer, restyle, image edit, health) is in the **Stitch Video API - External Integration Guide**. This file documents the part needed for seed-homepage: **Imagineer** (async image generation) and how it maps to homepage slots.
