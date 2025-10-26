import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, DollarSign, Coins, CheckCircle2, AlertCircle } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment Form Component (inside Stripe Elements context)
function PaymentForm({ amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/balance-top-up?success=true',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        toast.success(`Successfully added $${amount.toFixed(2)} to your balance!`);
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('An error occurred during payment');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <DollarSign className="mr-2 h-4 w-4" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function BalanceTopUp() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const quickAddAmounts = [10, 25, 50, 100, 250];

  useEffect(() => {
    loadData();
    
    // Listen for balance updates
    const handleBalanceUpdate = (event) => {
      setCurrentBalance(event.detail.newBalance);
    };
    
    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, []);

  const loadData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // DEBUG: Log what we're fetching
      console.log('🔄 Loading user data...');
      
      const fetchedUser = await User.me();
      
      // DEBUG: Log the fetched data
      console.log('👤 User data loaded:', {
        email: fetchedUser.email,
        account_balance: fetchedUser.account_balance,
        balance_type: typeof fetchedUser.account_balance
      });
      
      setUser(fetchedUser);
      const balance = parseFloat(fetchedUser.account_balance) || 0;
      setCurrentBalance(balance);
      
      // DEBUG: Log the parsed balance
      console.log('💰 Parsed balance:', balance);
      
      if (forceRefresh) {
        toast.success(`Balance refreshed: $${balance.toFixed(2)}`);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      toast.error("Failed to load account data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 10) {
        setSelectedAmount(numValue);
      } else {
        setSelectedAmount(null);
      }
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedAmount || selectedAmount < 10) {
      toast.error("Minimum top-up amount is $10.00");
      return;
    }

    if (selectedAmount > 10000) {
      toast.error("Maximum top-up amount is $10,000.00");
      return;
    }

    setIsCreatingPayment(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please log in to add funds");
        return;
      }

      const response = await fetch('/api/balance/add-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: selectedAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      setClientSecret(data.client_secret);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error.message || "Failed to initiate payment. Please try again.");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setSelectedAmount(null);
    setCustomAmount("");
    loadData(); // Refresh balance
  };

  const handlePaymentCancel = () => {
    setClientSecret(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Add Funds to Your Account</h1>
          <p className="text-slate-600">
            Add funds to your account to use AI-powered features. Pay only for what you use.
          </p>
        </div>

        {/* Current Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Current Balance</p>
                <p className="text-4xl font-bold text-slate-900">
                  ${currentBalance.toFixed(2)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadData(true)}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  🔄 Refresh Balance
                </Button>
              </div>
              <Coins className="h-16 w-16 text-indigo-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {!clientSecret ? (
          /* Amount Selection */
          <>
            {/* Quick Add Buttons */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Quick Add
                </CardTitle>
                <CardDescription>
                  Select a preset amount to add to your balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {quickAddAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                      onClick={() => handleQuickAdd(amount)}
                      className={selectedAmount === amount && !customAmount ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Amount */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Custom Amount</CardTitle>
                <CardDescription>
                  Enter any amount ($10 minimum, $10,000 maximum)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        className="pl-8 text-lg"
                      />
                    </div>
                    {customAmount && parseFloat(customAmount) < 10 && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Minimum $10.00
                      </p>
                    )}
                    {customAmount && parseFloat(customAmount) > 10000 && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Maximum $10,000.00
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proceed Button */}
            <Button
              onClick={handleProceedToPayment}
              disabled={!selectedAmount || selectedAmount < 10 || isCreatingPayment}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg"
            >
              {isCreatingPayment ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Setting up payment...
                </>
              ) : (
                <>
                  Proceed to Payment
                  {selectedAmount && ` - $${selectedAmount.toFixed(2)}`}
                </>
              )}
            </Button>

            {/* Pricing Info */}
            <Card className="mt-6 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-lg">Feature Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex justify-between">
                    <span>AI Title Rewrite:</span>
                    <span className="font-medium">$0.10</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Content Analysis:</span>
                    <span className="font-medium">$0.15</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Image Generation:</span>
                    <span className="font-medium">$0.25</span>
                  </p>
                  <p className="flex justify-between">
                    <span>AI Imagineer:</span>
                    <span className="font-medium">$0.29</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-4">
                    Most features cost between $0.10 and $0.29 per use.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Payment Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Complete Payment
              </CardTitle>
              <CardDescription>
                Adding ${selectedAmount?.toFixed(2)} to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#4f46e5',
                    }
                  }
                }}
              >
                <PaymentForm 
                  amount={selectedAmount} 
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

