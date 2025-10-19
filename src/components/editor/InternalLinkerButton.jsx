import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import MagicOrbLoader from "@/components/common/MagicOrbLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import { base44 } from "@/api/appClient";

const InternalLinkerButton = React.forwardRef(({ html, userName, onApply, disabled }, ref) => {
  const { enabled } = useFeatureFlag("auto-link", { defaultEnabled: false });
  const { consumeTokensForFeature } = useTokenConsumption();
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

    // Deduct tokens in real time
    const tokenRes = await consumeTokensForFeature("auto-link");
    if (!tokenRes?.success) {
      return;
    }

    setLoading(true);
    setProcessing(true);
    setEstimatedDuration(73);

    const myRun = ++runIdRef.current;

    try {
      // Call the backend function which handles the internal linking logic
      const response = await app.functions.invoke('executeInternalLinker', {
        html: html,
        user_name: userName || "",
        max_links: 10
      });

      if (myRun !== runIdRef.current) {
        return; // Race guard - another run started
      }

      const data = response?.data;

      if (!data || !data.success) {
        throw new Error(data?.error || "Failed to generate internal links");
      }

      const updatedHtml = data.updated_html;
      const linksUsed = data.links_used || 0;

      if (!updatedHtml || updatedHtml === html) {
        toast.message("No suitable internal links found or changes applied.");
        return;
      }

      onApply?.(updatedHtml);
      toast.success(
        linksUsed > 0
          ? `Inserted ${linksUsed} internal link${linksUsed === 1 ? "" : "s"} (max 2 per URL).`
          : "Internal links added."
      );
    } catch (e) {
      if (myRun !== runIdRef.current) {
        return; // Stale run
      }
      console.error("AutoLink error:", e);
      toast.error(e?.response?.data?.error || e?.message || "AutoLink failed.");
    } finally {
      if (myRun === runIdRef.current) {
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
          title="Automatically add internal links"
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