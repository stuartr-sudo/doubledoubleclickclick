import React, { useState, useEffect, useCallback } from "react";
import { InvokeLLM } from "@/api/integrations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { useBalanceConsumption } from '@/components/hooks/useBalanceConsumption';

export default function HTMLCleanupModal({ isOpen, onClose, currentContent, onContentUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanedContent, setCleanedContent] = useState("");
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const { consumeBalanceForFeature } = useBalanceConsumption();

  const handleCleanup = useCallback(async () => {
    const tokenResult = await consumeBalanceForFeature('ai_html_cleanup');
    if (!tokenResult.success) {
      onClose(); // Hook handles toast, just close the modal.
      return;
    }

    if (!currentContent?.trim()) {
      setError("There is no content to clean up.");
      return;
    }
    setHasStarted(true);
    setIsProcessing(true);
    setCleanedContent("");
    setError(null);

    try {
      const prompt = `
You are an expert HTML editor. Clean and optimize the provided HTML. Apply ONLY these operations, consistently, every time:

1) HTML Structure Cleanup: fix malformed tags, nest properly, remove redundant wrappers.
2) Format Paragraphs: ensure paragraphs are properly wrapped; keep logical breaks.
3) Break Up Large Paragraphs: split walls of text into shorter paragraphs (keep meaning).
4) Optimize Headings: enforce proper H1-H6 hierarchy and meaningful IDs.
5) Remove AI Language & Phrases: eliminate robotic phrases and cliches; rewrite to natural tone.
6) Fix Excessive Spacing: normalize margins/padding to sensible defaults.
7) Compact Lists: reduce excessive list spacing; keep readability.
8) Optimize Margins: balanced vertical rhythm; avoid huge gaps.
9) Remove Extra Whitespace: trim redundant newlines/whitespace.
10) SEO Optimization: ensure semantic tags, meaningful alt text (if missing), preserve existing metadata.
11) Dark Theme Compatible: adapt inline colors so content looks good on dark backgrounds (e.g., dark containers, light text).
12) Responsive Images: make existing images responsive; NEVER add new images or change image URLs. Do not invent any images that were not present.
13) Fix and Validate Links: ensure proper href formatting; add rel="noopener noreferrer" for external links; do not alter URLs.
14) Optimize Images: if alt is missing, add a sensible alt; DO NOT add or replace image URLs; if an image is clearly invalid, leave it in place (frontend will hide broken ones).
15) Optimize Videos: ensure YouTube iframes are responsive (16:9 wrapper); preserve TikTok embeds; do not remove needed scripts.
16) HTML5 Validation: final output must be valid, clean HTML5.

CRITICAL PRESERVATION (do NOT flatten or remove; keep distinct identity; adapt colors for contrast):
- TLDR/Key Takeaways blocks (e.g., ".b44-tldr").
- Promoted product blocks (".b44-promoted-product").
- Quotes, callouts, facts (blockquote or ".b44-callout"/".b44-fact").
- YouTube containers and TikTok embeds.

AI Language Removal Guidelines (rewrite naturally):
- Avoid cliches like "gamechanger", "unlock potential", "deep dive", "discover", "reveal", "elevate".
- Avoid contrastive formulas: “not just X, but Y”; replace with direct statements.
- Prefer clear, specific, second-person language where appropriate.
- Keep facts intact; do not invent content.

Styling guidance:
- Convert obvious light backgrounds (#fff/#f9fafb) to dark compatible (e.g., rgba(15, 23, 42, 0.85)) and ensure text is readable (#e5e7eb to #fff).
- Do not remove necessary custom inline styles of preserved blocks; you may adapt colors for contrast.
- For YouTube: wrap iframes in a responsive container (position:relative; padding-bottom:56.25%; height:0; iframe absolute, width:100%; height:100%).
- For images: ensure max-width:100%; height:auto; include meaningful alt attribute if missing.

IMPORTANT:
- Do NOT create a new table of contents.
- Do NOT add new sections or commentary.
- Do NOT invent images or media. Never add new <img> tags.
- Return ONLY the cleaned HTML string. No markdown, no explanations, no code fences.

Original HTML:
${currentContent}
`;

      const result = await InvokeLLM({ prompt });
      setCleanedContent(typeof result === "string" ? result : String(result || ""));
    } catch (err) {
      console.error("HTML cleanup error:", err);
      setError("An error occurred during cleanup. Please try again.");
      setCleanedContent("<!-- Cleanup failed. Please try again. -->" + (currentContent || ""));
    } finally {
      setIsProcessing(false);
    }
  }, [currentContent, consumeBalanceForFeature, onClose]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setIsProcessing(false);
      setCleanedContent("");
      setError(null);
      setHasStarted(false);
    }
  }, [isOpen]);


  const handleUseCleanedContent = () => {
    if (!cleanedContent || error) return;
    onContentUpdate(cleanedContent);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-3xl bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Clean Up HTML
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            One-click cleanup applies a fixed set of improvements every time: structure cleanup, paragraph formatting, heading optimization, AI-language removal, spacing/margins fixes, compact lists, SEO tweaks, dark theme compatibility, responsive media, link validation, image/video optimization, and HTML5 validation.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {!hasStarted && !isProcessing ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-slate-700 font-medium">Ready to clean up your HTML?</p>
              <Button onClick={handleCleanup} className="bg-slate-900 text-slate-50 hover:bg-slate-800">
                <Check className="w-4 h-4 mr-2" />
                Start Cleanup
              </Button>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-slate-700 font-medium">Cleaning HTML...</p>
              <p className="text-slate-500 text-sm">Please wait, this may take a moment.</p>
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          ) : cleanedContent ? (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-slate-900">Cleaned HTML Ready</h4>
              </div>
              <div className="bg-slate-100 rounded-lg p-4 max-h-48 overflow-y-auto border border-slate-200">
                <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono">
                  {cleanedContent.substring(0, 1200)}
                  {cleanedContent.length > 1200 &&
                <span className="text-blue-600">
                      ... ({cleanedContent.length - 1200} more characters)
                    </span>
                }
                </pre>
              </div>
              <div className="flex gap-3">
                <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white border-slate-300 text-slate-700 hover:bg-slate-100">

                  Cancel
                </Button>
                <Button
                onClick={handleUseCleanedContent} className="bg-slate-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 flex-1 hover:bg-slate-800">


                  <Check className="w-4 h-4 mr-2" />
                  Use Cleaned HTML
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>);

}