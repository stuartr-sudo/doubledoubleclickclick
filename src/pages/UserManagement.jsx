
import React, { useEffect, useMemo, useState } from "react";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { IntegrationCredential } from "@/api/entities";
import { CrmCredential } from "@/api/entities"; // Added missing import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import MiniMultiSelect from "@/components/common/MiniMultiSelect";
import { Loader2, Users, Shield, Plus, Copy, RefreshCw, Trash2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import CredentialQuickAdd from "@/components/credentials/CredentialQuickAdd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddBrandModal from "@/components/usernames/AddBrandModal";
import AnalyticsByUsername from "@/components/analytics/AnalyticsByUsername";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";
import CrmQuickAdd from "@/components/crm/CrmQuickAdd";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState("");
  const [usernames, setUsernames] = useState([]);
  const [isSavingMap, setIsSavingMap] = useState({}); // { [userId]: boolean }
  const [newUsername, setNewUsername] = useState({ user_name: "", display_name: "" });
  const [isCreatingUsername, setIsCreatingUsername] = useState(false);
  const [integrationCreds, setIntegrationCreds] = useState([]);
  const [isSavingUsernameMap, setIsSavingUsernameMap] = useState({}); // { [usernameId]: boolean }
  const [quickAdd, setQuickAdd] = useState({ open: false, provider: null, user_name: null, usernameId: null });
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [isSavingAnalyticsMap, setIsSavingAnalyticsMap] = useState({}); // { [usernameId]: boolean }
  const [isSavingPermsMap, setIsSavingPermsMap] = useState({}); // permissions saving state
  const [userToDelete, setUserToDelete] = useState(null);
  const [crmCreds, setCrmCreds] = useState([]);
  const [isSavingCrmMap, setIsSavingCrmMap] = useState({});
  const [quickAddCrm, setQuickAddCrm] = useState({ open: false, provider: "mailchimp", user_name: null, usernameId: null });
  const [isSavingTokensMap, setIsSavingTokensMap] = useState({}); // per-user token saving state

  const [usernameToDelete, setUsernameToDelete] = useState(null);
  const [showUsernameDeleteConfirm, setShowUsernameDeleteConfirm] = useState(false);
  const [isDeletingUsername, setIsDeletingUsername] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const me = await User.me();
      setCurrentUser(me);

      if (me.role === "admin") {
        const [allUsers, allUsernames, creds, crm] = await Promise.all([
        User.list(),
        Username.list("-created_date").catch(() => []),
        IntegrationCredential.list("-created_date").catch(() => []),
        CrmCredential.list("-created_date").catch(() => [])]
        );
        setUsers(allUsers);
        setUsernames(allUsernames);
        setIntegrationCreds(creds);
        setCrmCreds(crm);
      }
    } catch (e) {
      toast.error("You must be logged in to manage users.");
    }
    setIsLoading(false);
  };

  const isAdmin = !!(currentUser && currentUser.role === "admin");

  const usernameOptions = useMemo(() => {
    return (usernames || []).
    filter((u) => u.is_active !== false).
    map((u) => ({
      value: u.user_name,
      label: u.display_name || u.user_name
    }));
  }, [usernames]);

  const filteredUsers = useMemo(() => {
    const q = userFilter.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(q) ||
    (u.email || "").toLowerCase().includes(q)
    );
  }, [users, userFilter]);

  const updateAssignedUsernames = async (user, nextList) => {
    if (!isAdmin) return;
    setIsSavingMap((prev) => ({ ...prev, [user.id]: true }));
    try {
      await User.update(user.id, { assigned_usernames: nextList });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, assigned_usernames: nextList } : u));
      toast.success(`Updated usernames for ${user.full_name || user.email}`);
    } catch (e) {
      console.error("Failed to update usernames:", e);
      toast.error("Failed to update usernames for this user.");
    }
    setIsSavingMap((prev) => ({ ...prev, [user.id]: false }));
  };

  const handleCreateUsername = async (e) => {
    e.preventDefault();
    const value = (newUsername.user_name || "").trim();
    if (!value) {
      toast.error("Username is required.");
      return;
    }

    // Check for duplicates
    const exists = usernames.some((u) => (u.user_name || "").toLowerCase() === value.toLowerCase());
    if (exists) {
      toast.error("That username already exists. Please choose a different one.");
      return;
    }

    setIsCreatingUsername(true);
    try {
      const created = await Username.create({
        user_name: value,
        display_name: newUsername.display_name || value,
        is_active: true
      });
      setUsernames((prev) => [created, ...prev]);
      setNewUsername({ user_name: "", display_name: "" });
      toast.success("Username added.");
    } catch (e) {
      console.error("Failed to create username:", e);
      if (e.message && (e.message.includes("duplicate") || e.message.includes("unique"))) {
        toast.error("That username already exists. Please choose a different one.");
      } else {
        toast.error("Failed to add username.");
      }
    }
    setIsCreatingUsername(false);
  };

  const copyAppLink = () => {
    const url = `${window.location.origin}${createPageUrl("Home")}`;
    navigator.clipboard.writeText(url);
    toast.success("App link copied. Send it to the user to sign in.");
  };

  const updateUsernameDefaults = async (u, patch) => {
    if (!isAdmin) return;
    setIsSavingUsernameMap((prev) => ({ ...prev, [u.id]: true }));
    try {
      const next = { ...u, ...patch };
      await Username.update(u.id, {
        default_publish_method: next.default_publish_method || "google_docs",
        default_credential_id: next.default_credential_id || ""
      });
      setUsernames((prev) => prev.map((x) => x.id === u.id ? { ...x, ...patch } : x));
      toast.success(`Updated defaults for ${u.display_name || u.user_name}`);
    } catch (e) {
      console.error("Failed to update username defaults:", e);
      toast.error("Failed to update defaults for this username.");
    }
    setIsSavingUsernameMap((prev) => ({ ...prev, [u.id]: false }));
  };

  const updateUsernameAnalytics = async (u, patch) => {
    if (!isAdmin) return;
    setIsSavingAnalyticsMap((prev) => ({ ...prev, [u.id]: true }));
    try {
      await Username.update(u.id, {
        ga4_property_id: patch.ga4_property_id || "",
        gsc_site_url: patch.gsc_site_url || ""
      });
      setUsernames((prev) => prev.map((x) => x.id === u.id ? { ...x, ga4_property_id: patch.ga4_property_id || "", gsc_site_url: patch.gsc_site_url || "" } : x));
      toast.success(`Analytics saved for ${u.display_name || u.user_name}`);
    } catch (e) {
      console.error("Failed to save analytics:", e);
      toast.error("Failed to save analytics fields.");
    }
    setIsSavingAnalyticsMap((prev) => ({ ...prev, [u.id]: false }));
  };

  const updateUserPermissions = async (u, patch) => {
    if (!isAdmin) return;
    setIsSavingPermsMap((prev) => ({ ...prev, [u.id]: true }));
    try {
      const payload = {};
      if ("role" in patch) payload.role = patch.role;
      if ("access_level" in patch) payload.access_level = patch.access_level;
      if ("show_publish_options" in patch) payload.show_publish_options = !!patch.show_publish_options;
      if ("department" in patch) payload.department = patch.department || "";
      if ("is_superadmin" in patch && currentUser?.is_superadmin) payload.is_superadmin = !!patch.is_superadmin;

      if (Object.keys(payload).length === 0) {
        setIsSavingPermsMap((prev) => ({ ...prev, [u.id]: false }));
        return;
      }

      await User.update(u.id, payload);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, ...payload } : x));
      toast.success(`Updated permissions for ${u.full_name || u.email}`);
    } catch (e) {
      console.error("Failed to update user permissions:", e);
      toast.error("Failed to update user permissions.");
    }
    setIsSavingPermsMap((prev) => ({ ...prev, [u.id]: false }));
  };

  const updateUserTokens = async (u, newBalance) => {
    if (!isAdmin) return;
    const parsed = Number(newBalance);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Please enter a valid non-negative number.");
      return;
    }
    if (u.token_balance === parsed) return;

    setIsSavingTokensMap((prev) => ({ ...prev, [u.id]: true }));
    try {
      await User.update(u.id, { token_balance: parsed });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, token_balance: parsed } : x));
      toast.success(`Updated tokens for ${u.full_name || u.email}`);
    } catch (e) {
      console.error("Failed to update token balance:", e);
      toast.error("Failed to update token balance.");
    }
    setIsSavingTokensMap((prev) => ({ ...prev, [u.id]: false }));
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await User.delete(userToDelete.id);
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
      toast.success(`User ${userToDelete.full_name || userToDelete.email} has been deleted.`);
    } catch (error) {
      toast.error("Failed to delete user.");
      console.error("Delete user error:", error);
    } finally {
      setUserToDelete(null);
    }
  };

  const handleDeleteUsername = async (username) => {
    setUsernameToDelete(username);
    setShowUsernameDeleteConfirm(true);
  };

  const confirmDeleteUsername = async () => {
    if (!usernameToDelete) return;
    setIsDeletingUsername(true);

    try {
      // First, remove this username from all users who have it assigned
      const usersWithThisUsername = users.filter((user) =>
      user.assigned_usernames && user.assigned_usernames.includes(usernameToDelete.user_name)
      );

      for (const user of usersWithThisUsername) {
        const updatedUsernames = user.assigned_usernames.filter((un) => un !== usernameToDelete.user_name);
        await User.update(user.id, { assigned_usernames: updatedUsernames });
      }

      // Then delete the username entity
      await Username.delete(usernameToDelete.id);

      // Update local state
      setUsernames((prev) => prev.filter((u) => u.id !== usernameToDelete.id));
      setUsers((prev) => prev.map((user) => ({
        ...user,
        assigned_usernames: user.assigned_usernames ?
        user.assigned_usernames.filter((un) => un !== usernameToDelete.user_name) : []
      })));

      toast.success(`Username "${usernameToDelete.display_name || usernameToDelete.user_name}" deleted successfully.`);
    } catch (error) {
      console.error("Error deleting username:", error);
      toast.error("Failed to delete username.");
    } finally {
      setIsDeletingUsername(false);
      setUsernameToDelete(null);
      setShowUsernameDeleteConfirm(false);
    }
  };

  const providerLabel = (p) => {
    switch (p) {
      case "notion":return "Notion";
      case "shopify":return "Shopify";
      case "wordpress":return "WordPress";
      case "webflow":return "Webflow";
      default:return "Google Docs";
    }
  };

  const providerMatches = (cred, prov) => {
    if (!prov || prov === "google_docs") return false; // Google Docs does not use a provider credential
    return cred.provider === prov;
  };

  const updateUsernameCrmDefaults = async (u, patch) => {
    if (!isAdmin) return;
    setIsSavingCrmMap((prev) => ({ ...prev, [u.id]: true }));
    try {
      const next = { ...u, ...patch };
      await Username.update(u.id, {
        default_crm_provider: next.default_crm_provider || "none",
        default_crm_credential_id: next.default_crm_credential_id || ""
      });
      setUsernames((prev) => prev.map((x) => x.id === u.id ? { ...x, ...patch } : x));
      toast.success(`Updated CRM defaults for ${u.display_name || u.user_name}`);
    } catch (e) {
      console.error("Failed to update CRM defaults:", e);
      toast.error("Failed to update CRM defaults.");
    }
    setIsSavingCrmMap((prev) => ({ ...prev, [u.id]: false }));
  };

  const crmProviderLabel = (p) => {
    switch (p) {
      case "mailchimp":return "Mailchimp";
      case "klaviyo":return "Klaviyo";
      case "active_campaign":return "ActiveCampaign";
      case "hubspot":return "HubSpot";
      case "convertkit":return "ConvertKit";
      case "mailerlite":return "MailerLite";
      case "webhook":return "Webhook";
      default:return "None";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>);

  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 flex flex-col gap-4 items-center justify-center text-center text-slate-900">
        <Shield className="w-10 h-10 text-amber-500" />
        <h2 className="text-xl font-semibold">Admins only</h2>
        <p className="text-slate-600">You don't have permission to manage users.</p>
      </div>);

  }

  return (
    <div className="min-h-screen p-6 bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7 text-slate-900" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
              <p className="text-slate-600">Add usernames and assign them to users.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin &&
            <Button
              onClick={() => setShowAddBrand(true)} className="bg-pink-500 text-white px-4 py-2 text-sm font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-pink-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.7)] shadow-[0_0_15px_rgba(236,72,153,0.4)] border border-pink-400"

              title="Create a new brand, assign a user, and generate a payment link">

                <Plus className="w-4 h-4 mr-2" />
                Add Another Brand
              </Button>
            }
            <Button onClick={loadData} variant="outline" className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Invite helper */}
        <Card className="bg-white border border-slate-200">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div className="text-sm text-slate-700">
              You cannot manually create users here. Invite a user by sharing the app link; once they sign in, they'll appear below and you can assign usernames.
            </div>
            <div className="flex-1" />
            <Button onClick={copyAppLink} variant="secondary" className="bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800">
              <Copy className="w-4 h-4 mr-2" />
              Copy app link
            </Button>
          </CardContent>
        </Card>

        {/* Add Username */}
        <Card className="bg-white border border-slate-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Add a username</h3>
            <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleCreateUsername}>
              <Input
                placeholder="username (required)"
                value={newUsername.user_name}
                onChange={(e) => setNewUsername((prev) => ({ ...prev, user_name: e.target.value }))}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

              <Input
                placeholder="Display name (optional)"
                value={newUsername.display_name}
                onChange={(e) => setNewUsername((prev) => ({ ...prev, display_name: e.target.value }))}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

              <Button type="submit" disabled={isCreatingUsername} className="bg-gray-800 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-indigo-700">
                {isCreatingUsername ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding…
                  </> :

                <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Username
                  </>
                }
              </Button>
            </form>
            {!!usernames.length &&
            <div className="mt-3">
                <div className="text-sm text-slate-600 mb-2">Existing usernames:</div>
                <div className="flex flex-wrap gap-2">
                  {usernames.slice(0, 12).map((u) =>
                <div key={u.id} className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-md px-2 py-1">
                      <span className="text-sm text-slate-700">
                        {u.display_name || u.user_name} (@{u.user_name})
                      </span>
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUsername(u)}
                    className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title={`Delete ${u.display_name || u.user_name}`}>

                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                )}
                  {usernames.length > 12 && <span className="text-sm text-slate-500">+{usernames.length - 12} more</span>}
                </div>
              </div>
            }
          </CardContent>
        </Card>

        {/* Analytics manager */}
        <AnalyticsByUsername
          usernames={usernames}
          isSavingMap={isSavingAnalyticsMap}
          onSave={updateUsernameAnalytics}
          onRefresh={loadData} />


        {/* Users table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search users by name or email…"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 w-full sm:w-auto flex-1 min-w-[220px]" />

            <div className="text-slate-500 text-sm ml-auto">{filteredUsers.length} user(s)</div>
          </div>
          <div className="divide-y divide-slate-200">
            {filteredUsers.map((u) => {
              const current = Array.isArray(u.assigned_usernames) ? u.assigned_usernames : [];
              const role = u.role || "user";
              const access = u.access_level || "edit";
              const dept = u.department || "";
              const showPublish = !!u.show_publish_options;
              const canToggleSuper = !!currentUser?.is_superadmin;
              const isSavingAny = !!isSavingMap[u.id] || !!isSavingPermsMap[u.id] || !!isSavingTokensMap[u.id];

              return (
                <div key={u.id} className="p-4">
                  <div className="grid grid-cols-1 gap-4 items-start 2xl:[grid-template-columns:2fr_3fr_220px]">
                    {/* Identity */}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 break-words">{u.full_name || u.email}</div>
                      <div className="text-xs text-slate-500 break-words">{u.email}</div>
                      <div className="text-xs text-slate-400 mt-1">Role: {role} • Access: {access}</div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-3 min-w-0">
                      <div className="min-w-0">
                        <Label className="text-slate-700 text-sm mb-1 block">Assign usernames</Label>
                        <div className="min-w-0">
                          <MiniMultiSelect
                            options={usernameOptions}
                            value={current}
                            onChange={(next) => updateAssignedUsernames(u, next)}
                            placeholder="Assign usernames…" />

                        </div>
                        {!current?.length && <div className="text-xs text-amber-600 mt-1">No usernames assigned.</div>}
                      </div>

                      {/* Responsive grid for controls */}
                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                        {/* Role radios */}
                        <div className="bg-white border border-slate-200 rounded-md p-3 min-w-0">
                          <Label className="text-slate-700 text-xs">Role</Label>
                          <div className="mt-2 overflow-x-auto -mx-1 px-1">
                            <RadioGroup
                              value={role}
                              onValueChange={(val) => updateUserPermissions(u, { role: val })}
                              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 whitespace-nowrap">

                              <div className="flex items-center gap-2">
                                <RadioGroupItem id={`role-${u.id}-user`} value="user" />
                                <Label htmlFor={`role-${u.id}-user`} className="text-slate-800">User</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem id={`role-${u.id}-admin`} value="admin" />
                                <Label htmlFor={`role-${u.id}-admin`} className="text-slate-800">Admin</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>

                        {/* Access radios */}
                        <div className="bg-white border border-slate-200 rounded-md p-3 min-w-0">
                          <Label className="text-slate-700 text-xs">Access</Label>
                          <div className="mt-2 overflow-x-auto -mx-1 px-1">
                            <RadioGroup
                              value={access}
                              onValueChange={(val) => updateUserPermissions(u, { access_level: val })}
                              className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:gap-3 whitespace-nowrap">

                              <div className="flex items-center gap-2">
                                <RadioGroupItem id={`access-${u.id}-view`} value="view" />
                                <Label htmlFor={`access-${u.id}-view`} className="text-slate-800">View</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem id={`access-${u.id}-edit`} value="edit" />
                                <Label htmlFor={`access-${u.id}-edit`} className="text-slate-800">Edit</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem id={`access-${u.id}-full`} value="full" />
                                <Label htmlFor={`access-${u.id}-full`} className="text-slate-800">Full</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>

                        {/* Show Publish radios */}
                        <div className="bg-white border border-slate-200 rounded-md p-3 min-w-0">
                          <Label className="text-slate-700 text-xs">Show Publish</Label>
                          <div className="mt-2 overflow-x-auto -mx-1 px-1">
                            <RadioGroup
                              value={showPublish ? "yes" : "no"}
                              onValueChange={(v) => updateUserPermissions(u, { show_publish_options: v === "yes" })}
                              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 whitespace-nowrap">

                              <div className="flex items-center gap-2">
                                <RadioGroupItem id={`pub-${u.id}-yes`} value="yes" />
                                <Label htmlFor={`pub-${u.id}-yes`} className="text-slate-800">Yes</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem id={`pub-${u.id}-no`} value="no" />
                                <Label htmlFor={`pub-${u.id}-no`} className="text-slate-800">No</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>

                        {/* Department + Tokens */}
                        <div className="grid gap-3 min-w-0 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
                          <div className="min-w-0">
                            <Label className="text-slate-700 text-xs mb-1 block">Department</Label>
                            <Input
                              defaultValue={dept}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== dept) updateUserPermissions(u, { department: val });
                              }}
                              className="bg-white border-slate-300 text-slate-900 h-10 w-full min-w-0"
                              placeholder="e.g., Marketing" />

                          </div>
                          <div className="min-w-0">
                            <Label className="text-slate-700 text-xs mb-1 block">Tokens</Label>
                            <Input
                              type="number"
                              min={0}
                              defaultValue={Number(u.token_balance || 0)}
                              onBlur={(e) => updateUserTokens(u, e.target.value)}
                              disabled={!isAdmin || !!isSavingTokensMap[u.id]}
                              className="bg-white border-slate-300 text-slate-900 h-10 w-full min-w-0"
                              placeholder="0" />

                          </div>
                        </div>
                      </div>

                      {/* Superadmin radios (only visible to superadmin) */}
                      {canToggleSuper &&
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-amber-900 text-xs">Superadmin</Label>
                            <div className="overflow-x-auto -mx-1 px-1">
                              <RadioGroup
                              value={u.is_superadmin ? "yes" : "no"}
                              onValueChange={(v) => updateUserPermissions(u, { is_superadmin: v === "yes" })}
                              className="grid grid-cols-2 gap-3 sm:flex sm:gap-4 whitespace-nowrap">

                                <div className="flex items-center gap-2">
                                  <RadioGroupItem id={`super-${u.id}-yes`} value="yes" />
                                  <Label htmlFor={`super-${u.id}-yes`} className="text-amber-900">Yes</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem id={`super-${u.id}-no`} value="no" />
                                  <Label htmlFor={`super-${u.id}-no`} className="text-amber-900">No</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                        </div>
                      }
                    </div>

                    {/* Status + actions */}
                    <div className="flex items-center justify-between gap-3 2xl:flex-col 2xl:items-end">
                      {isSavingAny ?
                      <span className="inline-flex items-center text-slate-600 text-sm">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving…
                        </span> :

                      <span className="text-slate-400 text-sm">Up to date</span>
                      }
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setUserToDelete(u)}
                        className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                        title={`Delete ${u.full_name || u.email}`}>

                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>);

            })}
            {filteredUsers.length === 0 &&
            <div className="p-8 text-center text-slate-500">No users found.</div>
            }
          </div>
        </div>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete the user <strong className="text-slate-900">{userToDelete?.full_name || userToDelete?.email}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)} className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">Delete User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Username Delete Confirmation Dialog */}
      <AlertDialog open={showUsernameDeleteConfirm} onOpenChange={setShowUsernameDeleteConfirm}>
        <AlertDialogContent className="bg-white border-slate-200 text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Username</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Are you sure you want to delete the username <strong className="text-slate-900">"{usernameToDelete?.display_name || usernameToDelete?.user_name}"</strong>?
              <br /><br />
              This will:
              <ul className="list-disc ml-4 mt-2">
                <li>Remove it from all users who currently have it assigned</li>
                <li>Permanently delete the username from the system</li>
              </ul>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowUsernameDeleteConfirm(false)}
              className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">

              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUsername}
              disabled={isDeletingUsername}
              className="bg-red-600 hover:bg-red-700">

              {isDeletingUsername ?
              <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </> :

              'Delete Username'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick-add credential modal */}
      <CredentialQuickAdd
        open={quickAdd.open}
        provider={quickAdd.provider}
        userName={quickAdd.user_name}
        onClose={() => setQuickAdd({ open: false, provider: null, user_name: null, usernameId: null })}
        onCreated={async (created) => {
          setIntegrationCreds((prev) => [created, ...prev]);
          const u = (usernames || []).find((x) => x.id === quickAdd.usernameId);
          if (u) {
            await updateUsernameDefaults(u, { default_credential_id: created.id });
          }
        }} />


      {/* Quick-add CRM modal */}
      <CrmQuickAdd
        open={quickAddCrm.open}
        defaultProvider={quickAddCrm.provider}
        userName={quickAddCrm.user_name}
        onClose={() => setQuickAddCrm({ open: false, provider: "mailchimp", user_name: null, usernameId: null })}
        onCreated={async (created) => {
          setCrmCreds((prev) => [created, ...prev]);
          const u = (usernames || []).find((x) => x.id === quickAddCrm.usernameId);
          if (u && (u.default_crm_provider === created.provider || u.default_crm_provider === "none")) {
            await updateUsernameCrmDefaults(u, { default_crm_provider: created.provider, default_crm_credential_id: created.id });
          }
        }} />


      {/* Add Another Brand modal */}
      {isAdmin &&
      <AddBrandModal
        open={showAddBrand}
        onClose={() => setShowAddBrand(false)}
        users={users}
        existingUsernames={usernames}
        onComplete={async ({ link }) => {
          if (link) {
            try {await navigator.clipboard.writeText(link);} catch {}
            toast.success("Payment link created and copied to clipboard.");
          } else {
            toast.message("Brand created. No payment link was returned.");
          }
          setShowAddBrand(false);
          await loadData();
        }} />

      }
    </div>);

}