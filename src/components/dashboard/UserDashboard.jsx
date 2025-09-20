import React, { useState, useEffect } from 'react';
import { BlogPost } from '@/api/entities';
import { WebhookReceived } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Inbox, FileText, ChevronsRight, Clock } from 'lucide-react';
import StatCard from './StatCard';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function UserDashboard({ currentUser, selectedUsername }) {
  const [stats, setStats] = useState({ posts: 0, drafts: 0, toEdit: 0 });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentWebhooks, setRecentWebhooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // NEW: robust dedupe helper (keeps newest)
  const dedupeItems = (items, kind) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    // Sort newest first
    const sorted = [...items].sort((a, b) => {
      const dateA = new Date(a.updated_date || a.created_date || 0);
      const dateB = new Date(b.updated_date || b.created_date || 0);
      return dateB.getTime() - dateA.getTime();
    });

    const seen = new Set();
    const out = [];
    for (const it of sorted) {
      const normTitle = (it.title || '').trim().toLowerCase();
      const user = it.user_name || '';
      // Prefer stable keys first
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
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // Fetch all blog posts and all received webhooks
        const [allPosts, allWebhooks] = await Promise.all([
          BlogPost.list("-updated_date"),
          WebhookReceived.list("-created_date")
        ]);

        // This component is designed to show content based on the user's assigned usernames.
        // Even for admins, content will now be filtered by assigned_usernames if they are present.
        const assignedUsernames = currentUser.assigned_usernames || [];
        let filteredPosts = [];
        let filteredWebhooks = [];

        if (assignedUsernames.length > 0) {
          filteredPosts = allPosts.filter(post => 
            post.user_name && assignedUsernames.includes(post.user_name)
          );
          filteredWebhooks = allWebhooks.filter(webhook => 
            webhook.user_name && assignedUsernames.includes(webhook.user_name)
          );
        }
        
        // Apply username filter if provided
        if (selectedUsername) {
          filteredPosts = filteredPosts.filter(p => p.user_name === selectedUsername);
          filteredWebhooks = filteredWebhooks.filter(w => w.user_name === selectedUsername);
        }

        // NEW: dedupe before stats and lists
        const dedupedPosts = dedupeItems(filteredPosts, 'post');
        const dedupedWebhooks = dedupeItems(filteredWebhooks, 'webhook');
        
        // Calculate stats using the deduped data
        const drafts = dedupedPosts.filter(p => p.status === 'draft').length;
        const receivedWebhooks = dedupedWebhooks.filter(w => w.status === 'received').length;
        
        setStats({
          posts: dedupedPosts.length,
          drafts,
          toEdit: receivedWebhooks
        });
        
        // Recent lists from deduped data (already sorted newest first by helper)
        setRecentPosts(dedupedPosts.slice(0, 3));
        setRecentWebhooks(dedupedWebhooks.filter(w => w.status === 'received').slice(0, 3));
        
      } catch (error) {
        console.error("Error fetching user dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser, selectedUsername]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'draft': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const safeDistance = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    try {
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return "—";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="text-slate-600">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Your Activity
        </h2>
        <p className="text-slate-600 mb-8">Here's a snapshot of your content and assigned tasks.</p>
        
        {currentUser.assigned_usernames?.length === 0 && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-sm">
              <strong>Heads Up:</strong> You have no usernames assigned, so you won't see any content here.
              <br />
              Contact your admin to assign you usernames if this is incorrect.
            </p>
          </div>
        )}
        {currentUser.assigned_usernames?.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                <strong>Your assigned usernames:</strong> {currentUser.assigned_usernames?.join(', ')}
                </p>
            </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard title="Your Blog Posts" value={stats.posts} icon={FileText} color="blue" description="Total posts you can access." />
          <StatCard title="Drafts" value={stats.drafts} icon={Edit} color="orange" description="Posts saved as drafts." />
          <StatCard title="Content to Edit" value={stats.toEdit} icon={Inbox} color="violet" description="New content assigned to you." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-slate-900">Your Recent Posts</h3>
              <Link to={createPageUrl("Content")}>
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                  View All <ChevronsRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentPosts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">{post.title}</p>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Clock className="w-3 h-3"/>
                      Updated {safeDistance(post.updated_date || post.created_date)}
                    </p>
                    <p className="text-xs text-slate-500">Username: {post.user_name || 'None'}</p>
                  </div>
                  <Badge className={`border ${getStatusColor(post.status)}`}>{post.status}</Badge>
                </div>
              ))}
              {recentPosts.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  No posts found for your assigned usernames{selectedUsername ? ` for ${selectedUsername}` : ''}.
                  {currentUser.assigned_usernames?.length === 0 && (
                    <span><br />Contact your admin to assign you usernames.</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-slate-900">New Content for You to Edit</h3>
              <Link to={createPageUrl("Webhooks")}>
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                  View All <ChevronsRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentWebhooks.map(webhook => (
                <div key={webhook.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">{webhook.title}</p>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Clock className="w-3 h-3"/>
                      Received {safeDistance(webhook.created_date)}
                    </p>
                    <p className="text-xs text-slate-500">Username: {webhook.user_name || 'None'}</p>
                  </div>
                  <Link to={`${createPageUrl("Editor")}?webhook=${webhook.id}`}>
                    <Button size="sm"> <Edit className="w-4 h-4 mr-2" /> Edit</Button>
                  </Link>
                </div>
              ))}
              {recentWebhooks.length === 0 && (
                <p className="text-slate-500 text-center py-8">
                  No new content assigned to you{selectedUsername ? ` for ${selectedUsername}` : ''}.
                  {currentUser.assigned_usernames?.length === 0 && (
                    <span><br />Contact your admin to assign you usernames.</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}