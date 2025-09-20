import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Loader2, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { amazonReviews } from "@/api/functions";
import { Testimonial } from "@/api/entities";

export default function EditorAmazonImportModal({ isOpen, onClose, onInsert, currentUsername }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState({});

  const fetchReviews = async () => {
    if (!url.trim()) {
      toast.error("Paste an Amazon product URL");
      return;
    }
    setLoading(true);
    try {
      const { data } = await amazonReviews({ url: url.trim() });
      const rows = Array.isArray(data?.reviews) ? data.reviews.slice(0, 15) : [];
      setReviews(rows);
      setSelected(Object.fromEntries(rows.map((r, i) => [i, true])));
      if (rows.length === 0) toast.message("No reviews found for this URL.");
    } catch (e) {
      toast.error(e?.message || "Failed to retrieve reviews.");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = async () => {
    const chosen = reviews.filter((_, i) => selected[i]);
    if (chosen.length === 0) {
      toast.message("Select at least one review.");
      return;
    }
    const htmlBlocks = chosen.map((r) => {
      const stars = "★".repeat(Math.round(Number(r.rating || 5))) + "☆".repeat(5 - Math.round(Number(r.rating || 5)));
      return `
<section class="b44-testimonial" style="margin:12px 0;border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc;">
  <div style="font-weight:700; color:#1e293b;">${r.title || "Customer Review"}</div>
  <div style="font-size:13px;opacity:.8;">${stars}</div>
  <p style="margin-top:8px;line-height:1.6; color:#334155;">${r.comment || r.text || ""}</p>
  <div style="font-size:12px;opacity:.7;margin-top:6px; color:#475569;">— ${r.author || "Amazon Customer"}</div>
</section>`.trim();
    });

    for (const r of chosen) {
      await Testimonial.create({
        source: "amazon",
        asin: r.asin || "",
        country: r.country || "US",
        review_id: r.id || "",
        review_title: r.title || "",
        review_comment: r.comment || r.text || "",
        review_star_rating: Number(r.rating || 5),
        review_link: r.url || "",
        review_author: r.author || "Amazon Customer",
        review_date: r.date || "",
        is_verified_purchase: !!r.verified,
        user_name: currentUsername || undefined
      });
    }

    onInsert(htmlBlocks.join("\n"));
    onClose();
    toast.success(`Inserted ${chosen.length} testimonial${chosen.length > 1 ? "s" : ""}.`);
  };

  const toggle = (i) => setSelected((s) => ({ ...s, [i]: !s[i] }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl b44-modal bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Amazon Import
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Paste an Amazon product URL to fetch recent testimonials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="https://www.amazon.com/dp/PRODUCT_ID"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
          />
          <div className="flex gap-2">
            <Button onClick={fetchReviews} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching</> : "Fetch Reviews"}
            </Button>
            <Button variant="outline" onClick={onClose} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100">Close</Button>
          </div>

          {reviews.length > 0 && (
            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-md">
              {reviews.map((r, i) => (
                <div key={i} className="p-3 border-b border-slate-200 flex items-start gap-3">
                  <button onClick={() => toggle(i)} className={`mt-1 ${selected[i] ? "text-emerald-600" : "text-slate-400"}`} title="Toggle select">
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="font-medium text-slate-800">{r.title || "Customer Review"}</div>
                    <div className="text-xs text-slate-500">{r.author || "Amazon Customer"} • {r.rating ? `${r.rating}/5` : "5/5"}</div>
                    <p className="text-sm text-slate-700 mt-1">{r.comment || r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reviews.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleInsert} className="bg-emerald-600 hover:bg-emerald-700 text-white">Insert Selected</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}