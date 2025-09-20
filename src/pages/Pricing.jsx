
import React from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createCheckoutSession } from "@/api/functions";
import { Check, Star, ArrowRight } from "lucide-react";
import { AppProduct } from "@/api/entities";

const PLAN_KEYS = ["free", "growth", "brand", "agency"];

const PRICES = {
  monthly: {
    // Stripe price IDs (recurring monthly) from product catalog
    free: "price_1S7VhHQ1L6eczTxdoaAAaAZK", // $0 one-time, we still let them click Get Started
    growth: "price_1S7VeyQ1L6eczTxd9cCpQ87P", // $97/mo
    brand: "price_1S7VdJQ1L6eczTxdVYdKxrnx", // $247/mo
    agency: "price_1S7VboQ1L6eczTxdwKadoHU0" // $1997/mo
  },
  yearly: {
    // Stripe price IDs (recurring yearly)
    free: "price_1S7VhHQ1L6eczTxdoaAAaAZK", // keep as $0 for consistency
    growth: "price_1S7VgTQ1L6eczTxdVyx3wG70", // $997/yr
    brand: "price_1S7VeBQ1L6eczTxdRdknG3RC", // $2364/yr
    agency: "price_1S7Vb4Q1L6eczTxdltAHhRAg" // $18997/yr
  }
};

const DISPLAY = {
  growth: {
    name: "Growth",
    monthly: 97,
    yearly: 997,
    bullets: [
      "Team Dashboard",
      "Smart Auto-Assign",
      "Integrated Calendar View",
      "AI Suggestions",
      "Workflow Templates"
    ]
  },
  brand: {
    name: "Brand",
    monthly: 247,
    yearly: 2364,
    bullets: [
      "Advanced Permissions",
      "Multi‑Team Coordination",
      "Custom AI Workflows",
      "Audit Trail & Logs",
      "Priority Analytics",
      "Unlimited Integrations"
    ]
  },
  agency: {
    name: "Agency",
    monthly: 1997,
    yearly: 18997,
    bullets: [
      "Advanced Permissions",
      "Multi‑Team Coordination",
      "Custom AI Workflows",
      "Audit Trail & Logs",
      "Priority Analytics",
      "Unlimited Integrations"
    ]
  },
  free: {
    name: "Free",
    monthly: 0,
    yearly: 0,
    bullets: [
      "Smart Task Input",
      "Daily Focus Mode",
      "Basic Collaboration",
      "Cloud‑Synced History"
    ]
  }
};

function Price({ amount }) {
  if (amount >= 1000) {
    const thousands = Math.floor(amount / 1000);
    const rest = amount % 1000;
    return (
      <span className="text-4xl font-extrabold tracking-tight">
        ${thousands}
        {rest ? rest : ""}
      </span>
    );
  }
  return <span className="text-4xl font-extrabold tracking-tight">${amount}</span>;
}

function PlanCard({ planKey, billing, onBuy, meta }) {
  const conf = DISPLAY[planKey];
  const price = conf[billing];

  const name = meta?.name || conf.name;
  const features = (meta?.features?.length ? meta.features : conf.bullets) || [];
  const isBest = !!(meta?.is_best_value || (planKey === "brand"));

  return (
    <div
      className={[
        "rounded-3xl border transition-all duration-200 flex flex-col",
        isBest
          ? "bg-blue-50/70 border-blue-200 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.35)]"
          : "bg-white border-slate-200"
      ].join(" ")}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{name}</h3>
          {isBest && (
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Best value</Badge>
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-end gap-2">
            <Price amount={price} />
          </div>
          <div className="text-slate-500 text-sm">
            {planKey === "free"
              ? "No credit card required"
              : billing === "monthly"
              ? "Billed monthly"
              : "Billed annually"}
          </div>
        </div>

        <div className="h-px bg-slate-200 my-6" />

        <ul className="space-y-3">
          {features.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <Check className="h-3.5 w-3.5 text-blue-600" />
              </span>
              <span className="text-slate-700">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 pt-0 mt-auto">
        <Button
          onClick={() => onBuy(planKey, billing)}
          className={[
            "w-full justify-between group",
            isBest ? "bg-blue-600 hover:bg-blue-700" : ""
          ].join(" ")}
          variant={isBest ? "default" : "secondary"}
        >
          <span>Get Started</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Pricing() {
  const [billing, setBilling] = React.useState("monthly"); // "monthly" | "yearly"
  const [checkingOut, setCheckingOut] = React.useState(null);
  const [productMeta, setProductMeta] = React.useState({ monthly: {}, yearly: {} });

  React.useEffect(() => {
    (async () => {
      // Load all active AppProducts and map by stripe_price_id
      const all = await AppProduct.list();
      const byPriceId = {};
      (all || []).forEach((p) => {
        if (p?.is_active !== false && p?.stripe_price_id) {
          byPriceId[p.stripe_price_id] = p;
        }
      });

      const build = (bill) => {
        const map = {};
        PLAN_KEYS.forEach((k) => {
          const pid = PRICES[bill][k];
          const p = pid ? byPriceId[pid] : null;
          if (p) {
            map[k] = {
              name: p.name,
              features: Array.isArray(p.features) ? p.features : [],
              is_best_value: !!p.is_best_value
            };
          }
        });
        return map;
      };

      setProductMeta({
        monthly: build("monthly"),
        yearly: build("yearly"),
      });
    })();
  }, []);

  const buy = async (planKey, currentBilling) => {
    setCheckingOut(`${planKey}:${currentBilling}`);
    try {
      // ensure user logged in before calling checkout
      try {
        await User.me();
      } catch {
        await User.loginWithRedirect(window.location.href);
        return;
      }

      const priceId = PRICES[currentBilling][planKey];
      if (!priceId) return;

      const { data } = await createCheckoutSession({ priceId });
      const url = data?.url;
      if (url) window.location.href = url;
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Pricing Options
          </h1>
          <p className="mt-2 text-slate-600">
            Choose the subscription plan that suits your needs
          </p>

          {/* Billing toggle */}
          <div className="inline-flex p-1 mt-6 bg-slate-100 rounded-full border border-slate-200">
            <button
              className={[
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                billing === "monthly"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-600 hover:text-slate-800"
              ].join(" ")}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>
            <button
              className={[
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                billing === "yearly"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-600 hover:text-slate-800"
              ].join(" ")}
              onClick={() => setBilling("yearly")}
            >
              Yearly
            </button>
          </div>
        </header>

        {/* Plans */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLAN_KEYS.map((k) => (
            <PlanCard
              key={k}
              planKey={k}
              billing={billing}
              onBuy={buy}
              meta={productMeta[billing]?.[k]}
              checkingOut={checkingOut === `${k}:${billing}`}
            />
          ))}
        </div>

        {/* Notes */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Prices in USD. Taxes may apply. You can manage or cancel your subscription any time in the billing portal.
        </div>
      </div>
    </div>
  );
}
