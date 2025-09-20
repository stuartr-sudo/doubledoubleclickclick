import React, { useEffect, useState } from "react";
import { SalesPageContent } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Save, Eye } from "lucide-react";
import { createPageUrl } from "@/utils";

const ICON_OPTIONS = ["zap","globe","bot","sparkles","wand","shield","megaphone","book"];
const FEATURE_ICON_OPTIONS = ["sparkles","image","video","share","shopping","wand","book","megaphone","globe","shield","bot","zap"];

export default function SalesPageManager() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [form, setForm] = useState({
    identifier: "main_sales_v1",
    hero_badge: "All‑in‑One AI Content Platform",
    hero_title: "Stop chasing content. Start dominating your market.",
    hero_subtitle: "Create, optimize, and publish content at scale with AI rewriting, humanization, image/video generation, citations, localization, and one‑click publishing.",
    hero_bg_image_url: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1600&auto=format&fit=crop",
    cta_primary_text: "Request a demo",
    cta_primary_page: "Contact",
    cta_secondary_text: "Explore the platform",
    cta_secondary_page: "Home",
    big_benefits: [
      { icon_key: "zap", title: "Create faster", desc: "From blank page to polished post in minutes with AI assists at every step." },
      { icon_key: "globe", title: "Publish smarter", desc: "Keep formatting, images, and SEO metadata across destinations automatically." },
      { icon_key: "bot", title: "Scale quality", desc: "Workflows standardize excellence so every post is consistent and on-brand." }
    ],
    feature_highlights: [],
    metrics: [
      { value: "10x", label: "Faster content creation" },
      { value: "1‑Click", label: "Publishing to your stack" },
      { value: "100%", label: "On‑brand with AI guardrails" }
    ],
    final_cta_title: "Ready to transform your content operations?",
    final_cta_subtitle: "See how teams ship 10x more content that’s more on‑brand, more engaging, and easier to publish—without adding headcount."
  });

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        setIsAuthorized(me?.role === "admin" || me?.access_level === "full" || me?.is_superadmin === true);
      } catch {
        setIsAuthorized(false);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    (async () => {
      setLoading(true);
      let found = await SalesPageContent.filter({ identifier: "main_sales_v1" }).catch(() => []);
      if (!found?.length) found = await SalesPageContent.list("-updated_date", 1).catch(() => []);
      if (found?.length) {
        setRecord(found[0]);
        setForm({ ...form, ...found[0] });
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const updateArrayItem = (key, idx, patch) =>
    setForm(prev => {
      const arr = [...(prev[key] || [])];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...prev, [key]: arr };
    });
  const addArrayItem = (key, val) => setForm(prev => ({ ...prev, [key]: [ ...(prev[key] || []), val ] }));
  const removeArrayItem = (key, idx) =>
    setForm(prev => {
      const arr = [...(prev[key] || [])];
      arr.splice(idx, 1);
      return { ...prev, [key]: arr };
    });

  const save = async () => {
    setSaving(true);
    const payload = { ...form, identifier: "main_sales_v1" };
    if (record?.id) {
      await SalesPageContent.update(record.id, payload);
    } else {
      const created = await SalesPageContent.create(payload);
      setRecord(created);
    }
    setSaving(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl text-white">
          You do not have permission to edit the sales page.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen p-6 text-white/80">Loading editor…</div>;
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sales Page Editor</h1>
          <div className="flex gap-2">
            <a href={createPageUrl("SalesPage")} target="_blank" rel="noreferrer">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white">
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
            </a>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-3">Hero</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Badge</Label>
              <Input value={form.hero_badge || ""} onChange={e => update("hero_badge", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1" />
            </div>
            <div>
              <Label>Background Image URL</Label>
              <Input value={form.hero_bg_image_url || ""} onChange={e => update("hero_bg_image_url", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input value={form.hero_title || ""} onChange={e => update("hero_title", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Subtitle</Label>
              <Textarea value={form.hero_subtitle || ""} onChange={e => update("hero_subtitle", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1 min-h-[90px]" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Primary CTA Text</Label>
              <Input value={form.cta_primary_text || ""} onChange={e => update("cta_primary_text", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1" />
            </div>
            <div>
              <Label>Primary CTA Page</Label>
              <Input value={form.cta_primary_page || ""} onChange={e => update("cta_primary_page", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1" placeholder="Contact" />
            </div>
            <div>
              <Label>Secondary CTA Text</Label>
              <Input value={form.cta_secondary_text || ""} onChange={e => update("cta_secondary_text", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1" />
            </div>
            <div>
              <Label>Secondary CTA Page</Label>
              <Input value={form.cta_secondary_page || ""} onChange={e => update("cta_secondary_page", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1" placeholder="Home" />
            </div>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-3">Big Benefits</h2>
          <div className="space-y-3">
            {(form.big_benefits || []).map((b, i) => (
              <div key={i} className="grid md:grid-cols-3 gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <div>
                  <Label>Icon</Label>
                  <Select value={b.icon_key || ""} onValueChange={(v) => updateArrayItem("big_benefits", i, { icon_key: v })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                      <SelectValue placeholder="Choose icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={b.title || ""} onChange={e => updateArrayItem("big_benefits", i, { title: e.target.value })} className="bg-white/10 border-white/20 text-white mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={b.desc || ""} onChange={e => updateArrayItem("big_benefits", i, { desc: e.target.value })} className="bg-white/10 border-white/20 text-white mt-1" />
                </div>
                <div className="md:col-span-3">
                  <Button variant="outline" onClick={() => removeArrayItem("big_benefits", i)} className="bg-white/10 border-white/20 text-white"><Minus className="w-4 h-4 mr-1" /> Remove</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addArrayItem("big_benefits", { icon_key: "zap", title: "", desc: "" })} className="bg-white/10 border-white/20 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Benefit
            </Button>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-3">Feature Highlights</h2>
          <div className="space-y-3">
            {(form.feature_highlights || []).map((f, i) => (
              <div key={i} className="grid md:grid-cols-3 gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <div>
                  <Label>Icon</Label>
                  <Select value={f.icon_key || ""} onValueChange={(v) => updateArrayItem("feature_highlights", i, { icon_key: v })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                      <SelectValue placeholder="Choose icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEATURE_ICON_OPTIONS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={f.title || ""} onChange={e => updateArrayItem("feature_highlights", i, { title: e.target.value })} className="bg-white/10 border-white/20 text-white mt-1" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={f.desc || ""} onChange={e => updateArrayItem("feature_highlights", i, { desc: e.target.value })} className="bg-white/10 border-white/20 text-white mt-1" />
                </div>
                <div className="md:col-span-3">
                  <Button variant="outline" onClick={() => removeArrayItem("feature_highlights", i)} className="bg-white/10 border-white/20 text-white"><Minus className="w-4 h-4 mr-1" /> Remove</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addArrayItem("feature_highlights", { icon_key: "sparkles", title: "", desc: "" })} className="bg-white/10 border-white/20 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Feature
            </Button>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-3">Metrics</h2>
          <div className="space-y-3">
            {(form.metrics || []).map((m, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <div>
                  <Label>Value</Label>
                  <Input value={m.value || ""} onChange={e => updateArrayItem("metrics", i, { value: e.target.value })} className="bg-white/10 border-white/20 text-white mt-1" />
                </div>
                <div>
                  <Label>Label</Label>
                  <Input value={m.label || ""} onChange={e => updateArrayItem("metrics", i, { label: e.target.value })} className="bg-white/10 border-white/20 text-white mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Button variant="outline" onClick={() => removeArrayItem("metrics", i)} className="bg-white/10 border-white/20 text-white"><Minus className="w-4 h-4 mr-1" /> Remove</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addArrayItem("metrics", { value: "", label: "" })} className="bg-white/10 border-white/20 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Metric
            </Button>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-3">Final CTA</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input value={form.final_cta_title || ""} onChange={e => update("final_cta_title", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Subtitle</Label>
              <Textarea value={form.final_cta_subtitle || ""} onChange={e => update("final_cta_subtitle", e.target.value)} className="bg-white/10 border-white/20 text-white mt-1 min-h-[90px]" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}