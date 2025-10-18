
import React, { useState, useEffect, useCallback } from "react";
import { InvokeLLM } from "@/api/integrations";
// Removed checkAndConsumeTokens, as it's replaced by useTokenConsumption
import { CustomContentTemplate } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Textarea is no longer used
import { Wand2, RefreshCw } from "lucide-react"; // Copy and Check are no longer used
import { Label } from "@/components/ui/label";
// Select components are no longer used
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useTemplates } from '@/components/providers/TemplateProvider';

export default function TldrGeneratorModal({
  isOpen,
  onClose,
  selectedText,
  onInsert
}) {
  // generatedContent and isCopied states are no longer needed as content is inserted directly
  // const [generatedContent, setGeneratedContent] = useState("");
  // const [isCopied, setIsCopied] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Template state (simplified: always-visible dropdown)
  // const [customTemplates, setCustomTemplates] = useState([]); // Removed, now from provider
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { consumeTokensForFeature } = useTokenConsumption(); // Initialize the hook
  const { templates, loadTemplates, getTemplatesByFeature } = useTemplates();

  const customTemplates = React.useMemo(() => {
    return getTemplatesByFeature('tldr');
  }, [getTemplatesByFeature]);

  // Build safe preview HTML for a template (or default)
  const DEFAULT_PREVIEW_TEXT = "A short, one‑line key takeaway preview.";
  const sanitizeForPreview = (html) => {
    if (!html) return "";
    // strip script/style tags for safety in previews
    return String(html).
    replace(/<script[\s\S]*?<\/script>/gi, "").
    replace(/<style[\s\S]*?<\/style>/gi, "");
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
    const substituted = base.
    replace(/\{\{TITLE\}\}/g, "TL;DR").
    replace(/\{\{CONTENT\}\}/g, DEFAULT_PREVIEW_TEXT).
    replace(/\{\{TLDR_TEXT\}\}/g, DEFAULT_PREVIEW_TEXT).
    replace(/\{\{AI_GENERATED_TEXT\}\}/g, DEFAULT_PREVIEW_TEXT);
    const inner = substituted || buildDefaultTldrHtml(DEFAULT_PREVIEW_TEXT, "preview");
    // Always wrap to prevent overflow from template margins/shadows
    return `<div class="b44-tldr-preview-wrap" style="margin:0!important;padding:0;overflow:hidden;box-sizing:border-box;max-width:100%;contain: layout paint style;">${inner}</div>`;
  };

  // handleInsertTldr is removed as its logic is integrated into handleGenerate

  const handleCloseModal = useCallback(() => {
    // setGeneratedContent(""); // No longer needed
    // setIsCopied(false); // No longer needed
    setError(null); // Clear error on close
    setSelectedTemplate(null); // Reset selected template
    onClose();
  }, [onClose]);

  const handleGenerate = useCallback(async () => {
    if (!selectedText?.trim()) {
      setError("No content provided to summarize");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Check tokens before making the API call
      const tokenResult = await consumeTokensForFeature('ai_key_takeaway');
      if (!tokenResult.success) {
        setIsGenerating(false);
        setError(tokenResult.error || "Insufficient tokens to generate TL;DR. Please check your plan or usage.");
        return;
      }

      const prompt = `Create a compelling TL;DR (Too Long; Didn't Read) summary for the following content.

Content to summarize:
${selectedText}

Requirements:
- The summary must be a maximum of two sentences.
- It should be concise, engaging, and capture the most important key takeaways.
- Use clear and direct language.`;

      const result = await InvokeLLM({ prompt });
      const generatedContent = result || "";

      if (!generatedContent.trim()) {
        setError("No content was generated. Please try again.");
        setIsGenerating(false);
        return;
      }

      // Generate HTML and insert directly
      const cleanedGeneratedContent = generatedContent.replace(/<[^>]*>?/gm, '');
      const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      let htmlToInsert;
      if (selectedTemplate) {
        // Use custom template
        // Replace common placeholders with cleaned AI generated content
        let htmlStructure = selectedTemplate.html_structure || "";
        htmlStructure = htmlStructure.
        replace(/\{\{TITLE\}\}/g, "TL;DR").
        replace(/\{\{CONTENT\}\}/g, cleanedGeneratedContent).
        replace(/\{\{TLDR_TEXT\}\}/g, cleanedGeneratedContent).
        replace(/\{\{AI_GENERATED_TEXT\}\}/g, cleanedGeneratedContent);
        htmlToInsert = htmlStructure;
      } else {
        // Use existing default template, updated with data attributes and some styling.
        htmlToInsert = `
<div class="b44-tldr" data-b44-id="${elId}" data-b44-type="tldr" style="border-left: 4px solid #4f46e5; padding: 1rem; background-color: #f5f3ff; margin: 1.5rem 0; border-radius: 4px;">
  <div class="b44-tldr-icon" style="float: left; margin-right: 0.75rem; font-size: 1.5rem;">💡</div>
  <div class="b44-tldr-content" style="overflow: hidden;">
    <h4 style="margin-top: 0; margin-bottom: 0.5rem; font-weight: bold; color: #3730a3;">TL;DR</h4>
    <p style="margin-bottom: 0; color: #434343;">${cleanedGeneratedContent}</p>
  </div>
</div>`.trim();
      }

      // Insert directly and close modal
      onInsert(htmlToInsert);
      handleCloseModal();
    } catch (err) {
      console.error("TL;DR generation error:", err);
      setError("Failed to generate TL;DR. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedText, consumeTokensForFeature, selectedTemplate, onInsert, handleCloseModal]);

  // Load custom templates (TLDR feature)
  // Replaced by useTemplates hook
  // const loadCustomTemplates = useCallback(async () => {
  //   try {
  //     const templates = await CustomContentTemplate.filter({
  //       associated_ai_feature: "tldr",
  //       is_active: true
  //     });
  //     setCustomTemplates(templates || []);
  //     // don't auto-select; user chooses explicitly
  //   } catch (error) {
  //     console.error("Error loading custom templates:", error);
  //   }
  // }, []);

  useEffect(() => {
    if (isOpen) {
      loadTemplates(); // Load from cache
    }
  }, [isOpen, loadTemplates]);

  // handleCopy is removed as content is no longer displayed for copying
  // const handleCopy = async () => {
  //   await navigator.clipboard.writeText(generatedContent);
  //   setIsCopied(true);
  //   setTimeout(() => setIsCopied(false), 2000);
  // };

  const currentPreviewHtml = buildPreviewHtml(selectedTemplate);

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-4xl bg-white border border-slate-200 text-slate-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Wand2 className="w-5 h-5 text-slate-800" />
            TL;DR Generator
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Generate a TL;DR summary from your selected text: "{selectedText?.substring(0, 100)}{selectedText?.length > 100 ? "..." : ""}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {customTemplates.length > 0 &&
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
              {/* Left Column: Template Selection */}
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm">Template (optional)</Label>
                <div className="border border-slate-200 rounded-md bg-slate-50 max-h-48 overflow-y-auto">
                  {/* Default Option */}
                  <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 ${
                  !selectedTemplate ? 'bg-blue-50 border-blue-200' : ''}`
                  }>

                    <div className="font-medium text-slate-900">Default style (no template)</div>
                    <div className="text-xs text-slate-500 mt-1">Simple built-in TL;DR style</div>
                  </button>
                  
                  {/* Custom Templates */}
                  {customTemplates.map((template) =>
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-b-0 ${
                  selectedTemplate?.id === template.id ? 'bg-blue-50 border-blue-200' : ''}`
                  }>

                      <div className="text-slate-700 font-light">{template.name}</div>
                      {template.description &&
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</div>
                  }
                    </button>
                )}
                </div>
              </div>

              {/* Right Column: Preview */}
              <div className="space-y-1">
                <Label className="text-slate-700 text-sm">Preview</Label>
                <div className="w-full h-48 rounded-md border border-slate-200 overflow-hidden bg-white">
                  <div
                  className="origin-top-left"
                  style={{
                    transform: "scale(0.8)",
                    transformOrigin: "top left",
                    width: "125%",
                    height: "125%",
                    padding: 10,
                    overflow: "hidden",
                    contain: "layout paint style"
                  }}
                  dangerouslySetInnerHTML={{ __html: currentPreviewHtml }} />

                </div>
              </div>
            </div>
          }

          {isGenerating &&
          <div className="flex flex-col items-center justify-center text-center text-slate-800 p-8">
              <RefreshCw className="w-8 h-8 mr-2 animate-spin text-slate-700 mb-4" />
              <p>The AI is reading and summarizing...</p>
              <p className="text-sm text-slate-500">This may take a moment.</p>
            </div>
          }

          {error && <div className="text-red-600 text-center py-4">{error}</div>}

          {!isGenerating &&
          <div className="flex gap-4 mt-4">
              <Button
              onClick={handleGenerate}
              disabled={!selectedText?.trim()}
              className="bg-slate-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-full hover:bg-black">

                <Wand2 className="w-4 h-4 mr-2" />
                Generate & Insert TL;DR
              </Button>
            </div>
          }
        </div>
      </DialogContent>
    </Dialog>);

}
