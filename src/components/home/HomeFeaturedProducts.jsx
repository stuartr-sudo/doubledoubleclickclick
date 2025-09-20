import React from "react";
import { LandingPageContent } from "@/api/entities";
import { AppProduct } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomeFeaturedProducts() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const primary = await LandingPageContent.filter({ identifier: "main_sewo_v1" });
        let rec = primary && primary[0];
        if (!rec) {
          const fallback = await LandingPageContent.filter({ identifier: "main_v1" });
          rec = fallback && fallback[0];
        }
        const ids = Array.isArray(rec?.featured_app_product_ids) ? rec.featured_app_product_ids : [];
        if (ids.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }
        const all = await AppProduct.list("-sort_order");
        const active = all.filter(p => p.is_active !== false);
        const byId = new Map(active.map(p => [p.id, p]));
        // Preserve selection order
        const ordered = ids.map(id => byId.get(id)).filter(Boolean);
        setItems(ordered);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return null;
  if (!items.length) return null;

  return (
    <section className="px-6 py-10 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Featured Products</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Card key={p.id} className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{p.name}</span>
                  {p.category && <Badge variant="secondary">{p.category}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-36 object-cover rounded-md border"
                    loading="lazy"
                  />
                )}
                <div className="text-slate-700 text-sm">{p.description}</div>
                <div className="font-semibold text-slate-900">{p.display_price}</div>
                {Array.isArray(p.features) && p.features.length > 0 && (
                  <ul className="list-disc pl-4 text-sm text-slate-600 space-y-1">
                    {p.features.slice(0, 4).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}