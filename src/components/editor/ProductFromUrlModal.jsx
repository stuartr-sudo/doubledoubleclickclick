
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Link as LinkIcon, Image as ImageIcon, ShoppingBag } from "lucide-react";
import { extractProductMeta } from "@/api/functions";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { PromotedProduct } from "@/api/entities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AmazonProductImporter from "./AmazonProductImporter";

// Add limits and helper at top-level in this file
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 240;
const clampText = (s, max) => {
  if (!s) return "";
  const t = String(s).trim();
  return t.length <= max ? t : t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
};

export default function ProductFromUrlModal({ isOpen, onClose, onInsert }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ title: "", description: "", image: "", button_text: "View Product →", product_url: "" });
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [assignToUsername, setAssignToUsername] = useState("");
  const [showAmazonImporter, setShowAmazonImporter] = useState(false);
  const [amazonUrlToImport, setAmazonUrlToImport] = useState(""); // NEW
  const [imageValid, setImageValid] = useState(false); // NEW: track if image actually loads

  // When image URL changes, test loadability
  React.useEffect(() => {
    const url = (meta?.image || "").trim();
    if (!url) {
      setImageValid(false);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setImageValid(Boolean(img.naturalWidth && img.naturalHeight));
    };
    img.onerror = () => {
      if (!cancelled) setImageValid(false);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [meta.image]);

  useEffect(() => {
    if (!isOpen) {
      // Reset states when the modal is closed to ensure clean slate for next open
      setUrl("");
      setMeta({ title: "", description: "", image: "", button_text: "View Product →", product_url: "" });
      setError("");
      setLoading(false);
      setAssignToUsername("");
      setCurrentUser(null);
      setAvailableUsernames([]);
      setShowAmazonImporter(false);
      setAmazonUrlToImport(""); // NEW: Reset Amazon importer URL state
      setImageValid(false); // Reset image validity
      return;
    }

    (async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        const all = await Username.list("-created_date").catch(() => []);
        const active = (all || []).filter(u => u.is_active !== false);
        const isSuperAdmin = user?.role === "admin" || user?.access_level === "full";
        let names = [];
        if (isSuperAdmin) {
          names = active.map(u => u.user_name);
        } else {
          const assigned = Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : [];
          const activeSet = new Set(active.map(u => u.user_name));
          names = assigned.filter(n => activeSet.has(n));
        }
        names = Array.from(new Set(names)).sort();
        setAvailableUsernames(names);
        setAssignToUsername(names[0] || "");
      } catch (e) {
        console.warn("Failed to load usernames:", e);
        // ignore; leave usernames empty
        setCurrentUser(null);
        setAvailableUsernames([]);
        setAssignToUsername("");
      }
    })();
  }, [isOpen]); // Depend on isOpen to load usernames only when modal opens

  const handleFetch = async () => {
    // Check if the URL is an Amazon link and open the Amazon importer WITHOUT closing this modal
    if ((url || "").includes("amazon.")) {
      setAmazonUrlToImport(url);
      openAmazon();
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await extractProductMeta({ url });
      if (!data?.success) {
        setError(data?.error || "Failed to fetch product details.");
      } else {
        setMeta({
          title: data.title || "",
          description: data.description || "",
          image: data.image || "",
          button_text: "View Product →",
          product_url: data.url || url
        });
      }
    } catch (e) {
      setError(e?.message || "Unexpected error while fetching metadata.");
    }
    setLoading(false);
  };

  const handleClose = () => {
    // Reset all states and close the modal
    setUrl("");
    setMeta({ title: "", description: "", image: "", button_text: "View Product →", product_url: "" });
    setError("");
    setLoading(false);
    setAssignToUsername("");
    setImageValid(false); // Reset image validity on close
    onClose();
  };

  const handleInsert = async () => {
    if (!meta.product_url) {
      setError("Product URL is required.");
      return;
    }
    // ENFORCE LIMITS
    const limited = {
      title: clampText(meta.title, TITLE_LIMIT),
      description: clampText(meta.description, DESCRIPTION_LIMIT),
      image: imageValid ? (meta.image || "") : "", // NEW: only use if valid
      product_url: meta.product_url,
      button_text: meta.button_text || "View Product →",
    };

    const esc = (s) => (s || '').toString().replace(/"/g, '&quot;');
    const title = esc(limited.title);
    const description = (limited.description || '').toString();
    const image = limited.image || '';
    const productUrl = esc(limited.product_url);
    const buttonText = esc(limited.button_text);

    // Side-by-side layout: image left, text right. Wraps on small screens.
    const block = `
<div class="b44-promoted-product" data-b44-block="product" style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:14px 0;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,0.06);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;">
    ${image ? `<img src="${esc(image)}" alt="${title || 'Product image'}" style="flex:0 0 220px;max-width:100%;height:auto;border-radius:8px;border:1px solid #eee;" />` : ``}
    <div style="flex:1 1 300px;min-width:240px;">
      <h3 style="margin:0 0 8px 0;color:#2c3e50;font-size:1.35rem;font-weight:700;line-height:1.25;">${title || "Product"}</h3>
      ${description ? `<p style="margin:0 0 12px 0;color:#555;font-size:.98rem;line-height:1.55;">${description.replace(/\n/g, '<br>')}</p>` : ``}
      <a href="${productUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#3498db;color:white;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">${buttonText}</a>
    </div>
  </div>
</div>`.trim();

    onInsert(block);

    // Save to library ONLY if a username is selected (entity requires user_name)
    try {
      const payload = {
        name: limited.title || "Product", // Use limited title
        description: limited.description || "", // Use limited description
        image_url: limited.image || "", // Use limited image (already validated)
        product_url: limited.product_url,
        button_url: limited.product_url, // NEW: default button link to product_url
        price: "", // optional
      };
      if (assignToUsername) payload.user_name = assignToUsername;
      if (payload.user_name) {
        await PromotedProduct.create(payload);
      }
    } catch (e) {
      // Non-fatal if saving fails; content already inserted
      console.warn("Failed to save product to library:", e);
    }

    // reset and close
    setUrl("");
    setMeta({ title: "", description: "", image: "", button_text: "View Product →", product_url: "" });
    setError("");
    setImageValid(false); // Reset image validity
    onClose();
  };

  // OPEN AMAZON IMPORTER: Do NOT close this modal here (removes the bug)
  const openAmazon = () => {
    // onClose();  // REMOVED: this caused the whole component (and importer) to unmount
    setShowAmazonImporter(true);
  };

  // NEW: helper boolean (used for helper text visibility)
  const hasSelectableUsernames = Array.isArray(availableUsernames) && availableUsernames.length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="backdrop-blur-xl bg-white/95 border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Promoted Product from URL
            </DialogTitle>
            <DialogDescription>
              Paste a product URL to fetch details, or{" "}
              <Button variant="link" className="p-0 h-auto" onClick={openAmazon}>
                import from Amazon
              </Button>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="prod-url" className="mb-1 block">Product URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input id="prod-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/product" className="pl-9" />
                </div>
                <Button onClick={handleFetch} disabled={!url || loading} className="min-w-[110px]">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching</> : "Fetch"}
                </Button>
              </div>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </div>

            {/* Assign to Username */}
            <div>
              <Label htmlFor="assign-username">Assign to Username</Label>
              <Select value={assignToUsername} onValueChange={setAssignToUsername}>
                <SelectTrigger id="assign-username">
                  <SelectValue placeholder={availableUsernames.length ? "Select username" : "No usernames available"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsernames.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!availableUsernames.length && (
                <p className="text-xs text-gray-500 mt-1">No usernames found for your account.</p>
              )}
              {hasSelectableUsernames && !assignToUsername && (
                <p className="text-xs text-gray-500 mt-1">Tip: select a username to also save this product to your library under that username.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="button_text">Button Text</Label>
                <Input id="button_text" value={meta.button_text} onChange={(e) => setMeta({ ...meta, button_text: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} rows={4} />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input id="image" value={meta.image} onChange={(e) => setMeta({ ...meta, image: e.target.value })} className="pl-9" />
                </div>
              </div>
              <div>
                <Label htmlFor="product_url">Button Link (Product URL)</Label>
                <Input id="product_url" value={meta.product_url} onChange={(e) => setMeta({ ...meta, product_url: e.target.value })} />
              </div>
            </div>

            <div className="rounded-lg border p-3 bg-gray-50">
              <div className="flex items-start gap-3">
                {meta.image && imageValid ? (
                  <img src={meta.image} alt="preview" className="w-24 h-24 object-cover rounded border" />
                ) : (
                  <div className="w-24 h-24 rounded bg-gray-200 grid place-items-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{meta.title || "Product"}</div>
                  <div className="text-sm text-gray-600 line-clamp-3">{meta.description}</div>
                  <div className="mt-2">
                    <a className="text-blue-600 underline" href={meta.product_url || "#"} target="_blank" rel="noreferrer">{meta.button_text || "View Product →"}</a>
                  </div>
                </div>
              </div>
              {meta.image && !imageValid && (
                <p className="text-xs text-red-600 mt-2">
                  The provided image URL could not be loaded and will be omitted.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleInsert} className="bg-blue-600 hover:bg-blue-700">Insert</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AmazonProductImporter 
        isOpen={showAmazonImporter} 
        onClose={() => {
          setShowAmazonImporter(false);
          setAmazonUrlToImport(""); // Reset the initial URL when closing the Amazon Importer
        }} 
        onInsert={onInsert} 
        initialUrl={amazonUrlToImport} // Pass the URL to the Amazon Importer
      />
    </>
  );
}
