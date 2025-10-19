
import React, { useState, useEffect, useCallback } from "react";
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
import { base44 } from "@/api/appClient";
import { Loader2, Plus, Trash2, Settings, ExternalLink, Video, RefreshCw, Edit, Globe } from "lucide-react";
import { toast } from "sonner";
import VideoModal from "@/components/common/VideoModal";
import { useCredentials } from "@/components/providers/CredentialsProvider"; // NEW import

const cleanHtmlForPublish = (html) => {
  let cleaned = String(html || "");

  // Remove select handles
  cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*b44-select-handle[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

  // Remove ALL data-* attributes
  cleaned = cleaned.replace(/\s+data-[a-zA-Z0-9_-]+=["'][^"']*["']/gi, '');

  // Remove editor affordances
  cleaned = cleaned.replace(/\s+draggable=["'](?:true|false)["']/gi, '');
  cleaned = cleaned.replace(/\s+contenteditable=["'](?:true|false)["']/gi, '');

  // Remove Base44 classes
  cleaned = cleaned.replace(/class=(["'])([^"']*)\1/gi, (match, quote, classes) => {
    const kept = classes.split(/\s+/).filter(c => c && !c.startsWith('b44-'));
    return kept.length ? `class=${quote}${kept.join(' ')}${quote}` : '';
  });

  // Remove empty attributes
  cleaned = cleaned.replace(/\s+class=["']\s*["']/gi, '');
  cleaned = cleaned.replace(/\s+style=["']\s*["']/gi, '');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/\s+>/g, '>');

  return cleaned.trim();
};

export default function PublishToCMSModal({ isOpen, onClose, title, html }) {
  const [loading, setLoading] = useState(false); // Used for actions within this modal (add/delete/publish)
  const [publishing, setPublishing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showHelpVideo, setShowHelpVideo] = useState(false);
  const [helpVideoUrl, setHelpVideoUrl] = useState("");
  const [editingCredential, setEditingCredential] = useState(null);

  // NEW: Get credentials and related functions from the context provider
  const {
    credentials,
    loadCredentials: loadCredentialsFromProvider, // Renamed to avoid conflict
    invalidateCache,
    loading: credentialsLoading, // Loading state from the provider
  } = useCredentials();

  // Shopify blog fetching states
  const [fetchingBlogs, setFetchingBlogs] = useState(false);
  const [availableBlogs, setAvailableBlogs] = useState([]);
  const [selectedBlogId, setSelectedBlogId] = useState("");

  const [form, setForm] = useState({
    provider: "shopify",
    name: "",
    access_token: "",
    refresh_token: "",
    site_domain: "",
    database_id: "",
    collection_id: "",
    blog_id: "",
    username: "",
    password: "",
    endpoint_url: "",
    http_method: "POST",
    headers: {},
    signing_secret: "",
    config: { page_builder: "none" },
    user_name: "", // Initialized empty, will be set in useEffect
    author_name: "",
  });

  // Helper: build a scoped HTML island (safe, portable)
  const buildHtmlIsland = (rawHtml) => {
    if (!rawHtml) return rawHtml;
    const alreadyHasIsland =
      /class=["'][^"']*(?:\bls-article\b|\bb44-article\b)[^"']*["']/.test(rawHtml) ||
      /<style[^>]*>[\s\S]*?(?:\.ls-article|\.b44-article)/i.test(rawHtml);

    if (alreadyHasIsland) return rawHtml;

    const css = `
/* Base44 HTML‑Island (scoped) */
.ls-article,.ls-article *{box-sizing:border-box}
.ls-article{
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  color:#0f172a;font-size:20px;line-height:1.78;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
  overflow-wrap:break-word;word-break:normal
}
.ls-article .ls-container{max-width:880px;width:100%;margin:0 auto;padding:40px 24px 72px}
.ls-article a{color:#1d4ed8}
.ls-article img,.ls-article video,.ls-article iframe{max-width:100%;height:auto;display:block}

/* Headings & text */
.ls-article h1,.ls-article h2,.ls-article h3{line-height:1.25;color:#0b1220;margin:0}
.ls-article h1{font-size:2.6rem;margin:14px 0 10px}
.ls-article h2{font-size:1.8rem;margin-top:36px}
.ls-article h3{font-size:1.3rem;margin-top:26px}
.ls-article p{margin:16px 0}
.ls-article ul,.ls-article ol{padding-left:22px;margin:14px 0}
.ls-article li{margin:8px 0}
.ls-article .muted{color:#475569;font-size:.97em}

/* Components */
.ls-article .toc{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-top:8px}
.ls-article .callout{background:#f1f5ff;border:1px solid #c7d2fe;padding:16px;border-radius:12px}

/* Table */
.ls-article .table-wrap{overflow-x:auto}
.ls-article table{width:100%;border-collapse:collapse;margin:18px 0}
.ls-article th,.ls-article td{border:1px solid #e2e8f0;padding:14px;vertical-align:top;text-align:left}
.ls-article th{background:#f1f5f9}

/* Cards and grid */
.ls-article .card{background:#f8fafc;border:1px solid #e2e8f0;padding:18px;border-radius:12px}
.ls-article .grid{display:grid;grid-template-columns:1fr;gap:18px}
@media (min-width:820px){.ls-article .grid{grid-template-columns:1fr 1fr}}

/* CTA */
.ls-article .cta{background:#eef2ff;border:1px solid #c7d2fe;padding:22px;border-radius:14px;margin-top:34px}
.ls-article .cta a{display:inline-flex;align-items:center;justify-content:center;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:600;line-height:1;white-space:normal}

/* Tablet */
@media (max-width:1024px){
  .ls-article{font-size:19px}
  .ls-article .ls-container{padding:36px 20px 64px}
  .ls-article h1{font-size:2.3rem}
  .ls-article h2{font-size:1.7rem}
  .ls-article h3{font-size:1.25rem}
}
/* Mobile */
@media (max-width:640px){
  .ls-article{font-size:18.5px}
  .ls-article .ls-container{padding:28px 16px 56px}
  .ls-article h1{font-size:2.1rem}
  .ls-article h2{font-size:1.55rem}
  .ls-article h3{font-size:1.22rem}
  .ls-article ul,.ls-article ol{padding-left:18px}
  .ls-article .toc{padding:16px}
  .ls-article .cta{padding:20px}
  .ls-article .cta a{width:100%;text-align:center;padding:14px}
}
@media (prefers-reduced-motion:reduce){.ls-article *{animation:none!important;transition:none!important}}
`.trim();

    return `<style>${css}</style>\n<div class="ls-article"><main class="ls-container">${rawHtml}</main></div>`;
  };

  const loadHelpVideo = async () => {
    try {
      const settings = await app.entities.AppSettings.list();
      const videoSetting = settings.find(s => s.key === "shopify_setup_video");
      if (videoSetting?.value) {
        setHelpVideoUrl(videoSetting.value);
      }
    } catch (error) {
      // Silent fail
    }
  };

  // NEW: loadCurrentUser function using useCallback for stability in dependencies
  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await app.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
      setCurrentUser(null);
      toast.error("Failed to load user information.");
    }
  }, []);

  // Main effect for modal open/close actions
  useEffect(() => {
    if (isOpen) {
      loadCurrentUser(); // Fetch current user
      loadHelpVideo(); // Fetch help video URL
      loadCredentialsFromProvider(); // Load credentials (uses cache from provider)

      // Only reset form state if not already in an editing context or adding a new form
      if (!editingCredential && !showAddForm) {
        setForm(prev => ({
          ...prev,
          provider: "shopify",
          name: "",
          access_token: "",
          refresh_token: "",
          site_domain: "",
          database_id: "",
          collection_id: "",
          blog_id: "",
          username: "",
          password: "",
          endpoint_url: "",
          http_method: "POST",
          headers: {},
          signing_secret: "",
          config: { page_builder: "none" },
          user_name: "", // Will be updated by a subsequent effect when currentUser is available
          author_name: ""
        }));
        setAvailableBlogs([]);
        setSelectedBlogId("");
        setShowAddForm(false);
      }
    } else {
      // Reset states when modal closes
      setEditingCredential(null);
      setAvailableBlogs([]);
      setSelectedBlogId("");
      setShowAddForm(false);
    }
  }, [isOpen, editingCredential, showAddForm, loadCurrentUser, loadCredentialsFromProvider]);

  // NEW: Effect to set form.user_name based on current user and URL params, once currentUser is available
  useEffect(() => {
    if (isOpen && currentUser) {
      const assignedUsernames = Array.isArray(currentUser.assigned_usernames) ? currentUser.assigned_usernames : [];
      let targetUsername = assignedUsernames[0] || "";

      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get('post');
      const webhookId = urlParams.get('webhook');

      const determineInitialUsername = async () => {
        let determinedUsername = targetUsername;
        if (postId) {
          try {
            const posts = await app.entities.BlogPost.filter({ id: postId });
            if (posts && posts.length > 0 && posts[0].user_name && assignedUsernames.includes(posts[0].user_name)) {
              determinedUsername = posts[0].user_name;
            }
          } catch (e) {
            console.warn("Failed to determine username from post ID:", e);
          }
        } else if (webhookId) {
          try {
            const webhooks = await app.entities.WebhookReceived.filter({ id: webhookId });
            if (webhooks && webhooks.length > 0 && webhooks[0].user_name && assignedUsernames.includes(webhooks[0].user_name)) {
              determinedUsername = webhooks[0].user_name;
            }
          } catch (e) {
            console.warn("Failed to determine username from webhook ID:", e);
          }
        }
        setForm(prev => ({ ...prev, user_name: determinedUsername }));
      };
      determineInitialUsername();
    }
  }, [isOpen, currentUser]); // Only depends on isOpen and currentUser because it sets form.user_name

  // NEW: Fetch Shopify blogs when access token and store domain are entered
  const handleFetchBlogs = async () => {
    if (!form.access_token || !form.site_domain) {
      toast.error("Please enter Access Token and Store Domain first");
      return;
    }

    setFetchingBlogs(true);
    setAvailableBlogs([]);
    setSelectedBlogId("");

    try {
      const { data } = await app.functions.invoke('fetchShopifyBlogs', {
        access_token: form.access_token,
        store_domain: form.site_domain
      });

      if (data.success && data.blogs && data.blogs.length > 0) {
        setAvailableBlogs(data.blogs);
        toast.success(`Found ${data.blogs.length} blog${data.blogs.length === 1 ? '' : 's'}`);

        // Auto-select the blog if it matches the current form's blog_id (useful during edit)
        if (form.blog_id && data.blogs.some(blog => blog.id === form.blog_id)) {
          setSelectedBlogId(form.blog_id);
        } else if (data.blogs.length === 1) { // Otherwise, auto-select the first blog if only one
          setSelectedBlogId(data.blogs[0].id);
          setForm(prev => ({ ...prev, blog_id: data.blogs[0].id }));
        }
      } else {
        toast.message("No blogs found for this Shopify store");
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs. Please check your credentials.");
    } finally {
      setFetchingBlogs(false);
    }
  };

  // Update blog_id when selection changes
  const handleBlogSelect = (blogId) => {
    setSelectedBlogId(blogId);
    setForm(prev => ({ ...prev, blog_id: blogId }));
  };

  // NEW: handleEditCredential function
  const handleEditCredential = (cred) => {
    setEditingCredential(cred);
    setForm({
      provider: cred.provider,
      name: cred.name || "",
      access_token: cred.access_token || "",
      refresh_token: cred.refresh_token || "",
      site_domain: cred.site_domain || "",
      database_id: cred.database_id || "",
      collection_id: cred.collection_id || "",
      blog_id: cred.blog_id || "",
      username: cred.username || "",
      password: "", // Passwords are not usually returned from API, user will re-enter if needed
      endpoint_url: cred.endpoint_url || "",
      http_method: cred.http_method || "POST",
      headers: cred.headers || {},
      signing_secret: cred.signing_secret || "",
      config: cred.config || { page_builder: "none" },
      user_name: cred.user_name || currentUser?.assigned_usernames?.[0] || "",
      author_name: cred.author_name || "",
    });
    setShowAddForm(true);

    // If editing Shopify credential with blog_id, set it as selected
    if (cred.provider === "shopify" && cred.blog_id) {
      setSelectedBlogId(cred.blog_id);
    }
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

    if (form.provider === "wordpress_org" && (!form.site_domain || !form.username || (!editingCredential && !form.password))) {
      // Password is required for new WordPress credentials, but optional for update if not changed
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
        ...(form.refresh_token && { refresh_token: form.refresh_token.trim() }),
        ...(form.site_domain && { site_domain: form.site_domain.trim() }),
        ...(form.database_id && { database_id: form.database_id.trim() }),
        ...(form.collection_id && { collection_id: form.collection_id.trim() }),
        ...(form.blog_id && { blog_id: form.blog_id.trim() }),
        ...(form.username && { username: form.username.trim() }),
        // Only send password if it's set (for new or if user explicitly updated it)
        ...(form.password && { password: form.password.trim() }),
        ...(form.endpoint_url && { endpoint_url: form.endpoint_url.trim() }),
        ...(form.http_method && { http_method: form.http_method }),
        ...(form.signing_secret && { signing_secret: form.signing_secret.trim() }),
        // Ensure headers and config are objects, even if empty
        headers: form.headers || {},
        config: form.config || { page_builder: "none" },
        ...(form.author_name && { author_name: form.author_name.trim() })
      };

      if (editingCredential) {
        // Update existing credential
        await app.entities.IntegrationCredential.update(editingCredential.id, credentialData);
        toast.success("Credential updated successfully");
      } else {
        // Create new credential
        await app.entities.IntegrationCredential.create(credentialData);
        toast.success("Credential added successfully");
      }

      // NEW: Invalidate cache and reload from provider
      invalidateCache();
      await loadCredentialsFromProvider(true); // true to force fresh fetch

      // Reset form and states
      setForm({
        provider: "shopify",
        name: "",
        access_token: "",
        refresh_token: "",
        site_domain: "",
        database_id: "",
        collection_id: "",
        blog_id: "",
        username: "",
        password: "",
        endpoint_url: "",
        http_method: "POST",
        headers: {},
        signing_secret: "",
        config: { page_builder: "none" },
        user_name: currentUser?.assigned_usernames?.[0] || "",
        author_name: ""
      });
      setAvailableBlogs([]);
      setSelectedBlogId("");
      setShowAddForm(false);
      setEditingCredential(null); // Reset editing state

    } catch (error) {
      if (error?.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment.");
      } else {
        toast.error(editingCredential ? "Failed to update credential" : "Failed to add credential");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (id) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;

    setLoading(true);
    try {
      await app.entities.IntegrationCredential.delete(id);

      // NEW: Invalidate cache and reload from provider
      invalidateCache();
      await loadCredentialsFromProvider(true); // true to force fresh fetch

      toast.success("Credential deleted");
    } catch (error) {
      if (error?.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment.");
      } else {
        toast.error("Failed to delete credential");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (credential) => {
    // Validate required data
    if (!title || !title.trim()) {
      toast.error("Title is required for publishing");
      return;
    }

    if (!html || !html.trim()) {
      toast.error("Content is required for publishing");
      return;
    }

    if (!credential || !credential.id) {
      toast.error("Invalid credential selected");
      return;
    }

    setPublishing(true);
    try {
      const cleanedHtml = cleanHtmlForPublish(html); // Clean the input HTML first

      // Then apply the WordPress Elementor specific wrapping if needed, using the cleaned HTML
      const isWordPress = credential.provider === "wordpress_org";
      const pageBuilder = credential?.config?.page_builder || "none";
      const shouldWrapIsland = isWordPress && pageBuilder === "elementor";
      const finalHtmlForPublish = shouldWrapIsland ? buildHtmlIsland(cleanedHtml) : cleanedHtml;

      const plainText = finalHtmlForPublish.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      const payload = {
        provider: credential.provider,
        credentialId: credential.id,
        title: title.trim(),
        html: finalHtmlForPublish,
        text: plainText,
        page_builder: pageBuilder,
      };

      // If Shopify credential, include author_name
      if (credential.provider === "shopify" && credential.author_name) {
        payload.author_name = credential.author_name;
      }

      console.log('Publishing with cleaned HTML:', {
        provider: payload.provider,
        credentialId: payload.credentialId,
        titleLength: payload.title.length,
        originalHtmlLength: html.length,
        cleanedHtmlLength: cleanedHtml.length,
        finalHtmlLength: finalHtmlForPublish.length,
        removedBytes: html.length - cleanedHtml.length
      });

      const { data } = await app.functions.invoke('securePublish', payload);

      if (data?.success || data?.ok) {
        toast.success(`Published to ${credential.name}`);
        onClose();
      } else {
        const errorMsg = data?.error || data?.message || "Publishing failed";
        console.error('Publish failed:', data);
        toast.error(`Failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Publish error details:");
      console.error("Error message:", error.message);
      console.error("Response data:", error?.response?.data);
      console.error("Response status:", error?.response?.status);

      const errorMsg = error?.response?.data?.error ||
                       error?.response?.data?.message ||
                       error?.response?.data?.detail ||
                       error.message ||
                       "Publishing failed";

      toast.error(`Publish failed: ${errorMsg}`);
    } finally {
      setPublishing(false);
    }
  };

  const renderProviderFields = () => {
    if (form.provider === "shopify") {
      return (
        <>
          <div>
            <Label>Access Token *</Label>
            <Input
              type="password"
              value={form.access_token}
              onChange={(e) => setForm({ ...form, access_token: e.target.value })}
              placeholder="shpat_..."
            />
          </div>
          <div>
            <Label>Store Domain *</Label>
            <Input
              value={form.site_domain}
              onChange={(e) => setForm({ ...form, site_domain: e.target.value })}
              placeholder="your-store.myshopify.com"
            />
          </div>

          {/* Fetch Blogs Button */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchBlogs}
              disabled={!form.access_token || !form.site_domain || fetchingBlogs}
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
          </div>

          {/* Blog Selection Dropdown */}
          {availableBlogs.length > 0 && (
            <div>
              <Label>Select Blog *</Label>
              <Select value={selectedBlogId} onValueChange={handleBlogSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a blog..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBlogs.map((blog) => (
                    <SelectItem key={blog.id} value={blog.id}>
                      {blog.title} (ID: {blog.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fallback: Manual Blog ID input (shown when no blogs are fetched yet, or if editing an existing blog that wasn't fetched) */}
          {(!availableBlogs.length || (editingCredential && selectedBlogId && !availableBlogs.some(blog => blog.id === selectedBlogId))) && (
            <div>
              <Label>Blog ID * <span className="text-xs text-slate-500">(or fetch blogs above)</span></Label>
              <Input
                value={form.blog_id}
                onChange={(e) => setForm({ ...form, blog_id: e.target.value })}
                placeholder="12345678"
              />
            </div>
          )}

          {/* Author Name field */}
          <div>
            <Label>Author Name</Label>
            <Input
              value={form.author_name || ''}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              placeholder="e.g., John Doe"
            />
            <p className="text-xs text-slate-500 mt-1">
              Author name that will appear on published Shopify articles
            </p>
          </div>
        </>
      );
    }

    if (form.provider === "wordpress_org") {
      return (
        <>
          <div>
            <Label>Site Domain *</Label>
            <Input
              value={form.site_domain}
              onChange={(e) => setForm({ ...form, site_domain: e.target.value })}
              placeholder="https://www.yoursite.com"
            />
            <p className="text-xs text-slate-500 mt-1">
              Just the base URL (e.g., https://www.yoursite.com) - do NOT include /wp-admin or /wp-login.php
            </p>
          </div>
          <div>
            <Label>Username *</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="your-wordpress-username"
            />
          </div>
          <div>
            <Label>Application Password *</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingCredential ? "Leave blank to keep existing password" : "xxxx xxxx xxxx xxxx xxxx xxxx"}
            />
            <p className="text-xs text-slate-500 mt-1">
              {editingCredential ? "Leave blank to keep existing password. Generate new in WordPress: Users → Your Profile → Application Passwords." : "Generate in WordPress: Users → Your Profile → Application Passwords"}
            </p>
          </div>

          <div>
            <Label>Page Builder (optional)</Label>
            <Select
              value={form?.config?.page_builder || "none"}
              onValueChange={(v) => setForm({ ...form, config: { ...(form.config || {}), page_builder: v } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="none" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Classic / Gutenberg</SelectItem>
                <SelectItem value="elementor">Elementor</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              If Elementor, your content will be sent as a self‑contained HTML block ("HTML island") for reliable rendering.
            </p>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configure Publishing
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Your Publishing Destinations</h3>
              {credentialsLoading && credentials.length === 0 ? ( // Use provider's loading state
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : credentials.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No publishing destinations configured yet.</p>
              ) : (
                <div className="space-y-2">
                  {credentials.map((cred) => (
                    <div key={cred.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cred.name}</p>
                        <p className="text-sm text-slate-500 capitalize">{cred.provider.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCredential(cred)}
                          disabled={loading || publishing}
                          title="Edit connection"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePublish(cred)}
                          disabled={publishing || !title || !html}
                          title="Publish article"
                        >
                          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCredential(cred.id)}
                          disabled={loading || publishing}
                          title="Delete connection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!showAddForm ? (
              <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full" disabled={credentialsLoading || loading}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Destination
              </Button>
            ) : (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{editingCredential ? 'Edit' : 'Add New'} Publishing Destination</h4>
                    {helpVideoUrl && form.provider === "shopify" && (
                      <button
                        type="button"
                        onClick={() => setShowHelpVideo(true)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Watch setup tutorial"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setShowAddForm(false);
                    setEditingCredential(null);
                    // Reset form fields and blog states for a clean slate next time 'add' is clicked
                    setForm({
                      provider: "shopify",
                      name: "",
                      access_token: "",
                      refresh_token: "",
                      site_domain: "",
                      database_id: "",
                      collection_id: "",
                      blog_id: "",
                      username: "",
                      password: "",
                      endpoint_url: "",
                      http_method: "POST",
                      headers: {},
                      signing_secret: "",
                      config: { page_builder: "none" },
                      user_name: currentUser?.assigned_usernames?.[0] || "",
                      author_name: ""
                    });
                    setAvailableBlogs([]);
                    setSelectedBlogId("");
                  }}>Cancel</Button>
                </div>

                <div>
                  <Label>Provider *</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })} disabled={!!editingCredential}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shopify">Shopify</SelectItem>
                      <SelectItem value="wordpress_org">WordPress.org (Self-Hosted)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Connection Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Main Blog"
                  />
                </div>

                {renderProviderFields()}

                <Button onClick={handleAddCredential} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingCredential ? 'Update Destination' : 'Add Destination'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <VideoModal
        isOpen={showHelpVideo}
        onClose={() => setShowHelpVideo(false)}
        videoUrl={helpVideoUrl}
        title="Shopify Setup Tutorial"
      />
    </>
  );
}
