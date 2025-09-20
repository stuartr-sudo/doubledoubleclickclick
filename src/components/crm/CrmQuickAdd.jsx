import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CrmCredential } from "@/api/entities";
import { toast } from "sonner";

const PROVIDERS = [
  { key: "mailchimp", label: "Mailchimp" },
  { key: "klaviyo", label: "Klaviyo" },
  { key: "active_campaign", label: "ActiveCampaign" },
  { key: "hubspot", label: "HubSpot" },
  { key: "convertkit", label: "ConvertKit" },
  { key: "mailerlite", label: "MailerLite" },
  { key: "webhook", label: "Webhook" }
];

export default function CrmQuickAdd({ open, onClose, defaultProvider = "mailchimp", userName, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState(defaultProvider || "mailchimp");
  const [form, setForm] = useState({
    name: "",
    api_key: "",
    api_secret: "",
    api_url: "",
    account_id: "",
    audience_id: "",
    list_id: "",
    form_id: "",
    group_id: "",
    tag: "",
    server_prefix: "",
    endpoint_url: "",
    http_method: "POST",
    header_key: "X-Webhook-Secret",
    header_value: "",
    double_opt_in: false
  });

  React.useEffect(() => {
    if (!open) {
      setProvider(defaultProvider || "mailchimp");
      setForm({
        name: "",
        api_key: "",
        api_secret: "",
        api_url: "",
        account_id: "",
        audience_id: "",
        list_id: "",
        form_id: "",
        group_id: "",
        tag: "",
        server_prefix: "",
        endpoint_url: "",
        http_method: "POST",
        header_key: "X-Webhook-Secret",
        header_value: "",
        double_opt_in: false
      });
    }
  }, [open, defaultProvider]);

  const fieldsNeeded = useMemo(() => {
    switch (provider) {
      case "mailchimp":
        return ["name", "api_key", "server_prefix", "audience_id"];
      case "klaviyo":
        return ["name", "api_key", "list_id"];
      case "active_campaign":
        return ["name", "api_url", "api_key", "list_id"];
      case "hubspot":
        return ["name", "api_key", "list_id"];
      case "convertkit":
        return ["name", "api_key", "form_id"];
      case "mailerlite":
        return ["name", "api_key", "group_id"];
      case "webhook":
        return ["name", "endpoint_url"];
      default:
        return ["name"];
    }
  }, [provider]);

  const missing = useMemo(() => {
    return fieldsNeeded.filter((f) => !String(form[f] || "").trim());
  }, [fieldsNeeded, form]);

  const handleSave = async () => {
    if (!userName) {
      toast.error("Missing username.");
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
        api_key: form.api_key || undefined,
        api_secret: form.api_secret || undefined,
        api_url: form.api_url || undefined,
        account_id: form.account_id || undefined,
        audience_id: form.audience_id || undefined,
        list_id: form.list_id || undefined,
        form_id: form.form_id || undefined,
        group_id: form.group_id || undefined,
        tag: form.tag || undefined,
        server_prefix: form.server_prefix || undefined,
        endpoint_url: form.endpoint_url || undefined,
        http_method: form.http_method || undefined,
        headers: form.header_value ? { [form.header_key || "X-Webhook-Secret"]: form.header_value } : undefined,
        double_opt_in: !!form.double_opt_in
      };
      const created = await CrmCredential.create(payload);
      toast.success("CRM credential saved");
      onCreated && onCreated(created);
      onClose && onClose();
    } catch (e) {
      toast.error("Failed to save CRM credential.");
    }
    setSaving(false);
  };

  const ProviderFields = () => {
    switch (provider) {
      case "mailchimp":
        return (
          <>
            <div>
              <Label>API Key</Label>
              <Input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="mc_api_key-us1" />
            </div>
            <div>
              <Label>Server Prefix</Label>
              <Input value={form.server_prefix} onChange={(e) => setForm({ ...form, server_prefix: e.target.value })} placeholder="us1" />
            </div>
            <div>
              <Label>Audience ID</Label>
              <Input value={form.audience_id} onChange={(e) => setForm({ ...form, audience_id: e.target.value })} placeholder="XXXXXXXXXX" />
            </div>
          </>
        );
      case "klaviyo":
        return (
          <>
            <div>
              <Label>Private API Key</Label>
              <Input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="pk_..." />
            </div>
            <div>
              <Label>List ID</Label>
              <Input value={form.list_id} onChange={(e) => setForm({ ...form, list_id: e.target.value })} placeholder="XXXXXX" />
            </div>
          </>
        );
      case "active_campaign":
        return (
          <>
            <div>
              <Label>API URL</Label>
              <Input value={form.api_url} onChange={(e) => setForm({ ...form, api_url: e.target.value })} placeholder="https://account.api-us1.com" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="ac_xxx" />
            </div>
            <div>
              <Label>List ID</Label>
              <Input value={form.list_id} onChange={(e) => setForm({ ...form, list_id: e.target.value })} placeholder="1" />
            </div>
          </>
        );
      case "hubspot":
        return (
          <>
            <div>
              <Label>Private App Token</Label>
              <Input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="pat-xxxxxxxx" />
            </div>
            <div>
              <Label>List ID</Label>
              <Input value={form.list_id} onChange={(e) => setForm({ ...form, list_id: e.target.value })} placeholder="12345" />
            </div>
          </>
        );
      case "convertkit":
        return (
          <>
            <div>
              <Label>API Key</Label>
              <Input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="ck_xxx" />
            </div>
            <div>
              <Label>Form ID</Label>
              <Input value={form.form_id} onChange={(e) => setForm({ ...form, form_id: e.target.value })} placeholder="1234567" />
            </div>
          </>
        );
      case "mailerlite":
        return (
          <>
            <div>
              <Label>API Key</Label>
              <Input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="ml_xxx" />
            </div>
            <div>
              <Label>Group ID</Label>
              <Input value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })} placeholder="group_id" />
            </div>
          </>
        );
      case "webhook":
        return (
          <>
            <div>
              <Label>Endpoint URL</Label>
              <Input value={form.endpoint_url} onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} placeholder="https://example.com/webhook" />
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Header key</Label>
                <Input value={form.header_key} onChange={(e) => setForm({ ...form, header_key: e.target.value })} placeholder="X-Webhook-Secret" />
              </div>
              <div>
                <Label>Header value</Label>
                <Input value={form.header_value} onChange={(e) => setForm({ ...form, header_value: e.target.value })} placeholder="secret" />
              </div>
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
          <DialogTitle>Add CRM / ESP Integration</DialogTitle>
          <DialogDescription className="text-slate-600">
            Stores credentials securely and associates them with @{userName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Connection Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Main Audience" />
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-3">
            <ProviderFields />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || missing.length > 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? "Saving…" : "Save Integration"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}