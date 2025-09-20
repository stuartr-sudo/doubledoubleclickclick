
import React, { useEffect, useState, useMemo } from "react";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Check, X, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import AssignUsersDialog from "@/components/usernames/AssignUsersDialog";
import QuickAssign from "@/components/usernames/QuickAssign";
import UsernameListItem from "@/components/usernames/UsernameListItem";
import AddBrandModal from "@/components/usernames/AddBrandModal";

export default function UsernameManager() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usernames, setUsernames] = useState([]);
  const [search, setSearch] = useState("");

  // Create form state
  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for user assignment (used by dialog)
  const [users, setUsers] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignFor, setAssignFor] = useState(null);

  // Add modal open state
  const [addBrandOpen, setAddBrandOpen] = useState(false);

  const isSuperAdmin = useMemo(() => {
    return !!(currentUser && (currentUser.role === "admin" || currentUser.access_level === "full"));
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await User.me();
        setCurrentUser(me);
        if (me && (me.role === "admin" || me.access_level === "full")) {
          await loadUsernames();
          await loadUsers(); // NEW: load all users for assignment control
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadUsernames = async () => {
    const list = await Username.list("-created_date").catch(() => []);
    setUsernames(list || []);
  };

  // NEW: Function to load all users
  const loadUsers = async () => {
    const list = await User.list().catch(() => []);
    setUsers(list || []);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only super admins can create usernames.");
      return;
    }
    const key = userName.trim();
    if (!key) {
      toast.error("Username is required.");
      return;
    }
    // Prevent duplicates (case-insensitive)
    const exists = usernames.some(u => (u.user_name || "").toLowerCase() === key.toLowerCase());
    if (exists) {
      toast.error("A username with this key already exists.");
      return;
    }
    setSaving(true);
    try {
      await Username.create({
        user_name: key,
        display_name: displayName.trim() || undefined,
        notes: notes.trim() || undefined,
        is_active: isActive,
      });
      toast.success("Username created.");
      setUserName("");
      setDisplayName("");
      setNotes("");
      setIsActive(true);
      await loadUsernames();
    } catch (err) {
      toast.error("Failed to create username.");
    }
    setSaving(false);
  };

  const toggleActive = async (record) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can update usernames.");
      return;
    }
    await Username.update(record.id, { is_active: !record.is_active });
    await loadUsernames();
  };

  const saveInline = async (record, fields) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can update usernames.");
      return;
    }
    await Username.update(record.id, fields);
    toast.success("Saved.");
    await loadUsernames();
    // If username key changed, we need to reload users too to reflect assigned_usernames changes
    if (fields.user_name) {
      await loadUsers();
    }
  };

  // Function to unassign a username from a user (used by individual chip X button)
  const unassignUsernameFromUser = async (usernameRecord, user) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can unassign usernames.");
      return;
    }
    const name = usernameRecord.user_name;
    const current = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
    if (!current.includes(name)) return;
    try {
      const next = current.filter(n => n !== name);
      await User.update(user.id, { assigned_usernames: next });
      toast.success(`Removed "${name}" from ${user.full_name || user.email}`);
      await loadUsers(); // Reload users to reflect updated assignments
    } catch {
      toast.error("Failed to unassign username.");
    }
  };

  // NEW: Apply dialog-selected assignments in bulk
  const applyAssignments = async (usernameRecord, nextUserIds) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can manage assignments.");
      return;
    }
    const uname = usernameRecord.user_name;
    const nextSet = new Set(nextUserIds || []);

    // Compute current assignments
    const currentlyAssigned = users.filter(u => Array.isArray(u.assigned_usernames) && u.assigned_usernames.includes(uname));
    const currentSet = new Set(currentlyAssigned.map(u => u.id));

    const toAdd = users.filter(u => nextSet.has(u.id) && !currentSet.has(u.id));
    const toRemove = users.filter(u => currentSet.has(u.id) && !nextSet.has(u.id));

    // Perform updates
    const addOps = toAdd.map(async (u) => {
      const list = Array.isArray(u.assigned_usernames) ? u.assigned_usernames : [];
      await User.update(u.id, { assigned_usernames: [...list, uname] });
    });
    const removeOps = toRemove.map(async (u) => {
      const list = Array.isArray(u.assigned_usernames) ? u.assigned_usernames : [];
      await User.update(u.id, { assigned_usernames: list.filter(n => n !== uname) });
    });

    await Promise.all([...addOps, ...removeOps]);
    await loadUsers();
    toast.success("Assignments updated.");
  };

  // Add a single-assign helper used by the quick bar
  const quickAssign = async (usernameId, targetUserId) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can assign usernames.");
      return;
    }
    const usernameRecord = usernames.find(x => x.id === usernameId);
    const user = users.find(u => u.id === targetUserId);
    if (!usernameRecord || !user) {
      toast.error("Username or User not found.");
      return;
    }

    const name = usernameRecord.user_name;
    const list = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
    if (list.includes(name)) {
      toast.message("User already has this username.");
      return;
    }
    try {
      await User.update(user.id, { assigned_usernames: [...list, name] });
      toast.success(`Assigned "${name}" to ${user.full_name || user.email}`);
      await loadUsers();
    } catch (error) {
      toast.error("Failed to assign username.");
    }
  };

  // Create a username from the quick bar dialog
  // Returns the created record so the dropdown can select it
  const quickCreateUsername = async ({ user_name, display_name }) => {
    if (!isSuperAdmin) {
      toast.error("Only super admins can create usernames.");
      return null;
    }
    const key = (user_name || "").trim();
    if (!key) {
      toast.error("Username key is required.");
      return null;
    }
    const exists = usernames.some(u => (u.user_name || "").toLowerCase() === key.toLowerCase());
    if (exists) {
      toast.error("A username with this key already exists.");
      return null;
    }
    try {
      const created = await Username.create({
        user_name: key,
        display_name: (display_name || "").trim() || undefined,
        is_active: true
      });
      await loadUsernames();
      toast.success("Username created.");
      return created;
    } catch (error) {
      toast.error("Failed to create username.");
      return null;
    }
  };

  const filtered = usernames.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.user_name || "").toLowerCase().includes(q) ||
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.notes || "").toLowerCase().includes(q)
    );
  });

  // Helper to open dialog
  const openAssignDialog = (u) => { setAssignFor(u); setAssignDialogOpen(true); };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white grid place-items-center">
        <div className="opacity-80">Loading...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Access restricted</CardTitle>
            </CardHeader>
            <CardContent>
              You don't have permission to manage usernames. This page is only available to super admins.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Usernames</h1>
          {/* New 'Add Another Brand' button */}
          <Button
            onClick={() => setAddBrandOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            title="Create a brand and generate a payment link"
          >
            <Plus className="w-4 h-4" />
            Add Another Brand
          </Button>
        </div>

        {/* Quick assign bar */}
        {isSuperAdmin && (
          <div className="mb-6">
            <QuickAssign
              usernames={usernames}
              users={users}
              onAssign={quickAssign}
              onCreateUsername={quickCreateUsername}
              disabled={!isSuperAdmin}
              title="Assign a username to a user"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create form */}
          <Card id="create-username" className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Create a new username</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>Username key (required)</Label>
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. acme_plumbing"
                    className="bg-white text-slate-900"
                  />
                </div>
                <div>
                  <Label>Display name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. ACME Plumbing"
                    className="bg-white text-slate-900"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    rows={3}
                    className="bg-white text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="mr-2">Active</Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  {saving ? "Creating..." : "Create Username"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search usernames..."
                className="pl-9 bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-4">
              {filtered.map((u) => (
                <UsernameListItem
                  key={u.id}
                  record={u}
                  users={users}
                  allUsernames={usernames}
                  isSuperAdmin={isSuperAdmin}
                  onToggleActive={toggleActive}
                  onOpenAssign={openAssignDialog}
                  onUnassign={unassignUsernameFromUser}
                  onEdit={saveInline}
                />
              ))}
              {filtered.length === 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="py-10 text-center text-white/70">
                    No usernames found.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Assign users dialog */}
      {assignFor && (
        <AssignUsersDialog
          open={assignDialogOpen}
          onClose={() => { setAssignDialogOpen(false); setAssignFor(null); }}
          usernameRecord={assignFor}
          users={users}
          onSave={applyAssignments}
        />
      )}

      {/* Add Brand Modal */}
      <AddBrandModal
        open={addBrandOpen}
        onClose={() => { setAddBrandOpen(false); loadUsernames?.(); loadUsers?.(); }}
        users={users}
        existingUsernames={usernames}
      />
    </div>
  );
}
