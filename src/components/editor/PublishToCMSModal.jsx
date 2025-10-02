import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IntegrationCredential } from "@/api/entities";
import { User } from "@/api/entities";
import { Loader2, Plus, Trash2, Settings, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { securePublish } from "@/api/functions";

export default function PublishToCMSModal({ isOpen, onClose, title, html }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form state - COMPREHENSIVE to capture all fields
  const [form, setForm] = useState({
    provider: "notion",
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
    config: {},
    user_name: ""
  });

  useEffect(() => {
    if (isOpen) {
      loadCredentialsAndUser();
    }
  }, [isOpen]);

  const loadCredentialsAndUser = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const assignedUsernames = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
      
      if (assignedUsernames.length > 0) {
        const credPromises = assignedUsernames.map(username => 
          IntegrationCredential.filter({ user_name: username }, "-updated_date")
        );
        const credArrays = await Promise.all(credPromises);
        const allCreds = credArrays.flat();
        setCredentials(allCreds);
      } else {
        setCredentials([]);
      }
      
      // Set default user_name for new credentials
      if (assignedUsernames.length > 0) {
        setForm(prev => ({ ...prev, user_name: assignedUsernames[0] }));
      }
    } catch (error) {
      console.error("Failed to load credentials:", error);
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = async () => {
    if (!form.name || !form.provider) {
      toast.error("Please provide a name and select a provider");
      return;
    }

    // Provider-specific validation
    if (form.provider === "notion" && !form.access_token) {
      toast.error("Notion requires an access token");
      return;
    }
    if (form.provider === "shopify" && (!form.access_token || !form.site_domain)) {
      toast.error("Shopify requires an access token and store domain");
      return;
    }
    if (form.provider === "wordpress" && (!form.site_domain || !form.username || !form.password)) {
      toast.error("WordPress requires site domain, username, and application password");
      return;
    }
    if (form.provider === "webflow" && !form.access_token) {
      toast.error("Webflow requires an access token");
      return;
    }
    if (form.provider === "webhook" && !form.endpoint_url) {
      toast.error("Webhook requires an endpoint URL");
      return;
    }

    setLoading(true);
    try {
      // Build comprehensive credential object with ALL fields
      const credentialData = {
        provider: form.provider,
        name: form.name.trim(),
        user_name: form.user_name || currentUser?.assigned_usernames?.[0] || "",
        // ALL optional fields - only include if they have values
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
        ...(Object.keys(form.config || {}).length > 0 && { config: form.config })
      };

      await IntegrationCredential.create(credentialData);
      toast.success("Credential added successfully");
      
      // Reset form to defaults
      setForm({
        provider: "notion",
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
        config: {},
        user_name: currentUser?.assigned_usernames?.[0] || ""
      });
      setShowAddForm(false);
      
      await loadCredentialsAndUser();
    } catch (error) {
      console.error("Failed to add credential:", error);
      toast.error("Failed to add credential");
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
      await loadCredentialsAndUser();
    } catch (error) {
      console.error("Failed to delete credential:", error);
      toast.error("Failed to delete credential");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (credential) => {
    setPublishing(true);
    try {
      const plainText = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      
      const { data } = await securePublish({
        provider: credential.provider,
        credentialId: credential.id,
        title: title || "Untitled",
        html: html || "",
        text: plainText
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
    switch (form.provider) {
      case "notion":
        return (
          <>
            <div>
              <Label>Access Token *</Label>
              <Input
                type="password"
                value={form.access_token}
                onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                placeholder="secret_..."
              />
            </div>
            <div>
              <Label>Database ID (optional)</Label>
              <Input
                value={form.database_id}
                onChange={(e) => setForm({ ...form, database_id: e.target.value })}
                placeholder="Database ID"
              />
            </div>
          </>
        );
      
      case "shopify":
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
              <Label>Blog ID (optional)</Label>
              <Input
                value={form.blog_id}
                onChange={(e) => setForm({ ...form, blog_id: e.target.value })}
                placeholder="12345678"
              />
            </div>
          </>
        );
      
      case "wordpress":
        return (
          <>
            <div>
              <Label>Site Domain *</Label>
              <Input
                value={form.site_domain}
                onChange={(e) => setForm({ ...form, site_domain: e.target.value })}
                placeholder="https://yoursite.com"
              />
            </div>
            <div>
              <Label>Username *</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
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
            </div>
          </>
        );
      
      case "webflow":
        return (
          <>
            <div>
              <Label>Access Token *</Label>
              <Input
                type="password"
                value={form.access_token}
                onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                placeholder="API token"
              />
            </div>
            <div>
              <Label>Collection ID (optional)</Label>
              <Input
                value={form.collection_id}
                onChange={(e) => setForm({ ...form, collection_id: e.target.value })}
                placeholder="Collection ID"
              />
            </div>
          </>
        );
      
      case "webhook":
        return (
          <>
            <div>
              <Label>Endpoint URL *</Label>
              <Input
                value={form.endpoint_url}
                onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })}
                placeholder="https://api.example.com/publish"
              />
            </div>
            <div>
              <Label>HTTP Method</Label>
              <Select value={form.http_method} onValueChange={(v) => setForm({ ...form, http_method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Signing Secret (optional)</Label>
              <Input
                type="password"
                value={form.signing_secret}
                onChange={(e) => setForm({ ...form, signing_secret: e.target.value })}
                placeholder="Shared secret for request signing"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
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
                      <p className="text-sm text-slate-500 capitalize">{cred.provider}</p>
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
                <h4 className="font-semibold">Add New Publishing Destination</h4>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>

              <div>
                <Label>Provider *</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notion">Notion</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="wordpress">WordPress</SelectItem>
                    <SelectItem value="webflow">Webflow</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
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
  );
}