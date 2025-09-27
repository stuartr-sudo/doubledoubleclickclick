
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
  const [manualText, setManualText] = React.useState("");
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

  const handleManualInsert = () => {
    const url = manualUrl.trim();
    if (!url) return;
    const label = manualText.trim() || url.replace(/^https?:\/\//, ""); // Fallback to URL without http(s)://

    // Ensure URL has a protocol if not present
    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    onInsert(`<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`);
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
    const title = result.title.trim();
    const url = result.url.trim();

    onInsert(`<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`);
    onClose && onClose();
  };

  const handleSitemapPageInsert = (page) => {
    const title = page.title.trim();
    const url = page.url.trim();

    onInsert(`<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`);
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
    return sitemap.pages.filter(page =>
      page.title?.toLowerCase().includes(query) ||
      page.url?.toLowerCase().includes(query)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Links</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="manual" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">
              <LinkIcon className="w-4 h-4 mr-2" />Manual
            </TabsTrigger>
            <TabsTrigger value="websearch" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">
              <Search className="w-4 h-4 mr-2" />Web Search
            </TabsTrigger>
            <TabsTrigger value="sitemap" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">
              <MapPin className="w-4 h-4 mr-2" />Sitemap
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
              placeholder="Link text (optional)"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleManualInsert)}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

            <div className="flex justify-end">
              <Button
                onClick={handleManualInsert}
                disabled={!manualUrl.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Insert
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="websearch" className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search for relevant pages to link to..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleWebSearch)}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 flex-1" />

              <Button
                onClick={handleWebSearch}
                disabled={isSearching || !searchQuery.trim()} className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-indigo-700 min-w-[96px]">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
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

          <TabsContent value="sitemap" className="pt-4 space-y-3">
            {!username && (
              <div className="text-slate-600 text-sm p-4 text-center">
                This content is not associated with a username, so a sitemap cannot be loaded.
              </div>
            )}

            {username && isLoadingSitemap && (
              <div className="text-slate-600 text-sm p-4 text-center">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                Loading sitemap...
              </div>
            )}

            {username && !isLoadingSitemap && !sitemap && (
              <div className="text-slate-600 text-sm p-4 text-center">
                No sitemap found for the username "{username}". Create one in the Sitemap Manager first.
              </div>
            )}

            {username && !isLoadingSitemap && sitemap && (
              <>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-sm font-medium text-slate-800">Sitemap for: <span className="font-bold">{sitemap.domain}</span></p>
                  <p className="text-xs text-slate-500">{sitemap.pages?.length || 0} pages found</p>
                </div>

                <Input
                  placeholder="Search pages..."
                  value={sitemapSearchQuery}
                  onChange={(e) => setSitemapSearchQuery(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                />

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
                  {getFilteredSitemapPages().length === 0 ? (
                    <div className="text-slate-600 text-sm p-4 text-center">
                      {sitemapSearchQuery ? 'No pages match your search.' : 'No pages found in this sitemap.'}
                    </div>
                  ) : (
                    getFilteredSitemapPages().map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSitemapPageInsert(page)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>);

}
