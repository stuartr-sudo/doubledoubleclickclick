
import React, { useState, useEffect, useRef } from "react";
import { PromotedProduct } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingBag, Trash2, Edit, Loader2, Link as LinkIcon, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { extractProductMeta } from "@/api/functions";
import { InvokeLLM } from "@/api/integrations";
import { Switch } from "@/components/ui/switch";
import { ImageLibraryItem } from "@/api/entities";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";


// New ProductForm component
function ProductForm({
  initialProduct,
  onSave,
  onCancel,
  availableUsernames,
  isSaving,
  currentUser, // Passed from ProductManager
  globalUsername, // Passed from ProductManager
  useWorkspaceScoping, // Passed from ProductManager
  consumeTokensForFeature // Passed from ProductManager
}) {
  const [newProduct, setNewProduct] = useState(initialProduct);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fieldLoading, setFieldLoading] = useState({ name: false, description: false });
  const productUrlRef = useRef(null);

  // Sync initialProduct prop changes to internal state (for editing an existing product)
  useEffect(() => {
    setNewProduct(initialProduct);
  }, [initialProduct]);

  const handleChange = (e) => {
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
        if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
          current[part] = {}; // Ensure it's an object, not array or primitive
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

  const handleFetchFromUrl = async () => {
    setFetchError("");
    const url = (newProduct.product_url || "").trim();
    if (!url) {
      setFetchError("Please enter a product URL first.");
      return;
    }

    const result = await consumeTokensForFeature('ai_product_url_import');
    if (!result.success) {
      return;
    }

    setIsFetchingMeta(true);
    try {
      const { data } = await extractProductMeta({ url });
      if (!data?.success) {
        setFetchError(data?.error || "Failed to fetch product details.");
        toast.error("Could not fetch product details from URL.");
      } else {
        const [mainImage, ...additionalImages] = data.images || [];

        setNewProduct((prev) => ({
          ...prev,
          name: data.title || prev.name,
          description: data.description || prev.description,
          image_url: mainImage || prev.image_url,
          product_url: data.url || prev.product_url,
          button_url: prev.button_url || data.url || prev.product_url,
          price: data.price || prev.price
        }));

        toast.success("Product details imported from URL!");

        if (additionalImages.length > 0) {
          if (newProduct.user_name) {
            const libraryItems = additionalImages.map((imgUrl) => ({
              url: imgUrl,
              alt_text: `${data.title || newProduct.name} - additional image`,
              source: "product_import",
              user_name: newProduct.user_name,
              tags: ["product-import", data.title || newProduct.name].filter(Boolean)
            }));

            try {
              await ImageLibraryItem.bulkCreate(libraryItems);
              toast.success(`${additionalImages.length} additional image(s) saved to library for user: ${newProduct.user_name}.`);
            } catch (e) {
              console.error("Failed to save additional images to library:", e);
              toast.warning("Could not save additional images to library.");
            }
          } else {
            toast.info("Additional images were found, but no username is selected to save them to the library.");
          }
        }
      }
    } catch (e) {
      setFetchError(e?.message || "Unexpected error while fetching metadata.");
      toast.error("Unexpected error while fetching product details.");
    }
    setIsFetchingMeta(false);
  };

  const rewriteField = async (field) => {
    if (!newProduct) return;

    let featureFlagKey;
    if (field === "name") {
      featureFlagKey = 'ai_product_name_rewrite';
    } else if (field === "description") {
      featureFlagKey = 'ai_product_description_rewrite';
    } else {
      return;
    }

    const result = await consumeTokensForFeature(featureFlagKey);
    if (!result.success) {
      return;
    }

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
- Maximum 22 words
- No HTML, output plain text only

Current description: "${String(newProduct.description || "")}"

Title (context): "${newProduct.name || ""}"`;
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.product_url || !newProduct.user_name) {
      toast.error("Name, Product URL, and Username are required.");
      return;
    }
    onSave(newProduct);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="bg-white border border-slate-200 text-slate-900 w-[96vw] max-w-[860px] max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-blue-900">{initialProduct.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {initialProduct.id ? 'Update the details for this product.' : 'Paste a product URL to auto-fill details, or enter them manually.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 break-words">
          <div ref={productUrlRef} id="product_url_section">
            <Label htmlFor="product_url" className="text-slate-700">Product URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="product_url"
                  name="product_url"
                  value={newProduct.product_url}
                  onChange={handleChange}
                  placeholder="https://example.com/product"
                  className="bg-white text-slate-900 placeholder:text-slate-500 pl-9 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  required
                />
              </div>
              <Button
                type="button"
                onClick={handleFetchFromUrl}
                disabled={isFetchingMeta || !newProduct.product_url || isSaving}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(0,0,128,0.6),0_0_40px_rgba(0,0,128,0.4)] text-white min-w-[130px]"
              >
                {isFetchingMeta ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching</> : 'Fetch from URL'}
              </Button>
            </div>
            {fetchError && <p className="text-red-600 text-xs mt-2">{fetchError}</p>}
          </div>

          <div>
            <Label htmlFor="name" className="text-slate-700">Product Name</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                name="name"
                value={newProduct.name}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => rewriteField("name")}
                disabled={fieldLoading.name || isSaving}
                className="min-w-[120px] bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                title="Magic rewrite title"
              >
                {fieldLoading.name ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Magic</> : <><Wand2 className="w-4 h-4 mr-2" />Magic</>}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="button_url" className="text-slate-700">Button Link URL</Label>
            <Input
              id="button_url"
              name="button_url"
              value={newProduct.button_url}
              onChange={handleChange}
              placeholder="https://example.com/your-affiliate-or-cart-link"
              disabled={isSaving}
              className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300"
            />
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
                onChange={handleChange}
                disabled={isSaving}
                className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-sm flex min-h-[80px] w-full rounded-md border border-slate-300 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => rewriteField("description")}
                disabled={fieldLoading.description || isSaving}
                className="h-auto min-w-[120px] bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                title="Magic rewrite description"
              >
                {fieldLoading.description ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Magic</> : <><Wand2 className="w-4 h-4 mr-2" />Magic</>}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="image_url" className="text-slate-700">Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              value={newProduct.image_url || ""}
              onChange={handleChange}
              placeholder="Auto-filled from URL when available"
              disabled={isSaving}
              className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="price" className="text-slate-700">Price</Label>
            <Input
              id="price"
              name="price"
              value={newProduct.price || ""}
              onChange={handleChange}
              placeholder="$29.99"
              disabled={isSaving}
              className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="user_name" className="text-slate-700">Assign to Username</Label>
            {useWorkspaceScoping ?
              <Input
                value={globalUsername || "No workspace selected"}
                disabled
                className="bg-slate-100 border-slate-300 text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background"
              /> :
              <Select name="user_name" value={newProduct.user_name} onValueChange={handleUsernameChange} required disabled={isSaving}>
                <SelectTrigger className="bg-white text-slate-900 border border-slate-300 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md">
                  <SelectValue placeholder="Select a username" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {availableUsernames.map((username) => (
                    <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving</> : (initialProduct.id ? 'Update Product' : 'Save Product')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false); // Controls visibility of ProductForm
  const [productFormData, setProductFormData] = useState(null); // Data for ProductForm
  const [isSavingProduct, setIsSavingProduct] = useState(false); // Loading state for save action
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [filterUsername, setFilterUsername] = useState("all");

  const { consumeTokensForFeature } = useTokenConsumption();
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  const activeFilterUsername = useWorkspaceScoping ? globalUsername || "all" : filterUsername;

  const loadProducts = React.useCallback(async (user) => {
    setIsLoading(true);
    setProducts([]);
    try {
      const assigned = user?.assigned_usernames || [];

      if (assigned.length > 0) {
        const allAssignedProducts = await PromotedProduct.filter({ user_name: assigned }, "-created_date");
        const uniqueProducts = Array.from(new Map(allAssignedProducts.map(p => [p.id, p])).values());
        uniqueProducts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setProducts(uniqueProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCurrentUser = React.useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      await loadProducts(user);

      const assigned = user?.assigned_usernames || [];
      setAvailableUsernames([...assigned].sort());

    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, [loadProducts]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Removed useEffect for loading product templates

  const handleProductFormClose = () => {
    setShowProductForm(false);
    setProductFormData(null);
  };

  const handleAddClick = () => {
    setProductFormData({
      name: "",
      description: "",
      image_url: "",
      product_url: "",
      button_url: "",
      price: "",
      user_name: useWorkspaceScoping ? globalUsername || "" : currentUser?.role === 'admin' ? availableUsernames[0] || "" : currentUser?.assigned_usernames?.[0] || "",
      template_key: "gradient", // This can remain as a default or be removed if template_key is fully deprecated
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
      // custom_template_id removed
    });
    setShowProductForm(true);
  };

  const handleEditClick = (product) => {
    setProductFormData({
      ...product,
      template_key: product.template_key || "gradient", // This can remain as a default or be removed if template_key is fully deprecated
      sku: product.sku || "",
      in_stock: product.in_stock !== undefined ? product.in_stock : true,
      review_count: product.review_count || 0,
      star_rating: product.star_rating || 0,
      product_url: product.product_url || "",
      button_url: product.button_url || product.product_url || "",
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
      // custom_template_id removed
    });
    setShowProductForm(true);
  };

  const handleProductFormSave = async (productData) => {
    setIsSavingProduct(true);
    try {
      // custom_template_id handling removed
      if (productData.id) { // Check if it's an existing product by looking for an ID
        await PromotedProduct.update(productData.id, productData);
        toast.success("Product updated successfully!");
      } else {
        await PromotedProduct.create(productData);
        toast.success("Product created successfully!");
      }
      handleProductFormClose();
      await loadProducts(currentUser);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product.");
    } finally {
      setIsSavingProduct(false);
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

  const filteredProducts = products.filter((p) => activeFilterUsername === 'all' || p.user_name === activeFilterUsername);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-900">
            <ShoppingBag className="w-8 h-8 text-blue-900" />
            Promoted Product Manager
          </h1>
          <Button onClick={handleAddClick} className="bg-blue-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        {!useWorkspaceScoping &&
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
        }

        {isLoading ?
          <div className="text-center py-10 text-slate-600">Loading products...</div> :
          filteredProducts.length === 0 ?
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600">No products found for the selected user.</p>
            </div> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) =>
                <div key={product.id} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                  {product.image_url &&
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-md mb-4" />
                  }
                  <h3 className="text-xl font-semibold mb-2 text-blue-900">{product.name}</h3>
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

      {showProductForm && productFormData && (
        <ProductForm
          initialProduct={productFormData}
          onSave={handleProductFormSave}
          onCancel={handleProductFormClose}
          availableUsernames={availableUsernames}
          isSaving={isSavingProduct}
          currentUser={currentUser}
          globalUsername={globalUsername}
          useWorkspaceScoping={useWorkspaceScoping}
          consumeTokensForFeature={consumeTokensForFeature}
        />
      )}

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
    </div>
  );
}
