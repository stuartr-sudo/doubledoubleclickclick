
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Video, Youtube, Search, Loader2, Package, Download } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Import entities and functions
import { ImageLibraryItem } from "@/api/entities";
import { YouTubeVideo } from "@/api/entities";
import { TikTokVideo } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { PromotedProduct } from "@/api/entities";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import useFeatureFlag from "@/components/hooks/useFeatureFlag"; // NEW: Import useFeatureFlag

// Import required functions
import { youtubeSearch } from "@/api/functions";
import { tiktokSearch } from "@/api/functions";
import { amazonProduct as fetchAmazonProduct } from "@/api/functions";
import { saveImageFromString } from "@/api/functions";
import { getTikTokOembed } from "@/api/functions";

const TIKTOK_ICON = () => (
  <svg fill="#000000" height="24" width="24" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490">
    <path d="M490,245c0,135.2-109.8,245-245,245S0,380.2,0,245S109.8,0,245,0S490,109.8,490,245z" fill="#ff0050" />
    <path d="M490,245c0,135.2-109.8,245-245,245S0,380.2,0,245S109.8,0,245,0S490,109.8,490,245z" fill="#00f2ea" />
    <path d="M375,174.5c-35.3,0-67.4,17.4-87.3,44.2c-22.1-39.3-63.5-65.7-110.8-65.7c-69.2,0-125.5,56.2-125.5,125.5 c0,15.6,2.9,30.6,8.2,44.5c-3.1-15-4.8-30.6-4.8-46.6c0-79.5,64.4-143.9,143.9-143.9c37.5,0,71.7,14.4,98,38.1v-34.9 c0-39.7,32.2-71.9,71.9-71.9c39.7,0,71.9,32.2,71.9,71.9v108.3c0,70.9-57.5,128.4-128.4,128.4c-16.1,0-31.5-3-46-8.5 c15.1,3.4,30.9,5.2,47.2,5.2c79.5,0,143.9-64.4,143.9-143.9V245C440.6,204.6,410.7,174.5,375,174.5z" fill="#fff" />
  </svg>
);


const ImageTabContent = ({ imageItems, searchQuery, usernameFilter, onImageSelect, bulkMode, selectedIds, onToggleSelect }) => {
  const filteredImages = useMemo(() => {
    return imageItems.filter((image) => {
      const matchesSearch = !searchQuery ||
        image.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesUsername = !usernameFilter ||
        usernameFilter === 'all' ||
        image.user_name === usernameFilter;

      return matchesSearch && matchesUsername;
    });
  }, [imageItems, searchQuery, usernameFilter]);

  if (filteredImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No images found</p>
        <p className="text-sm">Try adjusting your search or import some images</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {filteredImages.map((image) => {
        const isSelected = selectedIds?.has(image.id);
        return (
          <div
            key={image.id}
            className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-500'} bg-slate-100`}
            onClick={() => bulkMode ? onToggleSelect(image.id) : onImageSelect(image)}
          >
            <img
              src={image.url}
              alt={image.alt_text || 'Image'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-white text-xs truncate">{image.alt_text || 'Untitled'}</p>
            </div>

            {bulkMode && (
              <div className="absolute top-2 left-2">
                <div className="bg-white/90 rounded-md p-1 shadow">
                  <Checkbox checked={!!isSelected} onCheckedChange={() => onToggleSelect(image.id)} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const VideoTabContent = ({ videoItems, searchQuery, usernameFilter, onVideoSelect }) => {
  // CHANGED: default from 'all' to '16:9' (YouTube)
  const [dimension, setDimension] = useState('16:9');

  const filteredVideos = useMemo(() => {
    return videoItems.filter((video) => {
      const matchesSearch = !searchQuery ||
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUsername = !usernameFilter ||
        usernameFilter === 'all' ||
        video.user_name === usernameFilter;

      const matchesDimension = dimension === 'all' || video.aspectRatio === dimension;

      return matchesSearch && matchesUsername && matchesDimension;
    });
  }, [videoItems, searchQuery, usernameFilter, dimension]);

  if (filteredVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Video className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No videos found</p>
        <p className="text-sm">Try adjusting your filters or add some videos</p>
      </div>
    );
  }

  return (
    <>
      {/* Dimension Filter Tabs */}
      {/* CHANGED: defaultValue from 'all' to '16:9' */}
      <Tabs defaultValue="16:9" value={dimension} onValueChange={setDimension} className="mb-4">
        <TabsList className="bg-blue-100 text-slate-700 mx-auto p-1 h-10 items-center justify-center rounded-md grid w-full grid-cols-3 max-w-sm border border-blue-200">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">All</TabsTrigger>
          <TabsTrigger value="16:9" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">Youtube</TabsTrigger>
          <TabsTrigger value="9:16" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">TikTok</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Changed lg:grid-cols-3 to lg:grid-cols-4 */}
        {filteredVideos.map((video) =>
          <div
            key={`${video.source}-${video.id}`} // Updated key for mixed video types
            className="group relative bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            onClick={() => onVideoSelect(video)} // Pass full video object
          >
            <div className={`w-full ${video.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}> {/* Dynamic aspect ratio */}
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-3">
              <p className="font-medium line-clamp-2 text-sm text-slate-800">{video.title}</p>
              <p className="text-xs text-slate-500 capitalize">{video.source}</p> {/* Display video source */}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const YouTubeTabContent = ({ youtubeQuery, setYoutubeQuery, handleYouTubeSearch, youtubeLoading, youtubeResults, onVideoSelect }) =>
  <div className="space-y-3">
    <div className="flex gap-2">
      <Input
        placeholder="Search YouTube..."
        value={youtubeQuery}
        onChange={(e) => setYoutubeQuery(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleYouTubeSearch()}
        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0" />

      <Button onClick={handleYouTubeSearch} disabled={youtubeLoading} className="bg-red-600 hover:bg-red-700 text-white">
        {youtubeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
      </Button>
    </div>
    {youtubeLoading ?
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      </div> :
      youtubeResults.length > 0 ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {youtubeResults.map((video) =>
            <div
              key={video.videoId}
              className="group relative bg-white rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all shadow-sm hover:shadow-md"
              onClick={() => onVideoSelect(video)}
            >
              <div className="relative aspect-video">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </div>
              <div className="p-3">
                <p className="font-medium line-clamp-2 text-sm text-slate-800 group-hover:text-red-600 transition-colors">
                  {video.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">{video.channelTitle}</p>
                {video.duration && (
                  <p className="text-xs text-slate-400 mt-1">{video.duration}</p>
                )}
              </div>
            </div>
          )}
        </div> :

        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Youtube className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Search for YouTube videos</p>
          <p className="text-sm">Results will appear here</p>
        </div>
    }
  </div>;


const TikTokTabContent = ({ tiktokQuery, setTiktokQuery, handleTikTokSearch, tiktokLoading, tiktokResults, onVideoSelect, selectedUsername }) => {

  const insertTikTokFromSearch = async (video) => {
    if (!selectedUsername || selectedUsername === 'all') {
      toast.error("Please select a username in the workspace selector to save TikToks.");
      return;
    }

    try {
      // 1. Save the TikTok video to the library
      const savedTikTok = await TikTokVideo.create({
        title: video.title,
        description: video.description || "",
        author_name: video.author_name,
        author_unique_id: video.author_unique_id,
        cover_url: video.cover_url,
        video_id: video.video_id,
        url: video.web_video_url, // Use the web_video_url for oEmbed
        user_name: selectedUsername,
        width: video.width,
        height: video.height
      });

      if (!savedTikTok?.id) {
        throw new Error("Failed to save TikTok video to library.");
      }

      // 2. Get oEmbed HTML for insertion
      const { data } = await getTikTokOembed({ url: video.web_video_url });
      if (!data?.success || !data?.html) throw new Error("TikTok oEmbed failed");

      // Generate a unique ID and add data attributes for proper selection
      const elId = `tiktok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const processedHtml = data.html.replace(
        /<blockquote([^>]*)>/i,
        `<blockquote$1 data-b44-id="${elId}" data-b44-type="video">`
      );

      // 3. Insert the HTML
      onVideoSelect(processedHtml);
      toast.success("TikTok video imported and added to library!");
    } catch (error) {
      console.error("TikTok oEmbed insert error:", error);
      toast.error("Could not embed TikTok video. Please try another URL.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search TikTok..."
          value={tiktokQuery}
          onChange={(e) => setTiktokQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleTikTokSearch()}
          className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0" />

        <Button onClick={handleTikTokSearch} disabled={tiktokLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
          {tiktokLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>
      {tiktokLoading ?
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
        </div> :
        tiktokResults.length > 0 ?
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tiktokResults.map((video) =>
              <div
                key={video.video_id}
                className="group relative bg-white rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all shadow-sm hover:shadow-md"
                onClick={() => insertTikTokFromSearch(video)}
              >
                <div className="relative aspect-[9/16]">
                  <img src={video.cover_url} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-xs font-medium line-clamp-2">{video.title}</p>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs text-slate-600">by @{video.author_name}</p>
                </div>
              </div>
            )}
          </div> :

          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <TIKTOK_ICON /> {/* Added TikTok icon to tab content */}
            <p className="text-lg font-medium mt-4">Search for TikTok videos</p>
            <p className="text-sm">Results will appear here</p>
          </div>
      }
    </div>
  );
};

const AmazonImportTabContent = ({ amazonUrl, setAmazonUrl, runAmazonImport, amazonLoading }) =>
  <div className="space-y-4 max-w-md mx-auto">
    <div className="space-y-2">
      <Label htmlFor="amazon-url">Amazon Product URL</Label>
      <Input
        id="amazon-url"
        value={amazonUrl}
        onChange={(e) => setAmazonUrl(e.target.value)}
        placeholder="https://www.amazon.com/dp/B0..."
        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0" />

    </div>

    <Button onClick={runAmazonImport} disabled={amazonLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
      {amazonLoading ?
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Importing...
        </> :

        <>
          <Package className="w-4 h-4 mr-2" />
          Import from Amazon
        </>
      }
    </Button>

    <div className="text-xs text-slate-500 text-center">
      This will import the product image and create a promoted product card
    </div>
  </div>;


const UrlImportTabContent = ({ importUrl, setImportUrl, importAltText, setImportAltText, handleUrlImport, isImporting }) => (
  <div className="space-y-4 max-w-md mx-auto">
    <div className="space-y-2">
      <Label htmlFor="media-url">Image or Video URL</Label>
      <Input
        id="media-url"
        value={importUrl}
        onChange={(e) => setImportUrl(e.target.value)}
        placeholder="https://... or YouTube/TikTok link"
        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="alt-text">Title / Alt Text (optional)</Label>
      <Input
        id="alt-text"
        value={importAltText}
        onChange={(e) => setImportAltText(e.target.value)}
        placeholder="Description of the media"
        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>

    <Button onClick={handleUrlImport} disabled={isImporting} className="w-full bg-green-600 hover:bg-green-700 text-white">
      {isImporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Importing...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Import from URL
        </>
      )}
    </Button>

    <div className="text-xs text-slate-500 text-center">
      This will save the media to your library
    </div>
  </div>
);


export default function MediaLibraryModal({
  isOpen,
  onClose,
  onInsert,
  usernameFilter: preselectedUsername,
  initialTab
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "images");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageItems, setImageItems] = useState([]);
  const [videoItems, setVideoItems] = useState([]);
  const { selectedUsername } = useWorkspace();
  const { consumeTokensForFeature, isCheckingTokens } = useTokenConsumption();

  // All usernames for dropdowns (still used for filtering main library)
  const [allUsernames, setAllUsernames] = useState([]);

  // YouTube search states
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeResultCount, setYoutubeResultCount] = useState(10);

  // TikTok search states
  const [tiktokQuery, setTiktokQuery] = useState("");
  const [tiktokResults, setTiktokResults] = useState([]);
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const [tiktokResultCount, setTiktokResultCount] = useState(10);

  // Amazon Import States
  const [amazonUrl, setAmazonUrl] = useState("");
  const [amazonLoading, setAmazonLoading] = useState(false);

  // URL Import States
  const [importUrl, setImportUrl] = useState("");
  const [importAltText, setImportAltText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Bulk Mode states for images
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Use workspace username if available, otherwise fall back to preselected
  const effectiveUsernameFilter = selectedUsername || preselectedUsername || "all";

  // NEW: Feature flag for Amazon Import tab
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const { enabled: showAmazonImportTab } = useFeatureFlag('ask-ai_amazon', {
    currentUser,
    defaultEnabled: true
  });

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();
      let userAllowedUsernames = [];
      const allUsernameObjects = await Username.list();
      setAllUsernames(allUsernameObjects || []);

      if (user.role === 'admin') {
        userAllowedUsernames = (allUsernameObjects || []).map((u) => u.user_name);
      } else {
        userAllowedUsernames = user.assigned_usernames || [];
      }

      const [images, ytVideos, ttVideos] = await Promise.all([
        ImageLibraryItem.list("-created_date", 1000),
        YouTubeVideo.list("-created_date", 1000),
        TikTokVideo.list("-created_date", 1000)
      ]);

      const allowedUsernamesSet = new Set(userAllowedUsernames);

      let filteredImages = (images || []).filter((img) => allowedUsernamesSet.has(img.user_name));
      if (effectiveUsernameFilter && effectiveUsernameFilter !== 'all') {
        filteredImages = filteredImages.filter((img) => img.user_name === effectiveUsernameFilter);
      }

      let filteredYtVideos = (ytVideos || []).filter((vid) => allowedUsernamesSet.has(vid.user_name));
      let filteredTtVideos = (ttVideos || []).filter((vid) => allowedUsernamesSet.has(vid.user_name));

      if (effectiveUsernameFilter && effectiveUsernameFilter !== 'all') {
        filteredYtVideos = filteredYtVideos.filter((vid) => vid.user_name === effectiveUsernameFilter);
        filteredTtVideos = filteredTtVideos.filter((vid) => vid.user_name === effectiveUsernameFilter);
      }

      const standardizedYtVideos = filteredYtVideos.map((v) => ({
        ...v,
        source: 'youtube',
        aspectRatio: '16:9',
        thumbnail: v.thumbnail,
        description: v.description || ''
      }));

      const standardizedTtVideos = filteredTtVideos.map((v) => ({
        ...v,
        source: 'tiktok',
        aspectRatio: '9:16',
        thumbnail: v.cover_url,
        description: v.description || ''
      }));

      const allVideos = [...standardizedYtVideos, ...standardizedTtVideos].sort((a, b) => {
        const dateA = new Date(a.created_date || a.created_at);
        const dateB = new Date(b.created_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setImageItems(filteredImages);
      setVideoItems(allVideos);
    } catch (e) {
      console.error("Failed to load media:", e);
      toast.error("Failed to load media library.");
    } finally {
      setLoading(false);
    }
  }, [effectiveUsernameFilter]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      // Determine the initial active tab based on prop and feature flag
      let newActiveTab = initialTab || "images";
      if (newActiveTab === "amazon-import" && !showAmazonImportTab) {
        newActiveTab = "images"; // Fallback to images if Amazon tab is disabled
      }
      setActiveTab(newActiveTab);
    } else {
      // When closing, reset states and tabs
      setSearchQuery("");
      setYoutubeResults([]);
      setTiktokResults([]);
      setYoutubeQuery("");
      setTiktokQuery("");
      setAmazonUrl("");
      setImportUrl("");
      setImportAltText("");
      setSelectedIds(new Set());
      setBulkMode(false);
      // Reset activeTab for next open, defaulting to images if initialTab isn't allowed
      let newActiveTab = initialTab || "images";
      if (newActiveTab === "amazon-import" && !showAmazonImportTab) {
        newActiveTab = "images";
      }
      setActiveTab(newActiveTab);
    }
  }, [isOpen, loadInitialData, initialTab, showAmazonImportTab, setSelectedIds]);

  // Handles selection of an image from the library
  const handleImageInsert = async (image) => {
    // Check feature flag + consume tokens for ai_image_library
    const res = await consumeTokensForFeature("ai_image_library");
    if (!res?.success) {
      // Do not insert if feature disabled or tokens insufficient
      return;
    }
    if (onInsert && typeof onInsert === 'function') {
      onInsert(image);
      onClose();
    }
  };

  // Generic function to insert raw HTML content
  const insertHtmlContent = (htmlContent) => {
    if (onInsert && typeof onInsert === 'function') {
      onInsert(htmlContent);
      onClose();
    }
  };

  const handleYouTubeInsert = (video) => {
    const videoId = video.videoId || video.video_id;
    if (!videoId) {
      toast.error("Invalid video ID");
      return;
    }

    if (onInsert && typeof onInsert === 'function') {
      const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const videoHtml = `
<div class="youtube-video-container" data-b44-id="${elId}" data-b44-type="video" style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2rem 0;">
  <iframe
    src="https://www.youtube.com/embed/${videoId}"
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
    }
  };


  // Handles selection of videos from the combined video library (YouTube and TikTok)
  const handleLibraryVideoSelect = async (video) => {
    // NEW: guard video inserts from the library behind feature flag "video_library_insert"
    const res = await consumeTokensForFeature("video_library_insert");
    if (!res?.success) {
      // Do not insert if feature disabled or tokens insufficient
      return;
    }

    if (video.source === 'youtube') {
      // Re-use handleYouTubeInsert for library YouTube videos too, it handles toasts/closing.
      // Make sure the video object matches structure (video.videoId, video.title)
      handleYouTubeInsert({ videoId: video.video_id, title: video.title });
    } else if (video.source === 'tiktok') {
      try {
        // Assuming 'video.url' for TikTok videos in library refers to their web_video_url for oEmbed
        const { data } = await getTikTokOembed({ url: video.url });
        if (!data?.success || !data?.html) throw new Error("TikTok oEmbed failed");

        const elId = `tiktok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const processedHtml = data.html.replace(
          /<blockquote([^>]*)>/i,
          `<blockquote$1 data-b44-id="${elId}" data-b44-type="video">`
        );
        insertHtmlContent(processedHtml);
      } catch (error) {
        console.error("TikTok oEmbed insert error:", error);
        toast.error("Could not embed TikTok video from library.");
      }
    }
  };

  // YouTube search function
  const handleYouTubeSearch = async () => {
    if (!youtubeQuery.trim()) return;

    // NEW: enforce feature flag before searching YouTube
    const tokenCheck = await consumeTokensForFeature("ai_youtube");
    if (!tokenCheck?.success) {
      // Hook shows appropriate toast; abort search
      return;
    }

    setYoutubeLoading(true);
    setYoutubeResults([]);
    try {
      const response = await youtubeSearch({
        q: youtubeQuery,
        maxResults: youtubeResultCount
      });
      setYoutubeResults(response?.data?.results || []);
    } catch (e) {
      toast.error(e.message || "Failed to search YouTube.");
    } finally {
      setYoutubeLoading(false);
    }
  };

  // TikTok search function
  const handleTikTokSearch = async () => {
    if (!tiktokQuery.trim()) return;

    // NEW: enforce feature flag before searching TikTok
    const tokenCheck = await consumeTokensForFeature("ai_tiktok");
    if (!tokenCheck?.success) {
      // Hook shows appropriate toast; abort search
      return;
    }

    setTiktokLoading(true);
    setTiktokResults([]);
    try {
      const response = await tiktokSearch({
        keywords: tiktokQuery,
        count: tiktokResultCount
      });
      setTiktokResults(response?.data?.videos || []);
    } catch (e) {
      toast.error(e.message || "Failed to search TikTok.");
    } finally {
      setTiktokLoading(false);
    }
  };

  // Amazon Import function
  const runAmazonImport = async () => {
    if (!amazonUrl.trim()) {
      toast.error("Please enter an Amazon product URL.");
      return;
    }

    const currentUsername = selectedUsername && selectedUsername !== 'all' ? selectedUsername : null;
    if (!currentUsername) {
      toast.error("Please select a username in the workspace selector.");
      return;
    }

    // NEW: enforce feature flag before importing from Amazon
    const tokenCheck = await consumeTokensForFeature("image_library_amazon_import");
    if (!tokenCheck?.success) {
      return; // Abort if feature disabled or insufficient tokens
    }

    setAmazonLoading(true);
    try {
      const { data: res } = await fetchAmazonProduct({ url: amazonUrl });
      if (!res?.success) {
        if (res?.error && res.error.includes("exceeded the MONTHLY quota")) {
           toast.error("Amazon Import Quota Reached", {
            description: "You've used all your free Amazon data requests for the month. To continue, please upgrade your plan on RapidAPI.",
            duration: 10000,
          });
        } else {
          toast.error(res?.error || "Failed to fetch product details.");
        }
        return;
      }

      const p = res.data;

      // Extract ALL images, not just the main one
      const allImages = [];

      // Check multiple possible image field names
      if (p.product_photos && Array.isArray(p.product_photos)) {
        allImages.push(...p.product_photos);
      }
      if (p.images && Array.isArray(p.images)) {
        allImages.push(...p.images);
      }
      if (p.product_images && Array.isArray(p.product_images)) {
        allImages.push(...p.product_images);
      }
      if (p.image_gallery && Array.isArray(p.image_gallery)) {
        allImages.push(...p.image_gallery);
      }
      if (p.all_images && Array.isArray(p.all_images)) {
        allImages.push(...p.all_images);
      }
      if (p.additional_images && Array.isArray(p.additional_images)) {
        allImages.push(...p.additional_images);
      }
      if (p.variant_images && Array.isArray(p.variant_images)) {
        allImages.push(...p.variant_images);
      }

      // Add the main product_photo if it exists and isn't already in the array
      if (p.product_photo && !allImages.includes(p.product_photo)) {
        allImages.unshift(p.product_photo); // Add main image first
      }

      // Remove duplicates and filter out empty values
      const uniqueImages = [...new Set(allImages.filter(Boolean))];

      if (uniqueImages.length === 0) {
        throw new Error("Product has no images to import.");
      }

      // Create ALL images in library
      const imagePromises = uniqueImages.map((imageUrl, index) =>
        ImageLibraryItem.create({
          url: imageUrl,
          alt_text: `${p.product_title || 'Amazon Product'}${index > 0 ? ` (${index + 1})` : ''}`,
          source: 'upload',
          user_name: currentUsername,
          tags: ['amazon-import', p.asin].filter(Boolean)
        })
      );

      await Promise.all(imagePromises);

      // Also create a promoted product
      await PromotedProduct.create({
        name: p.product_title || 'Amazon Product',
        description: p.product_description || (Array.isArray(p.about_product) ? p.about_product.join('\n') : ''),
        image_url: uniqueImages[0], // Use first image as main image
        product_url: p.product_url || amazonUrl,
        button_url: p.product_url || amazonUrl,
        price: p.product_price || '',
        user_name: currentUsername,
        sku: p.asin || ''
      });

      toast.success(`Successfully imported "${p.product_title || 'Amazon Product'}" with ${uniqueImages.length} images!`);
      await loadInitialData(); // Refresh image library
      setActiveTab("images"); // Switch back to images tab
      setAmazonUrl("");

    } catch (error) {
      console.error("Amazon import error:", error);
      toast.error(error.message || "Failed to import from Amazon.");
    } finally {
      setAmazonLoading(false);
    }
  };

  // URL Import function
  const handleUrlImport = async () => {
    const url = importUrl.trim();
    if (!url) {
      toast.error("Please enter a URL.");
      return;
    }

    const currentUsername = selectedUsername && selectedUsername !== 'all' ? selectedUsername : null;
    if (!currentUsername) {
      toast.error("Please select a username in the workspace selector.");
      return;
    }

    // NEW: enforce feature flag before importing from URL
    const tokenCheck = await consumeTokensForFeature("ai_product_url_import");
    if (!tokenCheck?.success) {
      return; // Abort if feature disabled or insufficient tokens
    }

    setIsImporting(true);
    try {
      // YouTube URL
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoIdRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(videoIdRegex);
        const videoId = match && match[2].length === 11 ? match[2] : null;
        if (!videoId) throw new Error("Invalid YouTube URL.");

        await YouTubeVideo.create({
          title: importAltText || "YouTube Video",
          video_id: videoId,
          url: url,
          user_name: currentUsername,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        });
        // Ensure it shows up under Video Library
        setActiveTab("videos");
        await loadInitialData();
        toast.success("YouTube video imported successfully!");

        // TikTok URL
      } else if (url.includes('tiktok.com')) {
        const videoIdRegex = /tiktok\.com\/@([^\/]+)\/video\/(\d+)/;
        const match = url.match(videoIdRegex);
        if (!match) throw new Error("Invalid TikTok URL format.");

        const [_, authorName, videoId] = match;

        const { data } = await getTikTokOembed({ url });
        if (!data?.success) throw new Error("Could not fetch TikTok video details.");

        await TikTokVideo.create({
          title: importAltText || data.title || "TikTok Video",
          video_id: videoId,
          url: url,
          author_name: authorName,
          cover_url: data.thumbnail_url,
          user_name: currentUsername,
          width: data.width,
          height: data.height,
        });
        // Ensure it shows up under Video Library
        setActiveTab("videos");
        await loadInitialData();
        toast.success("TikTok video imported successfully!");

        // Image URL
      } else {
        const { data: result } = await saveImageFromString({
          value: url,
          user_name: currentUsername,
          alt_text: importAltText || 'Imported image',
          source: "upload"
        });
        if (!result.success) throw new Error(result.error || "Failed to save image from URL.");
        setActiveTab("images");
        await loadInitialData();
        toast.success("Image imported successfully!");
      }

      setImportUrl("");
      setImportAltText("");
    } catch (error) {
      toast.error(error.message || "Could not import from URL.");
    } finally {
      setIsImporting(false);
    }
  };

  // Helpers for bulk mode
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    // Build the same filtered list used by ImageTabContent
    const filtered = (imageItems || []).filter((image) => {
      const matchesSearch = !searchQuery ||
        image.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesUsername = !effectiveUsernameFilter ||
        effectiveUsernameFilter === 'all' ||
        image.user_name === effectiveUsernameFilter;
      return matchesSearch && matchesUsername;
    });
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setShowBulkDeleteConfirm(false);
      return;
    }
    setIsBulkDeleting(true);
    try {
      await Promise.all(ids.map((id) => ImageLibraryItem.delete(id)));
      // Remove from state
      setImageItems((prev) => prev.filter((img) => !selectedIds.has(img.id)));
      setSelectedIds(new Set());
      setBulkMode(false); // Exit bulk mode after deleting
      setShowBulkDeleteConfirm(false);
      toast.success(`${ids.length} image(s) deleted successfully.`);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error(error.message || "Failed to delete images.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Dynamically calculate grid columns for TabsList
  const tabsListGridCols = showAmazonImportTab ? "grid-cols-6" : "grid-cols-5";


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 flex flex-col bg-slate-100 text-slate-900 rounded-lg shadow-2xl">
          <DialogHeader className="p-4 border-b border-slate-300">
            <DialogTitle className="text-xl">Media Library</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 p-4">
            {/* Top search + bulk controls */}
            <div className="flex flex-col gap-3 mb-4">
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-slate-300 w-full text-slate-900 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {activeTab === "images" && (
                <div className="flex flex-wrap items-center gap-2">
                  {!bulkMode ? (
                    <Button variant="outline" className="bg-white border-slate-300" onClick={() => setBulkMode(true)}>
                      Enable Bulk Select
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="bg-white border-slate-300" onClick={() => setBulkMode(false)}>
                        Exit Bulk Select
                      </Button>
                      <Button variant="outline" className="bg-white border-slate-300" onClick={selectAllFiltered}>
                        Select All (filtered)
                      </Button>
                      <Button variant="outline" className="bg-white border-slate-300" onClick={clearSelection}>
                        Clear Selection
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={selectedIds.size === 0}
                        onClick={() => setShowBulkDeleteConfirm(true)}
                      >
                        Delete Selected ({selectedIds.size})
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setBulkMode(false); setSelectedIds(new Set()); }} className="flex flex-col flex-1 min-h-0">
              <TabsList className={`grid w-full ${tabsListGridCols} bg-white border border-slate-200`}>
                <TabsTrigger value="images" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                  <ImageIcon className="w-4 h-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                  <Video className="w-4 h-4" />
                  Video Library
                </TabsTrigger>
                <TabsTrigger value="youtube" className="flex items-center gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
                  <Youtube className="w-4 h-4" />
                  Search YouTube
                </TabsTrigger>
                <TabsTrigger value="tiktok" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800">
                  Search TikTok
                </TabsTrigger>
                {showAmazonImportTab && (
                  <TabsTrigger value="amazon-import" className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                    <Package className="w-4 h-4" />
                    Import Amazon
                  </TabsTrigger>
                )}
                <TabsTrigger value="url-import" className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                  <Download className="w-4 h-4" />
                  Import URL
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <TabsContent value="images" className="mt-4">
                      <ImageTabContent
                        imageItems={imageItems}
                        searchQuery={searchQuery}
                        usernameFilter={effectiveUsernameFilter}
                        onImageSelect={handleImageInsert}
                        bulkMode={bulkMode}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                      />
                    </TabsContent>
                    <TabsContent value="videos" className="mt-4">
                      <VideoTabContent
                        videoItems={videoItems}
                        searchQuery={searchQuery}
                        usernameFilter={effectiveUsernameFilter}
                        onVideoSelect={handleLibraryVideoSelect}
                      />
                    </TabsContent>
                    <TabsContent value="youtube" className="mt-4">
                      <YouTubeTabContent
                        youtubeQuery={youtubeQuery}
                        setYoutubeQuery={setYoutubeQuery}
                        handleYouTubeSearch={handleYouTubeSearch}
                        youtubeLoading={youtubeLoading}
                        youtubeResults={youtubeResults}
                        onVideoSelect={handleYouTubeInsert}
                      />
                    </TabsContent>
                    <TabsContent value="tiktok" className="mt-4">
                      <TikTokTabContent
                        tiktokQuery={tiktokQuery}
                        setTiktokQuery={setTiktokQuery}
                        handleTikTokSearch={handleTikTokSearch}
                        tiktokLoading={tiktokLoading}
                        tiktokResults={tiktokResults}
                        onVideoSelect={insertHtmlContent}
                        selectedUsername={selectedUsername}
                      />
                    </TabsContent>
                    {showAmazonImportTab && (
                      <TabsContent value="amazon-import" className="mt-4">
                        <AmazonImportTabContent
                          amazonUrl={amazonUrl}
                          setAmazonUrl={setAmazonUrl}
                          runAmazonImport={runAmazonImport}
                          amazonLoading={amazonLoading}
                        />
                      </TabsContent>
                    )}
                    <TabsContent value="url-import" className="mt-4">
                      <UrlImportTabContent
                        importUrl={importUrl}
                        setImportUrl={setImportUrl}
                        importAltText={importAltText}
                        setImportAltText={setImportAltText}
                        handleUrlImport={handleUrlImport}
                        isImporting={isImporting}
                      />
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} image{selectedIds.size === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected image{selectedIds.size === 1 ? '' : 's'} will be permanently removed from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} disabled={isBulkDeleting} className="bg-red-600 hover:bg-red-700">
              {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
