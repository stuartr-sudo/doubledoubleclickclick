
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, Wand2, Check } from "lucide-react";
import { CustomContentTemplate } from "@/api/entities";
import { generateArticleFaqs } from "@/api/functions"; // Keep this import for original purpose, even if no longer used as fallback
import { InvokeLLM } from "@/api/integrations";
import { ContentEndpoint } from "@/api/entities";
import { callFaqEndpoint } from "@/api/functions";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
// import { agentSDK } from "@/agents"; // TODO: Replace with Supabase conversation management
import { useTemplates } from '@/components/providers/TemplateProvider';

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
        replace(/\{\{\s*ANSWER\s*\}\}/g, escapeHtml(f.answer || "")). // Removed .replace(/\n/g, "<br />")
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
  <div class="${scope}-content"><p>${escapeHtml(f.answer || "")}</p></div>
</div>`.trim(); // Removed .replace(/\n/g, "<br />")
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null); // Used for general errors and warnings
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("default");
  const [title, setTitle] = useState("Frequently Asked Questions");
  const [examplePreviewHtml, setExamplePreviewHtml] = useState("");

  // HIDDEN: selected endpoint from admin page (no UI exposed)
  const [selectedEndpointId, setSelectedEndpointId] = useState("");

  const { consumeTokensForFeature } = useTokenConsumption();
  const { templates, loadTemplates, getTemplatesByFeature } = useTemplates();

  const customTemplates = React.useMemo(() => {
    return getTemplatesByFeature('faq');
  }, [getTemplatesByFeature]);

  // NEW: single-flight token to prevent race conditions
  const runRef = React.useRef(0);

  // TODO: Replace agentSDK functionality with Supabase conversation management
  const waitForAgentResponse = async (conversationId, timeoutSec = 120) => {
    throw new Error("FAQ agent functionality is temporarily disabled during migration.");
  };

  // TODO: Replace agentSDK functionality with Supabase conversation management
  const callFaqAgent = async (html, selection = "") => {
    throw new Error("FAQ agent functionality is temporarily disabled during migration.");
  };

  // NEW: extract the FAQ section from the agent's full HTML (so we only insert the block)
  const extractFaqSection = (fullHtml) => {
    if (!fullHtml) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, "text/html");
      const faq = doc.querySelector(".b44-faq, [data-b44-type='faq']");
      if (!faq) return null;
      let html = faq.outerHTML || null;
      if (!html) return null;
      // ensure data-b44-type attribute for drag/drop/select
      if (!/data-b44-type\s*=\s*["']faq["']/.test(html)) {
        html = html.replace(/<section\b/i, '<section data-b44-type="faq"');
      }
      return html;
    } catch {
      // fallback regex if DOMParser fails
      const m = String(fullHtml).match(/<section[^>]*class=["'][^"']*b44-faq[^"']*["'][\s\S]*?<\/section>/i);
      if (m) {
        let block = m[0];
        if (!/data-b44-type\s*=\s*["']faq["']/.test(block)) {
          block = block.replace(/<section\b/i, '<section data-b44-type="faq"');
        }
        return block;
      }
      return null;
    }
  };

  // NEW: helper to grab full editor HTML if selection is small/empty
  const getEditorHtml = useCallback(() => {
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
  const isItemTemplate = useCallback((html) => {
    const s = String(html || "");
    const qCount = (s.match(/\{\{\s*QUESTION\s*\}\}/g) || []).length;
    const aCount = (s.match(/\{\{\s*ANSWER\s*\}\}/g) || []).length;
    // If template hardcodes multiple concrete items (faq-item-0, faq-item-1...), it's a full section
    const hardcodedMulti = (s.match(/faq-item-\d+/gi) || []).length > 1;
    // We expect exactly one QUESTION and one ANSWER placeholder in an item template
    return qCount === 1 && aCount === 1 && !hardcodedMulti;
  }, []);

  const getTemplate = useCallback(() => {
    if (selectedTemplateKey === "default") {
      setError(null); // Clear specific template warnings if default is selected
      return null;
    }
    const tpl = customTemplates.find((t) => t.id === selectedTemplateKey) || null;
    if (!tpl) {
      setError(null);
      return null;
    }
    if (!isItemTemplate(tpl.html_structure)) {
      setError(
        "Selected template appears to contain a full multi-item section. Using the Default item template instead. Please provide a single-item blueprint with {{QUESTION}}, {{ANSWER}}, and optional {{ITEM_INDEX}}."
      );
      return null; // fall back to default renderer
    }
    setError(null);
    return tpl;
  }, [selectedTemplateKey, customTemplates, isItemTemplate]);

  const loadEndpoint = useCallback(async () => {
    try {
      const listEndpoints = await ContentEndpoint.list("-updated_date").catch(() => []);
      const faqLikeEndpoints = (listEndpoints || []).filter((e) => {
        const n = (e.name || "").toLowerCase();
        const notes = (e.notes || "").toLowerCase();
        return e.is_active !== false && (n.includes("faq") || notes.includes("faq"));
      });

      if (faqLikeEndpoints.length > 0) {
        setSelectedEndpointId(faqLikeEndpoints[0].id);
      } else {
        setSelectedEndpointId("");
      }
    } catch (err) {
      console.error("Error loading endpoints:", err);
    }
  }, []);

  // Load templates and auto-pick active FAQ endpoint (hidden)
  useEffect(() => {
    if (isOpen) {
      loadTemplates(); // Load from cache
      loadEndpoint();
    }
  }, [isOpen, loadTemplates, loadEndpoint]);
  
  // Update example preview when template changes
  useEffect(() => {
      if (!isOpen) return;
      const sampleFaqs = [
          { question: "What are the main benefits of this product?", answer: "This product offers three key benefits: improved efficiency, cost savings, and better user experience." },
          { question: "How long does shipping typically take?", answer: "Standard shipping takes 3-5 business days, while express shipping arrives in 1-2 business days." },
          { question: "Is there a money-back guarantee?", answer: "Yes, we offer a 30-day money-back guarantee if you're not completely satisfied with your purchase." }
      ];

      const tpl = getTemplate();
      const html = tpl
          ? renderFaqWithTemplate(tpl, sampleFaqs, { title: "Example FAQs", openFirst: true, includeJsonLd: false })
          : renderDefaultAccordion(sampleFaqs, { title: "Example FAQs", openFirst: true, includeJsonLd: false });

      setExamplePreviewHtml(html);
  }, [selectedTemplateKey, customTemplates, isOpen, getTemplate]);


  const handleGenerateFaqs = async () => {
    setIsGenerating(true);
    setError(null); // Clear previous errors/warnings

    // single-flight guard
    const myRun = ++runRef.current;

    try {
      const tokenResult = await consumeTokensForFeature('ai_faq');
      if (!tokenResult.success) {
        setError(tokenResult.message || "Failed to consume tokens for FAQ generation.");
        setIsGenerating(false);
        return;
      }

      const selection = (selectedText || "").trim();
      const selectionIsRichEnough = selection.length > 120;
      const articleHtml = selectionIsRichEnough ? selection : (getEditorHtml() || selection);

      // Attempt 1: First, use the same AGENT as Flash uses (faq_agent)
      try {
        const agentHtml = await callFaqAgent(articleHtml, selectionIsRichEnough ? selection : "");
        // If another run started, ignore this result
        if (myRun !== runRef.current) return;

        const faqSection = extractFaqSection(agentHtml);
        if (faqSection) {
          onInsert(faqSection);
          onClose();
          setIsGenerating(false);
          return; // Agent call successful, done here.
        }
        // If agent returned full HTML but we couldn't extract a valid section,
        // it means the agent's output was not in the expected format, so we fall through to legacy.
        // Or if the agent failed, the catch block will lead to fallback.
      } catch (agentErr) {
        // console.warn("FAQ agent failed, falling back:", agentErr); // Silent fallback to legacy methods
        // No need to set an error here, as we are attempting fallbacks.
      }

      // Attempt 2: Legacy flows (endpoint -> InvokeLLM) as fallback ONLY
      let faqs = [];
      if (selectedEndpointId) {
        const { data } = await callFaqEndpoint({
          endpoint_id: selectedEndpointId,
          html: articleHtml,
          selected_html: selectionIsRichEnough ? selection : "",
        });
        faqs = Array.isArray(data?.faqs) ? data.faqs : [];
        if (!faqs.length) {
          setError("The configured FAQ endpoint returned no FAQs. Please verify the endpoint logic.");
          // No return here, fall through to default LLM if endpoint yields nothing
        }
      } 
      
      // Attempt 3: If no endpoint provided FAQs, or none configured, fallback to default InvokeLLM
      if (!faqs.length) {
        const baseText = toPlain(articleHtml);
        const prompt = `Based on the following article content, generate 3 to 5 relevant Frequently Asked Questions (FAQs).

Rules:
- Questions should be questions an average reader might have.
- Answers should be concise, directly sourcing information from the article.
- Do NOT invent information. If an answer isn't in the text, don't create the FAQ.
- Output ONLY a valid JSON object with a single key "faqs" which is an array of objects, each with "question" and "answer" string properties. Do not add any other text or markdown.

Example: { "faqs": [{ "question": "What is the main topic?", "answer": "The main topic is..." }] }

Article Content:
"""
${baseText.slice(0, 12000)}
"""`;

        const response = await InvokeLLM({
          prompt: prompt,
          response_json_schema: {
            type: "object",
            properties: {
              faqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                },
              },
            },
            required: ["faqs"],
          },
        });
        
        faqs = response?.faqs || [];
        if (!faqs.length) {
          setError("The default AI model did not return any FAQs. Please try again.");
          setIsGenerating(false);
          return; // If all fallbacks failed, exit
        }
      }

      // If we reached here, we have FAQs (either from endpoint or InvokeLLM)
      // Sanitize the answers to remove extra spacing and newlines.
      const sanitizedFaqs = faqs.map(faq => ({
          ...faq,
          question: (faq.question || '').trim(),
          answer: (faq.answer || '').trim().replace(/[\s\r\n]+/g, ' ')
      }));

      // Render via template (with validation fallback)
      const tpl = getTemplate(); // getTemplate will also manage any template-specific errors
      let html = tpl
        ? renderFaqWithTemplate(tpl, sanitizedFaqs, { title, openFirst: true, includeJsonLd: true })
        : renderDefaultAccordion(sanitizedFaqs, { title, openFirst: true, includeJsonLd: true });

      // Guarantee draggable/selectable marker for fallback methods
      const withMarker = html.includes('data-b44-type=') ? html : html.replace(/<section\b/, '<section data-b44-type="faq"');

      // Insert directly and close modal
      onInsert(withMarker);
      onClose();
    } catch (e) {
        setError(`An error occurred: ${e.message}`);
    } finally {
      // ensure this run finishes; future runs won't be blocked
      if (myRun === runRef.current) {
        setIsGenerating(false);
      }
    }
  };

  // AI-generate section title from article content
  const aiWriteTitle = async () => {
    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  };

  // handleInsert function removed as content is inserted directly on generation

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Generate FAQs</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Controls */}
              <div className="space-y-6">
                
                <div className="space-y-2">
                  <Label className="text-slate-700">Dynamic Template</Label>
                   <div className="border border-slate-200 rounded-md bg-slate-50 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedTemplateKey("default")}
                      className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 ${
                        selectedTemplateKey === 'default' ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-slate-900">Default (Accordion)</div>
                      <div className="text-xs text-slate-500 mt-1">Simple, clean, built-in style.</div>
                    </button>
                    {customTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplateKey(t.id)}
                        className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-b-0 ${
                          selectedTemplateKey === t.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-slate-900">{t.name || `Template ${t.id}`}</div>
                        {t.description && <div className="text-xs text-slate-500 mt-1">{t.description}</div>}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Manage templates in Assets → Templates. Only active FAQ templates are listed.
                  </p>
                </div>

                <div>
                  <Label className="text-slate-700">Section Title</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={aiWriteTitle}
                      disabled={isGenerating}
                      className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 gap-2"
                      title="AI Write title from article content"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      AI Write
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleGenerateFaqs} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    {isGenerating ? "Generating..." : "Generate & Insert FAQs"}
                  </Button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              {/* Right Column: Preview Example */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-4">
                <div className="text-xs font-semibold text-slate-500 mb-3 text-center">TEMPLATE PREVIEW</div>
                <div className="overflow-y-auto max-h-80">
                  <div dangerouslySetInnerHTML={{ __html: examplePreviewHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
