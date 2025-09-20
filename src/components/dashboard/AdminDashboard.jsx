
import React, { useState, useEffect } from 'react';
import { BlogPost } from '@/api/entities';
import { WebhookReceived } from '@/api/entities';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Users, FileText, Rss, Video, Settings, Inbox, Edit, Copy, Check, ShoppingBag, Link as LinkIcon, Star } from 'lucide-react';
import StatCard from './StatCard';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const WebhookInfoCard = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhook`);
    }
  }, []);

  const handleCopy = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setIsCopied(true);
    toast.success("Webhook URL copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!webhookUrl) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm col-span-1 sm:col-span-2 w-full h-full hover:bg-slate-50 transition-colors">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Rss className="w-5 h-5 text-emerald-600" />
        Your N8N Webhook Endpoint
      </h3>
      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <Input
          readOnly
          value={webhookUrl}
          className="bg-transparent border-none text-slate-900 font-mono text-sm"
        />
        <Button onClick={handleCopy} size="sm" variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">
          {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <p className="text-xs text-slate-600 mt-3">
        Use this URL in your N8N 'HTTP Request' node with the <code className="bg-slate-100 px-1 rounded">POST</code> method and a JSON body.
      </p>
    </div>
  );
};

export default function AdminDashboard({ currentUser, selectedUsername }) {
  const [stats, setStats] = useState({ totalPosts: 0, totalWebhooks: 0, drafts: 0, totalUsers: 0 });
  const [allUsers, setAllUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // NEW: robust dedupe helper (keeps newest)
  const dedupeItems = (items, kind) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const sorted = [...items].sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0));
    const seen = new Set();
    const out = [];
    for (const it of sorted) {
      const normTitle = (it.title || '').trim().toLowerCase();
      const user = it.user_name || '';
      const key =
        (it.processing_id && `${kind}:proc:${it.processing_id}`) ||
        (it.id && `${kind}:id:${it.id}`) ||
        `${kind}:user:${user}:title:${normTitle}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
    return out;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [posts, webhooks, users] = await Promise.all([
          BlogPost.list("-updated_date"),
          WebhookReceived.list("-created_date"),
          User.list()
        ]);
        
        // Apply optional username filter
        const p = selectedUsername ? posts.filter(x => x.user_name === selectedUsername) : posts;
        const w = selectedUsername ? webhooks.filter(x => x.user_name === selectedUsername) : webhooks;

        // NEW: dedupe posts and webhooks
        const pClean = dedupeItems(p, 'post');
        const wClean = dedupeItems(w, 'webhook');
        
        const totalPosts = pClean.length;
        const totalWebhooks = wClean.length;
        const drafts = pClean.filter(post => post.status === 'draft').length;
        const totalUsers = users.length;
        
        setStats({
          totalPosts,
          totalWebhooks,
          drafts,
          totalUsers
        });

        setAllUsers(users);
        
        // Create combined activity from deduped data only
        const combinedActivity = [];
        
        // Add recent posts to activity
        pClean.slice(0, 3).forEach(post => {
          combinedActivity.push({
            ...post,
            type: 'post',
            date: post.updated_date || post.created_date,
            activity_title: post.title || 'Untitled Post'
          });
        });
        
        // Add recent webhooks to activity  
        wClean.slice(0, 3).forEach(webhook => {
          combinedActivity.push({
            ...webhook,
            type: 'webhook',
            date: webhook.created_date,
            activity_title: webhook.title || 'Untitled Webhook'
          });
        });

        // Sort by date and take top 5
        const sortedActivity = combinedActivity
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        setRecentActivity(sortedActivity);

      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedUsername]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="text-slate-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Overview</h2>
        <p className="text-slate-600 mb-8">System-wide statistics and quick actions.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Posts" value={stats.totalPosts} icon={FileText} color="blue" description="All blog posts in system" />
          <StatCard title="Total Webhooks" value={stats.totalWebhooks} icon={Inbox} color="orange" description="All webhook content" />
          <StatCard title="Posts in Draft" value={stats.drafts} icon={Edit} color="amber" description="Content waiting to be published" />
          <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="violet" description="Registered users" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No recent activity</p>
              ) : (
                recentActivity.map((item, index) => (
                  <div key={`${item.type}-${item.id}-${index}`} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        {item.type === 'webhook' ? <Inbox className="w-4 h-4 text-orange-500" /> : <FileText className="w-4 h-4 text-blue-600" />}
                        {item.activity_title}
                      </p>
                      <p className="text-sm text-slate-600">
                        {item.type === 'webhook' ? 'Content received from' : 'Post updated by'} {item.user_name || 'Unknown'} • {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                      </p>
                    </div>
                    <Link to={item.type === 'webhook' ? `${createPageUrl("Editor")}?webhook=${item.id}` : `${createPageUrl("Editor")}?post=${item.id}`}>
                      <Button size="sm"><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-4">
              <Link
                to={createPageUrl("AccountSettings")}
                className="block h-full min-h-[140px] sm:min-h-[160px] bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-full items-center gap-4">
                  <Settings className="w-8 h-8 text-slate-700 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">Account Management</h3>
                    <p className="text-slate-600 text-sm">Manage your profile, name, and preferences.</p>
                  </div>
                </div>
              </Link>

              <Link
                to={createPageUrl("ProductManager")}
                className="block h-full min-h-[140px] sm:min-h-[160px] bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-full items-center gap-4">
                  <ShoppingBag className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">Product Manager</h3>
                    <p className="text-slate-600 text-sm">Add and edit products to feature in content.</p>
                  </div>
                </div>
              </Link>

              <Link
                to={createPageUrl("AmazonTestimonials")}
                className="block h-full min-h-[140px] sm:min-h-[160px] bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-full items-center gap-4">
                  <Star className="w-8 h-8 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">Testimonials</h3>
                    <p className="text-slate-600 text-sm">Import and manage testimonials for social proof.</p>
                  </div>
                </div>
              </Link>

              <Link
                to={createPageUrl("SitemapManager")}
                className="block h-full min-h-[140px] sm:min-h-[160px] bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-full items-center gap-4">
                  <LinkIcon className="w-8 h-8 text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">Manage Sitemaps</h3>
                    <p className="text-slate-600 text-sm">Add, edit, or remove sitemaps for the internal linking tool.</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
