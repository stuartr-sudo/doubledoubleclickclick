
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { IntegrationCredential } from "@/api/entities";

const PROVIDER_LABELS = {
  notion: "Notion",
  shopify: "Shopify",
  wordpress: "WordPress",
  webflow: "Webflow",
  webhook: "Webhook"
};

export default function CredentialModal({ open, onClose, provider, userName, onCreated }) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    site_domain: "",
    access_token: "",
    database_id: "",
    collection_id: "",
    blog_id: "",
    username: "",
    password: "",
    endpoint_url: "",
    http_method: "POST",
    header_key: "X-Webhook-Secret",
    header_value: "",
    author_name: "" // Added author_name to form state
  });

  React.useEffect(() => {
    if (!open) return;
    setForm((f) => ({
      ...f,
      name: f.name || `${PROVIDER_LABELS[provider] || provider} for @${userName}`
    }));
  }, [open, provider, userName]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        provider,
        name: form.name || `${provider} for @${userName}`,
        user_name: userName
      };

      if (provider === "notion") {
        payload.access_token = form.access_token || undefined;
        payload.database_id = form.database_id || undefined;
      } else if (provider === "shopify") {
        payload.site_domain = (form.site_domain || "").replace(/^https?:\/\//i, "").replace(/\/+$/,'') || undefined;
        payload.access_token = form.access_token || undefined;
        payload.blog_id = form.blog_id || undefined;
        payload.author_name = form.author_name || undefined; // Added author_name to Shopify payload
      } else if (provider === "wordpress") {
        payload.site_domain = (form.site_domain || "").replace(/\/+$/,'') || undefined;
        payload.username = form.username || undefined;
        payload.password = form.password || undefined;
      } else if (provider === "webflow") {
        payload.access_token = form.access_token || undefined;
        payload.collection_id = form.collection_id || undefined;
      } else if (provider === "webhook") {
        payload.endpoint_url = form.endpoint_url || undefined;
        payload.http_method = form.http_method || "POST";
        if (form.header_value) {
          payload.headers = { [form.header_key || "X-Webhook-Secret"]: form.header_value };
        }
      }

      const created = await IntegrationCredential.create(payload);
      onCreated?.(created);
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const renderFields = () => {
    if (!provider) return null;

    const commonName = (
      <div className="col-span-2">
        <Label>Connection name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Main Blog / Primary Workspace"
        />
      </div>
    );

    if (provider === "notion") {
      return (
        <>
          {commonName}
          <div className="col-span-2">
            <Label>Integration Token</Label>
            <Input value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} placeholder="secret_xxx" />
          </div>
          <div className="col-span-2">
            <Label>Database ID</Label>
            <Input value={form.database_id} onChange={(e) => setForm({ ...form, database_id: e.target.value })} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
        </>
      );
    }

    if (provider === "shopify") {
      return (
        <>
          {commonName}
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
          <div>
            <Label>Author Name (optional)</Label>
            <Input
              value={form.author_name || ''}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              placeholder="John Doe"
            />
            <p className="text-xs text-slate-500 mt-1">
              Default author name for articles published to Shopify
            </p>
          </div>
        </>
      );
    }

    if (provider === "wordpress") {
      return (
        <>
          {commonName}
          <div>
            <Label>Site URL</Label>
            <Input value={form.site_domain} onChange={(e) => setForm({ ...form, site_domain: e.target.value })} placeholder="https://yoursite.com" />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="wp-admin-username" />
          </div>
          <div className="col-span-2">
            <Label>Application Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="xxxx xxxx xxxx ..." />
          </div>
        </>
      );
    }

    if (provider === "webflow") {
      return (
        <>
          {commonName}
          <div>
            <Label>Access Token</Label>
            <Input value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} placeholder="wfpat_xxx" />
          </div>
          <div>
            <Label>Collection ID</Label>
            <Input value={form.collection_id} onChange={(e) => setForm({ ...form, collection_id: e.target.value })} placeholder="xxxxxxxxxxxxxxxx" />
          </div>
        </>
      );
    }

    if (provider === "webhook") {
      return (
        <>
          {commonName}
          <div className="col-span-2">
            <Label>Endpoint URL</Label>
            <Input value={form.endpoint_url} onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} placeholder="https://your-app.example.com/api/receive" />
          </div>
          <div>
            <Label>HTTP Method</Label>
            <Select value={form.http_method} onValueChange={(v) => setForm({ ...form, http_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Auth Header (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input value={form.header_key} onChange={(e) => setForm({ ...form, header_key: e.target.value })} placeholder="Header key (e.g., X-Webhook-Secret)" />
              <Input value={form.header_value} onChange={(e) => setForm({ ...form, header_value: e.target.value })} placeholder="secret/token" />
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  const title = `Add ${PROVIDER_LABELS[provider] || provider} credential`;
  const desc = `Create a ${PROVIDER_LABELS[provider] || provider} connection for @${userName}.`;

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && !v && onClose?.()}>
      <DialogContent className="b44-modal bg-white border border-slate-200 text-slate-900 max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-slate-600">{desc}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {renderFields()}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
