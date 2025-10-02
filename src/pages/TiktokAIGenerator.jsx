
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { TikTokVideo } from "@/api/entities";
import { tiktokSearch } from "@/api/functions";
import { getTikTokOembed } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Save, Loader2, Video, Trash2, FolderOpen, RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import TikTokEmbed from "@/components/embed/TikTokEmbed";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { motion, AnimatePresence } from "framer-motion";

export default function TiktokAIGenerator() {
  // Search state
  const [showSearch, setShowSearch] = useState(false); // NEW: To toggle search form
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCount, setSearchCount] = useState(10); // UPDATED: Default to 10
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [savedVideoIds, setSavedVideoIds] = useState(new Set()); // Tracks saved video_ids

  // Library state
  const [importedVideos, setImportedVideos] = useState([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [libraryFilter, setLibraryFilter] = useState("");
  // usernameFilter and assignToUsername states are kept for scenarios where workspace scoping is disabled.
  // Their UI controls are removed when useWorkspaceScoping is enabled, as the context will handle it.
  const [usernameFilter, setUsernameFilter] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [assignToUsername, setAssignToUsername] = useState("");
  const [reassigningId, setReassigningId] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  // Workspace integration
  const { selectedUsername: globalUsername, assignedUsernames } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine the effective username for saving/operations, based on workspace scoping
  // If workspace scoping is enabled, use the global username. Otherwise, use the locally selected/default username.
  const effectiveSaveUsername = useWorkspaceScoping ? globalUsername : assignToUsername;

  const isSuperadmin = useMemo(() => !!currentUser?.is_superadmin || currentUser?.role === "admin", [currentUser]);

  const hydrateOembedCache = useCallback(async (items) => {
    const uncached = items.filter((v) => !v.oembed_html && v.url);
    for (const v of uncached) {
      try {
        const { data } = await getTikTokOembed({ url: v.url });
        if (data?.success && data.html) {
          const meta = { ...data.meta };
          await TikTokVideo.update(v.id, {
            oembed_html: data.html,
            oembed_cached_at: new Date().toISOString(),
            oembed_meta: meta
          });
          setImportedVideos((prev) => prev.map((it) => it.id === v.id ? { ...it, oembed_html: data.html, oembed_meta: meta } : it));
        }
      } catch (e) {
        console.warn("Failed to hydrate oEmbed cache for:", v.url, e);
      }
    }
  }, []);

  // Combined function to load initial data for both user context and library
  const loadInitialData = useCallback(async () => {
    setIsLibraryLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Fetch all TikTok videos
      const allVideosResponse = await TikTokVideo.list("-created_date").catch(() => []);
      const allVideos = allVideosResponse || [];

      let visibleVideos = [];
      let usernamesForDropdown = []; // For the superadmin reassign dropdown and potentially old UI selects

      if (useWorkspaceScoping) {
        if (globalUsername) {
          visibleVideos = allVideos.filter((v) => v.user_name === globalUsername);
          usernamesForDropdown = assignedUsernames; // Use assignedUsernames from workspace context for reassign options
        } else if (user?.role === 'admin' || user?.is_superadmin) {
          visibleVideos = allVideos; // Admins see all if no global workspace is selected
          usernamesForDropdown = assignedUsernames; // Use assignedUsernames from workspace context
        } else {
          const userAssigned = new Set(user?.assigned_usernames || []);
          visibleVideos = allVideos.filter((v) => userAssigned.has(v.user_name));
          usernamesForDropdown = Array.from(userAssigned).sort();
        }
        // When useWorkspaceScoping is true, assignToUsername and usernameFilter states are not directly controlled by UI,
        // as the effectiveSaveUsername comes from globalUsername and library filtering is implicit.
      } else {// Original behavior if workspace scoping is not enabled
        const allDbUsernamesResponse = await Username.list("-created_date").catch(() => []);
        const allDbUsernames = (allDbUsernamesResponse || []).
        filter((u) => u.is_active !== false).
        map((u) => u.user_name).
        sort();

        if (user?.role === 'admin' || user?.is_superadmin) {
          visibleVideos = allVideos;
          usernamesForDropdown = allDbUsernames;
        } else {
          const assigned = new Set(user?.assigned_usernames || []);
          visibleVideos = allVideos.filter((v) => assigned.has(v.user_name));
          usernamesForDropdown = Array.from(assigned).filter((name) => allDbUsernames.includes(name)).sort();
        }

        setAssignToUsername(usernamesForDropdown[0] || ""); // Set default for save target (when not scoped)
      }

      setImportedVideos(visibleVideos);
      setSavedVideoIds(new Set(visibleVideos.map((item) => item.video_id)));
      setAvailableUsernames(usernamesForDropdown); // This will be used for the reassign dropdown

      // Hydrate oEmbeds for newly loaded videos
      hydrateOembedCache(visibleVideos);

    } catch (error) {
      console.error("Error loading TikTok library:", error);
      toast.error("Failed to load TikTok library.");
      setImportedVideos([]);
      setAvailableUsernames([]); // Clear if error
      setAssignToUsername(""); // Clear if error
    } finally {
      setIsLibraryLoading(false);
    }
  }, [hydrateOembedCache, useWorkspaceScoping, globalUsername, assignedUsernames]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleTikTokSearch = async () => {
    const term = searchQuery.trim();
    if (!term) {
      toast.message("Enter a search query for TikTok videos.");
      return;
    }
    setIsSearching(true);
    setError("");
    setSearchResults([]);
    try {
      const { data } = await tiktokSearch({ keywords: term, count: searchCount });
      const items = data?.videos || [];
      if (items.length === 0) {
        toast.message("No TikTok results found for your query.");
      }
      setSearchResults(items);
    } catch (e) {
      console.error("tiktokSearch error:", e);
      setError("Failed to fetch results. Please try again.");
      toast.error("Failed to fetch results from TikTok.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveToLibrary = async (item) => {
    // Use effectiveSaveUsername determined by useWorkspaceScoping
    if (!effectiveSaveUsername || effectiveSaveUsername === "all") {
      toast.error("Please select a workspace before saving.");
      return;
    }
    const id = item.video_id;
    setSavingId(id);
    try {
      const newVideo = await TikTokVideo.create({
        title: item.title,
        video_id: item.video_id,
        url: item.web_video_url,
        cover_url: item.cover_url,
        author_name: item.author_name,
        user_name: effectiveSaveUsername
      });

      setSavedVideoIds((prev) => new Set(prev).add(id));
      toast.success("TikTok video added to library!");

      // Add to importedVideos. Filtering logic for display is handled by loadInitialData.
      setImportedVideos((prev) => [newVideo, ...prev]);
      hydrateOembedCache([newVideo]);

    } catch (e) {
      console.error("Save TikTok error:", e);
      toast.error("Could not save this video.");
    } finally {
      setSavingId(null);
    }
  };

  const handleReassignUsername = async (video, newUsername) => {
    // Reassignment is only allowed for superadmins and when workspace scoping is NOT active
    if (!isSuperadmin || useWorkspaceScoping) {
      toast.error("Only superadmins can reassign usernames when workspace scoping is not active.");
      return;
    }
    setReassigningId(video.id);
    try {
      const updatedUsername = newUsername === "__none__" ? null : newUsername;
      await TikTokVideo.update(video.id, { user_name: updatedUsername });
      toast.success("TikTok video reassigned.");
      // Reload initial data to reflect changes based on user's scope
      loadInitialData(); // Re-trigger load to update library view based on new assignment
    } catch (e) {
      console.error("Reassign TikTok video error:", e);
      toast.error("Could not reassign this video.");
    } finally {
      setReassigningId(null);
    }
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    try {
      await TikTokVideo.delete(videoToDelete.id);
      setImportedVideos((prev) => prev.filter((v) => v.id !== videoToDelete.id));
      setSavedVideoIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoToDelete.video_id);
        return newSet;
      });
      toast.success("TikTok video deleted.");
    } catch (e) {
      toast.error("Failed to delete TikTok video.");
    } finally {
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    }
  };

  const filteredLibraryVideos = useMemo(() => {
    const qLower = libraryFilter.trim().toLowerCase();
    // Filtering by username is now primarily handled by loadInitialData based on workspace context.
    // This useMemo only handles the text search on the already-filtered `importedVideos`.
    return qLower ?
    importedVideos.filter((v) => (v.title || "").toLowerCase().includes(qLower) || (v.author_name || "").toLowerCase().includes(qLower)) :
    importedVideos;
  }, [importedVideos, libraryFilter]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Video className="w-5 h-5 text-slate-700" />
              TikTok AI
              <Badge variant="outline" className="ml-2 border-slate-200 text-slate-600">Search & Save</Badge>
            </CardTitle>
            <Button
              onClick={() => setShowSearch(!showSearch)}
              variant="outline"
              className={`bg-white border-slate-300 text-slate-700 hover:bg-slate-50 ${showSearch ? 'bg-slate-100' : ''}`}
            >
              <Search className="w-4 h-4 mr-2" />
              Search TikTok
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showSearch ? 'rotate-180' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 pb-6">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search TikTok (e.g., dog training hacks)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTikTokSearch()}
                        className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
                    </div>
                    <Input
                      type="number"
                      min={1} max={10} // UPDATED: Max results to 10
                      value={searchCount}
                      onChange={(e) => setSearchCount(Math.min(10, Math.max(1, Number(e.target.value))))} // UPDATED: Max 10
                      className="w-24 bg-white border-slate-300 text-slate-900"
                      title="Max results (1-10)" />
                    <Button onClick={handleTikTokSearch} disabled={isSearching} className="bg-indigo-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 rounded-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-indigo-700 hover:shadow-[0_0_20px_rgba(0,0,128,0.6),0_0_40px_rgba(0,0,128,0.4)] whitespace-nowrap">
                      {isSearching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</> : <><Search className="w-4 h-4 mr-2" /> Search</>}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {isSearching ?
              <div className="min-h-[120px] py-16 flex items-center justify-center text-slate-500"><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading results...</div> :
              searchResults.length > 0 ? (
                <div className="min-h-[120px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {searchResults.map((item) => {
                    const id = item.video_id;
                    const isSaved = savedVideoIds.has(id);
                    const isSaving = savingId === id;
                    return (
                      <div key={id} className="rounded-lg border border-slate-200 overflow-hidden bg-white flex flex-col">
                          <div className="aspect-[9/16] bg-slate-100 grid place-items-center overflow-hidden">
                            {item.cover_url ? <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="text-slate-400">No thumbnail</div>}
                          </div>
                          <div className="p-4 flex-1 flex flex-col gap-2">
                            <div className="font-medium line-clamp-2 text-slate-900">{item.title || "TikTok Video"}</div>
                            {item.author_name && <div className="text-xs text-slate-500">by {item.author_name}</div>}
                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                              {item.web_video_url && <a href={item.web_video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm"><ExternalLink className="w-4 h-4" /> Open</a>}
                              <Button
                              size="sm"
                              onClick={() => handleSaveToLibrary(item)}
                              disabled={!effectiveSaveUsername || effectiveSaveUsername === 'all' || isSaving || isSaved}
                              className={`ml-auto ${isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                              title={!effectiveSaveUsername || effectiveSaveUsername === 'all' ? "Select a workspace to save" : isSaved ? "Added to library" : "Save to Library"}>
                                {isSaving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving</> : isSaved ? <><Save className="w-4 h-4 mr-1" /> Added</> : <><Save className="w-4 h-4 mr-1" /> Save</>}
                              </Button>
                            </div>
                          </div>
                        </div>);
                  })}
                  </div>
                </div>
              ) : ( // No search results, display prompts if search form is open, then the Imported Videos section
                <>
                  {showSearch && (searchQuery.trim() === "" ? (
                    <div className="min-h-[120px] py-16 text-center text-slate-500">Start by searching for a topic to see TikTok results here.</div>
                  ) : (
                    <div className="min-h-[120px] py-16 text-center text-slate-500">No TikTok results found for "{searchQuery}". Try a different query.</div>
                  ))}

                  <div className="mt-2">
                    <div className="flex flex-wrap items-center justify-between gap-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-slate-600" />
                        <h3 className="text-slate-900 font-semibold">Imported Videos</h3>
                        <Badge variant="outline" className="ml-1 border-slate-200 text-slate-600">{filteredLibraryVideos.length}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div className="w-full sm:w-auto">
                          <Label htmlFor="library-filter" className="sr-only">Filter imported videos</Label>
                          <Input id="library-filter" value={libraryFilter} onChange={(e) => setLibraryFilter(e.target.value)} placeholder="Filter imported..." className="h-9 w-full sm:w-[220px] bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
                        </div>
                        {/* Removed the Select for usernameFilter as per outline */}
                        <Button onClick={loadInitialData} disabled={isLibraryLoading} variant="outline" className="bg-background text-slate-50 px-3 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 border-slate-300 hover:bg-slate-50">
                          <RefreshCw className={`w-4 h-4 ${isLibraryLoading ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    {isLibraryLoading ?
                    <div className="py-10 flex items-center justify-center text-slate-500"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading library...</div> :
                    importedVideos.length === 0 && (useWorkspaceScoping ? !globalUsername : usernameFilter === "all") ? // Adjusted empty message logic
                    <div className="py-10 text-slate-500 text-center">No imported videos yet, or no workspace selected.</div> :
                    filteredLibraryVideos.length === 0 ?
                    <div className="py-10 text-slate-500 text-center">No imported videos matching your filter criteria.</div> :
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredLibraryVideos.map((v) =>
                      <div key={v.id} className="rounded-lg border border-slate-200 overflow-hidden bg-white flex flex-col">
                            <TikTokEmbed videoId={v.video_id} url={v.url} coverUrl={v.cover_url} title={v.title} cachedHtml={v.oembed_html} />
                            <div className="p-4 flex-1 flex flex-col gap-2">
                              <div className="font-medium line-clamp-2 text-slate-900">{v.title || "TikTok Video"}</div>
                              <div className="text-xs text-slate-500">{v.author_name ? `by ${v.author_name}` : ""}</div>
                              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                {v.url && <a href={v.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm"><ExternalLink className="w-4 h-4" /> Open</a>}
                                <div className="flex items-center gap-2 ml-auto">
                                  {/* Reassign dropdown only visible for Superadmin and when not using Workspace Scoping */}
                                  {isSuperadmin && !useWorkspaceScoping ?
                              <Select value={v.user_name || "__none__"} onValueChange={(val) => handleReassignUsername(v, val)} disabled={reassigningId === v.id}>
                                      <SelectTrigger className="h-8 w-[150px] bg-white border-slate-300 text-slate-900"><SelectValue placeholder="Assign username" /></SelectTrigger>
                                      <SelectContent className="max-h-60 overflow-y-auto bg-white border-slate-200 text-slate-900">
                                        <SelectItem value="__none__" className="hover:bg-slate-100">Unassigned</SelectItem>
                                        {(availableUsernames || []).map((u) => <SelectItem key={u} value={u} className="hover:bg-slate-100">{u}</SelectItem>)}
                                      </SelectContent>
                                    </Select> :
                              // Show badge if assigned username exists
                              v.user_name && <Badge variant="outline" className="border-slate-200 text-slate-600">{v.user_name}</Badge>
                              }
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => {setVideoToDelete(v);setShowDeleteConfirm(true);}}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete from library</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </div>
                          </div>
                      )}
                      </div>
                    }
                  </div>
                </>
              )
            }
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this TikTok video?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove it from the library. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
