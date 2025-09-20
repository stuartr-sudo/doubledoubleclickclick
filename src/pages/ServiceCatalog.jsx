import React, { useEffect, useState } from "react";
import { ServiceItem } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ServiceCatalog() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState(null);
  const [usernames, setUsernames] = useState([]);
  const [filterUsername, setFilterUsername] = useState("all");
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    unit_price: 0,
    default_quantity: 1,
    currency: "usd",
    category: "",
    taxable: false,
    is_active: true,
    user_name: ""
  });

  useEffect(() => {
    (async () => {
      try {
        const user = await User.me();
        setMe(user);
        let list = await ServiceItem.list("-created_date");
        // usernames for assignment
        let allowed = [];
        if (user.role === "admin" || user.access_level === "full") {
          const others = new Set(list.map((i) => i.user_name).filter(Boolean));
          allowed = Array.from(others);
        } else {
          allowed = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
          list = list.filter((i) => !i.user_name || allowed.includes(i.user_name));
        }
        setUsernames(allowed);
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reload = async () => {
    const list = await ServiceItem.list("-created_date");
    let filtered = list;
    if (!(me && (me.role === "admin" || me.access_level === "full"))) {
      const allow = new Set(me?.assigned_usernames || []);
      filtered = list.filter((i) => !i.user_name || allow.has(i.user_name));
    }
    setItems(filtered);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      unit_price: 0,
      default_quantity: 1,
      currency: "usd",
      category: "",
      taxable: false,
      is_active: true,
      user_name: usernames[0] || ""
    });
    setOpen(true);
  };

  const openEdit = (it) => {
    setEditing(it);
    setForm({
      name: it.name || "",
      description: it.description || "",
      unit_price: it.unit_price ?? 0,
      default_quantity: it.default_quantity ?? 1,
      currency: it.currency || "usd",
      category: it.category || "",
      taxable: it.taxable || false,
      is_active: it.is_active !== false,
      user_name: it.user_name || ""
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name) {toast.error("Name is required");return;}
    if (Number(form.unit_price) < 0) {toast.error("Invalid price");return;}
    const payload = {
      ...form,
      unit_price: Number(form.unit_price || 0),
      default_quantity: Math.max(1, Number(form.default_quantity || 1)),
      is_active: Boolean(form.is_active),
      taxable: Boolean(form.taxable)
    };
    if (editing) {
      await ServiceItem.update(editing.id, payload);
      toast.success("Service updated");
    } else {
      await ServiceItem.create(payload);
      toast.success("Service created");
    }
    setOpen(false);
    setEditing(null);
    await reload();
  };

  const remove = async (it) => {
    if (!confirm(`Delete "${it.name}"?`)) return;
    await ServiceItem.delete(it.id);
    toast.success("Deleted");
    await reload();
  };

  const visible = items.filter((it) => filterUsername === "all" || (it.user_name || "") === filterUsername);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-white">
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-400" />
            Services Catalog
          </h1>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> New Service
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="text-white/70">Filter:</div>
          <Select value={filterUsername} onValueChange={setFilterUsername}>
            <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {usernames.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ?
        <div className="text-white/70">Loading...</div> :
        visible.length === 0 ?
        <div className="text-white/70">No services yet.</div> :

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visible.map((it) =>
          <div key={it.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-semibold">{it.name}</div>
                    {it.category && <div className="text-xs text-white/60">{it.category}</div>}
                    {it.description && <div className="text-sm text-white/80 mt-2">{it.description}</div>}
                    <div className="text-blue-300 font-semibold mt-2">${Number(it.unit_price || 0).toFixed(2)}</div>
                    <div className="text-xs text-white/60 mt-1">
                      Qty default: {Math.max(1, Number(it.default_quantity || 1))} • {String(it.currency || "usd").toUpperCase()} {it.taxable ? "• Taxable" : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(it)} className="bg-fuchsia-950 text-white px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md border-white/20 hover:bg-white/20">
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(it)} className="bg-blue-950 text-destructive-foreground px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-destructive/90 h-9 rounded-md">
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
          )}
          </div>
        }

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="backdrop-blur-xl bg-slate-800/95 border border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Service" : "New Service"}</DialogTitle>
              <DialogDescription className="text-white/70">Preset offerings to quickly add to invoices.</DialogDescription>
            </DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-white text-slate-900" required />
              </div>
              <div>
                <Label>Description / Scope</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-white text-slate-900" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Unit Price</Label>
                  <Input type="number" min="0" step="0.01" value={form.unit_price} onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))} className="bg-white text-slate-900" required />
                </div>
                <div>
                  <Label>Default Qty</Label>
                  <Input type="number" min="1" step="1" value={form.default_quantity} onChange={(e) => setForm((f) => ({ ...f, default_quantity: e.target.value }))} className="bg-white text-slate-900" />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                    <SelectTrigger className="bg-white text-slate-900"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                      <SelectItem value="cad">CAD</SelectItem>
                      <SelectItem value="aud">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="bg-white text-slate-900" />
                </div>
                <div>
                  <Label>Assign Username (optional)</Label>
                  <Select value={form.user_name} onValueChange={(v) => setForm((f) => ({ ...f, user_name: v }))}>
                    <SelectTrigger className="bg-white text-slate-900"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {usernames.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editing ? "Save Changes" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>);

}