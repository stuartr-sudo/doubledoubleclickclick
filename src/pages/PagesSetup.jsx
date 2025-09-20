
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ContentEndpoint } from "@/api/entities";
import { WritingStyle } from "@/api/entities";
import { PageStyle } from "@/api/entities";
import { PageOption } from "@/api/entities";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

// Queue + retry helpers to mitigate rate limits
const requestQueue = { chain: Promise.resolve() };
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function enqueue(fn) {
  const run = async () => await fn();
  // Chain sequentially to avoid burst requests across tabs
  requestQueue.chain = requestQueue.chain.then(run, run);
  return requestQueue.chain;
}

async function withRetry(fn, { retries = 6, baseDelay = 600 } = {}) {
  let attempt = 0;
  let delay = baseDelay;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const msg = (err && (err.message || err.detail || String(err))) || "";
      const isRateLimit =
        status === 429 ||
        /rate limit/i.test(msg) ||
        /too many requests/i.test(msg) ||
        /\b429\b/.test(msg);

      if (attempt < retries && isRateLimit) {
        // jittered exponential backoff
        const jitter = Math.floor(Math.random() * 200);
        await sleep(delay + jitter);
        attempt += 1;
        delay = Math.min(delay * 2, 8000); // Cap delay at 8 seconds
        continue;
      }
      throw err;
    }
  }
}

function JsonInput({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "{ \"properties\": { ... }, \"required\": [] }"}
        className="min-h-[120px]"
      />
      <p className="text-xs text-slate-500">Enter valid JSON.</p>
    </div>
  );
}

// Update: loader supports auto-load and exposes hasLoaded
function useListLoader(loadFn, { auto = true } = {}) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(Boolean(auto));
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await enqueue(() => withRetry(() => loadFn()));
      setItems(list || []);
      setHasLoaded(true);
    } catch (e) {
      console.error("Failed to load list:", e);
    } finally {
      setLoading(false);
    }
  }, [loadFn]);

  React.useEffect(() => {
    if (auto) {
      reload();
    }
  }, [auto, reload]);

  return { items, loading, hasLoaded, reload };
}

function parseJsonOrAlert(str, fieldName) {
  if (!str || !String(str).trim()) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    alert(`Invalid JSON in ${fieldName}: ${e.message}`);
    throw e;
  }
}

export default function PagesSetup() {
  // Load data lists (Endpoints auto-load; others lazy)
  const endpoints = useListLoader(async () => ContentEndpoint.list("-updated_date", 50), { auto: true });
  const writingStyles = useListLoader(async () => WritingStyle.list("-updated_date", 50), { auto: false });
  const pageStyles = useListLoader(async () => PageStyle.list("-updated_date", 50), { auto: false });
  const pageOptions = useListLoader(async () => PageOption.list("-updated_date", 50), { auto: false });

  // Track active tab and lazy-load on demand
  const [activeTab, setActiveTab] = React.useState("endpoints");

  React.useEffect(() => {
    if (activeTab === "writing" && !writingStyles.hasLoaded) writingStyles.reload();
    if (activeTab === "pstyles" && !pageStyles.hasLoaded) pageStyles.reload();
    if (activeTab === "poptions" && !pageOptions.hasLoaded) pageOptions.reload();
  }, [activeTab, writingStyles.hasLoaded, pageStyles.hasLoaded, pageOptions.hasLoaded, writingStyles, pageStyles, pageOptions]);

  // Shared helpers
  const [saving, setSaving] = React.useState(false);

  // ----- Endpoints -----
  const emptyEndpoint = {
    name: "",
    url: "",
    method: "POST",
    headers: "",
    notes: "",
    input_fields_schema: "",
    expected_output_json_schema: "",
    timeout_ms: 30000,
    is_active: true
  };
  const [selectedEndpointId, setSelectedEndpointId] = React.useState(null);
  const [endpointForm, setEndpointForm] = React.useState(emptyEndpoint);

  const loadEndpointToForm = (rec) => {
    setSelectedEndpointId(rec?.id || null);
    setEndpointForm({
      name: rec?.name || "",
      url: rec?.url || "",
      method: rec?.method || "POST",
      headers: rec?.headers ? JSON.stringify(rec.headers, null, 2) : "",
      notes: rec?.notes || "",
      input_fields_schema: rec?.input_fields_schema ? JSON.stringify(rec.input_fields_schema, null, 2) : "",
      expected_output_json_schema: rec?.expected_output_json_schema ? JSON.stringify(rec.expected_output_json_schema, null, 2) : "",
      timeout_ms: rec?.timeout_ms ?? 30000,
      is_active: rec?.is_active !== false
    });
  };

  const resetEndpointForm = () => {
    setSelectedEndpointId(null);
    setEndpointForm(emptyEndpoint);
  };

  const saveEndpoint = async () => {
    setSaving(true);
    try {
      const payload = {
        name: endpointForm.name,
        url: endpointForm.url,
        method: endpointForm.method,
        headers: parseJsonOrAlert(endpointForm.headers, "Headers") || undefined,
        notes: endpointForm.notes || undefined,
        input_fields_schema: parseJsonOrAlert(endpointForm.input_fields_schema, "Input Fields Schema") || undefined,
        expected_output_json_schema: parseJsonOrAlert(endpointForm.expected_output_json_schema, "Expected Output Schema") || undefined,
        timeout_ms: Number(endpointForm.timeout_ms) || 30000,
        is_active: !!endpointForm.is_active
      };
      if (selectedEndpointId) {
        await ContentEndpoint.update(selectedEndpointId, payload);
      } else {
        await ContentEndpoint.create(payload);
      }
      await endpoints.reload();
      resetEndpointForm();
      alert("Endpoint saved.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEndpoint = async () => {
    if (!selectedEndpointId) return;
    if (!confirm("Delete this endpoint?")) return;
    await ContentEndpoint.delete(selectedEndpointId);
    await endpoints.reload();
    resetEndpointForm();
  };

  // ----- Writing Styles -----
  const emptyWriting = {
    name: "",
    description: "",
    llm_instruction_snippet: "",
    endpoint_id: "",
    is_active: true
  };
  const [selectedWritingId, setSelectedWritingId] = React.useState(null);
  const [writingForm, setWritingForm] = React.useState(emptyWriting);

  const loadWritingToForm = (rec) => {
    setSelectedWritingId(rec?.id || null);
    setWritingForm({
      name: rec?.name || "",
      description: rec?.description || "",
      llm_instruction_snippet: rec?.llm_instruction_snippet || "",
      endpoint_id: rec?.endpoint_id || "",
      is_active: rec?.is_active !== false
    });
  };
  const resetWritingForm = () => { setSelectedWritingId(null); setWritingForm(emptyWriting); };
  const saveWriting = async () => {
    setSaving(true);
    try {
      const payload = {
        name: writingForm.name,
        description: writingForm.description || undefined,
        llm_instruction_snippet: writingForm.llm_instruction_snippet,
        endpoint_id: writingForm.endpoint_id,
        is_active: !!writingForm.is_active
      };
      if (selectedWritingId) {
        await WritingStyle.update(selectedWritingId, payload);
      } else {
        await WritingStyle.create(payload);
      }
      await writingStyles.reload();
      resetWritingForm();
      alert("Writing style saved.");
    } finally {
      setSaving(false);
    }
  };
  const deleteWriting = async () => {
    if (!selectedWritingId) return;
    if (!confirm("Delete this writing style?")) return;
    await WritingStyle.delete(selectedWritingId);
    await writingStyles.reload();
    resetWritingForm();
  };

  // ----- Page Styles -----
  const emptyPStyle = {
    name: "",
    description: "",
    css_classes: "",
    template_html_snippet: "",
    preview_image_url: "",
    is_active: true
  };
  const [selectedPStyleId, setSelectedPStyleId] = React.useState(null);
  const [pstyleForm, setPstyleForm] = React.useState(emptyPStyle);

  const loadPStyleToForm = (rec) => {
    setSelectedPStyleId(rec?.id || null);
    setPstyleForm({
      name: rec?.name || "",
      description: rec?.description || "",
      css_classes: rec?.css_classes || "",
      template_html_snippet: rec?.template_html_snippet || "",
      preview_image_url: rec?.preview_image_url || "",
      is_active: rec?.is_active !== false
    });
  };
  const resetPStyleForm = () => { setSelectedPStyleId(null); setPstyleForm(emptyPStyle); };
  const savePStyle = async () => {
    setSaving(true);
    try {
      const payload = {
        name: pstyleForm.name,
        description: pstyleForm.description || undefined,
        css_classes: pstyleForm.css_classes || undefined,
        template_html_snippet: pstyleForm.template_html_snippet || undefined,
        preview_image_url: pstyleForm.preview_image_url || undefined,
        is_active: !!pstyleForm.is_active
      };
      if (selectedPStyleId) {
        await PageStyle.update(selectedPStyleId, payload);
      } else {
        await PageStyle.create(payload);
      }
      await pageStyles.reload();
      resetPStyleForm();
      alert("Page style saved.");
    } finally {
      setSaving(false);
    }
  };
  const deletePStyle = async () => {
    if (!selectedPStyleId) return;
    if (!confirm("Delete this page style?")) return;
    await PageStyle.delete(selectedPStyleId);
    await pageStyles.reload();
    resetPStyleForm();
  };

  // ----- Page Options -----
  const emptyPOption = {
    name: "",
    description: "",
    default_writing_style_id: "",
    default_page_style_id: "",
    endpoint_id: "",
    additional_context: "",
    is_active: true
  };
  const [selectedPOptionId, setSelectedPOptionId] = React.useState(null);
  const [poptionForm, setPoptionForm] = React.useState(emptyPOption);

  const loadPOptionToForm = (rec) => {
    setSelectedPOptionId(rec?.id || null);
    setPoptionForm({
      name: rec?.name || "",
      description: rec?.description || "",
      default_writing_style_id: rec?.default_writing_style_id || "",
      default_page_style_id: rec?.default_page_style_id || "",
      endpoint_id: rec?.endpoint_id || "",
      additional_context: rec?.additional_context || "",
      is_active: rec?.is_active !== false
    });
  };
  const resetPOptionForm = () => { setSelectedPOptionId(null); setPoptionForm(emptyPOption); };
  const savePOption = async () => {
    setSaving(true);
    try {
      const payload = {
        name: poptionForm.name,
        description: poptionForm.description || undefined,
        default_writing_style_id: poptionForm.default_writing_style_id || undefined,
        default_page_style_id: poptionForm.default_page_style_id || undefined,
        endpoint_id: poptionForm.endpoint_id || undefined,
        additional_context: poptionForm.additional_context || undefined,
        is_active: !!poptionForm.is_active
      };
      if (selectedPOptionId) {
        await PageOption.update(selectedPOptionId, payload);
      } else {
        await PageOption.create(payload);
      }
      await pageOptions.reload();
      resetPOptionForm();
      alert("Page option saved.");
    } finally {
      setSaving(false);
    }
  };
  const deletePOption = async () => {
    if (!selectedPOptionId) return;
    if (!confirm("Delete this page option?")) return;
    await PageOption.delete(selectedPOptionId);
    await pageOptions.reload();
    resetPOptionForm();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Pages Setup</h1>
          <p className="text-white/70">Configure endpoints, writing styles, page styles and page options used by the Pages wizard.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="writing">Writing Styles</TabsTrigger>
            <TabsTrigger value="pstyles">Page Styles</TabsTrigger>
            <TabsTrigger value="poptions">Page Options</TabsTrigger>
          </TabsList>

          {/* Endpoints */}
          <TabsContent value="endpoints">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">All Endpoints</h3>
                  <Button size="sm" variant="outline" onClick={resetEndpointForm} className="bg-white/10 border-white/20"> <Plus className="w-4 h-4 mr-1" /> New</Button>
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {endpoints.loading ? (
                    <div className="py-8 text-white/70 flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</div>
                  ) : (endpoints.items || []).map(ep => (
                    <button
                      key={ep.id}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 ${selectedEndpointId === ep.id ? 'bg-white/10' : ''}`}
                      onClick={() => loadEndpointToForm(ep)}
                    >
                      <div className="font-medium">{ep.name}</div>
                      <div className="text-xs text-white/60 truncate">{ep.url}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={endpointForm.name} onChange={(e) => setEndpointForm({ ...endpointForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select value={endpointForm.method} onValueChange={(v) => setEndpointForm({ ...endpointForm, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>URL</Label>
                    <Input value={endpointForm.url} onChange={(e) => setEndpointForm({ ...endpointForm, url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <Label>Timeout (ms)</Label>
                    <Input type="number" value={endpointForm.timeout_ms} onChange={(e) => setEndpointForm({ ...endpointForm, timeout_ms: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={endpointForm.is_active} onCheckedChange={(v) => setEndpointForm({ ...endpointForm, is_active: !!v })} />
                    <Label>Active</Label>
                  </div>
                </div>

                <JsonInput label="Headers (JSON)" value={endpointForm.headers} onChange={(v) => setEndpointForm({ ...endpointForm, headers: v })} />
                <JsonInput label="Input Fields Schema (JSON)" value={endpointForm.input_fields_schema} onChange={(v) => setEndpointForm({ ...endpointForm, input_fields_schema: v })} />
                <JsonInput label="Expected Output Schema (JSON)" value={endpointForm.expected_output_json_schema} onChange={(v) => setEndpointForm({ ...endpointForm, expected_output_json_schema: v })} />
                <div>
                  <Label>Notes</Label>
                  <Textarea value={endpointForm.notes} onChange={(e) => setEndpointForm({ ...endpointForm, notes: e.target.value })} />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveEndpoint} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </Button>
                  {selectedEndpointId && (
                    <Button variant="destructive" onClick={deleteEndpoint} className="gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Writing Styles */}
          <TabsContent value="writing">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">All Writing Styles</h3>
                  <Button size="sm" variant="outline" onClick={resetWritingForm} className="bg-white/10 border-white/20"> <Plus className="w-4 h-4 mr-1" /> New</Button>
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {writingStyles.loading ? (
                    <div className="py-8 text-white/70 flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</div>
                  ) : (writingStyles.items || []).map(ws => (
                    <button key={ws.id} className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 ${selectedWritingId === ws.id ? 'bg-white/10' : ''}`} onClick={() => loadWritingToForm(ws)}>
                      <div className="font-medium">{ws.name}</div>
                      <div className="text-xs text-white/60 truncate">{ws.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={writingForm.name} onChange={(e) => setWritingForm({ ...writingForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Endpoint</Label>
                    <Select value={writingForm.endpoint_id} onValueChange={(v) => setWritingForm({ ...writingForm, endpoint_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select endpoint" /></SelectTrigger>
                      <SelectContent>
                        {(endpoints.items || []).filter(e => e.is_active !== false).map(ep => (
                          <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input value={writingForm.description} onChange={(e) => setWritingForm({ ...writingForm, description: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>LLM Instruction Snippet</Label>
                    <Textarea value={writingForm.llm_instruction_snippet} onChange={(e) => setWritingForm({ ...writingForm, llm_instruction_snippet: e.target.value })} className="min-h-[120px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={writingForm.is_active} onCheckedChange={(v) => setWritingForm({ ...writingForm, is_active: !!v })} />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveWriting} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </Button>
                  {selectedWritingId && (
                    <Button variant="destructive" onClick={deleteWriting} className="gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Page Styles */}
          <TabsContent value="pstyles">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">All Page Styles</h3>
                  <Button size="sm" variant="outline" onClick={resetPStyleForm} className="bg-white/10 border-white/20"> <Plus className="w-4 h-4 mr-1" /> New</Button>
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {pageStyles.loading ? (
                    <div className="py-8 text-white/70 flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</div>
                  ) : (pageStyles.items || []).map(ps => (
                    <button key={ps.id} className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 ${selectedPStyleId === ps.id ? 'bg-white/10' : ''}`} onClick={() => loadPStyleToForm(ps)}>
                      <div className="font-medium">{ps.name}</div>
                      <div className="text-xs text-white/60 truncate">{ps.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={pstyleForm.name} onChange={(e) => setPstyleForm({ ...pstyleForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Preview Image URL</Label>
                    <Input value={pstyleForm.preview_image_url} onChange={(e) => setPstyleForm({ ...pstyleForm, preview_image_url: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input value={pstyleForm.description} onChange={(e) => setPstyleForm({ ...pstyleForm, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>CSS Classes</Label>
                    <Input value={pstyleForm.css_classes} onChange={(e) => setPstyleForm({ ...pstyleForm, css_classes: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Template HTML Snippet</Label>
                    <Textarea value={pstyleForm.template_html_snippet} onChange={(e) => setPstyleForm({ ...pstyleForm, template_html_snippet: e.target.value })} className="min-h-[120px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={pstyleForm.is_active} onCheckedChange={(v) => setPstyleForm({ ...pstyleForm, is_active: !!v })} />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePStyle} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </Button>
                  {selectedPStyleId && (
                    <Button variant="destructive" onClick={deletePStyle} className="gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Page Options */}
          <TabsContent value="poptions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">All Page Options</h3>
                  <Button size="sm" variant="outline" onClick={resetPOptionForm} className="bg-white/10 border-white/20"> <Plus className="w-4 h-4 mr-1" /> New</Button>
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {pageOptions.loading ? (
                    <div className="py-8 text-white/70 flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</div>
                  ) : (pageOptions.items || []).map(po => (
                    <button key={po.id} className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 ${selectedPOptionId === po.id ? 'bg-white/10' : ''}`} onClick={() => loadPOptionToForm(po)}>
                      <div className="font-medium">{po.name}</div>
                      <div className="text-xs text-white/60 truncate">{po.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={poptionForm.name} onChange={(e) => setPoptionForm({ ...poptionForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Endpoint (fallback)</Label>
                    <Select value={poptionForm.endpoint_id} onValueChange={(v) => setPoptionForm({ ...poptionForm, endpoint_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select endpoint" /></SelectTrigger>
                      <SelectContent>
                        {(endpoints.items || []).filter(e => e.is_active !== false).map(ep => (
                          <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Writing Style</Label>
                    <Select value={poptionForm.default_writing_style_id} onValueChange={(v) => setPoptionForm({ ...poptionForm, default_writing_style_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select writing style" /></SelectTrigger>
                      <SelectContent>
                        {(writingStyles.items || []).filter(w => w.is_active !== false).map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Page Style</Label>
                    <Select value={poptionForm.default_page_style_id} onValueChange={(v) => setPoptionForm({ ...poptionForm, default_page_style_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select page style" /></SelectTrigger>
                      <SelectContent>
                        {(pageStyles.items || []).filter(s => s.is_active !== false).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input value={poptionForm.description} onChange={(e) => setPoptionForm({ ...poptionForm, description: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Additional Context</Label>
                    <Textarea value={poptionForm.additional_context} onChange={(e) => setPoptionForm({ ...poptionForm, additional_context: e.target.value })} className="min-h-[100px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={poptionForm.is_active} onCheckedChange={(v) => setPoptionForm({ ...poptionForm, is_active: !!v })} />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePOption} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </Button>
                  {selectedPOptionId && (
                    <Button variant="destructive" onClick={deletePOption} className="gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
