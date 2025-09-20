
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { TikTokVideo } from "@/api/entities";
import { tiktokSearch } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Save, Loader2, Video, Trash2 } from "lucide-react";
import { FolderOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import TikTokEmbed from "@/components/embed/TikTokEmbed";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TiktokAIGenerator() {
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
  const [reassigningId, setReassigningId] = useState(null);
  // NEW: delete dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        setCurrentUser(me);

        // Determine visible usernames based on assignments (or all if admin/full access)
        const all = await Username.list("-created_date").catch(() => []);
        const active = (all || []).filter((u) => u.is_active !== false).map((u) => u.user_name);
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
  const isSuperadmin = !!currentUser?.is_superadmin;

  // Cache helper: fetch and persist oEmbed for uncached items
  const hydrateOembedCache = useCallback(async (items) => {
    const uncached = items.filter((v) => !v.oembed_html && v.url);
    for (const v of uncached) {
      try {
        const { data } = await getTikTokOembed({ url: v.url });
        const html = data?.html || "";
        if (html) {
          // Sanitize width/height to numbers only
          const rawW = (data?.meta?.width);
          const rawH = (data?.meta?.height);
          const wNum = Number(rawW);
          const hNum = Number(rawH);
          const meta = {
            title: data?.meta?.title,
            author_name: data?.meta?.author_name,
            author_url: data?.meta?.author_url,
            provider: data?.meta?.provider,
            thumbnail_url: data?.meta?.thumbnail_url,
            ...(Number.isFinite(wNum) ? { width: wNum } : {}),
            ...(Number.isFinite(hNum) ? { height: hNum } : {}),
          };

          await TikTokVideo.update(v.id, {
            oembed_html: html,
            oembed_cached_at: new Date().toISOString(),
            oembed_meta: meta
          });
          // Optimistically update UI
          setLibrary((prev) => prev.map((it) => it.id === v.id ? { ...it, oembed_html: html } : it));
        }
      } catch (e) {
        // Silent: if oEmbed fails, fallback rendering still works
        console.warn("Failed to hydrate oEmbed cache for:", v.url, e);
      }
    }
  }, []);

  // Load saved TikTok videos for selected username
  const loadLibrary = useCallback(async (uname) => {
    if (!uname) {
      setLibrary([]);
      return;
    }
    setLibraryLoading(true);
    try {
      const items = await TikTokVideo.filter({ user_name: uname }, "-updated_date", 60);
      setLibrary(items || []);
      // Backfill cache for items missing oembed_html (non-blocking)
      hydrateOembedCache(items || []);
    } finally {
      setLibraryLoading(false);
    }
  }, [hydrateOembedCache]);

  // Refresh library when brand selection changes
  useEffect(() => {
    loadLibrary(assignToUsername);
  }, [assignToUsername, loadLibrary]);

  const handleSearch = async () => {
    const term = q.trim();
    if (!term) {
      toast.message("Enter a search query for TikTok videos.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const { data } = await tiktokSearch({ q: term, maxResults });
      const items = data?.results || [];
      if (items.length === 0) {
        toast.message("No TikTok results found for your query.");
      }
      setResults(items);
    } catch (e) {
      console.error("tiktokSearch error:", e);
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
    const id = item.video_id || item.id || item.url;
    setSavingId(id);
    try {
      const saved = await TikTokVideo.create({ // Assign result to 'saved'
        title: item.title || "TikTok Video",
        video_id: item.video_id || item.id || "",
        url: item.url || item.web_video_url || "",
        cover_url: item.cover_url || item.thumbnail || "",
        author_name: item.author_name || item.author || "",
        user_name: assignToUsername
      });

      // Cache oEmbed immediately after import (with sanitized meta)
      if ((saved && saved.id) && (saved.url || item.url || item.web_video_url)) {
        try {
          const videoUrlToFetch = saved.url || item.url || item.web_video_url;
          const { data } = await getTikTokOembed({ url: videoUrlToFetch });
          const html = data?.html || "";
          if (html) {
            const rawW = (data?.meta?.width);
            const rawH = (data?.meta?.height);
            const wNum = Number(rawW);
            const hNum = Number(rawH);
            const meta = {
              title: data?.meta?.title,
              author_name: data?.meta?.author_name,
              author_url: data?.meta?.author_url,
              provider: data?.meta?.provider,
              thumbnail_url: data?.meta?.thumbnail_url,
              ...(Number.isFinite(wNum) ? { width: wNum } : {}),
              ...(Number.isFinite(hNum) ? { height: hNum } : {}),
            };

            await TikTokVideo.update(saved.id, {
              oembed_html: html,
              oembed_cached_at: new Date().toISOString(),
              oembed_meta: meta
            });
            // Optimistically update the saved item in the library state if it's already there
            setLibrary((prev) => prev.map((v) => v.id === saved.id ? { ...v, oembed_html: html } : v));
          }
        } catch (e) {
          console.warn("Failed to cache oEmbed on save for:", saved.url, e);
          // Silent: if oEmbed fails, fallback rendering still works
        }
      }

      toast.success("Saved to library.");
      await loadLibrary(assignToUsername); // Reload library to get the latest (including cached oEmbed if not optimistically updated)
    } catch (e) {
      console.error("Save TikTok error:", e);
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
      await TikTokVideo.update(video.id, { user_name: newUser || undefined });
      setLibrary((prev) => prev.map((v) => v.id === video.id ? { ...v, user_name: newUser || "" } : v));
    } catch (e) {
      console.error("Reassign TikTok video error:", e);
      toast.error("Could not reassign this video.");
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
      await TikTokVideo.delete(videoToDelete.id);
      setLibrary((prev) => prev.filter((v) => v.id !== videoToDelete.id));
      toast.success("TikTok video deleted.");
    } catch (e) {
      console.error("Delete TikTok video error:", e);
      toast.error("Failed to delete TikTok video.");
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
              TikTok AI
              <Badge variant="outline" className="ml-2 border-slate-200 text-slate-600">Search & Save</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_220px] gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search TikTok (e.g., dog training hacks)"
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
                    Start by searching for a topic to see TikTok results here.
                  </div> :

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {results.map((item) => {
                      const id = item.video_id || item.id || item.url;
                      return (
                        <div key={id} className="rounded-lg border border-slate-200 overflow-hidden bg-white flex flex-col">
                          <div className="aspect-[9/12] bg-slate-100 grid place-items-center overflow-hidden">
                            {item.cover_url || item.thumbnail ?
                              <img
                                src={item.cover_url || item.thumbnail}
                                alt={item.title || "TikTok"}
                                className="w-full h-full object-cover" /> :


                              <div className="text-slate-400">No thumbnail</div>
                            }
                          </div>
                          <div className="p-4 flex-1 flex flex-col gap-2">
                            <div className="font-medium line-clamp-2 text-slate-900">
                              {item.title || "TikTok Video"}
                            </div>
                            {(item.author_name || item.author) &&
                              <div className="text-xs text-slate-500">by {item.author_name || item.author}</div>
                            }
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
                                disabled={!assignToUsername || savingId === id}
                                className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                                title={!assignToUsername ? "Select a username to enable saving" : "Save to Library"}>

                                {savingId === id ?
                                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> :

                                  <><Save className="w-4 h-4 mr-1" /> Save</>
                                }
                              </Button>
                            </div>
                          </div>
                        </div>);

                    })}
                  </div>
              }
            </div>

            {/* Imported Library */}
            <div className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-y-2 mb-3">
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
                    variant="outline" className="bg-background text-slate-100 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 border-slate-300 hover:bg-slate-50">


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
                    <div className="py-10 text-slate-500 text-center">No imported videos yet for this brand.</div> :

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {library
                        .filter((v) => {
                          const qLower = libraryQuery.trim().toLowerCase();
                          if (!qLower) return true;
                          return (
                            (v.title || "").toLowerCase().includes(qLower) ||
                            (v.url || "").toLowerCase().includes(qLower) ||
                            (v.author_name || "").toLowerCase().includes(qLower)
                          );
                        })
                        .map((v) => (
                          <div key={v.id} className="rounded-lg border border-slate-200 overflow-hidden bg-white flex flex-col">
                            <TikTokEmbed
                              videoId={v.video_id}
                              url={v.url}
                              coverUrl={v.cover_url}
                              title={v.title}
                              cachedHtml={v.oembed_html}
                            />
                            <div className="p-4 flex-1 flex flex-col gap-2">
                              <div className="font-medium line-clamp-2 text-slate-900">{v.title || "TikTok Video"}</div>
                              <div className="text-xs text-slate-500">{v.author_name ? `by ${v.author_name}` : ""}</div>
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
                                  {isSuperadmin ?
                                    <>
                                      <Select
                                        value={v.user_name || "__none__"}
                                        onValueChange={(val) => handleReassignUsername(v, val)}
                                        disabled={reassigningId === v.id}>

                                        <SelectTrigger className="h-8 w-[150px] bg-white border-slate-300 text-slate-900">
                                          <SelectValue placeholder="Assign username" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                                          <SelectItem value="__none__" className="hover:bg-slate-100">Unassigned</SelectItem>
                                          {usernames.map((u) =>
                                            <SelectItem key={u} value={u} className="hover:bg-slate-100">{u}</SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                      {reassigningId === v.id && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                                    </> :

                                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                                      {v.user_name || "Unassigned"}
                                    </Badge>
                                  }
                                  {/* NEW: delete button for everyone with tooltip */}
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
                        ))}
                    </div> :


                    <div className="py-10 text-slate-500 text-center">Select a brand to view its imported videos.</div>
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this TikTok video?</AlertDialogTitle>
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
