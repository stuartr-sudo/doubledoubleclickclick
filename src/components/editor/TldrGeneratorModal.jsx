
import React, { useState, useEffect, useCallback } from "react";
import { InvokeLLM } from "@/api/integrations";
import { checkAndConsumeTokens } from "@/api/functions";
import { CustomContentTemplate } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, RefreshCw, Copy, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TldrGeneratorModal({
  isOpen,
  onClose,
  selectedText,
  onInsert
}) {
  const [tldr, setTldr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);

  // Template state (simplified: always-visible dropdown)
  const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Build safe preview HTML for a template (or default)
  const DEFAULT_PREVIEW_TEXT = "A short, one‑line key takeaway preview.";
  const sanitizeForPreview = (html) => {
    if (!html) return "";
    // strip script/style tags for safety in previews
    return String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "");
  };

  const buildDefaultTldrHtml = (text, elId) => {
    const inner = `
<div class="b44-tldr" data-b44-id="${elId || "preview"}" data-b44-type="tldr" style="border-left: 4px solid #4f46e5; padding: 1rem; background-color: #f5f3ff; margin: 0.5rem 0; border-radius: 4px;">
  <div class="b44-tldr-icon" style="float: left; margin-right: 0.75rem; font-size: 1.25rem;">💡</div>
  <div class="b44-tldr-content" style="overflow: hidden;">
    <h4 style="margin: 0 0 0.25rem 0; font-weight: 600; color: #3730a3;">TL;DR</h4>
    <p style="margin: 0; color: #434343;">${text}</p>
  </div>
</div>`.trim();
    // WRAP to avoid margin collapse/overflow when embedded as thumbnail
    return `<div class="b44-tldr-preview-wrap" style="margin:0!important;padding:0;overflow:hidden;box-sizing:border-box;max-width:100%;contain: layout paint style;">${inner}</div>`;
  };

  const buildPreviewHtml = (tpl) => {
    if (!tpl) return buildDefaultTldrHtml(DEFAULT_PREVIEW_TEXT, "preview");
    const base = sanitizeForPreview(tpl.html_structure || "");
    const substituted = base
      .replace(/\{\{TITLE\}\}/g, "TL;DR")
      .replace(/\{\{CONTENT\}\}/g, DEFAULT_PREVIEW_TEXT)
      .replace(/\{\{TLDR_TEXT\}\}/g, DEFAULT_PREVIEW_TEXT)
      .replace(/\{\{AI_GENERATED_TEXT\}\}/g, DEFAULT_PREVIEW_TEXT);
    const inner = substituted || buildDefaultTldrHtml(DEFAULT_PREVIEW_TEXT, "preview");
    // Always wrap to prevent overflow from template margins/shadows
    return `<div class="b44-tldr-preview-wrap" style="margin:0!important;padding:0;overflow:hidden;box-sizing:border-box;max-width:100%;contain: layout paint style;">${inner}</div>`;
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const handleGenerateTldr = useCallback(async () => {
    setIsLoading(true);
    setTldr(""); // Clear previous TLDR
    setError(null); // Clear previous error

    try {
      const plainText = stripHtml(selectedText);
      const textToSummarize = (plainText || "").trim();

      if (!textToSummarize) {
        setError("Please select or provide text to summarize.");
        setIsLoading(false);
        return;
      }

      // Consume tokens for TL;DR (Feature key aligned with flags)
      const { data: gate } = await checkAndConsumeTokens({ feature_key: "ai_key_takeaway" });
      if (!gate?.ok) {
        setError(gate?.error || "Insufficient tokens to generate TL;DR. Please check your plan or usage.");
        setIsLoading(false);
        return;
      }

      const maxLength = 8000;
      const truncatedText = textToSummarize.substring(0, maxLength);

      if (!truncatedText.trim()) {
        setTldr("The selected content is empty after cleaning and truncation.");
        setIsLoading(false);
        return;
      }

      const prompt = `Generate a "Too Long; Didn't Read" (TL;DR) summary for the following article content. The summary must be a single, concise paragraph that captures the main points. Output ONLY the plain text summary, without any titles, markdown, or quotation marks.\n\nARTICLE CONTENT:\n"""\n${truncatedText}\n"""`;

      const result = await InvokeLLM({ prompt });

      const cleanedResult = result ? result.trim().replace(/^"|"$/g, '') : "";

      setTldr(cleanedResult || "Could not generate a summary. Please try again.");
    } catch (e) {
      console.error("TLDR generation error:", e);
      setError(e?.message || "Sorry, an error occurred while generating the summary. Please try again.");
      setTldr(""); // Clear TLDR on error
    } finally {
      setIsLoading(false);
    }
  }, [selectedText]);

  // Load custom templates (TLDR feature)
  const loadCustomTemplates = useCallback(async () => {
    try {
      const templates = await CustomContentTemplate.filter({
        associated_ai_feature: "tldr",
        is_active: true
      });
      setCustomTemplates(templates || []);
      // don't auto-select; user chooses explicitly
    } catch (error) {
      console.error("Error loading custom templates:", error);
    }
  }, []); // Dependencies updated

  useEffect(() => {
    if (isOpen && selectedText) {
      handleGenerateTldr();
    }
  }, [isOpen, selectedText, handleGenerateTldr]);

  useEffect(() => {
    if (isOpen) {
      loadCustomTemplates();
    }
  }, [isOpen, loadCustomTemplates]);

  // Apply selected template
  const applyCustomTemplate = (tldrContent) => {
    if (!selectedTemplate) {
      // This should ideally not be called if no template is selected,
      // but as a fallback, return the content directly.
      return tldrContent;
    }

    let htmlStructure = selectedTemplate.html_structure || "";

    // Replace common placeholders
    htmlStructure = htmlStructure
      .replace(/\{\{TITLE\}\}/g, "TL;DR")
      .replace(/\{\{CONTENT\}\}/g, tldrContent)
      .replace(/\{\{TLDR_TEXT\}\}/g, tldrContent)
      .replace(/\{\{AI_GENERATED_TEXT\}\}/g, tldrContent);

    return htmlStructure;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tldr);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentPreviewHtml = buildPreviewHtml(selectedTemplate);

  const handleInsertTldr = () => {
    if (!tldr) return;

    const cleanedTldrContent = tldr.replace(/<[^>]*>?/gm, ''); // Remove HTML tags from the summary content itself
    const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; // Generate a unique ID

    let htmlToInsert;

    if (selectedTemplate) {
      // Use custom template
      htmlToInsert = applyCustomTemplate(cleanedTldrContent);
    } else {
      // Use existing default template, updated with data attributes and some styling.
      htmlToInsert = `
<div class="b44-tldr" data-b44-id="${elId}" data-b44-type="tldr" style="border-left: 4px solid #4f46e5; padding: 1rem; background-color: #f5f3ff; margin: 1.5rem 0; border-radius: 4px;">
  <div class="b44-tldr-icon" style="float: left; margin-right: 0.75rem; font-size: 1.5rem;">💡</div>
  <div class="b44-tldr-content" style="overflow: hidden;">
    <h4 style="margin-top: 0; margin-bottom: 0.5rem; font-weight: bold; color: #3730a3;">TL;DR</h4>
    <p style="margin-bottom: 0; color: #434343;">${cleanedTldrContent}</p>
  </div>
</div>`.trim();
    }

    onInsert(htmlToInsert);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setTldr("");
    setIsCopied(false);
    setError(null); // Clear error on close
    setSelectedTemplate(null); // Reset selected template
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      {/* CHANGED: switch to brand black-on-white */}
      <DialogContent className="max-w-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl">
        <DialogHeader>
          {/* CHANGED: titles/descriptions use dark text */}
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Wand2 className="w-5 h-5 text-slate-800" />
            TL;DR Generator
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Generate a TL;DR summary from your selected text: "{selectedText?.substring(0, 100)}{selectedText?.length > 100 ? "..." : ""}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* CHANGED: template label + Select colors */}
          {customTemplates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="tldr-template" className="text-slate-700 text-sm">Template (optional)</Label>
              <Select
                // FIX: never pass empty string to Select value. Use 'none' sentinel.
                value={selectedTemplate?.id ?? "none"}
                onValueChange={(value) => {
                  if (value === "none") { setSelectedTemplate(null); return; }
                  const tpl = customTemplates.find(t => t.id === value) || null;
                  setSelectedTemplate(tpl);
                }}
              >
                <SelectTrigger id="tldr-template" className="bg-white border-slate-300 text-slate-900 overflow-hidden"> {/* ADDED overflow-hidden */}
                  <SelectValue placeholder="Default style (no template)" />
                </SelectTrigger>

                {/* UPDATED: fixed width, scrollable */}
                <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-2xl max-h-[60vh] overflow-y-auto w-[560px]">
                  {/* Default (no template) row */}
                  {/* FIX: SelectItem must not use empty string value */}
                  <SelectItem key="none" value="none" className="hover:bg-slate-50 focus:bg-slate-50 py-2">
                    {/* Two-column, aligned row */}
                    <div className="grid grid-cols-[1fr_180px] items-center gap-4 w-full min-h-[64px]">
                      <span className="truncate">Default style (no template)</span>
                      {/* INLINE, FIXED thumbnail that clips internal margins */}
                      <div className="justify-self-end w-[180px] h-[64px] rounded border border-slate-200 overflow-hidden bg-white shrink-0 relative">
                        <div
                          style={{
                            position: "relative",
                            width: "166%",
                            height: "166%",
                            transform: "scale(0.6)",
                            transformOrigin: "top left",
                            padding: 8,
                            display: "inline-block",
                            pointerEvents: "none", // prevent clicks inside preview HTML
                            overflow: "hidden", // Added for overflow prevention
                            contain: "layout paint style" // Added for overflow prevention
                          }}
                          dangerouslySetInnerHTML={{ __html: buildPreviewHtml(null) }}
                        />
                      </div>
                    </div>
                  </SelectItem>

                  {/* Template rows */}
                  {customTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id} className="hover:bg-slate-50 focus:bg-slate-50 py-2">
                      <div className="grid grid-cols-[1fr_180px] items-center gap-4 w-full min-h-[64px]">
                        <span className="truncate">{template.name}</span>
                        {/* INLINE, FIXED thumbnail that clips internal margins */}
                        <div className="justify-self-end w-[180px] h-[64px] rounded border border-slate-200 overflow-hidden bg-white shrink-0 relative">
                          <div
                            style={{
                              position: "relative",
                              width: "166%",
                              height: "166%",
                              transform: "scale(0.6)",
                              transformOrigin: "top left",
                              padding: 8,
                              display: "inline-block",
                              pointerEvents: "none",
                              overflow: "hidden", // Added for overflow prevention
                              contain: "layout paint style" // Added for overflow prevention
                            }}
                            dangerouslySetInnerHTML={{ __html: buildPreviewHtml(template) }}
                          />
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-xs text-slate-600">{selectedTemplate.description || "Custom TL;DR template selected."}</p>
              )}

              {/* Selected template larger preview with extra clipping */}
              <div className="space-y-1">
                <Label className="text-slate-700 text-sm">Preview</Label>
                <div className="w-full h-28 rounded-md border border-slate-200 overflow-hidden bg-white">
                  <div
                    className="origin-top-left"
                    style={{
                      transform: "scale(0.8)",
                      transformOrigin: "top left",
                      width: "125%",
                      height: "125%",
                      padding: 10,
                      overflow: "hidden", // Added for overflow prevention
                      contain: "layout paint style" // Added for overflow prevention
                    }}
                    dangerouslySetInnerHTML={{ __html: currentPreviewHtml }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* CHANGED: loading + error colors */}
          {isLoading &&
            <div className="flex flex-col items-center justify-center text-center text-slate-800 p-8">
              <RefreshCw className="w-8 h-8 mr-2 animate-spin text-slate-700 mb-4" />
              <p>The AI is reading and summarizing...</p>
              <p className="text-sm text-slate-500">This may take a moment.</p>
            </div>
          }

          {error && <div className="text-red-600 text-center py-4">{error}</div>}

          {!isLoading && tldr &&
            <div>
              <h4 className="font-medium mb-2 text-slate-900">Generated Summary:</h4>
              <div className="relative">
                <Textarea
                  value={tldr}
                  onChange={(e) => setTldr(e.target.value)}
                  rows={5}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          }

          {/* CHANGED: buttons to brand styling */}
          {!isLoading &&
            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                onClick={handleGenerateTldr}
                className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button
                onClick={handleInsertTldr}
                disabled={!tldr || !!error || tldr.includes("Could not generate") || tldr.includes("error occurred") || tldr.includes("empty after cleaning")}
                className="bg-slate-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-full hover:bg-black"
              >
                Insert TL;DR
              </Button>
            </div>
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}
