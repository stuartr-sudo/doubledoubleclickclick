
import React, { useState, useEffect } from "react";
import { YouTubeVideo } from "@/api/entities";
import { TikTokVideo } from "@/api/entities";
import { AmazonProductVideo } from "@/api/entities"; // New import
import { User } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

export default function VideoLibraryModal({ isOpen, onClose, onInsert }) {
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [tiktokVideos, setTiktokVideos] = useState([]);
  const [amazonVideos, setAmazonVideos] = useState([]); // New state variable
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localSelectedUsername, setLocalSelectedUsername] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const { consumeTokensForFeature } = useTokenConsumption();

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine the active username for filtering based on feature flag
  const activeUsername = useWorkspaceScoping ? (globalUsername || "all") : localSelectedUsername;

  useEffect(() => {
    if (isOpen) {
      loadVideos();
    } else {
      setSearchTerm("");
      setLocalSelectedUsername("all"); // Reset local state when modal closes
    }
  }, [isOpen]);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load YouTube videos
      const ytVideos = await YouTubeVideo.list("-created_date");

      // Load TikTok videos  
      const ttVideos = await TikTokVideo.list("-created_date");

      // Load Amazon videos
      const azVideos = await AmazonProductVideo.list("-created_date");

      // Get unique usernames for filtering
      const allUsernames = new Set();
      [...ytVideos, ...ttVideos, ...azVideos].forEach((video) => { // Include azVideos
        if (video.user_name) allUsernames.add(video.user_name);
      });

      // Filter by assigned usernames if user has them
      const assigned = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
      let visibleUsernames = [];
      if (assigned.length > 0) {
        visibleUsernames = assigned.filter((name) => allUsernames.has(name)).sort();
      } else {
        visibleUsernames = Array.from(allUsernames).sort();
      }

      setAvailableUsernames(visibleUsernames);
      setYoutubeVideos(ytVideos);
      setTiktokVideos(ttVideos);
      setAmazonVideos(azVideos); // Set Amazon videos
    } catch (error) {
      console.error("Error loading videos:", error);
      toast.error("Failed to load video library.");
    }
    setIsLoading(false);
  };

  const handleInsertYouTube = async (video) => {
    // Check and consume tokens before inserting
    const result = await consumeTokensForFeature('video_library_insert');
    if (!result.success) {
      return; // Error toast is handled by the hook
    }

    const videoHtml = `
<div class="youtube-video-container" style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2rem 0;">
  <iframe 
    src="https://www.youtube.com/embed/${video.video_id}" 
    title="${video.title}" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    referrerpolicy="strict-origin-when-cross-origin" 
    allowfullscreen
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 8px;"
  ></iframe>
</div>`;
    onInsert(videoHtml);
    onClose();
    toast.success("YouTube video inserted!");
  };

  const handleInsertTikTok = async (video) => {
    // Check and consume tokens before inserting
    const result = await consumeTokensForFeature('video_library_insert');
    if (!result.success) {
      return; // Error toast is handled by the hook
    }

    // Use cached oEmbed HTML if available, otherwise create a basic embed
    const tiktokHtml = video.oembed_html || `
<blockquote class="tiktok-embed" cite="${video.url}" data-video-id="${video.video_id}" style="max-width: 605px;min-width: 325px; margin: 2rem auto; border: 1px solid #00f2ea; border-radius: 12px; padding: 0;">
  <section>
    <a target="_blank" title="${video.title}" href="${video.url}">
      <p style="margin: 1rem; text-align: center; font-weight: bold;">${video.title}</p>
      <p style="margin: 1rem; text-align: center; color: #666;">View on TikTok</p>
    </a>
  </section>
</blockquote>`;

    onInsert(tiktokHtml);
    onClose();
    toast.success("TikTok video inserted!");
  };

  const handleInsertAmazon = async (video) => {
    // Check and consume tokens before inserting
    const result = await consumeTokensForFeature('video_library_insert');
    if (!result.success) {
      return;
    }

    const videoHtml = `
<div class="amazon-video-container" style="position: relative; width: 100%; max-width: 640px; margin: 2rem auto;">
  <video 
    controls
    poster="${video.thumbnail_url}"
    style="width: 100%; height: auto; border-radius: 8px;"
  >
    <source src="${video.video_url}" type="application/x-mpegURL">
    Your browser does not support the video tag.
  </video>
  <p style="text-align: center; margin-top: 0.5rem; font-size: 0.875rem; color: #666;">${video.title}</p>
</div>`;
    onInsert(videoHtml);
    onClose();
    toast.success("Amazon video inserted!");
  };

  const filterVideosByUsername = (videos) => {
    return videos.filter((video) =>
      activeUsername === "all" || video.user_name === activeUsername
    );
  };

  const filterVideosBySearch = (videos) => {
    if (!searchTerm.trim()) return videos;
    const term = searchTerm.toLowerCase();
    return videos.filter((video) =>
    video.title?.toLowerCase().includes(term) ||
    video.author_name?.toLowerCase().includes(term)
    );
  };

  const getFilteredVideos = (videos) => {
    return filterVideosBySearch(filterVideosByUsername(videos));
  };

  const filteredYouTubeVideos = getFilteredVideos(youtubeVideos);
  const filteredTikTokVideos = getFilteredVideos(tiktokVideos);
  const filteredAmazonVideos = getFilteredVideos(amazonVideos); // New filtered videos

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="b44-modal max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Video className="w-5 h-5 text-purple-600" />
            Video Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />

            </div>
            {!useWorkspaceScoping && availableUsernames.length > 0 && // Conditionally render the Select if workspace scoping is NOT enabled
            <Select value={localSelectedUsername} onValueChange={setLocalSelectedUsername}>
                <SelectTrigger className="w-48 bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="all">All Users</SelectItem>
                  {availableUsernames.map((username) =>
                <SelectItem key={username} value={username}>
                      {username}
                    </SelectItem>
                )}
                </SelectContent>
              </Select>
            }
          </div>

          <Tabs defaultValue="youtube" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg"> {/* Changed to grid-cols-3 */}
              <TabsTrigger
                value="youtube"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">
                YouTube
              </TabsTrigger>
              <TabsTrigger
                value="tiktok"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">
                TikTok
              </TabsTrigger>
              <TabsTrigger
                value="amazon"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600">
                Amazon {/* New Tab */}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="youtube" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading YouTube videos...</div>
              ) : filteredYouTubeVideos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No YouTube videos found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredYouTubeVideos.map((video) => (
                    <div key={video.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 space-y-3">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-32 object-cover rounded"
                      />
                      <h4 className="font-medium line-clamp-2 h-12 text-slate-800">{video.title}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Username: {video.user_name}</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleInsertYouTube(video)}
                            size="sm"
                            className="bg-blue-900 text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md hover:bg-red-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Insert
                          </Button>
                          <Button
                            onClick={() => window.open(video.url, '_blank')}
                            size="sm"
                            variant="outline"
                            className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tiktok" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading TikTok videos...</div>
              ) : filteredTikTokVideos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No TikTok videos found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {filteredTikTokVideos.map((video) => (
                    <div key={video.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 space-y-3">
                      <div className="aspect-[9/16] relative">
                        <img
                          src={video.cover_url}
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <h4 className="font-medium line-clamp-3 text-sm text-slate-800">{video.title}</h4>
                      <div className="space-y-2">
                        <span className="text-xs text-slate-500 block">Username: {video.user_name}</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleInsertTikTok(video)}
                            size="sm"
                            className="bg-blue-900 text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md hover:bg-gray-800 flex-1"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Insert
                          </Button>
                          <Button
                            onClick={() => window.open(video.url, '_blank')}
                            size="sm"
                            variant="outline"
                            className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* New Amazon Tab Content */}
            <TabsContent value="amazon" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading Amazon videos...</div>
              ) : filteredAmazonVideos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No Amazon videos found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredAmazonVideos.map((video) => (
                    <div key={video.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 space-y-3">
                      <div className="aspect-video relative">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <h4 className="font-medium line-clamp-2 text-sm text-slate-800">{video.title}</h4>
                      <div className="space-y-2">
                        <span className="text-xs text-slate-500 block">ASIN: {video.product_asin}</span>
                        <span className="text-xs text-slate-500 block">Username: {video.user_name}</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleInsertAmazon(video)}
                            size="sm"
                            className="bg-blue-900 text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md hover:bg-gray-800 flex-1">
                            <Plus className="w-4 h-4 mr-1" />
                            Insert
                          </Button>
                          <Button
                            onClick={() => window.open(video.video_url, '_blank')}
                            size="sm"
                            variant="outline"
                            className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            {/* End New Amazon Tab Content */}

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
