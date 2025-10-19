
import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
// import { agentSDK } from "@/agents"; // TODO: Replace with Supabase conversation management
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import MagicOrbLoader from "@/components/common/MagicOrbLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AutoScanButton = React.forwardRef(({ html, onApply, disabled }, ref) => {
  const { enabled } = useFeatureFlag("ai_autoscan", { defaultEnabled: false });
  const { consumeTokensForFeature } = useTokenConsumption();
  const [loading, setLoading] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const runIdRef = React.useRef(0);
  const [estimatedDuration, setEstimatedDuration] = React.useState(73);

  const handleRun = async () => {
    // NEW: real-time token deduction
    const tokenRes = await consumeTokensForFeature("ai_autoscan");
    if (!tokenRes?.success) {
      if (tokenRes?.error) {
        toast.error(tokenRes.error);
      }
      return;
    }

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
      // TODO: Replace agentSDK functionality with Supabase conversation management
      toast.error("AutoScan functionality is temporarily disabled during migration.");

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
          title="Restructure article for better readability"
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
              <TooltipContent side="top" className="max-w-sm">
                <div className="text-sm font-medium mb-1">AutoScan</div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  Improves readability by restructuring paragraphs and lists while preserving meaning.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          AutoScan
        </Button>
      </div>

      <MagicOrbLoader
        open={processing}
        label="Restructuring your article for maximum readability..."
        duration={estimatedDuration}
      />
    </>
  );
});

AutoScanButton.displayName = "AutoScanButton";

export default AutoScanButton;
