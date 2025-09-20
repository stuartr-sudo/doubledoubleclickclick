
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Testimonial } from "@/api/entities";
import { CustomContentTemplate } from "@/api/entities";
import { Username } from "@/api/entities";
import { ExternalLink, Search as SearchIcon, Star, X } from "lucide-react";

export default function TestimonialLibraryModal({
  isOpen,
  onClose,
  onInsert
}) {
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("all");
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");

  // Load data when opened
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      // Load testimonials (scoped to selected username later in filtering)
      const ts = await Testimonial.list("-updated_date", 100);
      setTestimonials(ts || []);
      // Load usernames for filter (optional UX)
      const uns = await Username.list("user_name", 200);
      setUsernames(uns || []);
      // Load testimonial templates
      const tpls = await CustomContentTemplate.filter(
        { associated_ai_feature: "testimonial", is_active: true },
        "name",
        100
      );
      setTemplates(tpls || []);
      setLoading(false);
    })();
  }, [isOpen]);

  const selectedTemplate = useMemo(
    () => (selectedTemplateId === "none" ? null : templates.find(t => t.id === selectedTemplateId) || null),
    [selectedTemplateId, templates]
  );

  const filteredTestimonials = useMemo(() => {
    let rows = testimonials || [];
    if (selectedUsername !== "all") {
      rows = rows.filter(t => (t.user_name || "").toLowerCase() === selectedUsername.toLowerCase());
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((t) =>
        (t.review_title || "").toLowerCase().includes(q) ||
        (t.review_comment || "").toLowerCase().includes(q) ||
        (t.review_author || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [testimonials, selectedUsername, query]);

  // Helpers
  const makeStarHtml = (n) => {
    const count = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    return new Array(count).fill("★").join("") + new Array(5 - count).fill("☆").join("");
  };

  const sanitizeTemplate = (html) => {
    if (!html) return "";
    return String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "");
  };

  const defaultCard = (t) => {
    const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const stars = makeStarHtml(t.review_star_rating);
    const img = (Array.isArray(t.images) && t.images[0]) ? `<img src="${t.images[0]}" alt="review image" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:8px;" />` : "";
    return `
<div class="b44-testimonial" data-b44-id="${elId}" data-b44-type="testimonial" style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#fff;margin:12px 0;">
  <div style="color:#f59e0b;font-size:18px;letter-spacing:1px;margin-bottom:6px;">${stars}</div>
  <h4 style="margin:0 0 6px 0;font-weight:700;color:#0b1220;">${t.review_title || "Untitled review"}</h4>
  ${img}
  <p style="margin:0 0 10px 0;color:#334155;line-height:1.6;">${t.review_comment || ""}</p>
  <div style="font-size:12px;color:#475569;">
    — ${t.review_author || "Anonymous"}
    ${t.review_date ? ` • ${t.review_date}` : ""}
    ${t.is_verified_purchase ? " • Verified Purchase" : ""}
  </div>
</div>`.trim();
  };

  const applyTemplate = (tpl, t) => {
    if (!tpl) return defaultCard(t);
    const safe = sanitizeTemplate(tpl.html_structure || "");
    const stars = makeStarHtml(t.review_star_rating);
    const firstImage = (Array.isArray(t.images) && t.images[0]) || "";
    // Common placeholders
    const replacements = {
      "{{TITLE}}": t.review_title || "",
      "{{HEADING}}": t.review_title || "",
      "{{CONTENT}}": t.review_comment || "",
      "{{TEXT}}": t.review_comment || "",
      "{{RATING}}": String(t.review_star_rating || ""),
      "{{RATING_STARS}}": stars,
      "{{AUTHOR}}": t.review_author || "",
      "{{DATE}}": t.review_date || "",
      "{{VERIFIED}}": t.is_verified_purchase ? "Verified Purchase" : "",
      "{{ASIN}}": t.asin || "",
      "{{COUNTRY}}": t.country || "",
      "{{IMAGE_URL}}": firstImage,
    };
    let out = safe;
    Object.entries(replacements).forEach(([k, v]) => {
      out = out.replace(new RegExp(k, "g"), v);
    });
    // If template expects {{IMAGE}} block, synthesize one
    out = out.replace(/\{\{IMAGE\}\}/g, firstImage ? `<img src="${firstImage}" alt="review image" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:8px;" />` : "");
    // Provide a wrapper + marker if not included
    if (!/data-b44-id=/.test(out)) {
      const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      out = `<div class="b44-testimonial" data-b44-id="${elId}" data-b44-type="testimonial">${out}</div>`;
    }
    return out;
  };

  const handleInsert = (t) => {
    const html = applyTemplate(selectedTemplate, t);
    onInsert(html);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* UPDATED: responsive width + scrollable height */}
      <DialogContent className="max-w-5xl w-[95vw] md:w-full max-h-[85vh] overflow-y-auto bg-white border border-slate-200 text-slate-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-slate-900 text-white text-xs">””</span>
            Testimonials
          </DialogTitle>
        </DialogHeader>

        {/* Slight right padding so scrollbar doesn't cover content */}
        <div className="space-y-4 py-2 pr-1">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, comment, or author..."
                className="pl-9 bg-white border-slate-300 text-slate-900"
              />
            </div>

            <div className="w-full md:w-56">
              <Label className="text-slate-700 text-xs mb-1 block">Brand</Label>
              <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-900">
                  <SelectItem value="all">All brands</SelectItem>
                  {usernames.map((u) => (
                    <SelectItem key={u.id} value={u.user_name}>{u.user_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-64">
              <Label className="text-slate-700 text-xs mb-1 block">Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="Default (no template)" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 text-slate-900">
                  <SelectItem value="none">Default style (no template)</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading && (
              <div className="col-span-full text-center text-slate-600 py-8">Loading testimonials…</div>
            )}

            {!loading && filteredTestimonials.length === 0 && (
              <div className="col-span-full text-center text-slate-600 py-8">No testimonials found.</div>
            )}

            {!loading && filteredTestimonials.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-amber-500 text-lg tracking-wide" title={`${t.review_star_rating || 0} stars`}>
                    {new Array(Math.max(0, Math.min(5, Math.round(Number(t.review_star_rating) || 0)))).fill(0).map((_, i) => (
                      <Star key={i} className="inline w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {t.review_link && (
                    <a href={t.review_link} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 text-xs">
                      <ExternalLink className="w-4 h-4" /> Open
                    </a>
                  )}
                </div>
                <h4 className="mt-2 font-semibold text-slate-900">{t.review_title || "Untitled review"}</h4>
                <p className="mt-1 text-slate-700 text-sm line-clamp-4">{t.review_comment || ""}</p>
                <div className="mt-3 text-xs text-slate-600">
                  — {t.review_author || "Anonymous"}
                  {t.review_date ? ` • ${t.review_date}` : ""}
                  {t.is_verified_purchase ? " • Verified Purchase" : ""}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white" size="sm" onClick={() => handleInsert(t)}>
                    Insert
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
