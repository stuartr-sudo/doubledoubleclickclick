import React from "react";
import { PageOption } from "@/api/entities";
import { PageStyle } from "@/api/entities";
import { WritingStyle } from "@/api/entities";
import { ContentEndpoint } from "@/api/entities";
import { generatePageFromEndpoint } from "@/api/functions";
import { WebPage } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, FilePlus2, ArrowRight, Copy, Eye } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PageWizard() {
  const [username, setUsername] = React.useState("");
  const [options, setOptions] = React.useState([]);
  const [styles, setStyles] = React.useState([]);
  const [wstyles, setWStyles] = React.useState([]);
  const [endpoints, setEndpoints] = React.useState([]);
  const [selectedOption, setSelectedOption] = React.useState(null);
  const [selectedStyleId, setSelectedStyleId] = React.useState(null);
  const [selectedWStyleId, setSelectedWStyleId] = React.useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = React.useState(null);
  const [inputs, setInputs] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const u = await User.me().catch(() => null);
      const uname = u?.assigned_usernames?.[0] || "";
      setUsername(uname);

      const [po, ps, ws, ep] = await Promise.all([
        PageOption.filter({ is_active: true }).catch(() => []),
        PageStyle.filter({ is_active: true }).catch(() => []),
        WritingStyle.filter({ is_active: true }).catch(() => []),
        ContentEndpoint.filter({ is_active: true }).catch(() => []),
      ]);
      setOptions(po || []);
      setStyles(ps || []);
      setWStyles(ws || []);
      setEndpoints(ep || []);
      setLoading(false);
    })();
  }, []);

  // When option changes, preselect defaults
  React.useEffect(() => {
    if (!selectedOption) return;
    setSelectedWStyleId(selectedOption.default_writing_style_id || null);
    setSelectedStyleId(selectedOption.default_page_style_id || null);
  }, [selectedOption]);

  // When writing style changes, resolve endpoint and reset dynamic inputs
  React.useEffect(() => {
    if (!selectedWStyleId) { setSelectedEndpoint(null); setInputs({}); return; }
    const ws = wstyles.find(w => w.id === selectedWStyleId);
    if (!ws) { setSelectedEndpoint(null); setInputs({}); return; }
    const ep = endpoints.find(e => e.id === ws.endpoint_id) || null;
    setSelectedEndpoint(ep);
    setInputs({});
  }, [selectedWStyleId, wstyles, endpoints]);

  const schema = selectedEndpoint?.input_fields_schema || null;

  const setField = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const renderField = (key, def) => {
    const type = def.type || "string";
    const label = def.title || key;
    const placeholder = def.description || "";
    const val = inputs[key] ?? "";

    if (def.enum && Array.isArray(def.enum)) {
      return (
        <div key={key} className="space-y-2">
          <label className="text-sm text-white/80">{label}</label>
          <Select value={String(val || "")} onValueChange={(v) => setField(key, v)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={placeholder || "Select"} />
            </SelectTrigger>
            <SelectContent className="b44-modal bg-slate-900 border-white/20 text-white">
              {def.enum.map((opt) => (
                <SelectItem key={String(opt)} value={String(opt)} className="text-white">
                  {String(opt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if ((def.format === "textarea") || (type === "string" && (def.maxLength || 0) > 160)) {
      return (
        <div key={key} className="space-y-2">
          <label className="text-sm text-white/80">{label}</label>
          <Textarea
            placeholder={placeholder}
            value={val}
            onChange={(e) => setField(key, e.target.value)}
            className="bg-white/10 border-white/20 text-white min-h-[100px]"
          />
        </div>
      );
    }

    if (type === "number") {
      return (
        <div key={key} className="space-y-2">
          <label className="text-sm text-white/80">{label}</label>
          <Input
            type="number"
            placeholder={placeholder}
            value={val}
            onChange={(e) => setField(key, Number(e.target.value))}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
      );
    }

    if (type === "boolean") {
      return (
        <div key={key} className="flex items-center gap-2">
          <input
            id={key}
            type="checkbox"
            checked={!!val}
            onChange={(e) => setField(key, e.target.checked)}
          />
          <label htmlFor={key} className="text-sm text-white/80">{label}</label>
        </div>
      );
    }

    // default string
    return (
      <div key={key} className="space-y-2">
        <label className="text-sm text-white/80">{label}</label>
        <Input
          placeholder={placeholder}
          value={val}
          onChange={(e) => setField(key, e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>
    );
  };

  const canGenerate = !!selectedOption && !!selectedWStyleId && !!selectedEndpoint;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    const { data } = await generatePageFromEndpoint({
      page_option_id: selectedOption.id,
      writing_style_id: selectedWStyleId,
      page_style_id: selectedStyleId || null,
      endpoint_id: selectedEndpoint.id,
      inputs,
      username
    });

    if (!data?.success && data?.error) {
      alert(data.error);
      setGenerating(false);
      return;
    }

    const res = data?.data || {};
    setResult(res);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!result) return;
    const record = await WebPage.create({
      title: result.title || "Generated Page",
      html: result.html || "",
      status: "draft",
      user_name: username || "",
      page_option_id: selectedOption?.id || null,
      writing_style_id: selectedWStyleId || null,
      page_style_id: selectedStyleId || null,
      endpoint_id: result.endpoint_id || selectedEndpoint?.id || null,
      raw_response: result.raw_response || null
    });
    alert("Saved as draft page.");
  };

  const openInEditor = () => {
    if (!result?.html) return;
    try {
      localStorage.setItem("htmlstudio_content", result.html);
    } catch {}
    window.location.href = createPageUrl("Editor") + "?importHtml=1";
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-white/70">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading wizard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Generate a Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80">Page Option</label>
              <Select
                value={selectedOption?.id || ""}
                onValueChange={(id) => setSelectedOption(options.find(o => o.id === id) || null)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a page type" />
                </SelectTrigger>
                <SelectContent className="b44-modal bg-slate-900 border-white/20 text-white">
                  {options.filter(o => o.is_active !== false).map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-white">
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOption?.description && (
                <p className="text-xs text-white/60">{selectedOption.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Writing Style (defines endpoint)</label>
              <Select
                value={selectedWStyleId || ""}
                onValueChange={setSelectedWStyleId}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a writing style" />
                </SelectTrigger>
                <SelectContent className="b44-modal bg-slate-900 border-white/20 text-white">
                  {wstyles.filter(w => w.is_active !== false).map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-white">
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEndpoint && (
                <p className="text-xs text-white/60">Endpoint: {selectedEndpoint.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80">Page Style (visual wrapper)</label>
              <Select
                value={selectedStyleId || ""}
                onValueChange={setSelectedStyleId}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a page style" />
                </SelectTrigger>
                <SelectContent className="b44-modal bg-slate-900 border-white/20 text-white">
                  {styles.filter(s => s.is_active !== false).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-white">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80">Brand Username</label>
              <Input
                placeholder="e.g., acme-brand"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Dynamic fields from endpoint schema */}
          {schema && schema.properties && (
            <div className="mt-2">
              <h4 className="text-white font-medium mb-3">Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(schema.properties).map(([key, def]) => renderField(key, def))}
              </div>
              {Array.isArray(schema.required) && schema.required.length > 0 && (
                <p className="text-xs text-white/60 mt-2">Required: {schema.required.join(", ")}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="bg-white text-black hover:bg-white"
            >
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
            </Button>
            {result?.html && (
              <>
                <Button variant="outline" onClick={handleSave} className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <FilePlus2 className="w-4 h-4" /> Save Draft Page
                </Button>
                <Button variant="outline" onClick={openInEditor} className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowRight className="w-4 h-4" /> Open in Editor
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {result?.html && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5" /> Preview: {result.title || "Generated Page"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-white/10 bg-white">
              <iframe title="Generated Page Preview" className="w-full h-[520px]" srcDoc={result.html} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}