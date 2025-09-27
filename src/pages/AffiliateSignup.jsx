import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Affiliate } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Loader2, CheckCircle2, Users, TrendingUp, DollarSign } from 'lucide-react';

export default function AffiliateSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    unique_code: '',
    commission_rate: 20
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const generateUniqueCode = (name, email) => {
    const namepart = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);
    const emailpart = email.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 4);
    const random = Math.random().toString(36).substring(2, 6);
    return `${namepart}${emailpart}${random}`.slice(0, 12);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'name' || name === 'email' ? {
        unique_code: generateUniqueCode(
          name === 'name' ? value : prev.name,
          name === 'email' ? value : prev.email
        )
      } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.unique_code) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if unique code or email already exists
      const existingCode = await Affiliate.filter({ unique_code: formData.unique_code });
      const existingEmail = await Affiliate.filter({ email: formData.email });
      
      if (existingCode.length > 0) {
        toast.error('This referral code is already taken. Please modify it.');
        setIsSubmitting(false);
        return;
      }
      
      if (existingEmail.length > 0) {
        toast.error('An affiliate account with this email already exists.');
        setIsSubmitting(false);
        return;
      }

      await Affiliate.create({
        ...formData,
        is_active: false // Requires admin approval
      });

      setIsSuccess(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for your interest in becoming an affiliate. We'll review your application and get back to you within 24 hours.
            </p>
            <Link to={createPageUrl('Home')}>
              <Button className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to={createPageUrl('Home')} className="flex items-center">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689715479cd170f6c2aa04f2/d056b0101_logo.png" alt="Logo" className="w-8 h-8 rounded-full mr-3" />
              <span className="text-xl font-bold text-slate-900">DoubleClick</span>
            </Link>
            <Link to={createPageUrl('AffiliateLogin')}>
              <Button variant="outline">Affiliate Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Join Our Affiliate Program
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Earn generous commissions by promoting DoubleClick's AI-powered content tools to your audience.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">High Commissions</h3>
              <p className="text-slate-600">Earn up to 30% recurring commission on every sale you refer.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Marketing Support</h3>
              <p className="text-slate-600">Get access to high-converting marketing materials and campaigns.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Real-time Tracking</h3>
              <p className="text-slate-600">Monitor your referrals, conversions, and earnings in real-time.</p>
            </div>
          </div>

          {/* Signup Form */}
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Apply to Become an Affiliate</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unique_code">Preferred Referral Code *</Label>
                    <Input
                      id="unique_code"
                      name="unique_code"
                      value={formData.unique_code}
                      onChange={handleInputChange}
                      placeholder="Your custom referral code"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This will be your unique referral code (e.g., ?ref={formData.unique_code})
                    </p>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}