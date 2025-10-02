
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Package, Loader2, X, ExternalLink, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { airtableCreateRecord } from "@/api/functions";
import { airtableListRecords } from "@/api/functions";
import { airtableUpdateRecord } from "@/api/functions";
import { airtableDeleteRecord } from "@/api/functions";
import { extractProductMeta } from "@/api/functions";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import { motion, AnimatePresence } from "framer-motion";
import { agentSDK } from "@/agents";
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
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TABLE_ID = "Company Products";

const generateCleanProductName = (title) => {
  const withoutEntities = title.replace(/&[^;]+;/g, ' ');
  const cleaned = withoutEntities.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').slice(0, 4).join(' ');
  return words;
};

export default function ProductLibrary() {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productUrl, setProductUrl] = useState("");
  const [productData, setProductData] = useState({ title: "", content: "", cleanName: "" });
  const [scrapingProduct, setScrapingProduct] = useState(false);
  const [summarizingContent, setSummarizingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [accessBlocked, setAccessBlocked] = useState(false);

  const { consumeTokensForFeature } = useTokenConsumption();
  const { selectedUsername } = useWorkspace();
  const navigate = useNavigate();

  const loadProducts = useCallback(async (user) => {
    setLoading(true);
    setProducts([]);
    
    try {
      const username = selectedUsername || user?.assigned_usernames?.[0];
      if (!username) {
        console.warn("⚠️ No username available");
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log("🔍 Loading products for username:", username);
      
      const { data } = await airtableListRecords({
        tableId: TABLE_ID,
        filterByFormula: `{client_username} = '${username}'`,
        maxRecords: 100
      });

      console.log("📦 Airtable response:", data);

      if (data?.success && data?.records) {
        console.log("✅ Found records:", data.records.length);
        
        const formattedProducts = data.records.map(record => {
          console.log("📄 Processing record:", record.id, record.fields);
          return {
            id: record.id,
            page_name: record.fields["Page Name"] || record.fields["page_name"] || "",
            url: record.fields["URL"] || record.fields["url"] || "",
            content: record.fields["Page Content"] || record.fields["page_content"] || "",
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
  }, [selectedUsername]);

  useEffect(() => {
    if (currentUser && !accessBlocked) { // Only load products if user is set and access is not blocked
      loadProducts(currentUser);
    }
  }, [selectedUsername, currentUser, loadProducts, accessBlocked]);

  useEffect(() => {
    const checkAccessAndLoadUser = async () => {
      setLoading(true);
      try {
        const user = await User.me();
        
        // CRITICAL: Check if user has completed Topics onboarding
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
        // Products will be loaded by the other useEffect when currentUser is set
      } catch (error) {
        console.error("Failed to check access:", error);
        setLoading(false);
        setAccessBlocked(true); // Block access if there's an error loading user or checking topics
        toast.error("Failed to load user data. Please try again.", { duration: 5000 });
      }
    };
    
    checkAccessAndLoadUser();
  }, []); // Empty dependency array means this runs once on mount


  const scrapeProduct = async () => {
    if (!productUrl.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    const result = await consumeTokensForFeature('product_library_scrape');
    if (!result.success) {
      return;
    }

    setScrapingProduct(true);
    setProductData({ title: "", content: "", cleanName: "" });
    
    try {
      console.log("🔍 Starting product scrape for:", productUrl);
      const response = await extractProductMeta({ url: productUrl });
      const productPageData = response?.data;
      
      if (!productPageData?.success || !productPageData?.title) {
        toast.error("Could not extract product information from this URL.");
        setScrapingProduct(false);
        return;
      }

      console.log("✅ Product scraped successfully:", productPageData.title);
      const cleanName = generateCleanProductName(productPageData.title);
      const description = productPageData.description || "";
      
      if (description && description.trim().length > 0) {
        console.log("🤖 Starting AI summarization...");
        setScrapingProduct(false);
        setSummarizingContent(true);
        
        try {
          const conversation = await agentSDK.createConversation({
            agent_name: "product_summarizer",
            metadata: { purpose: "Summarize product page content", productUrl }
          });

          await agentSDK.addMessage(conversation, {
            role: "user",
            content: `Please create a 300-word summary of this product:\n\nTitle: ${productPageData.title}\n\nDescription: ${description.substring(0, 5000)}`
          });

          const summary = await new Promise((resolve, reject) => {
            let resolved = false;
            const timeout = setTimeout(() => {
              if (!resolved) {
                reject(new Error("AI Agent took too long to respond"));
              }
            }, 90000);

            let pollCount = 0;
            const pollInterval = setInterval(async () => {
              if (resolved) {
                clearInterval(pollInterval);
                return;
              }
              
              pollCount++;
              try {
                const updatedConv = await agentSDK.getConversation(conversation.id);
                const lastMsg = updatedConv.messages[updatedConv.messages.length - 1];
                
                if (lastMsg?.role === "assistant" && lastMsg?.content) {
                  if (lastMsg.is_complete === true || lastMsg.content.length > 200) {
                    resolved = true;
                    clearTimeout(timeout);
                    clearInterval(pollInterval);
                    unsubscribe();
                    resolve(lastMsg.content);
                  }
                }
              } catch (pollError) {
                console.error("Polling error:", pollError);
              }
            }, 3000);

            const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
              if (resolved) return;
              const lastMessage = data.messages[data.messages.length - 1];
              if (lastMessage?.role === "assistant" && lastMessage?.content) {
                if (lastMessage.is_complete === true || lastMessage.content.length > 200) {
                  resolved = true;
                  clearTimeout(timeout);
                  clearInterval(pollInterval);
                  unsubscribe();
                  resolve(lastMessage.content);
                }
              }
            });
          });

          const newProductData = { 
            title: productPageData.title, 
            content: summary.trim(),
            cleanName: cleanName
          };
          
          setProductData(newProductData);
          toast.success("✅ Product summarized! Review and click 'Save Product' to add to library.", {
            duration: 5000
          });
          
        } catch (summaryError) {
          console.error("Summary error:", summaryError);
          const fallbackData = { 
            title: productPageData.title, 
            content: description.substring(0, 1000),
            cleanName: cleanName
          };
          setProductData(fallbackData);
          toast.warning("⚠️ AI summary unavailable. Using extracted description. You can edit before saving.");
          
        } finally {
          setSummarizingContent(false);
        }
      } else {
        const noDescData = { 
          title: productPageData.title, 
          content: "No product description available.",
          cleanName: cleanName
        };
        setProductData(noDescData);
        toast.success("✅ Product information extracted! Click 'Save Product' to add it.");
        setScrapingProduct(false);
      }
      
    } catch (error) {
      console.error("Scraping error:", error);
      toast.error(`Failed to scrape product: ${error?.message || 'Unknown error'}`);
      setScrapingProduct(false);
      setSummarizingContent(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductUrl(product.url);
    setProductData({
      title: product.page_name,
      content: product.content,
      cleanName: product.page_name
    });
    setShowForm(true);
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await airtableDeleteRecord({
        tableId: TABLE_ID,
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

  const handleSave = async () => {
    if (!productUrl.trim()) {
      toast.error("Product URL is required");
      return;
    }
    
    if (!productData.cleanName || !productData.cleanName.trim()) {
      toast.error("Please scrape a product first - product name is missing or empty.");
      return;
    }

    const username = selectedUsername || currentUser?.assigned_usernames?.[0];
    if (!username) {
      toast.error("No username selected. Please select a workspace.");
      return;
    }

    setSaving(true);
    
    try {
      const fields = {
        "Page Name": productData.cleanName.trim(),
        "Page Content": productData.content || "",
        "URL": productUrl.trim(),
        "client_username": username
      };

      console.log("💾 Saving fields:", fields);

      if (editingProduct) {
        await airtableUpdateRecord({
          tableId: TABLE_ID,
          recordId: editingProduct.id,
          fields
        });
        toast.success("Product updated successfully!");
      } else {
        await airtableCreateRecord({
          tableId: TABLE_ID,
          fields
        });
        toast.success("Product added to library!");
      }

      setShowForm(false);
      setEditingProduct(null);
      setProductUrl("");
      setProductData({ title: "", content: "", cleanName: "" });
      
      await loadProducts(currentUser);
      
    } catch (error) {
      console.error("Save error:", error);
      toast.error(`Failed to save product: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setProductUrl("");
    setProductData({ title: "", content: "", cleanName: "" });
  };

  // Show blocked state if user hasn't completed Topics
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

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-8 h-8 text-indigo-600" />
              Product Library
            </h1>
            <p className="text-slate-600 mt-2">Add products to your library for use in content</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden">
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {editingProduct ? 'Update product information' : 'Enter a product URL and let AI scrape and summarize it for you'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="text-slate-400 hover:text-slate-600"
                    disabled={saving || scrapingProduct || summarizingContent}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product_url" className="text-slate-700">Product URL</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="product_url"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        placeholder="https://example.com/products/amazing-product"
                        className="flex-1 bg-white"
                        disabled={!!editingProduct || scrapingProduct || summarizingContent}
                      />
                      {!editingProduct && (
                        <Button
                          type="button"
                          onClick={scrapeProduct}
                          disabled={scrapingProduct || summarizingContent || !productUrl.trim() || saving}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px]">
                          {scrapingProduct ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Scraping...
                            </>
                          ) : summarizingContent ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Summarizing...
                            </>
                          ) : (
                            'Scrape Product'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {summarizingContent && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
                      <div className="flex items-start gap-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">AI is generating a summary...</p>
                          <p className="text-xs text-blue-700 mt-1">This typically takes 30-60 seconds. Please wait.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {productData.cleanName && !summarizingContent && (
                    <>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="text-green-600 mt-0.5">✓</div>
                          <div>
                            <p className="text-sm font-medium text-green-900">Product information ready!</p>
                            <p className="text-xs text-green-700 mt-1">Review the details below and click "Save Product" to add it to your library.</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <Label className="text-slate-700 font-medium">Product Name</Label>
                          <Textarea
                            value={productData.cleanName}
                            onChange={(e) => setProductData({ ...productData, cleanName: e.target.value })}
                            className="mt-2 bg-white"
                            rows={2}
                            placeholder="Clean product name (3-4 words)"
                          />
                        </div>

                        <div>
                          <Label className="text-slate-700 font-medium">Product Description</Label>
                          <Textarea
                            value={productData.content}
                            onChange={(e) => setProductData({ ...productData, content: e.target.value })}
                            className="mt-2 bg-white font-mono text-sm"
                            rows={12}
                            placeholder="Product description or summary"
                          />
                          <p className="text-xs text-slate-500 mt-2">You can edit this content before saving</p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel} 
                      disabled={saving || scrapingProduct || summarizingContent}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={saving || scrapingProduct || summarizingContent || !productData.cleanName?.trim()} 
                      className="bg-indigo-600 hover:bg-indigo-700 min-w-[130px]">
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : editingProduct ? 'Update Product' : 'Save Product'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Your saved products will appear here</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                      className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      title="Edit product">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product)}
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete product">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2 pr-20">{product.page_name}</h3>
                  <p className="text-xs text-slate-500 mb-3">Added: {new Date(product.created_date).toLocaleDateString()}</p>
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
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white text-slate-900 border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete "{productToDelete?.page_name}" from your product library.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700">
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
