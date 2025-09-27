
import React, { useState, useEffect, useCallback } from "react";
import { YouTubeVideo } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { youtubeSearch } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Save, Loader2, Video, Trash2, Plus, RefreshCw, Edit, X } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { Textarea } from "@/components/ui/textarea";

export default function YouTubeManager() {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Changed from false to true to show loading initially
  const [localSelectedUsername, setLocalSelectedUsername] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);

  // YouTube Search State
  const [ytQuery, setYtQuery] = useState("");
  const [ytMax, setYtMax] = useState(4);
  const [ytResults, setYtResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { consumeTokensForFeature } = useTokenConsumption();

  // Assignment for saving searched videos
  const [assignToUsername, setAssignToUsername] = useState("");

  // Editing and Deleting State
  const [editingVideo, setEditingVideo] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [videoToDelete, setVideoToDelete] = useState(null);

  // Workspace integration
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username filter based on workspace scoping
  const selectedUsername = useWorkspaceScoping ? (globalUsername || "all") : localSelectedUsername;

  // Load videos function (Refactored to only fetch videos, no global loading state management)
  const loadVideos = useCallback(async (user, allowedUsernames) => {
    try {
      const allVideos = await YouTubeVideo.list("-created_date");

      let filteredVideos = [];
      if (user?.role === 'admin' || user?.is_superadmin) {
        // Superusers and admins see all videos
        filteredVideos = allVideos;
      } else if (Array.isArray(allowedUsernames) && allowedUsernames.length > 0) {
        const allow = new Set(allowedUsernames);
        filteredVideos = allVideos.filter((video) => video.user_name && allow.has(video.user_name));
      } else {
        // If no allowed usernames and not superuser, show no videos
        filteredVideos = [];
      }

      setVideos(filteredVideos);
    } catch (error) {
      console.error("Error loading videos:", error);
      toast.error("Failed to load video library.");
    }
  }, [setVideos]); // setVideos is a stable reference provided by React

  // Load initial data (User, Usernames, and then Videos)
  // This function now centralizes the overall `isLoading` state management.
  const loadInitialData = useCallback(async () => {
    // Set loading true for the entire component.
    setIsLoading(true);

    try {
      const user = await User.me();
      setCurrentUser(user);

      const allUsernameEntities = await Username.list("-created_date").catch(() => []);
      const activeUsernames = (allUsernameEntities || [])
        .filter((u) => u.is_active !== false && !!u.user_name)
        .map((u) => u.user_name);
      
      const visibleUsernamesForAssignmentAndFilter = Array.from(new Set(activeUsernames)).sort(); // Ensure uniqueness and sort
      
      setAvailableUsernames(visibleUsernamesForAssignmentAndFilter);
      
      // Set assignToUsername based on workspace scoping or the first available username
      let newAssignToUsername = "";
      if (useWorkspaceScoping) {
        newAssignToUsername = globalUsername || "";
      } else {
        if (visibleUsernamesForAssignmentAndFilter.length > 0) {
          // If current assignToUsername is not valid, default to first available
          // We read `assignToUsername` from the closure here
          if (!assignToUsername || !visibleUsernamesForAssignmentAndFilter.includes(assignToUsername)) {
            newAssignToUsername = visibleUsernamesForAssignmentAndFilter[0];
          } else {
            newAssignToUsername = assignToUsername; // Keep existing if valid
          }
        } else {
          newAssignToUsername = "";
        }
      }
      // Only update state if the value actually changes to prevent unnecessary re-renders
      if (assignToUsername !== newAssignToUsername) {
        setAssignToUsername(newAssignToUsername);
      }

      // If localSelectedUsername is no longer valid, reset it to "all"
      // We read `localSelectedUsername` from the closure here
      if (!useWorkspaceScoping && localSelectedUsername !== "all" && !visibleUsernamesForAssignmentAndFilter.includes(localSelectedUsername)) {
        setLocalSelectedUsername("all");
      }
      
      await loadVideos(user, visibleUsernamesForAssignmentAndFilter);

    } catch (error) {
      console.error("Error loading current user and usernames:", error);
      toast.error("Failed to load user data or usernames.");
    } finally {
      setIsLoading(false); // Also set loading false on error
    }
  }, [
    loadVideos, // Stable useCallback
    useWorkspaceScoping, // External dependency
    globalUsername, // External dependency
    assignToUsername, // Read by the function for its logic, causes re-creation if value changes
    localSelectedUsername, // Read by the function for its logic, causes re-creation if value changes
    setCurrentUser, // Stable setter
    setAvailableUsernames, // Stable setter
    setAssignToUsername, // Stable setter
    setLocalSelectedUsername // Stable setter
  ]);

  // Effect to trigger the initial data load
  // This effect runs on mount and whenever the `loadInitialData` function itself changes.
  // The `loadInitialData` function changes when its own dependencies (like `useWorkspaceScoping`, `globalUsername`, `assignToUsername`, `localSelectedUsername`) change.
  // The conditional updates inside `loadInitialData` for `assignToUsername` and `localSelectedUsername` help prevent an infinite loop.
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Sync assignToUsername with workspace selection when feature is on
  // This useEffect ensures assignToUsername is updated if workspace changes, but doesn't trigger a full data re-load
  useEffect(() => {
    if (useWorkspaceScoping && globalUsername !== assignToUsername) {
      setAssignToUsername(globalUsername || "");
    }
  }, [useWorkspaceScoping, globalUsername, assignToUsername, setAssignToUsername]);


  const handleYouTubeSearch = async () => {
    if (!ytQuery.trim()) {
      toast.info("Please enter a search query.");
      return;
    }
    // Check assignToUsername only if useWorkspaceScoping is off or globalUsername is not set
    const activeAssignToUsername = useWorkspaceScoping ? globalUsername : assignToUsername;
    if (!activeAssignToUsername) {
      toast.error("Please select a username to assign videos to before searching.");
      return;
    }

    setIsSearching(true);
    setYtResults([]);
    try {
      const tokenResult = await consumeTokensForFeature('ai_youtube');
      if (!tokenResult.success) {
        setIsSearching(false);
        return;
      }
      // Ensure ytMax is within 1-25 range for search API
      const safeYtMax = Math.max(1, Math.min(25, Number(ytMax))); 
      const { data } = await youtubeSearch({ q: ytQuery.trim(), maxResults: safeYtMax });
      setYtResults(data?.results || []);
      if ((data?.results || []).length === 0) {
        toast.info("No YouTube videos found for your search query.");
      }
    } catch (e) {
      console.error("YouTube search error:", e);
      toast.error("Failed to perform YouTube search. Please try again.");
    }
    setIsSearching(false);
  };

  const handleInsertAndSave = async (video) => { // Renamed from handleSaveFromSearch
    const activeAssignToUsername = useWorkspaceScoping ? globalUsername : assignToUsername;
    if (!activeAssignToUsername) {
      toast.error("You must have a username assigned to save videos.");
      return;
    }

    try {
      const payload = {
        title: video.title,
        video_id: video.video_id,
        url: video.url,
        thumbnail: video.thumbnail,
        description: video.description,
        user_name: activeAssignToUsername
      };

      await YouTubeVideo.create(payload);
      toast.success(`Video saved to library under ${activeAssignToUsername}!`);
      // Refresh the entire video list to reflect the new save
      if (currentUser && availableUsernames.length > 0) {
        await loadVideos(currentUser, availableUsernames);
      } else {
        // Fallback or re-evaluate. If `currentUser` or `availableUsernames` aren't set,
        // it means initial load hasn't completed or failed. Re-trigger full initial data load.
        loadInitialData(); 
      }
    } catch (e) {
      console.error("Failed to save video to library:", e);
      toast.error("Failed to save video to library.");
    }
  };

  const handleDeleteVideo = (video) => { // Renamed from handleDelete
    setVideoToDelete(video);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    try {
      await YouTubeVideo.delete(videoToDelete.id);
      toast.success("Video deleted");
      if (currentUser && availableUsernames.length > 0) {
        await loadVideos(currentUser, availableUsernames);
      } else {
        loadInitialData();
      }
    } catch (err) {
      console.error("Delete video error:", err);
      toast.error("Failed to delete video");
    } finally {
      setVideoToDelete(null);
    }
  };

  const handleStartEdit = (video) => { // Renamed from handleEdit
    setEditingVideo(video);
    setEditedTitle(video.title);
    setEditedDescription(video.description || "");
  };

  const handleUpdateVideo = async () => { // Renamed from handleUpdate
    if (!editingVideo) return;
    try {
      await YouTubeVideo.update(editingVideo.id, { title: editedTitle, description: editedDescription });
      toast.success("Video updated!");
      if (currentUser && availableUsernames.length > 0) {
        await loadVideos(currentUser, availableUsernames);
      } else {
        loadInitialData();
      }
    } catch (err) {
      console.error("Edit video error:", err);
      toast.error("Failed to update video.");
    } finally {
      setEditingVideo(null);
      setEditedTitle("");
      setEditedDescription("");
    }
  };

  const filteredLibraryVideos = videos.filter(video => { // Renamed from filteredVideos
    const matchesSearch = searchTerm === "" ||
      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUsername = selectedUsername === "all" || video.user_name === selectedUsername;

    return matchesSearch && matchesUsername;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">YT</span>
              </div>
              YouTube Video Library
            </h1>
            <p className="text-slate-600 mt-1">Manage your saved YouTube videos</p>
          </div>
        </div>

        {/* Search YouTube Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Search YouTube</h2>

          {/* Assignment Username Selection (Conditionally rendered) */}
          {!useWorkspaceScoping && availableUsernames.length > 0 ? (
            <div className="mb-4">
              <Label htmlFor="assign-to-username" className="block text-sm font-medium mb-2 text-slate-700">Assign to Username</Label>
              <Select value={assignToUsername} onValueChange={setAssignToUsername}>
                <SelectTrigger id="assign-to-username" className="w-full md:w-64 bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="Select a username..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {availableUsernames.map((username) => (
                    <SelectItem key={username} value={username} className="hover:bg-slate-100">
                      {username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            !useWorkspaceScoping && (
              <p className="text-sm text-red-500 mb-4">You are not assigned to any usernames. Please contact support to get access to save videos.</p>
            )
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search YouTube (e.g., dog training tips)"
                value={ytQuery}
                onChange={(e) => setYtQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleYouTubeSearch()}
                className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div>
              <Input
                type="number"
                min={1}
                max={25} // Max value updated per outline
                value={ytMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 25) setYtMax(val);
                }}
                onBlur={(e) => { // Enforce bounds on blur
                  const val = Number(e.target.value);
                  if (isNaN(val) || val < 1 || val > 25) setYtMax(4); // Reset to default if out of bounds
                }}
                className="bg-white border-slate-300 text-slate-900"
                placeholder="Max results (1-25)"
                title="Max results (1-25)"
              />
            </div>
            <Button
              onClick={handleYouTubeSearch}
              disabled={isSearching || (!useWorkspaceScoping && !assignToUsername)} // Disable if no username for local mode
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </div>

          {/* Search Results */}
          <div className="min-h-[200px]">
            {isSearching ? (
              <div className="py-16 flex items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Searching YouTube...
              </div>
            ) : ytResults.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Search for YouTube videos to add to your library.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ytResults.map((video) => (
                  <div key={video.video_id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 space-y-3 bg-white">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-32 object-cover rounded"
                    />
                    <h4 className="font-medium line-clamp-2 h-12 text-slate-800">{video.title}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2 h-10">{video.description}</p>
                    <div className="flex items-center justify-between">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-red-600 inline-flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                      <Button
                        onClick={() => handleInsertAndSave(video)} // Updated function name
                        size="sm"
                        disabled={(!useWorkspaceScoping && !assignToUsername) || (useWorkspaceScoping && !globalUsername)} // Disable if no username is selected (local or global)
                        className={`bg-indigo-600 hover:bg-indigo-700 text-white`}
                        title={(!useWorkspaceScoping && !assignToUsername) || (useWorkspaceScoping && !globalUsername) ? "Select a username to save" : "Save to Library"}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video Library Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-wrap items-end justify-between gap-y-4 mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Video Library <Badge variant="outline" className="ml-2 border-slate-200 text-slate-600">{filteredLibraryVideos.length}</Badge></h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label htmlFor="search-videos" className="sr-only">Search Videos</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="search-videos"
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  />
                </div>
              </div>
              {!useWorkspaceScoping && availableUsernames.length > 0 && ( // Conditionally rendered
                <div>
                  <Label htmlFor="username-filter" className="sr-only">Filter by Username</Label>
                  <Select value={localSelectedUsername} onValueChange={setLocalSelectedUsername}> {/* Use localSelectedUsername */}
                    <SelectTrigger id="username-filter" className="w-48 bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="Filter by username" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="all" className="hover:bg-slate-100">All Usernames</SelectItem>
                      {availableUsernames.map((name) => (
                        <SelectItem key={name} value={name} className="hover:bg-slate-100">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="block opacity-0 select-none">Refresh</Label> {/* Invisible label for alignment */}
                <Button
                  onClick={loadInitialData} // Updated to call the combined loader
                  disabled={isLoading}
                  variant="outline"
                  className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Refresh video list"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Video Library Content */}
          {isLoading ? ( // Local loading indicator for the library section
            <div className="py-10 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading video library...</p>
            </div>
          ) : filteredLibraryVideos.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No videos found{searchTerm || selectedUsername !== "all" ? " for the current filters" : " in your library"}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLibraryVideos.map((video) => (
                <div key={video.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-40 object-cover rounded mb-3"
                  />
                  {editingVideo?.id === video.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="bg-white border-slate-300 text-slate-900"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateVideo();
                            if (e.key === 'Escape') { setEditingVideo(null); setEditedTitle(""); setEditedDescription(""); }
                        }}
                      />
                      <Textarea // New Textarea for description
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        placeholder="Video Description"
                        rows={3}
                        className="bg-white border-slate-300 text-slate-900"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdateVideo(); } // Save on Enter, new line on Shift+Enter
                          if (e.key === 'Escape') { setEditingVideo(null); setEditedTitle(""); setEditedDescription(""); }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateVideo} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          <Save className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button onClick={() => { setEditingVideo(null); setEditedTitle(""); setEditedDescription(""); }} variant="outline" size="sm" className="flex-1 bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                          <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-medium text-slate-900 line-clamp-2 h-12">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 h-10">{video.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 my-2">
                        <span>Username: {video.user_name}</span>
                        <span>{new Date(video.created_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-600 hover:text-red-700 inline-flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" /> Open
                        </a>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStartEdit(video)} // Updated function name
                            size="sm"
                            variant="outline"
                            className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 p-2 h-auto"
                            title="Edit Video"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteVideo(video)} // Updated function name
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white p-2 h-auto"
                            title="Delete Video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{videoToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVideoToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
