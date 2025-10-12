
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
  DialogFooter } from

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
import { Plus, ShoppingBag, Trash2, Edit, Loader2, Link as LinkIcon, Wand2, X, ShoppingCart, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { extractProductMeta } from "@/api/functions";
import { InvokeLLM } from "@/api/integrations";
import { Switch } from "@/components/ui/switch";
import { ImageLibraryItem } from "@/api/entities";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { motion, AnimatePresence } from "framer-motion";
import { Testimonial } from "@/api/entities";
import { AmazonProductVideo } from "@/api/entities";
import { amazonProduct } from "@/api/functions";


// NEW: Helper function to detect Amazon ASIN
function extractAsinFromUrl(url) {
  if (!url) return null;
  const str = String(url).trim();
  const match = str.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

// New ProductForm component that renders inline (no Dialog wrapper)
function InlineProductForm({
  initialProduct,
  onSave,
  onCancel,
  availableUsernames,
  isSaving,
  currentUser,
  globalUsername,
  useWorkspaceScoping,
  consumeTokensForFeature
}) {
  const [newProduct, setNewProduct] = useState(initialProduct);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fieldLoading, setFieldLoading] = useState({ name: false, description: false });

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

    // NEW: Detect if this is an Amazon URL
    const asin = extractAsinFromUrl(url);
    const isAmazonUrl = !!asin;

    if (isAmazonUrl) {
      // Use Amazon import flow
      const currentUsername = useWorkspaceScoping ? (globalUsername && globalUsername !== 'all' ? globalUsername : null) :
        (newProduct.user_name || null);

      if (!currentUsername) {
        setFetchError("Please select a username to assign the imported product.");
        return;
      }

      const tokenCheck = await consumeTokensForFeature("image_library_amazon_import");
      if (!tokenCheck?.success) {
        return;
      }

      setIsFetchingMeta(true);
      try {
        const { data: res } = await amazonProduct({ url: url });
        if (!res?.success) {
          if (res?.error && res.error.includes("exceeded the MONTHLY quota")) {
            setFetchError("Amazon Import Quota Reached. You've used all your free Amazon data requests for the month.");
          } else {
            setFetchError(res?.error || "Failed to fetch product details from Amazon.");
          }
          setIsFetchingMeta(false);
          return;
        }

        const p = res.data;

        // Build enriched description
        let enrichedDescription = "";
        if (p.product_description) {
          enrichedDescription += p.product_description + "\n\n";
        }
        if (p.product_information && typeof p.product_information === 'object') {
          enrichedDescription += "\n";
          Object.entries(p.product_information).forEach(([key, value]) => {
            if (key && value) {
              enrichedDescription += `${key}: ${value}\n`;
            }
          });
        }
        if (p.product_details && typeof p.product_details === 'object') {
          enrichedDescription += "\n";
          Object.entries(p.product_details).forEach(([key, value]) => {
            if (key && value) {
              enrichedDescription += `${key}: ${value}\n`;
            }
          });
        }

        // Collect images
        const allImageUrls = new Set();
        if (p.product_photos && Array.isArray(p.product_photos)) {
          p.product_photos.forEach(imgUrl => {
            if (imgUrl) allImageUrls.add(imgUrl);
          });
        }
        if (p.color && Array.isArray(p.color)) {
          p.color.forEach(colorVariant => {
            if (colorVariant.image) {
              allImageUrls.add(colorVariant.image);
            }
          });
        }

        // Save images to library
        let createdImages = 0;
        for (const imageUrl of allImageUrls) {
          try {
            await ImageLibraryItem.create({
              url: imageUrl,
              alt_text: `${p.product_title || 'Amazon Product'} - Image`,
              source: 'upload',
              user_name: currentUsername,
              tags: ['amazon-import', p.asin].filter(Boolean)
            });
            createdImages++;
          } catch (err) {
            console.error("Failed to create image:", err);
          }
        }
        if (createdImages > 0) {
          toast.success(`Added ${createdImages} images to Image Library`);
        }

        // Create testimonials from reviews
        if (p.top_reviews && Array.isArray(p.top_reviews)) {
          let createdTestimonials = 0;
          for (const review of p.top_reviews) {
            try {
              await Testimonial.create({
                source: "amazon",
                asin: p.asin,
                country: p.country || "US",
                review_id: review.review_id || "",
                review_title: review.review_title || "",
                review_comment: review.review_comment || "",
                review_star_rating: parseFloat(review.review_star_rating) || 0,
                review_link: review.review_link || "",
                review_author: review.review_author || "Anonymous",
                review_author_avatar: review.review_author_avatar || "",
                review_date: review.review_date || "",
                is_verified_purchase: review.is_verified_purchase || false,
                helpful_vote_statement: review.helpful_vote_statement || "",
                images: review.review_images || [],
                product_title: p.product_title || "",
                user_name: currentUsername
              });
              createdTestimonials++;
            } catch (err) {
              console.error("Failed to create testimonial:", err);
            }
          }
          if (createdTestimonials > 0) {
            toast.success(`Created ${createdTestimonials} testimonials from Amazon reviews`);
          }
        }

        // Create videos
        if (p.product_videos && Array.isArray(p.product_videos)) {
          let createdVideos = 0;
          for (const video of p.product_videos) {
            try {
              await AmazonProductVideo.create({
                video_id: video.id || "",
                title: video.title || "",
                video_url: video.video_url || "",
                thumbnail_url: video.thumbnail_url || "",
                product_asin: video.product_asin || p.asin || "",
                parent_asin: video.parent_asin || p.asin || "",
                video_height: video.video_height || null,
                video_width: video.video_width || null,
                user_name: currentUsername
              });
              createdVideos++;
            } catch (err) {
              console.error("Failed to create video:", err);
            }
          }
          if (createdVideos > 0) {
            toast.success(`Added ${createdVideos} videos to Video Library`);
          }
        }

        // Update form with Amazon data
        setNewProduct((prev) => ({
          ...prev,
          name: p.product_title || prev.name,
          description: enrichedDescription.trim(),
          image_url: allImageUrls.size > 0 ? Array.from(allImageUrls)[0] : (p.product_photo || prev.image_url),
          product_url: p.product_url || url,
          button_url: prev.button_url || p.product_url || url,
          price: p.product_price || prev.price,
          sku: p.asin || prev.sku,
          in_stock: p.product_availability?.toLowerCase().includes("in stock") ?? true,
          review_count: p.product_num_ratings || 0,
          star_rating: parseFloat(p.product_star_rating) || 0
        }));

        // REMOVED: toast.success("Product details imported from Amazon!"); // This line is removed.
      } catch (e) {
        setFetchError(e?.message || "Unexpected error while fetching from Amazon.");
        toast.error("Unexpected error while fetching Amazon product.");
      }
      setIsFetchingMeta(false);

    } else {
      // Use standard product import flow
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

          // REMOVED: toast.success("Product details imported from URL!"); // This line is removed.

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
    }
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
    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-blue-900">
          {initialProduct.id ? 'Edit Product' : 'Add New Product'}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600">

          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div id="product_url_section">
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
                required />

            </div>
            <Button
              type="button"
              onClick={handleFetchFromUrl}
              disabled={isFetchingMeta || !newProduct.product_url || isSaving}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(0,0,128,0.6),0_0_40px_rgba(0,0,128,0.4)] text-white min-w-[130px]">

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
              className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flex-1" />

            <Button
              type="button"
              variant="outline"
              onClick={() => rewriteField("name")}
              disabled={fieldLoading.name || isSaving}
              className="min-w-[120px] bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Magic rewrite title">

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
              onChange={handleChange}
              disabled={isSaving}
              className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-sm flex min-h-[80px] w-full rounded-md border border-slate-300 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1" />

            <Button
              type="button"
              variant="outline"
              onClick={() => rewriteField("description")}
              disabled={fieldLoading.description || isSaving}
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
            value={newProduct.image_url || ""}
            onChange={handleChange}
            placeholder="Auto-filled from URL when available"
            disabled={isSaving}
            className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

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
            className="bg-white text-slate-900 placeholder:text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border border-slate-300 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

        </div>

        <div>
          <Label htmlFor="user_name" className="text-slate-700">Assign to Username</Label>
          {useWorkspaceScoping ?
          <Input
            value={globalUsername || "No workspace selected"}
            disabled
            className="bg-slate-100 border-slate-300 text-slate-500 px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background" /> :

          <Select name="user_name" value={newProduct.user_name} onValueChange={handleUsernameChange} required disabled={isSaving}>
              <SelectTrigger className="bg-white text-slate-900 border border-slate-300 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md">
                <SelectValue placeholder="Select a username" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {availableUsernames.map((username) =>
              <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>
              )}
              </SelectContent>
            </Select>
          }
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="bg-background text-slate-900 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 border border-input hover:bg-accent hover:text-accent-foreground h-10">
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving</> : initialProduct.id ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>);

}


export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [productFormData, setProductFormData] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [filterUsername, setFilterUsername] = useState("all");
  
  // NEW: Amazon Import inline state
  const [amazonExpanded, setAmazonExpanded] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState("");
  const [amazonLoading, setAmazonLoading] = useState(false);

  const { consumeTokensForFeature } = useTokenConsumption();
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // NEW: Feature flag for Amazon import button
  const { enabled: showAmazonImportButton } = useFeatureFlag('ai-hub-promoted-product-import-from-amazon', {
    currentUser: currentUser,
    defaultEnabled: true
  });

  const activeFilterUsername = useWorkspaceScoping ? globalUsername || "all" : filterUsername;

  const loadProducts = React.useCallback(async (user) => {
    setIsLoading(true);
    setProducts([]);
    try {
      const assigned = user?.assigned_usernames || [];

      if (assigned.length > 0) {
        const allAssignedProducts = await PromotedProduct.filter({ user_name: assigned }, "-created_date");
        const uniqueProducts = Array.from(new Map(allAssignedProducts.map((p) => [p.id, p])).values());
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

  const handleInlineFormClose = () => {
    setShowInlineForm(false);
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
      sku: "",
      in_stock: true,
      review_count: 0,
      star_rating: 0,
      category: ""
    });
    setShowInlineForm(true);
    setAmazonExpanded(false); // Close Amazon if open
  };

  const handleEditClick = (product) => {
    setProductFormData({
      ...product,
      sku: product.sku || "",
      in_stock: product.in_stock !== undefined ? product.in_stock : true,
      review_count: product.review_count || 0,
      star_rating: product.star_rating || 0,
      product_url: product.product_url || "",
      button_url: product.button_url || product.product_url || "",
      category: product.category || ""
    });
    setShowInlineForm(true);
    setAmazonExpanded(false); // Close Amazon if open
  };

  const handleProductFormSave = async (productData) => {
    setIsSavingProduct(true);
    try {
      if (productData.id) {
        await PromotedProduct.update(productData.id, productData);
        toast.success("Product updated successfully!");
      } else {
        await PromotedProduct.create(productData);
        toast.success("Product created successfully!");
      }
      handleInlineFormClose();
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

  // NEW: Amazon Import Handler (using full AmazonImport page logic)
  const handleAmazonImport = async () => {
    const url = amazonUrl.trim();
    if (!url) {
      toast.error("Please enter an Amazon product URL.");
      return;
    }

    const currentUsername = useWorkspaceScoping ? (globalUsername && globalUsername !== 'all' ? globalUsername : null) :
      (filterUsername !== "all" ? filterUsername : null);

    if (!currentUsername) {
      toast.error("Please select a username in the workspace selector or filter to assign the imported product.");
      return;
    }

    const tokenCheck = await consumeTokensForFeature("image_library_amazon_import");
    if (!tokenCheck?.success) {
      return;
    }

    setAmazonLoading(true);
    try {
      const { data: res } = await amazonProduct({ url: amazonUrl });
      if (!res?.success) {
        if (res?.error && res.error.includes("exceeded the MONTHLY quota")) {
          toast.error("Amazon Import Quota Reached", {
            description: "You've used all your free Amazon data requests for the month. To continue, please upgrade your plan on RapidAPI.",
            duration: 10000,
          });
        } else {
          toast.error(res?.error || "Failed to fetch product details.");
        }
        return;
      }

      const p = res.data;

      // Build enriched description
      let enrichedDescription = "";
      
      if (p.product_description) {
        enrichedDescription += p.product_description + "\n\n";
      }
      
      if (p.product_information && typeof p.product_information === 'object') {
        enrichedDescription += "\n";
        Object.entries(p.product_information).forEach(([key, value]) => {
          if (key && value) {
            enrichedDescription += `${key}: ${value}\n`;
          }
        });
      }
      
      if (p.product_details && typeof p.product_details === 'object') {
        enrichedDescription += "\n";
        Object.entries(p.product_details).forEach(([key, value]) => {
          if (key && value) {
            enrichedDescription += `${key}: ${value}\n`;
          }
        });
      }

      // Create images ONLY from product_photos and color array
      const allImageUrls = new Set();
      
      if (p.product_photos && Array.isArray(p.product_photos)) {
        p.product_photos.forEach(imgUrl => {
          if (imgUrl) allImageUrls.add(imgUrl);
        });
      }
      
      if (p.color && Array.isArray(p.color)) {
        p.color.forEach(colorVariant => {
          if (colorVariant.image) {
            allImageUrls.add(colorVariant.image);
          }
        });
      }

      let createdImages = 0;
      for (const imageUrl of allImageUrls) {
        try {
          await ImageLibraryItem.create({
            url: imageUrl,
            alt_text: `${p.product_title || 'Amazon Product'} - Image`,
            source: 'upload',
            user_name: currentUsername,
            tags: ['amazon-import', p.asin].filter(Boolean)
          });
          createdImages++;
        } catch (err) {
          console.error("Failed to create image:", err);
        }
      }
      if (createdImages > 0) {
        toast.success(`Added ${createdImages} images to Image Library`);
      }

      // Create testimonials from top_reviews
      if (p.top_reviews && Array.isArray(p.top_reviews)) {
        let createdTestimonials = 0;
        for (const review of p.top_reviews) {
          try {
            await Testimonial.create({
              source: "amazon",
              asin: p.asin,
              country: p.country || "US",
              review_id: review.review_id || "",
              review_title: review.review_title || "",
              review_comment: review.review_comment || "",
              review_star_rating: parseFloat(review.review_star_rating) || 0,
              review_link: review.review_link || "",
              review_author: review.review_author || "Anonymous",
              review_author_avatar: review.review_author_avatar || "",
              review_date: review.review_date || "",
              is_verified_purchase: review.is_verified_purchase || false,
              helpful_vote_statement: review.helpful_vote_statement || "",
              images: review.review_images || [],
              product_title: p.product_title || "",
              user_name: currentUsername
            });
            createdTestimonials++;
          } catch (err) {
            console.error("Failed to create testimonial:", err);
          }
        }
        if (createdTestimonials > 0) {
          toast.success(`Created ${createdTestimonials} testimonials from Amazon reviews`);
        }
      }

      // Create videos from product_videos
      if (p.product_videos && Array.isArray(p.product_videos)) {
        let createdVideos = 0;
        for (const video of p.product_videos) {
          try {
            await AmazonProductVideo.create({
              video_id: video.id || "",
              title: video.title || "",
              video_url: video.video_url || "",
              thumbnail_url: video.thumbnail_url || "",
              product_asin: video.product_asin || p.asin || "",
              parent_asin: video.parent_asin || p.asin || "",
              video_height: video.video_height || null,
              video_width: video.video_width || null,
              user_name: currentUsername
            });
            createdVideos++;
          } catch (err) {
            console.error("Failed to create video:", err);
          }
        }
        if (createdVideos > 0) {
          toast.success(`Added ${createdVideos} videos to Video Library`);
        }
      }

      // Create the promoted product
      await PromotedProduct.create({
        name: p.product_title || 'Amazon Product',
        description: enrichedDescription.trim(),
        image_url: allImageUrls.size > 0 ? Array.from(allImageUrls)[0] : (p.product_photo || ""),
        product_url: p.product_url || amazonUrl,
        button_url: p.product_url || amazonUrl,
        price: p.product_price || '',
        user_name: currentUsername,
        sku: p.asin || '',
        in_stock: p.product_availability?.toLowerCase().includes("in stock") ?? true,
        review_count: p.product_num_ratings || 0,
        star_rating: parseFloat(p.product_star_rating) || 0
      });

      toast.success(`Successfully imported "${p.product_title || 'Amazon Product'}"!`);
      await loadProducts(currentUser);
      setAmazonExpanded(false);
      setAmazonUrl("");

    } catch (error) {
      console.error("Amazon import error:", error);
      toast.error(error.message || "Failed to import from Amazon.");
    } finally {
      setAmazonLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => activeFilterUsername === 'all' || p.user_name === activeFilterUsername);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-900">
            <ShoppingBag className="w-8 h-8 text-blue-900" />
            Promoted Product Manager
          </h1>
          <div className="flex gap-2">
            {showAmazonImportButton && (
              <Button
                onClick={() => {setAmazonExpanded(!amazonExpanded);setShowInlineForm(false);setProductFormData(null);}}
                variant="outline"
                className={`bg-white border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2 ${amazonExpanded ? "bg-slate-100" : ""}`}
                disabled={isSavingProduct}>

                <ShoppingCart className="w-4 h-4" />
                Import from Amazon
                <ChevronDown className={`w-4 h-4 transition-transform ${amazonExpanded ? "rotate-180" : ""}`} />
              </Button>
            )}
            <Button onClick={handleAddClick} className="bg-blue-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-blue-700"
            disabled={isSavingProduct}>

              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>

        {/* Amazon Import Inline Form */}
        <AnimatePresence>
          {amazonExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">Import from Amazon</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {setAmazonExpanded(false);setAmazonUrl("");}}
                    className="text-slate-400 hover:text-slate-600">

                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Permission Notice */}
                <div className="mb-4 p-3 bg-lime-400 border border-lime-500 rounded-lg">
                  <p className="text-slate-900 text-sm font-medium">
                    You must be the owner of this product, a registered Amazon Affiliate, or have express permission to use these images
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amazon-url-product" className="text-slate-700 mb-2 block">Amazon Product URL</Label>
                    <Input
                      id="amazon-url-product"
                      placeholder="https://www.amazon.com/dp/B0123456789"
                      value={amazonUrl}
                      onChange={(e) => setAmazonUrl(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                      disabled={amazonLoading}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAmazonImport}
                      disabled={amazonLoading || !amazonUrl.trim()}
                      className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                    >
                      {amazonLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Import Product
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {setAmazonExpanded(false);setAmazonUrl("");}}
                      disabled={amazonLoading}
                      className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="text-xs text-slate-500">
                    This will import the product details, images, reviews, and videos into your library
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Product Form */}
        <AnimatePresence>
          {showInlineForm && productFormData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden">

              <InlineProductForm
                initialProduct={productFormData}
                onSave={handleProductFormSave}
                onCancel={handleInlineFormClose}
                availableUsernames={availableUsernames}
                isSaving={isSavingProduct}
                currentUser={currentUser}
                globalUsername={globalUsername}
                useWorkspaceScoping={useWorkspaceScoping}
                consumeTokensForFeature={consumeTokensForFeature} />

            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        {!useWorkspaceScoping && (
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
        )}

        {/* Product Grid or No Products Message */}
        {isLoading ?
          <div className="text-center py-10 text-slate-600">Loading products...</div> :
          filteredProducts.length === 0 ?
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600">No products found for the selected user.</p>
            </div> :
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) =>
                <div key={product.id} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                  {product.image_url &&
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-md mb-4" />
                  }
                  <h3 className="text-xl font-semibold mb-2 text-blue-900 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>
                  <p className="text-blue-600 font-bold text-lg mb-3">{product.price}</p>
                  <p className="text-slate-600 mb-4 line-clamp-3 min-h-[3.6rem]">
                    {product.description}
                  </p>
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

      {/* Delete Confirmation Dialog */}
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
