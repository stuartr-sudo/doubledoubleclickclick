
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Link as LinkIcon, Search, Loader2, ExternalLink, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { InvokeLLM } from "@/api/integrations";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { Sitemap } from "@/api/entities";

export default function LinkSelector({ isOpen, onClose, onInsert, username }) {
  const [tab, setTab] = React.useState("manual");
  const [manualUrl, setManualUrl] = React.useState("");
  const [manualText, setManualText] = React.useState(""); // This will now be ignored for wrapping, but kept for other cases
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState([]);

  // Sitemap state
  const [sitemap, setSitemap] = React.useState(null);
  const [isLoadingSitemap, setIsLoadingSitemap] = React.useState(false);
  const [sitemapSearchQuery, setSitemapSearchQuery] = React.useState("");

  const { consumeTokensForFeature } = useTokenConsumption();

  // Load sitemap when sitemap tab is accessed
  React.useEffect(() => {
    if (tab === "sitemap" && !sitemap && username) {
      loadSitemap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, username]);

  // Reset fields when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setManualUrl("");
      setManualText("");
      setSearchQuery("");
      setSitemapSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const loadSitemap = async () => {
    if (!username) return;
    setIsLoadingSitemap(true);
    setSitemap(null); // Clear previous sitemap
    try {
      const userSitemaps = await Sitemap.filter({ user_name: username }, "-created_date", 1);
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
  };

  const handleManualInsert = async () => {
    const url = manualUrl.trim();
    if (!url) return;

    // Enforce feature flag + token deduction
    const tokenResult = await consumeTokensForFeature('ai_manual_link');
    if (!tokenResult?.success) {
      return; // do not insert if feature disabled or insufficient tokens
    }

    // Ensure URL has a protocol if not present
    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    // Pass the raw URL; the editor is responsible for wrapping the selection
    onInsert(finalUrl);

    // Clear inputs and close
    setManualUrl("");
    setManualText("");
    onClose && onClose();
  };

  const handleWebSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    // Check and consume tokens for web search
    const result = await consumeTokensForFeature('web_search');
    if (!result.success) {
      return; // Error toast is handled by the hook
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await InvokeLLM({
        prompt: `Find relevant web pages for: "${query}". Return a list of high-quality, authoritative web pages that would be good sources to link to. For each result, provide the URL, title, and a brief description.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" }
                },
                required: ["url", "title"]
              }
            }
          },
          required: ["results"]
        }
      });

      if (response?.results && Array.isArray(response.results)) {
        const validResults = response.results.
        filter((r) => r.url && r.title && r.url.startsWith('http')).
        slice(0, 10); // Limit to 10 results
        setSearchResults(validResults);

        if (validResults.length === 0) {
          toast.message("No relevant links found for your search query.");
        }
      } else {
        toast.error("Failed to parse search results.");
      }
    } catch (error) {
      console.error("Web search error:", error);
      toast.error("Failed to search the web. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInsertSearchResult = (result) => {
    const url = (result.url || "").trim();
    if (!url) return;

    onInsert(url); // Editor will wrap highlighted text with this link
    setSearchQuery("");
    setSearchResults([]);
    onClose && onClose();
  };

  const handleSitemapPageInsert = async (page) => {
    const url = (page.url || "").trim();
    if (!url) return;

    // NEW: Enforce feature flag + token deduction for sitemap links
    const tokenResult = await consumeTokensForFeature('ai_sitemap_link');
    if (!tokenResult?.success) {
      return; // Abort if feature is disabled or tokens are insufficient
    }

    onInsert(url); // Editor will wrap highlighted text with this link
    setSitemapSearchQuery("");
    onClose && onClose();
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  // Filter sitemap pages based on search
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-3xl w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-slate-900">Links</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg shrink-0">
            <TabsTrigger
              value="manual"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600 text-sm px-2 py-1">

              <LinkIcon className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Manual</span>
            </TabsTrigger>
            <TabsTrigger
              value="websearch"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600 text-sm px-2 py-1">

              <Search className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Web Search</span>
            </TabsTrigger>
            <TabsTrigger
              value="sitemap"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600 text-sm px-2 py-1">

              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Sitemap</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="pt-4 space-y-3">
            <Input
              placeholder="https://example.com/page"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleManualInsert)}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

            <Input
              placeholder="Link text (optional, uses selected text if available)"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleManualInsert)}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

            <div className="flex justify-end">
              <Button
                onClick={handleManualInsert}
                disabled={!manualUrl.trim()} className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-indigo-700">

                Insert
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="websearch" className="pt-4 space-y-3 flex-1 flex flex-col overflow-y-hidden">
            <div className="flex gap-2 shrink-0">
              <Input
                placeholder="Search for relevant pages to link to..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleWebSearch)}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 flex-1" />

              <Button
                onClick={handleWebSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-indigo-700 min-w-[96px]">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-200 rounded-md border border-slate-200 bg-white flex-1 mt-3">
              {isSearching &&
              <div className="text-slate-600 text-sm p-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Searching the web for relevant links...
                </div>
              }

              {!isSearching && searchResults.length === 0 && searchQuery &&
              <div className="text-slate-600 text-sm p-4 text-center">
                  No results found. Try a different search query.
                </div>
              }

              {!isSearching && searchResults.length === 0 && !searchQuery &&
              <div className="text-slate-600 text-sm p-4 text-center">
                  Enter a search query to find relevant pages to link to.
                </div>
              }

              {searchResults.map((result, idx) =>
              <button
                key={idx}
                onClick={() => handleInsertSearchResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group">

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate group-hover:text-indigo-600">
                        {result.title}
                      </div>
                      {result.description &&
                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {result.description}
                        </div>
                    }
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {result.url}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sitemap" className="pt-4 flex flex-col flex-1 overflow-hidden">
            {!username &&
            <div className="text-slate-600 text-sm p-4 text-center">
                This content is not associated with a username, so a sitemap cannot be loaded.
              </div>
            }

            {username && isLoadingSitemap &&
            <div className="text-slate-600 text-sm p-4 text-center">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                Loading sitemap...
              </div>
            }

            {username && !isLoadingSitemap && !sitemap &&
            <div className="text-slate-600 text-sm p-4 text-center">
                No sitemap found for the username "{username}". Create one in the Sitemap Manager first.
              </div>
            }

            {username && !isLoadingSitemap && sitemap &&
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
                  {getFilteredSitemapPages().length === 0 ?
                <div className="text-slate-600 text-sm p-4 text-center">
                      {sitemapSearchQuery ? 'No pages match your search.' : 'No pages found in this sitemap.'}
                    </div> :

                getFilteredSitemapPages().map((page, idx) =>
                <button
                  key={idx}
                  onClick={() => handleSitemapPageInsert(page)}
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
                )
                }
                </div>
              </div>
            }
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>);

}
