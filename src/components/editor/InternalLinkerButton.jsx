
import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { agentSDK } from "@/agents";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption"; // NEW
import MagicOrbLoader from "@/components/common/MagicOrbLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Safe utilities to apply link operations without overlapping or touching existing anchors/headings
function insertLinkOnce(html, anchorText, url) {
  if (!html || !anchorText || !url) return html || "";
  const text = anchorText.trim();
  if (!text) return html;

  // We don't need to escape for indexOf, only for regex
  // const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const lowerHtml = html.toLowerCase();
  const lowerText = text.toLowerCase();

  let idx = -1;
  let startPos = 0;

  while (true) {
    idx = lowerHtml.indexOf(lowerText, startPos);
    if (idx === -1) return html; // not found

    // Check if the found text is already inside an <a> tag
    const beforeA = lowerHtml.lastIndexOf("<a", idx);
    const afterA = lowerHtml.indexOf("</a>", idx);
    const insideA = beforeA !== -1 && afterA !== -1 && beforeA < idx && idx < afterA;

    // Check if the found text is inside a heading tag
    const hOpen = Math.max(
      lowerHtml.lastIndexOf("<h1", idx),
      lowerHtml.lastIndexOf("<h2", idx),
      lowerHtml.lastIndexOf("<h3", idx),
      lowerHtml.lastIndexOf("<h4", idx),
      lowerHtml.lastIndexOf("<h5", idx),
      lowerHtml.lastIndexOf("<h6", idx)
    );
    const hClose = lowerHtml.indexOf("</h", idx);
    const insideH = hOpen !== -1 && hClose !== -1 && hOpen < idx && idx < hClose;

    // If not inside an <a> or heading tag, apply the link
    if (!insideA && !insideH) {
      const before = html.slice(0, idx);
      const match = html.slice(idx, idx + text.length);
      const after = html.slice(idx + text.length);
      const anchor = `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      return before + anchor + after;
    }
    // If inside an existing link or heading, continue searching from after this match
    startPos = idx + lowerText.length;
  }
}

// REPLACE applyLinkOperations: allow up to 2 links per URL and up to maxLinks total
function applyLinkOperations(html, ops, maxLinks = 10) {
  let out = html || "";
  let used = 0;
  const urlCounts = new Map(); // url -> count
  for (const op of ops || []) {
    if (used >= maxLinks) break;
    const anchor = String(op?.anchor_text || op?.text || op?.phrase || "").trim();
    const url = String(op?.url || op?.href || op?.target_url || "").trim();
    if (!anchor || !url) continue;

    const current = urlCounts.get(url) || 0;
    if (current >= 2) continue; // enforce max 2 per URL

    const next = insertLinkOnce(out, anchor, url);
    if (next !== out) {
      out = next;
      used += 1;
      urlCounts.set(url, current + 1);
    }
  }
  return { html: out, used };
}

// NEW: enforce max 2 anchors per exact URL even when agent returns updated_html
function enforceMaxPerUrl(html, maxPerUrl = 2) {
  if (!html) return html;
  const counts = new Map();
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  return html.replace(anchorRegex, (fullMatch, href, innerText) => {
    const url = String(href || "");
    const c = counts.get(url) || 0;
    if (c >= maxPerUrl) {
      // strip the link, keep inner text
      return innerText;
    }
    counts.set(url, c + 1);
    return fullMatch;
  });
}

const InternalLinkerButton = React.forwardRef(({ html, userName, onApply, disabled }, ref) => {
  // Call all hooks at the top level BEFORE any conditional returns
  const { enabled } = useFeatureFlag("auto-link", { defaultEnabled: false });
  const { consumeTokensForFeature } = useTokenConsumption(); // NEW
  const [loading, setLoading] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const runIdRef = React.useRef(0);
  const [estimatedDuration, setEstimatedDuration] = React.useState(73);

  const handleRun = async () => {
    if (loading) return;
    if (!html || String(html).trim().length === 0) {
      toast.message("Add some content first, then try AutoLink.");
      return;
    }

    // NEW: deduct tokens in real time
    const tokenRes = await consumeTokensForFeature("auto-link");
    if (!tokenRes?.success) {
        // useTokenConsumption hook typically handles showing toast for failure
        return; // Stop if tokens can't be consumed
    }

    setLoading(true);
    setProcessing(true);
    setEstimatedDuration(73);

    const myRun = ++runIdRef.current;

    try {
      // 1) Create a fresh conversation with the agent
      const conversation = await agentSDK.createConversation({
        agent_name: "internal_linker",
        metadata: { task: "auto_internal_links", user_name: userName || "" }
      });
      if (!conversation?.id) {
        throw new Error("Could not start internal_linker agent conversation.");
      }

      // 2) Send message with article + user context; agent will read Sitemap via tool
      // INCREASED: Send more content to ensure the entire article is analyzed
      const maxChars = 100000;
      const trimmedHtml = String(html).slice(0, maxChars);

      const prompt = JSON.stringify({
        user_name: userName || "",
        article_html: trimmedHtml,
        max_links: 10,
        distribution_instruction: "Distribute links evenly: 2-3 in first third, 3-4 in middle third, 2-3 in final third of the article"
      });

      await agentSDK.addMessage(conversation, {
        role: "user",
        content: `USER_CONTEXT_JSON=${prompt}`
      });

      // 3) Wait for completion with timeout and race guard
      const timeoutMs = 90000;
      const intervalMs = 1500;
      const start = Date.now();
      let finalMessage = null;

      while (Date.now() - start < timeoutMs) {
        if (myRun !== runIdRef.current) {
          // console.log(`InternalLinker: Aborting stale run ${myRun}. Latest is ${runIdRef.current}`);
          return; // newer run started; abort
        }
        const updated = await agentSDK.getConversation(conversation.id);
        const last = updated?.messages?.[updated.messages.length - 1];
        if (last?.role === "assistant" && (last.is_complete === true || last.content)) {
          finalMessage = last;
          break;
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }

      if (!finalMessage || !finalMessage.content) {
        throw new Error("internal_linker did not return a response in time or with content.");
      }

      // 4) Parse agent JSON payload robustly (strip code fences if any)
      const raw = String(finalMessage.content)
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (jsonError) {
        // If initial JSON parsing failed, try to extract JSON block using regex
        const m = raw.match(/\{[\s\S]*\}/);
        if (m && m[0]) {
          try {
            parsed = JSON.parse(m[0]);
          } catch (fallbackJsonError) {
            console.error("AutoLink: Fallback JSON parsing failed:", fallbackJsonError);
            throw new Error("internal_linker returned malformed JSON.");
          }
        } else {
          console.error("AutoLink: Original and fallback JSON parsing failed:", jsonError);
          throw new Error("internal_linker returned non-JSON content.");
        }
      }

      // Ensure the parsed content has what we expect
      if (!parsed || (parsed.updated_html == null && !Array.isArray(parsed.link_operations))) {
        throw new Error("internal_linker response missing updated_html or link_operations.");
      }

      // 5) Build updated HTML with local safety: max 10 total and <= 2 per URL
      let updatedHtml = null;
      let linksUsed = 0;

      if (parsed.updated_html && typeof parsed.updated_html === "string") {
        // Enforce max-2-per-URL on agent-provided HTML
        updatedHtml = enforceMaxPerUrl(parsed.updated_html, 2);
        // The agent might return its own links_used, but we can't easily re-calculate from enforced HTML
        // So we just take agent's number if it gave updated_html directly
        linksUsed = Number(parsed.links_used || 0);
      } else if (Array.isArray(parsed.link_operations)) {
        const res = applyLinkOperations(html, parsed.link_operations, 10); // up to 10 total links
        updatedHtml = enforceMaxPerUrl(res.html, 2); // Enforce max 2 per URL
        linksUsed = res.used;
      }

      if (myRun !== runIdRef.current) {
        // console.log(`InternalLinker: Skipping apply for stale run ${myRun}. Latest is ${runIdRef.current}`);
        return; // race guard
      }

      if (!updatedHtml || updatedHtml === html) {
        toast.message("No suitable internal links found or changes applied.");
        return;
      }

      onApply?.(updatedHtml);
      toast.success(
        linksUsed > 0
          ? `Inserted ${linksUsed} internal link${linksUsed === 1 ? "" : "s"} (max 2 per URL).`
          : "Internal links added." // Fallback message if linksUsed is 0 but HTML changed (unlikely with applyLinkOperations)
      );
    } catch (e) {
      if (myRun !== runIdRef.current) {
        // console.log(`InternalLinker: Skipping error toast for stale run ${myRun}. Latest is ${runIdRef.current}`);
        return; // stale run
      }
      // Do not spam details to users—concise error
      console.error("AutoLink error:", e);
      toast.error(e?.message || "AutoLink failed.");
    } finally {
      // Only the initiator run should clear loading
      if (myRun === runIdRef.current) {
        setLoading(false);
        setProcessing(false);
      }
    }
  };

  // Expose handleRun via ref - MUST be before any conditional returns
  React.useImperativeHandle(ref, () => ({
    run: handleRun
  }));

  // NOW we can do conditional returns AFTER all hooks are called
  if (!enabled) return null;

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2"
          onClick={handleRun}
          disabled={disabled || loading}
          title="Automatically add internal links"
        >
          {/* Icon becomes a HELP icon with hover-only tooltip */}
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
                <div className="text-sm font-medium">AutoLink</div>
                <div className="text-xs text-slate-600">
                  Inserts up to 10 internal links, max 2 per URL, distributed across your article.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          AutoLink
        </Button>
      </div>

      <MagicOrbLoader
        open={processing}
        label="Analyzing your article and adding relevant internal links..."
        duration={estimatedDuration}
      />
    </>
  );
});

InternalLinkerButton.displayName = "InternalLinkerButton";

export default InternalLinkerButton;
