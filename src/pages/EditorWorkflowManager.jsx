import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Edit, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const STEP_TYPES = [
  { value: "html_cleanup", label: "HTML Cleanup", description: "Clean and optimize HTML structure" },
  { value: "tldr", label: "Generate TLDR", description: "Create a brief summary" },
  { value: "humanize", label: "Humanize Text", description: "Make AI text sound more human" },
  { value: "cite_sources", label: "Cite Sources", description: "Add citations and references" },
  { value: "add_internal_links", label: "Add Internal Links", description: "Link to related content" },
  { value: "affilify", label: "Affilify", description: "Add affiliate links" },
  { value: "brand_it", label: "Brand It", description: "Apply brand voice and style" }
];

export default function EditorWorkflowManager() {
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    workflow_steps: [],
    token_cost: null,
    is_active: true,
    user_name: "",
    is_default: false
  });

  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["editorWorkflows"],
    queryFn: () => base44.entities.EditorWorkflow.list("-created_date")
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EditorWorkflow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editorWorkflows"] });
      resetForm();
      toast.success("Workflow created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EditorWorkflow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editorWorkflows"] });
      resetForm();
      toast.success("Workflow updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EditorWorkflow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editorWorkflows"] });
      toast.success("Workflow deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete workflow: ${error.message}`);
    }
  });

  const resetForm = () => {
    setEditingWorkflow(null);
    setFormData({
      name: "",
      description: "",
      workflow_steps: [],
      token_cost: null,
      is_active: true,
      user_name: "",
      is_default: false
    });
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name || "",
      description: workflow.description || "",
      workflow_steps: workflow.workflow_steps || [],
      token_cost: workflow.token_cost || null,
      is_active: workflow.is_active !== false,
      user_name: workflow.user_name || "",
      is_default: workflow.is_default || false
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    if (formData.workflow_steps.length === 0) {
      toast.error("At least one workflow step is required");
      return;
    }

    const submitData = {
      ...formData,
      token_cost: formData.token_cost ? Number(formData.token_cost) : null
    };

    if (editingWorkflow) {
      updateMutation.mutate({ id: editingWorkflow.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      workflow_steps: [
        ...formData.workflow_steps,
        { type: "html_cleanup", enabled: true, parameters: {} }
      ]
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.workflow_steps.filter((_, i) => i !== index);
    setFormData({ ...formData, workflow_steps: newSteps });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.workflow_steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, workflow_steps: newSteps });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.workflow_steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData({ ...formData, workflow_steps: items });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Editor Workflow Manager</h1>
          <p className="text-slate-600 mt-2">Create and manage automated content workflows</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>{editingWorkflow ? "Edit Workflow" : "Create New Workflow"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Workflow Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., SEO Polish"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this workflow do?"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Token Cost (Optional Override)</Label>
                  <Input
                    type="number"
                    value={formData.token_cost || ""}
                    onChange={(e) => setFormData({ ...formData, token_cost: e.target.value })}
                    placeholder="Leave empty to calculate from steps"
                  />
                </div>

                <div>
                  <Label>Username (Optional)</Label>
                  <Input
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                    placeholder="Leave empty for global workflow"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>

                  {currentUser?.is_superadmin && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_default}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                      />
                      <Label>Default (Admin)</Label>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Workflow Steps *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addStep}>
                      <Plus className="w-4 h-4 mr-1" /> Add Step
                    </Button>
                  </div>

                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="steps">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {formData.workflow_steps.map((step, index) => (
                            <Draggable key={index} draggableId={`step-${index}`} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="bg-slate-50 p-3 rounded-lg border"
                                >
                                  <div className="flex items-start gap-2">
                                    <div {...provided.dragHandleProps} className="mt-2">
                                      <GripVertical className="w-4 h-4 text-slate-400" />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Select
                                          value={step.type}
                                          onValueChange={(value) => updateStep(index, "type", value)}
                                        >
                                          <SelectTrigger className="flex-1">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {STEP_TYPES.map((type) => (
                                              <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>

                                        <Switch
                                          checked={step.enabled !== false}
                                          onCheckedChange={(checked) => updateStep(index, "enabled", checked)}
                                        />
                                      </div>

                                      <p className="text-xs text-slate-500">
                                        {STEP_TYPES.find(t => t.value === step.type)?.description}
                                      </p>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeStep(index)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {formData.workflow_steps.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No steps added yet. Click "Add Step" to get started.
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingWorkflow ? "Update Workflow" : "Create Workflow"}
                  </Button>
                  {editingWorkflow && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Workflows List */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-slate-500">Loading workflows...</p>
              ) : workflows.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No workflows created yet</p>
              ) : (
                <div className="space-y-3">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="border rounded-lg p-4 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{workflow.name}</h3>
                            {!workflow.is_active && (
                              <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                                Inactive
                              </span>
                            )}
                            {workflow.is_default && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{workflow.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>{workflow.workflow_steps?.length || 0} steps</span>
                            {workflow.token_cost && <span>{workflow.token_cost} tokens</span>}
                            {workflow.user_name && <span>User: {workflow.user_name}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(workflow)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this workflow?")) {
                                deleteMutation.mutate(workflow.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}