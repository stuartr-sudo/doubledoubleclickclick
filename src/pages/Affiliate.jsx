import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Affiliate as AffiliateEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DollarSign, Users, TrendingUp, Gift, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export default function Affiliate() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Check if user is already an affiliate
      const affiliates = await AffiliateEntity.filter({ email: currentUser.email });
      if (affiliates.length > 0) {
        setAffiliate(affiliates[0]);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please log in to access the affiliate program</p>
          <Button onClick={() => User.login()}>Log In</Button>
        </div>
      </div>
    );
  }

  // If user is already an affiliate, redirect to dashboard
  if (affiliate) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Welcome Back, Affiliate!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                You're already registered as an affiliate. Access your dashboard to view your stats and manage your account.
              </p>
              <Link to={createPageUrl('AffiliateDashboard')}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Go to Affiliate Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Hero Section with Button */}
        <div className="relative text-center mb-12">
          {/* Become an Affiliate Button - Top Right */}
          <div className="absolute top-0 right-0">
            <Link to={createPageUrl('AffiliateSignup')}>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg">
                Become an Affiliate
              </Button>
            </Link>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Join the DoubleClick Affiliate Program
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4">
            Earn commission by referring customers to DoubleClick. Help others transform their content creation while building your income.
          </p>
          <p className="text-3xl font-bold text-green-500 mb-2">
            EARN 50% COMMISSION FOR 12 MONTHS
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <DollarSign className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle className="text-xl text-slate-900">Generous Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Earn competitive commission on every successful referral. Get paid for bringing value to your audience.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <TrendingUp className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle className="text-xl text-slate-900">Real-Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Monitor your referrals, conversions, and earnings in real-time through your dedicated affiliate dashboard.</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <Gift className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle className="text-xl text-slate-900">Marketing Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Access professionally designed marketing materials to help you promote DoubleClick effectively.</p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-white border border-slate-200 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Sign Up for Free</h3>
                  <p className="text-slate-600">Create your affiliate account and get your unique referral link instantly.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Share Your Link</h3>
                  <p className="text-slate-600">Promote DoubleClick using your referral link on your website, social media, or with your audience.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Earn Commission</h3>
                  <p className="text-slate-600">Receive commission for every customer who signs up and subscribes through your referral link.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Earning?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join our affiliate program today and start earning commission while helping others create better content.
          </p>
          <Link to={createPageUrl('AffiliateSignup')}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100">
              Sign Up as an Affiliate
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-blue-100 text-sm mt-4">
            Already an affiliate? <Link to={createPageUrl('AffiliateLogin')} className="underline font-semibold">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}