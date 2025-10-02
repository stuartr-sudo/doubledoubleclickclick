
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Testimonial } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { ExternalLink, Star, CheckCircle2, Loader2, Eye, Save, Search, ShoppingBag, Trash2, Plus, ChevronDown, Globe, X } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { trustpilotReviews } from "@/api/functions";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import TestimonialForm from "@/components/testimonials/TestimonialForm";
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

function makeStars(n) {
  const x = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
  return new Array(5).fill(0).map((_, i) => (
    <Star key={i} className={`inline w-4 h-4 ${i < x ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
  ));
}

export default function TestimonialLibrary() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [usernames, setUsernames] = useState(["all"]);
  const [filters, setFilters] = useState({ username: "all", asin: "", q: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [tpExpanded, setTpExpanded] = useState(false);
  const [manualExpanded, setManualExpanded] = useState(false);

  // Trustpilot inline form state
  const [tpDomain, setTpDomain] = useState("");
  const [tpPage, setTpPage] = useState(1);
  const [tpSort, setTpSort] = useState("most_relevant");
  const [tpDate, setTpDate] = useState("any");
  const [tpLocale, setTpLocale] = useState("en-US");
  const [tpLoading, setTpLoading] = useState(false);
  const [tpResults, setTpResults] = useState([]); // normalized reviews from function
  const [tpSelected, setTpSelected] = new useState(new Set());

  const { selectedUsername: globalUsername, isLoading: isWorkspaceLoading } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // NEW: token consumption hook for Trustpilot imports
  const { consumeTokensForFeature } = useTokenConsumption();

  // Determine active username filter based on workspace scoping
  const activeUsernameFilter = useWorkspaceScoping ? (globalUsername || "all") : filters.username;

  // Helper: active username to assign imports
  const activeUsername = useWorkspaceScoping ? (globalUsername || "") : (filters.username !== "all" ? filters.username : "");

  // Toggle helpers
  const toggleTp = () => setTpExpanded((s) => !s);
  const toggleManual = () => setManualExpanded((s) => !s);

  const handleTpFetch = async () => {
    if (!tpDomain.trim()) {
      toast.error("Enter a Trustpilot company domain (e.g., gossby.com)");
      return;
    }
    if (!activeUsername) {
      toast.error("Select a brand/workspace first.");
      return;
    }

    // NEW: enforce feature flag + token usage
    const res = await consumeTokensForFeature("ai_testimonials_trustpilot_import");
    if (!res.success) {
      // The useTokenConsumption hook typically handles displaying toast messages for failure.
      return;
    }

    setTpLoading(true);
    try {
      const { data } = await trustpilotReviews({
        action: "company_reviews",
        company_domain: tpDomain.trim(),
        page: Math.max(1, Number(tpPage) || 1),
        sort: tpSort,
        date_posted: tpDate,
        locale: tpLocale
      });
      // Our backend returns reviews in data.reviews or top-level .reviews per implementation
      const reviews = data?.reviews || data?.data || data?.data?.reviews || [];
      if (!Array.isArray(reviews) || reviews.length === 0) {
        toast.error("No reviews found for that domain.");
        setTpResults([]);
        setTpSelected(new Set());
      } else {
        // Normalize fields to our Testimonial entity mapping
        const normalized = reviews.map((r) => ({
          id: r.review_id || r.id || `${(r.consumer_name || "anon")}-${Math.random().toString(36).slice(2, 8)}`,
          title: r.review_title || r.title || "",
          text: r.review_text || r.text || "",
          stars: Number(r.review_rating ?? r.stars ?? 0),
          author: r.consumer_name || r.author || "Anonymous",
          date: r.review_time || r.createdAt || "",
          isVerified: Boolean(r.review_is_verified ?? r.isVerified),
          url: r.url || ""
        }));
        setTpResults(normalized);
        setTpSelected(new Set());
      }
    } finally {
      setTpLoading(false);
    }
  };

  const tpToggleSelect = (id) => {
    setTpSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const tpSelectAll = () => setTpSelected(new Set(tpResults.map(r => r.id)));
  const tpClearAll = () => setTpSelected(new Set());

  const handleTpSaveSelected = async () => {
    if (!activeUsername) {
      toast.error("Select a brand/workspace first.");
      return;
    }
    const selected = tpResults.filter(r => tpSelected.has(r.id));
    if (selected.length === 0) {
      toast.info("Select at least one review to import.");
      return;
    }
    const payload = selected.map((r) => ({
      source: "trustpilot",
      asin: "",
      country: "",
      review_id: r.id,
      review_title: r.title || "",
      review_comment: r.text || "",
      review_star_rating: Number(r.stars || 0),
      review_link: r.url || "",
      review_author: r.author || "Anonymous",
      review_author_url: "",
      review_author_avatar: "",
      review_date: r.date || "",
      is_verified_purchase: Boolean(r.isVerified),
      helpful_vote_statement: "",
      images: [],
      product_title: "",
      user_name: activeUsername
    }));

    try {
      if (payload.length === 1) await Testimonial.create(payload[0]);
      else await Testimonial.bulkCreate(payload);
      toast.success(`Imported ${payload.length} Trustpilot review${payload.length > 1 ? "s" : ""}`);
      // Collapse and reset after save
      setTpExpanded(false);
      setTpResults([]);
      setTpSelected(new Set());
      setTpDomain("");
      // Refresh list
      load();
    } catch (e) {
      console.error("Trustpilot import failed:", e);
      toast.error("Failed to import reviews.");
    }
  };

  const handleManualCreate = async (formData) => {
    if (!activeUsername) {
      toast.error("Select a brand/workspace first.");
      return;
    }
    const payload = {
      ...formData,
      source: formData.source || "manual",
      images: Array.isArray(formData.images) ? formData.images : [],
      user_name: activeUsername
    };
    try {
      await Testimonial.create(payload);
      toast.success("Testimonial added.");
      setManualExpanded(false);
      load();
    } catch (error) {
      console.error("Failed to add testimonial:", error);
      toast.error("Failed to add testimonial.");
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await User.me();
      setCurrentUser(me);

      const [allTestimonials, allActiveUsernames] = await Promise.all([
        Testimonial.list("-updated_date", 200),
        Username.list("-created_date").then(usernames =>
          (usernames || []).filter(u => u.is_active !== false).map(u => u.user_name)
        )
      ]);

      let visibleTestimonials = [];
      let visibleUsernames = [];

      if (me && (me.role === "admin" || me.is_superadmin)) {
        // Admins and superadmins see everything
        visibleTestimonials = allTestimonials || [];
        visibleUsernames = ["all", ...allActiveUsernames];
      } else {
        // Regular users only see testimonials for their assigned usernames
        const assigned = new Set(me?.assigned_usernames || []);
        visibleTestimonials = (allTestimonials || []).filter(t => assigned.has(t.user_name));
        visibleUsernames = ["all", ...Array.from(assigned).filter(name => allActiveUsernames.includes(name))];
      }

      setRows(visibleTestimonials);
      setUsernames(visibleUsernames);

    } catch (error) {
      console.error("Failed to load testimonials or user data:", error);
      toast.error("Failed to load data. Please try again.");
      setCurrentUser(null);
      setRows([]);
      setUsernames(["all"]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let arr = rows || [];
    // Use activeUsernameFilter instead of filters.username
    if (activeUsernameFilter !== "all") {
      arr = arr.filter(t => (t.user_name || "").toLowerCase() === activeUsernameFilter.toLowerCase());
    }
    if (filters.asin.trim()) {
      arr = arr.filter(t => (t.asin || "").toLowerCase().includes(filters.asin.trim().toLowerCase()));
    }
    if (filters.q.trim()) {
      const s = filters.q.trim().toLowerCase();
      arr = arr.filter(t =>
        (t.review_title || "").toLowerCase().includes(s) ||
        (t.review_comment || "").toLowerCase().includes(s) ||
        (t.review_author || "").toLowerCase().includes(s)
      );
    }
    return arr;
  }, [rows, filters, activeUsernameFilter]);


  const handleDeleteClick = (testimonial) => {
    setTestimonialToDelete(testimonial);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!testimonialToDelete) return;

    setDeleting(true);
    try {
      await Testimonial.delete(testimonialToDelete.id);
      toast.success("Testimonial deleted successfully");

      // Remove from local state
      setRows(prevRows => prevRows.filter(row => row.id !== testimonialToDelete.id));
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setTestimonialToDelete(null);
    }
  };

  const pageIsLoading = loading || (useWorkspaceScoping && isWorkspaceLoading);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Testimonials Library</h1>
          <div className="flex items-center gap-2">
            {/* NEW: Trustpilot toggle */}
            <Button
              onClick={toggleTp}
              variant="outline"
              className={`bg-white border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2 ${tpExpanded ? "bg-slate-100" : ""}`}
            >
              <Globe className="w-4 h-4" />
              Trustpilot
              <ChevronDown className={`w-4 h-4 transition-transform ${tpExpanded ? "rotate-180" : ""}`} />
            </Button>
            {/* NEW: Manual create toggle */}
            <Button
              onClick={toggleManual}
              variant="outline"
              className={`bg-white border-slate-300 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2 ${manualExpanded ? "bg-slate-100" : ""}`}
            >
              <Plus className="w-4 h-4" />
              Add Testimonial
              <ChevronDown className={`w-4 h-4 transition-transform ${manualExpanded ? "rotate-180" : ""}`} />
            </Button>
            {/* Existing Amazon import link - unchanged */}
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to={createPageUrl("AmazonTestimonials")}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Import from Amazon
              </Link>
            </Button>
          </div>
        </div>

        {/* NEW: Inline Trustpilot section */}
        <AnimatePresence>
          {tpExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Label className="text-slate-700">Company Domain</Label>
                    <Input
                      placeholder="e.g., gossby.com"
                      value={tpDomain}
                      onChange={(e) => setTpDomain(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700">Page</Label>
                    <Input
                      type="number"
                      min={1}
                      value={tpPage}
                      onChange={(e) => setTpPage(Math.max(1, Number(e.target.value) || 1))}
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700">Sort</Label>
                    <Select value={tpSort} onValueChange={setTpSort}>
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="most_relevant">Most relevant</SelectItem>
                        <SelectItem value="recency">Recency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700">Date Posted</Label>
                    <Select value={tpDate} onValueChange={setTpDate}>
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="last_12_months">Last 12 months</SelectItem>
                        <SelectItem value="last_6_months">Last 6 months</SelectItem>
                        <SelectItem value="last_3_months">Last 3 months</SelectItem>
                        <SelectItem value="last_30_days">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700">Locale</Label>
                    <Select value={tpLocale} onValueChange={setTpLocale}>
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="en-US">en-US</SelectItem>
                        <SelectItem value="en-GB">en-GB</SelectItem>
                        <SelectItem value="de-DE">de-DE</SelectItem>
                        <SelectItem value="fr-FR">fr-FR</SelectItem>
                        <SelectItem value="es-ES">es-ES</SelectItem>
                        <SelectItem value="it-IT">it-IT</SelectItem>
                        <SelectItem value="nl-NL">nl-NL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={handleTpFetch}
                    disabled={tpLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {tpLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching</> : <>Fetch Reviews</>}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setTpExpanded(false); }}
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </Button>
                  {tpResults.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        onClick={tpSelectAll}
                        className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        onClick={tpClearAll}
                        className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={handleTpSaveSelected}
                        disabled={tpSelected.size === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Import Selected ({tpSelected.size})
                      </Button>
                    </>
                  )}
                </div>

                {tpResults.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tpResults.map((r) => (
                      <div
                        key={r.id}
                        className={`p-4 rounded-xl border transition-colors bg-white ${tpSelected.has(r.id) ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={tpSelected.has(r.id)} onCheckedChange={() => tpToggleSelect(r.id)} />
                            <div className="flex items-center gap-1 text-amber-500">
                              {makeStars(r.stars)}
                            </div>
                          </div>
                          {r.url && (
                            <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm inline-flex items-center gap-1 hover:text-blue-700">
                              <ExternalLink className="w-4 h-4" /> Open
                            </a>
                          )}
                        </div>
                        {r.title && <div className="mt-2 font-semibold text-slate-900">{r.title}</div>}
                        <p className="mt-2 text-slate-700 text-sm leading-relaxed line-clamp-6">{r.text}</p>
                        <div className="mt-3 text-xs text-slate-600">
                          — {r.author}{r.date ? ` • ${new Date(r.date).toLocaleDateString()}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NEW: Inline Manual Add section */}
        <AnimatePresence>
          {manualExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-900 font-medium">Add New Testimonial</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setManualExpanded(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <TestimonialForm
                  testimonial={{}}
                  onSubmit={handleManualCreate}
                  onCancel={() => setManualExpanded(false)}
                  submitText="Add Testimonial"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Browse & Manage card */}
        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Browse & Manage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Brand dropdown - conditionally rendered */}
              {!useWorkspaceScoping && (
                <div>
                  <Label className="text-slate-700">Brand</Label>
                  <Select value={filters.username} onValueChange={(v) => setFilters(f => ({ ...f, username: v }))}>
                    <SelectTrigger className="h-9 bg-white border-slate-300 text-slate-900 text-sm">
                      <SelectValue placeholder="All brands" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      {usernames.map(u => <SelectItem key={u} value={u}>{u === "all" ? "All brands" : u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-slate-700">ASIN</Label>
                <Input
                  value={filters.asin}
                  onChange={(e) => setFilters(f => ({ ...f, asin: e.target.value }))}
                  placeholder="e.g., B07ZPKN6YR"
                  className="h-9 bg-white border-slate-300 text-slate-900 text-sm"
                />
              </div>
              <div className={useWorkspaceScoping ? "md:col-span-3" : "md:col-span-2"}>
                <Label className="text-slate-700">Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-9 pl-8 bg-white border-slate-300 text-slate-900 text-sm"
                    placeholder="Title, comment, or author…"
                    value={filters.q}
                    onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageIsLoading ? (
                <div className="col-span-full flex items-center justify-center py-10 text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="col-span-full text-center text-slate-600 py-10">
                  No testimonials found.
                </div>
              ) : (
                filtered.map((t) => {
                  return (
                    <Card key={t.id} className="bg-white border border-slate-200 overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-amber-500">{makeStars(t.review_star_rating)}</div>
                            <CardTitle className="text-slate-900 mt-1 text-base">{t.review_title || "Untitled review"}</CardTitle>
                            <div className="text-xs text-slate-500 mt-1">
                              — {t.review_author || "Anonymous"}{t.review_date ? ` • ${t.review_date}` : ""} {t.is_verified_purchase ? " • Verified Purchase" : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {t.review_link && (
                              <a href={t.review_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 inline-flex items-center gap-1 p-1 hover:bg-blue-50 rounded">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteClick(t)}
                              className="text-xs text-red-600 inline-flex items-center gap-1 p-1 hover:bg-red-50 rounded transition-colors"
                              title="Delete testimonial"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-slate-700">{t.review_comment}</p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="bg-white border border-slate-200 text-slate-900">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-900">Delete Testimonial</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600">
                Are you sure you want to delete this testimonial? This action cannot be undone.
                {testimonialToDelete && (
                  <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                    <strong>"{testimonialToDelete.review_title || "Untitled review"}"</strong>
                    <br />
                    by {testimonialToDelete.review_author || "Anonymous"}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleting}
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
