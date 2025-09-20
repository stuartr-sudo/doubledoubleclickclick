
import React from "react";
import { FeatureFlag } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { listCallableFunctions } from "@/api/functions";

// Helper function to safely stringify JSON objects for display
function stringify(obj) {
  try { return JSON.stringify(obj || {}, null, 2); } catch { return "{}"; }
}

export default function FeatureEndpointForm() {
  const [flags, setFlags] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [form, setForm] = React.useState({
    call_type: "",
    target_name: "",
    http_method: "POST",
    headers: {},
    request_schema: {},
    response_schema: {},
    sample_payload: {}
  });
  const [status, setStatus] = React.useState("");
  const [functionOptions, setFunctionOptions] = React.useState({
    internal_functions: [],
    integration_core: []
  });

  // Load flags once
  React.useEffect(() => {
    (async () => {
      const list = await FeatureFlag.list();
      setFlags(list || []);
    })();
  }, []);

  // NEW: Load selectable targets for dropdowns
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await listCallableFunctions();
        setFunctionOptions({
          internal_functions: data?.internal_functions || [],
          integration_core: data?.integration_core || []
        });
      } catch {
        // fallback: leave arrays empty
      }
    })();
  }, []);

  // After flags load, select the first if nothing selected yet
  React.useEffect(() => {
    if (!selectedId && flags && flags.length) {
      setSelectedId(flags[0].id);
    }
  }, [flags, selectedId]);

  // Update form when selection changes
  React.useEffect(() => {
    const flag = flags.find(f => f.id === selectedId);
    if (!flag) return;
    setForm({
      call_type: flag.call_type || "",
      target_name: flag.target_name || "",
      http_method: flag.http_method || "POST",
      // Parse JSON fields directly, handling potential string or object types
      headers: (typeof flag.headers === "string" ? JSON.parse(flag.headers || "{}") : (flag.headers || {})),
      request_schema: (typeof flag.request_schema === "string" ? JSON.parse(flag.request_schema || "{}") : (flag.request_schema || {})),
      response_schema: (typeof flag.response_schema === "string" ? JSON.parse(flag.response_schema || "{}") : (flag.response_schema || {})),
      sample_payload: (typeof flag.sample_payload === "string" ? JSON.parse(flag.sample_payload || "{}") : (flag.sample_payload || {}))
    });
    setStatus("");
  }, [selectedId, flags]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setStatus("");
    const flag = flags.find(f => f.id === selectedId);
    if (!flag) { setStatus("Please select a feature."); return; }
    try {
      // Validate JSON textareas by parsing from strings if needed
      const headers = typeof form.headers === "string" ? JSON.parse(form.headers || "{}") : form.headers;
      const reqS = typeof form.request_schema === "string" ? JSON.parse(form.request_schema || "{}") : form.request_schema;
      const resS = typeof form.response_schema === "string" ? JSON.parse(form.response_schema || "{}") : form.response_schema;
      const sample = typeof form.sample_payload === "string" ? JSON.parse(form.sample_payload || "{}") : form.sample_payload;

      await FeatureFlag.update(flag.id, {
        call_type: form.call_type || null,
        target_name: form.target_name || null,
        http_method: form.http_method || "POST",
        headers,
        request_schema: reqS,
        response_schema: resS,
        sample_payload: sample
      });
      setStatus("Saved!");
    } catch (e) {
      setStatus(e?.message || "Failed to save.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Advanced Endpoint Overrides</h3>
        <div className="text-sm text-slate-500">Configure where each Ask AI feature sends its request.</div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="md:col-span-1">
          <Label className="text-slate-700">Feature</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="mt-1 bg-white border-slate-300 text-slate-900">
              <SelectValue placeholder="Select a feature" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              {flags.map(f => (
                <SelectItem key={f.id} value={f.id} className="text-slate-900">
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-700">Call Type</Label>
          <Select value={form.call_type || ""} onValueChange={(v) => {
            update("call_type", v);
            // Reset target when call type changes
            update("target_name", "");
          }}>
            <SelectTrigger className="mt-1 bg-white border-slate-300 text-slate-900">
              <SelectValue placeholder="Choose how to call" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="internal_function" className="text-slate-900">Internal Function</SelectItem>
              <SelectItem value="external_webhook" className="text-slate-900">External Webhook</SelectItem>
              <SelectItem value="integration_core" className="text-slate-900">Integration (Core)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* NEW: Target as dropdown for internal/integration, input for webhook */}
        <div>
          <Label className="text-slate-700">Target</Label>
          {form.call_type === "internal_function" ? (
            <Select
              value={form.target_name || ""}
              onValueChange={(v) => update("target_name", v)}
            >
              <SelectTrigger className="mt-1 bg-white border-slate-300 text-slate-900">
                <SelectValue placeholder="Pick a backend function" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 max-h-72">
                {functionOptions.internal_functions.map(fn => (
                  <SelectItem key={fn} value={fn} className="text-slate-900">
                    {fn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : form.call_type === "integration_core" ? (
            <Select
              value={form.target_name || ""}
              onValueChange={(v) => update("target_name", v)}
            >
              <SelectTrigger className="mt-1 bg-white border-slate-300 text-slate-900">
                <SelectValue placeholder="Pick an integration method" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {functionOptions.integration_core.map(m => (
                  <SelectItem key={m} value={m} className="text-slate-900">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              placeholder="https://example.com/webhook"
              value={form.target_name || ""}
              onChange={(e) => update("target_name", e.target.value)}
            />
          )}
        </div>
      </div>

      {form.call_type === "external_webhook" && (
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="md:col-span-1">
            <Label className="text-slate-700">HTTP Method</Label>
            <Select value={form.http_method || "POST"} onValueChange={(v) => update("http_method", v)}>
              <SelectTrigger className="mt-1 bg-white border-slate-300 text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="GET" className="text-slate-900">GET</SelectItem>
                <SelectItem value="POST" className="text-slate-900">POST</SelectItem>
                <SelectItem value="PUT" className="text-slate-900">PUT</SelectItem>
                <SelectItem value="PATCH" className="text-slate-900">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-slate-700">Headers (JSON)</Label>
            <Textarea
              className="mt-1 font-mono text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
              rows={4}
              value={typeof form.headers === "string" ? form.headers : stringify(form.headers)}
              onChange={(e) => update("headers", e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label className="text-slate-700">Request Schema (JSON)</Label>
          <Textarea
            className="mt-1 font-mono text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            rows={8}
            value={typeof form.request_schema === "string" ? form.request_schema : stringify(form.request_schema)}
            onChange={(e) => update("request_schema", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-slate-700">Response Schema (JSON)</Label>
          <Textarea
            className="mt-1 font-mono text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            rows={8}
            value={typeof form.response_schema === "string" ? form.response_schema : stringify(form.response_schema)}
            onChange={(e) => update("response_schema", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-slate-700">Sample Payload (JSON)</Label>
        <Textarea
          className="mt-1 font-mono text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
          rows={6}
          value={typeof form.sample_payload === "string" ? form.sample_payload : stringify(form.sample_payload)}
          onChange={(e) => update("sample_payload", e.target.value)}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800">Save Configuration</Button>
        <div className="text-sm text-slate-600">{status}</div>
      </div>
    </div>
  );
}
