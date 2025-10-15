
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IntegrationCredential } from "@/api/entities";
import { User } from "@/api/entities";
import { AppSettings } from "@/api/entities";
import { Loader2, Plus, Trash2, Settings, ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";
import { securePublish } from "@/api/functions";
import VideoModal from "@/components/common/VideoModal";

export default function PublishToCMSModal({ isOpen, onClose, title, html }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showHelpVideo, setShowHelpVideo] = useState(false);
  const [helpVideoUrl, setHelpVideoUrl] = useState("");

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
    config: { page_builder: "none" }, // default page builder hint
    user_name: ""
  });

  // Helper: build a scoped HTML island (safe, portable)
  const buildHtmlIsland = (rawHtml) => {
    if (!rawHtml) return rawHtml;
    // Skip if already wrapped by our classes
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

  useEffect(() => {
    if (isOpen) {
      // Add 500ms delay before loading to avoid immediate rate limit on modal open
      const timer = setTimeout(() => {
        loadCredentialsAndUser();
      }, 500);
      loadHelpVideo();
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const loadHelpVideo = async () => {
    try {
      const settings = await AppSettings.list();
      const videoSetting = settings.find(s => s.key === "shopify_setup_video");
      if (videoSetting?.value) {
        setHelpVideoUrl(videoSetting.value);
      }
    } catch (error) {
      // Silent fail - video is optional
    }
  };

  const loadCredentialsAndUser = async (attempt = 0) => {
    setLoading(true);
    
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const assignedUsernames = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
      
      if (assignedUsernames.length === 0) {
        setCredentials([]);
        setForm(prev => ({ ...prev, user_name: "" }));
        setLoading(false);
        return;
      }

      // Load credentials with aggressive rate limit protection
      const allCreds = [];
      for (let i = 0; i < assignedUsernames.length; i++) {
        if (i > 0) {
          await new Promise(res => setTimeout(res, 500)); // 500ms between requests
        }
        
        try {
          const creds = await IntegrationCredential.filter({ user_name: assignedUsernames[i] }, "-updated_date");
          if (creds && creds.length > 0) {
            allCreds.push(...creds);
          }
        } catch (credErr) {
          // Silently skip - absolutely no error handling
          continue;
        }
      }
      
      setCredentials(allCreds);
      
      // Get context for default username
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get('post');
      const webhookId = urlParams.get('webhook');
      
      let targetUsername = assignedUsernames[0] || "";

      if (postId) {
        try {
          const { BlogPost } = await import("@/api/entities");
          const posts = await BlogPost.filter({ id: postId });
          if (posts && posts.length > 0 && posts[0].user_name) {
            targetUsername = posts[0].user_name;
          }
        } catch (e) {
          // Silent
        }
      } else if (webhookId) {
        try {
          const { WebhookReceived } = await import("@/api/entities");
          const webhooks = await WebhookReceived.filter({ id: webhookId });
          if (webhooks && webhooks.length > 0 && webhooks[0].user_name) {
            targetUsername = webhooks[0].user_name;
          }
        } catch (e) {
          // Silent
        }
      }
      
      setForm(prev => ({ ...prev, user_name: targetUsername }));
      setLoading(false);
      
    } catch (error) {
      // Only retry once on rate limit with 5 second delay
      if (error?.response?.status === 429 && attempt === 0) {
        setTimeout(() => loadCredentialsAndUser(1), 5000);
        return;
      }
      
      // Silently set empty state - NO TOAST, NO CONSOLE LOG
      setCredentials([]);
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const handleAddCredential = async () => {
    if (!form.name || !form.provider) {
      toast.error("Please provide a name and select a provider");
      return;
    }

    // Shopify validation
    if (form.provider === "shopify" && (!form.access_token || !form.site_domain || !form.blog_id)) {
      toast.error("Shopify requires an access token, store domain, and blog ID");
      return;
    }

    // WordPress.org validation
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
        ...(form.refresh_token && { refresh_token: form.refresh_token.trim() }),
        ...(form.site_domain && { site_domain: form.site_domain.trim() }),
        ...(form.database_id && { database_id: form.database_id.trim() }),
        ...(form.collection_id && { collection_id: form.collection_id.trim() }),
        ...(form.blog_id && { blog_id: form.blog_id.trim() }),
        ...(form.username && { username: form.username.trim() }),
        ...(form.password && { password: form.password.trim() }),
        ...(form.endpoint_url && { endpoint_url: form.endpoint_url.trim() }),
        ...(form.http_method && { http_method: form.http_method }),
        ...(form.signing_secret && { signing_secret: form.signing_secret.trim() }),
        ...(Object.keys(form.headers || {}).length > 0 && { headers: form.headers }),
        ...(Object.keys(form.config || {}).length > 0 && { config: form.config }) // includes page_builder
      };

      await IntegrationCredential.create(credentialData);
      toast.success("Credential added successfully");
      
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
        config: { page_builder: "none" }, // Reset with default page_builder
        user_name: currentUser?.assigned_usernames?.[0] || ""
      });
      setShowAddForm(false);
      
      // Wait 1 second before reloading to avoid rate limit
      await new Promise(res => setTimeout(res, 1000));
      await loadCredentialsAndUser();
    } catch (error) {
      // Only show error for credential creation failures, not rate limits
      if (error?.response?.status !== 429) {
        toast.error("Failed to add credential");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (id) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;
    
    setLoading(true);
    try {
      await IntegrationCredential.delete(id);
      toast.success("Credential deleted");
      await new Promise(res => setTimeout(res, 1000));
      await loadCredentialsAndUser();
    } catch (error) {
      if (error?.response?.status !== 429) {
        toast.error("Failed to delete credential");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (credential) => {
    setPublishing(true);
    try {
      const plainText = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // Decide whether to wrap as an HTML island:
      const isWordPress = credential.provider === "wordpress_org";
      const pageBuilder = credential?.config?.page_builder || "none";
      // Wrap in HTML island only for WordPress with Elementor
      const shouldWrapIsland = isWordPress && pageBuilder === "elementor"; 
      const finalHtml = shouldWrapIsland ? buildHtmlIsland(html || "") : (html || "");

      const { data } = await securePublish({
        provider: credential.provider,
        credentialId: credential.id,
        title: title || "Untitled",
        html: finalHtml,
        text: plainText,
        // Optional hint passed through for observability/future logic
        page_builder: pageBuilder
      });

      if (data?.success || data?.ok) {
        toast.success(`Published to ${credential.name}`);
        onClose();
      } else {
        toast.error(data?.error || "Publishing failed");
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(error?.response?.data?.error || error.message || "Publishing failed");
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
          <div>
            <Label>Blog ID *</Label>
            <Input
              value={form.blog_id}
              onChange={(e) => setForm({ ...form, blog_id: e.target.value })}
              placeholder="12345678"
            />
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
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
            />
            <p className="text-xs text-slate-500 mt-1">
              Generate in WordPress: Users → Your Profile → Application Passwords
            </p>
          </div>

          {/* NEW: Page Builder hint (optional) */}
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
              If Elementor, your content will be sent as a self‑contained HTML block (“HTML island”) for reliable rendering.
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
            {/* Existing Credentials */}
            <div>
              <h3 className="font-semibold mb-3">Your Publishing Destinations</h3>
              {loading && credentials.length === 0 ? (
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
                          onClick={() => handlePublish(cred)}
                          disabled={publishing || !title || !html}
                        >
                          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCredential(cred.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Credential */}
            {!showAddForm ? (
              <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add New Destination
              </Button>
            ) : (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">Add New Publishing Destination</h4>
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
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>

                <div>
                  <Label>Provider *</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
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
                  Add Destination
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
