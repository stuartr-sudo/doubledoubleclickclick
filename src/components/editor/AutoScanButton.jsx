
import React from "react";
import { Button } from "@/components/ui/button";
import { ScanText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { agentSDK } from "@/agents";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import MagicOrbLoader from "@/components/common/MagicOrbLoader";
import FeatureHelpIcon from "./FeatureHelpIcon";

export default function AutoScanButton({ html, onApply, disabled }) {
  const { enabled } = useFeatureFlag("ai_autoscan", { defaultEnabled: false });
  const [loading, setLoading] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const runIdRef = React.useRef(0);
  const [estimatedDuration, setEstimatedDuration] = React.useState(73);

  if (!enabled) return null;

  const handleRun = async () => {
    if (loading) return;
    if (!html || String(html).trim().length === 0) {
      toast.message("Add some content first, then try AutoScan.");
      return;
    }

    setLoading(true);
    setProcessing(true);
    setEstimatedDuration(73);
    
    const myRun = ++runIdRef.current;

    try {
      // Create conversation with autoscanner agent
      const conversation = await agentSDK.createConversation({
        agent_name: "autoscanner",
        metadata: { task: "restructure_for_readability" }
      });
      
      if (!conversation?.id) {
        throw new Error("Could not start autoscanner agent conversation.");
      }

      // Send article HTML to agent (limit to 150k chars for safety)
      const maxChars = 150000;
      const trimmedHtml = String(html).slice(0, maxChars);

      await agentSDK.addMessage(conversation, {
        role: "user",
        content: `Please restructure this article for better readability:\n\n${trimmedHtml}`
      });

      // Poll for response with timeout
      const timeoutMs = 120000; // 2 minutes
      const intervalMs = 2000;
      const start = Date.now();
      let finalMessage = null;

      while (Date.now() - start < timeoutMs) {
        if (myRun !== runIdRef.current) {
          return;
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
        throw new Error("AutoScan did not return a response in time.");
      }

      // Parse agent response (strip code fences)
      const raw = String(finalMessage.content)
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (jsonError) {
        // Try to extract JSON from response
        const match = raw.match(/\{[\s\S]*\}/);
        if (match && match[0]) {
          try {
            parsed = JSON.parse(match[0]);
          } catch (fallbackError) {
            console.error("AutoScan: JSON parsing failed:", fallbackError);
            throw new Error("AutoScan returned malformed response.");
          }
        } else {
          console.error("AutoScan: Could not find JSON in response:", jsonError);
          throw new Error("AutoScan returned non-JSON content.");
        }
      }

      if (!parsed || !parsed.updated_html) {
        throw new Error("AutoScan response missing updated_html.");
      }

      // Check if run was cancelled
      if (myRun !== runIdRef.current) {
        return;
      }

      const updatedHtml = String(parsed.updated_html);
      
      if (!updatedHtml || updatedHtml === html) {
        toast.message("No readability improvements needed.");
        return;
      }

      // Apply changes
      onApply?.(updatedHtml);
      
      // Show success message with summary if available
      const summary = parsed.changes_summary || "Article restructured for better readability";
      toast.success(summary);

    } catch (e) {
      if (myRun !== runIdRef.current) {
        return;
      }
      console.error("AutoScan error:", e);
      toast.error(e?.message || "AutoScan failed. Please try again.");
    } finally {
      if (myRun === runIdRef.current) {
        setLoading(false);
        setProcessing(false);
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
          title="Restructure article for better readability (breaks up paragraphs, adds bullets, improves flow)"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
          AutoScan
        </Button>

        <FeatureHelpIcon
          featureFlagName="ai_autoscan"
          label="AutoScan"
          description="Improves readability by restructuring paragraphs, adding lists, and enhancing flow. Click to watch a short tutorial."
        />
      </div>

      <MagicOrbLoader
        open={processing}
        label="Restructuring your article for maximum readability..."
        duration={estimatedDuration}
      />
    </>
  );
}
