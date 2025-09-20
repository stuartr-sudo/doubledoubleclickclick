
/*
  Generates a self-contained, scoped HTML accordion for FAQs that can be inserted into the editor.
  Usage:
    import { buildFaqAccordionHtml } from "@/components/editor/FaqAccordionBlock";
    const html = buildFaqAccordionHtml(faqs, { title: "FAQs", openFirst: true, includeJsonLd: true });
*/
export function buildFaqAccordionHtml(faqs = [], options = {}) {
  const { title = "Frequently Asked Questions", openFirst = true, includeJsonLd = true } = options || {};
  if (!Array.isArray(faqs) || faqs.length === 0) return "";

  const scope = `faq-${Math.random().toString(36).slice(2, 8)}`;
  const blockId = `faqblk-${scope}`;

  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Build the accordion items (CSS-only toggle via checkbox)
  const itemsHtml = faqs
    .slice(0, 10) // safety cap
    .map((f, i) => {
      const q = escapeHtml(f?.question || "");
      const a = escapeHtml(f?.answer || "");
      if (!q || !a) return "";
      const inputId = `${scope}-item-${i + 1}`;
      const checked = openFirst && i === 0 ? " checked" : "";
      return `
<div class="${scope}-item">
  <input id="${inputId}" type="checkbox" class="${scope}-toggle"${checked} aria-controls="${inputId}-content" aria-expanded="${checked ? "true" : "false"}" />
  <div class="${scope}-trigger" role="button" aria-labelledby="${inputId}-q">
    <div class="${scope}-q" id="${inputId}-q" contenteditable="true">${q}</div>
    <label class="${scope}-chev" for="${inputId}" aria-label="Toggle FAQ"></label>
    <!-- Large right-side overlay for easy toggling without blocking text editing -->
    <label class="${scope}-overlay" for="${inputId}" aria-hidden="true"></label>
  </div>
  <div id="${inputId}-content" class="${scope}-content" role="region" aria-labelledby="${inputId}-q">
    <p contenteditable="true">${a.replace(/\n/g, "<br />")}</p>
  </div>
</div>`.trim();
    })
    .join("\n");

  // Optional JSON-LD for FAQPage
  const jsonLd = includeJsonLd
    ? `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs
          .filter((f) => f?.question && f?.answer)
          .slice(0, 10)
          .map((f) => ({
            "@type": "Question",
            name: String(f.question),
            acceptedAnswer: { "@type": "Answer", text: String(f.answer) },
          })),
      })}</script>`
    : "";

  // Scoped styles: strong contrast, bigger hit area, smooth max-height transition, visible selection outline
  const styleBlock = `
<style>
/* Scope */
.${scope}-wrap { margin: 16px 0; }
.${scope}-title {
  font-weight: 800; font-size: 1.05rem;
  color: #0a0a0a;
  background: #f4f6f8;
  border: 1px solid rgba(0,0,0,.2);
  border-bottom: none;
  padding: 10px 14px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.${scope}-container {
  border: 1px solid rgba(0,0,0,.2);
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(0,0,0,.06);
}

/* Selection outlines (respond to multiple selection markers) */
.${scope}-wrap[data-b44-selected],
.${scope}-wrap[data-selected],
.${scope}-wrap.b44-selected,
.${scope}-wrap:focus,
.${scope}-wrap:focus-within {
  box-shadow: 0 0 0 2px #2563eb, 0 0 0 4px rgba(37, 99, 235, 0.25);
  border-radius: 12px;
}

/* Items */
.${scope}-item { border-top: 1px solid rgba(0,0,0,.12); }
.${scope}-item:first-child { border-top: none; }

/* Toggle (visually hidden but keyboard-focusable) */
.${scope}-toggle {
  position: absolute;
  left: -9999px; top: auto; width: 1px; height: 1px;
  opacity: 0;
}

/* Give a visible focus proxy on the chevron when the checkbox is focused */
.${scope}-toggle:focus ~ .${scope}-trigger .${scope}-chev {
  box-shadow: 0 0 0 2px #111 inset, 0 0 0 2px #111;
  border-radius: 6px;
}

/* Trigger row */
.${scope}-trigger {
  position: relative;
  display: flex; align-items: center; gap: 12px; justify-content: space-between;
  padding: 14px 16px;
  background: #ffffff;
  color: #0b0b0b;
}
.${scope}-q { flex: 1; font-weight: 700; outline: none; }
.${scope}-q:focus { box-shadow: inset 0 -2px 0 #111; }

/* Chevron toggle (label targets checkbox) */
.${scope}-chev {
  width: 28px; height: 28px; flex: 0 0 28px;
  position: relative; cursor: pointer; border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
}
.${scope}-chev::before, .${scope}-chev::after {
  content: ""; position: absolute; width: 14px; height: 2px; background: #111111;
  transition: transform .2s ease, opacity .2s ease, background-color .2s ease;
}
.${scope}-chev::before { transform: rotate(0deg); }
.${scope}-chev::after { transform: rotate(90deg); }

/* Large right-side toggle overlay (doesn't cover the editable text) */
.${scope}-overlay {
  position: absolute; top: 0; right: 0; bottom: 0; left: 62%;
  cursor: pointer;
}

/* Content (concertina with smooth animation) */
.${scope}-content {
  max-height: 0;
  overflow: hidden;
  padding: 0 16px;
  color: #111111; line-height: 1.7; font-size: 0.98rem;
  background: #ffffff;
  transition: max-height .25s ease, padding-top .2s ease, padding-bottom .2s ease;
}
.${scope}-content p { margin: 0; outline: none; }

/* Hover */
.${scope}-item:hover .${scope}-trigger { background: #f8f8f8; }

/* Open state */
.${scope}-toggle:checked ~ .${scope}-trigger .${scope}-chev::after { transform: rotate(0deg); opacity: 0; }
.${scope}-toggle:checked ~ .${scope}-content {
  max-height: 1000px;
  padding-top: 12px;
  padding-bottom: 16px;
}
</style>`.trim();

  return `
<section class="${scope}-wrap" role="region" aria-label="${escapeHtml(title)}" data-b44-type="faq" data-b44-id="${blockId}" tabindex="0">
  ${styleBlock}
  <div class="${scope}-title">${escapeHtml(title)}</div>
  <div class="${scope}-container">
    ${itemsHtml}
  </div>
  ${jsonLd}
</section>`.trim();
}

export default { buildFaqAccordionHtml };
