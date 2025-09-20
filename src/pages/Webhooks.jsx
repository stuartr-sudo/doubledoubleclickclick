
import React, { useState, useEffect } from "react";
import { WebhookReceived } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Edit, Search, Inbox, Calendar, ExternalLink, Users, Rss, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const WebhookEndpointDisplay = () => {
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
    <div className="bg-slate-900/80 p-3 rounded-lg border border-white/10 max-w-md mx-auto mb-6">
      <div className="flex items-center gap-2">
        <code className="text-emerald-400 break-all text-sm">{webhookUrl}</code>
        <Button onClick={handleCopy} size="icon" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 flex-shrink-0">
          {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};


export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
        if (selectedUser) {
            loadWebhooks();
        } else {
            setWebhooks([]); // Clear if no user selected
        }
    } else if (currentUser) {
        loadWebhooksForCurrentUser();
    }
  }, [selectedUser, currentUser]);

  const loadInitialData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (user?.role === 'admin') {
        const allWebhooks = await WebhookReceived.list("-created_date");
        const uniqueUsers = [...new Set(allWebhooks
          .map(webhook => webhook.user_name)
          .filter(name => name)
        )];
        setAvailableUsers(uniqueUsers);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
    setIsLoading(false);
  };

  const loadWebhooks = async () => {
    if (!selectedUser) return;
    
    try {
      // This part is for admins filtering by a selected user
      const fetchedWebhooks = await WebhookReceived.filter(
        { user_name: selectedUser }, 
        "-created_date"
      );
      setWebhooks(fetchedWebhooks);
    } catch (error) {
      console.error("Error loading webhooks:", error);
    }
  };

  const loadWebhooksForCurrentUser = async () => {
    if (!currentUser) return;
    try {
        const [webhooksCreated, webhooksAssigned] = await Promise.all([
            WebhookReceived.filter({ created_by: currentUser.email }, "-created_date"),
            WebhookReceived.filter({ assigned_to_email: currentUser.email }, "-created_date")
        ]);

        const combined = [...webhooksCreated, ...webhooksAssigned];
        const uniqueWebhooks = Array.from(new Set(combined.map(w => w.id))).map(id => {
            return combined.find(w => w.id === id);
        });

        setWebhooks(uniqueWebhooks);
    } catch (error) {
        console.error("Error loading webhooks for current user:", error);
    }
  }

  const filteredWebhooks = webhooks.filter(webhook =>
    webhook.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webhook.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      case 'editing': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'received': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const handleEdit = (webhook) => {
    console.log('Editing webhook:', webhook); // Debug log
    navigate(`${createPageUrl("Editor")}?webhook=${webhook.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="backdrop-blur-xl bg-white/5 rounded-2xl h-32 border border-white/10"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
              Received Content
            </h1>
            <p className="text-white/70 mt-1">Content received via webhooks from N8N</p>
            {currentUser?.role === 'admin' && (
              <p className="text-blue-400 text-sm mt-1">Admin View - All Content</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* User Filter for Admins */}
        {currentUser?.role === 'admin' && (
          <div className="mb-6 backdrop-blur-xl bg-white/5 p-4 rounded-xl border border-white/10">
             <label className="block text-sm font-medium text-white/80 mb-2">Filter by User</label>
            <div className="flex items-center gap-4">
              <Users className="w-5 h-5 text-white/60" />
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-64 bg-white/10 border-white/20 text-white backdrop-blur-sm">
                  <SelectValue placeholder="Select a user to view content" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 border-white/20 backdrop-blur-xl">
                  {availableUsers.map((userName) => (
                    <SelectItem 
                      key={userName} 
                      value={userName}
                      className="text-white hover:bg-white/10"
                    >
                      {userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser && (
                <Badge variant="outline" className="border-white/30 text-white">
                  Showing: {selectedUser}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Webhooks List */}
        <div className="space-y-4">
          {currentUser?.role === 'admin' && !selectedUser ? (
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-12 text-center shadow-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-600 to-gray-700 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Select a User</h3>
              <p className="text-white/70 mb-6">Choose a user from the dropdown above to view their webhook content</p>
              <div className="text-center text-white/70 mb-4">
                Send a <code className="bg-white/10 px-1 rounded">POST</code> request to this endpoint:
              </div>
              <WebhookEndpointDisplay />
            </div>
          ) : filteredWebhooks.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-12 text-center shadow-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-600 to-gray-700 flex items-center justify-center">
                <Inbox className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No content for {selectedUser || currentUser?.full_name || 'this user'}</h3>
              <p className="text-white/70 mb-6">No webhook content has been received yet.</p>
              <div className="text-center text-white/70 mb-4">
                To get started, send a <code className="bg-white/10 px-1 rounded">POST</code> request to:
              </div>
              <WebhookEndpointDisplay />
            </div>
          ) : (
            filteredWebhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {webhook.title || "Untitled Content"}
                      </h3>
                      <Badge className={`border ${getStatusColor(webhook.status)}`}>
                        {webhook.status}
                      </Badge>
                      {webhook.user_name && (
                        <Badge variant="outline" className="border-white/30 text-white/80">
                          {webhook.user_name}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(webhook.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      {webhook.source_url && (
                        <a 
                          href={webhook.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-white/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Source
                        </a>
                      )}
                      {webhook.assigned_to_email && (
                        <span className="text-blue-400">
                          Assigned to: {webhook.assigned_to_email}
                        </span>
                      )}
                    </div>

                    <div className="text-white/80 line-clamp-2 mb-4">
                      <div dangerouslySetInnerHTML={{ 
                        __html: webhook.content?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' 
                      }} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => handleEdit(webhook)}
                      className="bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
