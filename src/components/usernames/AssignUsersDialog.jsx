import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { toast } from "sonner";

export default function AssignUsersDialog({ open, onClose, usernameRecord, users = [], onSave }) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState(new Set());

  React.useEffect(() => {
    if (!open) return;
    // Initialize with currently assigned users
    const uname = usernameRecord?.user_name || "";
    const currentIds = users
      .filter(u => Array.isArray(u.assigned_usernames) && u.assigned_usernames.includes(uname))
      .map(u => u.id);
    setSelected(new Set(currentIds));
    setQuery("");
  }, [open, usernameRecord, users]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter(u =>
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!usernameRecord) {
      toast.error("No username selected.");
      return;
    }
    await onSave(usernameRecord, Array.from(selected));
    onClose();
  };

  const assignedCount = selected.size;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="b44-modal max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign users to “{usernameRecord?.user_name}”
          </DialogTitle>
          <DialogDescription>
            Pick one or more users that should have access to this username.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search users by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
            <Badge variant="outline" className="ml-3 border-emerald-400/40 text-emerald-200">
              {assignedCount} selected
            </Badge>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-white/10">
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-white/60">No users found.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {filtered.map(u => {
                  const id = u.id;
                  const checked = selected.has(id);
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">
                          {u.full_name || u.email}
                        </div>
                        <div className="text-xs text-white/60 truncate">{u.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {u.role === "admin" && (
                          <Badge className="bg-indigo-600">Admin</Badge>
                        )}
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(id)}
                          className="border-white/30 data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="bg-white/10 border-white/20 text-white">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              Save assignments
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}