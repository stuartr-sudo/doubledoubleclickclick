
import React, { useState } from "react";
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
import { base44 } from "@/api/base44Client";

export default function FloatingPublishButton({
  isPublishing,
  showPublishOptions = true,
  onDownloadTxt,
  onPublishToGoogleDocs,
  onPublishToShopify,
  onOpenPublishOptions,
  onPublishToConfigured,
  isSavingAuto,
  lastSaved,
}) {
  const [configuredCredentials, setConfiguredCredentials] = useState([]);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  // Load credentials ONLY when dropdown opens, and only once
  const handleDropdownOpenChange = async (open) => {
    setDropdownOpen(open);
    
    if (open && !credentialsLoaded) {
      setCredentialsLoaded(true); // Mark as loaded immediately to prevent duplicate calls
      
      try {
        // Add 1.5 second delay to avoid rate limit on initial load
        await new Promise(res => setTimeout(res, 1500));
        
        const user = await base44.auth.me();
        const assignedUsernames = Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : [];
        
        if (assignedUsernames.length === 0) {
          setConfiguredCredentials([]);
          return;
        }

        const allCreds = [];
        for (let i = 0; i < assignedUsernames.length; i++) {
          if (i > 0) {
            // 1 second delay between each username request
            await new Promise(res => setTimeout(res, 1000));
          }
          
          try {
            const creds = await base44.entities.IntegrationCredential.filter(
              { user_name: assignedUsernames[i] }, 
              "-updated_date"
            );
            if (creds && creds.length > 0) {
              allCreds.push(...creds);
            }
          } catch (err) {
            // If rate limited, stop trying and silently fail
            if (err?.response?.status === 429) {
              console.warn("Rate limit hit, stopping credential load");
              break;
            }
            // For other errors, continue with next username
            continue;
          }
        }
        
        setConfiguredCredentials(allCreds);
      } catch (error) {
        // Silent fail - credentials section just won't show
        if (error?.response?.status !== 429) {
          console.warn("Failed to load credentials:", error?.message);
        }
        setConfiguredCredentials([]);
      }
    }
  };

  // Check if user has any Shopify credentials configured
  const hasShopifyCredential = configuredCredentials.some(
    cred => cred.provider === 'shopify'
  );

  return (
    <div
      className="fixed right-6 z-[300] flex flex-col items-end gap-2 pointer-events-auto"
      style={{ top: '200px' }}
    >
      <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
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

          {configuredCredentials.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {configuredCredentials.map((credential) => (
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
          
          {/* Only show "Publish to Shopify" if user has a Shopify credential configured */}
          {hasShopifyCredential && (
            <DropdownMenuItem onClick={onPublishToShopify}>
              <Globe className="w-4 h-4 mr-2" />
              Publish to Shopify
            </DropdownMenuItem>
          )}
          
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
        <div
          className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 text-xs text-slate-600 transition-opacity duration-500 opacity-100"
        >
          Saved {savedTimeLabel}
        </div>
      )}
    </div>
  );
}
