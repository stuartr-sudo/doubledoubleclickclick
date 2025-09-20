import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductStyleTemplate } from "@/api/entities";
import { User } from "@/api/entities";
import { renderProduct } from "@/components/variants/renderers";
import { Search, Check, Image as ImageIcon, Type } from "lucide-react";

export default function ProductStyleTemplateSelectorModal({
  open,
  onOpenChange,
  onSelect,
  productDraft
}) {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [me, setMe] = React.useState(null);
  const [sample, setSample] = React.useState(() => ({
    name: productDraft?.name || "Sample Product",
    price: productDraft?.price || "$49.00",
    description: productDraft?.description || "Concise description goes here.",
    image_url: productDraft?.image_url || ""
  }));

  React.useEffect(() => {
    setSample({
      name: productDraft?.name || "Sample Product",
      price: productDraft?.price || "$49.00",
      description: productDraft?.description || "Concise description goes here.",
      image_url: productDraft?.image_url || ""
    });
  }, [productDraft]);

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const user = await User.me().catch(() => null);
        setMe(user);
        // Load active templates; if user scoped, include both global and their username
        const all = await ProductStyleTemplate.filter({ is_active: true }, "-updated_date").catch(() => []);
        // No additional filter by user_name here; treat all active as selectable
        setItems(all);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const filtered = items.filter(t =>
    (t.name || "").toLowerCase().includes(q.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(q.toLowerCase()) ||
    (t.template_key || "").toLowerCase().includes(q.toLowerCase())
  );

  const PreviewCard = ({ tpl }) => {
    const data = {
      name: sample.name || tpl.sample_data?.name || "Sample Product",
      price: sample.price || tpl.sample_data?.price || "$49.00",
      description: sample.description || tpl.sample_data?.description || "Short description.",
      image_url: sample.image_url || tpl.sample_data?.image_url || ""
    };
    const html = renderProduct(tpl.template_key || "gradient", data);
    return (
      <div className="rounded-xl border border-white/15 bg-white/5 p-3 hover:bg-white/10 transition">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-white">{tpl.name}</div>
            <div className="text-xs text-white/60">{tpl.template_key}</div>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              onSelect?.(tpl);
              onOpenChange?.(false);
            }}
          >
            <Check className="w-4 h-4 mr-1" /> Use
          </Button>
        </div>
        {tpl.description && (
          <div className="text-xs text-white/70 mt-1">{tpl.description}</div>
        )}
        <div className="mt-3 rounded-lg overflow-hidden bg-white">
          <div
            className="max-h-56 overflow-hidden"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 text-white border-white/20 max-w-5xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Product Display Style</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Search and sample editor */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search templates by name, key, or description"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2 relative">
                <Type className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/50" />
                <Input
                  value={sample.name}
                  onChange={(e) => setSample((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Sample name"
                  className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <Input
                value={sample.price}
                onChange={(e) => setSample((s) => ({ ...s, price: e.target.value }))}
                placeholder="$49.00"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Input
                value={sample.image_url}
                onChange={(e) => setSample((s) => ({ ...s, image_url: e.target.value }))}
                placeholder="Image URL"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <div className="col-span-4 relative">
                <ImageIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/50" />
                <Input
                  value={sample.description}
                  onChange={(e) => setSample((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Short description"
                  className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>
          </div>

          {/* Grid of templates */}
          {loading ? (
            <div className="text-white/70 py-6">Loading templates…</div>
          ) : filtered.length === 0 ? (
            <div className="text-white/70 py-6">No templates yet. Create some in Product Styles.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((tpl) => (
                <PreviewCard key={tpl.id} tpl={tpl} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}