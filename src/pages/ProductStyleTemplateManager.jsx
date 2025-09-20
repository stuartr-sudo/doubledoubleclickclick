
import React, { useEffect, useState } from "react";
import { ProductStyleTemplate } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Palette, X } from "lucide-react";

export default function ProductStyleTemplateManager() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [usernames, setUsernames] = useState([]);
  const [form, setForm] = useState({
    name: "",
    template_key: "gradient",
    description: "",
    preview_image_url: "",
    html_example: "",
    user_name: "",
    is_active: true,
    sample_data: {
      name: "Sample Product",
      price: "$49.00",
      description: "Short description.",
      image_url: ""
    }
  });

  useEffect(() => {
    (async () => {
      const u = await User.me().catch(() => null);
      setMe(u);
      // username options (similar to other managers)
      if (u?.role === "admin") {
        const allUsers = await User.list().catch(() => []);
        const set = new Set();
        allUsers.forEach((us) => (us.assigned_usernames || []).forEach((n) => set.add(n)));
        setUsernames(Array.from(set));
      } else {
        setUsernames(u?.assigned_usernames || []);
      }
      await reload();
    })();
  }, []);

  const reload = async () => {
    const res = await ProductStyleTemplate.list("-updated_date").catch(() => []);
    setItems(res);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      template_key: "gradient",
      description: "",
      preview_image_url: "",
      html_example: "",
      user_name: usernames[0] || "",
      is_active: true,
      sample_data: { name: "Sample Product", price: "$49.00", description: "Short description.", image_url: "" }
    });
    setIsOpen(true);
  };

  const openEdit = (it) => {
    setEditing(it);
    setForm({
      name: it.name || "",
      template_key: it.template_key || "gradient",
      description: it.description || "",
      preview_image_url: it.preview_image_url || "",
      html_example: it.html_example || "",
      user_name: it.user_name || "",
      is_active: it.is_active !== false,
      sample_data: {
        name: it.sample_data?.name || "Sample Product",
        price: it.sample_data?.price || "$49.00",
        description: it.sample_data?.description || "Short description.",
        image_url: it.sample_data?.image_url || ""
      }
    });
    setIsOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.template_key) return;
    const payload = { ...form };
    if (editing) {
      await ProductStyleTemplate.update(editing.id, payload);
    } else {
      await ProductStyleTemplate.create(payload);
    }
    setIsOpen(false);
    setEditing(null);
    await reload();
  };

  const remove = async (it) => {
    if (!confirm(`Delete "${it.name}"?`)) return;
    await ProductStyleTemplate.delete(it.id);
    await reload();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-slate-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Palette className="w-6 h-6" />
          Product Styles
        </h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New Style</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-5 p-4 font-semibold text-slate-600 border-b border-slate-200">
          <div>Name</div>
          <div>Key</div>
          <div>Username</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {items.length ? items.map((it) =>
        <div key={it.id} className="grid grid-cols-5 p-4 items-center text-slate-800 border-b border-slate-100">
            <div className="font-medium">{it.name}</div>
            <div className="text-slate-600">{it.template_key}</div>
            <div className="text-slate-600">{it.user_name || "-"}</div>
            <div className={`text-sm ${it.is_active ? "text-emerald-600" : "text-slate-500"}`}>{it.is_active ? "Active" : "Disabled"}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(it)}><Edit className="w-4 h-4 mr-1" /> Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(it)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
            </div>
          </div>
        ) :
        <div className="p-6 text-slate-600">No styles yet. Create your first one.</div>
        }
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white text-slate-900 border border-slate-200 w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle>{editing ? "Edit Style" : "New Style"}</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">

              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4 pb-2">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-white border-slate-300 text-slate-900" required />
              </div>
              <div>
                <Label>Template Key</Label>
                <Select value={form.template_key} onValueChange={(v) => setForm((f) => ({ ...f, template_key: v }))}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Choose key" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 z-[101]">
                    <SelectItem value="gradient">gradient (Neon)</SelectItem>
                    <SelectItem value="minimal">minimal (Light)</SelectItem>
                    <SelectItem value="glass">glass (Double)</SelectItem>
                    <SelectItem value="default">default (Basic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-white border-slate-300 text-slate-900" />
              </div>
              <div className="md:col-span-2">
                <Label>Preview Image URL (optional)</Label>
                <Input value={form.preview_image_url} onChange={(e) => setForm((f) => ({ ...f, preview_image_url: e.target.value }))} className="bg-white border-slate-300 text-slate-900" />
              </div>
              <div className="md:col-span-2">
                <Label>HTML Example (optional)</Label>
                <Textarea value={form.html_example} onChange={(e) => setForm((f) => ({ ...f, html_example: e.target.value }))} className="bg-white border-slate-300 text-slate-900 min-h-[120px]" />
              </div>
              <div>
                <Label>Assign Username (optional)</Label>
                <Select value={form.user_name || ""} onValueChange={(v) => setForm((f) => ({ ...f, user_name: v }))}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value={null}>Unassigned</SelectItem>
                    {usernames.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <div className="font-semibold mb-2">Default Sample Data</div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Sample Name</Label>
                  <Input value={form.sample_data.name} onChange={(e) => setForm((f) => ({ ...f, sample_data: { ...f.sample_data, name: e.target.value } }))} className="bg-white border-slate-300 text-slate-900" />
                </div>
                <div>
                  <Label>Sample Price</Label>
                  <Input value={form.sample_data.price} onChange={(e) => setForm((f) => ({ ...f, sample_data: { ...f.sample_data, price: e.target.value } }))} className="bg-white border-slate-300 text-slate-900" />
                </div>
                <div className="md:col-span-2">
                  <Label>Sample Description</Label>
                  <Input value={form.sample_data.description} onChange={(e) => setForm((f) => ({ ...f, sample_data: { ...f.sample_data, description: e.target.value } }))} className="bg-white border-slate-300 text-slate-900" />
                </div>
                <div className="md:col-span-2">
                  <Label>Sample Image URL</Label>
                  <Input value={form.sample_data.image_url} onChange={(e) => setForm((f) => ({ ...f, sample_data: { ...f.sample_data, image_url: e.target.value } }))} className="bg-white border-slate-300 text-slate-900" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 sticky bottom-0 pt-2 bg-white rounded-b-lg">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="bg-gray-100 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">Cancel</Button>
              <Button type="submit" className="bg-indigo-700 text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-emerald-700">{editing ? "Save Changes" : "Create Style"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>);

}