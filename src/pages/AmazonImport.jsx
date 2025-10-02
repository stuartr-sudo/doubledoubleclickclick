
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingBag, ExternalLink, Loader2, Wand2 } from "lucide-react";
import { amazonProduct } from "@/api/functions";
import { PromotedProduct } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { InvokeLLM } from "@/api/integrations";
import { Badge } from "@/components/ui/badge";
// Removed CustomContentTemplate import as it's no longer used
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 240;
const clampText = (s, max) => {
  if (!s) return "";
  const t = String(s).trim();
  return t.length <= max ? t : t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
};

function extractAsinFromUrl(url) {
  if (!url) return null;
  const m = String(url).match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

function buildProductHtml(meta) {
  const esc = (s) => (s || "").toString().replace(/"/g, "&quot;");
  const title = esc(clampText(meta.title, TITLE_LIMIT));
  const description = clampText(meta.description || "", DESCRIPTION_LIMIT);
  const image = meta.image || "";
  const productUrl = esc(meta.product_url || "#");
  const price = meta.price ? esc(meta.price) : "";
  const scope = `nbw-${Math.random().toString(36).slice(2, 8)}`;
  const css = `
<style>
.${scope} *{box-sizing:border-box}
.${scope} .card{background:#000;border:2px solid #fff;overflow:hidden;box-shadow:0 0 20px rgba(255,255,255,.3);display:flex;margin:16px 0;transition:all .3s ease}
.${scope} .card:hover{box-shadow:0 0 40px rgba(255,255,255,.6),inset 0 0 20px rgba(255,255,255,.1)}
.${scope} .img{flex:0 0 300px;background:#111;position:relative;overflow:hidden}
.${scope} .img img{width:100%;height:100%;object-fit:cover;filter:grayscale(100%) contrast(1.2);transition:filter .3s ease}
.${scope} .card:hover .img img{filter:grayscale(100%) contrast(1.4) brightness(1.1)}
.${scope} .body{flex:1;padding:28px;display:flex;flex-direction:column;justify-content:center}
.${scope} h3{font-size:1.6rem;margin:0 0 10px 0;color:#fff;text-shadow:0 0 15px rgba(255,255,255,.8)}
.${scope} .price{font-size:1.35rem;font-weight:700;color:#fff;margin:0 0 12px 0;text-shadow:0 0 20px rgba(255,255,255,1)}
.${scope} p{color:rgba(255,255,255,.8);margin:0 0 18px 0}
.${scope} .btn{background:#fff;color:#000;padding:12px 28px;border:none;font-size:15px;font-weight:700;cursor:pointer;transition:all .3s ease;text-transform:uppercase;letter-spacing:1px;box-shadow:0 0 20px rgba(255,255,255,.5);display:inline-block;text-decoration:none}
.${scope} .btn:hover{background:#000;color:#fff;border:2px solid #fff;box-shadow:0 0 30px rgba(255,255,255,.8),inset 0 0 15px rgba(255,255,255,.1)}
@media (max-width:768px){ .${scope} .card{flex-direction:column}. ${scope} .img{flex:1;height:200px;width:100%} }
</style>`.trim();

  return `
<div class="${scope}">
  ${css}
  <div class="card">
    <div class="img">
      ${image ? `<img src="${esc(image)}" alt="${title}" />` : ``}
    </div>
    <div class="body">
      <h3>${title}</h3>
      ${price ? `<div class="price">$${price.replace(/^\$/, '')}</div>` : ``}
      ${description ? `<p>${description.replace(/\n/g, "<br>")}</p>` : ``}
      <a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="btn">View Product →</a>
    </div>
  </div>
</div>`.trim();
}

// Removed applyCustomTemplateToMeta as it's no longer used

export default function AmazonImport() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [usernames, setUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [saving, setSaving] = useState(false);

  const [overrides, setOverrides] = useState({ title: "", description: "", price: "" });
  const [fieldLoading, setFieldLoading] = useState({ title: false, description: false });

  // Removed templates state
  // Removed selectedTemplateId state
  const [currentUser, setCurrentUser] = useState(null);

  const { consumeTokensForFeature } = useTokenConsumption();
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username based on workspace scoping
  const activeUsername = useWorkspaceScoping ? globalUsername : selectedUsername;

  const meta = useMemo(() => {
    if (!data) return null;
    const desc = data.product_description || (Array.isArray(data.about_product) ? data.about_product.join("\n") : "");
    const price = data.product_price || data.product_original_price || "";
    return {
      title: data.product_title || "",
      product_url: data.product_url || "",
      image: data.product_photo || "",
      description: desc || "",
      price: price ? String(price).replace(/^\$/, "") : "",
      asin: data.asin || ""
    };
  }, [data]);

  const finalMeta = useMemo(() => {
    if (!meta) return null;
    return {
      ...meta,
      title: overrides.title || meta.title,
      description: overrides.description || meta.description,
      price: overrides.price || meta.price
    };
  }, [meta, overrides]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        const all = await Username.list("-created_date").catch(() => []);
        const active = (all || []).filter((u) => u.is_active !== false).map((u) => u.user_name);
        const isSuperAdmin = user?.role === "admin" || user?.access_level === "full";
        let names = [];
        if (isSuperAdmin) {
          names = active;
        } else {
          const assigned = Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : [];
          const activeSet = new Set(active);
          names = assigned.filter((n) => activeSet.has(n));
        }
        names = Array.from(new Set(names)).sort();
        setUsernames(names);

        // Set selectedUsername based on workspace scoping
        if (useWorkspaceScoping) {
          setSelectedUsername(globalUsername || "");
        } else if (names.length > 0) {
          setSelectedUsername(names[0]);
        }

        // Removed template fetching logic
      } catch (error) {
        toast.error("Failed to load initial data.");
        console.error(error);
        setUsernames([]);
        setSelectedUsername("");
        // Removed template state resets
      }
    };
    loadInitialData();
  }, [useWorkspaceScoping, globalUsername]);

  // Sync selectedUsername with workspace selection when feature is on
  useEffect(() => {
    if (useWorkspaceScoping && globalUsername) {
      setSelectedUsername(globalUsername);
    }
  }, [useWorkspaceScoping, globalUsername]);

  const rewriteTitle = async () => {
    if (!meta) return;

    const tokenResult = await consumeTokensForFeature('ai_amazon_title_rewrite');
    if (!tokenResult.success) {
      return;
    }

    setFieldLoading((f) => ({ ...f, title: true }));
    try {
      const prompt = `Rewrite ONLY the product title to be concise, compelling, and SEO-friendly while preserving factual meaning and brand terms.
- Prefer 5–9 words
- No quotes
- Keep it under ${TITLE_LIMIT} characters.
Output ONLY the new title text

Current title: "${finalMeta?.title || meta.title}"
Description (for context): "${String(finalMeta?.description || meta.description || "").slice(0, 800)}"`;
      const res = await InvokeLLM({ prompt });
      const text = typeof res === "string" ? res.trim() : (res?.text || "").trim();
      if (text) setOverrides((o) => ({ ...o, title: text }));
    } finally {
      setFieldLoading((f) => ({ ...f, title: false }));
    }
  };

  const summarizeDescription = async () => {
    if (!meta) return;

    const tokenResult = await consumeTokensForFeature('ai_amazon_description_summarize');
    if (!tokenResult.success) {
      return;
    }

    setFieldLoading((f) => ({ ...f, description: true }));
    try {
      const prompt = `Summarize the product description into 3–5 crisp bullet points.
- Keep only the most important benefits and key specs
- Short, scannable bullets (max ~16 words each)
- No fluff
- Preserve brand/product terms
- Ensure the total length of the summarized description (all bullet points combined) is under ${DESCRIPTION_LIMIT} characters.
Output bullets, each on a new line starting with "- "

Title: "${finalMeta?.title || meta.title}"

Description:
${String(meta.description || "").slice(0, 4000)}`;
      const res = await InvokeLLM({ prompt });
      const text = typeof res === "string" ? res.trim() : (res?.text || "").trim();
      if (text) setOverrides((o) => ({ ...o, description: text }));
    } finally {
      setFieldLoading((f) => ({ ...f, description: false }));
    }
  };

  const handleFetch = async () => {
    setError("");
    setData(null);
    const trimmed = (input || "").trim();
    if (!trimmed) {
      setError("Please enter an Amazon URL or ASIN.");
      return;
    }

    // Check and consume tokens before making the API call
    const tokenResult = await consumeTokensForFeature('amazon_product_import'); // This was already present
    if (!tokenResult.success) {
      // Error toast is handled by the hook
      return;
    }

    setLoading(true);
    try {
      // Send either ASIN or full URL – backend handles both
      const asin = /^[A-Z0-9]{10}$/.test(trimmed.toUpperCase()) ? trimmed.toUpperCase() : extractAsinFromUrl(trimmed) || trimmed;
      const { data: res } = await amazonProduct({ url: asin });
      if (!res?.success) throw new Error(res?.error || "Failed to fetch product details.");
      setData(res.data);
      setOverrides({ title: "", description: "", price: "" }); // Reset overrides on new fetch
    } catch (e) {
      setError(e?.message || "Unexpected error while fetching product.");
    }
    setLoading(false);
  };

  const handleOpenInEditor = () => {
    if (!finalMeta) return;
    const html = buildProductHtml(finalMeta);
    localStorage.setItem("htmlstudio_content", html);
    window.location.href = createPageUrl("Editor?importHtml=1");
  };

  const handleSaveToLibrary = async () => {
    if (!finalMeta) return;
    setError("");

    const usernameToUse = useWorkspaceScoping ? globalUsername : selectedUsername;
    if (!usernameToUse) {
      setError("Please select a username to save this product.");
      return;
    }

    setSaving(true);
    try {
      const productUrlToSave = finalMeta.product_url || (finalMeta.asin ? `https://www.amazon.com/dp/${finalMeta.asin}` : "");
      if (!productUrlToSave) {
        throw new Error("Could not determine product URL from Amazon data. Please try a different ASIN/URL.");
      }
      const priceStr = finalMeta.price ?
        String(finalMeta.price).trim().startsWith("$") ? String(finalMeta.price).trim() : `$${String(finalMeta.price).trim()}` :
        "";

      await PromotedProduct.create({
        name: clampText(finalMeta.title, TITLE_LIMIT) || "Amazon Product",
        description: clampText(finalMeta.description, DESCRIPTION_LIMIT) || "",
        image_url: finalMeta.image || "",
        product_url: productUrlToSave,
        price: priceStr,
        user_name: usernameToUse,
        category: "amazon",
        // Removed template_key and custom_template_id
      });

      toast.success("Product saved to library"); // Updated toast message
    } catch (e) {
      const msg = e?.message || "Failed to save product to library.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <Card className="bg-white border border-slate-200 text-slate-900 shadow-sm overflow-hidden">
          {/* Header */}
          <CardHeader className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <ShoppingBag className="w-5 h-5 text-slate-700" />
                Amazon Import
              </CardTitle>
              {!!meta?.asin &&
                <Badge variant="outline" className="border-slate-200 text-slate-600">
                  ASIN: {meta.asin}
                </Badge>
              }
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Search Bar */}
            <div>
              <Label className="mb-2 block text-slate-700">Amazon URL or ASIN</Label>
              <div className="relative flex gap-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="https://www.amazon.com/.../dp/B0CX1FRR27 or B0CX1FRR27"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />

                <Button
                  onClick={handleFetch}
                  disabled={loading}
                  className="min-w-[110px] h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">

                  {loading ?
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetch
                    </> :

                    <>
                      <Search className="w-4 h-4 mr-2" /> Fetch
                    </>
                  }
                </Button>
              </div>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </div>

            {/* Result Grid */}
            {finalMeta &&
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preview Panel */}
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {finalMeta.image ?
                      <div className="relative w-full h-60 rounded-lg overflow-hidden bg-white border border-slate-200">
                        <img
                          src={finalMeta.image}
                          alt={finalMeta.title}
                          className="w-full h-full object-contain" />
                      </div> :

                      <div className="w-full h-60 rounded-lg border border-slate-200 grid place-items-center text-slate-400">
                        No image
                      </div>
                    }
                  </div>

                  {finalMeta.product_url &&
                    <a
                      href={finalMeta.product_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">

                      View on Amazon <ExternalLink className="w-4 h-4" />
                    </a>
                  }
                </div>

                {/* Meta editor */}
                <div className="space-y-5">
                  {/* Title with inline AI */}
                  <div>
                    <Label className="text-slate-700">Title</Label>
                    <div className="relative">
                      <Input
                        value={overrides.title || finalMeta.title}
                        onChange={(e) =>
                          setOverrides((o) => ({ ...o, title: e.target.value }))
                        }
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 pr-24" />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={rewriteTitle}
                        disabled={fieldLoading.title} className="bg-slate-300 text-slate-700 px-3 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground absolute right-1.5 top-1/2 -translate-y-1/2 h-8 border-slate-300 hover:bg-indigo-50"

                        title="Improve title with AI">

                        {fieldLoading.title ?
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Magic
                          </> :

                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Magic
                          </>
                        }
                      </Button>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {String(overrides.title || finalMeta.title || "").length} / {TITLE_LIMIT} chars
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <Label className="text-slate-700">Price</Label>
                    <Input
                      value={overrides.price || finalMeta.price}
                      onChange={(e) =>
                        setOverrides((o) => ({ ...o, price: e.target.value }))
                      }
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                      placeholder="$29.99" />

                  </div>

                  {/* Description with inline AI */}
                  <div>
                    <Label className="text-slate-700">Description (AI summarized)</Label>
                    <div className="relative">
                      <Textarea
                        value={overrides.description || finalMeta.description}
                        onChange={(e) =>
                          setOverrides((o) => ({ ...o, description: e.target.value }))
                        }
                        rows={7}
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 pr-28" />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={summarizeDescription}
                        disabled={fieldLoading.description} className="bg-slate-300 text-gray-800 px-3 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground absolute right-1.5 top-1.5 h-8 border-slate-300 hover:bg-indigo-50"

                        title="Summarize with AI">

                        {fieldLoading.description ?
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Summarize
                          </> :

                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Summarize
                          </>
                        }
                      </Button>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {String(overrides.description || finalMeta.description || "").length} / {DESCRIPTION_LIMIT} chars
                    </div>
                  </div>
                </div>
              </div>
            }

            {/* Actions */}
            {finalMeta &&
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex gap-2 flex-1">
                  {/* Removed Dynamic Template selector */}
                </div>

                <div className="flex gap-2">
                  {/* Username selector - conditionally rendered */}
                  {useWorkspaceScoping ? (
                    <Input
                      value={globalUsername || "No workspace selected"}
                      disabled
                      className="bg-slate-100 border-slate-300 text-slate-500 min-w-[160px]"
                    />
                  ) : (
                    <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900 min-w-[160px]">
                        <SelectValue placeholder="Assign to username" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 text-slate-900">
                        {usernames.map((u) =>
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    onClick={handleSaveToLibrary}
                    disabled={!activeUsername || saving}
                    className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] shadow-sm">
                    {saving ?
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                      </> :
                      "Save to Library"
                    }
                  </Button>
                </div>
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
