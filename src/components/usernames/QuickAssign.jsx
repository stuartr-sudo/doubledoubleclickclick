import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AtSign, Plus, User as UserIcon, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuickAssign({
  usernames = [],
  users = [],
  onAssign,
  onCreateUsername,
  disabled = false,
  title = "Quick Assign",
}) {
  const [usernameId, setUsernameId] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);
  const [newKey, setNewKey] = React.useState("");
  const [newDisplay, setNewDisplay] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);

  const usernameMap = React.useMemo(() => {
    const m = new Map();
    usernames.forEach(u => m.set(u.id, u));
    return m;
  }, [usernames]);

  const sortedUsernames = React.useMemo(() => {
    return [...usernames].sort((a,b) => (a.user_name || "").localeCompare(b.user_name || ""));
  }, [usernames]);

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a,b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""));
  }, [users]);

  const selectedUsername = usernameMap.get(usernameId);
  const alreadyAssigned = React.useMemo(() => {
    if (!selectedUsername || !userId) return false;
    const u = users.find(x => x.id === userId);
    const list = Array.isArray(u?.assigned_usernames) ? u.assigned_usernames : [];
    return list.includes(selectedUsername.user_name);
  }, [selectedUsername, userId, users]);

  const handleAssign = async () => {
    if (!usernameId || !userId) return;
    setIsAssigning(true);
    try {
      await onAssign?.(usernameId, userId);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreate = async () => {
    const key = (newKey || "").trim();
    if (!key) return;
    setIsCreating(true);
    try {
      const created = await onCreateUsername?.({ user_name: key, display_name: (newDisplay || "").trim() || undefined });
      if (created?.id) {
        setUsernameId(created.id);
        setOpenCreate(false);
        setNewKey("");
        setNewDisplay("");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AtSign className="w-4 h-4 text-emerald-300" />
          <h3 className="font-semibold text-white">{title}</h3>
          {selectedUsername?.is_active === false && (
            <Badge variant="outline" className="border-amber-400/50 text-amber-200">Inactive</Badge>
          )}
        </div>
        <Button
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
          onClick={() => setOpenCreate(true)}
          disabled={disabled}
          title="Create a new username"
        >
          <Plus className="w-4 h-4" /> New username
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3">
        <div>
          <Label className="text-white/80 text-xs mb-1 block">Username</Label>
          <Select value={usernameId} onValueChange={setUsernameId} disabled={disabled || sortedUsernames.length === 0}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={sortedUsernames.length ? "Choose username..." : "No usernames yet"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 text-white">
              {sortedUsernames.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.user_name}{u.display_name ? ` — ${u.display_name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/80 text-xs mb-1 block">User</Label>
          <Select value={userId} onValueChange={setUserId} disabled={disabled || sortedUsers.length === 0}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={sortedUsers.length ? "Choose user..." : "No users available"} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 text-white">
              {sortedUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {(u.full_name || u.email) + (u.role === "admin" ? " (admin)" : "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={handleAssign}
            disabled={disabled || !usernameId || !userId || alreadyAssigned || isAssigning}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 gap-2"
            title={alreadyAssigned ? "This user already has that username" : "Assign username to user"}
          >
            <Check className="w-4 h-4" />
            Assign
          </Button>
        </div>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="bg-slate-900/95 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AtSign className="w-4 h-4 text-emerald-300" />
              Create Username
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Username key (required)</Label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g., acme_plumbing"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label>Display name (optional)</Label>
              <Input
                value={newDisplay}
                onChange={(e) => setNewDisplay(e.target.value)}
                placeholder="e.g., ACME Plumbing"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenCreate(false)} className="bg-white/10 border-white/20 text-white">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newKey.trim() || isCreating} className="bg-emerald-600 hover:bg-emerald-700">
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}