
import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { IntegrationCredential } from "@/api/entities";
import { toast } from "sonner";

const providerLabel = (p) => {
  switch (p) {
    case "notion": return "Notion";
    case "shopify": return "Shopify";
    case "wordpress_org": return "WordPress.org (Self-Hosted)";
    case "wordpress_com": return "WordPress.com";
    case "webflow": return "Webflow";
    default: return p || "";
  }
};

export default function CredentialQuickAdd({ open, onClose, provider, userName, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    site_domain: "",
    access_token: "",
    database_id: "",
    collection_id: "",
    blog_id: "",
    username: "",
    password: "",
    config: {} // Added for WordPress.com
  });

  const reset = () => {
    setForm({
      name: "",
      site_domain: "",
      access_token: "",
      database_id: "",
      collection_id: "",
      blog_id: "",
      username: "",
      password: "",
      config: {} // Reset config as well
    });
  };

  const fieldsNeeded = useMemo(() => {
    switch (provider) {
      case "notion":
        return ["name", "access_token", "database_id"];
      case "shopify":
        return ["name", "site_domain", "access_token", "blog_id"];
      case "webflow":
        return ["name", "access_token", "collection_id"];
      case "wordpress_org":
        return ["name", "site_domain", "username", "password"];
      case "wordpress_com":
        return ["name", "config.client_id", "config.client_secret", "username", "password", "config.site_id"];
      default:
        return ["name"];
    }
  }, [provider]);

  const missing = useMemo(() => {
    return fieldsNeeded.filter((f) => {
      if (f.startsWith("config.")) {
        const key = f.split(".")[1];
        return !String(form.config?.[key] || "").trim();
      }
      return !String(form[f] || "").trim();
    });
  }, [fieldsNeeded, form]);

  const handleSave = async () => {
    if (!provider || !userName) {
      toast.error("Missing provider or username.");
      return;
    }
    if (missing.length > 0) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        provider,
        name: form.name.trim(),
        user_name: userName,
        site_domain: form.site_domain || undefined,
        access_token: form.access_token || undefined,
        database_id: form.database_id || undefined,
        collection_id: form.collection_id || undefined,
        blog_id: form.blog_id || undefined,
        username: form.username || undefined,
        password: form.password || undefined,
        config: Object.keys(form.config || {}).length > 0 ? form.config : undefined // Include config only if it has properties
      };
      const created = await IntegrationCredential.create(payload);
      toast.success(`${providerLabel(provider)} credential saved`);
      onCreated && onCreated(created);
      reset();
      onClose && onClose();
    } catch (e) {
      console.error("Failed to save credential:", e);
      toast.error("Failed to save credential.");
    }
    setSaving(false);
  };

  const renderProviderFields = () => {
    switch (provider) {
      case "notion":
        return (
          <>
            <div>
              <Label>Integration Token</Label>
              <Input value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} placeholder="secret_xxx" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>Database ID</Label>
              <Input value={form.database_id} onChange={(e) => setForm({ ...form, database_id: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="bg-white border-slate-300 text-slate-900" />
            </div>
          </>
        );
      case "shopify":
        return (
          <>
            <div>
              <Label>Store Domain</Label>
              <Input value={form.site_domain} onChange={(e) => setForm({ ...form, site_domain: e.target.value })} placeholder="yourstore.myshopify.com" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>Admin API Access Token</Label>
              <Input value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} placeholder="shpat_xxx" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>Blog ID</Label>
              <Input value={form.blog_id} onChange={(e) => setForm({ ...form, blog_id: e.target.value })} placeholder="e.g., 123456789" className="bg-white border-slate-300 text-slate-900" />
            </div>
          </>
        );
      case "webflow":
        return (
          <>
            <div>
              <Label>API Token</Label>
              <Input value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} placeholder="pat_xxx" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>Collection ID</Label>
              <Input value={form.collection_id} onChange={(e) => setForm({ ...form, collection_id: e.target.value })} placeholder="xxxxxxxxxxxxxxxx" className="bg-white border-slate-300 text-slate-900" />
            </div>
          </>
        );
      case "wordpress_org":
        return (
          <>
            <div>
              <Label>Site Base URL</Label>
              <Input value={form.site_domain} onChange={(e) => setForm({ ...form, site_domain: e.target.value })} placeholder="https://example.com" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="editor@example.com" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>Application Password</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="abcd efgh ijkl mnop" className="bg-white border-slate-300 text-slate-900" />
            </div>
          </>
        );
      case "wordpress_com":
        return (
          <>
            <div>
              <Label>Client ID</Label>
              <Input
                value={form.config?.client_id || ""}
                onChange={(e) => setForm({ ...form, config: { ...form.config, client_id: e.target.value } })}
                placeholder="From developer.wordpress.com"
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <Label>Client Secret</Label>
              <Input
                type="password"
                value={form.config?.client_secret || ""}
                onChange={(e) => setForm({ ...form, config: { ...form.config, client_secret: e.target.value } })}
                placeholder="App secret"
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <Label>WordPress.com Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="wpcom_user" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>WordPress.com Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password or app password" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>Site ID</Label>
              <Input
                value={form.config?.site_id || ""}
                onChange={(e) => setForm({ ...form, config: { ...form.config, site_id: e.target.value } })}
                placeholder="123456789"
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose && onClose()}>
      <DialogContent className="max-w-lg bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Add {providerLabel(provider)} Credential</DialogTitle>
          <DialogDescription className="text-slate-600">Assigns this connection to @{userName} automatically.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Connection Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Main Blog" className="bg-white border-slate-300 text-slate-900" />
            </div>
            <div>
              <Label>Assigned Username</Label>
              <Input value={`@${userName || ""}`} readOnly className="bg-slate-100 border-slate-200 text-slate-500" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-3">
            {renderProviderFields()}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || missing.length > 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? "Saving…" : "Save Credential"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
