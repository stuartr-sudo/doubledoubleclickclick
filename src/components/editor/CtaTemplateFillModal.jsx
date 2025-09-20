
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed: import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Wand2, Link as LinkIcon, Search } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { Sitemap } from "@/api/entities";

export default function CtaTemplateFillModal({ isOpen, onCancel, onSubmit, template, pageHtml, pageTitle, preferredUsername }) {
  const [headline, setHeadline] = React.useState("");
  const [subtext, setSubtext] = React.useState("");
  const [buttonText, setButtonText] = React.useState("Learn more");
  const [buttonUrl, setButtonUrl] = React.useState("#");

  // AI loading flags
  const [loadingHeadline, setLoadingHeadline] = React.useState(false);
  const [loadingSubtext, setLoadingSubtext] = React.useState(false);
  const [loadingButton, setLoadingButton] = React.useState(false);

  // Sitemaps / pages search
  const [pages, setPages] = React.useState([]);
  const [pageSearch, setPageSearch] = React.useState("");
  const [sitesOpen, setSitesOpen] = React.useState(false);
  const [loadingSites, setLoadingSites] = React.useState(false);
  const [usernames, setUsernames] = React.useState([]);
  const [selectedUsername, setSelectedUsername] = React.useState("all");

  // Helpers
  const normalizeUrl = (u) => {
    if (!u) return "#";
    let s = String(u).trim();
    if (s === "" || s === "#") return "#";
    // Check if it's a relative path starting with /
    if (s.startsWith('/')) {
        return s; // Keep as relative path
    }
    // Check if it's already an absolute URL
    if (!/^https?:\/\//i.test(s)) {
        s = "https://" + s; // Prepend https:// if not present
    }
    return s;
  };

  const pagePlain = React.useMemo(() => {
    const html = String(pageHtml || "");
    return html.replace(/<style[\s\S]*?<\/style>/gi, "")
               .replace(/<script[\s\S]*?<\/script>/gi, "")
               .replace(/<[^>]+>/g, " ")
               .replace(/\s+/g, " ")
               .trim()
               .slice(0, 8000); // keep prompt compact
  }, [pageHtml]);

  // Prefill from template preview_data if present
  React.useEffect(() => {
    if (!isOpen) return;

    const pd = template?.preview_data || {};
    setHeadline(pd.title || "");
    setSubtext(pd.content || "");
    setButtonText(pd.button_text || "Learn more"); // Ensure default if not present
    setButtonUrl(pd.button_url || "#"); // Ensure default if not present
    setSelectedUsername(preferredUsername || "all");

    // Load sitemaps/pages
    (async () => {
      setLoadingSites(true);
      try {
        // Fetch most recent sitemaps and flatten to pages
        const maps = await Sitemap.list("-updated_date", 50); // Fetch more sitemaps
        const flattened = [];
        const unameSet = new Set();
        (maps || []).forEach((m) => {
          const owner = m.user_name || "unknown";
          unameSet.add(owner);
          (m?.pages || []).forEach((p) => {
            if (p?.url) {
              flattened.push({
                title: p.title || p.url,
                url: p.url,
                domain: m.domain || "",
                user_name: owner // Add user_name to each page
              });
            }
          });
        });
        setPages(flattened);
        setUsernames(["all", ...Array.from(unameSet).sort((a, b) => String(a).localeCompare(String(b)))]);
      } finally {
        setLoadingSites(false);
      }
    })();
  }, [isOpen, template, preferredUsername]);

  // Filtering logic
  const filteredPages = React.useMemo(() => {
    const q = (pageSearch || "").toLowerCase();
    return (pages || [])
      .filter((p) => selectedUsername === "all" || p.user_name === selectedUsername)
      .filter((p) =>
        !q || // If query is empty, don't filter by query
        (p.title || "").toLowerCase().includes(q) ||
        (p.url || "").toLowerCase().includes(q) ||
        (p.domain || "").toLowerCase().includes(q)
      );
  }, [pages, pageSearch, selectedUsername]);


  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onSubmit({
      headline,
      subtext,
      button_text: buttonText,
      button_url: normalizeUrl(buttonUrl)
    });
  };

  // AI generators
  const ctxHint = React.useMemo(() => {
    // Build a small context string for better AI CTA
    const tName = template?.name ? `Template: ${template.name}.` : "";
    const tDesc = template?.description ? ` ${template.description}` : "";
    return `${tName}${tDesc}`.trim();
  }, [template]);

  const generateHeadline = async () => {
    setLoadingHeadline(true);
    try {
      const res = await InvokeLLM({
        prompt: `Write a short, high-conversion CTA headline for the following page.
Rules:
- 3–7 words, strong verb, no punctuation.
- Fit naturally above a CTA button.
- Output ONLY the headline text.
Page title: ${pageTitle || "(untitled)"}
Context (excerpt): ${pagePlain}
${ctxHint ? "Template context: " + ctxHint : ""}`
      });
      setHeadline(String(res || "").trim().replace(/^["'“”‘’]|["'“”‘’]$/g, ""));
    } finally {
      setLoadingHeadline(false);
    }
  };

  const generateSubtext = async () => {
    setLoadingSubtext(true);
    try {
      const res = await InvokeLLM({
        prompt: `Write a concise CTA supporting sentence for this page.
Rules:
- 12–24 words, clear value proposition, reduce friction.
- No quotes; output only the sentence.
Page title: ${pageTitle || "(untitled)"}
Context (excerpt): ${pagePlain}
${ctxHint ? "Template context: " + ctxHint : ""}`
      });
      setSubtext(String(res || "").trim().replace(/^["'“”‘’]|["'“”‘’]$/g, ""));
    } finally {
      setLoadingSubtext(false);
    }
  };

  const generateButton = async () => {
    setLoadingButton(true);
    try {
      const res = await InvokeLLM({
        prompt: `Return a perfect short CTA button label for this page.
Rules:
- 1–3 words, ≤16 characters.
- Strong action verb, no emojis, no punctuation.
- Examples: "Get Quote", "Shop Now", "Start Free Trial".
- Output ONLY the label.
Page title: ${pageTitle || "(untitled)"}
Context (excerpt): ${pagePlain}
${ctxHint ? "Template context: " + ctxHint : ""}`
      });
      setButtonText(String(res || "").trim().replace(/^["'“”‘’]|["'“”‘’]$/g, ""));
    } finally {
      setLoadingButton(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel?.(); }}>
      <DialogContent className="max-w-lg bg-white text-slate-900 border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Fill CTA Details</DialogTitle>
          <DialogDescription className="text-slate-600">
            Set the button text and link; optional headline and subtext will also be inserted if the template uses them.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Headline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-slate-600">Headline (optional)</label>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2 py-1 text-xs bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                onClick={generateHeadline}
                disabled={loadingHeadline}
              >
                {loadingHeadline ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                AI generate
              </Button>
            </div>
            <Input
              className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
              placeholder="e.g., Get your free quote"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>

          {/* Subtext */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-slate-600">Subtext (optional)</label>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2 py-1 text-xs bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                onClick={generateSubtext}
                disabled={loadingSubtext}
              >
                {loadingSubtext ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                AI generate
              </Button>
            </div>
            <Textarea
              className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
              placeholder="One or two sentences to support the CTA"
              value={subtext}
              onChange={(e) => setSubtext(e.target.value)}
            />
          </div>

          {/* Button row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm text-slate-600">Button Text</label>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2 py-1 text-xs bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  onClick={generateButton}
                  disabled={loadingButton}
                >
                  {loadingButton ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                  AI generate
                </Button>
              </div>
              <Input
                className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
                placeholder="e.g., Call Us"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                required
              />
            </div>

            {/* Button URL with sitemap picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm text-slate-600">Button URL</label>
                <Popover open={sitesOpen} onOpenChange={setSitesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2 py-1 text-xs bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <LinkIcon className="w-3.5 h-3.5 mr-1" /> From Sitemap
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(90vw,28rem)] p-3 bg-white text-slate-900 border border-slate-200 shadow-xl max-h-[70vh] overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <div className="md:col-span-2 relative">
                        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search pages by title, URL, or domain"
                          value={pageSearch}
                          onChange={(e) => setPageSearch(e.target.value)}
                          className="pl-8 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                          <SelectTrigger className="bg-white text-slate-900 border border-slate-300">
                            <SelectValue placeholder="All brands" />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-slate-900 border border-slate-200">
                            {usernames.map((u) => (
                              <SelectItem key={u} value={u}>{u === "all" ? "All brands" : u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Scrollable list: supports mouse wheel and scrollbar drag */}
                    <div
                      className="h-[48vh] overflow-y-auto rounded-md border border-slate-200 bg-white touch-pan-y"
                      onWheel={(e) => { e.stopPropagation(); }}
                    >
                      {loadingSites ? (
                        <div className="p-3 text-sm text-slate-500 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading sitemap…
                        </div>
                      ) : filteredPages.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500">No pages found. Try changing brand or search.</div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {filteredPages.map((p, idx) => (
                            <button
                              key={idx}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-900"
                              onClick={() => {
                                setButtonUrl(p.url);
                                setSitesOpen(false);
                              }}
                            >
                              <div className="text-sm font-medium">{p.title}</div>
                              <div className="text-xs text-slate-600 truncate">{p.url}</div>
                              {p.domain && <div className="text-[11px] text-slate-400 mt-0.5">{p.domain} • {p.user_name}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Input
                className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
                placeholder="https://example.com/contact"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Insert CTA
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
