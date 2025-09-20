
import React, { useState, useEffect } from "react";
import { TikTokVideo } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Link as LinkIcon, Edit, Save, X, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { tiktokSearch } from "@/api/functions";
import { getTikTokOembed } from "@/api/functions";
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

const TikTokIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-black bg-white rounded-full p-0.5">
      <path d="M16 8.5c-2.43 0-4.63.85-6.32 2.34-.3.26-.6.54-.88.84a3.5 3.5 0 0 1-4.8-4.8l1.64 1.64c.22-.22.45-.42.7-.62C8.38 5.76 11.23 4 14.5 4v5c-1.38 0-2.7.4-3.88 1.15a3.5 3.5 0 0 0-1.22 5.35A3.5 3.5 0 0 0 14.5 14v5a10.5 10.5 0 0 1-10-10.5c0-1.8.46-3.5 1.28-5.02"/>
    </svg>
);


export default function TikTokSelector({ isOpen, onClose, onInsert }) {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);

  const [url, setUrl] = useState("");
  const [parsedUrlData, setParsedUrlData] = useState(null);

  const [editingVideo, setEditingVideo] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  const [ytQuery, setYtQuery, ] = useState("");
  const [ytResults, setYtResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [assignmentUsernames, setAssignmentUsernames] = useState([]);
  const [assignToUsername, setAssignToUsername] = useState("");

  const loadVideos = React.useCallback(async (user) => {
    setIsLoading(true);
    try {
      const allVideos = await TikTokVideo.list("-created_date");
      let filteredVideos = [];
      let usernames = [];

      if (user.role === 'admin') {
        filteredVideos = allVideos;
        usernames = [...new Set(allVideos.map(vid => vid.user_name).filter(Boolean))];
      } else if (user.assigned_usernames && user.assigned_usernames.length > 0) {
        filteredVideos = allVideos.filter(video =>
          video.user_name && user.assigned_usernames.includes(video.user_name)
        );
        usernames = user.assigned_usernames;
      }

      setVideos(filteredVideos);
      setAvailableUsernames(usernames);
    } catch (error) {
      console.error("Error loading TikTok videos:", error);
      toast.error("Failed to load TikTok library.");
    }
    setIsLoading(false);
  }, []); // Dependencies: State setters (setVideos, setAvailableUsernames) are stable. TikTokVideo.list is stable.

  const loadCurrentUser = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      let availableForAssignment = [];
      if (user.role === 'admin') {
        const allUsers = await User.list();
        const allUsernames = new Set();
        allUsers.forEach(u => {
          if (Array.isArray(u.assigned_usernames)) {
            u.assigned_usernames.forEach(name => allUsernames.add(name));
          }
        });
        availableForAssignment = Array.from(allUsernames).sort();
      } else {
        availableForAssignment = user.assigned_usernames || [];
      }
      setAssignmentUsernames(availableForAssignment);
      setAssignToUsername(availableForAssignment[0] || "");
      await loadVideos(user);
    } catch (error) {
      console.error("Error loading current user:", error);
      toast.error("Failed to load user data.");
    } finally {
      setIsLoading(false);
    }
  }, [loadVideos]); // Dependencies: loadVideos

  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
    } else {
      setUrl("");
      setParsedUrlData(null);
      setEditingVideo(null);
      setSelectedUsername("all");
      setYtQuery("");
      setYtResults([]);
      setIsSearching(false);
      setAssignToUsername("");
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    }
  }, [isOpen, loadCurrentUser]); // Dependencies: isOpen, loadCurrentUser

  useEffect(() => {
    const data = extractVideoDataFromUrl(url);
    setParsedUrlData(data);
  }, [url]);

  const extractVideoDataFromUrl = (tiktokUrl) => {
    if (!tiktokUrl) return null;
    const match = tiktokUrl.match(/tiktok\.com\/@([^\/]+)\/video\/(\d+)/);
    if (match && match[1] && match[2]) {
      return { authorName: match[1], videoId: match[2] };
    }
    return null;
  };

  // Use TikTok oEmbed HTML exactly as returned, and ensure our preview executes scripts
  const insertTikTokHtml = async (videoUrl, title) => {
    if (!videoUrl) {
      toast.error("Video URL is missing.");
      return;
    }
    try {
      const { data } = await getTikTokOembed({ url: videoUrl });
      if (!data?.success || !data?.html) throw new Error("TikTok oEmbed failed");
      onInsert(data.html); // Insert the raw oEmbed HTML (blockquote + script)
      onClose();
    } catch (error) {
      console.error("TikTok oEmbed insert error:", error);
      toast.error("Could not embed TikTok video. Please try another URL.");
    }
  };
  
  const handleInsertFromLibrary = (video) => {
    if (video.url) {
      insertTikTokHtml(video.url, video.title);
    } else {
        toast.error("Video data is incomplete and cannot be inserted.");
    }
  };
  
  const handleEmbedFromUrl = async () => {
    if (!url) {
      toast.error("Invalid TikTok URL. Please check and try again.");
      return;
    }
    await insertTikTokHtml(url);
    // Also save to library so it appears in Video Library
    try {
      const parsed = extractVideoDataFromUrl(url) || {};
      let userNameToSave = assignToUsername;
      if (!userNameToSave && currentUser) {
        if (Array.isArray(currentUser.assigned_usernames) && currentUser.assigned_usernames.length > 0) {
          userNameToSave = currentUser.assigned_usernames[0];
        }
      }

      const payload = {
        title: parsed.authorName ? `TikTok by @${parsed.authorName}` : "TikTok Video",
        video_id: parsed.videoId || undefined,
        url: url.trim(),
        author_name: parsed.authorName || undefined
      };
      if (userNameToSave) payload.user_name = userNameToSave;

      await TikTokVideo.create(payload);
      // If saved successfully and we are on the library tab, refresh videos
      if (currentUser) {
        await loadVideos(currentUser); // Refresh library after saving
        toast.success("Video embedded and saved to library!");
      } else {
        toast.success("Video embedded!");
      }
    } catch (e) {
      console.error("Failed to save TikTok URL to library:", e);
      toast.message("Video embedded. Saving to library failed.", { duration: 3000 });
    }
  };

  const handleStartEdit = (video) => {
    setEditingVideo(video);
    setEditedTitle(video.title);
  };

  const handleCancelEdit = () => {
    setEditingVideo(null);
  };

  const handleUpdateAndInsert = async () => {
    if (!editingVideo) return;
    try {
        await TikTokVideo.update(editingVideo.id, { title: editedTitle });
        setVideos(prev => prev.map(vid => vid.id === editingVideo.id ? { ...vid, title: editedTitle } : vid));
        // Use the video URL from the library item for the oEmbed call
        await insertTikTokHtml(editingVideo.url, editedTitle);
        toast.success("Video details updated and inserted!");
    } catch (error) {
        toast.error("Failed to update or insert video.");
    }
  };

  const handleDeleteVideo = (video) => {
    setVideoToDelete(video);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    try {
      await TikTokVideo.delete(videoToDelete.id);
      setVideos((prev) => prev.filter((vid) => vid.id !== videoToDelete.id));
      toast.success("Video deleted");
    } catch (err) {
      toast.error("Failed to delete video");
    } finally {
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    }
  };

  const handleInsertSearchAndSave = async (res) => {
    const payload = {
      title: res.title,
      video_id: res.video_id,
      url: res.web_video_url,
      cover_url: res.cover_url,
      author_name: res.author_name,
    };
    if (assignToUsername) payload.user_name = assignToUsername;

    let savedSuccessfully = false;
    try {
      await TikTokVideo.create(payload);
      savedSuccessfully = true;
      if (currentUser) await loadVideos(currentUser); // Refresh library after saving
    } catch (e) {
      console.error("Failed to save TikTok to library:", e);
    }
    
    // Use the web_video_url from the search result for the oEmbed call
    await insertTikTokHtml(res.web_video_url, res.title);

    if (savedSuccessfully) {
        toast.success("Saved to library and inserted!");
    } else {
        toast.warning("Video inserted, but failed to save to library.");
    }
  };

  const handleTikTokSearch = async () => {
    if (!ytQuery.trim()) return;
    setIsSearching(true);
    setYtResults([]);
    try {
      const { data } = await tiktokSearch({ q: ytQuery.trim() });
      setYtResults(data?.results || []);
    } catch (e) {
      toast.error("TikTok search failed: " + e.message);
    }
    setIsSearching(false);
  };

  const filteredLibraryVideos = videos
    .filter(video => selectedUsername === "all" || video.user_name === selectedUsername)
    .filter(video => video.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <TikTokIcon />
            Select TikTok Video
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="library" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">From Library</TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">Search TikTok</TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">From URL</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Search titles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
                </div>
                {(availableUsernames.length > 0 || currentUser?.role === 'admin') && (
                  <div>
                    <Label className="sr-only">Filter by Username</Label>
                    <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                        <SelectTrigger className="bg-white border-slate-300 text-slate-900"><SelectValue/></SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="all" className="hover:bg-slate-100">{currentUser?.role === 'admin' ? 'All Users' : 'All Assigned'}</SelectItem>
                            {availableUsernames.map(username => <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
              )}
             </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? <div className="text-center py-8 text-slate-500">Loading...</div>
              : filteredLibraryVideos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No videos found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLibraryVideos.map((video) => (
                    <div key={video.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 space-y-3">
                      <img src={video.cover_url} alt={video.title} className="w-full h-40 object-cover rounded" />
                      {editingVideo?.id === video.id ? (
                        <div className="space-y-3">
                          <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
                          <div className="flex gap-2">
                            <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="w-full text-slate-700 hover:bg-slate-200"><X className="w-4 h-4"/></Button>
                            <Button onClick={handleUpdateAndInsert} size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"><Save className="w-4 h-4 mr-1"/>Save & Insert</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium line-clamp-2 h-12 text-slate-800">{video.title}</h4>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">By: {video.author_name}</span>
                            <div className="flex gap-1">
                              <Button onClick={() => handleInsertFromLibrary(video)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-1"/>Insert</Button>
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
            {assignmentUsernames.length > 0 && (
              <div>
                <Label className="block text-sm font-medium mb-2 text-slate-700">Assign to Username when saving</Label>
                <Select value={assignToUsername} onValueChange={setAssignToUsername}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {assignmentUsernames.map(username => <SelectItem key={username} value={username} className="hover:bg-slate-100">{username}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
                <Input placeholder="Search TikTok..." value={ytQuery} onChange={(e) => setYtQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTikTokSearch()} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
                <Button onClick={handleTikTokSearch} disabled={isSearching} className="bg-indigo-600 hover:bg-indigo-700 text-white">{isSearching ? 'Searching...' : 'Search'}</Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isSearching ? <div className="text-center py-8 text-slate-500">Searching...</div>
              : ytResults.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Search for TikTok videos above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ytResults.map((res) => (
                    <div key={res.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 space-y-3">
                      <img src={res.cover_url} alt={res.title} className="w-full h-40 object-cover rounded" />
                      <h4 className="font-medium line-clamp-2 h-12 text-slate-800">{res.title}</h4>
                      <div className="flex justify-between items-center">
                        <a href={res.web_video_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 inline-flex items-center gap-1 hover:underline">
                          <ExternalLink className="w-4 h-4" /> By: {res.author_name}
                        </a>
                        <Button onClick={() => handleInsertSearchAndSave(res)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-1"/> Insert & Save</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 pt-4">
             <div>
                <Label className="block text-sm font-medium mb-2 text-slate-700">TikTok Video URL</Label>
                <Input placeholder="https://www.tiktok.com/@username/video/123..." value={url} onChange={(e) => setUrl(e.target.value)} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
            </div>
            <Button onClick={handleEmbedFromUrl} disabled={!parsedUrlData && !url} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <LinkIcon className="w-4 h-4 mr-2" />
              Embed Video
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent className="b44-modal">
        <AlertDialogHeader><AlertDialogTitle className="text-slate-900">Delete this video?</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogDescription className="text-slate-600">This action cannot be undone.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)} className="text-slate-700 hover:bg-slate-100">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
