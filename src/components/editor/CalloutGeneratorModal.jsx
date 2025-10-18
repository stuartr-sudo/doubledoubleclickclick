
import React, { useState, useEffect, useCallback } from "react";
import { InvokeLLM } from "@/api/integrations";
import { interestingFact } from "@/api/functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, RefreshCw, Edit, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { CustomContentTemplate } from "@/api/entities"; // This import is now technically not directly used for fetching, but the type might be. Keeping it for now.
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemplates } from '@/components/providers/TemplateProvider';


// Enhance generated HTML for "fact" type; mention Perplexity when available.
// Assume props: type ("callout" | "fact"), onInsert(html)
const buildFactHtml = (text, sourceUrl) => {
  const safe = (text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // FIX: use encodeURI for href so the link stays clickable, not encodeURIComponent
  const safeHref = sourceUrl ? encodeURI(sourceUrl) : '';
  const src = sourceUrl ? `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;text-decoration:none;">Source</a>` : '';
  return `
<div class="b44-fact-card" style="border-radius:14px; border:1px solid rgba(96,165,250,.25); padding:16px 18px; background: linear-gradient(180deg, rgba(30,58,138,.07), rgba(2,6,23,.02)); box-shadow: 0 6px 22px rgba(2,6,23,.25); margin: 1rem 0;">
  <div style="display:flex; align-items:flex-start; gap:12px;">
    <div style="width:28px; height:28px; border-radius:8px; background: radial-gradient(circle at 30% 30%, #93c5fd, #60a5fa); display:flex; align-items:center; justify-content:center; color:#0b1220; font-weight:700;">i</div>
    <div style="flex:1; color:#0f172a;">
      <div style="font-weight:700; letter-spacing: .02em; color:#0b1220; margin-bottom:6px;">Interesting Fact</div>
      <div style="color:#111827; line-height:1.6;">${safe}${src ? ` — ${src}` : ''}</div>
      <div style="margin-top:8px; font-size:12px; color:#64748b;">via Perplexity</div>
    </div>
  </div>
</div>`.trim();
};

export default function CalloutGeneratorModal({ isOpen, onClose, selectedText, onInsert, type = "callout" }) {
  const [generatedCallout, setGeneratedCallout] = useState("");
  const [editedCallout, setEditedCallout] = useState("");
  const [generatedFactSourceUrl, setGeneratedFactSourceUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Removed: const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);

  // Added: Use TemplateProvider
  const { templates, loadTemplates, getTemplatesByFeature } = useTemplates();

  // Derived customTemplates from the provider
  const customTemplates = React.useMemo(() => {
    return getTemplatesByFeature(type);
  }, [getTemplatesByFeature, type]);

  // Removed: const loadCustomTemplates = useCallback(async () => { ... });

  // Effect to set initial selectedTemplate when customTemplates are loaded
  useEffect(() => {
    if (customTemplates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(customTemplates[0]);
    }
  }, [customTemplates, selectedTemplate]);


  const generateCallout = useCallback(async () => {
    if (!selectedText?.trim()) {
      toast.error("No text selected to generate callout from");
      return;
    }

    setIsGenerating(true);
    setGeneratedCallout("");
    setEditedCallout("");
    setGeneratedFactSourceUrl("");
    try {
      let result;
      let sourceUrl = "";
      if (type === 'fact') {
        const { data } = await interestingFact({ topic: selectedText });
        if (!data || !data.fact) {
          throw new Error(data?.error || "Failed to retrieve fact from Perplexity.");
        }
        result = data.fact;
        sourceUrl = data.source_url || "";
        setGeneratedFactSourceUrl(sourceUrl);
      } else if (type === 'tldr') {
        const prompt = `Summarize the following text concisely. The summary should be a TLDR (Too Long; Didn't Read) version, capturing the main points in 1-2 sentences. Do not add any introductory phrases like "TLDR:" or "In summary:", just provide the summary directly.

Text: "${selectedText}"`;
        result = await InvokeLLM({ prompt });
      } else {
        const prompt = `Create an important callout or key insight based on this text: "${selectedText}".

Make it:
- Clear and concise (1-2 sentences)
- Highlight the most important point
- Use actionable language
- Be valuable to readers

Return just the callout text, no extra formatting.`;
        result = await InvokeLLM({ prompt });
      }

      setGeneratedCallout(result);
      setEditedCallout(result);
    } catch (error) {
      console.error("Callout generation error:", error);
      toast.error(error.message || `Failed to generate ${type}. Please try again.`);
    }
    setIsGenerating(false);
  }, [selectedText, type, setIsGenerating, setGeneratedCallout, setEditedCallout, setGeneratedFactSourceUrl]);

  useEffect(() => {
    if (isOpen && selectedText && !isGenerating && !generatedCallout) {
        generateCallout();
    }
  }, [isOpen, selectedText, isGenerating, generatedCallout, generateCallout]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates(); // Load from cache or fetch if needed
    }
  }, [isOpen, loadTemplates]);

  const applyCustomTemplate = (content, sourceUrl = "") => {
    if (!useCustomTemplate || !selectedTemplate) {
      return content;
    }

    let htmlStructure = selectedTemplate.html_structure;

    htmlStructure = htmlStructure
      .replace(/\{\{TITLE\}\}/g, type === "fact" ? "Interesting Fact" : "Important Note")
      .replace(/\{\{CONTENT\}\}/g, content)
      .replace(/\{\{FACT_TEXT\}\}/g, content)
      .replace(/\{\{CALLOUT_TEXT\}\}/g, content)
      .replace(/\{\{AI_GENERATED_TEXT\}\}/g, content);

    if (type === "fact" && sourceUrl) {
      const encodedSourceUrl = encodeURI(sourceUrl);
      htmlStructure = htmlStructure
        .replace(/\{\{SOURCE_URL\}\}/g, encodedSourceUrl)
        .replace(/\{\{SOURCE_LINK\}\}/g, `<a href="${encodedSourceUrl}" target="_blank" rel="noopener noreferrer">Source</a>`);
    } else {
      htmlStructure = htmlStructure
        .replace(/\{\{SOURCE_URL\}\}/g, "")
        .replace(/\{\{SOURCE_LINK\}\}/g, "");
    }

    return htmlStructure;
  };

  const handleInsert = () => {
    const finalContent = editedCallout || generatedCallout;
    if (!finalContent) return;

    let htmlToInsert;

    if (useCustomTemplate && selectedTemplate) {
      htmlToInsert = applyCustomTemplate(finalContent, generatedFactSourceUrl);
    } else {
      if (type === 'fact') {
        htmlToInsert = buildFactHtml(finalContent, generatedFactSourceUrl);
      } else {
        const templates = {
          callout: `
<div class="b44-callout">
  <div class="b44-callout-icon">💡</div>
  <div class="b44-callout-content">
    <h4>Important Note</h4>
    <p>${finalContent}</p>
  </div>
</div>`,
          tldr: `
<div class="b44-tldr">
  <div class="b44-tldr-icon">💡</div>
  <div class="b44-tldr-content">
    <h4>TLDR</h4>
    <p>${finalContent}</p>
  </div>
</div>`
        };
        htmlToInsert = templates[type] || templates.callout;
      }
    }

    onInsert({ html: htmlToInsert, mode: "after-selection" });
    handleClose();
  };

  const handleClose = () => {
    setGeneratedCallout("");
    setEditedCallout("");
    setGeneratedFactSourceUrl("");
    setIsEditing(false);
    setUseCustomTemplate(false);
    setSelectedTemplate(null);
    // Removed: setCustomTemplates([]); as it's no longer a state
    onClose();
  };

  const getTitle = () => {
    if (type === 'fact') return 'Generate Interesting Fact';
    if (type === 'tldr') return 'Generate TLDR Summary';
    return 'Generate Callout';
  };

  const getIcon = () => {
    if (type === 'fact') return <Lightbulb className="w-5 h-5 text-green-400" />;
    if (type === 'tldr') return <AlertCircle className="w-5 h-5 text-purple-400" />;
    return <AlertCircle className="w-5 h-5 text-blue-400" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl backdrop-blur-xl bg-slate-800/95 border border-white/20 text-white fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Generate a {type} from your selected text: "{selectedText?.substring(0, 100)}..."
          </DialogDescription>
        </DialogHeader>

        {customTemplates.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/20">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-custom-template"
                checked={useCustomTemplate}
                onChange={(e) => setUseCustomTemplate(e.target.checked)}
                className="rounded border-white/20"
              />
              <label htmlFor="use-custom-template" className="text-sm text-white/90">
                Use custom template
              </label>
            </div>

            {useCustomTemplate && (
              <div>
                <Label htmlFor="template-select" className="text-white/90 text-sm mb-1">Select Template</Label>
                <Select
                  value={selectedTemplate?.id || ""}
                  onValueChange={(value) => {
                    const template = customTemplates.find(t => t.id === value);
                    setSelectedTemplate(template);
                  }}
                >
                  <SelectTrigger id="template-select" className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose a custom template" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    {customTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id} className="hover:bg-white/10">
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <p className="text-xs text-white/60 mt-1">{selectedTemplate.description}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 pt-4">
          {isGenerating ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-400" />
              <p className="mt-4 text-white/70">Generating {type}...</p>
            </div>
          ) : generatedCallout ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Generated {type}:</h4>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="bg-slate-600 text-white px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md border-white/20 hover:bg-white/10">
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
              </div>
              {isEditing ? (
                <Textarea value={editedCallout} onChange={(e) => setEditedCallout(e.target.value)} rows={4} className="bg-white/10 border-white/20 text-white" placeholder={`Edit your ${type}...`} />
              ) : (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-white/90 leading-relaxed">{editedCallout || generatedCallout}</p>
                  {type === 'fact' && generatedFactSourceUrl && (
                    <p className="text-xs text-white/50 mt-2">Source: <a href={encodeURI(generatedFactSourceUrl)} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{generatedFactSourceUrl}</a></p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={generateCallout} disabled={isGenerating} className="flex-1 border-white/20 text-white hover:bg-white/10">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button onClick={handleInsert} className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                  Insert {type}
                </Button>
              </div>
            </div>
          ) : (
             <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 flex items-center justify-center">
                {getIcon()}
              </div>
              <p className="text-white/70 mb-4">
                Could not generate {type}. Please try again.
              </p>
               <Button variant="outline" onClick={generateCallout} disabled={isGenerating} className="border-white/20 text-white hover:bg-white/10">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
