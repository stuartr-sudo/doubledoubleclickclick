import React from "react";
import { ServiceItem } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Package, Pencil } from "lucide-react";

export default function AddItemFromCatalog({ onAdd }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState("");
  const [showCustom, setShowCustom] = React.useState(false);
  const [custom, setCustom] = React.useState({ description: "", quantity: 1, unit_price: 0 });

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await User.me().catch(() => null);
        let list = await ServiceItem.list("-created_date").catch(() => []);
        if (me && !(me.role === "admin" || me.access_level === "full")) {
          const assigned = Array.isArray(me.assigned_usernames) ? new Set(me.assigned_usernames) : new Set();
          list = list.filter(it => !it.user_name || assigned.has(it.user_name));
        }
        list = list.filter(it => it.is_active !== false);
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddSelected = () => {
    if (!selectedId) return;
    if (selectedId === "__custom__") {
      setShowCustom(true);
      return;
    }
    const it = items.find(i => String(i.id) === String(selectedId));
    if (!it) return;
    onAdd({
      description: it.description || it.name || "Service",
      quantity: Math.max(1, Number(it.default_quantity || 1)),
      unit_price: Number(it.unit_price || 0)
    });
    setSelectedId("");
  };

  const addCustom = () => {
    if (!custom.description || Number(custom.unit_price) < 0) return;
    onAdd({
      description: custom.description,
      quantity: Math.max(1, Number(custom.quantity || 1)),
      unit_price: Number(custom.unit_price || 0)
    });
    setShowCustom(false);
    setCustom({ description: "", quantity: 1, unit_price: 0 });
    setSelectedId("");
  };

  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-gray-600" />
        <div className="font-medium">Add from Services</div>
      </div>
      <div className="flex gap-2 flex-col sm:flex-row">
        <Select value={selectedId} onValueChange={setSelectedId} disabled={loading}>
          <SelectTrigger className="sm:w-[340px]">
            <SelectValue placeholder={loading ? "Loading..." : "Select a service"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__custom__">Custom scope & price…</SelectItem>
            {items.map(it => (
              <SelectItem key={it.id} value={String(it.id)}>
                {it.name} {typeof it.unit_price === "number" ? `• $${Number(it.unit_price).toFixed(2)}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAddSelected} className="gap-2">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Custom scope & price
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Scope / description"
              value={custom.description}
              onChange={(e) => setCustom(c => ({ ...c, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="1"
                step="1"
                value={custom.quantity}
                onChange={(e) => setCustom(c => ({ ...c, quantity: e.target.value }))}
                placeholder="Quantity"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={custom.unit_price}
                onChange={(e) => setCustom(c => ({ ...c, unit_price: e.target.value }))}
                placeholder="Unit price"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCustom(false)}>Cancel</Button>
              <Button onClick={addCustom}>Add to Invoice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}