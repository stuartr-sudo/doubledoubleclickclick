import React from "react";
import app from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Save, Trash2, Edit2, RefreshCw } from "lucide-react";

const VISUAL_TYPES = [
  { value: "auto", label: "Auto (Recommended)" },
  { value: "mindmap", label: "Mind Map" },
  { value: "flowchart", label: "Flow Chart" },
  { value: "timeline", label: "Timeline" },
  { value: "diagram", label: "Diagram" },
  { value: "process", label: "Process" },
  { value: "comparison", label: "Comparison" },
  { value: "hierarchy", label: "Hierarchy" },
  { value: "cycle", label: "Cycle" },
  { value: "matrix", label: "Matrix" },
  { value: "venn", label: "Venn Diagram" }
];

export default function InfographicExamplesAdmin() {
  const [me, setMe] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [examples, setExamples] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState({
    visual_type_key: "auto",
    image_url: "",
    description: ""
  });
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const user = await app.auth.me();
      setMe(user || null);
      const rows = await app.entities.InfographicVisualTypeExample.list();
      setExamples(rows || []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const isAdmin = !!(me && (me.role === "admin" || me.is_superadmin));

  const resetForm = () => {
    setEditingId(null);
    setForm({ visual_type_key: "auto", image_url: "", description: "" });
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await app.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, image_url: file_url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.visual_type_key || !form.image_url) return;
    setSaving(true);
    try {
      if (editingId) {
        await app.entities.InfographicVisualTypeExample.update(editingId, form);
      } else {
        // upsert by visual_type_key
        const existing = await app.entities.InfographicVisualTypeExample.filter({ visual_type_key: form.visual_type_key }, "-created_date", 1);
        if (existing && existing.length > 0) {
          await app.entities.InfographicVisualTypeExample.update(existing[0].id, form);
        } else {
          await app.entities.InfographicVisualTypeExample.create(form);
        }
      }
      await load();
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      visual_type_key: row.visual_type_key || "auto",
      image_url: row.image_url || "",
      description: row.description || ""
    });
    setFile(null);
  };

  const handleDelete = async (row) => {
    await app.entities.InfographicVisualTypeExample.delete(row.id);
    await load();
    if (editingId === row.id) resetForm();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-700">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">Admins only</p>
          <p className="text-slate-600">You don’t have permission to manage infographic examples.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Visual Type Examples
        </h1>
        <Button variant="outline" onClick={() => load()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingId ? "Edit Example" : "Add Example"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label>Visual Type</Label>
              <Select
                value={form.visual_type_key}
                onValueChange={(v) => setForm((f) => ({ ...f, visual_type_key: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISUAL_TYPES.map((vt) => (
                    <SelectItem key={vt.value} value={vt.value}>
                      {vt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Image URL</Label>
              <Input
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              />
              <div className="flex items-center gap-2 mt-2">
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <Button onClick={handleUpload} disabled={!file || uploading} className="gap-2">
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Input
              placeholder="Short description for context"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VISUAL_TYPES.map((vt) => {
          const match = examples.find((e) => e.visual_type_key === vt.value);
          return (
            <Card key={vt.value}>
              <CardHeader>
                <CardTitle className="text-base">{vt.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {match ? (
                  <div className="space-y-3">
                    <img
                      src={match.image_url}
                      alt={`${vt.label} example`}
                      className="w-full h-40 object-cover rounded border"
                    />
                    {match.description && (
                      <p className="text-sm text-slate-600">{match.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(match)} className="gap-1">
                        <Edit2 className="w-4 h-4" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(match)} className="gap-1">
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    No example uploaded yet. Use the form above to add one.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}