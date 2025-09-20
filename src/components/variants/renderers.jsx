
export function renderCta(styleKey, cta) {
  const h = (s) => (s || "");
  const headline = h(cta && cta.headline);
  const sub = h(cta && cta.subtext);
  const btnText = h(cta && cta.button_text) || "Learn More";
  const btnUrl = h(cta && cta.button_url) || "#";

  const scope = `nbw-${Math.random().toString(36).slice(2, 8)}`;
  const wrapperId = `cta-${Math.random().toString(36).slice(2,8)}`;
  const css = `
<style>
.${scope} * { box-sizing: border-box; }
.${scope} .cta-wrap { background:#000; color:#fff; border:1px solid #fff; padding:28px; text-align:center; }
.${scope} .cta-title { font-size:1.4rem; font-weight:700; text-shadow:0 0 10px rgba(255,255,255,.6); margin:0 0 8px 0; }
.${scope} .cta-sub { color:rgba(255,255,255,.8); margin:0 0 16px 0; }

/* Solid Glow */
.${scope} .cta-solid-glow { background:#fff;color:#000;padding:12px 35px;border:none;font-size:16px;font-weight:700;cursor:pointer;transition:all .3s ease;text-transform:uppercase;letter-spacing:1px;box-shadow:0 0 20px rgba(255,255,255,.5);display:inline-block;text-decoration:none }
.${scope} .cta-solid-glow:hover { background:#000;color:#fff;border:2px solid #fff;box-shadow:0 0 30px rgba(255,255,255,.8), inset 0 0 15px rgba(255,255,255,.1) }

/* Neon Outline */
.${scope} .cta-neon-outline { background:transparent;color:#fff;padding:12px 35px;border:2px solid #fff;font-size:16px;font-weight:700;cursor:pointer;transition:all .25s ease;text-transform:uppercase;letter-spacing:1px;display:inline-block;text-decoration:none;box-shadow:0 0 14px rgba(255,255,255,.4) inset, 0 0 12px rgba(255,255,255,.25) }
.${scope} .cta-neon-outline:hover { background:#fff;color:#000;box-shadow:0 0 22px rgba(255,255,255,.8) }

/* Double Neon */
.${scope} .cta-double-wrap { position:relative; }
.${scope} .cta-double-wrap::before { content:'';position:absolute;inset:6px;border:1px solid rgba(255,255,255,.3);pointer-events:none; }
.${scope} .cta-double-neon { background:#fff;color:#000;padding:12px 35px;border:none;font-size:16px;font-weight:700;cursor:pointer;transition:all .25s ease;text-transform:uppercase;letter-spacing:1px;display:inline-block;text-decoration:none;box-shadow:0 0 26px rgba(255,255,255,.65) }
.${scope} .cta-double-neon:hover { background:#000;color:#fff;border:2px solid #fff;box-shadow:0 0 34px rgba(255,255,255,.9) }
.b44-cta-block{display:block;margin:16px 0; outline: 0px solid transparent;}
</style>`.trim();

  const key = (styleKey || "cta-solid-glow").toLowerCase();

  let wrapClass = "cta-wrap";
  let btnClass = "cta-solid-glow";
  if (key.includes("neon-outline")) {
    btnClass = "cta-neon-outline";
  } else if (key.includes("double")) {
    wrapClass = "cta-wrap cta-double-wrap";
    btnClass = "cta-double-neon";
  }

  return `
<div class="b44-cta-block" data-b44-type="cta" data-b44-id="${wrapperId}">
  <div class="${scope}">
    ${css}
    <section class="${wrapClass}">
      <div class="cta-title">${headline}</div>
      ${sub ? `<div class="cta-sub">${sub}</div>` : ``}
      <a href="${btnUrl}" target="_blank" rel="noopener noreferrer" class="${btnClass}">${btnText}</a>
    </section>
  </div>
</div>`.trim();
}

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 240;
function clampText(s, max) {
  if (!s) return "";
  const t = String(s).trim();
  return t.length <= max ? t : t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

export function renderProduct(styleKey, p) {
  const esc = (s) => (s || "").toString().replace(/"/g, "&quot;");
  const rawName = p && p.name;
  const rawDesc = p && p.description;
  const nameLimited = clampText(rawName, TITLE_LIMIT);
  const descLimited = clampText(rawDesc, DESCRIPTION_LIMIT);
  const name = esc(nameLimited);
  const description = (descLimited ? String(descLimited) : "");
  const imageUrl = esc(p && p.image_url);
  const productUrl = esc((p && (p.button_url || p.product_url)) || "#"); // UPDATED: prefer button_url
  const price = esc(p && p.price || "");

  const scope = `nbw-${Math.random().toString(36).slice(2, 8)}`;
  const css = `
<style>
.${scope} * { box-sizing: border-box; }
.${scope} .card { background:#000;border:2px solid #fff;overflow:hidden;box-shadow:0 0 20px rgba(255,255,255,.3);display:flex;margin:18px 0;transition:all .3s ease; max-width:100%; }
.${scope} .card:hover { box-shadow:0 0 40px rgba(255,255,255,.6), inset 0 0 20px rgba(255,255,255,.1); }
.${scope} .card .img { flex:0 0 300px;background:#111;position:relative;overflow:hidden;height:260px; }
.${scope} .card .img img { width:100%;height:100%;object-fit:cover;filter:grayscale(100%) contrast(1.2);transition:filter .3s ease; display:block; max-width:100%; }
.${scope} .card:hover .img img { filter:grayscale(100%) contrast(1.4) brightness(1.1); }
.${scope} .card .body { flex:1;padding:28px;display:flex;flex-direction:column;justify-content:center; }
.${scope} .card h3 { font-size:1.6rem;margin:0 0 10px 0;color:#fff;text-shadow:0 0 15px rgba(255,255,255,.8); }
.${scope} .card .price { font-size:1.35rem;font-weight:700;color:#fff;margin:0 0 12px 0;text-shadow:0 0 20px rgba(255,255,255,1); }
.${scope} .card p { color:rgba(255,255,255,.8);margin:0 0 18px 0; }
.${scope} .btn { background:#fff;color:#000;padding:12px 28px;border:none;font-size:15px;font-weight:700;cursor:pointer;transition:all .3s ease;text-transform:uppercase;letter-spacing:1px;box-shadow:0 0 20px rgba(255,255,255,.5);display:inline-block;text-decoration:none; }
.${scope} .btn:hover { background:#000;color:#fff;border:2px solid #fff;box-shadow:0 0 30px rgba(255,255,255,.8), inset 0 0 15px rgba(255,255,255,.1); }

/* Inverted card */
.${scope} .card-inv { background:#fff;border:3px solid #000;display:flex;box-shadow:none; max-width:100%; }
.${scope} .card-inv .img { flex:0 0 280px;background:#f5f5f5;border-right:3px solid #000; position:relative; overflow:hidden; height:240px; }
.${scope} .card-inv .img img { filter:grayscale(100%) contrast(1.1); width:100%; height:100%; object-fit:cover; display:block; max-width:100%; }
.${scope} .card-inv .badge { position:absolute;top:20px;left:20px;background:#000;color:#fff;padding:6px 14px;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;box-shadow:0 0 10px rgba(0,0,0,.5); }
.${scope} .card-inv .body { background:#fff; }
.${scope} .card-inv h3 { color:#000; }
.${scope} .card-inv .price { color:#000;text-shadow:none; }

/* Double border card */
.${scope} .card-dbl { background:#000;border:1px solid #fff;position:relative;display:flex; max-width:100%; }
.${scope} .card-dbl::before { content:'';position:absolute;top:4px;left:4px;right:-4px;bottom:-4px;border:1px solid rgba(255,255,255,.3);z-index:-1;transition:all .3s ease; }
.${scope} .card-dbl:hover::before { top:8px;left:8px;right:-8px;bottom:-8px;border-color:rgba(255,255,255,.6); }
.${scope} .card-dbl .img { flex:0 0 320px;background:#000;position:relative; overflow:hidden; height:260px; }
.${scope} .card-dbl .img img { filter:grayscale(100%);opacity:.85; width:100%; height:100%; object-fit:cover; display:block; max-width:100%; }
.${scope} .card-dbl .discount { position:absolute;top:20px;right:20px;background:#fff;color:#000;padding:10px 18px;font-weight:700;box-shadow:0 0 20px rgba(255,255,255,.8); }
.${scope} .card-dbl .body { padding:32px; }
.${scope} .card-dbl .sub { color:rgba(255,255,255,.6);font-size:.85rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0; }

/* Responsive: stack and reduce image height on small screens */
@media (max-width:768px){
  .${scope} .card{flex-direction:column;}
  .${scope} .card .img{flex:1;height:200px;width:100%;}
  .${scope} .card-inv .img{height:200px;}
  .${scope} .card-dbl .img{height:200px;}
}
</style>`.trim();

  // Normalize style keys: map any existing keys to our three neon cards
  const key = (styleKey || "").toLowerCase();
  const variant =
    key.includes("inverted") || key.includes("side-by-side") || key.includes("minimal") ? "inv" :
    key.includes("double") || key.includes("banner") || key.includes("glass") ? "dbl" :
    "neon"; // default (also for 'gradient'/'featured'/'default')

  if (variant === "inv") {
    return `
<div class="b44-promoted-product" data-b44-type="product" style="margin:16px 0;">
  <div class="${scope}">
    ${css}
    <div class="card-inv card">
      <div class="img">
        ${imageUrl ? `<img src="${imageUrl}" alt="${name}" />` : ``}
        <span class="badge">Featured</span>
      </div>
      <div class="body">
        <h3>${name}</h3>
        ${price ? `<div class="price">${price}</div>` : ``}
        ${description ? `<p>${description.replace(/\n/g, "<br>")}</p>` : ``}
        <a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="btn">View Details</a>
      </div>
    </div>
  </div>
</div>`.trim();
  }

  if (variant === "dbl") {
    return `
<div class="b44-promoted-product" data-b44-type="product" style="margin:16px 0;">
  <div class="${scope}">
    ${css}
    <div class="card-dbl card">
      <div class="img">
        ${imageUrl ? `<img src="${imageUrl}" alt="${name}" />` : ``}
        <div class="discount">Special</div>
      </div>
      <div class="body">
        <h3>${name}</h3>
        <div class="sub">Premium Pick</div>
        ${price ? `<div class="price">${price}</div>` : ``}
        ${description ? `<p>${description.replace(/\n/g, "<br>")}</p>` : ``}
        <a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="btn">Buy Now</a>
      </div>
    </div>
  </div>
</div>`.trim();
  }

  // default neon
  return `
<div class="b44-promoted-product" data-b44-type="product" style="margin:16px 0;">
  <div class="${scope}">
    ${css}
    <div class="card">
      <div class="img">
        ${imageUrl ? `<img src="${imageUrl}" alt="${name}" />` : ``}
      </div>
      <div class="body">
        <h3>${name}</h3>
        ${price ? `<div class="price">${price}</div>` : ``}
        ${description ? `<p>${description.replace(/\n/g, "<br>")}</p>` : ``}
        <a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="btn">Add to Cart</a>
      </div>
    </div>
  </div>
</div>`.trim();
}

export function renderTestimonial(styleKey, t) {
  const esc = (s) => (s || "").toString().replace(/"/g, "&quot;");
  const title = esc(t && t.review_title);
  const author = esc(t && t.review_author);
  const date = esc(t && t.review_date || "");
  const comment = (t && t.review_comment ? String(t.review_comment) : "").replace(/\n/g, "<br/>");
  const rating = Number((t && t.review_star_rating) || 0);
  return `
<blockquote style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:12px 0;background:#ffffff;">
  <div style="font-weight:600;color:#0f172a;margin-bottom:6px;">${title}</div>
  <div style="color:#374151;line-height:1.6;">${comment}</div>
  <div style="color:#6b7280;font-size:12px;margin-top:6px;">${"★".repeat(Math.round(rating))}${"☆".repeat(5-Math.round(rating))} — ${author}${date ? ` • ${date}` : ""}</div>
</blockquote>`.trim();
}

export function styleCatalog() {
  return {
    cta: [
      { key: "cta-solid-glow", label: "CTA • Solid Glow" },
      { key: "cta-neon-outline", label: "CTA • Neon Outline" },
      { key: "cta-double-neon", label: "CTA • Double Neon" }
    ],
    product: [
      { key: "product-neon", label: "Product • Neon Glow" },
      { key: "product-inverted", label: "Product • Inverted" },
      { key: "product-double", label: "Product • Double Border" }
    ],
    testimonial: [
      { key: "testimonial-compact", label: "Testimonial • Compact" }
    ]
  };
}

export function renderByType(type, styleKey, source) {
  if (type === "cta") return renderCta(styleKey, source);
  if (type === "product") return renderProduct(styleKey, source);
  return renderTestimonial(styleKey, source);
}
