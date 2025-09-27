
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { AppProduct } from "@/api/entities";
import { PricingFaq } from "@/api/entities"; // Import the new entity
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/api/functions";
import { createCustomerPortalSession } from "@/api/functions";
import PricingFaqSection from "@/components/common/PricingFaqSection"; // Import the FAQ component

function PlanCard({ plan, billing, onBuy, isCheckingOut }) {
  if (!plan) return null;

  const bgClass = plan.is_best_value ?
  `bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg transform scale-105` :
  `bg-white border border-slate-200`;

  const buttonClass = plan.is_best_value ?
  `bg-blue-600 hover:bg-blue-700 text-white` :
  `bg-slate-800 hover:bg-slate-900 text-white`;

  const price = plan.display_price;
  const billingText = plan.annual_price_per_month && billing === 'year' ?
  'Billed annually' :
  `Billed ${billing}`;

  const displayPrice = plan.annual_price_per_month && billing === 'year' ?
  plan.annual_price_per_month :
  price;

  return (
    <div className={`p-5 rounded-xl flex flex-col ${bgClass} transition-all duration-300`}>
      {plan.is_best_value &&
      <div className="text-center mb-3">
          <span className="bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">BEST VALUE</span>
        </div>
      }
      <h3 className="text-xl font-bold text-center text-slate-800">{plan.name}</h3>
      <div className="text-center mt-2">
        <span className="text-4xl font-extrabold text-slate-900">{displayPrice}</span>
        <span className="text-slate-500"> / month</span>
      </div>
      <p className="text-center text-slate-500 mt-1 text-sm">{billingText}</p>
      
      <ul className="mt-4 space-y-2 text-slate-600 flex-grow text-sm">
        {(plan.features || []).map((feature, i) =>
        <li key={i} className="flex items-start">
            <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        )}
      </ul>

      <Button
        onClick={() => onBuy(plan.stripe_price_id)}
        disabled={isCheckingOut === plan.stripe_price_id} className="bg-blue-900 text-white mt-4 px-4 py-2 text-base font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-full hover:bg-blue-800">


        {isCheckingOut === plan.stripe_price_id ?
        <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Processing...</> :

        "Get Started"
        }
      </Button>
    </div>);

}

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [faqs, setFaqs] = useState([]); // State for FAQs
  const [billing, setBilling] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(null);
  const [user, setUser] = useState(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const navigate = useNavigate();

  // REMOVED: The local useEffect for affiliate tracking is no longer needed.
  // It is now handled globally in Layout.js.

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [user, products, faqData] = await Promise.all([
        User.me().catch(() => null),
        AppProduct.filter({ is_active: true }).catch(() => []),
        PricingFaq.filter({ is_active: true }, 'sort_order').catch(() => []) // Fetch active FAQs
        ]);
        setUser(user);

        const sortedProducts = products.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setPlans(sortedProducts);
        setFaqs(faqData); // Set the fetched FAQs

      } catch (error) {
        console.error("Error fetching plans or FAQs:", error);
        toast.error("Could not load pricing page data.");
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleBuy = async (priceId) => {
    if (!user) {
      toast.info("Please log in to make a purchase.");
      return;
    }
    
    setIsCheckingOut(priceId);
    try {
      // Get affiliate ref from localStorage (now reliably set by Layout.js)
      const affiliateRef = localStorage.getItem('affiliate_ref');
      
      console.log('=== PRICING CHECKOUT DEBUG ===');
      console.log('🎯 Affiliate ref from localStorage:', affiliateRef);
      console.log('🎯 Sending to checkout session:', { priceId, affiliateRef });
      
      const { data } = await createCheckoutSession({ 
        priceId, 
        affiliateRef: affiliateRef || null
      });
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.stripe_customer_id) {
      toast.error("No subscription found to manage.");
      return;
    }

    setIsManagingSubscription(true);
    try {
      const { data } = await createCustomerPortalSession({
        returnUrl: window.location.href
      });

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create customer portal session.");
      }
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      toast.error("Failed to access subscription management.");
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const getPlansForBilling = () => {
    const growth = plans.find((p) => p.plan_key === 'growth' && p.billing_interval === billing);
    const brand = plans.find((p) => p.plan_key === 'brand' && p.billing_interval === billing);
    const agency = plans.find((p) => p.plan_key === 'agency' && p.billing_interval === billing);
    return { growth, brand, agency };
  };

  const { growth, brand, agency } = getPlansForBilling();

  const hasActiveSubscription = user && user.subscription_status === 'active';

  return (
    <div className="bg-slate-50 py-6 md:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Choose a Plan that Suits You
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Unlock powerful features with our flexible plans. All plans come with a 7-day money-back guarantee.
          </p>
        </div>

        <div className="flex justify-center mb-6">
            <div className="relative bg-slate-200 p-1 rounded-full flex items-center">
              {/* Animated background slider */}
              <div
              className={`absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out ${
              billing === 'month' ?
              'left-1 right-[50%]' :
              'left-[50%] right-1'}`
              } />

              
              {/* Monthly button */}
              <button
              onClick={() => setBilling('month')}
              className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              billing === 'month' ?
              'text-slate-800' :
              'text-slate-600 hover:text-slate-800'}`
              }>

                Monthly
              </button>
              
              {/* Yearly button */}
              <button
              onClick={() => setBilling('year')}
              className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              billing === 'year' ?
              'text-slate-800' :
              'text-slate-600 hover:text-slate-800'}`
              }>

                Yearly
              </button>
            </div>
          </div>
          {billing === 'year' &&
        <p className="mt-2 mb-8 text-blue-600 font-semibold text-sm text-center">Save up to 20% with yearly billing!</p>
        }
        

        {/* Active subscription banner - HIDDEN */}
        {/* 
          {hasActiveSubscription && (
             <div className="max-w-4xl mx-auto px-6 mb-8">
               <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                 <p className="text-blue-700 font-medium mb-3">You have an active subscription.</p>
                 <Button 
                   onClick={handleManageSubscription}
                   disabled={isManagingSubscription}
                   variant="outline" 
                   className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                 >
                   {isManagingSubscription ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Loading...
                     </>
                   ) : (
                     "Manage Subscription"
                   )}
                 </Button>
               </div>
             </div>
          )}
          */}

        {isLoading ?
        <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin w-8 h-8 text-slate-400" />
          </div> :

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start mt-8">
            <PlanCard plan={growth} billing={billing} onBuy={handleBuy} isCheckingOut={isCheckingOut} />
            <PlanCard plan={brand} billing={billing} onBuy={handleBuy} isCheckingOut={isCheckingOut} />
            <PlanCard plan={agency} billing={billing} onBuy={handleBuy} isCheckingOut={isCheckingOut} />
          </div>
        }

        <PricingFaqSection faqs={faqs} />
      </div>
    </div>);

}
