import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Sitemap } from "@/api/entities";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import { InvokeLLM } from "@/api/integrations";

export default function CtaTemplateFillModal({ isOpen, onClose, onInsert, selectedTemplate, pageHtml, pageTitle, preferredUsername }) {
  const [buttonText, setButtonText] = useState("Learn more");
  const [buttonUrl, setButtonUrl] = useState("#");
  const [magicLoading, setMagicLoading] = useState(false);
  
  // Sitemap state
  const [sitemap, setSitemap] = useState(null);
  const [isLoadingSitemap, setIsLoadingSitemap] = useState(false);
  const [sitemapSearchQuery, setSitemapSearchQuery] = useState("");

  const { consumeTokensForFeature } = useTokenConsumption();

  const loadSitemap = useCallback(async () => {
    if (!preferredUsername) return;
    setIsLoadingSitemap(true);
    setSitemap(null);
    try {
      const userSitemaps = await Sitemap.filter({ user_name: preferredUsername }, "-created_date", 1);
      if (userSitemaps && userSitemaps.length > 0) {
        setSitemap(userSitemaps[0]);
      } else {
        setSitemap(null);
      }
    } catch (error) {
      console.error("Error loading sitemap:", error);
      toast.error("Failed to load sitemap");
    } finally {
      setIsLoadingSitemap(false);
    }
  }, [preferredUsername]);

  const getFilteredSitemapPages = () => {
    if (!sitemap?.pages) return [];
    if (!sitemapSearchQuery.trim()) {
      return sitemap.pages;
    }
    const query = sitemapSearchQuery.toLowerCase();
    return sitemap.pages.filter((page) =>
      page.title?.toLowerCase().includes(query) ||
      page.url?.toLowerCase().includes(query)
    );
  };

  useEffect(() => {
    if (isOpen && selectedTemplate) {
      setButtonText("Learn more");
      setButtonUrl("#");
      setSitemapSearchQuery("");
      loadSitemap();
    }
  }, [isOpen, selectedTemplate, loadSitemap]);

  const handleMagicButton = async () => {
    if (!pageHtml || !pageTitle) {
      toast.error("No page content available for AI suggestions.");
      return;
    }

    // Check and consume tokens for the cta-title-rewrite feature
    const tokenResult = await consumeTokensForFeature('cta-title-rewrite');
    if (!tokenResult.success) {
      return;
    }

    setMagicLoading(true);
    try {
      const truncatedHtml = pageHtml.substring(0, 3000);
      
      const prompt = `Based on this page content, suggest a compelling CTA button text (max 3 words):

Title: ${pageTitle}

Content: ${truncatedHtml}

Return ONLY the button text, nothing else.`;

      const response = await InvokeLLM({ prompt });
      
      const suggestion = (typeof response === 'string' ? response : response?.text || '').trim();
      
      if (!suggestion) {
        toast.error("AI didn't return a suggestion. Please try again.");
        return;
      }

      setButtonText(suggestion);
      toast.success("AI suggested button text!");
    } catch (error) {
      console.error("Failed to get AI suggestion:", error);
      toast.error("Failed to get AI suggestion.");
    } finally {
      setMagicLoading(false);
    }
  };

  const handleSitemapPageSelect = (page) => {
    setButtonUrl(page.url);
    toast.success("URL selected from sitemap");
  };

  const handleInsert = () => {
    if (!buttonText.trim()) {
      toast.error("Button text is required");
      return;
    }

    const values = {
      button_text: buttonText,
      button_url: buttonUrl,
      headline: "",
      subtext: ""
    };

    onInsert(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Fill CTA Details</DialogTitle>
          <p className="text-sm text-slate-600">
            Set the button text and link.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4 flex-shrink-0">
          <div>
            <Label htmlFor="button_text">Button Text</Label>
            <div className="flex gap-2">
              <Input
                id="button_text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Learn more"
                className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleMagicButton}
                disabled={magicLoading}
                title="AI suggest button text">
                {magicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="button_url">Button URL</Label>
            <Input
              id="button_url"
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
              placeholder="Paste URL or select from sitemap below"
              className="bg-white text-slate-900 border border-slate-300" />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden mt-4">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <MapPin className="w-4 h-4 text-slate-600" />
            <Label className="text-sm font-medium">Choose from Sitemap</Label>
          </div>

          {!preferredUsername && (
            <div className="text-slate-600 text-sm p-4 text-center">
              This content is not associated with a username, so a sitemap cannot be loaded.
            </div>
          )}

          {preferredUsername && isLoadingSitemap && (
            <div className="text-slate-600 text-sm p-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Loading sitemap...
            </div>
          )}

          {preferredUsername && !isLoadingSitemap && !sitemap && (
            <div className="text-slate-600 text-sm p-4 text-center">
              No sitemap found for the username "{preferredUsername}". Create one in the Sitemap Manager first.
            </div>
          )}

          {preferredUsername && !isLoadingSitemap && sitemap && (
            <div className="w-full flex flex-col flex-1 overflow-hidden">
              <div className="shrink-0 space-y-3">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-sm font-medium text-slate-800">Sitemap for: <span className="font-bold">{sitemap.domain}</span></p>
                  <p className="text-xs text-slate-500">{sitemap.pages?.length || 0} pages found</p>
                </div>

                <Input
                  placeholder="Search pages..."
                  value={sitemapSearchQuery}
                  onChange={(e) => setSitemapSearchQuery(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
              </div>

              <div className="overflow-y-auto divide-y divide-slate-200 rounded-md border border-slate-200 bg-white w-full flex-1 mt-3">
                {getFilteredSitemapPages().length === 0 ? (
                  <div className="text-slate-600 text-sm p-4 text-center">
                    {sitemapSearchQuery ? 'No pages match your search.' : 'No pages found in this sitemap.'}
                  </div>
                ) : (
                  getFilteredSitemapPages().map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSitemapPageSelect(page)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group block">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="font-medium text-slate-900 truncate group-hover:text-indigo-600">
                            {page.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 truncate">
                            {page.url}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 flex-shrink-0 mt-0.5" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!buttonText.trim()}>
            Insert CTA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}