
import React, { useState, useEffect, useRef } from "react";
import { PromotedProduct } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription } from
"@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingBag, Trash2, Edit, Loader2, Link as LinkIcon, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { extractProductMeta } from "@/api/functions";
import { InvokeLLM } from "@/api/integrations";
import { Switch } from "@/components/ui/switch";
import { CustomContentTemplate } from "@/api/entities";
import TemplatePreview from "@/components/templates/TemplatePreview"; // NEW import

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    image_url: "",
    product_url: "",
    button_url: "", // NEW: button link URL
    price: "",
    user_name: "",
    template_key: "gradient",
    sku: "",
    in_stock: true,
    review_count: 0,
    star_rating: 0,
    display_styles: {
      background_color: "",
      text_color: "",
      padding: "",
      layout: ""
    },
    font_settings: {
      title_font: "",
      title_size: 0,
      description_font: "",
      description_size: 0,
      price_font: "",
      price_size: 0
    },
    price_display: {
      show_original: false,
      original_price_color: "",
      currency_symbol: ""
    },
    custom_template_id: null // NEW: custom_template_id field
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [filterUsername, setFilterUsername] = useState("all");
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fieldLoading, setFieldLoading] = useState({ name: false, description: false });
  const productUrlRef = useRef(null);
  // NEW: productTemplates state
  const [productTemplates, setProductTemplates] = useState([]);

  // Replace existing loadProducts with memoized version
  const loadProducts = React.useCallback(async (user) => {
    setIsLoading(true);
    try {
      const allProducts = await PromotedProduct.list("-created_date");
      const assigned = user?.assigned_usernames || [];

      if (assigned.length > 0) {
        const filtered = allProducts.filter((p) => p.user_name && assigned.includes(p.user_name));
        setProducts(filtered);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
    setIsLoading(false);
  }, []);

  // Replace existing loadCurrentUser with memoized version
  const loadCurrentUser = React.useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      await loadProducts(user);

      // Set available usernames for dropdowns, strictly limited to assigned usernames.
      const assigned = user?.assigned_usernames || [];
      setAvailableUsernames([...assigned].sort());

    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, [loadProducts]);

  // Update effect to include loadCurrentUser in deps
  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // NEW: Effect to load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const tpls = await CustomContentTemplate.filter({
          associated_ai_feature: "product",
          is_active: true
        });
        setProductTemplates(tpls || []);
      } catch (e) {
        setProductTemplates([]);
        console.error("Error loading product templates:", e);
      }
    };
    loadTemplates();
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    // update reset newProduct to include custom_template_id and button_url
    setNewProduct({
      name: "",
      description: "",
      image_url: "",
      product_url: "",
      button_url: "", // NEW
      price: "",
      user_name: currentUser?.role === 'admin' ? availableUsernames[0] || "" : currentUser?.assigned_usernames?.[0] || "",
      template_key: "gradient",
      sku: "",
      in_stock: true,
      review_count: 0,
      star_rating: 0,
      display_styles: { background_color: "", text_color: "", padding: "", layout: "" },
      font_settings: { title_font: "", title_size: 0, description_font: "", description_size: 0, price_font: "", price_size: 0 },
      price_display: { show_original: false, original_price_color: "", currency_symbol: "" },
      custom_template_id: null
    });
    setFetchError(""); // Clear fetch error on close
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setNewProduct({
      name: "",
      description: "",
      image_url: "",
      product_url: "",
      button_url: "", // NEW
      price: "",
      user_name: currentUser?.role === 'admin' ? availableUsernames[0] || "" : currentUser?.assigned_usernames?.[0] || "",
      template_key: "gradient", // Default
      sku: "",
      in_stock: true,
      review_count: 0,
      star_rating: 0,
      display_styles: {
        background_color: "",
        text_color: "",
        padding: "",
        layout: ""
      },
      font_settings: {
        title_font: "",
        title_size: 0,
        description_font: "",
        description_size: 0,
        price_font: "",
        price_size: 0
      },
      price_display: {
        show_original: false,
        original_price_color: "",
        currency_symbol: ""
      },
      custom_template_id: productTemplates?.[0]?.id ?? null // Initialize with first template or null
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setNewProduct({
      ...product,
      template_key: product.template_key || "gradient",
      sku: product.sku || "",
      in_stock: product.in_stock !== undefined ? product.in_stock : true,
      review_count: product.review_count || 0,
      star_rating: product.star_rating || 0,
      product_url: product.product_url || "",
      button_url: product.button_url || product.product_url || "", // NEW: default to product_url if missing
      display_styles: {
        background_color: product.display_styles?.background_color || "",
        text_color: product.display_styles?.text_color || "",
        padding: product.display_styles?.padding || "",
        layout: product.display_styles?.layout || ""
      },
      font_settings: {
        title_font: product.font_settings?.title_font || "",
        title_size: product.font_settings?.title_size || 0,
        description_font: product.font_settings?.description_font || "",
        description_size: product.font_settings?.description_size || 0,
        price_font: product.font_settings?.price_font || "",
        price_size: product.font_settings?.price_size || 0
      },
      price_display: {
        show_original: !!product.price_display?.show_original,
        original_price_color: product.price_display?.original_price_color || "",
        currency_symbol: product.price_display?.currency_symbol || ""
      },
      custom_template_id: product.custom_template_id ?? null // Set from existing product
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (path, value) => {
    setNewProduct((prev) => {
      const nextProduct = { ...prev };
      let current = nextProduct;
      const pathParts = path.split('.');

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
      current[pathParts[pathParts.length - 1]] = value;
      return nextProduct;
    });
  };

  const handleUsernameChange = (value) => {
    setNewProduct((prev) => ({ ...prev, user_name: value }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.product_url || !newProduct.user_name) {
      toast.error("Name, Product URL, and Username are required.");
      return;
    }
    try {
      // Ensure empty string is null for custom_template_id if "None" is selected implicitly
      const productToSave = {
        ...newProduct,
        custom_template_id: newProduct.custom_template_id === "" ? null : newProduct.custom_template_id
      };

      if (editingProduct) {
        await PromotedProduct.update(editingProduct.id, productToSave);
        toast.success("Product updated successfully!");
      } else {
        await PromotedProduct.create(productToSave);
        toast.success("Product created successfully!");
      }
      handleModalClose();
      await loadProducts(currentUser);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product.");
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await PromotedProduct.delete(productToDelete.id);
        toast.success("Product deleted.");
        setProducts(products.filter((p) => p.id !== productToDelete.id));
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product.");
      } finally {
        setProductToDelete(null);
        setShowDeleteConfirm(false);
      }
    }
  };

  const handleFetchFromUrl = async () => {
    setFetchError("");
    const url = (newProduct.product_url || "").trim();
    if (!url) {
      setFetchError("Please enter a product URL first.");
      return;
    }
    setIsFetchingMeta(true);
    try {
      const { data } = await extractProductMeta({ url });
      if (!data?.success) {
        setFetchError(data?.error || "Failed to fetch product details.");
        toast.error("Could not fetch product details from URL.");
      } else {
        setNewProduct((prev) => ({
          ...prev,
          name: data.title || prev.name,
          description: data.description || prev.description,
          image_url: data.image || prev.image_url,
          product_url: data.url || prev.product_url,
          button_url: prev.button_url || data.url || prev.product_url, // NEW: default button link
          price: data.price || prev.price
        }));
        toast.success("Product details imported from URL!");
      }
    } catch (e) {
      setFetchError(e?.message || "Unexpected error while fetching metadata.");
      toast.error("Unexpected error while fetching product details.");
    }
    setIsFetchingMeta(false);
  };

  // Per-field AI rewrite for title/description
  const rewriteField = async (field) => {
    if (!newProduct) return;
    setFieldLoading((f) => ({ ...f, [field]: true }));
    try {
      let prompt = "";
      if (field === "name") {
        prompt = `Rewrite ONLY the product title to be concise, compelling and SEO-friendly while preserving factual meaning and brand terms.
- Prefer 5–9 words
- No quotes
- Output ONLY the new title text

Current title: "${newProduct.name || ""}"
Description (for context): "${String(newProduct.description || "").slice(0, 800)}"`;
      } else if (field === "description") {
        prompt = `Rewrite ONLY the product description to be concise and conversion-focused.
- Preserve factual details
- Improve clarity and flow
- 60–120 words
- No HTML, output plain text only

Current description: "${String(newProduct.description || "")}"

Title (context): "${newProduct.name || ""}"`;
      } else {
        return;
      }

      const res = await InvokeLLM({ prompt });
      const text = typeof res === "string" ? res.trim() : (res?.text || "").trim();
      if (!text) {
        toast.error("AI didn't return a value. Please try again.");
      } else {
        setNewProduct((prev) => ({ ...prev, [field]: text }));
        toast.success("Updated with AI.");
      }
    } catch (e) {
      console.error("AI rewrite error:", e);
      toast.error("AI rewrite failed. Please try again.");
    }
    setFieldLoading((f) => ({ ...f, [field]: false }));
  };

  const filteredProducts = products.filter((p) => filterUsername === 'all' || p.user_name === filterUsername);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-600">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            Promoted Product Manager
          </h1>
          <Button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        <div className="mb-6 max-w-sm">
          <Label htmlFor="filter-username" className="text-slate-700">Filter by Username</Label>
          <Select value={filterUsername} onValueChange={setFilterUsername}>
            <SelectTrigger id="filter-username" className="bg-white border-slate-300 text-slate-900 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="all">All Users</SelectItem>
              {availableUsernames.map((username) =>
              <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {isLoading ?
        <div className="text-center py-10 text-slate-600">Loading products...</div> :
        filteredProducts.length === 0 ?
        <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-600">No products found for the selected user.</p>
          </div> :

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) =>
          <div key={product.id} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                {product.image_url &&
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-40 object-cover rounded-md mb-4" />

            }
                <h3 className="text-xl font-semibold mb-2 text-slate-900">{product.name}</h3>
                <p className="text-blue-600 font-bold text-lg mb-3">{product.price}</p>
                <p className="text-slate-600 mb-4 h-20 overflow-y-auto">{product.description}</p>
                <p className="text-xs text-slate-500 mb-4">Username: {product.user_name}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(product)} className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Edit className="w-4 h-4 mr-1" />Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(product)} className="bg-blue-800 text-slate-100 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md w-full border border-red-200 hover:bg-red-100">
                    <Trash2 className="w-4 h-4 mr-1" />Delete
                  </Button>
                </div>
              </div>
          )}
          </div>
        }
      </div>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 w-[96vw] max-w-[860px] max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription className="text-slate-600">
              {editingProduct ? 'Update the details for this product.' : 'Paste a product URL to auto-fill details, or enter them manually.'}
            </DialogDescription>
            <div className="mt-2 flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  productUrlRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setTimeout(() => {
                    const el = document.getElementById('product_url');
                    if (el) el.focus();
                  }, 350);
                }}>

                Import via URL
              </Button>
            </div>
          </DialogHeader>

          {/* FORM */}
          <form onSubmit={handleSaveProduct} className="space-y-4 break-words">
            {/* Import via URL section stays on top */}
            <div ref={productUrlRef} id="product_url_section">
              <Label htmlFor="product_url" className="text-slate-700">Product URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="product_url"
                    name="product_url"
                    value={newProduct.product_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/product"
                    className="bg-white text-slate-900 placeholder:text-slate-500 pl-9 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    required />

                </div>
                <Button
                  type="button"
                  onClick={handleFetchFromUrl}
                  disabled={isFetchingMeta || !newProduct.product_url}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]">

                  {isFetchingMeta ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching</> : 'Fetch from URL'}
                </Button>
              </div>
              {fetchError && <p className="text-red-600 text-xs mt-2">{fetchError}</p>}
            </div>

            {/* Basic fields */}
            <div>
              <Label htmlFor="name" className="text-slate-700">Product Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  required
                  className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flex-1" />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => rewriteField("name")}
                  disabled={fieldLoading.name}
                  className="min-w-[120px] bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Magic rewrite title">

                  {fieldLoading.name ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Magic</> : <><Wand2 className="w-4 h-4 mr-2" />Magic</>}
                </Button>
              </div>
            </div>

            {/* NEW: Button Link URL field */}
            <div>
              <Label htmlFor="button_url" className="text-slate-700">Button Link URL</Label>
              <Input
                id="button_url"
                name="button_url"
                value={newProduct.button_url}
                onChange={handleInputChange}
                placeholder="https://example.com/your-affiliate-or-cart-link"
                className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300" />

              <p className="text-xs text-slate-500 mt-1">
                This is where the inserted product button will link to. If left blank, it will use the Product URL.
              </p>
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700">Description</Label>
              <div className="flex gap-2">
                <Textarea
                  id="description"
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-sm flex min-h-[80px] w-full rounded-md border border-slate-300 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1" />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => rewriteField("description")}
                  disabled={fieldLoading.description}
                  className="h-auto min-w-[120px] bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Magic rewrite description">

                  {fieldLoading.description ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Magic</> : <><Wand2 className="w-4 h-4 mr-2" />Magic</>}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="image_url" className="text-slate-700">Image URL</Label>
              <Input
                id="image_url"
                name="image_url"
                value={newProduct.image_url}
                onChange={handleInputChange}
                placeholder="Auto-filled from URL when available"
                className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

            </div>

            <div>
              <Label htmlFor="price" className="text-slate-700">Price</Label>
              <Input
                id="price"
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                placeholder="$29.99"
                className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

            </div>

            {/* Dynamic Template Selector */}
            <div>
              <Label className="text-slate-700">Dynamic Template</Label>
              <Select
                value={newProduct.custom_template_id ? newProduct.custom_template_id : "__none__"}
                onValueChange={(v) =>
                setNewProduct((prev) => ({ ...prev, custom_template_id: v === "__none__" ? null : v }))
                }>

                <SelectTrigger className="bg-white border-slate-300 text-slate-900 px-3 py-2 h-10">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="__none__">None</SelectItem>
                  {productTemplates.map((tpl) =>
                  <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Templates are managed in Assets → Templates. Only active Product templates appear here.
              </p>

              {/* Thumbnail preview under the selected template */}
              {newProduct.custom_template_id ?
              <TemplatePreview
                className="mt-2"
                template={productTemplates.find((t) => t.id === newProduct.custom_template_id)}
                product={newProduct} /> :

              null}
            </div>

            <div>
              <Label htmlFor="user_name" className="text-slate-700">Assign to Username</Label>
              <Select name="user_name" value={newProduct.user_name} onValueChange={handleUsernameChange} required>
                <SelectTrigger className="bg-white text-slate-900 border border-slate-300 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md">
                  <SelectValue placeholder="Select a username" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {availableUsernames.map((username) =>
                  <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">{editingProduct ? 'Update Product' : 'Save Product'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}