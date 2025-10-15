
import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { generateExternalReferences } from "@/api/functions";
import MagicOrbLoader from "@/components/common/MagicOrbLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";

const LinksAndReferencesButton = React.forwardRef(({ html, userName, onApply, disabled }, ref) => {
  const { enabled } = useFeatureFlag("ai_rnl", { defaultEnabled: false });
  const [loading, setLoading] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const runIdRef = React.useRef(0);
  const [estimatedDuration, setEstimatedDuration] = React.useState(73);
  const { consumeTokensForFeature } = useTokenConsumption();

  // NEW: Ensure the References section is wrapped and marked for editor controls
  const ensureReferencesBlockMarked = (fullHtml) => {
    if (!fullHtml || typeof fullHtml !== "string") return fullHtml;

    // If already marked, just ensure the class exists and return
    if (fullHtml.includes('data-b44-type="references"')) {
      if (!/class=["'][^"']*\bb44-references\b/i.test(fullHtml)) {
        return fullHtml.replace(/(<section[^>]*data-b44-type=["']references["'][^>]*)(>)/i, '$1 class="b44-references"$2');
      }
      return fullHtml;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, "text/html");

      // 1) If a .b44-references exists, mark it
      const existing = doc.querySelector(".b44-references");
      if (existing) {
        existing.setAttribute("data-b44-type", "references");
        return doc.body.innerHTML;
      }

      // 2) Find a heading near the end named "References" / "Sources" / "Citations"
      const headings = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      const refHeading = [...headings].reverse().find((h) =>
        /references|sources|citations/i.test((h.textContent || "").trim())
      );

      if (refHeading) {
        // Wrap heading and following siblings until next heading into a section
        const wrapper = doc.createElement("section");
        wrapper.className = "b44-references";
        wrapper.setAttribute("data-b44-type", "references");

        // Insert wrapper before heading
        refHeading.parentNode.insertBefore(wrapper, refHeading);

        // Move nodes into wrapper until next heading or end
        let node = refHeading;
        while (node && node.nodeType === 1 && !/^H[1-6]$/i.test(node.tagName)) {
          const next = node.nextSibling;
          wrapper.appendChild(node);
          node = next;
        }
        // If the next node is a list or paragraph group, include it as well
        // This loop handles scenarios where there might be text nodes or other non-heading elements
        // before the actual reference list starts or after the heading.
        // It continues to move nodes until another heading is encountered or the parent's children are exhausted.
        while (node && node.nodeType === 1 && !/^H[1-6]$/i.test(node.tagName) && node.parentNode === wrapper.parentNode) {
            const next = node.nextSibling;
            wrapper.appendChild(node);
            node = next;
        }


        return doc.body.innerHTML;
      }
    } catch (e) {
        console.error("DOMParser marking failed:", e); // Log error for debugging
      // Fallback: naive regex wrap the last <h2>References...</h2> through next list
      try {
        const rx = /(.*)(<h[1-6][^>]*>\s*(References?|Sources?|Citations?)\s*<\/h[1-6]>((?!<h[1-6]).*)*)$/is; // 'is' flags for dotall and case-insensitivity
        const m = fullHtml.match(rx);
        if (m) {
          const before = m[1];
          const after = m[2];
          return `${before}<section class="b44-references" data-b44-type="references">${after}</section>`;
        }
      } catch (e) {
          console.error("Regex marking failed:", e); // Log error for debugging
      }
    }
    return fullHtml;
  };

  const handleRun = async () => {
    if (loading) return;
    if (!html || String(html).trim().length === 0) {
      toast.message("Add content first, then generate References.");
      return;
    }

    const tokenRes = await consumeTokensForFeature("ai_rnl");
    if (!tokenRes?.success) {
      return;
    }
    
    setLoading(true);
    setProcessing(true);
    setEstimatedDuration(73);
    
    const myRun = ++runIdRef.current;

    try {
      const { data } = await generateExternalReferences({ html });

      if (myRun !== runIdRef.current) return;

      if (data?.success) {
        const updated = String(data.updated_html || html);
        // FIX: ensure the References block is marked for drag/drop/delete
        const finalHtml = ensureReferencesBlockMarked(updated);

        onApply?.(finalHtml);
        
        const referencesAdded = Array.isArray(data.references) ? data.references.length : 0;
        if (referencesAdded > 0) {
          toast.success(`Added ${referencesAdded} references to your article.`);
        } else {
          toast.message("No references were generated.");
        }
      } else {
        toast.error("References could not be generated.");
      }

    } catch (e) {
      if (myRun !== runIdRef.current) return;
      toast.error(e?.response?.data?.error || e?.message || "Failed to generate references.");
    } finally {
      if (runIdRef.current === myRun) {
        setLoading(false);
        setProcessing(false);
      }
    }
  };

  React.useImperativeHandle(ref, () => ({
    run: handleRun
  }));

  if (!enabled) return null;

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2"
          onClick={handleRun}
          disabled={disabled || loading}
          title="Generate evidence-based references"
        >
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <HelpCircle className="w-4 h-4" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-sm font-medium">References</div>
                <div className="text-xs text-slate-600">
                  Generates an evidence-based References section at the end of your article.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          References
        </Button>
      </div>

      <MagicOrbLoader
        open={processing}
        label="Finding authoritative references for your article..."
        duration={estimatedDuration}
      />
    </>
  );
});

LinksAndReferencesButton.displayName = "LinksAndReferencesButton";

export default LinksAndReferencesButton;
