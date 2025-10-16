
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BrandGuidelines } from "@/api/entities";
import { BrandSpecifications } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';

export default function BrandItModal({
  isOpen,
  onClose,
  onApply,
  htmlContent,
  userName
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [rewrittenHtml, setRewrittenHtml] = useState('');
  const [error, setError] = useState('');
  const [guidelines, setGuidelines] = useState(null);
  const [brandSpecs, setBrandSpecs] = useState(null);
  const [hasStarted, setHasStarted] = React.useState(false);
  const { consumeTokensForFeature } = useTokenConsumption();

  // Remove llmChoice state and related logic - use default model
  const llmChoice = "openai:gpt-4.1"; // Fixed default, no user selection

  const stripFences = React.useCallback((s) => {
    if (!s) return "";
    let out = String(s).trim();
    const m = out.match(/^\s*```(?:html)?\s*([\s\S]*?)\s*```$/i);
    if (m) {
      out = m[1];
    } else {
      out = out.replace(/^\s*```(?:html)?/i, "").replace(/```$/i, "");
    }
    return out.trim();
  }, []);

  const buildBrandBrief = React.useCallback(() => {
    // Prioritize brand specifications over legacy guidelines
    const source = brandSpecs || guidelines;
    
    if (!source) {
      return "No explicit brand guideline record found. Use a consistent, confident, concise, friendly voice. Prefer active voice, short sentences, avoid hype. Do NOT add or alter <img> src or links.";
    }

    const lines = [];
    
    // Add brand specifications context if available
    if (brandSpecs) {
      lines.push("=== BRAND SPECIFICATIONS ===");
      if (brandSpecs.name) lines.push(`Brand Name: ${brandSpecs.name}`);
      
      // Visual identity context
      if (brandSpecs.colors) {
        const colors = brandSpecs.colors;
        if (colors.primary) lines.push(`Primary Color: ${colors.primary}`);
        if (colors.accent) lines.push(`Accent Color: ${colors.accent}`);
      }
      
      // Typography context
      if (brandSpecs.typography?.font_family) {
        lines.push(`Typography: ${brandSpecs.typography.font_family.split(',')[0]}`);
      }
      
      // Website context
      if (brandSpecs.website_specs?.domain) {
        lines.push(`Website Domain: ${brandSpecs.website_specs.domain}`);
      }
      
      lines.push(""); // Empty line separator
    }
    
    // Add voice and tone guidelines
    lines.push("=== VOICE & TONE GUIDELINES ===");
    if (source.voice_and_tone) lines.push(`Voice and tone: ${source.voice_and_tone}`);
    if (source.content_style_rules) lines.push(`Style rules: ${source.content_style_rules}`);
    if (source.preferred_elements) lines.push(`Preferred: ${source.preferred_elements}`);
    if (source.prohibited_elements) lines.push(`Avoid: ${source.prohibited_elements}`);
    if (source.target_market) lines.push(`Target market: ${source.target_market}`);
    
    lines.push(""); // Empty line separator
    lines.push("=== IMPORTANT CONSTRAINTS ===");
    lines.push("Important: Do NOT add or alter <img> src or links; preserve all attributes and embeds exactly.");
    
    return lines.join("\n");
  }, [guidelines, brandSpecs]);

  const buildPrompt = React.useCallback((html) => {
    return [
    `You are BrandIt, a meticulous brand-voice editor.`,
    `Task: rewrite the following HTML content to fit the brand guidelines for the user: "${userName}".`,
    `Rules:`,
    `1) Return the FULL HTML, NO TRUNCATION.`,
    `2) Preserve ALL tags, attributes (class, id, data-*), inline styles, order, and embeds (iframes, scripts).`,
    `3) Modify ONLY TEXT content. Do NOT change URLs.`,
    `4) Do NOT add commentary or code fences. Output ONLY the final HTML.`,
    `5) Do NOT add or modify any <img> src. Keep images as-is (same src or if missing, leave as-is).`,
    ``,
    `BRAND GUIDELINES BRIEF:\n${buildBrandBrief()}`,
    ``,
    `HTML TO REWRITE:\n${html}`].
    join("\n");
  }, [userName, buildBrandBrief]);

  const startRewrite = async () => {
    if (!userName || !htmlContent) return;

    const tokenResult = await consumeTokensForFeature('ai_brand_it');
    if (!tokenResult.success) {
      onClose(); // Hook handles toast, just close the modal.
      return;
    }

    setRewrittenHtml('');
    setError('');
    setIsLoading(true);
    setHasStarted(true);

    try {
      const prompt = buildPrompt(htmlContent);
      const res = await InvokeLLM({ prompt, model_id: llmChoice });
      const finalHtml = stripFences(res);

      if (!finalHtml) {
        throw new Error("The AI returned empty content. Please try again.");
      }

      setRewrittenHtml(finalHtml);
      setError('');
    } catch (e) {
      console.error('Failed to run Brand It rewrite:', e);
      setError(e?.message || "Failed to rewrite content. Please try again.");
      setRewrittenHtml('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !userName) return;
    (async () => {
      try {
        // Fetch both brand specifications and legacy guidelines
        const [brandSpecsRows, guidelinesRows] = await Promise.all([
          BrandSpecifications.filter({ user_name: userName }, "-updated_date", 1).catch(() => []),
          BrandGuidelines.filter({ user_name: userName }, "-updated_date", 1).catch(() => [])
        ]);
        
        setBrandSpecs(brandSpecsRows && brandSpecsRows[0] ? brandSpecsRows[0] : null);
        setGuidelines(guidelinesRows && guidelinesRows[0] ? guidelinesRows[0] : null);
      } catch (e) {
        console.error("Failed to fetch brand data:", e);
        setBrandSpecs(null);
        setGuidelines(null);
      }
    })();
  }, [isOpen, userName]);

  useEffect(() => {
    if (!isOpen) return;
    setRewrittenHtml('');
    setError('');
    setIsLoading(false);
    setHasStarted(false);

    // Removed model choice loading from local storage
  }, [isOpen]);

  const handleApplyClick = () => {
    if (rewrittenHtml) {
      onApply(rewrittenHtml);
      onClose();
    } else {
      toast.warning("No rewritten content to apply.");
    }
  };

  const handleRegenerate = async () => {
    if (!hasStarted) return;
    await startRewrite();
  };

  const handleClose = () => {
    setHasStarted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-4xl h-[80vh] flex flex-col bg-white text-slate-900 border-slate-200 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Wand2 />
            Brand It Rewrite
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            The AI can rewrite the article to match the brand voice for{" "}
            <span className="font-bold text-cyan-600">{userName}</span>.
          </DialogDescription>
          {!brandSpecs && !guidelines &&
          <div className="mt-2 text-xs text-amber-600">
              No Brand Specifications or Guidelines found for this username. Using a default, consistent tone.
            </div>
          }
          {brandSpecs &&
          <div className="mt-2 text-xs text-green-600">
              ✓ Using enhanced brand specifications for "{brandSpecs.name}"
            </div>
          }
          {!brandSpecs && guidelines &&
          <div className="mt-2 text-xs text-blue-600">
              ✓ Using legacy brand guidelines
            </div>
          }
        </DialogHeader>

        <div className="bg-slate-50 text-slate-800 flex flex-col flex-grow space-y-4 overflow-hidden p-4 rounded-lg">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={startRewrite}
              disabled={isLoading || hasStarted} className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 hover:bg-cyan-700">
              Start Rewrite
            </Button>

            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isLoading || !hasStarted}
              className="h-9 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:opacity-50">
              Regenerate
            </Button>
          </div>

          <div className="flex-grow min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold mb-2 text-slate-700">Original</h3>
              <iframe
                title="Original Content"
                srcDoc={htmlContent}
                className="w-full h-full bg-white border border-slate-300 rounded-md flex-grow" />
            </div>

            <div className="flex flex-col">
              <h3 className="text-sm font-semibold mb-2 text-slate-700">Brand Voice Preview</h3>
              <div className="w-full h-full bg-slate-100 border border-slate-300 rounded-md flex-grow relative">
                {!hasStarted && !isLoading && !rewrittenHtml &&
                <div className="text-slate-500 absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Wand2 className="w-6 h-6 text-cyan-500" />
                    <p>Click “Start Rewrite” to begin.</p>
                  </div>
                }
                {isLoading &&
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    <p className="mt-4 text-slate-600">AI is rewriting...</p>
                  </div>
                }
                {error &&
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 p-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <p className="mt-4 text-red-600 text-center">{error}</p>
                  </div>
                }
                {!isLoading && rewrittenHtml &&
                <iframe
                  title="Rewritten Content"
                  srcDoc={rewrittenHtml}
                  className="w-full h-full bg-white rounded-md" />
                }
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={handleClose} className="text-slate-700 hover:bg-slate-100">
            Cancel
          </Button>
          <Button
            onClick={handleApplyClick}
            disabled={isLoading || !!error || !rewrittenHtml}
            className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100">
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}
