import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Affiliate } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Loader2, LogIn } from 'lucide-react';

export default function AffiliateLogin() {
  const [email, setEmail] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const affiliateData = localStorage.getItem('affiliate_session');
    if (affiliateData) {
      navigate(createPageUrl('AffiliateDashboard'));
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !uniqueCode) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsLogging(true);
    try {
      const affiliates = await Affiliate.filter({ 
        email: email.trim().toLowerCase(),
        unique_code: uniqueCode.trim()
      });
      
      if (affiliates.length === 0) {
        toast.error('Invalid credentials. Please check your email and referral code.');
        setIsLogging(false);
        return;
      }

      const affiliate = affiliates[0];
      if (!affiliate.is_active) {
        toast.error('Your affiliate account is pending approval or has been deactivated.');
        setIsLogging(false);
        return;
      }

      // Store affiliate session
      localStorage.setItem('affiliate_session', JSON.stringify({
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        unique_code: affiliate.unique_code,
        commission_rate: affiliate.commission_rate,
        loginTime: new Date().toISOString()
      }));

      toast.success('Welcome back!');
      navigate(createPageUrl('AffiliateDashboard'));
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to={createPageUrl('Home')} className="flex items-center">
              <img src="/logo.svg" alt="DoubleClick Logo" className="w-8 h-8 rounded-full mr-3" />
              <span className="text-xl font-bold text-slate-900">DoubleClick</span>
            </Link>
            <Link to={createPageUrl('AffiliateSignup')}>
              <Button variant="outline">Become an Affiliate</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <LogIn className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Affiliate Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unique_code">Referral Code</Label>
                  <Input
                    id="unique_code"
                    value={uniqueCode}
                    onChange={(e) => setUniqueCode(e.target.value)}
                    placeholder="Enter your referral code"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLogging} className="w-full">
                  {isLogging && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sign In
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <Link to={createPageUrl('AffiliateSignup')} className="text-blue-600 hover:underline text-sm">
                  Don't have an account? Apply here
                </Link>
              </div>

              <Alert className="mt-4">
                <AlertDescription className="text-sm">
                  Use your email address and unique referral code to access your affiliate dashboard.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}