
import React, { useEffect, useState } from "react";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { YouTubeVideo } from "@/api/entities";
import { youtubeSearch } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Save, Loader2, Video, FolderOpen, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function getSafe(obj, paths, fallback = "") {
  for (const p of paths) {
    try {
      const val = p.split(".").reduce((acc, k) => acc ? acc[k] : undefined, obj);
      if (val !== undefined && val !== null && val !== "") return val;
    } catch {}
  }
  return fallback;
}

function normalizeResult(item) {
  // Try common shapes from YT APIs/search wrappers
  const videoId = getSafe(item, ["videoId", "id", "id.videoId", "video_id"], "");
  const url =
  getSafe(item, ["url", "link"], "") || (
  videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");
  const title = getSafe(item, ["title", "snippet.title"], "YouTube Video");
  const channel = getSafe(item, ["channelTitle", "channel", "snippet.channelTitle"], "");
  const duration = getSafe(item, ["duration", "contentDetails.duration"], "");
  const thumbnail =
  getSafe(item, ["thumbnail", "thumbnails.high.url", "thumbnails.medium.url", "thumbnails.default.url"], "");

  return { id: videoId || url, videoId, url, title, channel, duration, thumbnail };
}

export default function YoutubeAIGenerator() {
  const [currentUser, setCurrentUser] = useState(null);
  const [usernames, setUsernames] = useState([]);
  const [assignToUsername, setAssignToUsername] = useState("");
  const [q, setQ] = useState("");
  const [maxResults, setMaxResults] = useState(12);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [reassigningId, setReassigningId] = useState(null); // username change spinner
  // NEW: delete dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        setCurrentUser(me);

        const all = await Username.list("-created_date").catch(() => []);
        const active = (all || []).filter((u) => u.is_active !== false).map((u) => u.user_name);
        // Determine if the current user is a superadmin
        const isSuper = me?.role === "admin" || me?.access_level === "full";
        let names = [];
        if (isSuper) {
          names = active;
        } else {
          const assigned = Array.isArray(me?.assigned_usernames) ? me.assigned_usernames : [];
          const activeSet = new Set(active);
          names = assigned.filter((n) => activeSet.has(n));
        }
        names = Array.from(new Set(names)).sort();
        setUsernames(names);
        setAssignToUsername(names[0] || "");
      } catch {
        setUsernames([]);
        setAssignToUsername("");
      }
    })();
  }, []);

  // Superadmin check
  const isSuperadmin = !!currentUser && (currentUser.role === "admin" || currentUser.access_level === "full");


  // Load saved videos for the selected username
  const loadLibrary = async (uname) => {
    if (!uname) {
      setLibrary([]);
      return;
    }
    setLibraryLoading(true);
    try {
      const items = await YouTubeVideo.filter({ user_name: uname }, "-updated_date", 60);
      setLibrary(items || []);
    } finally {
      setLibraryLoading(false);
    }
  };

  // refresh library whenever brand selection changes
  useEffect(() => {
    loadLibrary(assignToUsername);
  }, [assignToUsername]);

  const handleSearch = async () => {
    const term = q.trim();
    if (!term) {
      toast.message("Enter a search query for YouTube videos.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const { data } = await youtubeSearch({ q: term, maxResults });
      const items = Array.isArray(data?.results) ? data.results : [];
      const normalized = items.map(normalizeResult).filter((r) => r.url);
      if (normalized.length === 0) {
        toast.message("No YouTube results found for your query.");
      }
      setResults(normalized);
    } catch (e) {
      console.error("youtubeSearch error:", e);
      setError("Failed to fetch results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item) => {
    if (!assignToUsername) {
      toast.error("Please select a username before saving.");
      return;
    }
    setSavingId(item.id);
    try {
      await YouTubeVideo.create({
        title: item.title || "YouTube Video",
        video_id: item.videoId || "",
        url: item.url || "",
        thumbnail: item.thumbnail || "",
        description: "", // optional; not always available in search
        duration: item.duration || "",
        category: "",
        alt_text: item.title || "YouTube thumbnail",
        user_name: assignToUsername
      });
      toast.success("Saved to library.");
      // refresh library after save
      loadLibrary(assignToUsername);
    } catch (e) {
      console.error("Save YouTube error:", e);
      toast.error("Could not save this video.");
    } finally {
      setSavingId(null);
    }
  };

  const handleReassignUsername = async (video, val) => {
    if (!isSuperadmin) {
      toast.error("Only superadmins can reassign usernames.");
      return;
    }
    const newUser = val === "__none__" ? null : val;
    setReassigningId(video.id);
    try {
      await YouTubeVideo.update(video.id, { user_name: newUser || undefined });
      setLibrary((prev) => prev.map((v) => v.id === video.id ? { ...v, user_name: newUser || "" } : v));
      toast.success("Username reassigned successfully.");
    } catch (e) {
      console.error("Reassign username error:", e);
      toast.error("Could not reassign username.");
    } finally {
      setReassigningId(null);
    }
  };

  // NEW: delete handlers
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
      setLibrary((prev) => prev.filter((v) => v.id !== videoToDelete.id));
      toast.success("YouTube video deleted.");
    } catch (e) {
      console.error("Delete YouTube video error:", e);
      toast.error("Failed to delete YouTube video.");
    } finally {
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Video className="w-5 h-5 text-slate-700" />
              YouTube AI
              <Badge variant="outline" className="ml-2 border-slate-200 text-slate-600">Search & Save</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_220px] gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search YouTube (e.g., best email outreach tips)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

              </div>
              <Input
                type="number"
                min={1}
                max={25}
                value={maxResults}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isNaN(n)) setMaxResults(Math.min(25, Math.max(1, n)));
                }}
                className="w-24 bg-white border-slate-300 text-slate-900"
                title="Max results (1-25)" />

              <div className="flex gap-2">
                <Select value={assignToUsername} onValueChange={setAssignToUsername}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Assign to username" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {usernames.length === 0 ?
                    <SelectItem value={null} disabled>No usernames</SelectItem> :

                    usernames.map((u) =>
                    <SelectItem key={u} value={u} className="hover:bg-slate-100">
                          {u}
                        </SelectItem>
                    )
                    }
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap">

                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching…</> : <><Search className="w-4 h-4 mr-2" /> Search</>}
                </Button>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {/* Results */}
            <div className="min-h-[120px]">
              {loading ?
              <div className="py-16 flex items-center justify-center text-slate-500">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading results…
                </div> :
              results.length === 0 ?
              <div className="py-16 text-center text-slate-500">
                  Start by searching for a topic to see YouTube results here.
                </div> :

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.map((item) =>
                <div key={item.id} className="rounded-lg border border-slate-200 overflow-hidden bg-white flex flex-col">
                      <div className="aspect-video bg-slate-100 overflow-hidden">
                        {item.thumbnail ?
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" /> :

                    <div className="w-full h-full grid place-items-center text-slate-400">No thumbnail</div>
                    }
                      </div>
                      <div className="p-4 flex-1 flex flex-col gap-2">
                        <div className="font-medium line-clamp-2 text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          {item.channel && <span>{item.channel}</span>}
                          {item.duration && <span className="text-slate-400">• {item.duration}</span>}
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          {item.url &&
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm">

                              <ExternalLink className="w-4 h-4" /> Open
                            </a>
                      }
                          <Button
                        size="sm"
                        onClick={() => handleSave(item)}
                        disabled={!assignToUsername || savingId === item.id}
                        className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                        title={!assignToUsername ? "Select a username to enable saving" : "Save to Library"}>

                            {savingId === item.id ?
                        <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> :

                        <><Save className="w-4 h-4 mr-1" /> Save</>
                        }
                          </Button>
                        </div>
                      </div>
                    </div>
                )}
                </div>
              }
            </div>

            {/* Imported Library */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-slate-600" />
                  <h3 className="text-slate-900 font-semibold">
                    Imported Videos {assignToUsername ? `· ${assignToUsername}` : ""}
                  </h3>
                  <Badge variant="outline" className="ml-1 border-slate-200 text-slate-600">
                    {library.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={libraryQuery}
                    onChange={(e) => setLibraryQuery(e.target.value)}
                    placeholder="Filter imported…"
                    className="h-9 w-[220px] bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

                  <Button
                    onClick={() => loadLibrary(assignToUsername)}
                    disabled={libraryLoading}
                    variant="outline" className="bg-background text-slate-200 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 border-slate-300 hover:bg-slate-50">


                    <RefreshCw className={`w-4 h-4 mr-2 ${libraryLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {assignToUsername ?
              libraryLoading ?
              <div className="py-10 flex items-center justify-center text-slate-500">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading library…
                  </div> :
              library.length === 0 ?
              <div className="py-10 text-slate-500 text-center">
                    No imported videos yet for this brand.
                  </div> :

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {library.
                filter((v) => {
                  const q = libraryQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (v.title || "").toLowerCase().includes(q) ||
                    (v.url || "").toLowerCase().includes(q) ||
                    (v.description || "").toLowerCase().includes(q));

                }).
                map((v) =>
                <div key={v.id} className="rounded-lg border border-slate-200 overflow-hidden bg-white flex flex-col">
                          <div className="aspect-video bg-slate-100 overflow-hidden">
                            {v.thumbnail ?
                    <img src={v.thumbnail} alt={v.alt_text || v.title} className="w-full h-full object-cover" /> :

                    <div className="w-full h-full grid place-items-center text-slate-400">No thumbnail</div>
                    }
                          </div>
                          <div className="p-4 flex-1 flex flex-col gap-2">
                            <div className="font-medium line-clamp-2 text-slate-900">{v.title || "YouTube Video"}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              {v.duration && <span className="text-slate-400">{v.duration}</span>}
                            </div>
                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                              {v.url &&
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm">

                                  <ExternalLink className="w-4 h-4" /> Open
                                </a>
                      }
                              <div className="flex items-center gap-2 ml-auto">
                                {isSuperadmin ? (
                                  <>
                                    <Select
                                      value={v.user_name || "__none__"}
                                      onValueChange={(val) => handleReassignUsername(v, val)}
                                      disabled={reassigningId === v.id}
                                    >
                                      <SelectTrigger className="h-8 w-[150px] bg-white border-slate-300 text-slate-900">
                                        <SelectValue placeholder="Assign username" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        <SelectItem value="__none__" className="hover:bg-slate-100">Unassigned</SelectItem>
                                        {usernames.map((u) => (
                                          <SelectItem key={u} value={u} className="hover:bg-slate-100">{u}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {reassigningId === v.id && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                                  </>
                                ) : (
                                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                                    {v.user_name || "Unassigned"}
                                  </Badge>
                                )}
                                {/* NEW: delete button */}
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDeleteVideo(v)}
                                      >
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
                  </div> :


              <div className="py-10 text-slate-500 text-center">
                  Select a brand to view its imported videos.
                </div>
              }
            </div>
          </CardContent>
        </Card>
      </div>
      {/* NEW: Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this YouTube video?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove it from the library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}
