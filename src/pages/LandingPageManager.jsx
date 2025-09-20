
import React, { useEffect, useState } from "react";
import { LandingPageContent } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Eye, Plus, Minus, Search, Wand2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { AppProduct } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import AIRewriterModal from "@/components/editor/AIRewriterModal";

export default function LandingPageManager() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Local form state
  const [form, setForm] = useState({
    headline: "",
    subheadline: "",
    section1_title: "",
    section1_content: "",
    section2_title: "",
    section2_col1_title: "",
    section2_col1_points: [],
    section2_col2_title: "",
    section2_col2_points: [],
    final_cta_title: ""
  });

  // New state variables for product picker
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");

  // AI rewrite modal state
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteTarget, setRewriteTarget] = useState({ key: "", listKey: "", index: -1, initial: "" });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await User.me();
        const allowed = !!(u && (u.role === 'admin' || u.access_level === 'full'));
        setIsAuthorized(allowed);
      } catch {
        setIsAuthorized(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authChecked || !isAuthorized) return;
    const load = async () => {
      setLoading(true);
      // Try to load "main_sewo_v1", fallback to "main_v1", otherwise create a starter record for you
      let found = await LandingPageContent.filter({ identifier: "main_sewo_v1" });
      if (!found || found.length === 0) {
        found = await LandingPageContent.filter({ identifier: "main_v1" });
      }
      if (found && found.length > 0) {
        const r = found[0];
        setRecord(r);
        setForm({
          headline: r.headline || "",
          subheadline: r.subheadline || "",
          section1_title: r.section1_title || "",
          section1_content: r.section1_content || "",
          section2_title: r.section2_title || "",
          section2_col1_title: r.section2_col1_title || "",
          section2_col1_points: Array.isArray(r.section2_col1_points) ? r.section2_col1_points : [],
          section2_col2_title: r.section2_col2_title || "",
          section2_col2_points: Array.isArray(r.section2_col2_points) ? r.section2_col2_points : [],
          final_cta_title: r.final_cta_title || ""
        });
        setSelectedProductIds(Array.isArray(r.featured_app_product_ids) ? r.featured_app_product_ids : []);
      } else {
        // Create a starter record that Home already knows to read
        const starter = await LandingPageContent.create({
          identifier: "main_sewo_v1",
          headline: "Your headline here",
          subheadline: "A short description for the hero section",
          section1_title: "Why SEWO now",
          section1_content: "Write your Section 1 content here.",
          section2_title: "What you get",
          section2_col1_title: "Benefits",
          section2_col1_points: ["Fast setup", "LLM-ready content", "Easy editing"],
          section2_col2_title: "Features",
          section2_col2_points: ["Editor", "Assets", "Topics"],
          final_cta_title: "Request Early Access",
          featured_app_product_ids: []
        });
        setRecord(starter);
        setForm({
          headline: starter.headline || "",
          subheadline: starter.subheadline || "",
          section1_title: starter.section1_title || "",
          section1_content: starter.section1_content || "",
          section2_title: starter.section2_title || "",
          section2_col1_title: starter.section2_col1_title || "",
          section2_col1_points: starter.section2_col1_points || [],
          section2_col2_title: starter.section2_col2_title || "",
          section2_col2_points: starter.section2_col2_points || [],
          final_cta_title: starter.final_cta_title || ""
        });
        setSelectedProductIds([]);
      }

      // Load all active AppProducts for picker
      const products = await AppProduct.list("-sort_order").catch(() => []);
      setAllProducts(products.filter(p => p.is_active !== false));
      setLoading(false);
    };
    load();
  }, [authChecked, isAuthorized]);

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const updateListItem = (listKey, index, value) => {
    setForm(prev => {
      const next = [...(prev[listKey] || [])];
      next[index] = value;
      return { ...prev, [listKey]: next };
    });
  };

  const addListItem = (listKey) => {
    setForm(prev => ({ ...prev, [listKey]: [ ...(prev[listKey] || []), "" ] }));
  };

  const removeListItem = (listKey, index) => {
    setForm(prev => {
      const next = [...(prev[listKey] || [])];
      next.splice(index, 1);
      return { ...prev, [listKey]: next };
    });
  };

  const openRewrite = (key, initial, listKey = "", index = -1) => {
    setRewriteTarget({ key: key || "", listKey: listKey || "", index: typeof index === "number" ? index : -1, initial: initial || "" });
    setRewriteOpen(true);
  };

  const applyRewrite = (text) => {
    if (rewriteTarget.listKey && rewriteTarget.index > -1) {
      updateListItem(rewriteTarget.listKey, rewriteTarget.index, text);
    } else if (rewriteTarget.key) {
      updateField(rewriteTarget.key, text);
    }
    setRewriteOpen(false);
  };

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    await LandingPageContent.update(record.id, {
      ...record,
      ...form,
      identifier: "main_sewo_v1",
      featured_app_product_ids: selectedProductIds
    });
    setSaving(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto text-white/80">Checking permissions…</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-white/70">You do not have permission to view or edit the landing page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto text-white/80">Loading editor…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Landing Page Editor</h1>
          <div className="flex gap-2">
            <a href={createPageUrl("Home")} target="_blank" rel="noreferrer">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Eye className="w-4 h-4 mr-2" /> Preview Home
              </Button>
            </a>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Section title="Hero">
            <Field label="Headline">
              <div className="flex gap-2">
                <Input value={form.headline} onChange={(e)=>updateField("headline", e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  title="AI rewrite"
                  onClick={() => openRewrite("headline", form.headline)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </Field>
            <Field label="Subheadline">
              <div className="flex gap-2">
                <Textarea value={form.subheadline} onChange={(e)=>updateField("subheadline", e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 self-start"
                  title="AI rewrite"
                  onClick={() => openRewrite("subheadline", form.subheadline)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </Field>
          </Section>

          <Section title="Section 1">
            <Field label="Title">
              <div className="flex gap-2">
                <Input value={form.section1_title} onChange={(e)=>updateField("section1_title", e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  title="AI rewrite"
                  onClick={() => openRewrite("section1_title", form.section1_title)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </Field>
            <Field label="Content (multi-paragraph supported)">
              <div className="flex gap-2">
                <Textarea rows={6} value={form.section1_content} onChange={(e)=>updateField("section1_content", e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 self-start"
                  title="AI rewrite"
                  onClick={() => openRewrite("section1_content", form.section1_content)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </Field>
          </Section>

          <Section title="Section 2">
            <Field label="Title">
              <div className="flex gap-2">
                <Input value={form.section2_title} onChange={(e)=>updateField("section2_title", e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  title="AI rewrite"
                  onClick={() => openRewrite("section2_title", form.section2_title)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </Field>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Field label="Column 1 Title">
                  <div className="flex gap-2">
                    <Input value={form.section2_col1_title} onChange={(e)=>updateField("section2_col1_title", e.target.value)} />
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      title="AI rewrite"
                      onClick={() => openRewrite("section2_col1_title", form.section2_col1_title)}
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Field>
                <Label className="text-white/80">Column 1 Points</Label>
                <div className="space-y-2 mt-2">
                  {(form.section2_col1_points || []).map((item, idx) => (
                    <div key={`c1-${idx}`} className="flex gap-2">
                      <Input value={item} onChange={(e)=>updateListItem("section2_col1_points", idx, e.target.value)} />
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        title="AI rewrite"
                        onClick={() => openRewrite("", item, "section2_col1_points", idx)}
                      >
                        <Wand2 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="outline" onClick={()=>removeListItem("section2_col1_points", idx)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={()=>addListItem("section2_col1_points")} className="mt-1">
                    <Plus className="w-4 h-4 mr-2" /> Add point
                  </Button>
                </div>
              </div>

              <div>
                <Field label="Column 2 Title">
                  <div className="flex gap-2">
                    <Input value={form.section2_col2_title} onChange={(e)=>updateField("section2_col2_title", e.target.value)} />
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      title="AI rewrite"
                      onClick={() => openRewrite("section2_col2_title", form.section2_col2_title)}
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Field>
                <Label className="text-white/80">Column 2 Points</Label>
                <div className="space-y-2 mt-2">
                  {(form.section2_col2_points || []).map((item, idx) => (
                    <div key={`c2-${idx}`} className="flex gap-2">
                      <Input value={item} onChange={(e)=>updateListItem("section2_col2_points", idx, e.target.value)} />
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        title="AI rewrite"
                        onClick={() => openRewrite("", item, "section2_col2_points", idx)}
                      >
                        <Wand2 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="outline" onClick={()=>removeListItem("section2_col2_points", idx)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={()=>addListItem("section2_col2_points")} className="mt-1">
                    <Plus className="w-4 h-4 mr-2" /> Add point
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Homepage Products">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedProductIds.length === 0 && (
                  <p className="text-white/70">No products selected. Click “Choose Products”.</p>
                )}
                {selectedProductIds.map(id => {
                  const p = allProducts.find(ap => ap.id === id);
                  return (
                    <Badge key={id} className="bg-white/10 border-white/20">
                      {p?.name || "Unknown"}
                      <button
                        onClick={() =>
                          setSelectedProductIds(prev => prev.filter(pid => pid !== id))
                        }
                        className="ml-2 text-white/70 hover:text-white"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <div>
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => setPickerOpen(true)}
                >
                  Choose Products
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Final CTA">
            <Field label="Title">
              <div className="flex gap-2">
                <Input value={form.final_cta_title} onChange={(e)=>updateField("final_cta_title", e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  title="AI rewrite"
                  onClick={() => openRewrite("final_cta_title", form.final_cta_title)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>
            </Field>
          </Section>
        </div>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Select App Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search products..."
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
              {allProducts
                .filter(p => {
                  const q = productQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (p.name || "").toLowerCase().includes(q) ||
                    (p.description || "").toLowerCase().includes(q)
                  );
                })
                .map(p => {
                  const checked = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setSelectedProductIds(prev => {
                            if (v) return [...new Set([...prev, p.id])];
                            return prev.filter(id => id !== p.id);
                          });
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-white/60">
                          {p.display_price}
                          {p.category ? ` • ${p.category}` : ""}
                        </div>
                      </div>
                    </label>
                  );
                })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="bg-white/10 border-white/20" onClick={() => setPickerOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIRewriterModal
        isOpen={rewriteOpen}
        onClose={() => setRewriteOpen(false)}
        selectedText={rewriteTarget.initial}
        onRewrite={applyRewrite}
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-white/80">{label}</Label>
      {children}
    </div>
  );
}
