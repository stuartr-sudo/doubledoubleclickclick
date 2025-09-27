
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Link as LinkIcon, Wand2, Image as ImageIcon, DollarSign, ShoppingBag, Plus } from "lucide-react";
import { amazonProduct } from "@/api/functions";
import { InvokeLLM } from "@/api/integrations";
import { toast } from "sonner";
import { saveImageFromString } from "@/api/functions";
import { PromotedProduct } from "@/api/entities";
import { User } from "@/api/entities";

// Add helper right after imports or inside component file scope
const saveAllImagesToLibrary = async (images, userName, titleBase) => {
  if (!Array.isArray(images) || images.length === 0) return;
  const unique = [...new Set(images.filter(Boolean))];
  for (let i = 0; i < unique.length; i++) {
    const imgUrl = unique[i];
    try {
      await saveImageFromString({
        value: imgUrl,
        user_name: userName || undefined,
        alt_text: `${titleBase || "product"}${unique.length > 1 ? ` (${i + 1})` : ""}`,
        source: "upload"
      });
    } catch (_) {
      // ignore single image failures
    }
  }
};

export default function AmazonProductImporter({ isOpen, onClose, onInsert, initialUrl = "" }) {
  const [url, setUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false); // Used for fetching Amazon product
  const [aiLoading, setAiLoading] = useState(false); // Used for AI summarization

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(""); // Stores the primary image URL
  const [allImages, setAllImages] = useState([]); // Stores all image URLs found
  const [price, setPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [rating, setRating] = useState("");
  const [reviews, setReviews] = useState("");

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setLoading(false);
      setAiLoading(false);
      setTitle("");
      setDescription("");
      setImage("");
      setAllImages([]);
      setPrice("");
      setProductUrl("");
      setRating("");
      setReviews("");
    } else if (initialUrl && !url) {
      setUrl(initialUrl);
    }
  }, [isOpen, initialUrl, url]);

  const isAmazon = useMemo(() => (url || "").includes("amazon."), [url]);

  const pick = (...vals) => vals.find(v => !!v && String(v).trim().length > 0);

  const formatAmazonPrice = (priceData) => {
    if (!priceData) return "";
    
    // Handle different price formats from Amazon API
    if (typeof priceData === 'string') {
      // Already formatted price string, ensure no double currency symbol
      if (priceData.includes('$') || priceData.includes('€') || priceData.includes('£')) {
        return priceData;
      }
      // Just a number as string
      return `$${priceData}`;
    }
    
    if (typeof priceData === 'object' && priceData !== null) {
      // Amazon API sometimes returns price as object with different currency formats
      if (priceData.symbol && priceData.value) {
        return `${priceData.symbol}${priceData.value}`;
      }
      // Check for 'current_price' within the object, recursively format
      if (priceData.current_price) {
        return formatAmazonPrice(priceData.current_price);
      }
      // Check for amount and currency keys if available
      if (priceData.amount && priceData.currency) {
          return `${priceData.currency === 'USD' ? '$' : priceData.currency} ${priceData.amount}`;
      }
    }
    
    if (typeof priceData === 'number') {
      return `$${priceData.toFixed(2)}`;
    }
    
    return "";
  };

  const toBulletsHtml = (text) => {
    // Expect lines starting with "-" or "•"; fallback to sentences
    const lines = String(text)
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.replace(/^(\-|\•)\s?/, "").trim())
      .filter(Boolean);

    // If there are multiple lines (likely bullet points from AI summarization)
    if (lines.length >= 2) {
      return `<ul style="margin:0 0 12px 18px;padding:0;line-height:1.55;color:#555;">${lines.slice(0, 5).map(li => `<li>${li}</li>`).join("")}</ul>`;
    }

    // fallback to a short paragraph (or if it's just one line of text)
    return `<p style="margin:0 0 12px 0;color:#555;line-height:1.55;">${text}</p>`;
  };

  const buildPromotedProductHtml = (meta) => {
    const esc = (s) => (s || '').toString().replace(/"/g, '&quot;');
    const uniqueId = `product-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const productTitle = esc(meta.title || "Product");
    const productPrice = meta.price ? `<div style="margin:0 0 8px 0;color:#059669;font-size:1.3rem;font-weight:700;">${esc(meta.price)}</div>` : '';
    const productRating = meta.rating && meta.reviews ? `<div style="margin:0 0 8px 0;color:#f59e0b;font-size:0.9rem;">⭐ ${esc(meta.rating)} (${esc(meta.reviews)} reviews)</div>` : '';
    // Use the intelligent toBulletsHtml for description rendering
    const productDescriptionHtml = meta.description ? toBulletsHtml(meta.description) : '';
    const productImageUrl = meta.image ? `<img src="${esc(meta.image)}" alt="${productTitle}" style="flex:0 0 200px;max-width:100%;height:auto;border-radius:8px;border:1px solid #eee;" />` : '';
    const productUrl = esc(meta.product_url || "#");

    return `
<div class="b44-promoted-product" data-b44-id="${uniqueId}" style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,0.06);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
    ${productImageUrl}
    <div style="flex:1 1 300px;min-width:250px;">
      <h3 style="margin:0 0 8px 0;color:#2c3e50;font-size:1.4rem;font-weight:700;line-height:1.25;">${productTitle}</h3>
      ${productPrice}
      ${productRating}
      ${productDescriptionHtml}
      <a href="${productUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#FF9900;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View on Amazon</a>
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
      console.error("AI summarization error:", e);
      toast.error("AI summarization failed. Using original text.");
      return rawText;
    } finally {
      setAiLoading(false);
    }
  };

  // Inside the handler that finalizes the import (where HTML is inserted and product is saved)
  // We add minimal, non-breaking hooks.
  const finalizeImport = async (productData, htmlToInsert) => {
    // productData is expected to include: title/name, description, price, images(array), url
    const imgs = Array.isArray(productData?.images) ? productData.images.filter(Boolean) : [];
    const firstImage = imgs[0] || productData?.image || ""; // Fallback to main image if allImages is empty

    try {
      const user = await User.me().catch(() => null);
      // Determine userName: priority given to current user's first assigned username
      const userName = (user?.assigned_usernames?.[0]) || undefined;

      if (productData?.title || productData?.name) {
        await PromotedProduct.create({
          name: productData.title || productData.name,
          description: productData.description || "",
          image_url: firstImage || "",
          product_url: productData.product_url || productData.url || "",
          button_url: productData.button_url || productData.product_url || productData.url || "",
          price: productData.price || "",
          user_name: userName
        });
      }

      // Save ALL images to the Image Library
      await saveAllImagesToLibrary(imgs, userName, productData?.title || productData?.name);
      toast.success("Product and images saved successfully!");
    } catch (e) {
      console.warn("Amazon import: failed to persist product/images:", e);
      toast.error("Failed to save product details or images.");
      // non-fatal, proceed to insert HTML anyway
    }

    // Insert HTML (existing behavior)
    if (typeof onInsert === "function") onInsert(htmlToInsert);
  };

  const fetchAmazon = async () => {
    if (!url) {
      toast.error("Please enter an Amazon product URL.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await amazonProduct({ url });

      // Check if product data was received
      if (!data) {
        toast.error("No product data received from Amazon.");
        return;
      }

      // Try to normalize possible shapes, integrating outline's suggested keys and existing robustness
      const fetchedTitle = pick(data?.product_title, data?.title, data?.name);
      const fetchedPriceRaw = pick(
        data?.product_price,
        data?.price,
        data?.current_price,
        data?.price_current,
        data?.buybox_price,
        data?.list_price,
        data?.product_original_price,
        data?.price_string
      );
      
      // Extract all image URLs
      let productImages = [];
      if (Array.isArray(data?.images)) {
        productImages = data.images.map(img => typeof img === 'object' ? img.link || img.url : img).filter(Boolean);
      } else if (Array.isArray(data?.image_urls)) {
        productImages = data.image_urls.filter(Boolean);
      }
      
      const fetchedMainImage = pick(
        data?.product_main_image_url,
        data?.image,
        data?.main_image,
        productImages[0] // Pick first from array if available
      );
      
      // Ensure fetchedImagesArray includes fetchedMainImage if it's not already there
      const finalImagesArray = [...new Set([fetchedMainImage, ...productImages].filter(Boolean))];

      const rawDesc = pick(
        data?.product_description,
        data?.description,
        Array.isArray(data?.feature_bullets) ? data.feature_bullets.join("\n") : "",
        Array.isArray(data?.features) ? data.features.join("\n") : "",
        data?.about
      );
      const finalUrl = pick(data?.product_url, data?.url, url); // Prioritize product_url, fallback to url

      // Extract rating and reviews from data
      const fetchedRating = pick(data?.product_star_rating, data?.star_rating, "");
      const fetchedReviews = pick(data?.product_num_reviews, data?.num_reviews, "");

      setTitle(fetchedTitle || "");
      setImage(fetchedMainImage || "");
      setAllImages(finalImagesArray); // Set all images
      setPrice(formatAmazonPrice(fetchedPriceRaw) || "");
      setProductUrl(finalUrl || url);
      setRating(fetchedRating || "");
      setReviews(fetchedReviews || "");

      // Summarize description to key points
      const summarized = await summarize(rawDesc || "", fetchedTitle || "");
      setDescription(summarized || rawDesc || ""); // Use summarized or original raw description

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

  // handleInsert function, adapted to use finalizeImport
  const handleInsert = async () => {
    // Meta object for HTML generation
    const meta = {
      title,
      description,
      image, // Primary image for display
      price,
      product_url: productUrl,
      rating,
      reviews
    };
    const html = buildPromotedProductHtml(meta);

    // ProductData object for saving to database
    const productDataForSave = {
      title: title,
      description: description,
      images: allImages, // All images for library saving
      image: image, // Primary image for PromotedProduct entity
      price: price,
      product_url: productUrl,
    };

    // Call finalizeImport to save product, images, and then insert HTML
    await finalizeImport(productDataForSave, html);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl backdrop-blur-xl bg-white/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
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

          {/* Rating (NEW UI field) */}
          <div>
            <Label>Rating</Label>
            <Input value={rating} onChange={(e) => setRating(e.target.value)} placeholder="4.5" />
          </div>

          {/* Reviews (NEW UI field) */}
          <div>
            <Label>Number of Reviews</Label>
            <Input value={reviews} onChange={(e) => setReviews(e.target.value)} placeholder="1234" />
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
                {rating && reviews && (
                  <div className="text-sm text-gray-500 mt-1">⭐ {rating} ({reviews} reviews)</div>
                )}
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
              const meta = { title, description, image, price, product_url: productUrl, rating, reviews };
              const html = buildPromotedProductHtml(meta); // Use the new HTML builder for copy
              await navigator.clipboard.writeText(html);
              toast.success("Product HTML copied to clipboard!");
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
