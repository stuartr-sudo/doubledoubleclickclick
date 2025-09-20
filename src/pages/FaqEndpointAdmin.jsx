
import React from "react";
import { User } from "@/api/entities";
import { ContentEndpoint } from "@/api/entities";
import { callFaqEndpoint } from "@/api/functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Save, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

export default function FaqEndpointAdmin() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [endpoints, setEndpoints] = React.useState([]);
  const [filterFaqOnly, setFilterFaqOnly] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const emptyForm = {
    id: null,
    name: "",
    url: "",
    method: "POST",
    headersText: "{\n  \"Content-Type\": \"application/json\"\n}",
    notes: "faq",
    is_active: true,
    timeout_ms: 30000,
    markAsFaq: true,
  };
  const [form, setForm] = React.useState(emptyForm);
  const [testHtml, setTestHtml] = React.useState("<p>Paste a small sample of your article HTML here…</p>");
  const [testResult, setTestResult] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        await loadEndpoints();
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadEndpoints = async () => {
    setErrorMsg("");
    const list = await ContentEndpoint.list("-created_date").catch(() => []);
    setEndpoints(Array.isArray(list) ? list : []);
  };

  const isSuperadmin = !!currentUser?.is_superadmin;

  const resetForm = () => {
    setForm(emptyForm);
    setSuccessMsg("");
    setErrorMsg("");
    setTestResult(null);
  };

  const editEndpoint = (ep) => {
    setForm({
      id: ep.id,
      name: ep.name || "",
      url: ep.url || "",
      method: (ep.method || "POST").toUpperCase(),
      headersText: JSON.stringify(ep.headers || { "Content-Type": "application/json" }, null, 2),
      notes: ep.notes || "",
      is_active: ep.is_active !== false,
      timeout_ms: ep.timeout_ms || 30000,
      markAsFaq: /\bfac|faq\b/i.test((ep.name || "") + " " + (ep.notes || "")),
    });
    setSuccessMsg("");
    setErrorMsg("");
    setTestResult(null);
  };

  const deleteEndpoint = async (id) => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await ContentEndpoint.delete(id);
      await loadEndpoints();
      if (form.id === id) resetForm();
      setSuccessMsg("Endpoint deleted.");
    } catch (e) {
      setErrorMsg("Failed to delete endpoint.");
    } finally {
      setSaving(false);
    }
  };

  const saveEndpoint = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    let headersObj = {};
    try {
      headersObj = form.headersText ? JSON.parse(form.headersText) : {};
    } catch (e) {
      setSaving(false);
      setErrorMsg("Headers must be valid JSON.");
      return;
    }

    // Auto-ensure FAQ tagging if the box is checked
    let name = form.name.trim();
    let notes = (form.notes || "").trim();
    if (form.markAsFaq) {
      if (!/faq/i.test(name)) name = name ? `${name} [FAQ]` : "FAQ Endpoint";
      if (!/faq/i.test(notes)) notes = notes ? `${notes} faq` : "faq";
    }

    const payload = {
      name,
      url: form.url.trim(),
      method: (form.method || "POST").toUpperCase(),
      headers: headersObj,
      notes,
      is_active: !!form.is_active,
      timeout_ms: Number(form.timeout_ms) || 30000,
    };

    try {
      if (form.id) {
        await ContentEndpoint.update(form.id, payload);
        setSuccessMsg("Endpoint updated.");
      } else {
        await ContentEndpoint.create(payload);
        setSuccessMsg("Endpoint created.");
      }
      await loadEndpoints();
    } catch (e) {
      setErrorMsg("Failed to save endpoint.");
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data } = await callFaqEndpoint({
        endpoint_id: form.id || undefined,
        custom_url: form.id ? undefined : (form.url || undefined),
        method: form.method,
        headers: form.headersText ? JSON.parse(form.headersText) : undefined,
        html: testHtml,
        selected_html: "",
        extra_payload: {}
      });

      setTestResult({
        ok: true,
        faqs: Array.isArray(data?.faqs) ? data.faqs : [],
      });
      if (!(data?.faqs) || data.faqs.length === 0) {
        setSuccessMsg("Test succeeded, but no FAQs were returned. Check your endpoint format.");
      }
    } catch (e) {
      setTestResult({ ok: false, error: "Test call failed. Check URL, headers, and payload." });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (!isSuperadmin) {
    return (
      <div className="min-h-screen p-6">
        <Card className="p-6">
          <div className="text-slate-800 font-semibold mb-2">Access restricted</div>
          <div className="text-slate-600 text-sm">
            This page is only available to superadmins.
          </div>
        </Card>
      </div>
    );
  }

  const visibleEndpoints = filterFaqOnly
    ? endpoints.filter((e) => {
        const n = (e.name || "").toLowerCase();
        const notes = (e.notes || "").toLowerCase();
        return e.is_active !== false && (n.includes("faq") || notes.includes("faq"));
      })
    : endpoints;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">FAQ Endpoints</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadEndpoints} className="gap-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button onClick={resetForm} className="gap-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50" variant="outline">
              <Plus className="w-4 h-4" /> New Endpoint
            </Button>
          </div>
        </div>

        <Card className="p-4 bg-white border border-slate-200 text-slate-900">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-slate-600">
              Manage which endpoint your FAQ generator sends content to. The Generate FAQs modal lists saved endpoints where the name or notes include “faq”.
            </div>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterFaqOnly}
                onChange={(e) => setFilterFaqOnly(e.target.checked)}
              />
              Show FAQ-tagged only
            </label>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">URL</th>
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2 pr-3">Notes</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleEndpoints.map((ep) => (
                  <tr key={ep.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <button
                        className="text-slate-900 hover:underline"
                        onClick={() => editEndpoint(ep)}
                      >
                        {ep.name || "(untitled)"}
                      </button>
                      {/faq/i.test((ep.name||"") + " " + (ep.notes||"")) && (
                        <Badge className="ml-2 bg-indigo-100 text-indigo-800">FAQ</Badge>
                      )}
                    </td>
                    <td className="py-2 pr-3">{(ep.method || "POST").toUpperCase()}</td>
                    <td className="py-2 pr-3 break-all">{ep.url}</td>
                    <td className="py-2 pr-3">{ep.is_active !== false ? "Yes" : "No"}</td>
                    <td className="py-2 pr-3 text-slate-600">{ep.notes}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => editEndpoint(ep)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteEndpoint(ep.id)}
                          disabled={saving}
                          className="gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleEndpoints.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No endpoints found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 bg-white border border-slate-200 text-slate-900">
            <div className="text-lg font-semibold mb-4">{form.id ? "Edit Endpoint" : "New Endpoint"}</div>
            {errorMsg && (
              <div className="mb-3 text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-3 text-sm text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {successMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., N8N FAQ Builder"
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://your-service.example.com/faq"
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Method</Label>
                  <Select
                    value={form.method}
                    onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}
                  >
                    <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeout (ms)</Label>
                  <Input
                    type="number"
                    value={form.timeout_ms}
                    onChange={(e) => setForm((f) => ({ ...f, timeout_ms: e.target.value }))}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <Label>Headers (JSON)</Label>
                <Textarea
                  value={form.headersText}
                  onChange={(e) => setForm((f) => ({ ...f, headersText: e.target.value }))}
                  rows={6}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Add 'faq' here to make it available in the Generate FAQs modal"
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.markAsFaq}
                    onChange={(e) => setForm((f) => ({ ...f, markAsFaq: e.target.checked }))}
                  />
                  Mark as FAQ endpoint
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active
                </label>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveEndpoint} disabled={saving} variant="outline" className="gap-2 bg-white border border-slate-300 text-slate-900 hover:bg-slate-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </Button>
                <Button variant="outline" onClick={resetForm} className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50">Cancel</Button>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-200 text-slate-900">
            <div className="text-lg font-semibold mb-4">Test Endpoint</div>
            <div className="space-y-3">
              <div>
                <Label>Sample Article HTML</Label>
                <Textarea value={testHtml} onChange={(e) => setTestHtml(e.target.value)} rows={8} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
              </div>
              <div className="flex gap-2">
                <Button onClick={runTest} disabled={testing || (!form.id && !form.url)} className="gap-2 bg-white border border-slate-300 text-slate-900 hover:bg-slate-50" variant="outline">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Send Test
                </Button>
                {testResult?.ok && (
                  <Badge className="bg-emerald-100 text-emerald-800">OK</Badge>
                )}
                {testResult && !testResult.ok && (
                  <Badge className="bg-red-100 text-red-800">Error</Badge>
                )}
              </div>
              <div className="border rounded-md p-3 bg-slate-50 max-h-64 overflow-auto text-xs text-slate-800">
                {testResult
                  ? testResult.ok
                    ? (testResult.faqs?.length
                        ? <pre className="whitespace-pre-wrap">{JSON.stringify(testResult.faqs, null, 2)}</pre>
                        : "No FAQs returned.")
                    : testResult.error
                  : "Run a test to see the response here."}
              </div>
              <p className="text-xs text-slate-600">
                The Generate FAQs modal will send html and selected_html to the chosen endpoint and only format the returned FAQs with your selected template.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
