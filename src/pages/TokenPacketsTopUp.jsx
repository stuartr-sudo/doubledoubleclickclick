
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { AppProduct } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast"; // Assuming toast utility is from shadcn/ui
import { createPageUrl } from "@/lib/utils"; // Assuming createPageUrl is a utility function
import { Loader2, Shield, ShoppingCart, Coins } from "lucide-react";
import { createCheckoutSession } from "@/api/functions";

export default function TokenPacketsTopUp() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availablePacks, setAvailablePacks] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedUser = await User.me();
      setUser(fetchedUser);

      const allProducts = await AppProduct.list();
      const userPlanKey = fetchedUser.plan_price_id ?
      allProducts.find((p) => p.stripe_price_id === fetchedUser.plan_price_id)?.plan_key :
      null;

      let packs = [];
      if (userPlanKey) {
        // Find the product that represents the user's current plan based on plan_key and billing_interval
        const userPlanProduct = allProducts.find((p) => p.plan_key === userPlanKey && p.billing_interval === 'month');
        if (userPlanProduct && userPlanProduct.token_packs) {
          packs = userPlanProduct.token_packs.filter((pack) => pack && pack.is_active !== false);
        }
      }

      setAvailablePacks(packs);
    } catch (error) {
      console.error('Error loading token packs:', error);
      toast({
        title: "Error",
        description: "Failed to load token packs. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyPack = async (pack) => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      if (!pack.stripe_price_id) {
        toast({
          title: "Error",
          description: "This token pack has no Stripe price set yet. Please contact support.",
          variant: "destructive"
        });
        setIsCheckingOut(false);
        return;
      }

      // Use payload keys expected by the backend createCheckoutSession function
      const affiliateRef = localStorage.getItem('affiliate_ref') || null;
      const { data } = await createCheckoutSession({
        priceId: pack.stripe_price_id,
        affiliateRef
      });

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from Stripe');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
        variant: "destructive"
      });
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Token Packets Top Up</h1>
          <p className="text-slate-600 mb-8">
            Purchase additional tokens to keep using AI generation and enhancements without interruptions.
          </p>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Coins className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Current balance:</p>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-slate-400">Loading...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) =>
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-6"></div>
                <div className="h-10 bg-slate-200 rounded w-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>);

  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Log In</h2>
          <p className="text-slate-600 mb-6">You need to be logged in to purchase token packets.</p>
          <Button onClick={() => User.loginWithRedirect(window.location.href)}>
            Log In
          </Button>
        </div>
      </div>);

  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Token Packets Top Up</h1>
        <p className="text-slate-600 mb-8">
          Purchase additional tokens to keep using AI generation and enhancements without interruptions.
        </p>

        {/* Current Balance Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Coins className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Current balance:</p>
              <p className="text-2xl font-bold text-green-700">{Number(user.token_balance ?? 0)} tokens</p>
            </div>
          </div>
        </div>

        {/* Secure Checkout Badge */}
        <div className="flex items-center justify-end gap-2 mb-6 text-sm text-slate-600">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Secure checkout by Stripe</span>
        </div>

        {/* Token Packs Grid */}
        {availablePacks.length === 0 ?
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Coins className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No token packets available yet. Please check back soon.</p>
          </div> :

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availablePacks.map((pack, idx) =>
          <div
            key={pack.stripe_price_id || idx} // Use stripe_price_id if available, otherwise index
            className="bg-white rounded-xl border-2 border-slate-200 hover:border-green-400 transition-all p-6 flex flex-col">

                <div className="flex items-center gap-3 mb-4">
                  {/* <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Coins className="w-6 h-6 text-green-600" />
                </div> */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{pack.name}</h3>
                    <p className="text-blue-900 font-bold">{pack.display_price}</p>
                    <p className="text-sm text-slate-500">{pack.tokens} tokens</p>
                  </div>
                </div>

                {pack.description &&
            <p className="text-slate-600 text-sm mb-4">{pack.description}</p>
            }

                <div className="mt-auto">
                  <Button
                onClick={() => handleBuyPack(pack)}
                disabled={isCheckingOut} className="bg-blue-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-full hover:bg-green-700">


                    {isCheckingOut ?
                <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </> :

                <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </>
                }
                  </Button>
                </div>
              </div>
          )}
          </div>
        }
      </div>
    </div>);

}