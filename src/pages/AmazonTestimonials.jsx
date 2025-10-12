
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Filter, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { amazonReviews } from "@/api/functions";
import { Testimonial } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { toast } from "sonner";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';

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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [workspaceDefaultUsername, setWorkspaceDefaultUsername] = useState("");
  const { consumeTokensForFeature } = useTokenConsumption();

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        const all = await Username.list("-created_date").catch(() => []);
        const active = (all || []).filter((u) => u.is_active !== false).map((u) => u.user_name);
        const isSuper = me && (me.role === "admin" || me.access_level === "full");
        let names = [];
        if (isSuper) {
          names = active;
        } else {
          const assigned = me && Array.isArray(me.assigned_usernames) ? me.assigned_usernames : [];
          const set = new Set(active);
          names = assigned.filter((n) => set.has(n));
        }
        names = Array.from(new Set(names)).sort();
        setWorkspaceDefaultUsername(names[0] || "");
      } catch {
        setWorkspaceDefaultUsername("");
      }
    })();
  }, []);

  const reviews = useMemo(() => (data && data.reviews) || [], [data]);

  const handleFetch = async () => {
    setError(""); // Clear any previous errors
    const val = input.trim();
    const as = /^[A-Z0-9]{10}$/i.test(val) ? val.toUpperCase() : extractAsinFromUrl(val) || "";
    if (!as) {
      setError("Please enter a valid ASIN or Amazon product URL.");
      return;
    }

    // Token consumption check
    const result = await consumeTokensForFeature('amazon_testimonials_import');
    if (!result.success) {
      setError(`Token error: ${result.error || 'Failed to consume tokens'}`);
      return;
    }

    setAsin(as);
    setLoading(true);
    setError(""); // Clear any previous errors after token check and before fetch attempt
    
    try {
      console.log('Fetching Amazon reviews for ASIN:', as);
      
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

      console.log('Amazon API Response:', resp);

      // Check if response indicates success
      if (!resp || resp.success === false) {
        const errorMsg = resp?.error || 'Failed to fetch reviews from Amazon API';
        console.error('Amazon API Error:', errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
        setData(null); // Clear previous data
        setLoading(false); // Ensure loading is reset on early exit
        return;
      }

      // Check if we have data
      const reviewsData = resp.data || {};
      const fetchedReviewsFromApi = Array.isArray(reviewsData.reviews) ? reviewsData.reviews : [];
      
      console.log('Parsed reviews count:', fetchedReviewsFromApi.length);

      if (fetchedReviewsFromApi.length === 0) {
        setError("No reviews found for this product. Try adjusting filters or check if the ASIN is correct.");
        toast.error("No reviews found");
      } else {
        toast.success(`Found ${fetchedReviewsFromApi.length} reviews`);
      }

      setData(reviewsData);
      setSelectedIds(new Set());
      
    } catch (e) {
      console.error('Amazon fetch error:', e);
      const msg = e?.message || "Unexpected error while fetching reviews.";
      setError(msg);
      toast.error(msg);
      setData(null); // Clear previous data
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(reviews.map((r) => r.review_id)));
  const clearAll = () => setSelectedIds(new Set());

  const handleSaveToLibrary = async () => {
    if (!workspaceDefaultUsername) {
      toast.error("Could not determine a default workspace username. Please contact support.");
      return;
    }
    const selected = reviews.filter((r) => selectedIds.has(r.review_id));
    if (selected.length === 0) {
      toast.info("Select at least one review to save.");
      return;
    }
    const payload = selected.map((r) => ({
      source: "amazon",
      asin,
      country,
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
      user_name: workspaceDefaultUsername
    }));
    try {
      if (payload.length === 1) await Testimonial.create(payload[0]);
      else await Testimonial.bulkCreate(payload);
      toast.success("Saved to library");
    } catch (e) {
      toast.error((e && e.message) ? e.message : "Failed to save testimonials.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <Card className="mb-6 bg-white border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
            <Filter className="w-6 h-6 text-blue-600" />
            Amazon Testimonials Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="asin-input" className="text-slate-700">ASIN or Amazon URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="asin-input"
                placeholder="https://www.amazon.com/dp/XXXXXXXXXX or B08XXXXXXXXX"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                disabled={loading}
              />
              <Button onClick={handleFetch} disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2">{loading ? 'Fetching...' : 'Fetch'}</span>
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-1">Paste a full Amazon URL or a 10-character ASIN.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-slate-700">Country</Label>
              <Select value={country} onValueChange={setCountry} disabled={loading}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {["US","AU","BR","CA","CN","FR","DE","IN","IT","MX","NL","SG","ES","TR","AE","GB","JP","SA","PL","SE","BE","EG"].map(c =>
                    <SelectItem key={c} value={c} className="hover:bg-slate-100">{c}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="TOP_REVIEWS" className="hover:bg-slate-100">Top Reviews</SelectItem>
                  <SelectItem value="MOST_RECENT" className="hover:bg-slate-100">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700">Star Rating</Label>
              <Select value={starRating} onValueChange={setStarRating} disabled={loading}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {["ALL","5_STARS","4_STARS","3_STARS","2_STARS","1_STARS","POSITIVE","CRITICAL"].map(v =>
                    <SelectItem key={v} value={v} className="hover:bg-slate-100">{v.replace("_"," ")}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="page" className="text-slate-700">Page</Label>
              <Input
                id="page"
                type="number"
                min="1"
                max="3"
                value={page}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  const clamped = Math.max(1, Math.min(3, val));
                  setPage(clamped);
                }}
                className="w-full bg-white border-slate-300 text-slate-900"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="inline-flex items-center gap-2 text-slate-700 whitespace-nowrap">
              <Checkbox checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(Boolean(v))} disabled={loading} />
              <span>Verified only</span>
            </label>
            <label className="inline-flex items-center gap-2 text-slate-700 whitespace-nowrap">
              <Checkbox checked={mediaOnly} onCheckedChange={(v) => setMediaOnly(Boolean(v))} disabled={loading} />
              <span>Images/Videos only</span>
            </label>
            <label className="inline-flex items-center gap-2 text-slate-700 whitespace-nowrap">
              <Checkbox checked={currentFormatOnly} onCheckedChange={(v) => setCurrentFormatOnly(Boolean(v))} disabled={loading} />
              <span>Current format only</span>
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-slate-600">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Fetching reviews from Amazon...</p>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={selectAll} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                  Select All
                </Button>
                <Button variant="outline" onClick={clearAll} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                  Clear
                </Button>
                <div className="flex-1" />
                <Button onClick={handleSaveToLibrary} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save to Library
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <div
                    key={r.review_id}
                    className={`p-4 rounded-xl border transition-colors bg-white ${selectedIds.has(r.review_id) ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selectedIds.has(r.review_id)} onCheckedChange={() => toggleSelect(r.review_id)} />
                        <div className="flex items-center gap-1">{stars(r.review_star_rating)}</div>
                      </div>
                      <a href={r.review_link} target="_blank" rel="noreferrer" className="text-blue-600 text-sm inline-flex items-center gap-1 hover:text-blue-700">
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                    </div>
                    <div className="mt-2 font-semibold text-slate-900">{r.review_title}</div>
                    <p className="mt-2 text-slate-700 text-sm leading-relaxed line-clamp-6">{r.review_comment}</p>
                    <div className="mt-3 text-xs text-slate-600 flex items-center gap-2">
                      {r.is_verified_purchase && <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Verified Purchase</span>}
                      <span>— {r.review_author}{r.review_date ? ` • ${r.review_date}` : ""}</span>
                      {r.helpful_vote_statement && <span>• {r.helpful_vote_statement}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
