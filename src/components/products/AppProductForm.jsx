
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AppProductForm({ initial = {}, onSubmit, onCancel, submitting }) {
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    display_price: "",
    stripe_price_id: "",
    is_recurring: false,
    image_url: "",
    category: "",
    sort_order: 0,
    is_active: true,
    tokens_granted: 0,
    plan_key: "growth",
    billing_interval: "month",
    annual_price_per_month: "",
    token_packs: [],
    ...initial,
    // Computed fields that need special handling after spread
    features_text: Array.isArray(initial?.features) ? initial.features.join("\n") : (initial?.features_text || ""),
    is_best_value: !!initial?.is_best_value,
    best_value_bg_color: initial?.best_value_bg_color || "",
    best_value_border_color: initial?.best_value_border_color || "",
    token_packs: Array.isArray(initial?.token_packs) ? initial.token_packs : []
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // NEW: Token pack helpers
  const addTokenPack = () => {
    setForm(s => ({
      ...s,
      token_packs: [
        ...(s.token_packs || []),
        { name: "", tokens: 0, display_price: "", stripe_price_id: "", description: "", image_url: "", is_active: true, sort_order: (s.token_packs?.length || 0) + 1 }
      ]
    }));
  };
  const updateTokenPack = (idx, key, val) => {
    setForm(s => {
      const next = [...(s.token_packs || [])];
      if (next[idx]) { // Ensure the item exists before updating
        next[idx] = { ...next[idx], [key]: key === "tokens" || key === "sort_order" ? Number(val || 0) : val };
      }
      return { ...s, token_packs: next };
    });
  };
  const removeTokenPack = (idx) => {
    setForm(s => {
      const next = [...(s.token_packs || [])];
      next.splice(idx, 1);
      return { ...s, token_packs: next };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name?.trim(),
      description: form.description?.trim(),
      display_price: form.display_price?.trim(),
      stripe_price_id: form.stripe_price_id?.trim(),
      is_recurring: !!form.is_recurring,
      image_url: form.image_url?.trim(),
      category: form.category?.trim(),
      is_active: !!form.is_active,
      sort_order: Number(form.sort_order || 0),
      tokens_granted: Number(form.tokens_granted || 0),
      is_best_value: !!form.is_best_value,
      best_value_bg_color: (form.best_value_bg_color || "").trim(),
      best_value_border_color: (form.best_value_border_color || "").trim(),
      // NEW FIELDS
      plan_key: form.plan_key,
      billing_interval: form.billing_interval,
      annual_price_per_month: form.annual_price_per_month?.trim() || null,
      // End NEW FIELDS
      features: (form.features_text || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      // NEW: include token packs
      token_packs: (form.token_packs || []).map(p => ({
        name: (p.name || "").trim(),
        tokens: Number(p.tokens || 0),
        display_price: (p.display_price || "").trim(),
        stripe_price_id: (p.stripe_price_id || "").trim(),
        description: (p.description || "").trim(),
        image_url: (p.image_url || "").trim(),
        is_active: !!p.is_active,
        sort_order: Number(p.sort_order || 0)
      }))
    };
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-800">Name</Label>
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
        </div>
        <div>
          <Label className="text-slate-800">Category (optional)</Label>
          <Input
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
        </div>

        {/* NEW Plan Key */}
        <div>
            <Label htmlFor="plan_key" className="text-slate-800">Plan Key</Label>
            <Select required value={form.plan_key} onValueChange={(v) => update("plan_key", v)}>
                <SelectTrigger id="plan_key" className="bg-white text-slate-900 border-slate-300">
                    <SelectValue placeholder="Select plan key" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {/* NEW Billing Interval */}
        <div>
            <Label htmlFor="billing_interval" className="text-slate-800">Billing Interval</Label>
            <Select required value={form.billing_interval} onValueChange={(v) => update("billing_interval", v)}>
                <SelectTrigger id="billing_interval" className="bg-white text-slate-900 border-slate-300">
                    <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div>
          <Label className="text-slate-800">Display Price</Label>
          <Input
            value={form.display_price}
            onChange={(e) => update("display_price", e.target.value)}
            placeholder="$247"
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
        </div>
        <div>
          <Label className="text-slate-800">Stripe Price ID</Label>
          <Input
            value={form.stripe_price_id}
            onChange={(e) => update("stripe_price_id", e.target.value)}
            placeholder="price_..."
            required
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
        </div>
        {/* NEW Annual Price Per Month */}
        <div>
            <Label className="text-slate-800">Annual Price Per Month (Optional)</Label>
            <Input
                value={form.annual_price_per_month}
                onChange={(e) => update("annual_price_per_month", e.target.value)}
                placeholder="$197"
                className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
            />
            <p className="text-xs text-slate-500 mt-1">For yearly plans, sets the 'per month' marketing price.</p>
        </div>
        <div>
          <Label className="text-slate-800">Image URL</Label>
          <Input
            value={form.image_url}
            onChange={(e) => update("image_url", e.target.value)}
            placeholder="https://..."
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
        </div>
        <div>
          <Label className="text-slate-800">Sort Order</Label>
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) => update("sort_order", e.target.value)}
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
        </div>
        <div>
          <Label className="text-slate-800">Tokens Granted</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={Number(form.tokens_granted ?? 0)}
            onChange={(e) => update("tokens_granted", Number(e.target.value))}
            placeholder="e.g., 300"
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
          <p className="text-xs text-slate-500 mt-1">Added on purchase and each renewal.</p>
        </div>
        <div className="md:col-span-2">
          <Label className="text-slate-800">Description</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-slate-800">Features (one per line)</Label>
          <Textarea
            rows={4}
            value={form.features_text}
            onChange={(e) => update("features_text", e.target.value)}
            placeholder="- Feature A&#10;- Feature B"
            className="bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300"
          />
        </div>

        {/* NEW: Token Pack Options */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-slate-800">Token Pack Options (for this plan)</Label>
            <Button type="button" variant="outline" onClick={addTokenPack}>Add Pack</Button>
          </div>
          {(form.token_packs || []).length === 0 ? (
            <p className="text-sm text-slate-500">No token packs yet. Click "Add Pack" to create plan-specific top-ups.</p>
          ) : (
            <div className="space-y-3">
              {form.token_packs.map((p, idx) => (
                <div key={idx} className="grid md:grid-cols-6 gap-3 border rounded-lg p-3 bg-white">
                  <div className="md:col-span-2">
                    <Label className="text-slate-800">Name</Label>
                    <Input value={p.name || ""} onChange={(e) => updateTokenPack(idx, "name", e.target.value)} placeholder="e.g., 1,000 Tokens" className="bg-white text-slate-900 placeholder:text-slate-400 border-slate-300" />
                  </div>
                  <div>
                    <Label className="text-slate-800">Tokens</Label>
                    <Input type="number" min={1} value={Number(p.tokens ?? 0)} onChange={(e) => updateTokenPack(idx, "tokens", e.target.value)} placeholder="1000" className="bg-white text-slate-900 placeholder:text-slate-400 border-slate-300" />
                  </div>
                  <div>
                    <Label className="text-slate-800">Display Price</Label>
                    <Input value={p.display_price || ""} onChange={(e) => updateTokenPack(idx, "display_price", e.target.value)} placeholder="$19" className="bg-white text-slate-900 placeholder:text-slate-400 border-slate-300" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-800">Stripe Price ID</Label>
                    <Input value={p.stripe_price_id || ""} onChange={(e) => updateTokenPack(idx, "stripe_price_id", e.target.value)} placeholder="price_..." className="bg-white text-slate-900 placeholder:text-slate-400 border-slate-300" />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-slate-800">Description (optional)</Label>
                    <Input value={p.description || ""} onChange={(e) => updateTokenPack(idx, "description", e.target.value)} placeholder="Shown on top-up page" className="bg-white text-slate-900 placeholder:text-slate-400 border-slate-300" />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-slate-800">Image URL (optional)</Label>
                    <Input value={p.image_url || ""} onChange={(e) => updateTokenPack(idx, "image_url", e.target.value)} placeholder="https://..." className="bg-white text-slate-900 placeholder:text-slate-400 border-slate-300" />
                  </div>
                  <div>
                    <Label className="text-slate-800">Sort</Label>
                    <Input type="number" value={Number(p.sort_order ?? 0)} onChange={(e) => updateTokenPack(idx, "sort_order", e.target.value)} className="bg-white text-slate-900 placeholder:text-slate-400 border-slate-300" />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Switch id={`pack_active_${idx}`} checked={!!p.is_active} onCheckedChange={(v) => updateTokenPack(idx, "is_active", v)} />
                      <Label htmlFor={`pack_active_${idx}`} className="text-slate-800">Active</Label>
                    </div>
                  </div>
                  <div className="md:col-span-6 flex justify-end">
                    <Button type="button" variant="destructive" onClick={() => removeTokenPack(idx)}>Remove Pack</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={!!form.is_recurring} onCheckedChange={(v) => update("is_recurring", v)} id="is_recurring" />
          <Label htmlFor="is_recurring" className="text-slate-800">Recurring (subscription)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={!!form.is_active} onCheckedChange={(v) => update("is_active", v)} id="is_active" />
          <Label htmlFor="is_active" className="text-slate-800">Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={!!form.is_best_value} onCheckedChange={(v) => update("is_best_value", v)} id="is_best_value" />
          <Label htmlFor="is_best_value" className="text-slate-800">Best value (highlight on Pricing)</Label>
        </div>
        {form.is_best_value && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Label htmlFor="best_value_bg_color" className="text-slate-800">Highlight BG</Label>
              <Input
                id="best_value_bg_color"
                type="color"
                value={form.best_value_bg_color || "#FFF4CC"}
                onChange={(e) => update("best_value_bg_color", e.target.value)}
                className="h-10 w-16 p-1 bg-white border border-slate-300"
                title="Background color for Best value card"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="best_value_border_color" className="text-slate-800">Highlight Border</Label>
              <Input
                id="best_value_border_color"
                type="color"
                value={form.best_value_border_color || "#FDE68A"}
                onChange={(e) => update("best_value_border_color", e.target.value)}
                className="h-10 w-16 p-1 bg-white border border-slate-300"
                title="Border color for Best value card"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="bg-white text-slate-800 border border-slate-300 hover:bg-slate-50">
          Cancel
        </Button>
        <Button type="submit" disabled={!!submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
