import React, { useState, useEffect } from "react";
import { EditorWorkflow } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Save, X, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const AVAILABLE_STEPS = [
  { value: "tldr", label: "Key Takeaway (TLDR)" },
  { value: "faq", label: "FAQs" },
  { value: "brand_it", label: "Brand It" },
  { value: "html_cleanup", label: "Clean Up HTML" },
  { value: "autolink", label: "AutoLink" },
  { value: "autoscan", label: "AutoScan" },
  { value: "seo", label: "SEO" },
  { value: "schema", label: "Schema" },
  { value: "links_references", label: "Links + References" }
];

export default function EditorWorkflowManager() {
  const [workflows, setWorkflows] = useState([]);
  const [defaultWorkflows, setDefaultWorkflows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    workflow_steps: [],
    is_active: true,
    is_default: false
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, userWorkflows, defaults] = await Promise.all([
        User.me(),
        EditorWorkflow.filter({ is_default: false }, "-updated_date"),
        EditorWorkflow.filter({ is_default: true }, "-updated_date")
      ]);
      
      setCurrentUser(user);
      setWorkflows(userWorkflows || []);
      setDefaultWorkflows(defaults || []);
    } catch (error) {
      toast.error("Failed to load workflows");
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workflow) => {
    setEditingId(workflow.id);
    setFormData({
      name: workflow.name || "",
      description: workflow.description || "",
      workflow_steps: workflow.workflow_steps || [],
      is_active: workflow.is_active !== false,
      is_default: workflow.is_default || false
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      workflow_steps: [],
      is_active: true,
      is_default: false
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (!formData.workflow_steps.length) {
      toast.error("Please add at least one step");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        workflow_steps: formData.workflow_steps,
        is_active: formData.is_active,
        is_default: formData.is_default,
        user_name: currentUser?.assigned_usernames?.[0] || ""
      };

      if (editingId) {
        await EditorWorkflow.update(editingId, payload);
        toast.success("Workflow updated");
      } else {
        await EditorWorkflow.create(payload);
        toast.success("Workflow created");
      }

      await loadData();
      handleCancel();
    } catch (error) {
      toast.error("Failed to save workflow");
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this workflow?")) return;
    
    try {
      await EditorWorkflow.delete(id);
      toast.success("Workflow deleted");
      await loadData();
    } catch (error) {
      toast.error("Failed to delete workflow");
      console.error("Delete error:", error);
    }
  };

  const handleAddStep = () => {
    setFormData({
      ...formData,
      workflow_steps: [
        ...formData.workflow_steps,
        { type: "", enabled: true, parameters: {} }
      ]
    });
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...formData.workflow_steps];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, workflow_steps: updated });
  };

  const handleRemoveStep = (index) => {
    const updated = formData.workflow_steps.filter((_, i) => i !== index);
    setFormData({ ...formData, workflow_steps: updated });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.workflow_steps);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setFormData({ ...formData, workflow_steps: items });
  };

  const isSuperAdmin = currentUser?.is_superadmin || currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Flash Workflow Builder</h1>
          <p className="text-slate-600">Create custom workflows to automate your content enhancement process</p>
        </div>

        {/* Editor Form */}
        <Card className="mb-8 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              {editingId ? "Edit Workflow" : "Create New Workflow"}
            </CardTitle>
            <CardDescription>
              Build a sequence of AI-powered steps to enhance your content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label>Workflow Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., SEO Optimizer, Content Polisher"
                  className="bg-white border-slate-300"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                  className="bg-white border-slate-300"
                  rows={2}
                />
              </div>

              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600" />
                    Make this a default workflow (available to all users)
                  </Label>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Workflow Steps</Label>
                <Button
                  onClick={handleAddStep}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {formData.workflow_steps.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  Click "Add Step" to begin.
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="steps">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {formData.workflow_steps.map((step, index) => (
                          <Draggable
                            key={index}
                            draggableId={`step-${index}`}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg"
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                                </div>

                                <div className="flex-1">
                                  <Select
                                    value={step.type}
                                    onValueChange={(value) => handleStepChange(index, "type", value)}
                                  >
                                    <SelectTrigger className="bg-white border-slate-300">
                                      <SelectValue placeholder="Select step type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200">
                                      {AVAILABLE_STEPS.map((opt) => (
                                        <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                          className="hover:bg-slate-100"
                                        >
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Switch
                                  checked={step.enabled !== false}
                                  onCheckedChange={(checked) =>
                                    handleStepChange(index, "enabled", checked)
                                  }
                                />

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveStep(index)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "Update Workflow" : "Create Workflow"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Workflows */}
        {defaultWorkflows.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Default Workflows
            </h2>
            <div className="grid gap-4">
              {defaultWorkflows.map((workflow) => (
                <Card key={workflow.id} className="bg-white border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 mb-1">
                          {workflow.name}
                        </h3>
                        {workflow.description && (
                          <p className="text-sm text-slate-600 mb-3">{workflow.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {(workflow.workflow_steps || []).map((step, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200"
                            >
                              {AVAILABLE_STEPS.find((s) => s.value === step.type)?.label || step.type}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(workflow)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(workflow.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* User Workflows */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Workflows</h2>
          {workflows.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
              No workflows yet. Create your first one above!
            </div>
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="bg-white border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 mb-1">
                          {workflow.name}
                        </h3>
                        {workflow.description && (
                          <p className="text-sm text-slate-600 mb-3">{workflow.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {(workflow.workflow_steps || []).map((step, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {AVAILABLE_STEPS.find((s) => s.value === step.type)?.label || step.type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(workflow)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(workflow.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}