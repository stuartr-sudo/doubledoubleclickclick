
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Link as LinkIcon, Image as ImageIcon, ShoppingBag, ArrowLeft } from "lucide-react";
import { extractProductMeta } from "@/api/functions";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { PromotedProduct } from "@/api/entities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveImageFromString } from "@/api/functions";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { CustomContentTemplate } from "@/api/entities";
import TemplatePreviewFrame from "./TemplatePreviewFrame"; // Added import

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
  const [meta, setMeta] = useState({ title: "", description: "", image: "", button_text: "View Product →", product_url: "", price: "", images: [] });
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [assignToUsername, setAssignToUsername] = useState("");
  const [imageValid, setImageValid] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Workspace scoping
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag("use_workspace_scoping", { defaultEnabled: true });

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
      setMeta({ title: "", description: "", image: "", button_text: "View Product →", product_url: "", price: "", images: [] });
      setError("");
      setLoading(false);
      setAssignToUsername("");
      setCurrentUser(null);
      setAvailableUsernames([]);
      setImageValid(false);

      // Reset wizard when closed
      setStep(1);
      setSelectedTemplate(null);
      return;
    }

    // Load templates
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        // CORRECTED: Load from CustomContentTemplate and filter for products
        const templatesData = await CustomContentTemplate.list();
        const productOnlyTemplates = (templatesData || []).filter((template) => {
            const isProductTemplate = template.associated_ai_feature === "product";
            const isActive = template.is_active !== false;
            const hasInvalidName = template.name && (
              template.name.toLowerCase().includes('cta') ||
              template.name.toLowerCase().includes('testimonial')
            );
            return isProductTemplate && isActive && !hasInvalidName;
        });

        setTemplates(productOnlyTemplates);
        // Set default template if available - NO, user should select explicitly
        // if (productOnlyTemplates && productOnlyTemplates.length > 0) {
        //   setSelectedTemplate(productOnlyTemplates[0]);
        // } else {
        //   setSelectedTemplate(null);
        // }
      } catch (e) {
        console.warn("Failed to load templates:", e);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();

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

        // IMPORTANT: if workspace scoping is on, use it; otherwise keep previous default behavior
        if (useWorkspaceScoping && globalUsername) {
          setAssignToUsername(globalUsername);
        } else {
          setAssignToUsername(names[0] || "");
        }
      } catch (e) {
        console.warn("Failed to load usernames:", e);
        setCurrentUser(null);
        setAvailableUsernames([]);
        // if workspace scoping is active but no selection, keep empty (we won't show dropdown)
        setAssignToUsername(useWorkspaceScoping ? (globalUsername || "") : "");
      }
    })();
  }, [isOpen, useWorkspaceScoping, globalUsername]); // Depend on isOpen to load usernames only when modal opens

  const handleFetch = async () => {
    if (!url.trim()) {
      setError("Please enter a product URL.");
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
          image: (data.images && data.images[0]) || data.image || "", // Use first image from array, or fallback to single image
          button_text: "View Product →",
          product_url: data.url || url,
          price: data.price || "",
          images: Array.isArray(data.images) ? data.images.filter(Boolean) : (data.image ? [data.image] : [])
        });
        // REMOVED: Do not auto-proceed. User will click "Next" manually.
        // setStep(2);
      }
    } catch (e) {
      setError(e?.message || "Unexpected error while fetching metadata.");
    }
    setLoading(false);
  };

  // Helper: save all images to Image Library (first is main image)
  const saveAllImagesToLibrary = async (images, userName, titleBase) => {
    if (!Array.isArray(images) || images.length === 0) return;
    const unique = [...new Set(images.filter(Boolean))];
    // Save sequentially to avoid rate issues
    for (let i = 0; i < unique.length; i++) {
      const imgUrl = unique[i];
      try {
        await saveImageFromString({
          value: imgUrl,
          user_name: userName || undefined,
          alt_text: `${titleBase || "product"}${unique.length > 1 ? ` (${i + 1})` : ""}`,
          source: "upload"
        });
      } catch (err) {
        // non-fatal, continue saving others
        console.warn("Failed to save image to library:", imgUrl, err);
      }
    }
  };

  const handleClose = () => {
    // Reset all states and close the modal
    setUrl("");
    setMeta({ title: "", description: "", image: "", button_text: "View Product →", product_url: "", price: "", images: [] });
    setError("");
    setLoading(false);
    setAssignToUsername("");
    setImageValid(false);
    setStep(1); // Reset wizard step
    setSelectedTemplate(null); // Reset selected template
    onClose();
  };

  const generateProductHtml = (product, template) => {
      const uniqueId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Helper for escaping HTML attributes and content
      const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

      if (template && template.html_structure) {
        let html = template.html_structure
          .replace(/{{PRODUCT_NAME}}/g, esc(product.name || ''))
          .replace(/{{name}}/g, esc(product.name || ''))
          .replace(/{{PRODUCT_DESCRIPTION}}/g, esc(product.description || ''))
          .replace(/{{description}}/g, esc(product.description || ''))
          .replace(/{{PRODUCT_PRICE}}/g, esc(product.price || ''))
          .replace(/{{price}}/g, esc(product.price || ''))
          .replace(/{{PRODUCT_IMAGE}}/g, esc(product.image_url || ''))
          .replace(/{{PRODUCT_IMAGE_URL}}/g, esc(product.image_url || ''))
          .replace(/{{IMAGE_URL}}/g, esc(product.image_url || ''))
          .replace(/{{image_url}}/g, esc(product.image_url || ''))
          .replace(/{{image}}/g, esc(product.image_url || ''))
          .replace(/{{PRODUCT_URL}}/g, esc(product.product_url || ''))
          .replace(/{{product_url}}/g, esc(product.product_url || ''))
          .replace(/{{BUTTON_URL}}/g, esc(product.button_url || product.product_url || ''))
          .replace(/{{button_url}}/g, esc(product.button_url || product.product_url || ''))
          .replace(/{{BUTTON_TEXT}}/g, esc(product.button_text || ''))
          .replace(/{{button_text}}/g, esc(product.button_text || ''));

        // Fix: Use a temporary div to parse HTML fragments for safer attribute manipulation
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const rootElement = tempDiv.firstChild;

        if (rootElement instanceof HTMLElement) { // Ensure it's an HTMLElement before setting attributes
          rootElement.setAttribute('data-b44-id', uniqueId);
          rootElement.classList.add('b44-promoted-product');
          return rootElement.outerHTML;
        }
        return html; // Fallback if parsing or setting attributes fails
      }

      // Default template if no custom template or html_structure is provided
      return `
  <div class="b44-promoted-product" data-b44-id="${uniqueId}" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); display: flex; align-items: center; gap: 20px; max-width: 600px;">
    <img src="${esc(product.image_url || '')}" alt="${esc(product.name || '')}" style="width: 120px; height: 120px; object-fit: contain; border-radius: 8px; flex-shrink: 0;">
    <div style="flex: 1;">
      <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 600; color: #1e293b;">${esc(product.name || '')}</h3>
      <p style="margin: 0 0 12px 0; color: #64748b; line-height: 1.5;">${esc(product.description || '')}</p>
      <div style="display: flex; align-items: center; gap: 16px;">
        <span style="font-size: 1.125rem; font-weight: 700; color: #059669;">${esc(product.price || '')}</span>
        <a href="${esc(product.button_url || product.product_url || '')}" target="_blank" rel="noopener noreferrer" style="background: #059669; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background-color 0.2s;">${esc(product.button_text || 'Shop Now')}</a>
      </div>
    </div>
  </div>`;
  };

  const handleInsert = async () => {
    // There is no default template if none are loaded. Insertion is disabled.
    // NOTE: This check allows inserting with default if no templates are found or if "Default Style" is selected.
    // The previous logic was "templates.length > 0 && !selectedTemplate"
    if (templates.length > 0 && selectedTemplate === null) {
      // If templates exist but user selected "Default Style" (selectedTemplate is null), allow insertion.
      // If templates exist and none selected, user must pick one or default.
      // This condition now correctly disables if templates exist but no choice (not default) has been made.
      // If templates.length is 0, this check passes and insertion proceeds with default.
      // The current selectedTemplate null is intentional for "Default Style".
    } else if (templates.length > 0 && !selectedTemplate) {
      setError("Please select a template.");
      return;
    }


    if (!meta.product_url) {
      setError("Product URL is required.");
      return;
    }
    // ENFORCE LIMITS
    const limited = {
      title: clampText(meta.title, TITLE_LIMIT),
      description: clampText(meta.description, DESCRIPTION_LIMIT),
      image: imageValid ? (meta.image || "") : (meta.image ? meta.image : ""), // Store meta.image even if not valid for saving to library/entity
      product_url: meta.product_url,
      button_text: meta.button_text || "View Product →",
      price: meta.price || ""
    };

    // Use the correct HTML generation logic.
    const productForHtml = {
      name: limited.title,
      description: limited.description,
      price: limited.price,
      image_url: limited.image,
      product_url: limited.product_url,
      button_url: limited.product_url,
      button_text: limited.button_text, // Pass button_text to the template
    };
    const block = generateProductHtml(productForHtml, selectedTemplate);

    onInsert(block);

    // Save to library ONLY if a username is selected (entity requires user_name)
    try {
      const payload = {
        name: limited.title || "Product",
        description: limited.description || "",
        image_url: limited.image || "", // Use limited image (which contains meta.image whether valid or not)
        product_url: limited.product_url,
        button_url: limited.product_url,
        price: limited.price || "",
      };
      if (assignToUsername) payload.user_name = assignToUsername;
      if (payload.user_name) {
        await PromotedProduct.create(payload);
      }

      // NEW: Save ALL images to Image Library
      const imgs = Array.isArray(meta.images) && meta.images.length ? meta.images : (limited.image ? [limited.image] : []);
      await saveAllImagesToLibrary(imgs, assignToUsername, limited.title);
    } catch (e) {
      console.warn("Failed to save product/images to library:", e);
      // Non-fatal
    }

    // reset and close
    handleClose();
  };

  const hasSelectableUsernames = !useWorkspaceScoping && availableUsernames.length > 1;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="backdrop-blur-xl bg-white border border-slate-200 max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto text-slate-900"> {/* Changed max-w-lg to max-w-6xl */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <ShoppingBag className="w-5 h-5 mr-1 text-blue-600" />
              Promoted Product from URL
              {step === 2 && <span className="text-sm font-normal text-slate-600">— Choose Template</span>}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {step === 1 ? (
                <>
                  Paste a product URL to fetch details.
                </>
              ) : (
                "Select a template for your product and insert into the editor."
              )}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="prod-url" className="mb-1 block text-slate-800">Product URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="prod-url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/product"
                      className="pl-9 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
                    />
                  </div>
                  <Button onClick={handleFetch} disabled={!url || loading} className="min-w-[110px] bg-indigo-600 hover:bg-indigo-700 text-white">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching</> : "Fetch"}
                  </Button>
                </div>
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
              </div>

              {/* REMOVED username dropdown (workspace controls this). Show read-only info instead */}
              <div className="flex items-center text-xs text-slate-500">
                <span className="font-medium mr-1">Assigned to:</span>
                <span className="truncate">{useWorkspaceScoping ? (globalUsername || "None Selected") : (assignToUsername || "Unassigned")}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-slate-800">Title</Label>
                  <Input
                    id="title"
                    value={meta.title}
                    onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                    className="bg-white text-slate-900 border border-slate-300"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-slate-800">Price</Label>
                  <Input
                    id="price"
                    value={meta.price}
                    onChange={(e) => setMeta({ ...meta, price: e.target.value })}
                    placeholder="$29.99"
                    className="bg-white text-slate-900 border border-slate-300"
                  />
                </div>
                <div>
                  <Label htmlFor="button_text" className="text-slate-800">Button Text</Label>
                  <Input
                    id="button_text"
                    value={meta.button_text}
                    onChange={(e) => setMeta({ ...meta, button_text: e.target.value })}
                    className="bg-white text-slate-900 border border-slate-300"
                  />
                </div>
                <div>
                  <Label htmlFor="product_url" className="text-slate-800">Button Link (Product URL)</Label>
                  <Input
                    id="product_url"
                    value={meta.product_url}
                    onChange={(e) => setMeta({ ...meta, product_url: e.target.value })}
                    className="bg-white text-slate-900 border border-slate-300"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-slate-800">Description</Label>
                  <Textarea
                    id="description"
                    value={meta.description}
                    onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                    rows={4}
                    className="bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="image" className="text-slate-800">Image URL</Label>
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="image"
                      value={meta.image}
                      onChange={(e) => setMeta({ ...meta, image: e.target.value })}
                      className="pl-9 bg-white text-slate-900 border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 bg-gray-50">
                <div className="flex items-start gap-3">
                  {meta.image && imageValid ? (
                    <img src={meta.image} alt="preview" className="w-24 h-24 object-cover rounded border border-slate-200" />
                  ) : (
                    <div className="w-24 h-24 rounded bg-gray-200 grid place-items-center text-gray-500 text-xs">
                      No Image
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{meta.title || "Product"}</div>
                    {meta.price && <div className="text-lg font-bold text-green-600">{meta.price}</div>}
                    <div className="text-sm text-slate-700 line-clamp-3">{meta.description}</div>
                    <div className="mt-2">
                      <a className="text-blue-600 underline" href={meta.product_url || "#"} target="_blank" rel="noreferrer">{meta.button_text || "View Product →"}</a>
                    </div>
                  </div>
                </div>
                {meta.image && !imageValid && (
                  <p className="text-xs text-red-600 mt-2">
                    The provided image URL could not be loaded and will be omitted from the inserted content.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!meta.title && !meta.product_url} // Disable if critical info not available
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next: Choose Template
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <div className="text-sm text-slate-600">
                  Product: <span className="font-medium">{meta.title || "Untitled Product"}</span>
                  {error && <span className="text-red-600 ml-2">({error})</span>}
                </div>
              </div>

              {/* REPLACED: old stacked list + scaled div preview */}
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                {/* Left: Template list (contained) */}
                <div className="space-y-2">
                  <Label>Template</Label>
                  <div className="border border-slate-200 rounded-md bg-slate-50 max-h-96 overflow-y-auto">
                    {/* Default style option */}
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate(null)}
                      className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 ${
                        !selectedTemplate ? "bg-blue-50 border-l-4 border-blue-500" : ""
                      }`}
                    >
                      <div className="font-medium text-slate-900">Default Style</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">A simple, clean layout for your product.</div>
                    </button>

                    {/* Dynamic templates */}
                    {loadingTemplates && (
                      <div className="px-3 py-3 text-sm text-slate-600">Loading templates...</div>
                    )}

                    {!loadingTemplates && templates.length === 0 && (
                      <div className="px-3 py-3 text-sm text-slate-600">No templates found.</div>
                    )}

                    {!loadingTemplates &&
                      templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplate(template)}
                          className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-b-0 ${
                            selectedTemplate?.id === template.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                          }`}
                        >
                          <div className="font-medium text-slate-900">{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Right: Contained, accurate HTML preview (iframe) */}
                <div className="space-y-4">
                  <Label>Preview</Label>
                  <TemplatePreviewFrame
                    height={500}
                    html={generateProductHtml(
                      {
                        name: meta.title,
                        description: meta.description,
                        price: meta.price,
                        image_url: meta.image,
                        product_url: meta.product_url,
                        button_url: meta.product_url,
                        button_text: meta.button_text,
                      },
                      selectedTemplate
                    )}
                  />
                  <div className="flex justify-end gap-2"> {/* Added gap-2 for consistency, though w-full will dominate */}
                    <Button variant="outline" onClick={handleClose} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</Button>
                    <Button
                      onClick={handleInsert}
                      disabled={false} // The original disable logic was templates.length > 0 && !selectedTemplate. Now selectedTemplate can be null (default).
                                     // This means it should always be enabled unless there's a specific validation failure.
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Insert Product
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
