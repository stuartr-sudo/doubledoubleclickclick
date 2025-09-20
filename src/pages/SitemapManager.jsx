
import React, { useState, useEffect } from "react";
import { Sitemap } from "@/api/entities"; // This import might become unused but keeping it as it was in original, though the changes point to removing direct entity calls.
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Trash2, Search, Globe, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ingestSitemap } from "@/api/functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Replace entity calls with backend functions
import { listSitemaps } from "@/api/functions";
import { deleteSitemapById } from "@/api/functions";

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

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Fetch all usernames for the assignment dropdown
        const allUsers = await User.list();
        const usernames = new Set();
        allUsers.forEach((u) => {
          if (Array.isArray(u.assigned_usernames)) {
            u.assigned_usernames.forEach((name) => usernames.add(name));
          }
        });
        const sortedUsernames = Array.from(usernames).sort();
        setAvailableUsernames(sortedUsernames);

        if (user.role !== 'admin' && user.assigned_usernames?.length === 1) {
          setAssignmentUsername(user.assigned_usernames[0]);
        } else if (sortedUsernames.length > 0) {
          setAssignmentUsername(sortedUsernames[0]);
        }

        await loadSitemaps(user);
      } catch (error) {
        toast.error("Failed to load initial data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const loadSitemaps = async (user) => {
    try {
      // const allSitemaps = await Sitemap.list("-created_date"); // Original line
      // Replaced by backend function:
      const { data } = await listSitemaps();
      const allSitemaps = data?.items || [];

      if (user.role === 'admin') {
        setSitemaps(allSitemaps);
      } else {
        const userSitemaps = allSitemaps.filter((s) =>
        user.assigned_usernames && user.assigned_usernames.includes(s.user_name)
        );
        setSitemaps(userSitemaps);
      }
    } catch (error) {
      toast.error("Failed to load sitemaps.");
    }
  };

  const handleIngestSitemap = async () => {
    if (!newSitemapUrl || !assignmentUsername) {
      toast.error("Sitemap URL and Username are required.");
      return;
    }
    setIsIngesting(true);
    try {
      await ingestSitemap({ sitemap_url: newSitemapUrl, user_name: assignmentUsername });
      toast.success("Sitemap ingested successfully! The page will refresh.");
      setIsDialogOpen(false);
      setNewSitemapUrl("");
      // Refresh the page to show new data
      window.location.reload();
    } catch (error) {
      toast.error(`Failed to ingest sitemap: ${error.data?.error || error.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const deleteSitemap = async (sitemap) => {
    if (!confirm(`Delete sitemap for "${sitemap.domain}"? This will remove all associated pages.`)) return;

    try {
      // await Sitemap.delete(sitemap.id); // Original line
      await deleteSitemapById({ id: sitemap.id });
      toast.success("Sitemap deleted successfully");
      await loadSitemaps(currentUser); // Reload after delete
    } catch (error) {
      toast.error("Failed to delete sitemap");
      console.error("Error deleting sitemap:", error);
    }
  };

  // Filter logic
  const filteredSitemaps = sitemaps.filter((sitemap) =>
  filterUsername === "all" || sitemap.user_name === filterUsername
  );

  const usernamesForFilter = [...new Set(sitemaps.map((s) => s.user_name))].sort();

  return (
    <div className="min-h-screen p-6 bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Sitemap Manager
            </h1>
            <p className="text-slate-600 mt-1">Manage your website sitemaps for internal linking</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Sitemap
          </Button>
        </div>

        {/* Filters */}
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
                            {usernamesForFilter.map((name) => <SelectItem key={name} value={name} className="hover:bg-slate-100">{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        {isLoading ?
        <div className="text-center py-12 text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div> :
        filteredSitemaps.length === 0 ?
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            <Globe className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No sitemaps found for the selected filter.</p>
            <p className="text-sm mt-2">Click "Add Sitemap" to get started.</p>
          </div> :

        <div className="space-y-4">
            {filteredSitemaps.map((sitemap) =>
          <div key={sitemap.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-slate-900 font-semibold text-lg mb-1">{sitemap.domain}</h3>
                    <p className="text-slate-600 text-sm mb-1">
                      {sitemap.pages?.length || 0} pages indexed
                    </p>
                     <p className="text-slate-500 text-xs">
                      Username: {sitemap.user_name}
                    </p>
                  </div>
                  <Button
                onClick={() => deleteSitemap(sitemap)}
                variant="destructive"
                size="sm"
                className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">

                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
          )}
          </div>
        }
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle>Add New Sitemap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="sitemap-url">Sitemap URL</Label>
              <Input
                id="sitemap-url"
                placeholder="https://example.com/sitemap.xml"
                value={newSitemapUrl}
                onChange={(e) => setNewSitemapUrl(e.target.value)}
                className="bg-white border-slate-300 mt-1" />

            </div>
            <div>
              <Label htmlFor="assignment-username">Assign to Username</Label>
              <Select value={assignmentUsername} onValueChange={setAssignmentUsername}>
                <SelectTrigger id="assignment-username" className="bg-white border-slate-300 mt-1">
                  <SelectValue placeholder="Select a username" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border-slate-200">
                  {currentUser?.role === 'admin' ?
                  availableUsernames.map((name) => <SelectItem key={name} value={name} className="hover:bg-slate-100">{name}</SelectItem>) :
                  currentUser?.assigned_usernames?.map((name) => <SelectItem key={name} value={name} className="hover:bg-slate-100">{name}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-slate-100 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">Cancel</Button>
            <Button onClick={handleIngestSitemap} disabled={isIngesting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isIngesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isIngesting ? 'Ingesting...' : 'Ingest Sitemap'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}