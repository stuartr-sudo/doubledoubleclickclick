
import React from "react";
import { CustomContentTemplate } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, Filter, Layers3, Upload } from "lucide-react";
import TemplateEditorModal from "@/components/templates/TemplateEditorModal";
import BulkImportTemplatesModal from "@/components/templates/BulkImportTemplatesModal";
import { toast } from "sonner";

const FEATURES = [
  { key: "all", label: "All" },
  { key: "product", label: "Product" },
  { key: "cta", label: "Call To Action" },
  { key: "email_form", label: "Email Form" },
  { key: "tldr", label: "TL;DR" },
  { key: "testimonial", label: "Testimonial" },
  { key: "faq", label: "FAQ" },
  { key: "callout", label: "Callout" },
  { key: "fact", label: "Fact" },
  { key: "general", label: "General" },
];


export default function CustomTemplateManager() {
  const [items, setItems] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [feature, setFeature] = React.useState("all");
  const [usernames, setUsernames] = React.useState([]);
  const [me, setMe] = React.useState(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [modalKey, setModalKey] = React.useState(0);

  // Bulk delete states
  const [selectedItems, setSelectedItems] = React.useState(new Set());
  const [isDeleting, setIsDeleting] = React.useState(false);

  // NEW: Bulk import state
  const [importOpen, setImportOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const u = await User.me().catch(() => null);
      setMe(u);
      // username options
      if (u?.role === "admin") {
        const all = await User.list().catch(() => []);
        const set = new Set();
        (all || []).forEach((us) => (us.assigned_usernames || []).forEach((n) => set.add(n)));
        setUsernames(Array.from(set));
      } else {
        setUsernames(u?.assigned_usernames || []);
      }
      await reload();
    })();
  }, []);

  const reload = async () => {
    const list = await CustomContentTemplate.list("-updated_date").catch(() => []);
    setItems(list);
    setSelectedItems(new Set()); // Clear selection when reloading
  };

  const filtered = items.filter((t) => {
    const text = (t.name + " " + (t.description || "") + " " + (t.associated_ai_feature || "")).toLowerCase();
    const okText = text.includes(q.toLowerCase());
    const okFeature = feature === "all" || t.associated_ai_feature === feature;
    return okText && okFeature;
  });

  const openNew = () => {
    setEditing(null);
    setModalKey((k) => k + 1);
    setDialogOpen(true);
  };

  const openEdit = (tpl) => {
    setEditing(tpl);
    setDialogOpen(true);
  };

  const remove = async (tpl) => {
    if (!confirm(`Delete "${tpl.name}"?`)) return;
    await CustomContentTemplate.delete(tpl.id);
    await reload();
  };

  // Bulk delete functionality
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(filtered.map(t => t.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (templateId, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(templateId);
    } else {
      newSelected.delete(templateId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    const count = selectedItems.size;
    if (!confirm(`Delete ${count} selected template${count > 1 ? 's' : ''}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete all selected templates
      await Promise.all(Array.from(selectedItems).map(id =>
        CustomContentTemplate.delete(id)
      ));

      toast.success(`Successfully deleted ${count} template${count > 1 ? 's' : ''}`);
      await reload();
    } catch (error) {
      toast.error("Failed to delete some templates");
      console.error("Bulk delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (form) => {
    if (editing) {
      await CustomContentTemplate.update(editing.id, form);
    } else {
      await CustomContentTemplate.create(form);
    }
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  const allSelected = filtered.length > 0 && selectedItems.size === filtered.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < filtered.length;

  return (
    <div className="p-6 max-w-6xl mx-auto text-slate-900 bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Layers3 className="w-6 h-6" />
          Templates
        </h1>
        <div className="flex items-center gap-2">
          {/* NEW: Bulk delete button */}
          {selectedItems.size > 0 && (
            <Button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              variant="destructive"
              className="mr-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deleting..." : `Delete ${selectedItems.size}`}
            </Button>
          )}
          <Button variant="outline" onClick={() => setImportOpen(true)} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
            <Upload className="w-4 h-4 mr-2" /> Bulk Import
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> New Template
          </Button>
        </div>
      </div>

      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search templates…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

            </div>
            <div>
              <Label className="text-slate-700 mb-1 block">Feature</Label>
              <Select value={feature} onValueChange={setFeature}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {FEATURES.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700 mb-1 block">Show only active</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  className="bg-slate-300 data-[state=checked]:bg-emerald-600"
                  checked={feature === "active_only"}
                  onCheckedChange={(v) => setFeature(v ? "active_only" : "all")} />

                <span className="text-sm text-slate-700">Active only</span>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-7 p-3 bg-slate-50 text-sm font-semibold text-slate-600">
              {/* NEW: Select all checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </div>
              <div className="col-span-2">Name</div>
              <div>Feature</div>
              <div>Username</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {(filtered.length ? filtered : items).
              filter((t) => feature !== "active_only" || t.is_active !== false).
              map((tpl) =>
                <div key={tpl.id} className="grid grid-cols-7 p-3 items-center border-t border-slate-100">
                  {/* NEW: Individual checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(tpl.id)}
                      onChange={(e) => handleSelectItem(tpl.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-blue-900 font-medium">{tpl.name}</div>
                    {tpl.description && <div className="text-xs text-slate-500 line-clamp-1">{tpl.description}</div>}
                  </div>
                  <div className="text-slate-700">{tpl.associated_ai_feature || "-"}</div>
                  <div className="text-slate-700">{tpl.user_name || "—"}</div>
                  <div className={tpl.is_active === false ? "text-slate-500 text-sm" : "text-emerald-600 text-sm"}>
                    {tpl.is_active === false ? "Disabled" : "Active"}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(tpl)} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(tpl)} className="bg-purple-900 text-destructive-foreground px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-destructive/90 h-9 rounded-md">
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            {items.length === 0 &&
              <div className="p-6 text-slate-600">No templates yet. Create your first one.</div>
            }
          </div>
        </CardContent>
      </Card>

      <TemplateEditorModal
        key={`tpl-${modalKey}-${editing ? editing.id : 'new'}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValue={editing}
        usernames={usernames}
        onSubmit={handleSave} />

      <BulkImportTemplatesModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={reload}
      />
    </div>
  );
}
