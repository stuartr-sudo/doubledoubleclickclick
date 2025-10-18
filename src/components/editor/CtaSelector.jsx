
import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Share2 } from "lucide-react";
import { CustomContentTemplate } from "@/api/entities"; // This import might become redundant if CustomContentTemplate is only used in TemplateProvider
import CtaTemplateFillModal from "./CtaTemplateFillModal";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useTemplates } from '@/components/providers/TemplateProvider'; // NEW IMPORT

export default function CtaSelector({ isOpen, onClose, onInsert, pageHtml, pageTitle, preferredUsername }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Now reflects loading status of the provider
  // const [ctaTemplates, setCtaTemplates] = useState([]); // REMOVED: Now derived from provider
  const [fillOpen, setFillOpen] = useState(false);
  const [templateToFill, setTemplateToFill] = useState(null);
  const { consumeTokensForFeature } = useTokenConsumption();

  // NEW: Use template provider
  const { templates, loadTemplates, getTemplatesByFeature } = useTemplates();

  // DERIVED: ctaTemplates now comes from the provider and is filtered
  const ctaTemplates = React.useMemo(() => {
    const productOnlyTemplates = getTemplatesByFeature('cta').filter((template) => {
      // Define names to filter out
      const excludedNames = [
        'cta',
        'testimonial',
        'underline effect',
        'high-end & polished'
      ];

      const hasInvalidName = template.name && excludedNames.some(excludedName => 
        template.name.toLowerCase().includes(excludedName)
      );
      return !hasInvalidName;
    });
    return productOnlyTemplates;
  }, [getTemplatesByFeature]); // Depend on getTemplatesByFeature to re-evaluate when templates change


  // REMOVED: Replaced by useEffect below and provider's loadTemplates
  // const loadCtaTemplates = useCallback(async () => {
  //   setIsLoading(true);
  //   try {
  //     const tpls = await CustomContentTemplate.filter({ associated_ai_feature: "cta", is_active: true }).catch(() => []);
  //     const activeTemplates = Array.isArray(tpls) ? tpls : [];
  //     setCtaTemplates(activeTemplates);
  //   } catch (error) {
  //     console.error("Error loading CTA templates:", error);
  //     setCtaTemplates([]); // Ensure state is clear on error
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true); // Set local loading state
      loadTemplates().finally(() => setIsLoading(false)); // Call provider's loadTemplates
    }
  }, [isOpen, loadTemplates]); // Depend on isOpen and loadTemplates from provider

  // Placeholder renderer: replace {{PLACEHOLDER}} (case-insensitive) with provided values
  const renderTemplateHTML = useCallback((tplHtml, data) => {
    if (!tplHtml) return "";

    const val = (k) => {
      const key = String(k || "").toLowerCase();
      if (["button_text", "buttontext", "btn_text", "btntext", "cta_button_text", "cta_button"].includes(key)) {
        return data.button_text || "Learn more";
      }
      if (["button_url", "buttonurl", "btn_url", "btnurl", "url", "link", "href"].includes(key)) {
        return data.button_url || "#";
      }
      if (["headline", "title"].includes(key)) {
        return data.headline || "";
      }
      if (["subtext", "subtitle", "subheadline", "description", "desc"].includes(key)) {
        return data.subtext || "";
      }
      if (["name", "internal_name"].includes(key)) {
        return data.name || "";
      }
      // fallback: also allow direct access by key if present
      return data[key] ?? "";
    };

    // Replace {{TOKEN}} regardless of case/spacing
    const replaced = String(tplHtml).replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/gi, (_, token) => {
      return String(val(token) ?? "");
    });

    return replaced;
  }, []);

  // NEW: open fill modal instead of inserting raw template
  const handleInsertTemplateClick = (template) => {
    setTemplateToFill(template);
    setFillOpen(true);
  };

  const handleFillSubmit = async (values) => {
    if (!templateToFill) return;

    // Check and consume tokens before inserting
    const result = await consumeTokensForFeature('ai_cta_insert');
    if (!result.success) {
      return; // Error toast is handled by the hook
    }

    // Generate unique ID for the CTA
    const ctaId = `cta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Render the template with proper wrapper and padding
    let html = renderTemplateHTML(templateToFill.html_structure || "", values);

    // Ensure proper wrapper with padding and selectable attributes
    if (!html.includes('data-b44-id')) {
      html = `
<div class="b44-cta" data-b44-id="${ctaId}" data-b44-type="cta" style="margin: 2rem 0; padding: 1.5rem; box-sizing: border-box; display: block;">
  ${html}
</div>`.trim();
    }

    onInsert(html);
    setFillOpen(false);
    setTemplateToFill(null);
    onClose();
  };

  // filter templates by search
  const filteredTemplates = (ctaTemplates || []).filter((t) => {
    const s = (searchTerm || "").toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(s) ||
      (t.description || "").toLowerCase().includes(s));

  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white text-slate-900 border border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Share2 className="w-5 h-5 text-blue-600" />
            Select Call to Action Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Search */}
            <div className="relative col-span-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search templates by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500" />

            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-1">
            {isLoading ?
            <div className="text-center py-8 text-slate-500">Loading templates...</div> :
            filteredTemplates.length === 0 ?
            <div className="text-center py-8 text-slate-500">
                <Share2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No CTA templates found. Add them in Assets → Templates (set type to CTA).</p>
              </div> :

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((tpl) => {
                const sampleData = {
                  headline: 'Sample Headline',
                  subtext: 'This is a sample subtext to show how it looks.',
                  button_text: 'Sample Button',
                  button_url: '#',
                  name: tpl.name
                };
                const previewHtml = renderTemplateHTML(tpl.html_structure, sampleData);
                return (
                  <div
                    key={tpl.id}
                    className="border border-slate-200 rounded-lg p-4 bg-white text-slate-900 hover:bg-slate-50 flex flex-col justify-between">

                      <div>
                        <h4 className="font-bold text-lg mb-2">{tpl.name}</h4>
                        <div
                        className="border border-dashed border-slate-300 rounded-md p-4 bg-slate-50/50 mb-3"
                        dangerouslySetInnerHTML={{ __html: previewHtml }} />

                      </div>
                      <div className="flex justify-end items-center mt-3">
                        <Button
                        onClick={() => handleInsertTemplateClick(tpl)}
                        size="sm" className="bg-blue-900 text-white px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md hover:bg-green-700">


                          <Plus className="w-4 h-4 mr-1" />
                          Insert
                        </Button>
                      </div>
                    </div>);

              })}
              </div>
            }
          </div>
        </div>

        {/* Fill form modal */}
        <CtaTemplateFillModal
          isOpen={fillOpen}
          onClose={() => {setFillOpen(false);setTemplateToFill(null);}}
          onInsert={handleFillSubmit}
          selectedTemplate={templateToFill}
          // NEW: context for AI + filtering
          pageHtml={pageHtml}
          pageTitle={pageTitle}
          preferredUsername={preferredUsername} />

      </DialogContent>
    </Dialog>);

}
