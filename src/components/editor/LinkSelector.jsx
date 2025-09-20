import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Link as LinkIcon, Loader2 } from "lucide-react";
import { ingestSitemap } from "@/api/functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sitemap } from "@/api/entities";

export default function LinkSelector({ isOpen, onClose, onInsert, onOpenSitemap }) {
  const [tab, setTab] = React.useState("manual");
  const [manualUrl, setManualUrl] = React.useState("");
  const [manualText, setManualText] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [pages, setPages] = React.useState([]);

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

  const handleFetchSitemap = async () => {
    const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!d) return;
    setIsLoading(true);
    setPages([]); // Clear previous pages
    try {
      // try cache
      let s = (await Sitemap.filter({ domain: d }))[0];
      if (!s) {
        await ingestSitemap({ domain: d });
        s = (await Sitemap.filter({ domain: d }))[0];
      }
      setPages(Array.isArray(s?.pages) ? s.pages : []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertSitemap = (p) => {
    if (!p?.url) return;
    onInsert(`<a href="${p.url}" target="_blank" rel="noopener noreferrer">${p.title || p.url}</a>`);
    onClose && onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Insert Link</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="manual" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600"><LinkIcon className="w-4 h-4 mr-2" />Manual</TabsTrigger>
            <TabsTrigger value="sitemap" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600"><Globe className="w-4 h-4 mr-2" />Sitemap</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="pt-4 space-y-3">
            <Input 
              placeholder="https://example.com/page" 
              value={manualUrl} 
              onChange={(e)=>setManualUrl(e.target.value)} 
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            />
            <Input 
              placeholder="Link text (optional)" 
              value={manualText} 
              onChange={(e)=>setManualText(e.target.value)} 
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            />
            <div className="flex justify-end">
              <Button onClick={handleManualInsert} disabled={!manualUrl.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">Insert</Button>
            </div>
          </TabsContent>

          <TabsContent value="sitemap" className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Input 
                placeholder="example.com" 
                value={domain} 
                onChange={(e)=>setDomain(e.target.value)} 
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
              <Button onClick={handleFetchSitemap} disabled={isLoading || !domain.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[96px]">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
              </Button>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 rounded-md border border-slate-200">
              {pages.map((p, idx) => (
                <button key={idx} onClick={()=>handleInsertSitemap(p)} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-900">
                  <div className="text-sm">{p.title || p.url}</div>
                  <div className="text-xs text-slate-600 truncate">{p.url}</div>
                </button>
              ))}
              {(!isLoading && pages.length === 0) && (
                <div className="text-slate-600 text-sm p-3">Enter a domain to load its sitemap.xml</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}