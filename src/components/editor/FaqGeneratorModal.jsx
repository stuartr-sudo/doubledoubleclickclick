
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2 } from "lucide-react";
import { CustomContentTemplate } from "@/api/entities";
import { generateArticleFaqs } from "@/api/functions"; // Keep this import for original purpose, even if no longer used as fallback
import { InvokeLLM } from "@/api/integrations";
import { ContentEndpoint } from "@/api/entities";
import { callFaqEndpoint } from "@/api/functions";

// Basic HTML-safe replacer for text nodes
const escapeHtml = (s) =>
  String(s ?? "").
    replace(/&/g, "&amp;").
    replace(/</g, "&lt;").
    replace(/>/g, "&gt;");

function renderFaqWithTemplate(template, faqs, { title = "Frequently Asked Questions", openFirst = true, includeJsonLd = true } = {}) {
  const itemTpl = String(template?.html_structure || "");
  const itemsHtml = faqs.
    map((f, idx) => {
      const checked = openFirst && idx === 0 ? "checked" : "";
      // Support multiple placeholder variants for robustness
      let html = itemTpl.
        replace(/\{\{\s*QUESTION\s*\}\}/g, escapeHtml(f.question || "")).
        replace(/\{\{\s*ANSWER\s*\}\}/g, escapeHtml(f.answer || "").replace(/\n/g, "<br />")).
        replace(/\{\{\s*(ITEM_)?INDEX\s*\}\}/g, String(idx)).
        replace(/\{\{\s*OPEN_FIRST_CHECKED_ATTRIBUTE\s*\}\}/g, checked);
      return html;
    }).
    join("\n");

  const jsonLd = includeJsonLd ?
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.
        filter((f) => f?.question && f?.answer).
        map((f) => ({
          "@type": "Question",
          name: String(f.question),
          acceptedAnswer: { "@type": "Answer", text: String(f.answer) }
        }))
    })}</script>` :
    "";

  // Wrapper is minimal; the template controls item markup
  return `
<section class="b44-faq-block" role="region" aria-label="${escapeHtml(title)}" data-b44-type="faq">
  <h3 style="margin:0 0 10px 0;font-weight:800;">${escapeHtml(title)}</h3>
  <div class="b44-faq-list">
    ${itemsHtml}
  </div>
  ${jsonLd}
</section>`.trim();
}

function renderDefaultAccordion(faqs, { title = "Frequently Asked Questions", openFirst = true, includeJsonLd = true } = {}) {
  // A compact, dependency-free default (reuses same placeholders as our internal builder)
  const scope = `faq-${Math.random().toString(36).slice(2, 8)}`;
  const items = faqs.
    map((f, i) => {
      const checked = openFirst && i === 0 ? " checked" : "";
      return `
<div class="${scope}-item">
  <input id="${scope}-i-${i}" type="checkbox"${checked} class="${scope}-toggle" />
  <div class="${scope}-trigger">
    <div class="${scope}-q">${escapeHtml(f.question || "")}</div>
    <label class="${scope}-chev" for="${scope}-i-${i}" aria-label="Toggle FAQ"></label>
  </div>
  <div class="${scope}-content"><p>${escapeHtml(f.answer || "").replace(/\n/g, "<br />")}</p></div>
</div>`.trim();
    }).
    join("\n");

  const style = `
<style>
.${scope}-wrap { margin: 16px 0; }
.${scope}-title { font-weight:800; margin-bottom:8px; }
.${scope}-item { border:1px solid #e5e7eb; border-radius:10px; margin-bottom:8px; overflow:hidden; background:#fff; }
.${scope}-toggle { position:absolute; left:-9999px; opacity:0; }
.${scope}-trigger { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; cursor:pointer; background:#fff; }
.${scope}-q { font-weight:700; }
.${scope}-chev { width:20px; height:20px; position:relative; cursor:pointer; }
.${scope}-chev::before, .${scope}-chev::after { content:""; position:absolute; top:9px; left:3px; width:14px; height:2px; background:#111; }
.${scope}-chev::after { transform:rotate(90deg); transition:transform .2s ease, opacity .2s ease; }
.${scope}-content { max-height:0; overflow:hidden; padding:0 14px; transition:max-height .25s ease, padding .2s ease; }
.${scope}-toggle:checked ~ .${scope}-trigger .${scope}-chev::after { transform:rotate(0deg); opacity:0; }
.${scope}-toggle:checked ~ .${scope}-content { max-height:600px; padding:8px 14px 12px; }
</style>`.trim();

  const jsonLd = includeJsonLd ?
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.
        filter((f) => f?.question && f?.answer).
        map((f) => ({
          "@type": "Question",
          name: String(f.question),
          acceptedAnswer: { "@type": "Answer", text: String(f.answer) }
        }))
    })}</script>` :
    "";

  return `
<section class="${scope}-wrap" data-b44-type="faq">
  ${style}
  <div class="${scope}-title">${escapeHtml(title)}</div>
  ${items}
  ${jsonLd}
</section>`.trim();
}

export default function FaqGeneratorModal({ isOpen, onClose, selectedText, onInsert }) {
  const [loading, setLoading] = React.useState(false);
  const [templates, setTemplates] = React.useState([]);
  const [templateId, setTemplateId] = React.useState("default");
  const [title, setTitle] = React.useState("Frequently Asked Questions");
  const [openFirst, setOpenFirst] = React.useState(true);
  const [includeJsonLd, setIncludeJsonLd] = React.useState(true);
  const [previewHtml, setPreviewHtml] = React.useState("");
  const [templateWarning, setTemplateWarning] = React.useState("");

  // HIDDEN: selected endpoint from admin page (no UI exposed)
  const [selectedEndpointId, setSelectedEndpointId] = React.useState("");

  // NEW: helper to grab full editor HTML if selection is small/empty
  const getEditorHtml = React.useCallback(() => {
    try {
      const quill = document.querySelector(".ql-editor");
      if (quill?.innerHTML) return quill.innerHTML;
      const ce = document.querySelector('[contenteditable="true"]');
      if (ce?.innerHTML) return ce.innerHTML;
    } catch {}
    return "";
  }, []);

  // NEW: small utility to strip tags for LLM prompts
  const toPlain = (html = "") =>
    String(html).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim();

  // Add a tiny validator to ensure templates are single-item blueprints, not full sections with many items
  // and auto-fallback to the default template if invalid.
  const isItemTemplate = React.useCallback((html) => {
    const s = String(html || "");
    const qCount = (s.match(/\{\{\s*QUESTION\s*\}\}/g) || []).length;
    const aCount = (s.match(/\{\{\s*ANSWER\s*\}\}/g) || []).length;
    // If template hardcodes multiple concrete items (faq-item-0, faq-item-1...), it's a full section
    const hardcodedMulti = (s.match(/faq-item-\d+/gi) || []).length > 1;
    // We expect exactly one QUESTION and one ANSWER placeholder in an item template
    return qCount === 1 && aCount === 1 && !hardcodedMulti;
  }, []);

  const getTemplate = React.useCallback(() => {
    if (templateId === "default") {
      setTemplateWarning("");
      return null;
    }
    const tpl = templates.find((t) => t.id === templateId) || null;
    if (!tpl) {
      setTemplateWarning("");
      return null;
    }
    if (!isItemTemplate(tpl.html_structure)) {
      setTemplateWarning(
        "Selected template appears to contain a full multi-item section. Using the Default item template instead. Please provide a single-item blueprint with {{QUESTION}}, {{ANSWER}}, and optional {{ITEM_INDEX}}."
      );
      return null; // fall back to default renderer
    }
    setTemplateWarning("");
    return tpl;
  }, [templateId, templates, isItemTemplate]);

  // Load templates and auto-pick active FAQ endpoint (hidden)
  React.useEffect(() => {
    if (!isOpen) return;
    (async () => {
      // Load templates
      const listTemplates = await CustomContentTemplate.filter({ associated_ai_feature: "faq", is_active: true });
      setTemplates(listTemplates || []);

      // Load FAQ-capable endpoints (active and marked/name/notes contains 'faq')
      const listEndpoints = await ContentEndpoint.list("-updated_date").catch(() => []);
      const faqLikeEndpoints = (listEndpoints || []).filter((e) => {
        const n = (e.name || "").toLowerCase();
        const notes = (e.notes || "").toLowerCase();
        return e.is_active !== false && (n.includes("faq") || notes.includes("faq"));
      });

      if (faqLikeEndpoints.length > 0) {
        // pick the most recently updated active FAQ endpoint
        setSelectedEndpointId(faqLikeEndpoints[0].id);
      } else {
        setSelectedEndpointId("");
      }
    })();
  }, [isOpen]);

  const doGenerate = async () => {
    setLoading(true);
    setTemplateWarning(""); // Clear previous warnings
    setPreviewHtml(""); // Clear previous preview

    try {
      // Require an admin-configured endpoint
      if (!selectedEndpointId) {
        setTemplateWarning("No active FAQ endpoint is configured. Ask an admin to add one in Admin → FAQ Endpoints.");
        return;
      }

      // Prefer selection if substantial; otherwise, use full editor HTML
      const selection = (selectedText || "").trim();
      const selectionIsRichEnough = selection.length > 120;
      const articleHtml = selectionIsRichEnough ? selection : (getEditorHtml() || selection);

      // Call the configured endpoint and only format returned FAQs
      const { data } = await callFaqEndpoint({
        endpoint_id: selectedEndpointId,
        html: articleHtml,
        selected_html: selectionIsRichEnough ? selection : ""
      });

      const faqs = Array.isArray(data?.faqs) ? data.faqs : [];
      if (!faqs.length) {
        setTemplateWarning("The FAQ endpoint returned no FAQs. Please verify your endpoint logic in Admin → FAQ Endpoints.");
        return;
      }

      // Render via template (with validation fallback)
      const tpl = getTemplate();
      const html = tpl
        ? renderFaqWithTemplate(tpl, faqs, { title, openFirst, includeJsonLd })
        : renderDefaultAccordion(faqs, { title, openFirst, includeJsonLd }); // Fixed typo here

      setPreviewHtml(html);
    } finally {
      setLoading(false);
    }
  };

  // AI-generate section title from article content
  const aiWriteTitle = async () => {
    setLoading(true);
    try {
      const baseHtml = getEditorHtml() || selectedText || "";
      const text = toPlain(baseHtml).slice(0, 6000);
      const res = await InvokeLLM({
        add_context_from_internet: false,
        prompt: `Write a concise, specific FAQ section title for the article below.
Rules:
- 2–6 words
- Mention the main topic
- No emojis, quotes, or punctuation at the end
Return JSON: { "title": string }

Article: """${text}"""`,
        response_json_schema: {
          type: "object",
          properties: { title: { type: "string" } },
          required: ["title"]
        }
      });
      if (res?.title) setTitle(res.title.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!previewHtml) return;
    onInsert(previewHtml);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Generate FAQs</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dynamic Template */}
          <div>
            <Label className="text-slate-700">Dynamic Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="bg-slate-50 mt-1 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Accordion)</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name || `Template ${t.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              Manage templates in Assets → Templates. Only active FAQ templates are listed.
            </p>
          </div>

          <div className="flex items-end justify-start gap-6">
            <label className="flex items-center gap-2 mt-6 text-sm">
              <input
                type="checkbox"
                checked={openFirst}
                onChange={(e) => setOpenFirst(e.target.checked)}
              />
              Open first
            </label>
            <label className="flex items-center gap-2 mt-6 text-sm">
              <input
                type="checkbox"
                checked={includeJsonLd}
                onChange={(e) => setIncludeJsonLd(e.target.checked)}
              />
              Include JSON‑LD
            </label>
          </div>

          <div className="md:col-span-2 -mt-2">
            <p className="text-xs text-slate-500">
              JSON‑LD adds hidden structured data so search engines understand your FAQs and may show rich results in Google.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label className="text-slate-700">Section Title</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
              {/* NEW: AI Write button */}
              <Button
                type="button"
                variant="outline"
                onClick={aiWriteTitle}
                disabled={loading}
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 gap-2"
                title="AI Write title from article content"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Write
              </Button>
            </div>
          </div>
        </div>

        {templateWarning && (
            <p className="text-sm text-amber-600 mt-4">{templateWarning}</p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={doGenerate} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Generating…" : "Generate"}
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!previewHtml}
            className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            title={previewHtml ? "Insert this FAQ section into the article" : "Generate a preview first to enable Insert"}
          >
            Insert
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="max-h-80 overflow-auto border rounded-lg p-3 bg-slate-50">
          {previewHtml ? (
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <p className="text-sm text-slate-500">Preview will appear here after generation.</p>
          )}
        </div>
      </div>
    </div>
  );
}
