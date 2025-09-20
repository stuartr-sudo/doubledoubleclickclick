import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function UsernameListItem({
  record,
  users = [],
  allUsernames = [],
  isSuperAdmin = false,
  onToggleActive,
  onOpenAssign,
  onUnassign,
  onEdit
}) {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    display_name: record.display_name || "",
    user_name: record.user_name || "",
    notes: record.notes || ""
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    // reset if record changes
    setForm({
      display_name: record.display_name || "",
      user_name: record.user_name || "",
      notes: record.notes || ""
    });
    setEditing(false);
  }, [record?.id]);

  const assignedUsers = React.useMemo(() => {
    const uname = record.user_name || "";
    return users.filter(u => Array.isArray(u.assigned_usernames) && u.assigned_usernames.includes(uname));
  }, [users, record.user_name]);

  const handleSave = async () => {
    if (!isSuperAdmin) return;
    const updates = {};
    if ((record.display_name || "") !== form.display_name) updates.display_name = form.display_name || undefined;
    if ((record.notes || "") !== form.notes) updates.notes = form.notes || undefined;

    const trimmedKey = (form.user_name || "").trim();
    if (trimmedKey.length === 0) {
      toast.error("Username key cannot be empty.");
      return;
    }
    if ((record.user_name || "") !== trimmedKey) {
      // uniqueness check (case-insensitive)
      const dup = allUsernames.some(u =>
        u.id !== record.id && (u.user_name || "").toLowerCase() === trimmedKey.toLowerCase()
      );
      if (dup) {
        toast.error("That username key already exists.");
        return;
      }
      updates.user_name = trimmedKey;
    }

    if (Object.keys(updates).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onEdit?.(record, updates);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 md:p-5 hover:bg-white/7 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-white break-all">{record.user_name}</h3>
            <Badge className={record.is_active ? "bg-emerald-600" : "bg-slate-500"}>
              {record.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="text-white/70 text-sm mt-1">
            Display: {record.display_name || <span className="italic text-white/50">none</span>}
          </div>
          {record.notes && !editing && (
            <div className="text-white/60 text-xs mt-1 line-clamp-2">{record.notes}</div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => onToggleActive?.(record)}
            disabled={!isSuperAdmin}
            title={record.is_active ? "Deactivate" : "Activate"}
          >
            <X className="w-4 h-4 mr-2" />
            {record.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => onOpenAssign?.(record)}
            disabled={!isSuperAdmin}
            title="Assign / unassign users"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage users
          </Button>
          {editing ? (
            <>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={saving}
                title="Save changes"
              >
                <Check className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setForm({
                    display_name: record.display_name || "",
                    user_name: record.user_name || "",
                    notes: record.notes || ""
                  });
                  setEditing(false);
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                title="Cancel edit"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setEditing(true)}
              disabled={!isSuperAdmin}
              title="Edit fields"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Edit section */}
      {editing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Input
            placeholder="Display name"
            value={form.display_name}
            onChange={(e) => setForm(s => ({ ...s, display_name: e.target.value }))}
            className="bg-white text-slate-900"
          />
          <Input
            placeholder="Username key"
            value={form.user_name}
            onChange={(e) => setForm(s => ({ ...s, user_name: e.target.value }))}
            className="bg-white text-slate-900"
          />
          <Input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm(s => ({ ...s, notes: e.target.value }))}
            className="bg-white text-slate-900"
          />
        </div>
      )}

      {/* Assigned users chips */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex flex-wrap gap-2">
          {assignedUsers.length > 0 ? (
            assignedUsers.map(usr => (
              <Badge
                key={usr.id}
                variant="outline"
                className="border-emerald-400/40 text-emerald-200 flex items-center gap-1"
              >
                {usr.full_name || usr.email}
                {isSuperAdmin && (
                  <button
                    onClick={() => onUnassign?.(record, usr)}
                    className="ml-1 hover:text-red-300"
                    title="Remove this assignment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))
          ) : (
            <span className="text-white/50 text-sm">No users assigned yet.</span>
          )}
        </div>
      </div>
    </div>
  );
}