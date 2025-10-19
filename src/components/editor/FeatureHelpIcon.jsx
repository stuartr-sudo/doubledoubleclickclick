
import React from "react";
import { HelpCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/api/supabaseClient";
import VideoModal from "@/components/common/VideoModal";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export default function FeatureHelpIcon({
  featureFlagName,
  label = "Help",
  description = "Learn more about this feature.",
  className = "",
  size = "sm"
}) {
  const [videoUrl, setVideoUrl] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Fetch FeatureFlag by name to get tutorial URLs (if any)
        const flags = await base44.entities.FeatureFlag.filter({ name: featureFlagName });
        const flag = Array.isArray(flags) ? flags[0] : null;
        if (!mounted) return;
        const loom = flag?.loom_tutorial_url;
        const yt = flag?.youtube_tutorial_url;
        // Prefer Loom, then YouTube
        setVideoUrl(loom || yt || null);
      } catch {
        // Ignore; still show the help tooltip/title even if video not set
        if (mounted) setVideoUrl(null);
      }
    };
    load();
    return () => { mounted = false; };
  }, [featureFlagName]);

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={size}
              className={`h-8 w-8 p-0 text-slate-600 hover:text-slate-900 ${className}`}
              // Removed native title to avoid browser tooltip delay
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (videoUrl) setOpen(true);
              }}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" className="max-w-xs text-sm">
            <div>{description}</div>
            {videoUrl && (
              <div className="mt-1 text-xs text-slate-500">Click to watch a quick tutorial</div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <VideoModal
        isOpen={open}
        onClose={() => setOpen(false)}
        videoUrl={videoUrl}
        title={`How it works: ${label}`}
      />
    </>
  );
}
