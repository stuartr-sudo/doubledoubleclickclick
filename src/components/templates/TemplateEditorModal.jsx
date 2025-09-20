
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import TemplatePlaceholders from "./TemplatePlaceholders";

const FEATURES = [
  { key: "product", label: "Product" },
  { key: "cta", label: "Call To Action" },
  { key: "email_form", label: "Email Form" },
  { key: "tldr", label: "TL;DR" },
  { key: "testimonial", label: "Testimonial" },
  { key: "faq", label: "FAQ" },
  { key: "callout", label: "Callout" },
  { key: "fact", label: "Fact" },
  { key: "general", label: "General" }
];

function applyPreview(feature, html, preview) {
  if (!html) return "";
  const map = {
    // Product
    PRODUCT_NAME: preview?.product_name || preview?.title || "",
    PRODUCT_DESCRIPTION: preview?.product_description || preview?.content || "",
    PRODUCT_PRICE: preview?.product_price || "",
    PRODUCT_URL: preview?.product_url || "#",
    IMAGE_URL: preview?.image_url || "",
    IMAGE_ALT: preview?.image_alt || "",
    SKU: preview?.sku || "",
    STAR_RATING: String(preview?.star_rating ?? ""),
    REVIEW_COUNT: String(preview?.review_count ?? ""),
    BUTTON_TEXT: preview?.button_text || "Learn more",
    LINK_TEXT: preview?.link_text || "Learn more",
    // CTA
    HEADLINE: preview?.headline || preview?.title || "",
    SUBTEXT: preview?.subtext || preview?.content || "",
    BUTTON_URL: preview?.button_url || "#",
    // Email form
    ACTION_URL: preview?.action_url || "#",
    EMAIL_PLACEHOLDER: preview?.email_placeholder || "you@example.com",
    NAME_PLACEHOLDER: preview?.name_placeholder || "Your name",
    // TLDR / General / Callout / Fact
    TITLE: preview?.title || "",
    CONTENT: preview?.content || "",
    ICON: preview?.icon || ""
  };

  let out = html;
  Object.entries(map).forEach(([k, v]) => {
    const re = new RegExp(`\\{\\{${k}\\}\\}`, "g");
    out = out.replace(re, v ?? "");
  });
  return out;
}

export default function TemplateEditorModal({
  open,
  onOpenChange,
  initialValue,
  usernames = [],
  onSubmit
}) {
  // NEW: central default form factory
  const makeDefaultForm = React.useCallback(
    () => ({
      name: "",
      description: "",
      html_structure: "",
      associated_ai_feature: "product",
      user_name: usernames[0] || "",
      is_active: true,
      preview_data: { title: "", content: "", image_url: "" }
    }),
    [usernames]
  );

  // INIT: use default factory
  const [form, setForm] = React.useState(() => makeDefaultForm());

  // UPDATED: whenever editing an existing item, load it; if creating new, reset to defaults on open
  React.useEffect(() => {
    if (initialValue) {
      setForm({
        name: initialValue.name || "",
        description: initialValue.description || "",
        html_structure: initialValue.html_structure || "",
        associated_ai_feature: initialValue.associated_ai_feature || "product",
        user_name: initialValue.user_name || usernames[0] || "",
        is_active: initialValue.is_active !== false,
        preview_data: {
          title: initialValue.preview_data?.title || "",
          content: initialValue.preview_data?.content || "",
          image_url: initialValue.preview_data?.image_url || ""
        }
      });
    } else if (open) {
      // NEW: ensure a clean slate for "New Template"
      setForm(makeDefaultForm());
    }
  }, [initialValue, open, usernames, makeDefaultForm]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name || !form.html_structure) return;
    onSubmit?.(form);
  };

  const previewHtml = applyPreview(form.associated_ai_feature, form.html_structure, {
    ...form.preview_data,
    // sensible defaults for quick testing
    product_name: form.preview_data.title || "Sample Product",
    product_description: form.preview_data.content || "Short description.",
    product_price: "$29.99"
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-5xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialValue ? "Edit Template" : "New Template"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-white border-slate-300" required />
            </div>
            <div>
              <Label>Feature</Label>
              <Select value={form.associated_ai_feature} onValueChange={(v) => setForm((f) => ({ ...f, associated_ai_feature: v }))}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {FEATURES.map((f) => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-white border-slate-300" />
            </div>
            <div>
              <Label>Assign Username (optional)</Label>
              <Select
                value={form.user_name ? form.user_name : "__unassigned__"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, user_name: v === "__unassigned__" ? "" : v }))
                }
              >
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {usernames.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                className="bg-slate-300 data-[state=checked]:bg-emerald-600"
                checked={!!form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>
          </div>

          <TemplatePlaceholders feature={form.associated_ai_feature} />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>HTML Structure</Label>
              <Textarea
                value={form.html_structure}
                onChange={(e) => setForm((f) => ({ ...f, html_structure: e.target.value }))}
                className="bg-white border-slate-300 min-h-[260px]"
                placeholder='Example: <div class="card"><h3>{{PRODUCT_NAME}}</h3><p>{{PRODUCT_DESCRIPTION}}</p><a href="{{PRODUCT_URL}}">{{BUTTON_TEXT}}</a></div>'
                required
              />
              <p className="text-xs text-slate-500 mt-1">Paste full HTML for your block. Use placeholders displayed above.</p>

              <div className="rounded-lg border border-slate-200 p-3 mt-3">
                <div className="font-semibold mb-2 text-slate-800">Preview Data</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-slate-700">Title</Label>
                    <Input value={form.preview_data.title} onChange={(e) => setForm((f) => ({ ...f, preview_data: { ...f.preview_data, title: e.target.value } }))} className="bg-white border-slate-300" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-slate-700">Content</Label>
                    <Input value={form.preview_data.content} onChange={(e) => setForm((f) => ({ ...f, preview_data: { ...f.preview_data, content: e.target.value } }))} className="bg-white border-slate-300" />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-slate-700">Image URL</Label>
                    <Input value={form.preview_data.image_url} onChange={(e) => setForm((f) => ({ ...f, preview_data: { ...f.preview_data, image_url: e.target.value } }))} className="bg-white border-slate-300" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Live Preview</Label>
              <div className="rounded-lg border border-slate-200 bg-white p-3 min-h-[260px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</Button>
            <Button type="submit" className="bg-indigo-700 hover:bg-indigo-800">Save Template</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
