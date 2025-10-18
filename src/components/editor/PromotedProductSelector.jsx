
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, Plus, Edit, ArrowLeft, Check, Package, ShoppingCart, Link as LinkIcon, Loader2, X, Wand2 } from "lucide-react";
import { PromotedProduct } from "@/api/entities";
import { CustomContentTemplate } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractProductMeta } from "@/api/functions";
import { amazonProduct } from "@/api/functions";
import TemplatePreviewFrame from "./TemplatePreviewFrame";
import { InvokeLLM } from "@/api/integrations";
import { useTemplates } from '@/components/providers/TemplateProvider'; // NEW IMPORT

export default function PromotedProductSelector({ isOpen, onClose, onInsert }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  // const [templates, setTemplates] = useState([]); // REMOVED: templates will come from provider
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [localSelectedUsername, setLocalSelectedUsername] = useState("all");
  const [availableUsernameObjects, setAvailableUsernameObjects] = useState([]);
  const [step, setStep] = useState('list'); // 'list', 'template', 'edit_amazon'
  const [showProductImport, setShowProductImport] = useState(false);
  const [showAmazonInput, setShowAmazonInput] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);

  // States for integrated Amazon import
  const [amazonUrl, setAmazonUrl] = useState("");
  const [isFetchingAmazon, setIsFetchingAmazon] = useState(false);
  const [amazonProductData, setAmazonProductData] = useState(null);
  const [isRewriting, setIsRewriting] = useState({ name: false, description: false });

  // State for current user to pass to feature flag hook
  const [currentUser, setCurrentUser] = useState(null);


  const navigate = useNavigate();
  const { consumeTokensForFeature } = useTokenConsumption();
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');
  const { templates: allTemplates, loadTemplates } = useTemplates(); // NEW: Access templates and loader from provider

  // Determine active username filter based on workspace scoping
  const selectedUsername = useWorkspaceScoping ? globalUsername || "all" : localSelectedUsername;

  // NEW: Feature flag for Amazon import button
  const { enabled: isAmazonImportEnabled } = useFeatureFlag('ask_ai_search_insert_amazon', {
    currentUser,
    defaultEnabled: true
  });

  // NEW: Memoize the filtered templates from the provider's allTemplates
  const templates = useMemo(() => {
    const productOnlyTemplates = allTemplates.filter((template) => {
      const isProductTemplate = template.associated_ai_feature === "product";
      const isActive = template.is_active !== false;

      // Additional filter to exclude any templates with CTA or Testimonial in the name
      const hasInvalidName = template.name && (
        template.name.toLowerCase().includes('cta') ||
        template.name.toLowerCase().includes('testimonial') ||
        template.name.toLowerCase().includes('underline effect') ||
        template.name.toLowerCase().includes('high-end & polished'));

      return isProductTemplate && isActive && !hasInvalidName;
    });
    return productOnlyTemplates;
  }, [allTemplates]); // Depend on allTemplates from the provider

  useEffect(() => {
    // Fetch current user details once on component mount
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch current user for feature flags:", e);
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setStep('list');
      setSelectedProduct(null);
      setSelectedTemplate(null);
      setAmazonUrl("");
      setAmazonProductData(null);
      setShowAmazonInput(false);
      setIsRewriting({ name: false, description: false });
      setShowProductImport(false); // Reset new state
      setProductUrl(""); // Reset new state
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Changed: templatesData removed from Promise.all, loadTemplates() added
      const [productsData, user] = await Promise.all([
        PromotedProduct.list(),
        User.me().catch(() => null),
        loadTemplates() // NEW: Trigger template loading from the provider
      ]);

      // Filter products and get associated usernames based on user permissions
      let filteredProducts = productsData || [];
      let allowedUsernameObjects = [];

      if (user) {
        if (user.role === 'admin') {
          // Admins see all products
          filteredProducts = productsData || [];
          const allUsernames = await Username.list();
          allowedUsernameObjects = (allUsernames || []).filter((u) => u.is_active !== false);
        } else if (user.assigned_usernames && user.assigned_usernames.length > 0) {
          const assignedSet = new Set(user.assigned_usernames);
          // Regular users see only products for their assigned usernames
          filteredProducts = (productsData || []).filter((product) =>
          product.user_name && assignedSet.has(product.user_name)
          );
          const allUsernames = await Username.list();
          allowedUsernameObjects = (allUsernames || []).filter((u) =>
          assignedSet.has(u.user_name) && u.is_active !== false
          );
        }
      }

      setProducts(filteredProducts);
      setAvailableUsernameObjects(allowedUsernameObjects);

      // OLD: Removed direct filtering and setting of templates state here.
      // Now, 'templates' is a useMemo-derived value from 'allTemplates' which comes from the provider.

    } catch (error) {
      console.error("Error loading data for product selector:", error);
      toast.error("Failed to load products or templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setStep('template');
  };

  const handleBackToProducts = () => {
    setStep('list');
    setSelectedTemplate(null);
  };

  const handleInsert = async () => {
    if (!selectedProduct) return;

    // Check and consume tokens before inserting
    const result = await consumeTokensForFeature('promoted_product_insert');
    if (!result.success) {
      return; // Error toast is handled by the hook
    }

    // Pass the currently selected template from state to the generator
    const productHtml = generateProductHtml(selectedProduct, selectedTemplate);
    onInsert(productHtml);
    onClose();
  };

  const generateProductHtml = (product, template) => {
    // Generate a unique ID for selection and deletion
    const uniqueId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    if (template && template.html_structure) {
      // Use custom template with ALL placeholder replacements
      let html = template.html_structure.
      replace(/{{PRODUCT_NAME}}/g, product.name || '').
      replace(/{{name}}/g, product.name || '').
      replace(/{{PRODUCT_DESCRIPTION}}/g, product.description || '').
      replace(/{{description}}/g, product.description || '').
      replace(/{{PRODUCT_PRICE}}/g, product.price || '').
      replace(/{{price}}/g, product.price || '').
      replace(/{{PRODUCT_IMAGE}}/g, product.image_url || '').
      replace(/{{PRODUCT_IMAGE_URL}}/g, product.image_url || '').
      replace(/{{IMAGE_URL}}/g, product.image_url || '').
      replace(/{{image_url}}/g, product.image_url || '').
      replace(/{{image}}/g, product.image_url || '').
      replace(/{{PRODUCT_URL}}/g, product.product_url || '').
      replace(/{{product_url}}/g, product.product_url || '').
      replace(/{{BUTTON_URL}}/g, product.button_url || product.product_url || '').
      replace(/{{button_url}}/g, product.button_url || product.product_url || '');

      // Parse the HTML to add required attributes to the root element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const rootElement = tempDiv.firstElementChild;

      if (rootElement) {
        rootElement.setAttribute('data-b44-id', uniqueId);
        rootElement.classList.add('b44-promoted-product');
        // Don't add extra margin if the template doesn't specify it
        return tempDiv.innerHTML;
      }

      // If no root element found, return the template as-is with attributes injected
      return html;
    }

    // Default template fallback - FINAL LAYOUT with outer border
    return `
<div class="b44-promoted-product" data-b44-id="${uniqueId}" style="max-width: 700px; margin: 20px 0; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; display: flex; align-items: stretch; gap: 20px;">
  <div style="width: 200px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
    <img src="${product.image_url || ''}" alt="${product.name || ''}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
  </div>
  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
    <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 600; color: #1e293b;">${product.name || ''}</h3>
    <p style="margin: 0 0 12px 0; color: #64748b; line-height: 1.5;">${product.description || ''}</p>
    <div style="display: flex; align-items: center; gap: 16px; margin-top: auto;">
      <span style="font-size: 1.125rem; font-weight: 700; color: #059669;">${product.price || ''}</span>
      <a href="${product.button_url || product.product_url || ''}" target="_blank" rel="noopener noreferrer" style="background: #059669; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background-color 0.2s;">Shop Now</a>
    </div>
  </div>
</div>`;
  };

  const handleEditProduct = (product) => {
    // Close the modal and navigate to ProductManager with the product pre-selected
    onClose();
    navigate(createPageUrl(`ProductManager?edit=${product.id}`));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUsername = selectedUsername === "all" || product.user_name === selectedUsername;

    return matchesSearch && matchesUsername;
  });

  const handleClose = () => {
    setStep('list');
    setSelectedProduct(null);
    setSelectedTemplate(null);
    setProductUrl(""); // Reset product URL
    setShowProductImport(false); // Hide product URL input
    onClose();
  };

  // --- NEW AMAZON IMPORT WORKFLOW ---
  const handleFetchAmazonProduct = async () => {
    if (!amazonUrl.trim() || !globalUsername) {
      toast.error("An Amazon URL and a selected workspace are required.");
      return;
    }
    setIsFetchingAmazon(true);
    try {
      const { data } = await amazonProduct({ url: amazonUrl });
      if (data.success) {
        setAmazonProductData({
          name: data.data.product_title || "",
          description: data.data.product_description || (Array.isArray(data.data.about_product) ? data.data.about_product.join("\n") : ""),
          image_url: data.data.product_photos && data.data.product_photos[0] || "",
          product_url: data.data.product_url || amazonUrl,
          price: data.data.product_price || "",
          sku: data.data.asin || ""
        });
        setStep('edit_amazon');
      } else {
        if (data.error && data.error.includes("exceeded the MONTHLY quota")) {
          toast.error("Amazon Import Quota Reached", {
            description: "You've used all your free Amazon data requests for the month. To continue, please upgrade your plan on RapidAPI.",
            duration: 10000
          });
        } else {
          toast.error(data.error || "Failed to fetch product details from Amazon.");
        }
      }
    } catch (err) {
      toast.error("An error occurred while fetching from Amazon.");
      console.error(err);
    } finally {
      setIsFetchingAmazon(false);
    }
  };

  const handleSaveAmazonProduct = async () => {
    if (!amazonProductData || !globalUsername) {
      toast.error("No product data to save or no workspace selected.");
      return;
    }
    setIsLoading(true); // Reuse loading state
    try {
      const createdProduct = await PromotedProduct.create({
        ...amazonProductData,
        user_name: globalUsername
      });
      await loadData();
      setSelectedProduct(createdProduct);
      setShowAmazonInput(false);
      setStep('template');
      toast.success("Product imported and selected!");
    } catch (err) {
      toast.error("Failed to save the imported product.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: AI Rewrite function
  const handleRewrite = async (field) => {
    if (!amazonProductData) return;

    const isTitle = field === 'name';
    const featureFlag = isTitle ? 'ai_title_rewrite' : 'ai_product_description_rewrite';
    const wordLimit = isTitle ? 'around 8 words' : 'under 70 words';
    const originalText = amazonProductData[field];

    if (!originalText || originalText.trim() === '') {
      toast.error("There is no text to rewrite.");
      return;
    }

    const tokenResult = await consumeTokensForFeature(featureFlag);
    if (!tokenResult?.success) {
      return; // Hook handles error toast
    }

    setIsRewriting((prev) => ({ ...prev, [field]: true }));
    try {
      const prompt = isTitle ?
      `Rewrite the following product title to be a concise, compelling, and SEO-friendly headline of ${wordLimit}. Output only the new title.\n\nOriginal Title: "${originalText}"\n\nProduct Description (for context): "${amazonProductData.description}"` :
      `Rewrite the following product description to be engaging and conversion-focused, ${wordLimit}. Output only the new description text.\n\nOriginal Description: "${originalText}"\n\nProduct Title (for context): "${amazonProductData.name}"`;

      const result = await InvokeLLM({ prompt });
      const rewrittenText = (typeof result === 'string' ? result : result?.text || "").trim().replace(/^["']|["']$/g, "");

      if (rewrittenText) {
        setAmazonProductData((prev) => ({ ...prev, [field]: rewrittenText }));
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} rewritten with AI.`);
      } else {
        toast.error("AI did not return a valid response.");
      }
    } catch (e) {
      toast.error("An error occurred during the AI rewrite.");
      console.error(e);
    } finally {
      setIsRewriting((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleFetchProductUrl = async () => {
    if (!productUrl.trim()) return;
    if (!globalUsername) {
      toast.error("Please select a workspace to save imported products.");
      return;
    }

    setIsFetchingProduct(true);
    try {
      const { data } = await extractProductMeta({ url: productUrl });

      if (data?.success) {
        setAmazonProductData({
          name: data.title || "",
          description: data.description || "",
          image_url: data.images && data.images[0] || data.image || "",
          product_url: data.url || productUrl,
          price: data.price || "",
          user_name: globalUsername // Assign to the current global workspace
        });

        setStep('edit_amazon'); // Go to the edit step instead of auto-proceeding

        setShowProductImport(false);
        setProductUrl("");
        toast.success("Product data fetched! Please review and save.");
      } else {
        toast.error(data?.error || "Failed to fetch product metadata from the URL. Please ensure it's a valid product page.");
      }
    } catch (error) {
      toast.error("Error fetching product. Please check the URL and try again.");
      console.error("Error fetching product metadata:", error);
    } finally {
      setIsFetchingProduct(false);
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                {step === 'edit_amazon' ? <> <Edit className="w-5 h-5 text-blue-500" /> Edit Imported Product </> :
                <> <ShoppingBag className="w-5 h-5 text-green-600" /> Insert Promoted Product </>
                }
                {step === 'template' &&
                <span className="text-sm font-normal text-slate-500">
                    → {selectedProduct?.name}
                  </span>
                }
              </DialogTitle>
            </div>
          </DialogHeader>

          {step === 'list' &&
          <div className="py-4">
              {/* Step 1: Select Product */}
              <div className="space-y-4">
                <div className="flex justify-end gap-2 mb-4">
                    {!showAmazonInput && !showProductImport ?
                <>
                        {isAmazonImportEnabled && ( // Conditionally render Amazon import button
                        <Button
                            onClick={() => setShowAmazonInput(true)}
                            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Import from Amazon
                        </Button>
                        )}
                        <Button
                            onClick={() => setShowProductImport(true)}
                            className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Import from Product URL
                        </Button>
                      </> :
                showAmazonInput ?
                <div className="w-full p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                             <Label htmlFor="amazon-url" className="text-slate-800 font-medium">Amazon Product URL</Label>
                             <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                        id="amazon-url"
                        value={amazonUrl}
                        onChange={(e) => setAmazonUrl(e.target.value)}
                        placeholder="https://www.amazon.com/dp/..."
                        className="pl-9 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
                        autoFocus />
                                </div>
                                <Button onClick={handleFetchAmazonProduct} disabled={!amazonUrl || isFetchingAmazon} className="min-w-[120px] bg-orange-500 hover:bg-orange-600 text-white">
                                    {isFetchingAmazon ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching</> : "Fetch Product"}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setShowAmazonInput(false)}>
                                    <X className="w-5 h-5 text-slate-500" />
                                </Button>
                             </div>
                        </div> :
                showProductImport ?
                <div className="w-full p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                            <Label htmlFor="product-url-input" className="text-slate-800 font-medium">Product URL</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                        id="product-url-input"
                        placeholder="Enter product URL (e.g., Shopify, WooCommerce, custom store)"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleFetchProductUrl()}
                        autoFocus
                        className="pl-9 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500" />

                                </div>
                                <Button
                      onClick={handleFetchProductUrl}
                      disabled={!productUrl.trim() || isFetchingProduct || !globalUsername}
                      className="min-w-[120px] bg-slate-800 hover:bg-slate-900 text-white">
                                    {isFetchingProduct ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching</> : 'Fetch'}
                                </Button>
                                <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowProductImport(false);
                        setProductUrl("");
                      }}>
                                    <X className="w-5 h-5 text-slate-500" />
                                </Button>
                            </div>
                            {!globalUsername &&
                  <p className="text-sm text-red-500 mt-1">Please select a workspace to save imported products.</p>
                  }
                        </div> :
                null
                }
                </div>
                {/* Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500" />
                  </div>

                  {!useWorkspaceScoping && availableUsernameObjects.length > 0 &&
                <Select value={localSelectedUsername} onValueChange={setLocalSelectedUsername}>
                      <SelectTrigger className="bg-white text-slate-900 border border-slate-300">
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="all">All Products</SelectItem>
                        {availableUsernameObjects.map((usernameObj) =>
                    <SelectItem key={usernameObj.id} value={usernameObj.user_name}>
                            {usernameObj.display_name || usernameObj.user_name}
                          </SelectItem>
                    )}
                      </SelectContent>
                    </Select>
                }
                </div>

                {/* Products Grid */}
                <div className="max-h-[26rem] overflow-y-auto pr-2 -mr-2">
                  {isLoading ?
                <div className="text-center py-8 text-slate-500">Loading products...</div> :
                filteredProducts.length === 0 ?
                <div className="text-center py-8 text-slate-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No products found. Add products in the Products page.</p>
                    </div> :

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredProducts.map((product) =>
                  <div
                    key={product.id}
                    className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col"
                    onClick={() => handleProductSelect(product)}>

                          {/* Simplified Product Info */}
                          <div className="flex-grow flex items-center gap-4">
                            {product.image_url &&
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 object-contain rounded-md flex-shrink-0" />

                      }
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-800 text-base line-clamp-2">
                                {product.name}
                              </div>
                              <div className="text-sm text-slate-600 line-clamp-3 mt-1">
                                {product.description}
                              </div>
                              {product.price &&
                        <div className="text-lg font-bold text-green-700 mt-2">
                                    {product.price}
                                  </div>
                        }
                            </div>
                          </div>
                          
                          {/* Username and Action Buttons */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                            <div className="text-xs text-slate-500">
                              Username: <span className="font-medium">{product.user_name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                          variant="outline"
                          size="sm"
                          className="bg-white text-slate-700 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md border-slate-300 hover:bg-slate-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                          title="Edit this product">

                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                  )}
                    </div>
                }
                </div>
              </div>
            </div>
          }

          {step === 'edit_amazon' && amazonProductData &&
          <div className="py-4 space-y-4">
                <Button variant="outline" size="sm" onClick={() => setStep('list')} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products List
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
                    {/* Left Column: Image */}
                    <div className="space-y-2">
                        <Label htmlFor="product-image-url" className="text-slate-800">Image</Label>
                        {amazonProductData.image_url &&
                <img
                  src={amazonProductData.image_url}
                  alt={amazonProductData.name}
                  className="w-full h-auto object-contain rounded-lg border border-slate-200 p-2" />

                }
                        <Input
                  id="product-image-url"
                  value={amazonProductData.image_url || ""}
                  onChange={(e) => setAmazonProductData({ ...amazonProductData, image_url: e.target.value })}
                  className="bg-white text-slate-900 border border-slate-300 text-xs" />

                    </div>
                    {/* Right Column: Details */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="product-name" className="text-slate-800">Product Name</Label>
                                <div className="flex gap-2">
                                  <Input id="product-name" value={amazonProductData.name} onChange={(e) => setAmazonProductData({ ...amazonProductData, name: e.target.value })} className="flex-1 bg-white text-slate-900 border border-slate-300" />
                                  <Button variant="outline" size="icon" onClick={() => handleRewrite('name')} disabled={isRewriting.name} title="Rewrite title with AI" className="bg-background text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-10">
                                    {isRewriting.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                  </Button>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="product-price" className="text-slate-800">Price</Label>
                                <Input id="product-price" value={amazonProductData.price} onChange={(e) => setAmazonProductData({ ...amazonProductData, price: e.target.value })} className="bg-white text-slate-900 border border-slate-300" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="product-description" className="text-slate-800">Description</Label>
                            <div className="flex gap-2 items-start">
                              <Textarea id="product-description" value={amazonProductData.description} onChange={(e) => setAmazonProductData({ ...amazonProductData, description: e.target.value })} rows={8} className="flex-1 bg-white text-slate-900 border border-slate-300" />
                              <Button variant="outline" size="icon" onClick={() => handleRewrite('description')} disabled={isRewriting.description} title="Rewrite description with AI" className="bg-background text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-10">
                                {isRewriting.description ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                              </Button>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveAmazonProduct} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save and Select Template"}
                    </Button>
                 </div>
              </div>
          }

          {step === 'template' &&
          <div className="py-4">
              {/* Step 2: Select Template */}
              <div className="flex items-center gap-4 mb-6">
                <Button
                variant="outline"
                size="sm"
                onClick={handleBackToProducts}
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100">

                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Products
                </Button>
                <div className="text-sm text-slate-600">
                  Choose a template for: <span className="font-medium">{selectedProduct?.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                {/* Left Column: Template List */}
                <div className="space-y-2">
                  <Label>Template</Label>
                  <div className="border border-slate-200 rounded-md bg-slate-50 max-h-96 overflow-y-auto">
                    <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className={cn(
                      "w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200",
                      !selectedTemplate && "bg-blue-50 border-l-4 border-blue-500"
                    )}>

                      <div className="font-medium text-slate-900">Default Style</div>
                    </button>
                    {templates.map((template) =>
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      "w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-b-0",
                      selectedTemplate?.id === template.id && "bg-blue-50 border-l-4 border-blue-500"
                    )}>

                        <div className="font-medium text-slate-900">{template.name}</div>
                        {template.description &&
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</div>
                    }
                      </button>
                  )}
                  </div>
                  <p className="text-sm text-slate-600 pt-2">
                    Manage templates in Assets → Templates.
                  </p>
                </div>

                {/* Right Column: Contained Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Preview</Label>
                    <Button
                    onClick={handleInsert}
                    className="bg-blue-900 text-white hover:bg-blue-700">
                      <Check className="w-4 h-4 mr-2" />
                      Insert Product
                    </Button>
                  </div>
                  {/* Replaced previous scaled div with an iframe-based preview that mirrors editor rendering */}
                  <TemplatePreviewFrame
                  className=""
                  height={500}
                  html={generateProductHtml(selectedProduct, selectedTemplate)} />
                </div>
              </div>
            </div>
          }
        </DialogContent>
      </Dialog>
    </>);
}
