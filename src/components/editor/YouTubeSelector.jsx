import React, { useState, useEffect, useCallback } from "react";
import { YouTubeVideo } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Video, Link as LinkIcon, Edit, Save, X, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { youtubeSearch } from "@/api/functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function YouTubeSelector({ isOpen, onClose, onInsert }) {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);

  // URL Tab State
  const [url, setUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isUrlValid, setIsUrlValid] = useState(false);

  // Editing State
  const [editingVideo, setEditingVideo] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  // YouTube Search Tab State
  const [ytQuery, setYtQuery] = useState("");
  const [ytMax, setYtMax] = useState(10);
  const [ytResults, setYtResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // Assignment for saving searched videos
  const [assignmentUsernames, setAssignmentUsernames] = useState([]);
  const [assignToUsername, setAssignToUsername] = useState("");

  const loadVideos = useCallback(async (user, allowedUsernames) => {
    setIsLoading(true);
    try {
      const allVideos = await YouTubeVideo.list("-created_date");

      let filteredVideos = [];
      // UPDATED: if allowedUsernames provided (assigned list), restrict to those; else allow all
      if (Array.isArray(allowedUsernames) && allowedUsernames.length > 0) {
        const allow = new Set(allowedUsernames);
        filteredVideos = allVideos.filter(video => video.user_name && allow.has(video.user_name));
      } else {
        filteredVideos = allVideos;
      }

      setVideos(filteredVideos);
      // NOTE: do NOT override availableUsernames here; it's computed from Username entity
    } catch (error) {
      console.error("Error loading videos:", error);
      toast.error("Failed to load video library.");
    }
    setIsLoading(false);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const allUsernames = await Username.list("-created_date").catch(() => []);
      const activeUsernames = (allUsernames || []).filter(u => u.is_active !== false && !!u.user_name);
      const activeUsernameSet = new Set(activeUsernames.map(u => u.user_name));

      // UPDATED: show only assigned usernames if present (even for admins/superadmins)
      const assigned = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
      let visibleUsernames = [];
      if (assigned.length > 0) {
        visibleUsernames = assigned.filter(name => activeUsernameSet.has(name)).sort();
      } else {
        // fallback to all active usernames if none assigned
        visibleUsernames = Array.from(activeUsernameSet).sort();
      }

      setAssignmentUsernames(visibleUsernames);
      setAssignToUsername(visibleUsernames[0] || "");
      setAvailableUsernames(visibleUsernames);

      await loadVideos(user, visibleUsernames);
    } catch (error) {
      console.error("Error loading current user:", error);
      toast.error("Failed to load user data.");
    } finally {
      setIsLoading(false);
    }
  }, [loadVideos]);

  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
    } else {
      // Reset state on close
      setUrl("");
      setVideoTitle("");
      setIsUrlValid(false);
      setEditingVideo(null); // Reset editing state on close
      setSelectedUsername("all"); // Reset selected username on close
      setYtQuery(""); // Reset YouTube search query
      setYtResults([]); // Reset YouTube search results
      setIsSearching(false); // Reset YouTube search loading state
      setAssignToUsername(""); // reset assignment selection
      // Reset delete state on close
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    }
  }, [isOpen, loadCurrentUser]);

  const insertVideoHtml = (videoId, title = "YouTube video player") => {
    const videoHtml = `
<div class="youtube-video-container" style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2rem 0;">
  <iframe 
    src="https://www.youtube.com/embed/${videoId}" 
    title="${title}" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    referrerpolicy="strict-origin-when-cross-origin" 
    allowfullscreen
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 8px;"
  ></iframe>
</div>`;
    onInsert(videoHtml);
    onClose();
  };

  const handleInsertFromLibrary = (video) => {
    insertVideoHtml(video.video_id, video.title);
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    setIsUrlValid(!!videoId);
    return videoId;
  };

  useEffect(() => {
    extractVideoId(url);
  }, [url]);

  // Ensure we always save a valid Username.user_name
  const handleEmbedFromUrl = async () => {
    const videoId = extractVideoId(url);
    if (videoId) {
      if (!assignToUsername) {
        toast.error("You must have a username assigned to add videos.");
        return;
      }
      insertVideoHtml(videoId, videoTitle || "YouTube video player");

      // Also save to library so it appears in Video Library
      try {
        const payload = {
          title: videoTitle || "YouTube Video",
          video_id: videoId,
          url: url.trim(),
          user_name: assignToUsername,
        };

        await YouTubeVideo.create(payload);
        if (currentUser) await loadVideos(currentUser, assignmentUsernames);
      } catch (e) {
        console.error("Failed to save YouTube URL to library:", e);
        toast.message("Video embedded. Saving to library failed.", { duration: 3000 });
      }
    } else {
      toast.error("Invalid YouTube URL. Please check and try again.");
    }
  };

  const handleStartEdit = (video) => {
    setEditingVideo(video);
    setEditedTitle(video.title);
    setEditedDescription(video.description || "");
  };

  const handleCancelEdit = () => {
    setEditingVideo(null);
  };

  const handleUpdateAndInsert = async () => {
    if (!editingVideo) return;

    try {
        await YouTubeVideo.update(editingVideo.id, {
            title: editedTitle,
            description: editedDescription,
        });
        toast.success("Video details updated and inserted!");
        // Update the video in the local state immediately
        setVideos((prev) =>
          prev.map((vid) =>
            vid.id === editingVideo.id
              ? { ...vid, title: editedTitle, description: editedDescription }
              : vid
          )
        );
        insertVideoHtml(editingVideo.video_id, editedTitle);
    } catch (error) {
        console.error("Error updating video details:", error);
        toast.error("Failed to update video details. Please try again.");
    }
  };

  const handleDeleteVideo = (video) => {
    setVideoToDelete(video);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setVideoToDelete(null);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    try {
      await YouTubeVideo.delete(videoToDelete.id);
      setVideos((prev) => prev.filter((vid) => vid.id !== videoToDelete.id));
      toast.success("Video deleted");
    } catch (err) {
      console.error("Delete video error:", err);
      toast.error("Failed to delete video");
    } finally {
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    }
  };

  const handleInsertSearchAndSave = async (res) => {
    if (!assignToUsername) {
      toast.error("You must have a username assigned to save videos.");
      return;
    }
    const payload = {
      title: res.title,
      video_id: res.video_id,
      url: res.url,
      thumbnail: res.thumbnail,
      description: res.description,
      user_name: assignToUsername,
    };

    try {
      await YouTubeVideo.create(payload);
      // Refresh library so it appears immediately if the user switches tabs
      if (currentUser) await loadVideos(currentUser, assignmentUsernames);
      toast.success("Saved to library and inserted");
    } catch (e) {
      console.error("Failed to save video to library:", e);
      toast.error("Insert succeeded, but saving to library failed.");
    } finally {
      insertVideoHtml(res.video_id, res.title);
    }
  };

  const handleYouTubeSearch = async () => {
    if (!ytQuery.trim()) {
      toast.info("Please enter a search query.");
      return;
    }
    setIsSearching(true);
    setYtResults([]); // Clear previous results
    try {
      const { data } = await youtubeSearch({ q: ytQuery.trim(), maxResults: ytMax });
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

  const filteredLibraryVideos = videos
    .filter(video =>
      selectedUsername === "all" || video.user_name === selectedUsername
    )
    .filter(video =>
      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Video className="w-5 h-5 text-red-600" />
            Select YouTube Video
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="library" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">From Library</TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">Search YouTube</TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">From URL</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                />
              </div>
              {(availableUsernames.length > 0) && (
                 <div>
                    <Label className="sr-only">Filter by Username</Label>
                    <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                        <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue placeholder="Filter by username..."/>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="all" className="hover:bg-slate-100">
                                All Usernames
                            </SelectItem>
                            {availableUsernames.map(username => (
                                <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading videos...</div>
              ) : filteredLibraryVideos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No videos found for the selected criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLibraryVideos.map((video) => (
                    <div key={video.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 space-y-3">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-32 object-cover rounded"
                      />
                      {editingVideo?.id === video.id ? (
                        <div className="space-y-3">
                          <Input
                            placeholder="Video Title"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                          />
                          <Textarea
                            placeholder="Video Description"
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            rows={3}
                            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="w-full text-slate-700 hover:bg-slate-200"><X className="w-4 h-4"/></Button>
                            <Button onClick={handleUpdateAndInsert} size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"><Save className="w-4 h-4 mr-1"/>Save & Insert</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium line-clamp-2 h-12 text-slate-800">{video.title}</h4>
                          <p className="text-sm text-slate-600 line-clamp-2 h-10">{video.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Username: {video.user_name}</span>
                            <div className="flex gap-1">
                              <Button onClick={() => handleInsertFromLibrary(video)} size="sm" className="bg-red-600 hover:bg-red-700 text-white"><Plus className="w-4 h-4 mr-1"/>Insert</Button>
                              <Button onClick={() => handleStartEdit(video)} size="sm" variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"><Edit className="w-4 h-4 mr-1"/>Edit</Button>
                              <Button onClick={() => handleDeleteVideo(video)} size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-4 h-4"/></Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4 pt-2">
            {/* Assignment selection for saving to library */}
            {assignmentUsernames.length > 0 && (
              <div>
                <Label className="block text-sm font-medium mb-2 text-slate-700">Assign to Username</Label>
                <Select value={assignToUsername} onValueChange={setAssignToUsername}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Select a username..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {assignmentUsernames.map(username => (
                      <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={25}
                  value={ytMax}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 25) setYtMax(val);
                  }}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (isNaN(val) || val < 1 || val > 25) setYtMax(10);
                  }}
                  className="w-24 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  placeholder="Max"
                  title="Max results (1-25)"
                />
                <Button onClick={handleYouTubeSearch} disabled={isSearching} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="text-center py-8 text-slate-500">Searching YouTube...</div>
              ) : ytResults.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No results yet. Try a keyword above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ytResults.map((res) => (
                    <div key={res.video_id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 space-y-3">
                      <img
                        src={res.thumbnail}
                        alt={res.title}
                        className="w-full h-32 object-cover rounded"
                      />
                      <h4 className="font-medium line-clamp-2 h-12 text-slate-800">{res.title}</h4>
                      <p className="text-sm text-slate-600 line-clamp-2 h-10">{res.description}</p>
                      <div className="flex justify-between items-center">
                        <a href={res.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 inline-flex items-center gap-1 hover:underline">
                          <ExternalLink className="w-4 h-4" /> Open
                        </a>
                        <div className="flex gap-2">
                          <Button onClick={() => handleInsertSearchAndSave(res)} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                            <Plus className="w-4 h-4 mr-1" /> Insert
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 pt-4">
             {assignmentUsernames.length > 0 && (
              <div className="mb-4"> {/* Added mb-4 for spacing */}
                <Label className="block text-sm font-medium mb-2 text-slate-700">Assign to Username</Label>
                <Select value={assignToUsername} onValueChange={setAssignToUsername}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Select a username..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {assignmentUsernames.map(username => (
                      <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
             <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">YouTube Video URL</label>
                <Input
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                />
            </div>
            {isUrlValid && (
                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Video Title (Optional)</label>
                    <Input
                        placeholder="Enter a title for the video embed"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                </div>
            )}
             <Button
              onClick={handleEmbedFromUrl}
              disabled={!isUrlValid || !assignToUsername}
              className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Embed Video
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="b44-modal">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Delete this video?</AlertDialogTitle>
           <AlertDialogDescription className="text-slate-600">
             Are you sure you want to delete this video? This action cannot be undone.
           </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} className="text-slate-700 hover:bg-slate-100">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}