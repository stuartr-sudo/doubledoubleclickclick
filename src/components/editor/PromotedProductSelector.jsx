import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, Plus, Edit, ArrowLeft, Check, Package, ShoppingCart } from "lucide-react";
import { PromotedProduct } from "@/api/entities";
import { CustomContentTemplate } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import ProductFromUrlModal from "./ProductFromUrlModal";
import AmazonProductImporter from "./AmazonProductImporter";

export default function PromotedProductSelector({ isOpen, onClose, onInsert }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [localSelectedUsername, setLocalSelectedUsername] = useState("all");
  const [availableUsernameObjects, setAvailableUsernameObjects] = useState([]);
  const [step, setStep] = useState(1); // 1 = Select Product, 2 = Select Template
  const [showProductImport, setShowProductImport] = useState(false);
  const [showAmazonImport, setShowAmazonImport] = useState(false);

  const navigate = useNavigate();
  const { consumeTokensForFeature } = useTokenConsumption();
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username filter based on workspace scoping
  const selectedUsername = useWorkspaceScoping ? (globalUsername || "all") : localSelectedUsername;

  useEffect(() => {
    if (isOpen) {
      loadData();
      setStep(1);
      setSelectedProduct(null);
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsData, templatesData, user] = await Promise.all([
        PromotedProduct.list(),
        CustomContentTemplate.list(),
        User.me().catch(() => null)
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

      // STRICT filtering: Only show templates that are EXACTLY for products
      const productOnlyTemplates = (templatesData || []).filter((template) => {
        const isProductTemplate = template.associated_ai_feature === "product";
        const isActive = template.is_active !== false;

        // Additional filter to exclude any templates with CTA or Testimonial in the name
        const hasInvalidName = template.name && (
          template.name.toLowerCase().includes('cta') ||
          template.name.toLowerCase().includes('testimonial') ||
          template.name.toLowerCase().includes('underline effect') ||
          template.name.toLowerCase().includes('high-end & polished')
        );

        return isProductTemplate && isActive && !hasInvalidName;
      });

      setTemplates(productOnlyTemplates);

    } catch (error) {
      console.error("Error loading data for product selector:", error);
      toast.error("Failed to load products or templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setStep(2);
  };

  const handleBackToProducts = () => {
    setStep(1);
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
    // Ensure every inserted block has a unique ID for selection and deletion
    const uniqueId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    if (template && template.html_structure) {
      // Use custom template with ALL possible placeholder variations
      let html = template.html_structure
        .replace(/{{PRODUCT_NAME}}/g, product.name || '')
        .replace(/{{name}}/g, product.name || '')
        .replace(/{{PRODUCT_DESCRIPTION}}/g, product.description || '')
        .replace(/{{description}}/g, product.description || '')
        .replace(/{{PRODUCT_PRICE}}/g, product.price || '')
        .replace(/{{price}}/g, product.price || '')
        .replace(/{{PRODUCT_IMAGE}}/g, product.image_url || '')
        .replace(/{{PRODUCT_IMAGE_URL}}/g, product.image_url || '')
        .replace(/{{IMAGE_URL}}/g, product.image_url || '')
        .replace(/{{image_url}}/g, product.image_url || '')
        .replace(/{{image}}/g, product.image_url || '')
        .replace(/{{PRODUCT_URL}}/g, product.product_url || '')
        .replace(/{{product_url}}/g, product.product_url || '')
        .replace(/{{BUTTON_URL}}/g, product.button_url || product.product_url || '')
        .replace(/{{button_url}}/g, product.button_url || product.product_url || '');

      // Inject the unique ID into the root element of the template
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const rootElement = doc.body.firstChild;
      if (rootElement && typeof rootElement.setAttribute === 'function') {
        rootElement.setAttribute('data-b44-id', uniqueId);
        rootElement.classList.add('b44-promoted-product');
        return rootElement.outerHTML;
      }
      return html; // fallback
    }

    // Default template fallback with unique ID
    return `
<div class="b44-promoted-product" data-b44-id="${uniqueId}" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); display: flex; align-items: center; gap: 20px; max-width: 600px;">
  <img src="${product.image_url || ''}" alt="${product.name || ''}" style="width: 120px; height: 120px; object-fit: contain; border-radius: 8px; flex-shrink: 0;">
  <div style="flex: 1;">
    <h3 style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 600; color: #1e293b;">${product.name || ''}</h3>
    <p style="margin: 0 0 12px 0; color: #64748b; line-height: 1.5;">${product.description || ''}</p>
    <div style="display: flex; align-items: center; gap: 16px;">
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
    setStep(1);
    setSelectedProduct(null);
    setSelectedTemplate(null);
    onClose();
  };

  const handleProductImported = () => {
    // Refresh the product list after import
    loadData();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl bg-white text-slate-900 border border-slate-200">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                Insert Promoted Product
                {step === 2 && (
                  <span className="text-sm font-normal text-slate-500">
                    → {selectedProduct?.name}
                  </span>
                )}
              </DialogTitle>
              
              {step === 1 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowProductImport(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Import from Product
                  </Button>
                  <Button
                    onClick={() => setShowAmazonImport(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Import from Amazon
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {step === 1 && (
            <div className="py-4">
              {/* Step 1: Select Product */}
              <div className="space-y-4">
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

                  {!useWorkspaceScoping && availableUsernameObjects.length > 0 && (
                    <Select value={localSelectedUsername} onValueChange={setLocalSelectedUsername}>
                      <SelectTrigger className="bg-white text-slate-900 border border-slate-300">
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="all">All Products</SelectItem>
                        {availableUsernameObjects.map((usernameObj) => (
                          <SelectItem key={usernameObj.id} value={usernameObj.user_name}>
                            {usernameObj.display_name || usernameObj.user_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Products Grid */}
                <div className="max-h-[26rem] overflow-y-auto pr-2 -mr-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading products...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No products found. Add products in the Products page.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col"
                          onClick={() => handleProductSelect(product)}
                        >
                          {/* Simplified Product Info */}
                          <div className="flex-grow flex items-center gap-4">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-20 h-20 object-contain rounded-md flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-800 text-base line-clamp-2">
                                {product.name}
                              </div>
                              <div className="text-sm text-slate-600 line-clamp-3 mt-1">
                                {product.description}
                              </div>
                              {product.price && (
                                  <div className="text-lg font-bold text-green-700 mt-2">
                                    {product.price}
                                  </div>
                              )}
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
                                title="Edit this product"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="py-4">
              {/* Step 2: Select Template */}
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackToProducts}
                  className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Products
                </Button>
                <div className="text-sm text-slate-600">
                  Choose a template for: <span className="font-medium">{selectedProduct?.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
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
                      )}
                    >
                      <div className="font-medium text-slate-900">Default Style</div>
                    </button>
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template)}
                        className={cn(
                          "w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-b-0",
                          selectedTemplate?.id === template.id && "bg-blue-50 border-l-4 border-blue-500"
                        )}
                      >
                        <div className="font-medium text-slate-900">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 pt-2">
                    Manage templates in Assets → Templates.
                  </p>
                </div>

                {/* Right Column: Preview */}
                <div className="space-y-4">
                  <Label>Preview</Label>
                  <div className="border border-slate-200 rounded-lg bg-white p-6 min-h-[400px] overflow-auto">
                    <div 
                      dangerouslySetInnerHTML={{
                        __html: generateProductHtml(selectedProduct, selectedTemplate)
                      }}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={handleInsert}
                    className="w-full bg-blue-900 text-white hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Insert Product
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Import Modal */}
      <ProductFromUrlModal 
        isOpen={showProductImport}
        onClose={() => setShowProductImport(false)}
        onInsert={(html) => {
          onInsert(html);
          setShowProductImport(false);
          onClose();
        }}
      />

      {/* Amazon Import Modal */}
      <AmazonProductImporter
        isOpen={showAmazonImport}
        onClose={() => setShowAmazonImport(false)}
        onInsert={(html) => {
          onInsert(html);
          setShowAmazonImport(false);
          onClose();
        }}
        onProductSaved={handleProductImported}
      />
    </>
  );
}