
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Testimonial } from "@/api/entities";
import { CustomContentTemplate } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { ExternalLink, Search as SearchIcon, Star, X, ArrowLeft, Check, Package, Plus } from "lucide-react";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { amazonReviews } from "@/api/functions";
import TestimonialForm from "@/components/testimonials/TestimonialForm";

export default function TestimonialLibraryModal({
  isOpen,
  onClose,
  onInsert
}) {
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none"); // This state is technically not used in the wizard flow after step 1
  const [step, setStep] = useState(1);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [selectedTemplateForWizard, setSelectedTemplateForWizard] = useState(null);
  const [showAmazonImport, setShowAmazonImport] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState("");
  const [isImportingAmazon, setIsImportingAmazon] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { consumeTokensForFeature } = useTokenConsumption();
  const { toast } = useToast();
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username filter based on workspace scoping
  const selectedUsername = useWorkspaceScoping ? (globalUsername || "all") : "all";

  // SAFETY: ensure arrays are always defined (memoized to keep stable deps)
  const safeTestimonials = useMemo(
    () => (Array.isArray(testimonials) ? testimonials : []),
    [testimonials]
  );
  const safeTemplates = useMemo(
    () => (Array.isArray(templates) ? templates : []),
    [templates]
  );

  // Load data when opened
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset wizard state
    setStep(1);
    setSelectedTestimonial(null);
    setSelectedTemplateForWizard(null);
    setAmazonUrl("");
    setSelectedTemplateId("none"); // Reset template selection
    setQuery(""); // Reset search query

    const loadData = async () => {
      setLoading(true);
      try {
        const user = await User.me();
        
        let testimonialsData = [];
        
        if (user.role === 'admin') {
          // Admin can see all testimonials
          testimonialsData = await Testimonial.list("-updated_date", 500);
        } else {
          // Non-admin users can only see testimonials assigned to them
          const assignedNames = user.assigned_usernames || [];
          if (assignedNames.length > 0) {
            const testimonialsPromises = assignedNames.map(name => 
              Testimonial.filter({ user_name: name }, "-updated_date", 100).catch(() => [])
            );
            
            const testimonialsArrays = await Promise.all(testimonialsPromises);
            testimonialsData = testimonialsArrays.flat();
          }
        }

        setTestimonials(testimonialsData || []);
        
        // Load testimonial templates
        const tpls = await CustomContentTemplate.filter(
          { associated_ai_feature: "testimonial", is_active: true },
          "name",
          100
        );
        setTemplates(tpls || []);
      } catch (error) {
        console.error("Error loading testimonial data:", error);
        toast({
          title: "Error loading testimonials",
          description: "Failed to load testimonial data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, toast, useWorkspaceScoping, globalUsername]);

  // selectedTemplate memo is not directly used in the new wizard flow, but kept for consistency
  const selectedTemplate = useMemo(
    () => (selectedTemplateId === "none" ? null : templates.find(t => t.id === selectedTemplateId) || null),
    [selectedTemplateId, templates]
  );

  // Filter testimonials by username and search query (template filter removed for wizard)
  const filteredTestimonials = useMemo(() => {
    let rows = safeTestimonials.filter(Boolean); // avoid undefined entries

    // Filter by username (uses the active selectedUsername)
    if (selectedUsername !== "all") {
      rows = rows.filter(t => ((t?.user_name || "").toLowerCase() === selectedUsername.toLowerCase()));
    }
    
    // Filter by search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((t) =>
        (t?.review_title || "").toLowerCase().includes(q) ||
        (t?.review_comment || "").toLowerCase().includes(q) ||
        (t?.review_author || "").toLowerCase().includes(q)
      );
    }
    
    return rows;
  }, [safeTestimonials, selectedUsername, query]);

  // Helper functions
  const generateStarsHtml = (n) => {
    const count = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    return new Array(count).fill("★").join("") + new Array(5 - count).fill("☆").join("");
  };

  const generateTestimonialFromTemplate = (testimonial, template) => {
    // Generate unique ID for selection/deletion
    const uniqueId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    let html = template.html_structure || ''; // Ensure html_structure is not null
    
    // Generate star HTML
    const stars = generateStarsHtml(testimonial.review_star_rating || 5);

    // Replace all possible placeholder variations
    html = html
      .replace(/{{REVIEW_COMMENT}}/g, testimonial.review_comment || '')
      .replace(/{{review_comment}}/g, testimonial.review_comment || '')
      .replace(/{{TEXT}}/g, testimonial.review_comment || '')
      .replace(/{{text}}/g, testimonial.review_comment || '')
      .replace(/{{CONTENT}}/g, testimonial.review_comment || '')
      .replace(/{{content}}/g, testimonial.review_comment || '')
      .replace(/{{REVIEW_TITLE}}/g, testimonial.review_title || '')
      .replace(/{{review_title}}/g, testimonial.review_title || '')
      .replace(/{{TITLE}}/g, testimonial.review_title || '')
      .replace(/{{title}}/g, testimonial.review_title || '')
      .replace(/{{HEADING}}/g, testimonial.review_title || '')
      .replace(/{{heading}}/g, testimonial.review_title || '')
      .replace(/{{REVIEW_AUTHOR}}/g, testimonial.review_author || '')
      .replace(/{{review_author}}/g, testimonial.review_author || '')
      .replace(/{{AUTHOR}}/g, testimonial.review_author || '')
      .replace(/{{author}}/g, testimonial.review_author || '')
      .replace(/{{author_name}}/g, testimonial.review_author || '')
      .replace(/{{REVIEW_STAR_RATING}}/g, String(testimonial.review_star_rating || 5))
      .replace(/{{review_star_rating}}/g, String(testimonial.review_star_rating || 5))
      .replace(/{{RATING}}/g, String(testimonial.review_star_rating || 5))
      .replace(/{{rating}}/g, String(testimonial.review_star_rating || 5))
      .replace(/{{star_rating}}/g, String(testimonial.review_star_rating || 5))
      .replace(/{{PRODUCT_TITLE}}/g, testimonial.product_title || '')
      .replace(/{{product_title}}/g, testimonial.product_title || '')
      .replace(/{{REVIEW_DATE}}/g, testimonial.review_date || '')
      .replace(/{{review_date}}/g, testimonial.review_date || '')
      .replace(/{{DATE}}/g, testimonial.review_date || '')
      .replace(/{{date}}/g, testimonial.review_date || '')
      .replace(/{{VERIFIED_PURCHASE}}/g, testimonial.is_verified_purchase ? 'Verified Purchase' : '')
      .replace(/{{verified_purchase}}/g, testimonial.is_verified_purchase ? 'Verified Purchase' : '')
      .replace(/{{VERIFIED}}/g, testimonial.is_verified_purchase ? 'Verified Purchase' : '')
      .replace(/{{verified}}/g, testimonial.is_verified_purchase ? 'Verified Purchase' : '');

    html = html.replace(/{{STARS_HTML}}/g, stars).replace(/{{stars_html}}/g, stars);
    html = html.replace(/{{RATING_STARS}}/g, stars).replace(/{{rating_stars}}/g, stars);

    // Handle IMAGE placeholder specially
    const firstImage = (Array.isArray(testimonial.images) && testimonial.images[0]) || "";
    html = html.replace(/\{\{\s*IMAGE_URL\s*\}\}/gi, firstImage);
    html = html.replace(/\{\{\s*IMAGE\s*\}\}/gi, 
      firstImage ? `<img src="${firstImage}" alt="review image" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:8px;" />` : ""
    );


    // Inject unique ID and type into the root element
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const rootElement = doc.body.firstChild;
      if (rootElement && typeof rootElement.setAttribute === 'function') {
        rootElement.setAttribute('data-b44-id', uniqueId);
        rootElement.setAttribute('data-b44-type', 'testimonial');
        rootElement.classList.add('b44-testimonial');
        return rootElement.outerHTML;
      }
    } catch (e) {
      console.warn('Could not parse testimonial HTML for ID injection:', e);
    }

    // Fallback: wrap in a div with the required attributes
    return `<div class="b44-testimonial" data-b44-id="${uniqueId}" data-b44-type="testimonial">${html}</div>`;
  };

  const generateDefaultTestimonialHtml = (testimonial) => {
    // Generate unique ID for selection/deletion
    const uniqueId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    const stars = generateStarsHtml(testimonial.review_star_rating || 5);
    const firstImage = (Array.isArray(testimonial.images) && testimonial.images[0]) 
      ? `<img src="${testimonial.images[0]}" alt="review image" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:8px;" />` 
      : "";
    
    return `
<div class="b44-testimonial" data-b44-id="${uniqueId}" data-b44-type="testimonial" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 16px 0; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  <div style="margin-bottom: 12px; font-size: 1.25rem; color: #f59e0b;">
    ${stars}
  </div>
  ${testimonial.review_title ? `<h4 style="margin: 0 0 8px 0; font-size: 1.1rem; font-weight: 600; color: #1f2937;">${testimonial.review_title}</h4>` : ''}
  ${firstImage}
  <p style="margin: 0 0 12px 0; color: #4b5563; line-height: 1.6;">${testimonial.review_comment || ''}</p>
  <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.875rem; color: #6b7280;">
    <span style="font-weight: 500;">— ${testimonial.review_author || 'Anonymous'}</span>
    ${testimonial.is_verified_purchase ? '<span style="color: #059669; display: flex; align-items: center; gap: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M9 11l3 3L22 4"/></svg> Verified Purchase</span>' : ''}
  </div>
  ${testimonial.review_date ? `<div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">${testimonial.review_date}</div>` : ''}
</div>`;
  };

  const handleInsertTestimonial = async (testimonial, templateOverride) => {
    // Check and consume tokens before inserting
    const result = await consumeTokensForFeature('testimonial_library_insert');
    if (!result.success) {
      return;
    }

    let html;
    
    // Determine which template to apply for insertion based on provided templateOverride or testimonial's assigned template
    if (templateOverride) {
      html = generateTestimonialFromTemplate(testimonial, templateOverride);
    } else if (testimonial.custom_template_id) {
      const template = templates.find(t => t.id === testimonial.custom_template_id);
      if (template) {
        html = generateTestimonialFromTemplate(testimonial, template);
      } else {
        html = generateDefaultTestimonialHtml(testimonial);
      }
    } else {
      html = generateDefaultTestimonialHtml(testimonial);
    }
    
    onInsert(html);
    onClose();
    toast({
      title: "Testimonial inserted!",
      description: "The testimonial has been added to your content.",
    });
  };

  const handleClose = () => {
    setQuery("");
    setSelectedTemplateForWizard(null);
    setSelectedTestimonial(null);
    setStep(1);
    setSelectedTemplateId("none"); // Also reset the old template selector's state
    onClose();
  };

  // AMAZON IMPORT
  const runAmazonImport = async () => {
    if (!amazonUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please paste an Amazon product URL.",
        variant: "destructive"
      });
      return;
    }
    if (useWorkspaceScoping && !globalUsername) {
      toast({
        title: "Select a workspace",
        description: "Pick a workspace first to assign imported testimonials.",
        variant: "destructive"
      });
      return;
    }
    setIsImportingAmazon(true);
    try {
      const { data } = await amazonReviews({ url: amazonUrl.trim() });
      if (!data?.success || !Array.isArray(data?.reviews) || data.reviews.length === 0) {
        toast({
          title: "No reviews found",
          description: "Could not extract reviews from that URL.",
          variant: "destructive",
        });
        setIsImportingAmazon(false);
        return;
      }

      // Map to entity records
      const recs = data.reviews.map(r => ({
        source: "amazon",
        asin: data.asin || "",
        country: data.country || "",
        review_id: r.review_id || r.id || "",
        review_title: r.title || "",
        review_comment: r.text || r.comment || "",
        review_star_rating: Number(r.rating || r.stars || 0),
        review_link: r.url || r.link || "",
        review_author: r.author || r.reviewer || "Anonymous",
        review_author_url: r.author_url || "",
        review_author_avatar: r.author_avatar || "",
        review_date: r.date || "",
        is_verified_purchase: !!r.verified_purchase,
        helpful_vote_statement: r.helpful || "",
        images: Array.isArray(r.images) ? r.images : [],
        product_title: data.product_title || "",
        user_name: useWorkspaceScoping ? (globalUsername || "unknown") : undefined // Assign to global workspace if scoping is on
      }));

      // Create in DB
      if (recs.length > 0) {
        if (typeof Testimonial.bulkCreate === "function") {
          await Testimonial.bulkCreate(recs);
        } else {
          // Fallback if bulkCreate not available
          for (const rec of recs) {
            await Testimonial.create(rec);
          }
        }
      }

      toast({
        title: "Imported",
        description: `Imported ${recs.length} testimonials from Amazon.`,
      });
      setShowAmazonImport(false);
      setAmazonUrl("");
      // reload grid
      const user = await User.me();
      let testimonialsData = [];
      if (user.role === 'admin') {
        testimonialsData = await Testimonial.list("-updated_date", 500).catch(() => []);
      } else {
        const assignedNames = user.assigned_usernames || [];
        if (assignedNames.length > 0) {
          const testimonialsPromises = assignedNames.map(name => 
            Testimonial.filter({ user_name: name }, "-updated_date", 100).catch(() => [])
          );
          const testimonialsArrays = await Promise.all(testimonialsPromises);
          testimonialsData = testimonialsArrays.flat();
        }
      }
      setTestimonials(testimonialsData || []);
    } catch (e) {
      console.error("Amazon import error:", e);
      toast({
        title: "Import failed",
        description: "Could not import from Amazon. Please try again.",
        variant: "destructive",
      });
    }
    setIsImportingAmazon(false);
  };

  // MANUAL CREATE SAVE
  const handleCreateSave = async (data) => {
    if (useWorkspaceScoping && !globalUsername) {
      toast({
        title: "Select a workspace",
        description: "Pick a workspace first to save testimonials.",
        variant: "destructive"
      });
      return;
    }
    const payload = {
      ...data,
      user_name: useWorkspaceScoping ? (globalUsername || "unknown") : data.user_name
    };
    await Testimonial.create(payload);
    toast({ title: "Saved", description: "Testimonial saved to your library." });
    setShowCreateModal(false);
    // Reload testimonials after creation
    const user = await User.me();
    let testimonialsData = [];
    if (user.role === 'admin') {
      testimonialsData = await Testimonial.list("-updated_date", 500).catch(() => []);
    } else {
      const assignedNames = user.assigned_usernames || [];
      if (assignedNames.length > 0) {
        const testimonialsPromises = assignedNames.map(name => 
          Testimonial.filter({ user_name: name }, "-updated_date", 100).catch(() => [])
        );
        const testimonialsArrays = await Promise.all(testimonialsPromises);
        testimonialsData = testimonialsArrays.flat();
      }
    }
    setTestimonials(testimonialsData || []);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl w-[95vw] md:w-full max-h-[85vh] overflow-y-auto bg-white border border-slate-200 text-slate-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-slate-900">
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-slate-900 text-white text-xs">⭐</span>
                Testimonials
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowAmazonImport(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Import from Amazon
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Testimonial
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 pr-1">
            {/* Controls */}
            {step === 1 && (
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title, comment, or author..."
                    className="pl-9 bg-white border-slate-300 text-slate-900"
                  />
                </div>
                {/* Brand Filter removed – username is scoped via workspace */}
                {/* Template dropdown removed – template selection happens in Step 2 */}
              </div>
            )}

            {/* Wizard Step 1: pick a testimonial */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading && (
                    <div className="col-span-full text-center text-slate-600 py-8">
                      Loading testimonials...
                    </div>
                  )}

                  {!loading && filteredTestimonials.length === 0 && (
                    <div className="col-span-full text-center text-slate-600 py-8">
                      No testimonials found.
                    </div>
                  )}

                  {!loading && filteredTestimonials.map((testimonial) => (
                    <button
                      key={testimonial.id}
                      className="text-left relative rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col hover:shadow-md transition"
                      onClick={() => {
                        if (!testimonial) return;
                        setSelectedTestimonial(testimonial);
                        setSelectedTemplateForWizard(null);
                        setStep(2);
                      }}
                    >
                      <div
                        className="flex-grow p-4 prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 overflow-hidden"
                        // SAFETY: if helper relies on fields, guard against undefined
                        dangerouslySetInnerHTML={{ __html: testimonial ? generateDefaultTestimonialHtml(testimonial) : "" }}
                      />
                      <div className="border-t border-slate-200 bg-slate-50/50 p-3 flex items-center justify-between gap-2">
                        {testimonial?.review_link && (
                          <a
                            href={testimonial.review_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" /> Open Source
                          </a>
                        )}
                        <div className="flex-1" />
                        <span className="text-xs text-slate-500">Click to choose template →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Wizard Step 2: pick a template and insert */}
            {step === 2 && selectedTestimonial && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={() => {
                      setStep(1);
                      setSelectedTemplateForWizard(null);
                      setSelectedTestimonial(null);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Testimonials
                  </Button>
                  <div className="text-sm text-slate-600">
                    Choose a template for:{" "}
                    <span className="font-medium">
                      {(selectedTestimonial?.review_title || selectedTestimonial?.review_author || "Selected testimonial")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                  {/* Template List */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-xs mb-1 block">Template</Label>
                    <div className="border border-slate-200 rounded-md bg-slate-50 max-h-96 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateForWizard(null)}
                        className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 ${!selectedTemplateForWizard ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                      >
                        <div className="font-medium text-slate-900">Default Style</div>
                      </button>
                      {safeTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplateForWizard(template)}
                          className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-b-0 ${selectedTemplateForWizard?.id === template.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                        >
                          <div className="font-medium text-slate-900">{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-4">
                    <Label className="text-slate-700 text-xs mb-1 block">Preview</Label>
                    <div className="border border-slate-200 rounded-lg bg-white p-6 min-h-[320px] overflow-auto">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedTemplateForWizard
                            ? generateTestimonialFromTemplate(selectedTestimonial, selectedTemplateForWizard)
                            : (selectedTestimonial ? generateDefaultTestimonialHtml(selectedTestimonial) : "")
                        }}
                      />
                    </div>
                    <Button
                      onClick={() => selectedTestimonial && handleInsertTestimonial(selectedTestimonial, selectedTemplateForWizard || null)}
                      className="w-full bg-blue-900 text-white hover:bg-blue-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Insert Testimonial
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from Amazon dialog */}
      <Dialog open={showAmazonImport} onOpenChange={() => {
        setShowAmazonImport(false);
        setAmazonUrl("");
      }}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle>Import Testimonials from Amazon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="amazon-url">Amazon Product URL</Label>
            <Input
              id="amazon-url"
              placeholder="https://www.amazon.com/dp/ASIN..."
              value={amazonUrl}
              onChange={(e) => setAmazonUrl(e.target.value)}
              disabled={isImportingAmazon}
            />
            <div className="flex gap-2">
              <Button
                onClick={runAmazonImport}
                disabled={isImportingAmazon || !amazonUrl.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isImportingAmazon ? "Importing..." : "Import"}
              </Button>
              <Button
                variant="outline"
                className="bg-white border-slate-300"
                onClick={() => {
                  setShowAmazonImport(false);
                  setAmazonUrl("");
                }}
                disabled={isImportingAmazon}
              >
                Cancel
              </Button>
            </div>
            {useWorkspaceScoping && !globalUsername && (
              <div className="text-xs text-red-600">Select a workspace before importing.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual create dialog */}
      {/* The Dialog itself should still be conditionally rendered via 'open' prop if we want it to unmount/mount */}
      {/* However, the outline specifically indicated changing the className of DialogContent for 'hidden' */}
      {/* Sticking to the outline, but this pattern is less common than directly controlling Dialog's 'open' prop */}
      <Dialog open={showCreateModal} onOpenChange={() => setShowCreateModal(false)}>
        <DialogContent className={`bg-white border border-slate-200 text-slate-900 max-w-2xl`}>
          <DialogHeader>
            <DialogTitle>Add Testimonial</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {/* SAFETY: pass an empty object so the form never reads from undefined */}
            <TestimonialForm
              testimonial={{}}
              onSubmit={(data) => handleCreateSave(data)}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
