import React, { useState, useEffect, useRef } from "react";
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
import { useCredentials } from "@/components/providers/CredentialsProvider";

export default function FloatingPublishButton({
  isPublishing,
  showPublishOptions = true,
  onDownloadTxt,
  onPublishToGoogleDocs,
  onOpenPublishOptions,
  onPublishToConfigured,
  isSavingAuto,
  lastSaved,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { credentials, loadCredentials } = useCredentials();

  const [showSaved, setShowSaved] = React.useState(false);
  const savedTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (!lastSaved) return;
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

  // Load credentials from cache on mount
  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  return (
    <div
      className="fixed right-6 z-10 flex flex-col items-end gap-2 pointer-events-auto"
      style={{ top: '200px' }}
    >
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
        <DropdownMenuContent align="end" className="w-56 max-h-[400px] overflow-y-auto">
          <DropdownMenuItem onClick={onDownloadTxt}>
            <Download className="w-4 h-4 mr-2" />
            Download as TXT
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPublishToGoogleDocs}>
            <FileText className="w-4 h-4 mr-2" />
            Publish to Google Docs
          </DropdownMenuItem>

          {credentials.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {credentials.map((credential) => (
                <DropdownMenuItem 
                  key={credential.id}
                  onClick={() => {
                    onPublishToConfigured && onPublishToConfigured(credential);
                  }}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Publish to {credential.name}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onOpenPublishOptions}>
            <Settings className="w-4 h-4 mr-2" />
            Configure Publishing
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isSavingAuto && (
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 text-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
          <span className="text-slate-600">Saving…</span>
        </div>
      )}

      {!isSavingAuto && showSaved && lastSaved && (
        <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 text-xs text-slate-600 transition-opacity duration-500 opacity-100">
          Saved {savedTimeLabel}
        </div>
      )}
    </div>
  );
}