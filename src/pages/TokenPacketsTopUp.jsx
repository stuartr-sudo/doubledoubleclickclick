import React from "react";
import { User } from "@/api/entities";
import { AppProduct } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, ShieldCheck, Zap, CheckCircle2, ImageIcon } from "lucide-react";
import { createCheckoutSession } from "@/api/functions";

export default function TokenPacketsTopUp() {
  const [me, setMe] = React.useState(null);
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    display_price: "",
    stripe_price_id: "",
    tokens_granted: 0,
    image_url: "",
    is_active: true,
    category: "tokens",
    is_recurring: false,
  });
  const [purchasing, setPurchasing] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const u = await User.me();
        setMe(u);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await AppProduct.list();
      const filtered = (list || []).filter(
        (p) => (p.tokens_granted || 0) > 0 && (p.is_active !== false) && (p.category === "tokens" || p.category == null)
      ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const canManage = !!(me && (me.role === "admin" || me.is_superadmin === true));

  const handleCreate = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        display_price: form.display_price,
        stripe_price_id: form.stripe_price_id,
        tokens_granted: Number(form.tokens_granted || 0),
        image_url: form.image_url || undefined,
        is_active: !!form.is_active,
        category: "tokens",
        is_recurring: !!form.is_recurring,
      };
      await AppProduct.create(payload);
      setForm({ name: "", description: "", display_price: "", stripe_price_id: "", tokens_granted: 0, image_url: "", is_active: true, category: "tokens", is_recurring: false });
      await load();
    } finally {
      setAdding(false);
    }
  };

  const buy = async (p) => {
    setPurchasing(p.id);
    try {
      if (!p.stripe_price_id) {
        alert("This token packet has no Stripe price set yet.");
        return;
      }
      const successUrl = window.location.origin + "/?topup=success";
      const cancelUrl = window.location.href;
      const { data } = await createCheckoutSession({
        price_id: p.stripe_price_id,
        mode: p.is_recurring ? "subscription" : "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { product_name: p.name, tokens_granted: String(p.tokens_granted || 0), category: "tokens" }
      });
      const url = data?.url || data?.checkout_url || data?.session_url;
      if (url) {
        window.location.href = url;
      } else {
        alert("Unable to start checkout. Please try again or contact support.");
      }
    } finally {
      setPurchasing(null);
    }
  };

  const balance = typeof me?.token_balance === "number" ? me.token_balance : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start md:items-center justify-between gap-6 flex-col md:flex-row">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Token Packets Top Up</h1>
            <p className="text-slate-600 mt-2">Purchase additional tokens to keep using AI generation and enhancements without interruptions.</p>
            <div className="mt-3 flex items-center gap-2 text-slate-700">
              <Zap className="h-4 w-4 text-amber-600" />
              <span>Current balance:</span>
              <Badge variant={balance > 0 ? "default" : "destructive"} className="ml-1">{balance}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure checkout by Stripe</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-6 bg-slate-200 rounded w-1/2"></div></CardHeader>
                <CardContent>
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                  <div className="h-24 bg-slate-100 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full text-slate-600">
              No token packets available yet. {canManage ? "Use the form below to add one." : "Please check back soon."}
            </div>
          ) : (
            products.map((p) => (
              <Card key={p.id} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{p.name}</span>
                    {p.is_best_value && <Badge className="bg-amber-600 hover:bg-amber-700">Best value</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover rounded-lg mb-3" />
                  ) : (
                    <div className="w-full h-40 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 text-slate-500">
                      <ImageIcon className="h-6 w-6 mr-2" />
                      No image
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl font-semibold">{p.display_price || "$—"}</span>
                    <Badge variant="outline" className="text-slate-700">{p.tokens_granted} tokens</Badge>
                  </div>
                  {p.description && <p className="text-sm text-slate-600 mb-4">{p.description}</p>}
                  <Button className="w-full" onClick={() => buy(p)} disabled={!!purchasing}>
                    {purchasing === p.id ? "Redirecting…" : (<><CreditCard className="h-4 w-4 mr-2" />Buy now</>)}
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Instant crediting after payment
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {canManage && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Plus className="h-5 w-5" />Add Token Packet</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., 1,000 Tokens" />
              </div>
              <div>
                <Label>Display Price</Label>
                <Input value={form.display_price} onChange={(e) => setForm({ ...form, display_price: e.target.value })} placeholder="$19" />
              </div>
              <div>
                <Label>Stripe Price ID</Label>
                <Input value={form.stripe_price_id} onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })} placeholder="price_..." />
              </div>
              <div>
                <Label>Tokens Granted</Label>
                <Input type="number" min="1" value={form.tokens_granted} onChange={(e) => setForm({ ...form, tokens_granted: e.target.value })} placeholder="1000" />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label>Description (optional)</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What’s included or when to use this packet…" />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={adding}><Plus className="h-4 w-4 mr-2" />{adding ? "Adding…" : "Add Packet"}</Button>
              </div>
            </form>
            <p className="text-xs text-slate-500 mt-3">
              Tip: Create the price in Stripe, copy the Price ID here, and set “Tokens Granted” to the amount to credit after payment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}