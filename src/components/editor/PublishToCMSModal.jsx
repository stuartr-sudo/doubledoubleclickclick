import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, Settings, ExternalLink, Video, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import VideoModal from "@/components/common/VideoModal";

export default function PublishToCMSModal({ isOpen, onClose, title, html }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showHelpVideo, setShowHelpVideo] = useState(false);
  const [helpVideoUrl, setHelpVideoUrl] = useState("");
  
  const [fetchingBlogs, setFetchingBlogs] = useState(false);
  const [availableBlogs, setAvailableBlogs] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState("");

  const [form, setForm] = useState({
    provider: "shopify",
    name: "",
    access_token: "",
    site_domain: "",
    blog_id: "",
    username: "",
    password: "",
    user_name: ""
  });

  // ONLY load when modal opens - NO OTHER TIME
  useEffect(() => {
    if (isOpen) {
      loadCredentials();
      loadHelpVideo();
    } else {
      // Reset when closed
      setShowAddForm(false);
      setAvailableBlogs([]);
      setSelectedBlogId("");
    }
  }, [isOpen]);

  const loadHelpVideo = async () => {
    try {
      const settings = await base44.entities.AppSettings.list();
      const videoSetting = settings.find(s => s.key === "shopify_setup_video");
      if (videoSetting?.value) {
        setHelpVideoUrl(videoSetting.value);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const assignedUsernames = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
      
      if (assignedUsernames.length === 0) {
        setCredentials([]);
        setLoading(false);
        return;
      }

      // Simple single call - filter client-side
      const allCreds = await base44.entities.IntegrationCredential.list();
      const userCreds = allCreds.filter(cred => 
        cred.user_name && assignedUsernames.includes(cred.user_name)
      );
      
      setCredentials(userCreds);
      
      // Set default username
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get('post');
      let targetUsername = assignedUsernames[0] || "";

      if (postId) {
        try {
          const posts = await base44.entities.BlogPost.filter({ id: postId });
          if (posts?.[0]?.user_name) {
            targetUsername = posts[0].user_name;
          }
        } catch (e) {
          // Silent
        }
      }
      
      setForm(prev => ({ ...prev, user_name: targetUsername }));
      
    } catch (error) {
      console.error("Error loading credentials:", error);
      toast.error("Failed to load credentials");
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchBlogs = async () => {
    if (!form.access_token || !form.site_domain) {
      toast.error("Please enter Access Token and Store Domain first");
      return;
    }

    setFetchingBlogs(true);
    setAvailableBlogs([]);
    setSelectedBlogId("");
    
    try {
      const { data } = await base44.functions.invoke('fetchShopifyBlogs', {
        access_token: form.access_token,
        store_domain: form.site_domain
      });

      if (data.success && data.blogs?.length > 0) {
        setAvailableBlogs(data.blogs);
        toast.success(`Found ${data.blogs.length} blog${data.blogs.length === 1 ? '' : 's'}`);
        
        if (data.blogs.length === 1) {
          setSelectedBlogId(data.blogs[0].id);
          setForm(prev => ({ ...prev, blog_id: data.blogs[0].id }));
        }
      } else {
        toast.message("No blogs found for this Shopify store");
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs");
    } finally {
      setFetchingBlogs(false);
    }
  };

  const handleBlogSelect = (blogId) => {
    setSelectedBlogId(blogId);
    setForm(prev => ({ ...prev, blog_id: blogId }));
  };

  const handleAddCredential = async () => {
    if (!form.name || !form.provider) {
      toast.error("Please provide a name and select a provider");
      return;
    }

    if (form.provider === "shopify" && (!form.access_token || !form.site_domain || !form.blog_id)) {
      toast.error("Shopify requires an access token, store domain, and blog selection");
      return;
    }

    if (form.provider === "wordpress_org" && (!form.site_domain || !form.username || !form.password)) {
      toast.error("WordPress.org requires a site domain, username, and application password");
      return;
    }

    setLoading(true);
    try {
      const credentialData = {
        provider: form.provider,
        name: form.name.trim(),
        user_name: form.user_name || currentUser?.assigned_usernames?.[0] || "",
        ...(form.access_token && { access_token: form.access_token.trim() }),
        ...(form.site_domain && { site_domain: form.site_domain.trim() }),
        ...(form.blog_id && { blog_id: form.blog_id.trim() }),
        ...(form.username && { username: form.username.trim() }),
        ...(form.password && { password: form.password.trim() })
      };

      await base44.entities.IntegrationCredential.create(credentialData);
      toast.success("Credential added successfully");
      
      setForm({
        provider: "shopify",
        name: "",
        access_token: "",
        site_domain: "",
        blog_id: "",
        username: "",
        password: "",
        user_name: currentUser?.assigned_usernames?.[0] || ""
      });
      setAvailableBlogs([]);
      setSelectedBlogId("");
      setShowAddForm(false);
      
      await loadCredentials();
    } catch (error) {
      console.error("Error adding credential:", error);
      toast.error("Failed to add credential");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (id) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;
    
    setLoading(true);
    try {
      await base44.entities.IntegrationCredential.delete(id);
      toast.success("Credential deleted");
      await loadCredentials();
    } catch (error) {
      console.error("Error deleting credential:", error);
      toast.error("Failed to delete credential");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (credential) => {
    setPublishing(true);
    try {
      const { data } = await base44.functions.invoke('securePublish', {
        provider: credential.provider,
        credentialId: credential.id,
        title: title || "Untitled",
        html: html || "",
        text: String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      });

      if (data?.success) {
        toast.success(`Published to ${credential.name}`);
        onClose();
      } else {
        toast.error(data?.error || "Publishing failed");
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Publish to CMS</DialogTitle>
              {helpVideoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelpVideo(true)}
                  className="flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Setup Help
                </Button>
              )}
            </div>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.length === 0 && !showAddForm && (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No publishing destinations configured</p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Publishing Destination
                  </Button>
                </div>
              )}

              {credentials.length > 0 && !showAddForm && (
                <>
                  <div className="space-y-3">
                    {credentials.map((cred) => (
                      <div key={cred.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{cred.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{cred.provider}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handlePublish(cred)}
                            disabled={publishing}
                          >
                            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCredential(cred.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Destination
                  </Button>
                </>
              )}

              {showAddForm && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">Add Publishing Destination</h3>
                  
                  <div>
                    <Label>Platform</Label>
                    <Select value={form.provider} onValueChange={(v) => setForm({...form, provider: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shopify">Shopify</SelectItem>
                        <SelectItem value="wordpress_org">WordPress.org</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Connection Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      placeholder="My Shopify Store"
                    />
                  </div>

                  {form.provider === "shopify" && (
                    <>
                      <div>
                        <Label>Store Domain</Label>
                        <Input
                          value={form.site_domain}
                          onChange={(e) => setForm({...form, site_domain: e.target.value})}
                          placeholder="mystore.myshopify.com"
                        />
                      </div>
                      
                      <div>
                        <Label>Access Token</Label>
                        <Input
                          type="password"
                          value={form.access_token}
                          onChange={(e) => setForm({...form, access_token: e.target.value})}
                          placeholder="shpat_..."
                        />
                      </div>

                      <Button
                        onClick={handleFetchBlogs}
                        disabled={fetchingBlogs || !form.access_token || !form.site_domain}
                        variant="outline"
                        className="w-full"
                      >
                        {fetchingBlogs ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Fetching Blogs...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Fetch Available Blogs
                          </>
                        )}
                      </Button>

                      {availableBlogs.length > 0 && (
                        <div>
                          <Label>Select Blog</Label>
                          <Select value={selectedBlogId} onValueChange={handleBlogSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a blog" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableBlogs.map((blog) => (
                                <SelectItem key={blog.id} value={blog.id}>
                                  {blog.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  {form.provider === "wordpress_org" && (
                    <>
                      <div>
                        <Label>Site URL</Label>
                        <Input
                          value={form.site_domain}
                          onChange={(e) => setForm({...form, site_domain: e.target.value})}
                          placeholder="https://mysite.com"
                        />
                      </div>
                      
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={form.username}
                          onChange={(e) => setForm({...form, username: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label>Application Password</Label>
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({...form, password: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleAddCredential} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Add Destination
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VideoModal
        isOpen={showHelpVideo}
        onClose={() => setShowHelpVideo(false)}
        videoUrl={helpVideoUrl}
      />
    </>
  );
}