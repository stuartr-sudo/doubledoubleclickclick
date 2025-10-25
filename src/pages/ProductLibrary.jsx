import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { 
  amazonProduct, 
  extractProductMeta, 
  airtableCreateRecord, 
  airtableListRecords,
  airtableUpdateRecord,
  airtableDeleteRecord 
} from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Package, 
  ShoppingCart, 
  LinkIcon, 
  Loader2, 
  X, 
  Edit, 
  Trash2, 
  ExternalLink,
  Wand2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { app } from "@/api/appClient";

export default function ProductLibrary() {
  const navigate = useNavigate();
  
  // Workspace context
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');
  const { enabled: isAmazonImportEnabled } = useFeatureFlag('enable_amazon_import');
  
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Products state
  const [products, setProducts] = useState([]);
  
  // Step state: 'list', 'edit_amazon'
  const [step, setStep] = useState('list');
  
  // Amazon import states
  const [showAmazonInput, setShowAmazonInput] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState("");
  const [isFetchingAmazon, setIsFetchingAmazon] = useState(false);
  const [amazonProductData, setAmazonProductData] = useState(null);
  
  // General URL import states
  const [showProductImport, setShowProductImport] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  
  // AI rewrite states
  const [isRewriting, setIsRewriting] = useState({ name: false, description: false });
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Saving state
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // ONBOARDING GATE CHECK
  // ============================================================================
  useEffect(() => {
    const checkAccessAndLoadUser = async () => {
      setLoading(true);
      try {
        const user = await User.me();
        
        // Check if user has completed Topics onboarding
        const hasCompletedTopics = user.topics && Array.isArray(user.topics) && user.topics.length > 0;
        
        console.log("🔐 Topics onboarding check:", {
          userTopics: user.topics,
          hasCompleted: hasCompletedTopics
        });
        
        if (!hasCompletedTopics) {
          console.warn("⚠️ User has not completed Topics onboarding. Blocking access.");
          setAccessBlocked(true);
          setLoading(false);
          toast.error("Please complete the Topics onboarding first to access Product Library", {
            duration: 5000
          });
          return;
        }
        
        // If has completed topics, proceed normally
        console.log("✅ Topics onboarding completed. Granting access.");
        setCurrentUser(user);
        setAccessBlocked(false);
      } catch (error) {
        console.error("Failed to check access:", error);
        setLoading(false);
        setAccessBlocked(true);
        toast.error("Failed to load user data. Please try again.", { duration: 5000 });
      }
    };
    
    checkAccessAndLoadUser();
  }, []);

  // ============================================================================
  // LOAD PRODUCTS FROM AIRTABLE
  // ============================================================================
  const loadProducts = useCallback(async (user) => {
    setLoading(true);
    setProducts([]);
    
    try {
      const username = globalUsername || user?.assigned_usernames?.[0];
      if (!username) {
        console.warn("⚠️ No username available");
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log("🔍 Loading products for username:", username);
      
      const response = await airtableListRecords({
        tableId: "Company Products",
        filterByFormula: `{client_username} = '${username}'`,
        maxRecords: 100
      });

      console.log("📦 Airtable response:", response);

      if (response?.data?.success && response.data?.records) {
        console.log("✅ Found records:", response.data.records.length);
        
        const formattedProducts = response.data.records.map(record => {
          console.log("📄 Processing record:", record.id, record.fields);
          return {
            id: record.id,
            page_name: record.fields["Page Name"] || record.fields["page_name"] || "",
            url: record.fields["URL"] || record.fields["url"] || "",
            content: record.fields["Page Content"] || record.fields["page_content"] || "",
            image: record.fields["Image"] || "",
            price: record.fields["Price"] || "",
            sku: record.fields["SKU"] || "",
            client_username: record.fields["client_username"] || "",
            created_date: record.createdTime || new Date().toISOString()
          };
        });
        
        console.log("✅ Formatted products:", formattedProducts);
        setProducts(formattedProducts);
      } else {
        console.log("⚠️ No products found or failed to load");
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Error loading products:", error);
      toast.error("Failed to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [globalUsername]);

  useEffect(() => {
    if (currentUser && !accessBlocked) {
      loadProducts(currentUser);
    }
  }, [globalUsername, currentUser, loadProducts, accessBlocked]);

  // ============================================================================
  // AMAZON IMPORT FLOW
  // ============================================================================
  const handleFetchAmazonProduct = async () => {
    if (!amazonUrl.trim() || !globalUsername) {
      toast.error("An Amazon URL and a selected workspace are required.");
      return;
    }
    
    setIsFetchingAmazon(true);
    try {
      const response = await amazonProduct({ url: amazonUrl });
      
      if (response.data?.success) {
        setAmazonProductData({
          name: response.data.data.product_title || "",
          description: response.data.data.product_description || (Array.isArray(response.data.data.about_product) ? response.data.data.about_product.join("\n") : ""),
          image_url: response.data.data.product_photos && response.data.data.product_photos[0] || "",
          product_url: response.data.data.product_url || amazonUrl,
          price: response.data.data.product_price || "",
          sku: response.data.data.asin || ""
        });
        setStep('edit_amazon');
        setShowAmazonInput(false);
        setAmazonUrl("");
        toast.success("Product data fetched! Please review and save.");
      } else {
        if (response.data?.error && response.data.error.includes("exceeded the MONTHLY quota")) {
          toast.error("Amazon Import Quota Reached. You've used all your free Amazon data requests for the month. To continue, please upgrade your plan on RapidAPI.", {
            duration: 10000
          });
        } else {
          toast.error(response.data?.error || "Failed to fetch product details from Amazon.");
        }
      }
    } catch (err) {
      toast.error("An error occurred while fetching from Amazon.");
      console.error(err);
    } finally {
      setIsFetchingAmazon(false);
    }
  };

  // ============================================================================
  // GENERAL URL IMPORT FLOW
  // ============================================================================
  const handleFetchProductUrl = async () => {
    if (!productUrl.trim()) return;
    if (!globalUsername) {
      toast.error("Please select a workspace to save imported products.");
      return;
    }

    setIsFetchingProduct(true);
    try {
      const response = await extractProductMeta({ url: productUrl });

      if (response.data?.success) {
        setAmazonProductData({
          name: response.data.title || "",
          description: response.data.description || "",
          image_url: response.data.images && response.data.images[0] || response.data.image || "",
          product_url: response.data.url || productUrl,
          price: response.data.price || "",
          user_name: globalUsername
        });

        setStep('edit_amazon');
        setShowProductImport(false);
        setProductUrl("");
        toast.success("Product data fetched! Please review and save.");
      } else {
        toast.error(response.data?.error || "Failed to fetch product metadata from the URL. Please ensure it's a valid product page.");
      }
    } catch (error) {
      toast.error("Error fetching product. Please check the URL and try again.");
      console.error("Error fetching product metadata:", error);
    } finally {
      setIsFetchingProduct(false);
    }
  };

  // ============================================================================
  // AI REWRITE (WAND BUTTONS)
  // ============================================================================
  const handleRewrite = async (field) => {
    if (!amazonProductData) return;

    const isTitle = field === 'name';
    const wordLimit = isTitle ? 'around 8 words' : 'under 70 words';
    const originalText = amazonProductData[field];

    if (!originalText || originalText.trim() === '') {
      toast.error("There is no text to rewrite.");
      return;
    }

    // Token consumption
    const featureFlag = isTitle ? 'ai_title_rewrite' : 'ai_product_description_rewrite';
    try {
      const tokenResult = await app.functions.checkAndConsumeTokens({
        userId: currentUser.id,
        featureName: featureFlag
      });
      
      if (!tokenResult.ok) {
        toast.error(tokenResult.error || "Insufficient tokens.");
        return;
      }
    } catch (err) {
      toast.error("Failed to check tokens.");
      console.error(err);
                return;
              }
              
    setIsRewriting((prev) => ({ ...prev, [field]: true }));
    try {
      const prompt = isTitle
        ? `Rewrite the following product title to be a concise, compelling, and SEO-friendly headline of ${wordLimit}. Output only the new title.\n\nOriginal Title: "${originalText}"\n\nProduct Description (for context): "${amazonProductData.description}"`
        : `Rewrite the following product description to be engaging and conversion-focused, ${wordLimit}. Output only the new description text.\n\nOriginal Description: "${originalText}"\n\nProduct Title (for context): "${amazonProductData.name}"`;

      const response = await app.functions.invoke('llmRouter', { prompt });
      const rewrittenText = (typeof response.data === 'string' ? response.data : response.data?.text || "").trim().replace(/^["']|["']$/g, "");

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

  // ============================================================================
  // SAVE PRODUCT TO AIRTABLE
  // ============================================================================
  const handleSaveProduct = async () => {
    if (!amazonProductData || !globalUsername) {
      toast.error("No product data to save or no workspace selected.");
      return;
    }

    setIsLoading(true);
    try {
      const fields = {
        "Page Name": amazonProductData.name.trim(),
        "Page Content": amazonProductData.description || "",
        "URL": amazonProductData.product_url.trim(),
        "client_username": globalUsername,
        "Status": "Add to Pinecone",
        "Image": amazonProductData.image_url || "",
        "Price": amazonProductData.price || "",
        "SKU": amazonProductData.sku || ""
      };

      console.log("💾 Saving product to Airtable:", fields);

      await airtableCreateRecord({
        tableId: "Company Products",
        fields
      });

      toast.success("Product added to library!");
      
      // Reset states
      setAmazonProductData(null);
      setStep('list');
      
      // Reload products
      await loadProducts(currentUser);
      
    } catch (err) {
      toast.error("Failed to save the imported product.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // DELETE PRODUCT
  // ============================================================================
  const handleDelete = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await airtableDeleteRecord({
        tableId: "Company Products",
        recordId: productToDelete.id
      });
      
      toast.success("Product deleted successfully!");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      
      await loadProducts(currentUser);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(`Failed to delete product: ${error?.message || 'Unknown error'}`);
    }
  };

  // ============================================================================
  // RENDER: ONBOARDING GATE
  // ============================================================================
  if (accessBlocked) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-2 border-amber-200 rounded-xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Library Locked</h1>
            <p className="text-slate-600 mb-6">
              You need to complete the Topics onboarding before you can access the Product Library.
            </p>
            <Button 
              onClick={() => navigate(createPageUrl('Topics'))}
              className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Go to Topics Onboarding
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: EDIT PRODUCT FORM (Amazon or General URL)
  // ============================================================================
  if (step === 'edit_amazon' && amazonProductData) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => {
              setStep('list');
              setAmazonProductData(null);
            }}
            className="mb-6 gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Products List
          </Button>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Review Product Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product Image */}
              {amazonProductData.image_url && (
                <div className="md:col-span-1">
                  <Label className="text-slate-700 font-medium mb-2 block">Product Image</Label>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <img 
                      src={amazonProductData.image_url} 
                      alt={amazonProductData.name}
                      className="w-full h-64 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-1 space-y-6">
                
                {/* Product Name + AI Rewrite */}
                <div>
                  <Label htmlFor="product-name" className="text-slate-700 font-medium mb-2 block">
                    Product Name
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      id="product-name" 
                      value={amazonProductData.name} 
                      onChange={(e) => setAmazonProductData({ ...amazonProductData, name: e.target.value })} 
                      className="flex-1 bg-white text-slate-900 border border-slate-300"
                    />
                  <Button
                      variant="outline" 
                    size="icon"
                      onClick={() => handleRewrite('name')} 
                      disabled={isRewriting.name} 
                      title="Rewrite title with AI"
                      className="flex-shrink-0">
                      {isRewriting.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  </Button>
                  </div>
                </div>

                {/* Price */}
                {amazonProductData.price && (
                  <div>
                    <Label htmlFor="product-price" className="text-slate-700 font-medium mb-2 block">
                      Price
                    </Label>
                      <Input
                      id="product-price" 
                      value={amazonProductData.price} 
                      onChange={(e) => setAmazonProductData({ ...amazonProductData, price: e.target.value })} 
                      className="bg-white text-slate-900 border border-slate-300"
                    />
                  </div>
                )}

                {/* SKU */}
                {amazonProductData.sku && (
                        <div>
                    <Label htmlFor="product-sku" className="text-slate-700 font-medium mb-2 block">
                      SKU / ASIN
                    </Label>
                    <Input 
                      id="product-sku" 
                      value={amazonProductData.sku} 
                      onChange={(e) => setAmazonProductData({ ...amazonProductData, sku: e.target.value })} 
                      className="bg-white text-slate-900 border border-slate-300"
                      readOnly
                    />
                    </div>
                  )}
                      </div>

              {/* Description + AI Rewrite (full width) */}
              <div className="md:col-span-2">
                <Label htmlFor="product-description" className="text-slate-700 font-medium mb-2 block">
                  Description
                </Label>
                <div className="flex flex-col gap-2">
                          <Textarea
                    id="product-description" 
                    value={amazonProductData.description} 
                    onChange={(e) => setAmazonProductData({ ...amazonProductData, description: e.target.value })} 
                    rows={8}
                    className="bg-white text-slate-900 border border-slate-300"
                  />
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRewrite('description')} 
                      disabled={isRewriting.description} 
                      className="gap-2">
                      {isRewriting.description ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      Rewrite Description with AI
                    </Button>
                  </div>
                </div>
              </div>

              {/* Image URL */}
              <div className="md:col-span-2">
                <Label htmlFor="product-image-url" className="text-slate-700 font-medium mb-2 block">
                  Image URL
                </Label>
                <Input 
                  id="product-image-url" 
                  value={amazonProductData.image_url} 
                  onChange={(e) => setAmazonProductData({ ...amazonProductData, image_url: e.target.value })} 
                  className="bg-white text-slate-900 border border-slate-300"
                />
              </div>

              {/* Product URL */}
              <div className="md:col-span-2">
                <Label htmlFor="product-url" className="text-slate-700 font-medium mb-2 block">
                  Product URL
                </Label>
                <Input 
                  id="product-url" 
                  value={amazonProductData.product_url} 
                  onChange={(e) => setAmazonProductData({ ...amazonProductData, product_url: e.target.value })} 
                  className="bg-white text-slate-900 border border-slate-300"
                />
              </div>

            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={handleSaveProduct} 
                disabled={isLoading || !amazonProductData.name.trim()} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Product"}
              </Button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: PRODUCT LIBRARY LIST
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Product Library</h1>
                <p className="text-slate-600">Add products to your library for use in content</p>
              </div>
            </div>

            {/* Import Buttons */}
            <div className="flex items-center gap-2">
              {/* General URL Import */}
              <Button
                onClick={() => setShowProductImport(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2">
                <Package className="w-4 h-4" />
                Import from Product URL
              </Button>

              {/* Amazon Import (conditionally rendered) */}
              {isAmazonImportEnabled && (
                <Button
                  onClick={() => setShowAmazonInput(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Import from Amazon
                </Button>
              )}
            </div>
          </div>

          {/* Product URL Input */}
          {showProductImport && (
            <div className="w-full p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-2 mt-4">
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
                    className="pl-9 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
                  />
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
              {!globalUsername && <p className="text-sm text-red-500 mt-1">Please select a workspace to save imported products.</p>}
            </div>
          )}

          {/* Amazon URL Input */}
          {showAmazonInput && (
            <div className="w-full p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-2 mt-4">
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
                    autoFocus
                  />
                </div>
                <Button 
                  onClick={handleFetchAmazonProduct} 
                  disabled={!amazonUrl || isFetchingAmazon} 
                  className="min-w-[120px] bg-orange-500 hover:bg-orange-600 text-white">
                  {isFetchingAmazon ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching</> : "Fetch Product"}
                    </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAmazonInput(false)}>
                  <X className="w-5 h-5 text-slate-500" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No products yet</h3>
            <p className="text-slate-600 mb-6">
              Start building your product library by importing products from Amazon or any product URL.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => setShowProductImport(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white">
                Import Your First Product
              </Button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow relative bg-white">
                
                {/* Action buttons (top-right) */}
                <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product)}
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete product">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                
                {/* Product Image */}
                {product.image && (
                  <div className="mb-3">
                    <img 
                      src={product.image} 
                      alt={product.page_name}
                      className="w-full h-32 object-contain rounded-md bg-slate-50"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Product info */}
                <h3 className="font-semibold text-slate-800 mb-2 pr-10">{product.page_name}</h3>
                
                {product.price && (
                  <p className="text-sm text-slate-600 mb-2 font-medium">{product.price}</p>
                )}

                <p className="text-xs text-slate-500 mb-3">
                  Added: {new Date(product.created_date).toLocaleDateString()}
                </p>
                
                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1">
                    View Product <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}

      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{productToDelete?.page_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
              className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
