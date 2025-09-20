
import React, { useState, useEffect, useCallback, useRef } from "react";
import { PromotedProduct } from "@/api/entities";
import { User } from "@/api/entities";
import { CustomContentTemplate } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ShoppingBag, Wand2, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InvokeLLM } from "@/api/integrations";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 240;

function clampText(str, max) {
  if (str === null || str === undefined) return "";
  const s = String(str).trim();
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

// Replace the sanitizer with a no-op to honor full template HTML (no stripping)
function sanitizeTemplateHtml(raw) {
  if (raw == null) return "";
  return typeof raw === "string" ? raw : String(raw);
}

// encodeForSrcdoc and buildProductIframeSrcdoc are removed as iframes are no longer used for insertion.


function sanitizeProductFields(obj = {}) {
  return {
    ...obj,
    name: clampText(obj.name, TITLE_LIMIT),
    description: clampText(obj.description, DESCRIPTION_LIMIT),
    alt_text: clampText(obj.alt_text || obj.name || "", 120)
  };
}

function SafeProductPreview({ variant = "neon", product = {} }) {
  const name = (product.name || "Product").toString();
  const price = (product.price || "").toString();
  const desc = (product.description || "").toString();
  const img = product.image_url || "";

  const cta =
  variant === "minimal" ? "View Details" :
  variant === "double" ? "Buy Now" :
  "Add to Cart";

  return (
    <div
      className="relative isolate w-full h-48 overflow-hidden rounded-md border bg-white"
      style={{
        contain: "layout style paint",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        transform: "translateZ(0)"
      }}>

      <div className="absolute inset-0 flex">
        <div className="relative shrink-0 w-[44%] bg-gray-100">
          {img ?
          <img
            src={img}
            alt={product.alt_text || name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            style={{ WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: "translateZ(0)" }}
            onError={(e) => {e.currentTarget.style.visibility = "hidden";}} /> :
          null}
          {variant !== "neon" &&
          <div className="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase rounded bg-black/80 text-white tracking-wide">
              Sale
            </div>
          }
        </div>
        <div className="flex-1 p-3 flex flex-col justify-center">
          <div className="text-sm font-semibold line-clamp-1">{name}</div>
          {price && <div className="text-xs font-bold text-gray-900 mt-1">{price}</div>}
          {desc && <div className="text-xs text-gray-600 line-clamp-2 mt-1">{desc}</div>}
          <div className="mt-2">
            <span className="inline-block rounded bg-gray-900 text-white text-[11px] font-semibold px-2 py-1 select-none">
              {cta}
            </span>
          </div>
        </div>
      </div>
    </div>);
}

export default function PromotedProductSelector({ isOpen, onClose, onInsert }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({
    name: "", description: "", price: "", image_url: "", product_url: "", alt_text: "",
    custom_template_id: null
  });
  const [fieldLoading, setFieldLoading] = useState({});

  // Custom template selection state
  const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null); // This will now be the main template state

  // NEW: prevent double-init/flicker on open in React StrictMode
  const initializedRef = useRef(false);

  const loadProducts = useCallback(async (user) => {
    setIsLoading(true);
    try {
      const allProducts = await PromotedProduct.list("-created_date");
      const assigned = Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : [];

      // UPDATED: only show products that have a template assigned AND belong to assigned usernames
      const visibleProducts = allProducts.filter(
        (p) => p.user_name && assigned.includes(p.user_name) && !!p.custom_template_id
      );

      const usernamesForFilter = [...new Set(visibleProducts.map((p) => p.user_name).filter(Boolean))].sort();

      setProducts(visibleProducts);
      setAvailableUsernames(usernamesForFilter);

      if (usernamesForFilter.length === 1) {
        setSelectedUsername(usernamesForFilter[0]);
      } else {
        setSelectedUsername("all");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products.");
      setProducts([]);
      setAvailableUsernames([]);
      setSelectedUsername("all");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load custom templates (STRICT product-only)
  const loadCustomTemplates = useCallback(async () => {
    try {
      // 1) Try strict server-side filter first
      let fetched = await CustomContentTemplate
        .filter({ associated_ai_feature: "product", is_active: true })
        .catch(() => []);

      // 2) Fallback: list all, then filter locally (handles legacy/incorrect enum casing)
      if (!Array.isArray(fetched) || fetched.length === 0) {
        fetched = await CustomContentTemplate.list("-created_date").catch(() => []);
      }

      const productTemplates = (fetched || []).filter((t) => {
        const feature = String(t.associated_ai_feature || "").toLowerCase().trim();
        const name = String(t.name || "");
        const html = String(t.html_structure || "");
        const isActive = t.is_active !== false;

        // Product-specific tokens expected inside product templates
        const hasProductTokens = /\{\{\s*(PRODUCT_NAME|PRODUCT_DESCRIPTION|PRODUCT_PRICE|PRODUCT_URL|IMAGE_URL|SKU|STAR_RATING|REVIEW_COUNT)\s*\}\}/i.test(html);

        // Explicit exclusions even if mis-tagged
        const isCtaish = feature === "cta" || /\bcta\b/i.test(name);
        const isTestimonialish = feature === "testimonial" || /\btestimonials?\b/i.test(name);

        // Accept explicit product feature, clear product naming, or product placeholders
        const looksProduct =
          feature === "product" ||
          /\bpromoted\s*product\b|\bproduct\b/i.test(name) ||
          hasProductTokens;

        return isActive && looksProduct && !isCtaish && !isTestimonialish;
      });

      setCustomTemplates(productTemplates);

      // Ensure current selection is valid; otherwise, pick first valid or null
      const stillValid = selectedTemplate && productTemplates.some(x => x.id === selectedTemplate.id);
      if (!stillValid) {
        setSelectedTemplate(productTemplates[0] || null);
      }
    } catch (error) {
      console.error("Error loading product templates:", error);
      toast.error("Failed to load product templates.");
      setCustomTemplates([]);
      setSelectedTemplate(null);
    }
  }, [selectedTemplate]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      await loadProducts(user);
    } catch (error) {
      console.error("Error loading current user:", error);
      toast.error("Failed to load current user.");
      await loadProducts(null);
    }
  }, [loadProducts]);

  useEffect(() => {
    if (isOpen) {
      // Prevent duplicate re-initialization that causes flicker, but ALWAYS refresh templates on open
      if (!initializedRef.current) {
        initializedRef.current = true;
        loadCurrentUser();
      } else if (currentUser) {
        // If already initialized, just refresh the list quickly without resetting everything
        loadProducts(currentUser);
      }
      // NEW: always refresh templates on every open to avoid stale list
      loadCustomTemplates();
    } else {
      initializedRef.current = false;
      setSelectedUsername("all");
      setEditing(null);
      setSelectedTemplate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // keep effect minimal to avoid re-runs

  // Remove `buildNeonProduct` and `buildHtmlByTemplate` as they are no longer used for insertion.

  // Apply custom template logic
  const applyCustomTemplate = (product, template) => {
    if (!template) {
      return null;
    }

    let htmlStructure = template.html_structure;

    // Replace product-specific placeholders
    htmlStructure = htmlStructure
      .replace(/\{\{PRODUCT_NAME\}\}/g, product.name || "")
      .replace(/\{\{PRODUCT_DESCRIPTION\}\}/g, product.description || "")
      .replace(/\{\{PRODUCT_PRICE\}\}/g, product.price || "")
      .replace(/\{\{PRODUCT_URL\}\}/g, (product.button_url || product.product_url || "#"))
      .replace(/\{\{IMAGE_URL\}\}/g, product.image_url || "")
      .replace(/\{\{IMAGE_ALT\}\}/g, product.alt_text || product.name || "Product Image")
      .replace(/\{\{SKU\}\}/g, product.sku || "")
      .replace(/\{\{STAR_RATING\}\}/g, product.star_rating || "")
      .replace(/\{\{REVIEW_COUNT\}\}/g, product.review_count || "")
      .replace(/\{\{BUTTON_TEXT\}\}/g, "Buy Now")
      .replace(/\{\{LINK_TEXT\}\}/g, "Learn More");

    return htmlStructure;
  };

  const handleInsertProduct = (product, overrides = {}) => {
    const finalProduct = sanitizeProductFields({ ...product, ...overrides });

    const templateToUse = selectedTemplate
      ? selectedTemplate
      : (finalProduct.custom_template_id
          ? customTemplates.find(t => t.id === finalProduct.custom_template_id) || null
          : null);

    if (!templateToUse) {
      toast.error("Please select a Dynamic Template first.");
      return;
    }

    // Apply placeholders -> HTML and DO NOT alter it
    const rawHtml = applyCustomTemplate(finalProduct, templateToUse);
    if (!rawHtml) {
      toast.error("Selected template produced no content. Please review the template or select another.");
      return;
    }

    // Pass-through (no stripping)
    const safeHtml = sanitizeTemplateHtml(rawHtml);

    // NEW: Insert raw HTML but render it inside a Shadow DOM at runtime.
    // We persist the original html in a <template> so it survives save/load cycles.
    const blockHtml = `
<div class="b44-promoted-product"
     data-b44-type="product"
     data-product-id="${product?.id || ''}"
     data-template-key="${templateToUse.id}"
     data-b44-shadow-host="1"
     contenteditable="false"
     style="margin:16px 0; max-width:100%; display:block; box-sizing:border-box; position: relative; isolation: isolate;">
  <template data-b44-shadow-html>${safeHtml}</template>
</div>`.trim();

    onInsert(blockHtml);
    onClose();
  };

  // default to a product's saved custom template inside the Edit modal
  const openEditor = (product) => {
    const sanitizedProduct = sanitizeProductFields(product);
    setEditing(product);
    setEditValues({
      name: sanitizedProduct.name,
      description: sanitizedProduct.description,
      price: product.price || "",
      image_url: product.image_url || "",
      product_url: product.product_url || "",
      alt_text: sanitizedProduct.alt_text,
      custom_template_id: product.custom_template_id ?? null
    });
    setFieldLoading({});
  };

  const rewriteField = async (field) => {
    if (!editing) return;
    setFieldLoading((f) => ({ ...f, [field]: true }));
    try {
      let prompt;
      let schema = null;
      if (field === "name") {
        prompt = `Rewrite ONLY the product title to be concise and SEO-friendly.
- 5–9 words preferred, max ${TITLE_LIMIT} characters.
- No quotes
- Output ONLY the new title text

Current title: "${editValues.name}"
Description (context): "${(editValues.description || "").slice(0, 800)}"`;
      } else if (field === "description") {
        prompt = `Rewrite ONLY the product description to be concise and conversion-focused.
- MAX ${DESCRIPTION_LIMIT} characters
- Preserve factual details
- No HTML, output plain text.

Current description: "${editValues.description}"

Title (context): "${editValues.name}"`;
      } else if (field === "alt_text") {
        prompt = `Write accessible ALT text under 120 characters.
- No phrases like "image of" or "photo of"
- Output ONLY the alt text

Title: "${editValues.name}"
Description: "${(editValues.description || "").slice(0, 400)}"`;
      } else {
        setFieldLoading((f) => ({ ...f, [field]: false }));
        return;
      }

      const res = await InvokeLLM(
        schema ? { prompt, response_json_schema: schema } : { prompt }
      );

      const newValRaw = typeof res === "string" ? res.trim() : (res?.text || "").trim();
      const newVal =
      field === "name" ? clampText(newValRaw, TITLE_LIMIT) :
      field === "description" ? clampText(newValRaw, DESCRIPTION_LIMIT) :
      clampText(newValRaw, 120);

      if (!newVal) {
        toast.error("AI didn't return a value. Please try again.");
      } else {
        setEditValues((v) => ({ ...v, [field]: newVal }));
        toast.success("Updated with AI.");
      }
    } catch (e) {
      console.error("Per-field rewrite error:", e);
      toast.error("AI rewrite failed. Please try again.");
    } finally {
      setFieldLoading((f) => ({ ...f, [field]: false }));
    }
  };

  // UPDATED: filter by selected username, search term, AND selected template id
  const filteredProducts = products
    .filter((product) =>
      selectedUsername === "all" || product.user_name === selectedUsername
    )
    .filter((product) => {
      // If a Dynamic Template is selected, only show products attached to it
      if (selectedTemplate?.id) {
        return product.custom_template_id === selectedTemplate.id;
      }
      return true;
    })
    .filter((product) =>
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl w-[96vw] md:w-[900px] h-[85vh] flex flex-col overflow-hidden bg-white text-slate-900 border border-slate-200"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Insert Promoted Product
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Dynamic Template selection (required) */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <div>
              <Label className="text-slate-700 text-sm">Dynamic Template</Label>
              <Select
                value={selectedTemplate?.id || ""}
                onValueChange={(value) => {
                  const template = customTemplates.find(t => t.id === value);
                  setSelectedTemplate(template || null);
                }}
              >
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {customTemplates.length === 0 ? (
                    <SelectItem value={null} disabled>No templates found</SelectItem>
                  ) : customTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Manage templates in Assets → Templates. Only active Product templates are listed.
              </p>
            </div>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            {availableUsernames.length > 0 && (
              <div>
                <Label htmlFor="username-select" className="sr-only">Filter by Username</Label>
                <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                  <SelectTrigger id="username-select" className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Filter by username..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="all">All Products</SelectItem>
                    {availableUsernames.map((username) => (
                      <SelectItem key={username} value={username}>{username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Results list (inherits modal scroll) */}
          <div className="min-h-0">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No products found for the selected criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-slate-200 rounded-lg p-4 flex flex-col bg-white"
                    style={{ minHeight: 260 }}
                  >
                    <h4 className="font-medium mb-1 line-clamp-1 text-slate-800">{product.name || "Product"}</h4>
                    {product.price && (
                      <p className="text-blue-600 font-semibold mb-2">{product.price}</p>
                    )}
                    {product.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>
                    )}

                    <div className="mt-2">
                      <SafeProductPreview variant="neon" product={product} />
                    </div>

                    <div className="flex justify-between items-center gap-2 mt-3">
                      <span className="text-xs text-slate-500">
                        Username: {product.user_name || "—"}
                        {product.custom_template_id ? (
                          <span className="ml-2 text-blue-600">• Template assigned</span>
                        ) : null}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => openEditor(product)}
                          size="sm"
                          variant="outline"
                          className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 gap-1"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleInsertProduct(product)}
                          size="sm"
                          className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Insert
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-2xl bg-white text-slate-900 border-slate-200">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900">
                  <Pencil className="w-5 h-5 text-slate-700" />
                  Edit Product Fields
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Assign a custom template directly on the product */}
                {customTemplates.length > 0 && (
                  <div>
                    <Label className="mb-1 block text-slate-700">Dynamic Template</Label>
                    <Select
                      value={editValues.custom_template_id ? editValues.custom_template_id : "__none__"}
                      onValueChange={(val) => setEditValues((v) => ({ ...v, custom_template_id: val === "__none__" ? null : val }))}
                    >
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="__none__">None</SelectItem>
                        {customTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="mb-1 block text-slate-700">Title</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                      className="flex-1 bg-white border-slate-300 text-slate-900" />
                    <Button
                      variant="outline"
                      onClick={() => rewriteField("name")}
                      disabled={!!fieldLoading.name}
                      title="Magic rewrite title"
                      className="min-w-[120px] bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                      {fieldLoading.name ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Magic</> : <><Wand2 className="w-4 h-4 mr-2" />Magic</>}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block text-slate-700">Description</Label>
                  <div className="flex gap-2">
                    <Textarea
                      rows={4}
                      value={editValues.description}
                      onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
                      className="flex-1 bg-white border-slate-300 text-slate-900" />
                    <Button
                      variant="outline"
                      onClick={() => rewriteField("description")}
                      disabled={!!fieldLoading.description}
                      title="Magic rewrite description"
                      className="h-auto min-w-[120px] bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                      {fieldLoading.description ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Magic</> : <><Wand2 className="w-4 h-4 mr-2" />Magic</>}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block text-slate-700">Image Alt Text</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editValues.alt_text}
                      onChange={(e) => setEditValues((v) => ({ ...v, alt_text: e.target.value }))}
                      className="flex-1 bg-white border-slate-300 text-slate-900" />
                    <Button
                      variant="outline"
                      onClick={() => rewriteField("alt_text")}
                      disabled={!!fieldLoading.alt_text}
                      title="Magic generate alt text"
                      className="min-w-[120px] bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                      {fieldLoading.alt_text ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Magic</> : <><Wand2 className="w-4 h-4 mr-2" />Magic</>}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block text-slate-700">Image URL</Label>
                  <Input
                    value={editValues.image_url}
                    onChange={(e) => setEditValues((v) => ({ ...v, image_url: e.target.value }))}
                    className="bg-white border-slate-300 text-slate-900" />
                </div>

                <div>
                  <Label className="mb-1 block text-slate-700">Product URL</Label>
                  <Input
                    value={editValues.product_url}
                    onChange={(e) => setEditValues((v) => ({ ...v, product_url: e.target.value }))}
                    className="bg-white border-slate-300 text-slate-900" />
                </div>

                <div>
                  <Label className="mb-1 block text-slate-700">Price</Label>
                  <Input
                    value={editValues.price}
                    onChange={(e) => setEditValues((v) => ({ ...v, price: e.target.value }))}
                    className="bg-white border-slate-300 text-slate-900" />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!editing) return;
                      const overrides = { ...editValues };
                      const sanitizedOverrides = sanitizeProductFields(overrides);
                      await PromotedProduct.update(editing.id, {
                        ...sanitizedOverrides,
                        custom_template_id: overrides.custom_template_id ?? null
                      });
                      toast.success("Product updated");
                      setEditing(null);
                      if (currentUser) await loadProducts(currentUser);
                    }}
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Save
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setEditing(null)}
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </Button>

                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      if (!editing) return;
                      const overrides = { ...editValues };
                      const sanitizedOverrides = sanitizeProductFields(overrides);
                      const finalProductToInsert = { ...editing, ...sanitizedOverrides };
                      // Persist edits (including template assignment) before inserting
                      await PromotedProduct.update(editing.id, {
                        ...sanitizedOverrides,
                        custom_template_id: overrides.custom_template_id ?? null
                      });
                      handleInsertProduct(finalProductToInsert);
                      setEditing(null);
                      if (currentUser) await loadProducts(currentUser);
                    }}>
                    Save & Insert
                  </Button>
                </div>
              </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
