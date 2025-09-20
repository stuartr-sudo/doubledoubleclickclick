
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Video as VideoIcon, Plus, ExternalLink } from "lucide-react";
import { GeneratedVideo } from "@/api/entities"; // Keep import for type inference if needed elsewhere, though not used in component logic
import { YouTubeVideo } from "@/api/entities";
import { TikTokVideo } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { toast } from "sonner";
import { getTikTokOembed } from "@/api/functions";

export default function VideoLibraryModal(props) {
  const [currentUser, setCurrentUser] = useState(null);
  const [assignmentUsernames, setAssignmentUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("all");

  // Removed searchGen and genVideos state as Generated tab is removed
  const [searchYT, setSearchYT] = useState("");
  const [searchTT, setSearchTT] = useState("");

  // Removed genVideos state as Generated tab is removed
  const [ytVideos, setYtVideos] = useState([]);
  const [ttVideos, setTtVideos] = useState([]);

  useEffect(() => {
    if (!props.isOpen) return;
    const load = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        let names = [];
        if (user.role === "admin") {
          const allUsernames = await Username.list("-created_date").catch(() => []);
          names = (allUsernames || []).
          filter((u) => u.is_active !== false && !!u.user_name).
          map((u) => u.user_name).
          sort((a, b) => a.localeCompare(b));
        } else {
          names = user.assigned_usernames || [];
        }
        setAssignmentUsernames(names);

        // EDIT: Only load YouTube and TikTok
        await Promise.all([loadYouTube(user), loadTikTok(user)]);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load video library.");
      }
    };
    load();
  }, [props.isOpen]);

  // Removed loadGenerated function as Generated tab is removed
  const loadYouTube = async (user) => {
    const all = await YouTubeVideo.list("-created_date");
    const filtered = user.role === "admin" ?
    all :
    all.filter((v) => !v.user_name || (user.assigned_usernames || []).includes(v.user_name));
    setYtVideos(filtered);
  };
  const loadTikTok = async (user) => {
    const all = await TikTokVideo.list("-created_date");
    const filtered = user.role === "admin" ?
    all :
    all.filter((v) => !v.user_name || (user.assigned_usernames || []).includes(v.user_name));
    setTtVideos(filtered);
  };

  const filterByUsername = (arr) =>
  arr.
  filter((v) => selectedUsername === "all" || v.user_name === selectedUsername);

  // Removed handleInsertGenerated function as Generated tab is removed

  const insertYouTubeHtml = (videoId, title = "YouTube video player") => {
    const html = `
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
    props.onInsert(html);
    props.onClose();
  };

  const handleInsertYouTube = (video) => {
    insertYouTubeHtml(video.video_id, video.title);
  };

  const handleInsertTikTok = async (video) => {
    try {
      const safeUrl = String(video.url || "").trim();
      if (!safeUrl) {
        toast.error("Invalid TikTok URL.");
        return;
      }
      const { data } = await getTikTokOembed({ url: safeUrl });
      if (!data?.success || !data?.html) {
        throw new Error(data?.error || "TikTok oEmbed failed: No HTML returned.");
      }
      // Insert exactly what the endpoint returns (blockquote + script)
      props.onInsert(data.html);
      props.onClose();
    } catch (e) {
      console.error("TikTok oEmbed insert error:", e);
      toast.error("Could not embed TikTok video. Please try another URL.");
    }
  };

  // EDIT: avoid unused var and 'Generated' list (no longer used)
  const filteredGen = []; // replaced previous computed list

  const filteredYT = filterByUsername(ytVideos).filter((v) =>
  (v.title || v.description || "").toLowerCase().includes(searchYT.toLowerCase())
  );
  const filteredTT = filterByUsername(ttVideos).filter((v) =>
  (v.title || v.author_name || "").toLowerCase().includes(searchTT.toLowerCase())
  );

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onClose}>
      {/* EDIT: Switch to light theme with b44-modal class */}
      <DialogContent className="b44-modal max-w-5xl rounded-2xl shadow-2xl p-0 max-h-[85vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <VideoIcon className="w-5 h-5 text-indigo-600" />
            Video Library
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {(assignmentUsernames.length > 0 || currentUser?.role === "admin") &&
          <div className="mb-2">
              <Label className="block text-sm font-medium mb-2 text-slate-700">Filter by Username</Label>
              <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="all">{currentUser?.role === "admin" ? "All Users" : "All Assigned"}</SelectItem>
                  {assignmentUsernames.map((u) =>
                <SelectItem key={u} value={u}>{u}</SelectItem>
                )}
                </SelectContent>
              </Select>
            </div>
          }

          {/* EDIT: Only YouTube and TikTok tabs; default to YouTube */}
          <Tabs defaultValue="youtube" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <TabsTrigger value="youtube" className="rounded-md text-slate-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                YouTube
              </TabsTrigger>
              <TabsTrigger value="tiktok" className="rounded-md text-slate-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                TikTok
              </TabsTrigger>
            </TabsList>

            {/* REMOVED: Generated tab and its content */}

            <TabsContent value="youtube" className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search YouTube videos..."
                  value={searchYT}
                  onChange={(e) => setSearchYT(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

              </div>
              <div className="max-h-[55vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredYT.length === 0 ?
                <div className="text-center py-10 text-slate-500 col-span-2">
                    <VideoIcon className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    No YouTube videos found.
                  </div> :
                filteredYT.map((v) =>
                <div key={v.id} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white hover:bg-slate-50 transition">
                    {v.thumbnail && <img src={v.thumbnail} alt={v.title} className="w-full h-36 object-cover rounded" />}
                    <div className="font-medium line-clamp-2 text-slate-900">{v.title}</div>
                    <div className="text-xs text-slate-500">{v.user_name ? `Username: ${v.user_name}` : ""}</div>
                    <div className="flex items-center justify-between">
                      <a href={v.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 inline-flex items-center gap-1 hover:text-indigo-700">
                        <ExternalLink className="w-3 h-3" /> Open
                      </a>
                      <Button size="sm" onClick={() => handleInsertYouTube(v)} className="bg-indigo-600 text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" /> Insert
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tiktok" className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search TikTok videos..."
                  value={searchTT}
                  onChange={(e) => setSearchTT(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

              </div>
              <div className="max-h-[55vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTT.length === 0 ?
                <div className="text-center py-10 text-slate-500 col-span-2">
                    <VideoIcon className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    No TikTok videos found.
                  </div> :
                filteredTT.map((v) =>
                <div key={v.id} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white hover:bg-slate-50 transition">
                    {v.cover_url && <img src={v.cover_url} alt={v.title} className="w-full h-36 object-cover rounded" />}
                    <div className="font-medium line-clamp-2 text-slate-900">{v.title}</div>
                    <div className="text-xs text-slate-500">{v.author_name ? `By: ${v.author_name}` : ""}</div>
                    <div className="flex items-center justify-between">
                      <a href={v.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 inline-flex items-center gap-1 hover:text-indigo-700">
                        <ExternalLink className="w-3 h-3" /> Open
                      </a>
                      <Button size="sm" onClick={() => handleInsertTikTok(v)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Insert
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>);

}