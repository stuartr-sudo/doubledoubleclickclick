
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Testimonial } from "@/api/entities";
import { CustomContentTemplate } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { ExternalLink, Search as SearchIcon, Star, X, ArrowLeft, Check, Package, Plus, ChevronDown } from "lucide-react";
import { useBalanceConsumption } from '@/components/hooks/useBalanceConsumption';
import { useToast } from "@/components/ui/use-toast"; // Renamed to shadcnToast to avoid conflict with sonner
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { amazonReviews } from "@/api/functions";
import TestimonialForm from "@/components/testimonials/TestimonialForm";
import { AnimatePresence, motion } from "framer-motion";
import { trustpilotReviews } from "@/api/functions"; // NEW: Trustpilot Reviews API
import { Badge } from "@/components/ui/badge"; // NEW: Badge for verified purchase
import { toast as sonnerToast } from "sonner"; // NEW: Sonner toast for Trustpilot (aliased)

export default function TestimonialLibraryModal({
  isOpen,
  onClose,
  onInsert
}) {
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");
  const [step, setStep] = useState(1);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [selectedTemplateForWizard, setSelectedTemplateForWizard] = useState(null);
  const [showAmazonImport, setShowAmazonImport] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState("");
  const [isImportingAmazon, setIsImportingAmazon] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showInlineForm, setShowInlineForm] = React.useState(false);
  const [inlineStep, setInlineStep] = React.useState(1);
  const [inlineTestimonial, setInlineTestimonial] = React.useState({
    author: "",
    text: "",
    title: "",
    rating: 5,
    verified: false
  });

  const [selectedInlineTemplate, setSelectedInlineTemplate] = React.useState(null);

  // NEW: Trustpilot inline import state
  const [showTrustpilot, setShowTrustpilot] = React.useState(false);
  const [tpDomain, setTpDomain] = React.useState("");
  const [tpLoading, setTpLoading] = React.useState(false);
  const [tpResults, setTpResults] = React.useState([]);

  const { consumeBalanceForFeature } = useBalanceConsumption();
  const { toast: shadcnToast } = useToast(); // Aliased to avoid conflict with sonnerToast
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // State to hold the current user, used for feature flags and other logic
  const [currentUser, setCurrentUser] = useState(null);

  // NEW: Feature flag for Amazon import button
  const { enabled: showAmazonImportButton } = useFeatureFlag('ask_ai_search_insert_amazon_testimonials', {
    currentUser: currentUser, // Pass the currentUser state to the feature flag hook
    defaultEnabled: true
  });

  // NEW: Feature flag for Trust Pilot import button
  const { enabled: showTrustPilotImportButton } = useFeatureFlag('ask_ai_search_insert_trust-pilot_testimonials', {
    currentUser: currentUser,
    defaultEnabled: true
  });

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

  // helper
  const resetInlineForm = () => {
    setInlineStep(1);
    setInlineTestimonial({ author: "", text: "", title: "", rating: 5, verified: false });
    setSelectedInlineTemplate(null);
  };

  // NEW: map inline values to a Testimonial entity shape (without saving)
  const inlineToEntity = (it) => ({
    review_author: it.author || "Anonymous",
    review_comment: it.text || "",
    review_title: it.title || "",
    review_star_rating: Number(it.rating || 5),
    is_verified_purchase: Boolean(it.verified),
    images: [],
    product_title: ""
  });

  // Function to reload testimonials for the grid (memoized to satisfy hooks deps)
  // NOTE: Only 'shadcnToast' is used inside the callback, so keep it as the sole dependency.
  const reloadTestimonialsData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user); // Set the current user here for feature flag evaluation
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
      setTestimonials((testimonialsData || []).filter((t) => t && typeof t === "object"));
    } catch (error) {
      console.error("Error loading testimonial data:", error);
      shadcnToast({
        title: "Error loading testimonials",
        description: "Failed to load testimonial data. Please try again.",
        variant: "destructive",
      });
      setCurrentUser(null); // Reset user on error
    } finally {
      setLoading(false);
    }
  }, [shadcnToast]);


  // Load data when opened
  useEffect(() => {
    if (!isOpen) return;

    // Reset wizard state
    setStep(1);
    setSelectedTestimonial(null);
    setSelectedTemplateForWizard(null);
    setAmazonUrl("");
    setSelectedTemplateId("none");
    setQuery("");
    setShowAmazonImport(false);
    // Reset inline form state
    setShowInlineForm(false);
    resetInlineForm();
    // NEW: Reset Trustpilot state
    setShowTrustpilot(false);
    setTpDomain("");
    setTpResults([]);

    reloadTestimonialsData(); // Use the memoized reload function
    // Load testimonial templates
    const loadTemplates = async () => {
      try {
        const tpls = await CustomContentTemplate.filter(
          { associated_ai_feature: "testimonial", is_active: true },
          "name",
          100
        );
        setTemplates(tpls || []);
      } catch (error) {
        console.error("Error loading testimonial templates:", error);
      }
    };
    loadTemplates();

  }, [isOpen, reloadTestimonialsData]);

  // selectedTemplate memo is not directly used in the new wizard flow, but kept for consistency
  const selectedTemplate = useMemo(
    () => (selectedTemplateId === "none" ? null : templates.find(t => t.id === selectedTemplateId) || null),
    [selectedTemplateId, templates]
  );

  // Filter testimonials by username and search query (template filter removed for wizard)
  const filteredTestimonials = useMemo(() => {
    let rows = safeTestimonials.filter(Boolean);

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

  // SAFETY: make renderer resilient to missing fields
  const generateTestimonialFromTemplate = (testimonialInput = {}, template = {}) => {
    const t = testimonialInput && typeof testimonialInput === "object" ? testimonialInput : {};
    // Generate unique ID for selection/deletion
    const uniqueId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    let html = String(template?.html_structure || '');

    // Helpers with safe fallbacks
    const review_comment = t.review_comment || '';
    const review_title = t.review_title || '';
    const review_author = t.review_author || 'Anonymous';
    const review_star_rating = Number(t.review_star_rating ?? 5);
    const product_title = t.product_title || '';
    const review_date = t.review_date || '';
    const is_verified_purchase = Boolean(t.is_verified_purchase);
    const firstImageUrl = (Array.isArray(t.images) && t.images[0]) ? t.images[0] : "";

    // Generate star HTML safely
    const safeCount = Math.max(0, Math.min(5, Math.round(Number(review_star_rating) || 0)));
    const stars = new Array(safeCount).fill("★").join("") + new Array(5 - safeCount).fill("☆").join("");

    // Replace placeholders
    html = html
      .replace(/{{REVIEW_COMMENT}}/g, review_comment)
      .replace(/{{review_comment}}/g, review_comment)
      .replace(/{{TEXT}}/g, review_comment)
      .replace(/{{text}}/g, review_comment)
      .replace(/{{CONTENT}}/g, review_comment)
      .replace(/{{content}}/g, review_comment)
      .replace(/{{REVIEW_TITLE}}/g, review_title)
      .replace(/{{review_title}}/g, review_title)
      .replace(/{{TITLE}}/g, review_title)
      .replace(/{{title}}/g, review_title)
      .replace(/{{HEADING}}/g, review_title)
      .replace(/{{heading}}/g, review_title)
      .replace(/{{REVIEW_AUTHOR}}/g, review_author)
      .replace(/{{review_author}}/g, review_author)
      .replace(/{{AUTHOR}}/g, review_author)
      .replace(/{{author}}/g, review_author)
      .replace(/{{author_name}}/g, review_author)
      .replace(/{{REVIEW_STAR_RATING}}/g, String(review_star_rating))
      .replace(/{{review_star_rating}}/g, String(review_star_rating))
      .replace(/{{RATING}}/g, String(review_star_rating))
      .replace(/{{rating}}/g, String(review_star_rating))
      .replace(/{{star_rating}}/g, String(review_star_rating))
      .replace(/{{PRODUCT_TITLE}}/g, product_title)
      .replace(/{{product_title}}/g, product_title)
      .replace(/{{REVIEW_DATE}}/g, review_date)
      .replace(/{{review_date}}/g, review_date)
      .replace(/{{DATE}}/g, review_date)
      .replace(/{{date}}/g, review_date)
      .replace(/{{VERIFIED_PURCHASE}}/g, is_verified_purchase ? 'Verified Purchase' : '')
      .replace(/{{verified_purchase}}/g, is_verified_purchase ? 'Verified Purchase' : '')
      .replace(/{{VERIFIED}}/g, is_verified_purchase ? 'Verified Purchase' : '')
      .replace(/{{verified}}/g, is_verified_purchase ? 'Verified Purchase' : '');

    html = html.replace(/{{STARS_HTML}}/g, stars).replace(/{{stars_html}}/g, stars);
    html = html.replace(/{{RATING_STARS}}/g, stars).replace(/{{rating_stars}}/g, stars);

    // Handle IMAGE placeholder specially
    html = html.replace(/\{\{\s*IMAGE_URL\s*\}\}/gi, firstImageUrl);
    html = html.replace(/\{\{\s*IMAGE\s*\}\}/gi,
      firstImageUrl ? `<img src="${firstImageUrl}" alt="review image" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:8px;" />` : ""
    );

    // Inject unique ID and type into the root element safely
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

  // SAFETY: default parameter + guarded property access
  const generateDefaultTestimonialHtml = (testimonialInput = {}) => {
    const t = testimonialInput && typeof testimonialInput === "object" ? testimonialInput : {};
    // Generate unique ID for selection/deletion
    const uniqueId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const ratingNum = Number(t.review_star_rating ?? 5);
    const starsCount = Math.max(0, Math.min(5, Math.round(isNaN(ratingNum) ? 5 : ratingNum)));
    const stars = new Array(starsCount).fill("★").join("") + new Array(5 - starsCount).fill("☆").join("");

    const firstImage = (Array.isArray(t.images) && t.images[0])
      ? `<img src="${t.images[0]}" alt="review image" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:8px;" />`
      : "";

    const reviewTitle = t.review_title || '';
    const reviewComment = t.review_comment || '';
    const reviewAuthor = t.review_author || 'Anonymous';
    const verified = Boolean(t.is_verified_purchase);
    const reviewDate = t.review_date || '';

    return `
<div class="b44-testimonial" data-b44-id="${uniqueId}" data-b44-type="testimonial" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 16px 0; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  <div style="margin-bottom: 12px; font-size: 1.25rem; color: #f59e0b;">
    ${stars}
  </div>
  ${reviewTitle ? `<h4 style="margin: 0 0 8px 0; font-size: 1.1rem; font-weight: 600; color: #1f2937;">${reviewTitle}</h4>` : ''}
  ${firstImage}
  <p style="margin: 0 0 12px 0; color: #4b5563; line-height: 1.6;">${reviewComment}</p>
  <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.875rem; color: #6b7280;">
    <span style="font-weight: 500;">— ${reviewAuthor}</span>
    ${verified ? '<span style="color: #059669; display: flex; align-items: center; gap: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M9 11l3 3L22 4"/></svg> Verified Purchase</span>' : ''}
  </div>
  ${reviewDate ? `<div style="font-size: 0.75rem; color: #9ca3af; margin-top: 4px;">${reviewDate}</div>` : ''}
</div>`;
  };

  const handleInsertTestimonial = async (testimonial, templateOverride) => {
    // Check and consume tokens before inserting
    const result = await consumeBalanceForFeature('testimonial_library_insert');
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
    shadcnToast({
      title: "Testimonial inserted!",
      description: "The testimonial has been added to your content.",
    });
  };

  const handleClose = () => {
    setQuery("");
    setSelectedTemplateForWizard(null);
    setSelectedTestimonial(null);
    setStep(1);
    setSelectedTemplateId("none");
    setShowAmazonImport(false);
    setAmazonUrl("");
    setShowInlineForm(false);
    resetInlineForm();
    // NEW: Reset Trustpilot state on close
    setShowTrustpilot(false);
    setTpDomain("");
    setTpResults([]);
    onClose();
  };

  // AMAZON IMPORT
  const runAmazonImport = async () => {
    if (!amazonUrl.trim()) {
      shadcnToast({
        title: "Missing URL",
        description: "Please paste an Amazon product URL.",
        variant: "destructive"
      });
      return;
    }
    if (useWorkspaceScoping && !globalUsername) {
      shadcnToast({
        title: "Select a workspace",
        description: "Pick a workspace first to assign imported testimonials.",
        variant: "destructive"
      });
      return;
    }
    setIsImportingAmazon(true);
    try {
      const { data: resp } = await amazonReviews({ url: amazonUrl.trim() });
      const apiOk = resp?.success === true;
      const apiData = resp?.data || {};
      const reviews = Array.isArray(apiData.reviews) ? apiData.reviews : [];

      if (!apiOk || reviews.length === 0) {
        shadcnToast({
          title: "No reviews found",
          description: resp?.error || "Could not extract reviews from that URL.",
          variant: "destructive",
        });
        setIsImportingAmazon(false);
        return;
      }

      // Map to entity records
      const recs = reviews.map(r => ({
        source: "amazon",
        asin: apiData.asin || "",
        country: apiData.country || "",
        review_id: r.review_id || r.id || "",
        review_title: r.review_title || r.title || "",
        review_comment: r.review_comment || r.text || r.comment || "",
        review_star_rating: Number(r.review_star_rating ?? r.rating ?? 0),
        review_link: r.review_link || r.url || r.link || "",
        review_author: r.review_author || r.author || r.reviewer || "Anonymous",
        review_author_url: r.review_author_url || "",
        review_author_avatar: r.review_author_avatar || "",
        review_date: r.review_date || r.date || "",
        is_verified_purchase: Boolean(r.is_verified_purchase ?? r.verified_purchase),
        helpful_vote_statement: r.helpful_vote_statement || r.helpful || "",
        images: Array.isArray(r.review_images || r.images) ? (r.review_images || r.images) : [],
        product_title: apiData.product_title || "",
        user_name: useWorkspaceScoping ? (globalUsername || "unknown") : undefined
      }));

      // Create in DB
      if (recs.length > 0) {
        if (typeof Testimonial.bulkCreate === "function") {
          await Testimonial.bulkCreate(recs);
        } else {
          for (const rec of recs) {
            await Testimonial.create(rec);
          }
        }
      }

      shadcnToast({
        title: "Imported",
        description: `Imported ${recs.length} testimonials from Amazon.`,
      });
      setShowAmazonImport(false);
      setAmazonUrl("");
      reloadTestimonialsData(); // Reload grid after import
    } catch (e) {
      console.error("Amazon import error:", e);
      shadcnToast({
        title: "Import failed",
        description: "Could not import from Amazon. Please try again.",
        variant: "destructive",
      });
    }
    setIsImportingAmazon(false);
  };

  // MANUAL CREATE SAVE (This function is now only used by the unreachable legacy modal)
  const handleCreateSave = async (data) => {
    if (useWorkspaceScoping && !globalUsername) {
      shadcnToast({
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
    shadcnToast({ title: "Saved", description: "Testimonial saved to your library." });
    setShowCreateModal(false);
    setShowInlineForm(false);
    resetInlineForm();
    reloadTestimonialsData(); // Reload testimonials after creation
  };

  // Add helper handlers to ensure click/keyboard always go to Step 2
  const goToTemplateStep = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setSelectedTemplateForWizard(null);
    setStep(2);
  };

  const handleCardClick = (testimonial) => (e) => {
    const link = e.target?.closest && e.target.closest('a');
    if (link) e.preventDefault();
    goToTemplateStep(testimonial);
  };

  const handleCardKeyDown = (testimonial) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToTemplateStep(testimonial);
    }
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
                {/* Trustpilot toggle button - gated by feature flag */}
                {showTrustPilotImportButton && (
                  <Button
                    onClick={() => {
                      setShowTrustpilot(v => !v);
                      setShowAmazonImport(false);
                      setAmazonUrl("");
                      setShowInlineForm(false);
                      resetInlineForm();
                      setTpResults([]);
                    }}
                    variant="default"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Import from Trust Pilot
                    <ChevronDown className={`w-4 h-4 transition-transform ${showTrustpilot ? "rotate-180" : ""}`} />
                  </Button>
                )}

                {/* Amazon import button - gated by feature flag */}
                {showAmazonImportButton && (
                  <Button
                    onClick={() => {
                      setShowAmazonImport(!showAmazonImport);
                      setShowInlineForm(false);
                      resetInlineForm();
                      setShowTrustpilot(false);
                      setTpDomain("");
                      setTpResults([]);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Import from Amazon
                  </Button>
                )}
                {!showInlineForm ? (
                  <Button
                    onClick={() => {
                      setShowInlineForm(true);
                      setShowAmazonImport(false);
                      setAmazonUrl("");
                      setShowTrustpilot(false);
                      setTpDomain("");
                      setTpResults([]);
                    }}
                    className="bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Testimonial
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => { setShowInlineForm(false); resetInlineForm(); }}
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4 mr-2" /> Close Add Form
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 pr-1">
            {/* NEW: Inline Trustpilot panel */}
            <AnimatePresence initial={false}>
              {showTrustpilot && (
                <motion.div
                  key="tp-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 mb-4">
                    <h3 className="font-medium text-slate-800">Import Testimonials from Trustpilot</h3>
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                      <div className="flex-1 relative min-w-[260px]">
                        <Input
                          value={tpDomain}
                          onChange={(e) => setTpDomain(e.target.value)}
                          placeholder="trustpilot company domain (e.g., kurk.life)"
                          className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                          disabled={tpLoading}
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (!tpDomain.trim()) {
                            sonnerToast.error("Please enter a company domain.");
                            return;
                          }
                          if (!globalUsername) {
                            sonnerToast.error("Please select a workspace/brand first.");
                            return;
                          }

                          const res = await consumeBalanceForFeature("ai_testimonials_trustpilot_import");
                          if (!res.success) {
                            sonnerToast.error(res.error || "Token consumption failed.");
                            return;
                          }

                          setTpLoading(true);
                          try {
                            const { data } = await trustpilotReviews({
                              action: "company_reviews",
                              company_domain: tpDomain.trim(),
                              date_posted: "any",
                              sort: "most_relevant",
                              page: 1,
                              locale: "en-US"
                            });

                            const reviews = data?.reviews || data?.data || data?.data?.reviews || [];
                            if (!Array.isArray(reviews) || reviews.length === 0) {
                              sonnerToast.error("No Trustpilot reviews found for this domain.");
                              setTpResults([]);
                            } else {
                              const normalized = reviews.map((rv) => ({
                                id: rv.review_id || rv.id || Math.random().toString(36).slice(2, 10),
                                title: rv.review_title || rv.title || "",
                                text: rv.review_text || rv.text || "",
                                stars: Number(rv.review_rating ?? rv.stars ?? 0),
                                author: rv.consumer_name || rv.author || "Anonymous",
                                date: rv.review_time || rv.createdAt || "",
                                verified: Boolean(rv.review_is_verified ?? rv.isVerified),
                                url: rv.url || ""
                              }));
                              setTpResults(normalized);
                              sonnerToast.success(`Found ${normalized.length} reviews from Trustpilot.`);
                            }
                          } catch (e) {
                            console.error("Trustpilot import error:", e);
                            sonnerToast.error("Could not fetch reviews from Trustpilot. Please try again.");
                          } finally {
                            setTpLoading(false);
                          }
                        }}
                        disabled={tpLoading || !tpDomain.trim()}
                        className="bg-slate-900 text-white hover:bg-slate-800"
                      >
                        {tpLoading ? "Fetching…" : "Fetch Reviews"}
                      </Button>
                    </div>

                    {useWorkspaceScoping && !globalUsername && (
                      <div className="text-xs text-red-600">Select a workspace before importing.</div>
                    )}

                    {/* Results grid */}
                    {tpResults.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tpResults.map((r) => (
                          <div key={r.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                            <div className="text-amber-500 text-lg mb-1">
                              {"★".repeat(Math.max(0, Math.min(5, r.stars)))}
                              {"☆".repeat(Math.max(0, 5 - Math.max(0, Math.min(5, r.stars))))}
                            </div>
                            <div className="font-semibold text-slate-900">{r.title || "Untitled review"}</div>
                            {/* CHANGE: remove line clamp and preserve line breaks for readability */}
                            <p className="text-slate-700 text-sm mt-1 whitespace-pre-wrap">{r.text}</p>
                            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                              <span>— {r.author}</span>
                              {r.verified && <Badge variant="outline" className="text-emerald-600 border-emerald-200">Verified</Badge>}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              {r.url ? (
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  View on Trustpilot
                                </a>
                              ) : <span />}
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={async () => {
                                  if (!globalUsername) {
                                    sonnerToast.error("Please select a workspace/brand first.");
                                    return;
                                  }
                                  const payload = {
                                    source: "trustpilot",
                                    asin: "",
                                    country: "",
                                    review_id: r.id,
                                    review_title: r.title,
                                    review_comment: r.text,
                                    review_star_rating: r.stars,
                                    review_link: r.url || "",
                                    review_author: r.author || "Anonymous",
                                    review_author_url: "",
                                    review_author_avatar: "",
                                    review_date: r.date || "",
                                    is_verified_purchase: !!r.verified,
                                    helpful_vote_statement: "",
                                    images: [],
                                    product_title: "",
                                    user_name: globalUsername
                                  };
                                  try {
                                    const created = await Testimonial.create(payload);
                                    if (created?.id) {
                                      sonnerToast.success("Review added to your testimonials.");
                                      // Ensure the new record is used to proceed to template selection (Step 2)
                                      const createdForWizard = { ...payload, id: created.id };
                                      setSelectedTestimonial(createdForWizard);
                                      setSelectedTemplateForWizard(null); // Reset template selection
                                      setShowTrustpilot(false); // Close Trustpilot panel
                                      setStep(2); // Go to template selection step
                                      reloadTestimonialsData(); // refresh grid in background
                                    } else {
                                      sonnerToast.error("Failed to add review.");
                                    }
                                  } catch (error) {
                                    console.error("Error creating testimonial:", error);
                                    sonnerToast.error("Failed to add review. " + error.message);
                                  }
                                }}
                              >
                                Select & Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* NEW: Inline Amazon Import Form */}
            <AnimatePresence>
              {showAmazonImport && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 mb-4">
                    <h3 className="font-medium text-slate-800">Import Testimonials from Amazon</h3>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="amazon-url-inline"
                        placeholder="https://www.amazon.com/dp/ASIN..."
                        value={amazonUrl}
                        onChange={(e) => setAmazonUrl(e.target.value)}
                        disabled={isImportingAmazon}
                        className="flex-grow bg-white border-slate-300"
                      />
                      <Button
                        onClick={runAmazonImport}
                        disabled={isImportingAmazon || !amazonUrl.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isImportingAmazon ? "Importing..." : "Import"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowAmazonImport(false);
                          setAmazonUrl("");
                        }}
                        disabled={isImportingAmazon}
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </Button>
                    </div>
                    {useWorkspaceScoping && !globalUsername && (
                      <div className="text-xs text-red-600">Select a workspace before importing.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* NEW: Inline Add Testimonial block */}
            <AnimatePresence>
              {showInlineForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden w-full p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4"
                >
                  {inlineStep === 1 && (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-slate-900">Create Testimonial</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setShowInlineForm(false); resetInlineForm(); }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="inline-author" className="text-slate-800">Author</Label>
                          <Input
                            id="inline-author"
                            placeholder="Author name"
                            value={inlineTestimonial.author}
                            onChange={(e) => setInlineTestimonial({ ...inlineTestimonial, author: e.target.value })}
                            className="bg-white border-slate-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="inline-rating" className="text-slate-800">Rating (1-5)</Label>
                          <Input
                            id="inline-rating"
                            type="number"
                            min={1}
                            max={5}
                            value={inlineTestimonial.rating}
                            onChange={(e) => {
                              const v = Number(e.target.value || 5);
                              const nv = Math.max(1, Math.min(5, v));
                              setInlineTestimonial({ ...inlineTestimonial, rating: nv });
                            }}
                            className="bg-white border-slate-300"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="inline-text" className="text-slate-800">Testimonial</Label>
                        <Textarea
                          id="inline-text"
                          placeholder="Testimonial text..."
                          rows={4}
                          value={inlineTestimonial.text}
                          onChange={(e) => setInlineTestimonial({ ...inlineTestimonial, text: e.target.value })}
                          className="bg-white border-slate-300"
                        />
                      </div>

                      <div>
                        <Label htmlFor="inline-title" className="text-slate-800">Title</Label>
                        <Input
                          id="inline-title"
                          placeholder="Optional title (e.g., Best cutting board!)"
                          value={inlineTestimonial.title || ""}
                          onChange={(e) => setInlineTestimonial({ ...inlineTestimonial, title: e.target.value })}
                          className="bg-white border-slate-300"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => { setShowInlineForm(false); resetInlineForm(); }}
                          className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => setInlineStep(2)}
                          disabled={!inlineTestimonial.author || !inlineTestimonial.text}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Next: Choose Template
                        </Button>
                      </div>
                    </>
                  )}

                  {inlineStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInlineStep(1)}
                          className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <h3 className="font-semibold text-slate-900">Choose Template</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                        {/* Template List (left) */}
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-xs mb-1 block">Template</Label>
                          <div className="border border-slate-200 rounded-md bg-slate-50 max-h-96 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedInlineTemplate(null)}
                              className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 ${!selectedInlineTemplate ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                            >
                              <div className="font-medium text-slate-900">Default Style</div>
                            </button>
                            {safeTemplates.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => setSelectedInlineTemplate(template)}
                                className={`w-full text-left px-3 py-3 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-b-0 ${selectedInlineTemplate?.id === template.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                              >
                                <div className="font-medium text-slate-900">{template.name}</div>
                                {template.description && (
                                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preview + Insert (right) */}
                        <div className="space-y-4">
                          <Label className="text-slate-700 text-xs mb-1 block">Preview</Label>
                          <div className="border border-slate-200 rounded-lg bg-white p-6 min-h-[320px] overflow-auto">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedInlineTemplate
                                  ? generateTestimonialFromTemplate(inlineToEntity(inlineTestimonial), selectedInlineTemplate)
                                  : generateDefaultTestimonialHtml(inlineToEntity(inlineTestimonial))
                              }}
                            />
                          </div>
                          <Button
                            onClick={() => handleInsertTestimonial(inlineToEntity(inlineTestimonial), selectedInlineTemplate || null)}
                            className="w-full bg-blue-900 text-white hover:bg-blue-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Insert Testimonial
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
                    <div
                      key={testimonial.id}
                      role="button"
                      tabIndex={0}
                      onClick={handleCardClick(testimonial)}
                      onKeyDown={handleCardKeyDown(testimonial)}
                      className="text-left relative rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col hover:shadow-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div
                        className="flex-grow p-4 prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: generateDefaultTestimonialHtml(testimonial) }}
                      />
                      {/* Select button (no footer bar) */}
                      <div className="p-3 pt-0 flex justify-end">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToTemplateStep(testimonial);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Select
                        </Button>
                      </div>
                    </div>
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
                            : generateDefaultTestimonialHtml(selectedTestimonial)
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

      {/* Manual create dialog left in place but unreachable since the button no longer opens it */}
      <Dialog open={showCreateModal} onOpenChange={() => setShowCreateModal(false)}>
        <DialogContent className={`bg-white border border-slate-200 text-slate-900 max-w-2xl`}>
          <DialogHeader>
            <DialogTitle>Add Testimonial</DialogTitle>
          </DialogHeader>
          <div className="py-2">
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
