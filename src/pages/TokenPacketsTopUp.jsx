
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
  const [planPacks, setPlanPacks] = React.useState([]);
  const [purchasingPackId, setPurchasingPackId] = React.useState(null);

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

      // NEW: compute plan-specific token packs for current user's plan
      if (me?.plan_price_id) {
        const plan = (list || []).find(p => p.stripe_price_id === me.plan_price_id);
        const packs = (plan?.token_packs || [])
          .filter(pk => pk && pk.is_active !== false)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setPlanPacks(packs);
      } else {
        setPlanPacks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [me]);

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
      // Updated param name for compatibility with our function
      // Assuming createCheckoutSession now handles mode, success_url, cancel_url, metadata internally or through defaults
      const { data } = await createCheckoutSession({
        priceId: p.stripe_price_id,
        mode: p.is_recurring ? "subscription" : "payment", // Kept these, assuming the outline meant 'priceId' was added, not replaced everything
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { product_name: p.name, tokens_granted: String(p.tokens_granted || 0), category: "tokens" }
      });
      const url = data?.url || data?.checkoutUrl || data?.checkout_url || data?.session_url;
      if (url) {
        window.location.href = url;
      } else {
        alert("Unable to start checkout. Please try again or contact support.");
      }
    } finally {
      setPurchasing(null);
    }
  };

  // NEW: buy function for plan-specific pack entries
  const buyPlanPack = async (pack) => {
    setPurchasingPackId(pack.stripe_price_id);
    try {
      if (!pack.stripe_price_id) {
        alert("This token pack has no Stripe price set yet.");
        return;
      }
      // Assuming createCheckoutSession now handles mode, success_url, cancel_url, metadata internally or through defaults
      const successUrl = window.location.origin + "/?topup=success";
      const cancelUrl = window.location.href;
      const { data } = await createCheckoutSession({
        priceId: pack.stripe_price_id,
        mode: "payment", // Plan specific packs are generally one-time purchases
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { product_name: pack.name, tokens_granted: String(pack.tokens), category: "plan_tokens" }
      });
      const url = data?.url || data?.checkoutUrl || data?.checkout_url || data?.session_url;
      if (url) {
        window.location.href = url;
      } else {
        alert("Unable to start checkout. Please try again or contact support.");
      }
    } finally {
      setPurchasingPackId(null);
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

        {/* NEW: Plan-specific packs section */}
        {planPacks && planPacks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Recommended Token Packs for Your Plan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {planPacks.map((pk) => (
                <Card key={pk.stripe_price_id || pk.name} className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{pk.name}</span>
                      {pk.is_best_value && <Badge className="bg-amber-600 hover:bg-amber-700">Best value</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pk.image_url ? (
                      <img src={pk.image_url} alt={pk.name} className="w-full h-40 object-cover rounded-lg mb-3" />
                    ) : (
                      <div className="w-full h-40 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 text-slate-500">
                        <ImageIcon className="h-6 w-6 mr-2" />
                        No image
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-semibold">{pk.display_price || "$—"}</span>
                      <Badge variant="outline" className="text-slate-700">{pk.tokens} tokens</Badge>
                    </div>
                    {pk.description && <p className="text-sm text-slate-600 mb-4">{pk.description}</p>}
                    <Button className="w-full" onClick={() => buyPlanPack(pk)} disabled={purchasingPackId === pk.stripe_price_id}>
                      {purchasingPackId === pk.stripe_price_id ? "Redirecting…" : (<><CreditCard className="h-4 w-4 mr-2" />Buy now</>)}
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Instant crediting after payment
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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
              No token packets available yet. Please check back soon.
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
      </div>
    </div>
  );
}
