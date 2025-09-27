
import React, { useState, useEffect } from "react";
import { FeatureFlag } from "@/api/entities";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MiniMultiSelect from '@/components/common/MiniMultiSelect';
import { listCallableFunctions } from "@/api/functions";

export default function FeatureEndpointForm({ isOpen, onClose, flag, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tokenCost, setTokenCost] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loomUrl, setLoomUrl] = useState(""); // New state for Loom URL
  const [requiredPlanKeys, setRequiredPlanKeys] = useState([]);

  const [callType, setCallType] = useState("internal_function");
  const [targetName, setTargetName] = useState("");
  const [httpMethod, setHttpMethod] = useState("POST");
  const [headers, setHeaders] = useState("");
  const [reqSchema, setReqSchema] = useState("");
  const [resSchema, setResSchema] = useState("");
  const [sample, setSample] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [functionOptions, setFunctionOptions] = useState({
    internal_functions: [],
    integration_core: []
  });

  // Load selectable targets for dropdowns
  useEffect(() => {
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

  useEffect(() => {
    if (isOpen) {
      setName(flag?.name || "");
      setDescription(flag?.description || "");
      setTokenCost(flag?.token_cost || 1);
      setYoutubeUrl(flag?.youtube_tutorial_url || "");
      setLoomUrl(flag?.loom_tutorial_url || ""); // Initialize Loom URL
      setRequiredPlanKeys(flag?.required_plan_keys || []);
      setCallType(flag?.call_type || "internal_function");
      setTargetName(flag?.target_name || "");
      setHttpMethod(flag?.http_method || "POST");

      // Safely stringify JSON for display in textareas
      try {
        setHeaders(flag?.headers ? JSON.stringify(flag.headers, null, 2) : "");
        setReqSchema(flag?.request_schema ? JSON.stringify(flag.request_schema, null, 2) : "");
        setResSchema(flag?.response_schema ? JSON.stringify(flag.response_schema, null, 2) : "");
        setSample(flag?.sample_payload ? JSON.stringify(flag.sample_payload, null, 2) : "");
      } catch {
        toast.error("Failed to parse existing config JSON.");
        setHeaders(""); setReqSchema(""); setResSchema(""); setSample("");
      }
    }
  }, [isOpen, flag]);

  const handleSave = async () => {
    if (!name) {
      toast.error("Feature key (name) is required.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name,
        description,
        token_cost: Number(tokenCost) || 0,
        youtube_tutorial_url: youtubeUrl || null, // Changed from undefined to null
        loom_tutorial_url: loomUrl || null,       // Changed from undefined to null
        required_plan_keys: requiredPlanKeys,
        call_type: callType,
        target_name: targetName || undefined,
        http_method: callType === "external_webhook" ? httpMethod : undefined,
      };

      // Safely parse JSON fields
      try {
        if (headers) payload.headers = JSON.parse(headers);
        if (reqSchema) payload.request_schema = JSON.parse(reqSchema);
        if (resSchema) payload.response_schema = JSON.parse(resSchema);
        if (sample) payload.sample_payload = JSON.parse(sample);
      } catch (e) {
        toast.error("Invalid JSON in one of the fields.");
        setIsSaving(false);
        return;
      }

      let savedFlag;
      if (flag) {
        savedFlag = await FeatureFlag.update(flag.id, payload);
      } else {
        savedFlag = await FeatureFlag.create(payload);
      }

      onSave(savedFlag);
      toast.success(`Feature '${savedFlag.name}' saved.`);
      onClose(); // Close the dialog on successful save
    } catch (error) {
      toast.error(error?.message || "Failed to save feature.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const planOptions = [
    { value: 'growth', label: 'Growth' },
    { value: 'brand', label: 'Brand' },
    { value: 'agency', label: 'Agency' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle>{flag ? `Configure: ${flag.name}` : "Create New Feature"}</DialogTitle>
          <DialogDescription>
            Define the feature's properties and how it should be executed.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="endpoint">Endpoint</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label className="text-slate-700">Feature Key (Name)</Label>
                    <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., ai_rewrite" />
                </div>
                <div>
                    <Label className="text-slate-700">Description</Label>
                    <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this feature does" />
                </div>
                <div>
                    <Label className="text-slate-700">Token Cost</Label>
                    <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" type="number" value={tokenCost} onChange={(e) => setTokenCost(e.target.value)} />
                </div>
                <div>
                    <Label className="text-slate-700">YouTube Tutorial URL</Label>
                    <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>
                {/* New input for Loom Tutorial URL */}
                <div>
                    <Label className="text-slate-700">Loom Tutorial URL</Label>
                    <Input className="mt-1 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" value={loomUrl} onChange={(e) => setLoomUrl(e.target.value)} placeholder="https://www.loom.com/share/..." />
                </div>
            </div>
            <div>
              <Label className="text-slate-700">Required Plans</Label>
              <MiniMultiSelect
                placeholder="No plan restriction"
                options={planOptions}
                value={requiredPlanKeys}
                onChange={setRequiredPlanKeys}
              />
              <p className="text-xs text-slate-500 mt-1">If empty, feature is not restricted by plan.</p>
            </div>
          </TabsContent>

          <TabsContent value="endpoint" className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <div>
                <Label className="text-slate-700">Call Type</Label>
                <Select value={callType || ""} onValueChange={(v) => {
                  setCallType(v);
                  setTargetName(""); // Reset target when call type changes
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

              <div>
                <Label className="text-slate-700">Target</Label>
                {callType === "internal_function" ? (
                  <Select
                    value={targetName || ""}
                    onValueChange={setTargetName}
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
                ) : callType === "integration_core" ? (
                  <Select
                    value={targetName || ""}
                    onValueChange={setTargetName}
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
                    value={targetName || ""}
                    onChange={(e) => setTargetName(e.target.value)}
                  />
                )}
              </div>
            </div>

            {callType === "external_webhook" && (
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="text-slate-700">HTTP Method</Label>
                  <Select value={httpMethod || "POST"} onValueChange={setHttpMethod}>
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
                <div>
                  <Label className="text-slate-700">Headers (JSON)</Label>
                  <Textarea
                    className="mt-1 font-mono text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                    rows={4}
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    spellCheck="false"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schema" className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-700">Request Schema (JSON)</Label>
                <Textarea
                  className="mt-1 font-mono text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  rows={8}
                  value={reqSchema}
                  onChange={(e) => setReqSchema(e.target.value)}
                  spellCheck="false"
                />
              </div>
              <div>
                <Label className="text-slate-700">Response Schema (JSON)</Label>
                <Textarea
                  className="mt-1 font-mono text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  rows={8}
                  value={resSchema}
                  onChange={(e) => setResSchema(e.target.value)}
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="mt-3">
              <Label className="text-slate-700">Sample Payload (JSON)</Label>
              <Textarea
                className="mt-1 font-mono text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                rows={6}
                value={sample}
                onChange={(e) => setSample(e.target.value)}
                spellCheck="false"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800">
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
