import React, { useEffect, useMemo, useState } from "react";
import { LlmModelLabel } from "@/api/entities";
import { LlmSettings } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, KeyRound, RefreshCw, Save, ShieldCheck, XCircle, Plus, Beaker } from "lucide-react";
import { llmRouterStatus } from "@/api/functions";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function AdminLLM() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState([]);
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState({ providers: [] });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});

  useEffect(() => {
    (async () => {
      const u = await User.me().catch(() => null);
      setMe(u);
      if (!u?.is_superadmin) {
        setLoading(false);
        return;
      }
      const [lab, setts] = await Promise.all([
        LlmModelLabel.list().catch(() => []),
        LlmSettings.list().catch(() => []),
      ]);
      setLabels(lab.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
      setSettings(setts?.[0] || null);
      const { data } = await llmRouterStatus();
      setStatus(data || { providers: [] });
      setLoading(false);
    })();
  }, []);

  const providerMap = useMemo(() => {
    const m = {};
    (status.providers || []).forEach(p => m[p.id] = p);
    return m;
  }, [status]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  if (!me?.is_superadmin) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be a superadmin to view LLM Settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLabelChange = async (id, patch) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    await LlmModelLabel.update(id, patch);
  };

  const addRow = async () => {
    const rec = await LlmModelLabel.create({
      key: "",
      label: "New Model",
      enabled: true,
      sort_order: (labels[labels.length - 1]?.sort_order || 40) + 1
    });
    setLabels(prev => [...prev, rec]);
  };

  const saveDefaults = async () => {
    setSaving(true);
    try {
      if (settings?.id) {
        await LlmSettings.update(settings.id, settings);
      } else {
        const s = await LlmSettings.create(settings || { default_choice: "auto", auto_priority: ["openai","anthropic","google"] });
        setSettings(s);
      }
      toast.success("LLM defaults saved");
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (pid) => {
    setTesting(prev => ({ ...prev, [pid]: true }));
    try {
      const { data } = await llmRouterStatus({ action: "test", provider: pid });
      if (data?.ok) toast.success(`${pid} responded OK`);
      else toast.error(data?.error || `Test failed: ${data?.output || "no output"}`);
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Test failed");
    } finally {
      setTesting(prev => ({ ...prev, [pid]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5" /> LLM Settings
        </h1>
        <Link to={createPageUrl("Dashboard")} className="text-sm text-slate-500 hover:underline">Back to Dashboard</Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys & Provider Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(status.providers || []).map(p => (
              <div key={p.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium capitalize">{p.id}</div>
                  {p.has_key ? (
                    <span className="text-emerald-600 flex items-center gap-1 text-sm">
                      <ShieldCheck className="w-4 h-4" /> Key set
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1 text-sm">
                      <XCircle className="w-4 h-4" /> Missing
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500">Env var: <code>{p.env}</code></div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider(p.id)}
                    disabled={!p.has_key || testing[p.id]}
                    className="gap-2"
                  >
                    {testing[p.id] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Beaker className="w-3 h-3" />}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast.message("To change API keys, open Dashboard → Settings → Environment Variables and update " + p.env);
                      window.open("https://app.base44.io/dashboard/settings/environment", "_blank");
                    }}
                    className="gap-2"
                  >
                    <KeyRound className="w-3 h-3" />
                    Change key
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Keys are stored as environment variables. To update them: Dashboard → Settings → Environment Variables.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Options (rename, enable/disable)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {labels.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 border rounded-lg p-3">
                <div className="md:col-span-5">
                  <label className="text-xs text-slate-500">Display name</label>
                  <Input
                    value={row.label || ""}
                    onChange={(e) => handleLabelChange(row.id, { label: e.target.value })}
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="text-xs text-slate-500">Internal key</label>
                  <Input
                    value={row.key || ""}
                    onChange={(e) => handleLabelChange(row.id, { key: e.target.value })}
                    placeholder="provider:model (e.g., openai:gpt-4o-mini)"
                  />
                </div>
                <div className="md:col-span-1 flex items-center gap-2">
                  <label className="text-xs text-slate-500">Enabled</label>
                  <Switch
                    checked={!!row.enabled}
                    onCheckedChange={(v) => handleLabelChange(row.id, { enabled: !!v })}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs text-slate-500">Order</label>
                  <Input
                    type="number"
                    value={row.sort_order ?? 0}
                    onChange={(e) => handleLabelChange(row.id, { sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={addRow} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Add option
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-slate-600">Default selection</div>
              <Select
                value={settings?.default_choice || "auto"}
                onValueChange={(v) => setSettings((s) => ({ ...(s || {}), default_choice: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose default" />
                </SelectTrigger>
                <SelectContent>
                  {labels
                    .filter(l => l.enabled)
                    .sort((a,b)=> (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map(l => (
                      <SelectItem key={l.id} value={l.key}>{l.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-slate-600">Auto priority</div>
              <div className="text-xs text-slate-500 mb-1">Order providers by preference</div>
              <div className="grid grid-cols-3 gap-2">
                {["openai","anthropic","google"].map((p, idx) => {
                  const order = (settings?.auto_priority || []).indexOf(p);
                  const val = order >= 0 ? order + 1 : "";
                  return (
                    <div key={p} className="border rounded p-2">
                      <div className="text-xs mb-1 capitalize">{p}</div>
                      <Input
                        type="number"
                        min={1}
                        max={3}
                        placeholder="-"
                        value={val}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          let arr = (settings?.auto_priority || ["openai","anthropic","google"]).slice();
                          // place provider to position n
                          arr = arr.filter(x => x !== p);
                          if (!isNaN(n) && n >= 1 && n <= 3) {
                            arr.splice(n - 1, 0, p);
                          } else {
                            arr.push(p);
                          }
                          setSettings(s => ({ ...(s || {}), auto_priority: arr }));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-slate-600">Notes</div>
              <Input
                value={settings?.notes || ""}
                onChange={(e) => setSettings(s => ({ ...(s || {}), notes: e.target.value }))}
                placeholder="Internal notes…"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveDefaults} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}