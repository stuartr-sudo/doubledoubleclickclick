
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Testimonial } from "@/api/entities";
import { CustomContentTemplate } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { ExternalLink, Star, CheckCircle2, Loader2, Eye, Save, Search } from "lucide-react";
import { toast } from "sonner";

function makeStars(n) {
  const x = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
  return new Array(5).fill(0).map((_, i) => (
    <Star key={i} className={`inline w-4 h-4 ${i < x ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
  ));
}

function sanitizeTemplate(html) {
  if (!html) return "";
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

function applyTemplateToTestimonial(tpl, t) {
  if (!tpl) return null;
  const safe = sanitizeTemplate(tpl.html_structure || "");
  const starsText = (() => {
    const count = Math.max(0, Math.min(5, Math.round(Number(t.review_star_rating) || 0)));
    return new Array(count).fill("★").join("") + new Array(5 - count).fill("☆").join("");
  })();
  const firstImage = (Array.isArray(t.images) && t.images[0]) || "";

  const replacements = {
    "{{TITLE}}": t.review_title || "",
    "{{HEADING}}": t.review_title || "",
    "{{CONTENT}}": t.review_comment || "",
    "{{TEXT}}": t.review_comment || "",
    "{{RATING}}": String(t.review_star_rating || ""),
    "{{RATING_STARS}}": starsText,
    "{{AUTHOR}}": t.review_author || "",
    "{{DATE}}": t.review_date || "",
    "{{VERIFIED}}": t.is_verified_purchase ? "Verified Purchase" : "",
    "{{ASIN}}": t.asin || "",
    "{{COUNTRY}}": t.country || "",
    "{{IMAGE_URL}}": firstImage
  };

  let out = safe;
  Object.entries(replacements).forEach(([k, v]) => {
    out = out.replace(new RegExp(k, "g"), v);
  });
  out = out.replace(/\{\{IMAGE\}\}/g, firstImage ? `<img src="${firstImage}" alt="review image" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:8px;" />` : "");
  return out;
}

export default function TestimonialLibrary() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [rows, setRows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [usernames, setUsernames] = useState(["all"]);
  const [filters, setFilters] = useState({ username: "all", asin: "", q: "" });
  const [previewMap, setPreviewMap] = useState({}); // id -> boolean

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await User.me().catch(() => null);
      const allUsernames = await Username.list("-created_date").catch(() => []);
      const active = (allUsernames || []).filter(u => u.is_active !== false).map(u => u.user_name);
      let allowed = active;
      if (!(me && (me.role === "admin" || me.access_level === "full"))) {
        const assigned = Array.isArray(me?.assigned_usernames) ? me.assigned_usernames : [];
        const set = new Set(active);
        allowed = assigned.filter(n => set.has(n));
      }
      setUsernames(["all", ...Array.from(new Set(allowed)).sort()]);

      const ts = await Testimonial.list("-updated_date", 200);
      setRows(ts || []);

      const tpls = await CustomContentTemplate.filter({ associated_ai_feature: "testimonial", is_active: true }, "name", 200);
      setTemplates(tpls || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let arr = rows || [];
    if (filters.username !== "all") {
      arr = arr.filter(t => (t.user_name || "").toLowerCase() === filters.username.toLowerCase());
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
  }, [rows, filters]);

  const setTemplateForRow = async (row, templateId) => {
    setSavingId(row.id);
    await Testimonial.update(row.id, { custom_template_id: templateId || null });
    toast.success("Template assigned");
    const updated = rows.map(r => r.id === row.id ? { ...r, custom_template_id: templateId || null } : r);
    setRows(updated);
    setSavingId(null);
  };

  const togglePreview = (row) => {
    setPreviewMap(prev => ({ ...prev, [row.id]: !prev[row.id] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Testimonials Library</h1>
        </div>

        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">Browse & Manage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-slate-700">Brand</Label>
                <Select value={filters.username} onValueChange={(v) => setFilters(f => ({ ...f, username: v }))}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {usernames.map(u => <SelectItem key={u} value={u}>{u === "all" ? "All brands" : u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">ASIN</Label>
                <Input
                  value={filters.asin}
                  onChange={(e) => setFilters(f => ({ ...f, asin: e.target.value }))}
                  placeholder="e.g., B07ZPKN6YR"
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-700">Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-8 bg-white border-slate-300 text-slate-900"
                    placeholder="Title, comment, or author…"
                    value={filters.q}
                    onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-10 text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="col-span-full text-center text-slate-600 py-10">
                  No testimonials found.
                </div>
              ) : (
                filtered.map((t) => {
                  const assignedTpl = (t.custom_template_id && templates.find(tp => tp.id === t.custom_template_id)) || null;
                  const previewHtml = assignedTpl ? applyTemplateToTestimonial(assignedTpl, t) : null;

                  return (
                    <Card key={t.id} className="bg-white border border-slate-200 overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-amber-500">{makeStars(t.review_star_rating)}</div>
                            <CardTitle className="text-slate-900 mt-1 text-base">{t.review_title || "Untitled review"}</CardTitle>
                            <div className="text-xs text-slate-500 mt-1">
                              — {t.review_author || "Anonymous"}{t.review_date ? ` • ${t.review_date}` : ""}{t.is_verified_purchase ? " • Verified Purchase" : ""}
                            </div>
                          </div>
                          {t.review_link && (
                            <a href={t.review_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 inline-flex items-center gap-1">
                              <ExternalLink className="w-3.5 h-3.5" /> Open
                            </a>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-slate-700">{t.review_comment}</p>

                        {/* EDIT: compact Template row */}
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex flex-col">
                            <Label className="text-slate-700 mb-1">Template</Label>
                            <Select
                              value={t.custom_template_id || "__none__"}
                              onValueChange={(val) => setTemplateForRow(t, val === "__none__" ? null : val)}
                            >
                              <SelectTrigger className="h-9 w-48 bg-white border-slate-300 text-slate-900 text-sm">
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 text-slate-900 w-56">
                                <SelectItem value="__none__">None</SelectItem>
                                {templates.map(tp => (
                                  <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="ml-auto flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePreview(t)}
                              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="w-4 h-4 mr-1" /> Preview
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setTemplateForRow(t, t.custom_template_id || null)}
                              disabled={savingId === t.id}
                            >
                              {savingId === t.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                              Save
                            </Button>
                          </div>
                        </div>

                        {previewMap[t.id] && assignedTpl && previewHtml && (
                          <div className="mt-2 border rounded-md p-3 bg-slate-50">
                            <div className="text-xs text-slate-500 mb-1">Preview</div>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
