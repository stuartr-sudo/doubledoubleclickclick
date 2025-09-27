
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { AffiliatePack } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { 
  DollarSign, Users, TrendingUp, Copy, LogOut, 
  ExternalLink, Download, Image, Video, FileText,
  Calendar, Check, Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function AffiliateDashboard() {
  const [affiliate, setAffiliate] = useState(null);
  const [stats, setStats] = useState({
    referralCount: 0,
    conversionCount: 0,
    totalEarned: 0,
    pendingEarnings: 0
  });
  const [referredUsers, setReferredUsers] = useState([]);
  const [marketingPacks, setMarketingPacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const navigate = useNavigate();

  const referralLink = affiliate ? `https://app.doubleclick.work/?ref=${affiliate.unique_code}` : '';

  // loadDashboardData is wrapped in useCallback to ensure stability for its caller (checkAuthentication)
  const loadDashboardData = useCallback(async (affiliateId, commissionRate) => {
    setIsLoading(true);
    try {
      const [users, packs] = await Promise.all([
        User.filter({ referred_by_affiliate_id: affiliateId }, '-created_date'),
        AffiliatePack.filter({ is_active: true }, 'sort_order')
      ]);

      setReferredUsers(users || []);
      setMarketingPacks(packs || []);

      // Calculate stats
      const conversions = users.filter(u => u.plan_price_id).length;
      const totalEarned = users.reduce((sum, u) => {
        if (u.plan_price_id && u.subscription_status === 'active') {
          // Use commissionRate passed as an argument to avoid 'affiliate' state as a dependency
          return sum + (commissionRate || 20) * 10; // Example calculation
        }
        return sum;
      }, 0);

      setStats({
        referralCount: users.length,
        conversionCount: conversions,
        totalEarned,
        pendingEarnings: 0 // You'd calculate pending payments here
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setReferredUsers, setMarketingPacks, setStats]); // setState functions are guaranteed stable by React

  const checkAuthentication = useCallback(() => {
    const affiliateSession = localStorage.getItem('affiliate_session');
    if (!affiliateSession) {
      navigate(createPageUrl('AffiliateLogin'));
      return;
    }

    try {
      const affiliateData = JSON.parse(affiliateSession);
      setAffiliate(affiliateData);
      // Pass the commission_rate from the parsed affiliateData
      loadDashboardData(affiliateData.id, affiliateData.commission_rate);
    } catch (error) {
      console.error('Invalid session:', error);
      localStorage.removeItem('affiliate_session');
      navigate(createPageUrl('AffiliateLogin'));
    }
  }, [navigate, loadDashboardData, setAffiliate]); // navigate and setAffiliate are stable, loadDashboardData is now stable

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]); // checkAuthentication is now a stable function

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopySuccess(false), 2000);
  }, [referralLink, setCopySuccess]); // referralLink depends on 'affiliate' state, setCopySuccess is stable setState

  const handleLogout = useCallback(() => {
    localStorage.removeItem('affiliate_session');
    navigate(createPageUrl('AffiliateLogin'));
  }, [navigate]); // navigate is stable

  const getStatusBadge = useCallback((status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      canceled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status || 'none'}
      </Badge>
    );
  }, []); // No external dependencies

  const getFileIcon = useCallback((type) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  }, []); // No external dependencies

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689715479cd170f6c2aa04f2/d056b0101_logo.png" alt="Logo" className="w-8 h-8 rounded-full mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Affiliate Dashboard</h1>
                <p className="text-sm text-slate-600">Welcome back, {affiliate?.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Referral Link Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-slate-100 px-3 py-2 rounded text-sm">
                {referralLink}
              </code>
              <Button onClick={handleCopyLink} size="sm">
                {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copySuccess ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Share this link to earn {affiliate?.commission_rate}% commission on every sale.
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Referrals</p>
                  <div className="text-2xl font-bold">{stats.referralCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Conversions</p>
                  <div className="text-2xl font-bold">{stats.conversionCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Earned</p>
                  <div className="text-2xl font-bold">${(stats.totalEarned / 100).toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <div className="text-2xl font-bold">${(stats.pendingEarnings / 100).toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="marketing">Marketing Materials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                {referredUsers.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No referrals yet. Start sharing your link to see results here!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Signup Date</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Commission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{format(new Date(user.created_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{user.plan_price_id ? 'Paid Plan' : 'Free'}</TableCell>
                          <TableCell>{getStatusBadge(user.subscription_status)}</TableCell>
                          <TableCell>
                            {user.plan_price_id && user.subscription_status === 'active' 
                              ? `$${((affiliate?.commission_rate || 20) * 0.1).toFixed(2)}`  // Simplified calculation
                              : '$0.00'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="marketing" className="space-y-4">
            {marketingPacks.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No marketing materials available yet. Check back soon!
                </AlertDescription>
              </Alert>
            ) : (
              marketingPacks.map((pack) => (
                <Card key={pack.id}>
                  <CardHeader>
                    <CardTitle>{pack.title}</CardTitle>
                    <p className="text-slate-600">{pack.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pack.materials.map((material, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-slate-50">
                          <div className="flex items-center mb-2">
                            {getFileIcon(material.type)}
                            <span className="ml-2 font-medium">{material.title}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{material.description}</p>
                          <Button size="sm" asChild>
                            <a href={material.url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
