
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Filter, RefreshCw, Copy, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { amazonReviews } from "@/api/functions";
import { Testimonial } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

function extractAsinFromUrl(url) {
  if (!url) return null;
  const m = String(url).match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}

function stars(n) {
  const x = Math.round(Number(n) || 0);
  return Array.from({ length: 5 }).map((_, i) =>
  <Star key={i} className={`w-4 h-4 ${i < x ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
  );
}

function reviewToHtml(r) {
  const esc = (s) => (s || "").toString().replace(/"/g, "&quot;");
  const title = esc(r.review_title || "");
  const author = esc(r.review_author || "");
  const date = esc(r.review_date || "");
  const comment = (r.review_comment || "").toString().replace(/\n/g, "<br/>");
  const rating = Number(r.review_star_rating || 0);

  return `
<blockquote class="b44-testimonial" style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:12px 0;background:#ffffff;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <div>${"★".repeat(Math.round(rating))}${"☆".repeat(5 - Math.round(rating))}</div>
    <strong style="font-size:14px;">${title}</strong>
  </div>
  <p style="color:#374151;line-height:1.6;margin:8px 0;">${comment}</p>
  <div style="display:flex;align-items:center;gap:8px;color:#6b7280;font-size:12px;margin-top:8px;">
    ${r.is_verified_purchase ? '<span style="color:#059669;">Verified Purchase</span>' : ""}
    <span>— ${author}${date ? ` • ${date}` : ""}</span>
  </div>
</blockquote>`.trim();
}

export default function AmazonTestimonials() {
  const [input, setInput] = useState("");
  const [asin, setAsin] = useState("");
  const [country, setCountry] = useState("US");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("TOP_REVIEWS");
  const [starRating, setStarRating] = useState("ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [mediaOnly, setMediaOnly] = useState(false);
  const [currentFormatOnly, setCurrentFormatOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  // FIX: selectedIds must be a React state holding a Set
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [usernames, setUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        const all = await Username.list("-created_date").catch(() => []);
        const active = (all || []).filter((u) => u.is_active !== false).map((u) => u.user_name);
        const isSuper = me && (me.role === "admin" || me.access_level === "full") ? true : false;
        let names = [];
        if (isSuper) {
          names = active;
        } else {
          const assigned = me && Array.isArray(me.assigned_usernames) ? me.assigned_usernames : [];
          const set = new Set(active);
          names = assigned.filter((n) => set.has(n));
        }
        names = Array.from(new Set(names)).sort();
        setUsernames(names);
        setSelectedUsername(names[0] || "");
      } catch {
        setUsernames([]);
        setSelectedUsername("");
      }
    })();
  }, []);

  const reviews = useMemo(() => data && data.reviews || [], [data]);

  const handleFetch = async () => {
    setError("");
    const val = input.trim();
    const as = /^[A-Z0-9]{10}$/i.test(val) ? val.toUpperCase() : extractAsinFromUrl(val) || "";
    if (!as) {
      setError("Please enter a valid ASIN or Amazon product URL.");
      return;
    }
    setAsin(as);
    setLoading(true);
    try {
      const { data: resp } = await amazonReviews({
        asin: as,
        country,
        page,
        sort_by: sortBy,
        star_rating: starRating,
        verified_purchases_only: verifiedOnly,
        images_or_videos_only: mediaOnly,
        current_format_only: currentFormatOnly
      });
      if (!(resp && resp.success)) {
        throw new Error(resp && resp.error || "Failed to fetch reviews.");
      }
      setData(resp && resp.data || {});
      setSelectedIds(new Set());
    } catch (e) {
      const msg = e && e.message ? e.message : "Unexpected error while fetching reviews.";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(reviews.map((r) => r.review_id)));
  };
  const clearAll = () => setSelectedIds(new Set());

  const buildHtml = () => {
    const selected = reviews.filter((r) => selectedIds.has(r.review_id));
    if (selected.length === 0) return "";
    const inner = selected.map(reviewToHtml).join("\n");
    return `<div class="b44-testimonials">${inner}</div>`;
  };

  const handleCopyHtml = async () => {
    const html = buildHtml();
    if (!html) {
      toast.info("Select at least one review.");
      return;
    }
    await navigator.clipboard.writeText(html);
    toast.success("Testimonials HTML copied.");
  };

  const handleOpenInEditor = () => {
    const html = buildHtml();
    if (!html) {
      toast.info("Select at least one review.");
      return;
    }
    localStorage.setItem("htmlstudio_content", html);
    window.location.href = createPageUrl("Editor?importHtml=1");
  };

  const handleSaveToLibrary = async () => {
    if (!selectedUsername) {
      toast.info("Please choose a username to save testimonials.");
      return;
    }
    const selected = reviews.filter((r) => selectedIds.has(r.review_id));
    if (selected.length === 0) {
      toast.info("Select at least one review to save.");
      return;
    }
    const payload = selected.map((r) => ({
      source: "amazon",
      asin: asin,
      country: country,
      review_id: r.review_id,
      review_title: r.review_title || "",
      review_comment: r.review_comment || "",
      review_star_rating: Number(r.review_star_rating || 0),
      review_link: r.review_link || "",
      review_author: r.review_author || "",
      review_author_url: r.review_author_url || "",
      review_author_avatar: r.review_author_avatar || "",
      review_date: r.review_date || "",
      is_verified_purchase: Boolean(r.is_verified_purchase),
      helpful_vote_statement: r.helpful_vote_statement || "",
      images: Array.isArray(r.review_images) ? r.review_images : [],
      user_name: selectedUsername
    }));
    try {
      if (payload.length === 1) await Testimonial.create(payload[0]);else
      await Testimonial.bulkCreate(payload);
      toast.success("Saved to library");
    } catch (e) {
      toast.error(e && e.message ? e.message : "Failed to save testimonials.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white border border-slate-200 shadow-sm text-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <Filter className="w-5 h-5 text-emerald-600" />
              Amazon Testimonials Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <div>
                <Label className="text-slate-700">ASIN or Amazon URL</Label>
                <Input
                  placeholder="e.g. B07ZPKN6YR or https://www.amazon.com/dp/B07ZPKN6YR"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400" />

                <p className="text-xs text-slate-500 mt-1">Paste a full Amazon URL or a 10-character ASIN.</p>
              </div>
              <div className="flex items-end">
                <Button onClick={handleFetch} className="bg-indigo-900 text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-full hover:bg-emerald-700">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching...</> : <><RefreshCw className="w-4 h-4 mr-2" /> Fetch</>}
                </Button>
              </div>
            </div>

            {/* Filters: split into inputs row + checkboxes row for better alignment */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-slate-700">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="bg-white border border-slate-300 text-slate-900">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {["US", "AU", "BR", "CA", "CN", "FR", "DE", "IN", "IT", "MX", "NL", "SG", "ES", "TR", "AE", "GB", "JP", "SA", "PL", "SE", "BE", "EG"].map((c) =>
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white border border-slate-300 text-slate-900">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOP_REVIEWS">Top Reviews</SelectItem>
                    <SelectItem value="MOST_RECENT">Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Star Rating</Label>
                <Select value={starRating} onValueChange={setStarRating}>
                  <SelectTrigger className="bg-white border border-slate-300 text-slate-900">
                    <SelectValue placeholder="Star Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {["ALL", "5_STARS", "4_STARS", "3_STARS", "2_STARS", "1_STARS", "POSITIVE", "CRITICAL"].map((v) =>
                    <SelectItem key={v} value={v}>{v.replace("_", " ")}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Page</Label>
                <Input
                  type="number"
                  min={1}
                  value={page}
                  onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
                  className="bg-white border border-slate-300 text-slate-900" />

              </div>
            </div>

            {/* Checkbox row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <label className="inline-flex items-center gap-2 text-slate-700 whitespace-nowrap">
                <Checkbox checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(Boolean(v))} />
                <span>Verified only</span>
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700 whitespace-nowrap">
                <Checkbox checked={mediaOnly} onCheckedChange={(v) => setMediaOnly(Boolean(v))} />
                <span>Images/Videos only</span>
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700 whitespace-nowrap">
                <Checkbox checked={currentFormatOnly} onCheckedChange={(v) => setCurrentFormatOnly(Boolean(v))} />
                <span>Current format only</span>
              </label>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {reviews.length > 0 &&
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={selectAll} className="bg-background text-slate-200 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-slate-300 hover:bg-slate-50">
                    Select All
                  </Button>
                  <Button variant="outline" onClick={clearAll} className="bg-pink-700 text-slate-200 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-slate-300 hover:bg-slate-50">
                    Clear
                  </Button>
                  <div className="flex-1" />
                  <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                    <SelectTrigger className="bg-white border border-slate-300 text-slate-900 min-w-[200px]">
                      <SelectValue placeholder="Assign to username" />
                    </SelectTrigger>
                    <SelectContent>
                      {usernames.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSaveToLibrary} className="bg-blue-600 hover:bg-blue-700 text-white">Save to Library</Button>
                  <Button variant="outline" onClick={handleCopyHtml} className="bg-fuchsia-900 text-slate-100 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-slate-300 hover:bg-slate-50">
                    <Copy className="w-4 h-4 mr-2" /> Copy HTML
                  </Button>
                  <Button onClick={handleOpenInEditor} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Open in Editor
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((r) =>
                <div
                  key={r.review_id}
                  className={`p-4 rounded-xl border transition-colors ${
                  selectedIds.has(r.review_id) ?
                  "border-emerald-500 bg-emerald-50" :
                  "border-slate-200 bg-slate-50"}`
                  }>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={selectedIds.has(r.review_id)} onCheckedChange={() => toggleSelect(r.review_id)} />
                          <div className="flex items-center gap-1">{stars(r.review_star_rating)}</div>
                        </div>
                        <a href={r.review_link} target="_blank" rel="noreferrer" className="text-blue-600 text-sm inline-flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" /> Open
                        </a>
                      </div>
                      <div className="mt-2 font-semibold text-slate-900">{r.review_title}</div>
                      <p className="mt-2 text-slate-700 text-sm leading-relaxed line-clamp-6">{r.review_comment}</p>
                      <div className="mt-3 text-xs text-slate-600 flex items-center gap-2">
                        {r.is_verified_purchase && <span className="text-emerald-700">Verified Purchase</span>}
                        <span>— {r.review_author}{r.review_date ? ` • ${r.review_date}` : ""}</span>
                        {r.helpful_vote_statement && <span>• {r.helpful_vote_statement}</span>}
                      </div>
                    </div>
                )}
                </div>
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>);

}