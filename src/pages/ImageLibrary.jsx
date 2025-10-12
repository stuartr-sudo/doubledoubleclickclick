
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ImageLibraryItem } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { AppProduct } from "@/api/entities"; // NEW: Import AppProduct
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Trash2, Edit, CheckSquare, Sparkles, Download, Plus, Image as ImageIcon, RefreshCw, ShoppingBag, Package, ChevronDown, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Added DialogFooter
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateImageFalAi } from "@/api/functions";
import { saveImageFromString } from "@/api/functions";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import ImageGeneratorPanel from "@/components/editor/ImageGeneratorPanel";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { extractProductMeta } from "@/api/functions";
import { amazonProduct } from "@/api/functions";
import { UploadFile } from "@/api/integrations"; // NEW import

export default function ImageLibrary() {
  const [loading, setLoading] = useState(true);
  const [allImages, setAllImages] = useState([]);
  const [allUsernames, setAllUsernames] = useState([]);
  const [query, setQuery] = useState("");
  const [localUsernameFilter, setLocalUsernameFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState(null);
  const [editAltText, setEditAltText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [urlImportFormExpanded, setUrlImportFormExpanded] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importAltText, setImportAltText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { consumeTokensForFeature } = useTokenConsumption();

  // Replaced showGenerator with showUploadDialog and related states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadAltText, setUploadAltText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  const [productFormExpanded, setProductFormExpanded] = useState(false);
  const [amazonFormExpanded, setAmazonFormExpanded] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [amazonUrl, setAmazonUrl] = useState("");
  const [isImportingProduct, setIsImportingProduct] = useState(false);
  const [isImportingAmazon, setIsImportingAmazon] = useState(false);

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Feature flags for import options
  const { enabled: canImportFromProduct } = useFeatureFlag('image_library_product_import', {
    currentUser,
    defaultEnabled: false
  });

  const { enabled: canImportFromAmazon } = useFeatureFlag('image_library_amazon_import', {
    currentUser,
    defaultEnabled: false
  });

  // NEW: Feature flag for Amazon import button visibility
  const { enabled: showAmazonImport } = useFeatureFlag('media_library_images_importfromamazon', {
    currentUser,
    defaultEnabled: true // Defaulted to true as per outline
  });

  // Determine active username filter based on workspace scoping
  const usernameFilter = useWorkspaceScoping ? globalUsername || "all" : localUsernameFilter;

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      let availableUsernamesForSelection = [];
      if (user.role === 'admin') {
        availableUsernamesForSelection = await Username.list();
      } else {
        const assignedNames = new Set(user.assigned_usernames || []);
        if (assignedNames.size > 0) {
          const all = await Username.list();
          availableUsernamesForSelection = (all || []).filter((u) => assignedNames.has(u.user_name));
        }
      }
      availableUsernamesForSelection.sort((a, b) => (a.display_name || a.user_name).localeCompare(b.display_name || b.user_name));
      setAllUsernames(availableUsernamesForSelection);

      const allImagesResponse = await ImageLibraryItem.list("-created_date", 1000);
      let displayImages = [];
      if (user.role === 'admin') {
        displayImages = allImagesResponse;
      } else {
        const allowedUsernamesSet = new Set(availableUsernamesForSelection.map((u) => u.user_name));
        displayImages = (allImagesResponse || []).filter((img) => img.user_name && allowedUsernamesSet.has(img.user_name));
      }
      setAllImages(Array.isArray(displayImages) ? displayImages : []);

    } catch (error) {
      toast.error("Failed to load image library.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- FILTERING ---
  const filteredImages = useMemo(() => {
    let items = allImages;
    if (usernameFilter !== 'all' && usernameFilter) {
      items = items.filter((img) => img.user_name === usernameFilter);
    }
    if (query) {
      const lowerQuery = query.toLowerCase();
      items = items.filter((img) => (img.alt_text || '').toLowerCase().includes(lowerQuery));
    }
    return items;
  }, [allImages, query, usernameFilter]);

  // --- HANDLERS ---
  const handleSelectImage = (image) => {
    setSelectedImage(image);
    setEditAltText(image.alt_text || "");
    setShowEditorDialog(true);
  };

  const handleUpdateAltText = async () => {
    if (!selectedImage || editAltText === selectedImage.alt_text) return;
    setIsUpdating(true);
    try {
      await ImageLibraryItem.update(selectedImage.id, { alt_text: editAltText });
      toast.success("Alt text updated!");
      setSelectedImage((prev) => ({ ...prev, alt_text: editAltText }));
      setAllImages((prev) =>
        prev.map((img) =>
          img.id === selectedImage.id ? { ...img, alt_text: editAltText } : img
        )
      );
    } catch (error) {
      toast.error("Failed to update alt text.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteImage = () => {
    if (!selectedImage) return;
    setImageToDelete(selectedImage); // Set for dialog confirmation
    setShowDeleteConfirm(true);
  };

  // NEW: Handle delete from grid
  const handleGridDelete = (image, e) => {
    e.stopPropagation(); // Prevent image selection
    setImageToDelete(image);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const targetImage = imageToDelete || selectedImage; // Prioritize imageToDelete
    if (!targetImage) return;
    setIsDeleting(true);
    try {
      await ImageLibraryItem.delete(targetImage.id);
      toast.success("Image deleted.");
      setAllImages((prev) => prev.filter((img) => img.id !== targetImage.id));
      if (selectedImage?.id === targetImage.id) {
        setSelectedImage(null);
        setShowEditorDialog(false);
      }
      setImageToDelete(null); // Clear the image to delete
    } catch (error) {
      toast.error("Failed to delete image.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyUrl = () => {
    if (!selectedImage) return;
    navigator.clipboard.writeText(selectedImage.url);
    toast.success("Image URL copied to clipboard!");
  };

  const handleImportFromUrl = async () => {
    if (!globalUsername) {
      toast.error("Please select a workspace before importing.");
      return;
    }
    if (!importUrl.trim()) {
      toast.error("Please provide a URL.");
      return;
    }

    if (isImporting) return;

    // The token consumption for image_library_access is a generic gate.
    // If more specific token consumption is needed for URL imports, a new flag should be created.
    const result = await consumeTokensForFeature('image_library_access');
    if (!result.success) {
      return;
    }

    setIsImporting(true);
    try {
      const { data } = await saveImageFromString({
        value: importUrl.trim(),
        user_name: globalUsername, // Use globalUsername directly
        alt_text: importAltText.trim() || "Imported image",
        source: "upload"
      });

      if (data && data.success) {
        toast.success("Image imported successfully!");
        setImportUrl("");
        setImportAltText("");
        setUrlImportFormExpanded(false); // Use the new state variable
        await loadData();
      } else {
        toast.error(data?.error || "Failed to import image.");
      }
    } catch (error) {
      toast.error("Failed to import image.");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleProductImport = async () => {
    if (!productUrl.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    if (!globalUsername) {
      toast.error("Please select a workspace before importing.");
      return;
    }

    const result = await consumeTokensForFeature('image_library_product_import');
    if (!result.success) {
      return;
    }

    setIsImportingProduct(true);
    try {
      const { data } = await extractProductMeta({ url: productUrl.trim() });

      if (!data?.success || !data.images?.length) {
        toast.error("No product images found at this URL or failed to extract.");
        return;
      }

      let importedCount = 0;
      for (const imageUrl of data.images) {
        try {
          const { data: saveResult } = await saveImageFromString({
            value: imageUrl,
            user_name: globalUsername, // Use globalUsername directly
            alt_text: `${data.title || "Product"} - Image ${importedCount + 1}`,
            source: "product_import"
          });

          if (saveResult?.success) {
            importedCount++;
          }
        } catch (error) {
          console.error("Failed to save image:", error);
        }
      }

      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} product image${importedCount > 1 ? 's' : ''}`);
        await loadData();
        setProductFormExpanded(false); // Close inline form and reset
        setProductUrl("");
      } else {
        toast.error("Failed to import any images");
      }
    } catch (error) {
      console.error("Product import error:", error);
      toast.error("Failed to import product images");
    } finally {
      setIsImportingProduct(false);
    }
  };

  const handleAmazonImport = async () => {
    if (!amazonUrl.trim()) {
      toast.error("Please enter an Amazon product URL");
      return;
    }

    if (!globalUsername) {
      toast.error("Please select a workspace before importing.");
      return;
    }

    const result = await consumeTokensForFeature('image_library_amazon_import');
    if (!result.success) {
      return;
    }

    setIsImportingAmazon(true);
    try {
      const { data } = await amazonProduct({ url: amazonUrl.trim() });

      // CORRECTED: Check for 'product_photos' instead of 'images'
      if (!data?.success || !data.data?.product_photos?.length) {
        toast.error("No Amazon product images found or failed to extract.");
        setIsImportingAmazon(false);
        return;
      }

      let importedCount = 0;
      // CORRECTED: Loop over 'product_photos'
      for (const imageUrl of data.data.product_photos) {
        try {
          const { data: saveResult } = await saveImageFromString({
            value: imageUrl,
            user_name: globalUsername, // Use globalUsername directly
            // CORRECTED: Use 'product_title' from the response
            alt_text: `${data.data.product_title || "Amazon Product"} - Image ${importedCount + 1}`,
            source: "amazon_import"
          });

          if (saveResult?.success) {
            importedCount++;
          }
        } catch (error) {
          console.error("Failed to save Amazon image:", error);
        }
      }

      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} Amazon product image${importedCount > 1 ? 's' : ''}`);
        await loadData();
        // Close inline form and reset
        setAmazonFormExpanded(false); // Update to close inline form
        setAmazonUrl("");
      } else {
        toast.error("Failed to import any Amazon images");
      }
    } catch (error) {
      console.error("Amazon import error:", error);
      toast.error("Failed to import Amazon product images");
    } finally {
      setIsImportingAmazon(false);
    }
  };

  // NEW: Handle file upload with plan-based limits
  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!globalUsername || globalUsername === 'all') {
      toast.error("Please select a workspace before uploading");
      return;
    }

    setIsUploading(true);
    try {
      // Check user's plan and enforce limits
      const user = await User.me();
      const userPlanPriceId = user.plan_price_id;

      // Determine plan limits
      let uploadLimit = 5; // Default for free_trial
      let planName = "Free Trial";

      if (userPlanPriceId) {
        // Fetch AppProduct to determine plan_key
        const appProducts = await AppProduct.filter({ stripe_price_id: userPlanPriceId });
        if (appProducts.length > 0) {
          const planKey = appProducts[0].plan_key;

          switch (planKey) {
            case 'growth':
              uploadLimit = 100;
              planName = "Growth";
              break;
            case 'brand':
              uploadLimit = 1000;
              planName = "Brand";
              break;
            case 'agency':
              uploadLimit = -1; // -1 means unlimited
              planName = "Agency";
              break;
            default:
              uploadLimit = 5;
              planName = "Free Trial";
          }
        }
      }

      // Count existing images for this user
      if (uploadLimit !== -1) {
        const existingImages = await ImageLibraryItem.filter({ user_name: globalUsername });
        const currentCount = existingImages.length;

        if (currentCount >= uploadLimit) {
          toast.error(`Upload limit reached! Your ${planName} plan allows ${uploadLimit} images. Please upgrade to upload more.`);
          setIsUploading(false);
          return;
        }
      }

      // Upload file to storage
      const { data: uploadResult } = await UploadFile({ file: uploadFile });

      if (!uploadResult?.file_url) {
        throw new Error("Failed to upload file");
      }

      // Save to ImageLibraryItem
      await ImageLibraryItem.create({
        url: uploadResult.file_url,
        alt_text: uploadAltText || uploadFile.name,
        source: 'upload',
        user_name: globalUsername
      });

      toast.success("Image uploaded successfully!");
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadAltText("");
      await loadData();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // NEW: Toggle functions for inline forms, closing others when one opens
  const toggleProductForm = () => {
    setProductFormExpanded(prev => !prev);
    setAmazonFormExpanded(false);
    setUrlImportFormExpanded(false);
  };

  const toggleAmazonForm = () => {
    setAmazonFormExpanded(prev => !prev);
    setProductFormExpanded(false);
    setUrlImportFormExpanded(false);
  };

  const toggleUrlImportForm = () => {
    setUrlImportFormExpanded(prev => !prev);
    setProductFormExpanded(false);
    setAmazonFormExpanded(false);
  };


  // --- RENDER ---
  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Image Library</h1>
              <p className="text-slate-600">Manage your uploaded and generated images</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleProductForm}
                variant="outline"
                className={`bg-white border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2 ${productFormExpanded ? "bg-slate-100" : ""}`}
              >
                <ShoppingBag className="w-4 h-4" />
                Import from Product
                <ChevronDown className={`w-4 h-4 transition-transform ${productFormExpanded ? "rotate-180" : ""}`} />
              </Button>

              {showAmazonImport && (
                <Button
                  onClick={toggleAmazonForm}
                  variant="outline"
                  className={`bg-white border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2 ${amazonFormExpanded ? "bg-slate-100" : ""}`}
                >
                  <Package className="w-4 h-4" />
                  Import from Amazon
                  <ChevronDown className={`w-4 h-4 transition-transform ${amazonFormExpanded ? "rotate-180" : ""}`} />
                </Button>
              )}

              <Button
                onClick={toggleUrlImportForm}
                variant="outline"
                className={`bg-white border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2 ${urlImportFormExpanded ? "bg-slate-100" : ""}`}
              >
                <Download className="w-4 h-4" />
                Import from URL
                <ChevronDown className={`w-4 h-4 transition-transform ${urlImportFormExpanded ? "rotate-180" : ""}`} />
              </Button>

              <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>

          {/* NEW: Inline Product Import Form */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${productFormExpanded ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-slate-800">Import from Product URL</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProductFormExpanded(false);
                    setProductUrl(""); // Clear product URL on close
                  }}
                  className="text-slate-500 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="product-url-inline" className="text-slate-700 mb-2 block">Product URL</Label>
                  <Input
                    id="product-url-inline"
                    placeholder="https://example.com/product"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="bg-white border-slate-300"
                    disabled={isImportingProduct} />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleProductImport}
                  disabled={isImportingProduct || !productUrl.trim() || !globalUsername}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                  {isImportingProduct ?
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </> :
                    <>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Import Images
                    </>
                  }
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setProductFormExpanded(false);
                    setProductUrl("");
                  }}
                  disabled={isImportingProduct}
                  className="bg-white border-slate-300">
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* NEW: Inline Amazon Import Form */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${amazonFormExpanded ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-slate-800">Import from Amazon</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAmazonFormExpanded(false);
                    setAmazonUrl(""); // Clear Amazon URL on close
                  }}
                  className="text-slate-500 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Permission Notice */}
              <div className="bg-orange-100 mb-4 p-3 border border-lime-500 rounded-lg">
                <p className="text-slate-900 text-sm font-medium">
                  You must be the owner of this product, a registered Amazon Affiliate, or have express permission to use these images
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="amazon-url-inline" className="text-slate-700 mb-2 block">Amazon Product URL</Label>
                  <Input
                    id="amazon-url-inline"
                    placeholder="https://amazon.com/dp/B0123456789"
                    value={amazonUrl}
                    onChange={(e) => setAmazonUrl(e.target.value)}
                    className="bg-white border-slate-300"
                    disabled={isImportingAmazon} />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAmazonImport}
                  disabled={isImportingAmazon || !amazonUrl.trim() || !globalUsername}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex-1">
                  {isImportingAmazon ?
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </> :
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Import Images
                    </>
                  }
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAmazonFormExpanded(false);
                    setAmazonUrl("");
                  }}
                  disabled={isImportingAmazon}
                  className="bg-white border-slate-300">
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Import from URL Section */}
          {urlImportFormExpanded &&
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-slate-800 mb-4">Import Image from URL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="bg-white border-slate-300"
                  disabled={isImporting} />
                <Input
                  placeholder="Alt text (optional)"
                  value={importAltText}
                  onChange={(e) => setImportAltText(e.target.value)}
                  className="bg-white border-slate-300"
                  disabled={isImporting} />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleImportFromUrl}
                  disabled={isImporting || !importUrl.trim() || !globalUsername}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isImporting ?
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </> :
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Import Image
                    </>
                  }
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUrlImportFormExpanded(false);
                    setImportUrl("");
                    setImportAltText("");
                  }}
                  className="bg-white border-slate-300"
                  disabled={isImporting}>
                  Cancel
                </Button>
              </div>
            </div>
          }

          {/* Search and filter controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search images by alt text..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
              </div>
              {/* Username filter - conditionally rendered */}
              {!useWorkspaceScoping &&
                <Select value={localUsernameFilter} onValueChange={setLocalUsernameFilter}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="All Usernames" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Usernames</SelectItem>
                    {allUsernames.map((u) =>
                      <SelectItem key={u.id} value={u.user_name}>
                        {u.display_name || u.user_name}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              }
              {/* Refresh button - added to toolbar */}
              <div>
                <Button variant="outline" onClick={loadData} className="w-full bg-white border-slate-300">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Image grid */}
          {loading ?
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            </div> :
            filteredImages.length === 0 ?
              <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No images found for the selected filter.</p>
                <p className="text-sm mt-2">Try importing or uploading some images.</p>
              </div> :
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredImages.map((image) =>
                  <div
                    key={image.id}
                    onClick={() => handleSelectImage(image)}
                    className={cn(
                      "group relative bg-white rounded-lg overflow-hidden border transition-all cursor-pointer",
                      selectedImage?.id === image.id ? "border-blue-500 ring-2 ring-blue-500" : "border-slate-200 hover:shadow-md"
                    )}>
                    <div className="aspect-square">
                      <img
                        src={image.url}
                        alt={image.alt_text || "No alt text"}
                        className="w-full h-full object-cover" />
                    </div>

                    {/* NEW: Delete button */}
                    <button
                      onClick={(e) => handleGridDelete(image, e)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg"
                      title="Delete image">
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="p-3">
                      <p className="text-sm font-medium text-slate-800 truncate">{image.alt_text || "No alt text"}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {image.source === 'ai_generated' ? 'AI Generated' : image.source?.replace('_', ' ') || 'Uploaded'} - {image.user_name}
                      </p>
                    </div>
                    {selectedImage?.id === image.id &&
                      <div className="absolute top-2 left-2 bg-blue-600 rounded-full p-1">
                        <CheckSquare className="h-3 w-3 text-white" />
                      </div>
                    }
                  </div>
                )}
              </div>
          }
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-50 text-slate-950 p-6 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-slate-200 text-slate-900 hover:bg-slate-300 mt-2 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input h-10 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Editor Pane as Dialog */}
      <Dialog open={showEditorDialog} onOpenChange={setShowEditorDialog}>
        <DialogContent className="bg-white text-slate-900 max-w-lg w-full p-0 flex flex-col max-h-[90vh]">
          {selectedImage ?
            <>
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">Edit Image</h3>
                <p className="text-sm text-slate-500">Update image details or delete from library.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="aspect-square rounded-md overflow-hidden bg-slate-100 mb-4">
                  <img src={selectedImage.url} alt="Selected" className="w-full h-full object-cover" />
                </div>

                <div>
                  <Label htmlFor="alt-text" className="text-sm font-medium mb-2 block">
                    Alt Text
                  </Label>
                  <Textarea
                    id="alt-text"
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    onBlur={handleUpdateAltText}
                    placeholder="Describe the image..." className="bg-white border-slate-300 text-slate-900 px-3 py-2 text-sm flex min-h-[80px] w-full rounded-md border ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-20 resize-none" />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Source</Label>
                  <p className="text-sm text-slate-600 capitalize">
                    {selectedImage.source?.replace('_', ' ') || 'Unknown'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Username</Label>
                  <p className="text-sm text-slate-600">
                    {selectedImage.user_name || 'Not assigned'}
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-2 flex-shrink-0">
                <Button
                  onClick={handleCopyUrl} className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 h-10 w-full flex items-center justify-center gap-2"
                  variant="outline">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>

                <Button
                  onClick={handleDeleteImage}
                  variant="destructive" className="bg-red-600 text-destructive-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-destructive/90 h-10 w-full"
                  disabled={isDeleting}>
                  {isDeleting ?
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                    <Trash2 className="mr-2 h-4 w-4" />
                  }
                  Delete Image
                </Button>
              </div>
            </> :
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <ImageIcon className="h-8 w-8 mb-3" />
              <p className="text-sm font-medium mb-1">Select an image</p>
              <p className="text-xs text-center">
                Choose an image from the grid to view details and edit
              </p>
            </div>
          }
        </DialogContent>
      </Dialog>

      {/* NEW: Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file-upload" className="block mb-2">Select Image</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0])}
                disabled={isUploading}
              />
            </div>
            <div>
              <Label htmlFor="upload-alt-text" className="block mb-2">Alt Text (optional)</Label>
              <Input
                id="upload-alt-text"
                placeholder="Describe the image..."
                value={uploadAltText}
                onChange={(e) => setUploadAltText(e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setUploadFile(null);
                setUploadAltText("");
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={isUploading || !uploadFile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
