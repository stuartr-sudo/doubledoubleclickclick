
import React, { useState, useEffect, useCallback } from "react";
import { Sitemap } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Trash2, Search, Globe, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ingestSitemap } from "@/api/functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

export default function SitemapManager() {
  const [sitemaps, setSitemaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for the "Add Sitemap" dialog
  const [newSitemapUrl, setNewSitemapUrl] = useState("");
  const [assignmentUsername, setAssignmentUsername] = useState("");
  const [availableUsernames, setAvailableUsernames] = useState([]);

  // State for filtering
  const [filterUsername, setFilterUsername] = useState("all");

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username for filtering and display
  const activeFilterUsername = useWorkspaceScoping ? (globalUsername || "all") : filterUsername;

  const loadSitemaps = useCallback(async (user, allowedUsernamesForUserRole = null) => {
    try {
      let usernamesToFetch = [];
      if (useWorkspaceScoping) {
          if (globalUsername && globalUsername !== 'all') { // If a specific global username is selected
              usernamesToFetch = [globalUsername];
          } else {
              // If globalUsername is 'all' or not set (null/undefined) in a workspace-scoped context,
              // we should load for all usernames the current user has access to, based on `allowedUsernamesForUserRole`.
              usernamesToFetch = allowedUsernamesForUserRole || (Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : []);
          }
      } else if (user?.role === 'admin') {
          // Admin can see all sitemaps if not under workspace scoping.
          // This is a direct `Sitemap.list` call, not filtered by username.
          setSitemaps(await Sitemap.list("-created_date") || []);
          return; // Exit early as sitemaps are already set
      } else {
          // Regular user, not under workspace scoping.
          // Load for their assigned usernames.
          usernamesToFetch = allowedUsernamesForUserRole || (Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : []);
      }

      // If we have usernames to fetch, make a single API call for all of them.
      if (usernamesToFetch.length > 0) {
        // This assumes Sitemap.filter can accept an array for the user_name property
        // to perform an "IN" query on the backend.
        const sitemapsToLoad = await Sitemap.filter({ user_name: usernamesToFetch }, "-created_date");
        setSitemaps(sitemapsToLoad || []);
      } else {
        // No usernames to fetch for, so set sitemaps to empty.
        setSitemaps([]);
      }
    } catch (error) {
      console.error("Failed to load sitemaps:", error);
      toast.error("Failed to load sitemaps.");
      setSitemaps([]);
    }
  }, [useWorkspaceScoping, globalUsername]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Get available usernames based on user role
        let usernames = [];
        if (user.role === 'admin') {
          // Admin can see all active usernames
          const allUsernames = await Username.list("user_name");
          usernames = allUsernames.filter(u => u.is_active !== false).map(u => u.user_name);
        } else {
          // Regular users can only see their assigned usernames
          usernames = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
        }
        
        // Ensure usernames are unique and sorted
        const uniqueSortedUsernames = Array.from(new Set(usernames)).sort();
        setAvailableUsernames(uniqueSortedUsernames);

        // Set default assignment username for the dialog only if not using workspace scoping
        // The separate useEffect will handle this for workspace scoping
        if (!useWorkspaceScoping) {
          if (uniqueSortedUsernames.length === 1) {
            setAssignmentUsername(uniqueSortedUsernames[0]);
          } else if (uniqueSortedUsernames.length > 0 && user.role !== 'admin' && user.assigned_usernames?.length === 1) {
            // If a non-admin user has only one assigned username, pre-select it
            setAssignmentUsername(uniqueSortedUsernames[0]);
          } else if (uniqueSortedUsernames.length > 0) {
            // For admins or users with multiple, just pick the first or leave empty
            setAssignmentUsername(uniqueSortedUsernames[0]);
          }
        }

        // loadSitemaps will handle filtering based on useWorkspaceScoping and globalUsername
        await loadSitemaps(user, uniqueSortedUsernames);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        toast.error("Failed to load initial data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [useWorkspaceScoping, globalUsername, loadSitemaps]); // Re-run when workspace scoping, globalUsername, or loadSitemaps changes

  // When workspace scoping is active, sync the form's assignment username
  useEffect(() => {
    if (useWorkspaceScoping) {
      setAssignmentUsername(globalUsername || "");
    }
  }, [useWorkspaceScoping, globalUsername]);


  const handleIngestSitemap = async () => {
    const activeAssignmentUsername = useWorkspaceScoping ? globalUsername : assignmentUsername;
    if (!newSitemapUrl || !activeAssignmentUsername) {
      toast.error("Sitemap URL and Username are required.");
      return;
    }
    setIsIngesting(true);
    try {
      await ingestSitemap({ sitemap_url: newSitemapUrl, user_name: activeAssignmentUsername });
      toast.success("Sitemap ingested successfully!");
      setIsDialogOpen(false);
      setNewSitemapUrl("");
      
      // Reload sitemaps after successful ingestion
      await loadSitemaps(currentUser, availableUsernames);
    } catch (error) {
      console.error("Failed to ingest sitemap:", error);
      toast.error(`Failed to ingest sitemap: ${error.data?.error || error.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const deleteSitemap = async (sitemap) => {
    if (!confirm(`Delete sitemap for "${sitemap.domain}"? This will remove all associated pages.`)) return;

    try {
      await Sitemap.delete(sitemap.id);
      toast.success("Sitemap deleted successfully");
      // Reload sitemaps after deletion
      await loadSitemaps(currentUser, availableUsernames);
    } catch (error) {
      console.error("Error deleting sitemap:", error);
      toast.error("Failed to delete sitemap");
    }
  };

  // Filter logic
  const filteredSitemaps = sitemaps.filter((sitemap) =>
    activeFilterUsername === "all" || sitemap.user_name === activeFilterUsername
  );

  const usernamesForFilter = [...new Set(sitemaps.map((s) => s.user_name).filter(Boolean))].sort();

  return (
    <div className="min-h-screen p-6 bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              Sitemap Manager
            </h1>
            <p className="text-slate-600 mt-1">Manage your website sitemaps for internal linking</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Sitemap
          </Button>
        </div>

        {/* Filters - conditionally rendered */}
        {!useWorkspaceScoping && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label htmlFor="username-filter" className="text-slate-700 mb-2 block">Filter by Username</Label>
                <Select value={filterUsername} onValueChange={setFilterUsername}>
                  <SelectTrigger id="username-filter" className="bg-white border-slate-300 text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="all">All Usernames</SelectItem>
                    {usernamesForFilter.map((name) => (
                      <SelectItem key={name} value={name} className="hover:bg-slate-100">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : filteredSitemaps.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            <Globe className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No sitemaps found for the selected filter.</p>
            <p className="text-sm mt-2">Click "Add Sitemap" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSitemaps.map((sitemap) => (
              <div key={sitemap.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-blue-900 font-semibold text-lg mb-1">{sitemap.domain}</h3>
                    <p className="text-slate-600 text-sm mb-1">
                      {sitemap.pages?.length || 0} pages indexed
                    </p>
                    <p className="text-slate-500 text-xs">
                      Username: {sitemap.user_name}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Created: {new Date(sitemap.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => deleteSitemap(sitemap)}
                    variant="destructive"
                    size="sm"
                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Add New Sitemap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="sitemap-url">Sitemap URL</Label>
              <Input
                id="sitemap-url"
                placeholder="https://example.com/sitemap.xml"
                value={newSitemapUrl}
                onChange={(e) => setNewSitemapUrl(e.target.value)}
                className="bg-white border-slate-300 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="assignment-username">Assign to Username</Label>
              {useWorkspaceScoping ? (
                 <Input
                  value={globalUsername || "No workspace selected"}
                  disabled
                  className="bg-slate-100 border-slate-300 text-slate-500 mt-1"
                />
              ) : (
                <Select value={assignmentUsername} onValueChange={setAssignmentUsername}>
                  <SelectTrigger id="assignment-username" className="bg-white border-slate-300 mt-1">
                    <SelectValue placeholder="Select a username" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border-slate-200">
                    {availableUsernames.map((name) => (
                      <SelectItem key={name} value={name} className="hover:bg-slate-100">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)} 
              className="bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleIngestSitemap} 
              disabled={isIngesting} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Ingesting...
                </>
              ) : (
                'Ingest Sitemap'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
