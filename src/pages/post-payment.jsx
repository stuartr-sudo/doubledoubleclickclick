import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { AppProduct } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function PostPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [user, setUser] = useState(null);
  const [isAnnualPlan, setIsAnnualPlan] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setStatus('error');
        toast.error('No payment session found');
        return;
      }

      try {
        // Fetch current user
        const currentUser = await User.me();
        setUser(currentUser);

        // Check if user has a plan_price_id (payment was successful)
        if (currentUser.plan_price_id) {
          // Fetch the product to check if it's annual
          const products = await AppProduct.filter({ stripe_price_id: currentUser.plan_price_id });
          
          if (products.length > 0) {
            const purchasedProduct = products[0];
            const isAnnual = purchasedProduct.billing_interval === 'year';
            setIsAnnualPlan(isAnnual);
          }

          setStatus('success');
          
          // Auto-redirect after 2 seconds
          setTimeout(() => {
            if (isAnnualPlan) {
              navigate(createPageUrl('Topics'));
            } else {
              navigate(createPageUrl('Dashboard'));
            }
          }, 2000);
        } else {
          setStatus('error');
          toast.error('Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        toast.error('Failed to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [location.search, navigate, isAnnualPlan]);

  const handleContinue = () => {
    if (isAnnualPlan) {
      navigate(createPageUrl('Topics'));
    } else {
      navigate(createPageUrl('Dashboard'));
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Verifying your payment...</h2>
            <p className="text-slate-600">Please wait while we confirm your purchase.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-4">
              We couldn't verify your payment. Please contact support if you believe this is an error.
            </p>
            <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-slate-600 mb-4">
            Thank you for your purchase! Your account has been upgraded.
          </p>
          {isAnnualPlan && (
            <p className="text-blue-600 font-medium mb-4">
              Redirecting you to Topics to get started with your annual plan...
            </p>
          )}
          <Button onClick={handleContinue} className="w-full">
            {isAnnualPlan ? 'Continue to Topics' : 'Continue to Dashboard'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}