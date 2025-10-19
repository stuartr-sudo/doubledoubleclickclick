import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Play, Loader2, Settings, Coins } from "lucide-react";
import { toast } from "sonner";

const STEP_OPTIONS = [
  { value: "html_cleanup", label: "Clean HTML" },
  { value: "tldr", label: "Key Takeaway (TLDR)" },
  { value: "humanize", label: "Humanize" },
  { value: "cite_sources", label: "Cite Sources" },
  { value: "add_internal_links", label: "Add Internal Links" },
  { value: "affilify", label: "Affilify" },
  { value: "brand_it", label: "Brand It" },
  { value: "faq", label: "Generate FAQs" },
  { value: "seo", label: "SEO Optimization" },
  { value: "schema", label: "Schema Generator" },
  { value: "autoscan", label: "AutoScan" },
  { value: "links_references", label: "Links + References" },
];

export default function EditorWorkflowManager() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    workflow_steps: [],
    token_cost: "", // Manual token cost override
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadWorkflows();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setIsSuperadmin(!!user?.is_superadmin || user?.role === 'admin');
    } catch (err) {
      console.error("Failed to check user role:", err);
      setIsSuperadmin(false);
    }
  };

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.EditorWorkflow.list("-updated_date", 100);
      setWorkflows(data || []);
    } catch (err) {
      console.error("Failed to load workflows:", err);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingWorkflow(null);
    setForm({
      name: "",
      description: "",
      workflow_steps: [],
      token_cost: "",
      is_active: true,
      is_default: false,
    });
    setShowDialog(true);
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setForm({
      name: workflow.name || "",
      description: workflow.description || "",
      workflow_steps: workflow.workflow_steps || [],
      token_cost: typeof workflow.token_cost === 'number' ? String(workflow.token_cost) : "",
      is_active: workflow.is_active !== false,
      is_default: workflow.is_default || false,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    if (form.workflow_steps.length === 0) {
      toast.error("Add at least one step to the workflow");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        workflow_steps: form.workflow_steps,
        is_active: form.is_active,
        is_default: form.is_default,
      };

      // Add token_cost only if it's set (not empty string)
      if (form.token_cost && form.token_cost.trim() !== "") {
        const parsedCost = parseInt(form.token_cost);
        if (isNaN(parsedCost) || parsedCost < 0) {
          toast.error("Token cost must be a valid number (0 or greater)");
          return;
        }
        payload.token_cost = parsedCost;
      }

      // Add user_name for non-default workflows
      if (!form.is_default && currentUser) {
        const assignedUsernames = currentUser.assigned_usernames || [];
        if (assignedUsernames.length > 0) {
          payload.user_name = assignedUsernames[0];
        }
      }

      if (editingWorkflow) {
        await base44.entities.EditorWorkflow.update(editingWorkflow.id, payload);
        toast.success("Workflow updated successfully");
      } else {
        await base44.entities.EditorWorkflow.create(payload);
        toast.success("Workflow created successfully");
      }

      setShowDialog(false);
      loadWorkflows();
    } catch (err) {
      console.error("Failed to save workflow:", err);
      toast.error("Failed to save workflow");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      await base44.entities.EditorWorkflow.delete(id);
      toast.success("Workflow deleted successfully");
      loadWorkflows();
    } catch (err) {
      console.error("Failed to delete workflow:", err);
      toast.error("Failed to delete workflow");
    }
  };

  const addStep = () => {
    setForm({
      ...form,
      workflow_steps: [
        ...form.workflow_steps,
        { type: "", enabled: true, parameters: {} },
      ],
    });
  };

  const updateStep = (index, field, value) => {
    const updated = [...form.workflow_steps];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, workflow_steps: updated });
  };

  const removeStep = (index) => {
    const updated = form.workflow_steps.filter((_, i) => i !== index);
    setForm({ ...form, workflow_steps: updated });
  };

  const moveStep = (index, direction) => {
    const updated = [...form.workflow_steps];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= updated.length) return;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setForm({ ...form, workflow_steps: updated });
  };

  // Filter workflows: show all for admins, only user's own for regular users
  const displayedWorkflows = isSuperadmin 
    ? workflows 
    : workflows.filter(w => 
        w.is_default || 
        (currentUser?.assigned_usernames || []).includes(w.user_name)
      );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Flash Workflow Builder</h1>
          <p className="text-slate-600 mt-2">
            Create automated workflows to enhance your content with AI
          </p>
        </div>
        {isSuperadmin && (
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        )}
      </div>

      {!isSuperadmin && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Only admins can create workflows. You can use available workflows from the Editor.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : displayedWorkflows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No workflows found. {isSuperadmin && "Create your first workflow to get started."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayedWorkflows.map((workflow) => (
            <Card key={workflow.id} className={!workflow.is_active ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{workflow.name}</CardTitle>
                    {workflow.is_default && (
                      <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                        Default
                      </span>
                    )}
                    {!workflow.is_active && (
                      <span className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-slate-600 mt-2">{workflow.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(workflow.workflow_steps || []).map((step, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 text-xs font-medium rounded-md ${
                          step.enabled !== false
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-500 line-through"
                        }`}
                      >
                        {STEP_OPTIONS.find((o) => o.value === step.type)?.label || step.type}
                      </span>
                    ))}
                  </div>
                  {typeof workflow.token_cost === 'number' && workflow.token_cost >= 0 && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-700">
                      <Coins className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold">Token Cost:</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                        {workflow.token_cost}
                      </span>
                    </div>
                  )}
                </div>
                {isSuperadmin && (
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(workflow)}
                      className="hover:bg-slate-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(workflow.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Workflow Editor Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Edit Workflow" : "Create New Workflow"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., SEO + Internal Links"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this workflow do?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="token_cost" className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-indigo-600" />
                Manual Token Cost Override (Optional)
              </Label>
              <Input
                id="token_cost"
                type="number"
                min="0"
                value={form.token_cost}
                onChange={(e) => setForm({ ...form, token_cost: e.target.value })}
                placeholder="Leave empty to auto-calculate from steps"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                If set, this exact cost will be used. If left empty, the system will calculate the total from individual step costs.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_default}
                  onCheckedChange={(checked) => setForm({ ...form, is_default: checked })}
                />
                <Label>Default Workflow (Available to all users)</Label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Workflow Steps</Label>
                <Button onClick={addStep} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {form.workflow_steps.length === 0 ? (
                <Card className="bg-slate-50">
                  <CardContent className="py-8 text-center text-slate-500">
                    No steps added yet. Click "Add Step" to begin building your workflow.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {form.workflow_steps.map((step, index) => (
                    <Card key={index} className="bg-slate-50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => moveStep(index, "up")}
                              disabled={index === 0}
                              className="h-8 w-8"
                            >
                              ↑
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => moveStep(index, "down")}
                              disabled={index === form.workflow_steps.length - 1}
                              className="h-8 w-8"
                            >
                              ↓
                            </Button>
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-slate-600 min-w-[60px]">
                                Step {index + 1}
                              </span>
                              <Select
                                value={step.type}
                                onValueChange={(value) => updateStep(index, "type", value)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select step type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STEP_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={step.enabled !== false}
                                  onCheckedChange={(checked) =>
                                    updateStep(index, "enabled", checked)
                                  }
                                />
                                <span className="text-sm text-slate-600">Enabled</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeStep(index)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editingWorkflow ? "Update Workflow" : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}