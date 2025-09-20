import React from "react";
import { EditorWorkflow } from "@/api/entities";
import { User } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, PencilLine } from "lucide-react";

const STEP_TYPES = [
  { key: "html_cleanup", label: "HTML Cleanup" },
  { key: "tldr", label: "TL;DR Summary" },
  { key: "humanize", label: "Humanize Text" },
  { key: "cite_sources", label: "Add Citations" },
  { key: "add_internal_links", label: "Add Internal Links" },
  { key: "affilify", label: "Affilify (Affiliate Style)" },
  { key: "brand_it", label: "Brand It" }
];

function StepRow({ step, idx, onChange, onRemove, onMoveUp, onMoveDown }) {
  const handleType = (v) => onChange(idx, { ...step, type: v });
  const handleParams = (e) => {
    const val = e.target.value;
    try {
      const parsed = val ? JSON.parse(val) : {};
      onChange(idx, { ...step, parameters: parsed });
    } catch {
      onChange(idx, { ...step, parameters_raw: val }); // keep raw for display until valid JSON
    }
  };

  const paramsText = step.parameters_raw ?? JSON.stringify(step.parameters || {}, null, 2);

  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select value={step.type} onValueChange={handleType}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select step" />
          </SelectTrigger>
          <SelectContent>
            {STEP_TYPES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onMoveUp(idx)}><ArrowUp className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => onMoveDown(idx)}><ArrowDown className="w-4 h-4" /></Button>
          <Button variant="destructive" size="icon" onClick={() => onRemove(idx)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
      <div>
        <Label>Parameters (JSON)</Label>
        <textarea
          className="w-full min-h-[120px] text-sm bg-white border border-slate-300 rounded-md p-2 font-mono"
          value={paramsText}
          onChange={handleParams}
          placeholder='{}'
        />
        {step.parameters_raw && (
          <div className="text-xs text-red-600 mt-1">Invalid JSON, please fix.</div>
        )}
      </div>
    </div>
  );
}

export default function EditorWorkflowManager() {
  const [workflows, setWorkflows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(null); // workflow object being edited
  const [form, setForm] = React.useState({ name: "", description: "", is_active: true, workflow_steps: [] });

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await EditorWorkflow.list("-updated_date", 200).catch(() => []);
      setWorkflows(list || []);
      setLoading(false);
    })();
  }, []);

  const resetForm = () => setForm({ name: "", description: "", is_active: true, workflow_steps: [] });

  const handleAddStep = () => {
    setForm(f => ({ ...f, workflow_steps: [...(f.workflow_steps || []), { type: "html_cleanup", parameters: {} }] }));
  };
  const handleRemoveStep = (idx) => {
    setForm(f => ({ ...f, workflow_steps: f.workflow_steps.filter((_, i) => i !== idx) }));
  };
  const handleMoveUp = (idx) => {
    setForm(f => {
      if (idx === 0) return f;
      const arr = [...f.workflow_steps];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return { ...f, workflow_steps: arr };
    });
  };
  const handleMoveDown = (idx) => {
    setForm(f => {
      if (idx === f.workflow_steps.length - 1) return f;
      const arr = [...f.workflow_steps];
      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      return { ...f, workflow_steps: arr };
    });
  };
  const handleChangeStep = (idx, newStep) => {
    setForm(f => {
      const arr = [...f.workflow_steps];
      const clean = { ...newStep };
      if (clean.parameters_raw && !clean.parameters) clean.parameters = {};
      delete clean.parameters_raw;
      arr[idx] = clean;
      return { ...f, workflow_steps: arr };
    });
  };

  const save = async () => {
    const payload = {
      name: form.name.trim(),
      description: form.description || "",
      is_active: !!form.is_active,
      workflow_steps: (form.workflow_steps || []).map(s => ({
        type: s.type,
        parameters: s.parameters || {}
      }))
    };
    if (!payload.name || payload.workflow_steps.length === 0) return;

    if (editing?.id) {
      await EditorWorkflow.update(editing.id, payload);
    } else {
      await EditorWorkflow.create(payload);
    }
    const list = await EditorWorkflow.list("-updated_date", 200).catch(() => []);
    setWorkflows(list || []);
    setEditing(null);
    resetForm();
  };

  const beginEdit = (wf) => {
    setEditing(wf);
    setForm({
      name: wf.name || "",
      description: wf.description || "",
      is_active: wf.is_active !== false,
      workflow_steps: (wf.workflow_steps || []).map(s => ({ type: s.type, parameters: s.parameters || {} }))
    });
  };

  const remove = async (wf) => {
    await EditorWorkflow.delete(wf.id);
    const list = await EditorWorkflow.list("-updated_date", 200).catch(() => []);
    setWorkflows(list || []);
    if (editing?.id === wf.id) {
      setEditing(null);
      resetForm();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 text-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">AI Workflow Manager</h1>
          {editing && (
            <Button variant="outline" onClick={() => { setEditing(null); resetForm(); }}>
              Cancel edit
            </Button>
          )}
        </div>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., SEO Polish"
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Label>Active</Label>
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What does this workflow do?"
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Steps</h3>
              <Button onClick={handleAddStep} className="gap-2">
                <Plus className="w-4 h-4" /> Add Step
              </Button>
            </div>
            <div className="space-y-3">
              {(form.workflow_steps || []).map((s, i) => (
                <StepRow
                  key={i}
                  step={s}
                  idx={i}
                  onChange={handleChangeStep}
                  onRemove={handleRemoveStep}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
              {(!form.workflow_steps || form.workflow_steps.length === 0) && (
                <div className="text-sm text-slate-500">No steps yet. Click "Add Step" to begin.</div>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={save} className="gap-2">
              <Save className="w-4 h-4" /> {editing ? "Update Workflow" : "Create Workflow"}
            </Button>
            {editing && (
              <Button variant="outline" onClick={() => { setEditing(null); resetForm(); }}>
                New Workflow
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-medium mb-3">Existing Workflows</h2>
          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : (
            <div className="grid gap-3">
              {workflows.map(wf => (
                <div key={wf.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{wf.name}</div>
                    <div className="text-sm text-slate-600">{wf.description}</div>
                    <div className="text-xs text-slate-500 mt-1">{(wf.workflow_steps || []).length} steps • {wf.is_active !== false ? "Active" : "Inactive"}</div>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={() => beginEdit(wf)}>
                    <PencilLine className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="destructive" className="gap-2" onClick={() => remove(wf)}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              ))}
              {workflows.length === 0 && (
                <div className="text-sm text-slate-500">No workflows yet.</div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}