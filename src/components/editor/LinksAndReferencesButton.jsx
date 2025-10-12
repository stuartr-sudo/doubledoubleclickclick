
import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { agentSDK } from "@/agents";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { generateExternalReferences } from "@/api/functions";
import MagicOrbLoader from "@/components/common/MagicOrbLoader";
import FeatureHelpIcon from "./FeatureHelpIcon";

// Helpers copied (minimal) from InternalLinkerButton for safe insertion
function insertLinkOnce(html, anchorText, url) {
  if (!html || !anchorText || !url) return html || "";
  const text = anchorText.trim();
  if (!text) return html;
  const lowerHtml = html.toLowerCase();
  const lowerText = text.toLowerCase();
  let idx = -1, startPos = 0;
  while (true) {
    idx = lowerHtml.indexOf(lowerText, startPos);
    if (idx === -1) return html;
    const beforeA = lowerHtml.lastIndexOf("<a", idx);
    const afterA = lowerHtml.indexOf("</a>", idx);
    const insideA = beforeA !== -1 && afterA !== -1 && beforeA < idx && idx < afterA;
    const hOpen = Math.max(
      lowerHtml.lastIndexOf("<h1", idx),
      lowerHtml.lastIndexOf("<h2", idx),
      lowerHtml.lastIndexOf("<h3", idx),
      lowerHtml.lastIndexOf("<h4", idx)
    );
    const hClose = lowerHtml.indexOf("</h", idx);
    const insideH = hOpen !== -1 && hClose !== -1 && hOpen < idx && idx < hClose;
    if (!insideA && !insideH) {
      const before = html.slice(0, idx);
      const match = html.slice(idx, idx + text.length);
      const after = html.slice(idx + text.length);
      return before + `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>` + after;
    }
    startPos = idx + lowerText.length;
  }
}
function applyLinkOperations(html, ops, maxLinks = 10) {
  let out = html || "";
  let used = 0;
  const urlCounts = new Map();
  for (const op of ops || []) {
    if (used >= maxLinks) break;
    const anchor = String(op?.anchor_text || op?.text || op?.phrase || "").trim();
    const url = String(op?.url || op?.href || op?.target_url || "").trim();
    if (!anchor || !url) continue;
    const count = urlCounts.get(url) || 0;
    if (count >= 2) continue;
    const next = insertLinkOnce(out, anchor, url);
    if (next !== out) {
      out = next;
      used += 1;
      urlCounts.set(url, count + 1);
    }
  }
  return { html: out, used };
}
function enforceMaxPerUrl(html, maxPerUrl = 2) {
  if (!html) return html;
  const counts = new Map();
  return html.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (full, href, inner) => {
    const url = String(href || "");
    const c = counts.get(url) || 0;
    if (c >= maxPerUrl) return inner;
    counts.set(url, c + 1);
    return full;
  });
}

export default function LinksAndReferencesButton({ html, userName, onApply, disabled }) {
  // Gate the combined Links + References feature behind 'ai_rnl'
  const { enabled } = useFeatureFlag("ai_rnl", { defaultEnabled: false });
  const [loading, setLoading] = React.useState(false);
  const [processing, setProcessing] = React.useState(false); // NEW overlay control
  const runIdRef = React.useRef(0);
  const [estimatedDuration, setEstimatedDuration] = React.useState(73); // Changed from 60 to 73
  if (!enabled) return null;

  const handleRun = async () => {
    if (loading) return;
    if (!html || String(html).trim().length === 0) {
      toast.message("Add content first, then run Links + References.");
      return;
    }
    setLoading(true);
    setProcessing(true); // show overlay immediately

    // Set timer to 73 seconds
    setEstimatedDuration(73); // Set fixed duration to 73 seconds
    
    const myRun = ++runIdRef.current;

    let linkedHtml = html; // This will hold HTML after internal linking
    let referencesAdded = 0; // To track if references were successfully added

    try {
      // 1) Internal linker via agent (10 links, max 2 per URL)
      const conversation = await agentSDK.createConversation({
        agent_name: "internal_linker",
        metadata: { task: "auto_internal_links_plus_references", user_name: userName || "" }
      });
      if (!conversation?.id) throw new Error("Could not start internal_linker agent conversation.");

      const maxChars = 100000; // INCREASED from 60000
      const trimmed = String(html).slice(0, maxChars);
      await agentSDK.addMessage(conversation, {
        role: "user",
        content: JSON.stringify({
          instruction: "Add up to 10 internal link suggestions distributed evenly throughout the ENTIRE article. Do not repeat the same URL more than twice.",
          article_html: trimmed,
          max_links: 10,
          distribution_instruction: "Distribute links evenly: 2-3 in first third, 3-4 in middle third, 2-3 in final third of the article"
        })
      });

      // Simple poll loop for the final message
      const start = Date.now();
      while (Date.now() - start < 90000) {
        const updated = await agentSDK.getConversation(conversation.id);
        const last = updated?.messages?.[updated.messages.length - 1];
        if (last?.role === "assistant" && last?.content) {
          // Try to parse JSON first
          let ops = [];
          let updatedHtmlCandidate = null;
          try {
            const cleaned = last.content.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
            const parsed = JSON.parse(cleaned);
            if (parsed?.updated_html && typeof parsed.updated_html === 'string') {
              updatedHtmlCandidate = parsed.updated_html;
            } else if (Array.isArray(parsed?.link_operations)) {
              ops = parsed.link_operations;
            }
          } catch {
            // If not JSON, ignore and rely on ops = []
          }

          if (updatedHtmlCandidate) {
            linkedHtml = enforceMaxPerUrl(updatedHtmlCandidate, 2);
          } else if (ops.length) {
            const res = applyLinkOperations(html, ops, 10);
            linkedHtml = res.html;
          }
          break;
        }
        await new Promise(r => setTimeout(r, 1500));
      }

      // If race run changed, abort applying
      if (myRun !== runIdRef.current) return;

      // 2) External references via backend (Perplexity Sonar)
      const { data } = await generateExternalReferences({ html: linkedHtml });
      let finalHtml = linkedHtml; // Default to just internal links

      if (data?.success) {
        finalHtml = String(data.updated_html || linkedHtml);
        referencesAdded = Array.isArray(data.references) ? data.references.length : 0;
      } else {
        // Still apply internal links even if references fail
        onApply?.(linkedHtml);
        toast.message("AutoLink completed. References could not be generated.");
        // The finally block will handle setLoading(false) and setProcessing(false)
        return; // Early exit, no need for the final success toast
      }

      // Apply the final HTML with both internal links and (optionally) references
      onApply?.(finalHtml);

      // Final success toast if both steps were successful
      const referenceMessage = referencesAdded > 0 ? ` and ${referencesAdded} references appended.` : "";
      toast.success(`AutoLink completed${referenceMessage}.`);

    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Failed to add links and references.");
    } finally {
      if (runIdRef.current === myRun) { // Only reset if this is the latest run
        setLoading(false);
        setProcessing(false); // hide overlay
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2"
          onClick={handleRun}
          disabled={disabled || loading}
          title="Insert internal links and append References list"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Links + References
        </Button>

        <FeatureHelpIcon
          featureFlagName="ai_rnl"
          label="Links + References"
          description="Adds internal links and appends a formatted References section from authoritative sources. Click to watch a short tutorial."
        />
      </div>

      {/* Elegant full-screen loader overlay (does not reload editor content) */}
      <MagicOrbLoader
        open={processing}
        label="Optimizing your article — linking internally and finding authoritative references..."
        duration={estimatedDuration}
      />
    </>
  );
}
