
import React from "react";
import { AppProduct } from "@/api/entities";
import { User } from "@/api/entities";
import AppProductForm from "@/components/products/AppProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Search, Sparkles, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AppProductManager() {
  const [me, setMe] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      try {
        const u = await User.me();
        setMe(u);
        if (!u?.is_superadmin) return;
        const list = await AppProduct.list("-updated_date", 200);
        setProducts(list);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const refresh = async () => {
    const list = await AppProduct.list("-updated_date", 200);
    setProducts(list);
  };

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.stripe_price_id?.toLowerCase().includes(q));

  }).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-6">Loading...</div>;
  }

  if (!me?.is_superadmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Access Restricted</CardTitle></CardHeader>
          <CardContent>You must be a superadmin to manage app products.</CardContent>
        </Card>
      </div>);

  }

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await AppProduct.create(payload);
      setShowForm(false);
      setEditing(null);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await AppProduct.update(editing.id, payload);
      setShowForm(false);
      setEditing(null);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await AppProduct.delete(p.id);
    await refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">App Products</h1>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('PricingFaqManager')}>
              <Button variant="outline" className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">
                <HelpCircle className="w-4 h-4 mr-2" /> Manage FAQs
              </Button>
            </Link>
            <Button onClick={() => {setEditing(null);setShowForm(true);}}>
              <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, category, or price id..." className="pl-9" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) =>
          <Card
            key={p.id}
            className="overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">

              {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover" />}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {p.is_best_value &&
                  <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Best value
                      </Badge>
                  }
                    {p.is_active ?
                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </Badge> :

                  <Badge variant="outline" className="text-slate-600 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Inactive
                    </Badge>
                  }
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-slate-600 line-clamp-3">{p.description}</div>
                {p.display_price && <div className="font-semibold text-slate-900">{p.display_price}</div>}
                {typeof p.tokens_granted === 'number' && p.tokens_granted > 0 &&
              <div className="text-xs text-slate-500">
                    Grants <span className="font-semibold text-slate-900">{p.tokens_granted}</span> tokens
                  </div>
              }
                <div className="text-xs text-slate-500">Stripe Price ID: {p.stripe_price_id || "—"}</div>
                {Array.isArray(p.features) && p.features.length > 0 &&
              <ul className="text-sm list-disc ml-5 space-y-1 text-slate-800">
                    {p.features.slice(0, 5).map((f, i) => <li key={i}>{f}</li>)}
                    {p.features.length > 5 && <li className="text-slate-500">+{p.features.length - 5} more</li>}
                  </ul>
              }
                <div className="flex gap-2 pt-2">
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {setEditing(p);setShowForm(true);}} className="bg-blue-900 text-slate-100 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md border-slate-300 hover:bg-blue-900/80">


                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(p)} className="bg-violet-900 text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-navy-900 h-9 rounded-md">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl w-[95vw] bg-white text-slate-900 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
            </DialogHeader>
            <AppProductForm
              initial={editing || {}}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => {setShowForm(false);setEditing(null);}}
              submitting={submitting} />

          </DialogContent>
        </Dialog>
      </div>
    </div>);

}