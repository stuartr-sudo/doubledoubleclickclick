
import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Share2 } from "lucide-react";
import { CustomContentTemplate } from "@/api/entities";
import CtaTemplateFillModal from "./CtaTemplateFillModal";

export default function CtaSelector({ isOpen, onClose, onInsert, pageHtml, pageTitle, preferredUsername }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [ctaTemplates, setCtaTemplates] = useState([]);
  const [fillOpen, setFillOpen] = useState(false);
  const [templateToFill, setTemplateToFill] = useState(null);

  const loadCtaTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const tpls = await CustomContentTemplate.filter({ associated_ai_feature: "cta", is_active: true }).catch(() => []);
      const activeTemplates = Array.isArray(tpls) ? tpls : [];
      setCtaTemplates(activeTemplates);
    } catch (error) {
      console.error("Error loading CTA templates:", error);
      setCtaTemplates([]); // Ensure state is clear on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCtaTemplates();
    }
  }, [isOpen, loadCtaTemplates]);

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

  const handleFillSubmit = (values) => {
    if (!templateToFill) return;
    const html = renderTemplateHTML(templateToFill.html_structure || "", values);
    onInsert(html);
    setFillOpen(false);
    setTemplateToFill(null);
    onClose();
  };

  // filter templates by search
  const filteredTemplates = (ctaTemplates || []).filter(t => {
    const s = (searchTerm || "").toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(s) ||
      (t.description || "").toLowerCase().includes(s)
    );
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
                className="pl-10 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Share2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No CTA templates found. Add them in Assets → Templates (set type to CTA).</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="border border-slate-200 rounded-lg p-4 bg-white text-slate-900 hover:bg-slate-50 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-lg mb-1">{tpl.name}</h4>
                      {tpl.description && (
                        <p className="text-sm text-slate-600 mb-3">{tpl.description}</p>
                      )}
                      <p className="text-xs text-slate-400">Template Type: CTA</p>
                    </div>
                    <div className="flex justify-end items-center mt-3">
                      <Button
                        onClick={() => handleInsertTemplateClick(tpl)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Insert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fill form modal */}
        <CtaTemplateFillModal
          isOpen={fillOpen}
          onCancel={() => { setFillOpen(false); setTemplateToFill(null); }}
          onSubmit={handleFillSubmit}
          template={templateToFill}
          // NEW: context for AI + filtering
          pageHtml={pageHtml}
          pageTitle={pageTitle}
          preferredUsername={preferredUsername}
        />
      </DialogContent>
    </Dialog>
  );
}
