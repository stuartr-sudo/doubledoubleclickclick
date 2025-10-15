
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  ChevronDown,
  Loader2,
  Download,
  FileText,
  Globe,
  Settings,
} from "lucide-react";

function getHeaderBottom() {
  try {
    const candidates = [
      document.querySelector("nav"),
      document.querySelector(".topbar"),
      document.querySelector("#app-header"),
      document.querySelector("header"),
    ].filter(Boolean);

    const bottoms = candidates.map((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom || 0;
    });

    const maxBottom = bottoms.length ? Math.max(...bottoms) : 0;
    return Math.max(0, maxBottom) + 8;
  } catch {
    return 16;
  }
}

export default function FloatingPublishButton({
  isPublishing,
  isFreeTrial,
  showPublishOptions,
  onDownloadTxt,
  onPublishToGoogleDocs,
  onPublishToShopify,
  onOpenPublishOptions,
  isSavingAuto,
  lastSaved,
}) {
  // REMOVED: const topOffset = getHeaderBottom();

  // NEW: local visibility controller for the "Saved" pill
  const [showSaved, setShowSaved] = React.useState(false);
  const savedTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (!lastSaved) return;
    // Show the saved pill for a short duration after any save completes
    setShowSaved(true);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setShowSaved(false), 3000);
    return () => savedTimeoutRef.current && clearTimeout(savedTimeoutRef.current);
  }, [lastSaved]);

  const savedTimeLabel = React.useMemo(() => {
    try {
      return new Date(lastSaved).toLocaleTimeString();
    } catch {
      return "";
    }
  }, [lastSaved]);

  return (
    <div
      className="fixed right-6 z-[300] flex flex-col items-end gap-2 pointer-events-auto"
      style={{ top: '200px' }}
    >
      {/* Publish dropdown button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isPublishing}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-xl hover:shadow-2xl transition-all duration-200 px-5 h-11"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Publish
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onDownloadTxt}>
            <Download className="w-4 h-4 mr-2" />
            Download as TXT
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPublishToGoogleDocs}>
            <FileText className="w-4 h-4 mr-2" />
            Publish to Google Docs
          </DropdownMenuItem>

          {!isFreeTrial ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onPublishToShopify}>
                <Globe className="w-4 h-4 mr-2" />
                Publish to Shopify
              </DropdownMenuItem>
              {showPublishOptions && (
                <DropdownMenuItem onClick={onOpenPublishOptions}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Publishing
                </DropdownMenuItem>
              )}
            </>
          ) : (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-slate-500">
                <span className="font-medium">Upgrade to unlock:</span>
                <br />• Shopify, WordPress, Notion, Webflow
                <br />• Custom webhooks
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* NEW: status pills under the Publish button */}
      {isSavingAuto && (
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 text-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
          <span className="text-slate-600">Saving…</span>
        </div>
      )}

      {!isSavingAuto && showSaved && lastSaved && (
        <div
          className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 text-xs text-slate-600 transition-opacity duration-500 opacity-100"
          // We keep it simple; the fade is driven by the timeout-controlled visibility
        >
          Saved {savedTimeLabel}
        </div>
      )}
    </div>
  );
}
