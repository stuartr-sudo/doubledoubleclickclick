
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Link as LinkIcon, Wand2, Image as ImageIcon, DollarSign, ShoppingBag, Plus } from "lucide-react"; // NEW: Added Plus
import { amazonProduct } from "@/api/functions";
import { InvokeLLM } from "@/api/integrations";
import { toast } from "sonner";

export default function AmazonProductImporter({ isOpen, onClose, onInsert, initialUrl = "" }) {
  const [url, setUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setLoading(false);
      setAiLoading(false);
      setTitle("");
      setDescription("");
      setImage("");
      setPrice("");
      setProductUrl("");
    } else if (initialUrl && !url) {
      setUrl(initialUrl);
    }
  }, [isOpen, initialUrl, url]); // Added initialUrl, url to dependency array for useEffect safety

  const isAmazon = useMemo(() => (url || "").includes("amazon."), [url]);

  const pick = (...vals) => vals.find(v => !!v && String(v).trim().length > 0);

  const toBulletsHtml = (text) => {
    // Expect lines starting with "-" or "•"; fallback to sentences
    const lines = String(text)
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.replace(/^(\-|\•)\s?/, "").trim())
      .filter(Boolean);

    if (lines.length >= 2) {
      return `<ul style="margin:0 0 12px 18px;padding:0;line-height:1.55;color:#555;">${lines.slice(0, 5).map(li => `<li>${li}</li>`).join("")}</ul>`;
    }

    // fallback to a short paragraph
    return `<p style="margin:0 0 12px 0;color:#555;line-height:1.55;">${text}</p>`;
  };

  // NEW: build compact, recognized product HTML (selectable/deletable)
  const buildProductHtml = (meta) => {
    const esc = (s) => (s || '').toString().replace(/"/g, '&quot;');
    const title = esc(meta.title || "Product");
    const url = esc(meta.product_url || "#");
    const price = String(meta.price || "").trim();
    const priceHtml = price ? `<span style="font-size:1.05rem;font-weight:700;color:#0ea5e9;margin-right:10px;">${price.startsWith('$') ? price : '$' + price}</span>` : '';
    const img = meta.image ? `<img src="${esc(meta.image)}" alt="${title}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />` : '';
    const descHtml = toBulletsHtml(meta.description || "");

    return `
<div class="b44-promoted-product" data-b44-block="product" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,.06);display:flex;gap:14px;align-items:flex-start;margin:12px 0;padding:12px;flex-wrap:wrap;">
  <div style="flex:0 0 220px;min-height:140px;overflow:hidden;border-radius:8px;background:#f3f4f6;">
    ${img}
  </div>
  <div style="flex:1 1 300px;min-width:240px;">
    <h3 style="margin:0 0 8px 0;color:#111827;font-size:1.15rem;font-weight:800;line-height:1.3;">${title}</h3>
    ${descHtml}
    <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
      ${priceHtml}
      <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#0ea5e9;color:white;padding:8px 14px;border-radius:8px;text-decoration:none;font-weight:700;">View on Amazon →</a>
    </div>
  </div>
</div>`.trim();
  };

  const summarize = async (rawText, productTitle) => {
    if (!rawText?.trim()) return "";
    setAiLoading(true);
    try {
      const prompt = `Summarize the following Amazon product description into 3-5 crisp bullet points.
- Keep only the most important benefits and key specs
- Prefer short, scannable bullets (max ~16 words each)
- No fluff, no marketing clichés
- Preserve proper nouns and brand/product terms
- Output only bullets each on a new line starting with "- "

Product Title: "${productTitle || ""}"

Description:
${rawText.slice(0, 4000)}`;

      const res = await InvokeLLM({ prompt });
      const text = typeof res === "string" ? res : (res?.text || "");
      return text.trim();
    } catch (e) {
      console.error("AI summarize error:", e);
      toast.error("AI summarization failed. Using original text.");
      return rawText;
    } finally {
      setAiLoading(false);
    }
  };

  const fetchAmazon = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const { data } = await amazonProduct({ url });
      // Try to normalize possible shapes
      const fetchedTitle = pick(data?.title, data?.product_title, data?.name);
      const fetchedPrice = pick(
        data?.price,
        data?.current_price,
        data?.price_current,
        data?.buybox_price,
        data?.list_price,
        data?.price_string
      );
      const fetchedImage = pick(
        data?.image,
        data?.main_image,
        Array.isArray(data?.images) ? data?.images[0] : "",
        Array.isArray(data?.image_urls) ? data?.image_urls[0] : ""
      );
      const rawDesc = pick(
        data?.description,
        Array.isArray(data?.feature_bullets) ? data.feature_bullets.join("\n") : "",
        Array.isArray(data?.features) ? data.features.join("\n") : "",
        data?.about
      );
      const finalUrl = pick(data?.url, data?.product_url, url);

      setTitle(fetchedTitle || "");
      setImage(fetchedImage || "");
      setPrice(fetchedPrice || "");
      setProductUrl(finalUrl || url);

      // Summarize to key points
      const summarized = await summarize(rawDesc || "", fetchedTitle || "");
      setDescription(summarized || rawDesc || "");

      toast.success("Amazon product fetched.");
    } catch (e) {
      console.error("Amazon fetch error:", e);
      toast.error("Failed to fetch from Amazon. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeClick = async () => {
    const summarized = await summarize(description || "", title || "");
    if (summarized) setDescription(summarized);
  };

  // NEW: insert into the Editor directly
  const handleInsert = () => {
    const meta = {
      title,
      description,
      image,
      price,
      product_url: productUrl
    };
    const html = buildProductHtml(meta);
    if (onInsert) onInsert(html);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl backdrop-blur-xl bg-white/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> {/* Removed text-orange-500 */}
            Import Amazon Product
          </DialogTitle>
          <DialogDescription>Paste an Amazon URL or ASIN, fetch details, optionally summarize, then insert.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL */}
          <div>
            <Label>Amazon URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.amazon.com/..."
                  className="pl-9"
                />
              </div>
              <Button onClick={fetchAmazon} disabled={!isAmazon || loading} className="min-w-[120px]">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching</> : "Fetch"}
              </Button>
            </div>
            {!isAmazon && url && (
              <p className="text-xs text-gray-500 mt-1">This doesn’t look like an Amazon URL.</p>
            )}
          </div>

          {/* Title */}
          <div>
            <Label>Product Name</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          </div>

          {/* Description + Summarize */}
          <div>
            <Label>Description (AI summarized)</Label>
            <div className="flex gap-2">
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short, key-point summary will appear here after fetch…"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSummarizeClick}
                disabled={!description || aiLoading}
                className="min-w-[140px]"
                title="Summarize with AI"
              >
                {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Summarize</> : <><Wand2 className="w-4 h-4 mr-2" />Summarize</>}
              </Button>
            </div>
          </div>

          {/* Image */}
          <div>
            <Label>Image URL</Label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="pl-9" />
            </div>
          </div>

          {/* Price */}
          <div>
            <Label>Price</Label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$29.99" className="pl-9" />
            </div>
          </div>

          {/* Product URL */}
          <div>
            <Label>Product URL</Label>
            <Input value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://..." />
          </div>

          {/* Preview card */}
          <div className="rounded-lg border p-3 bg-gray-50">
            <div className="flex items-start gap-3">
              {image ? (
                <img src={image} alt="preview" className="w-24 h-24 object-cover rounded border" />
              ) : (
                <div className="w-24 h-24 rounded bg-gray-200 grid place-items-center text-gray-500 text-xs">No Image</div>
              )}
              <div className="flex-1">
                <div className="font-semibold">{title || "Product"}</div>
                {price && <div className="text-sm font-semibold text-emerald-700 mt-1">{price}</div>}
                <div className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line mt-1">
                  {description}
                </div>
                <div className="mt-2">
                  <a className="text-blue-600 underline" href={productUrl || "#"} target="_blank" rel="noreferrer">View Product →</a>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="outline" onClick={async () => {
              const meta = { title, description, image, price, product_url: productUrl };
              const html = buildProductHtml(meta);
              await navigator.clipboard.writeText(html);
              toast.success("Product HTML copied to clipboard!"); // Added a toast
            }}>
              Copy HTML
            </Button>
            <Button onClick={handleInsert} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
