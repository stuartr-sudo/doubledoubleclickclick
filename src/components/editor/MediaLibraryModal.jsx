
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ImageLibraryItem } from "@/api/entities";
import { YouTubeVideo } from "@/api/entities";
import { TikTokVideo } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Loader2, X, Trash2, Copy, Check, Edit, CheckSquare, Sparkles, Download, Plus, Video, Image as ImageIcon, Play, ExternalLink, Youtube, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveImageFromString } from "@/api/functions";
import { youtubeSearch } from "@/api/functions";
import { tiktokSearch } from "@/api/functions";
import { getTikTokOembed } from "@/api/functions";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { amazonProduct } from "@/api/functions";

export default function MediaLibraryModal({ isOpen, onClose, onInsert }) {
  const [loading, setLoading] = useState(true);
  const [allImages, setAllImages] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [allUsernames, setAllUsernames] = useState([]);
  const [query, setQuery] = useState("");
  // Removed states related to selected image details/editing/deletion
  // const [selectedImage, setSelectedImage] = useState(null);
  // [editAltText, setEditAltText] = useState("");
  // [isUpdating, setIsUpdating] = useState(false);
  // [isDeleting, setIsDeleting] = useState(false);
  // [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // [copied, setCopied] = useState(false);

  // The outline also removes the AlertDialog, implying `showDeleteConfirm` is not needed.
  // I will keep `showDeleteConfirm` state for now as a placeholder in case deletion is re-added,
  // but it won't be used in the current JSX.
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Retaining but unused in the current render

  const [showImportFromUrl, setShowImportFromUrl] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importAltText, setImportAltText] = useState("");
  // const [importUsername, setImportUsername] = useState(""); // removed dropdown usage
  const [isImporting, setIsImporting] = useState(false);

  // NEW: Amazon import state
  const [showAmazonImport, setShowAmazonImport] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState("");
  const [isImportingAmazon, setIsImportingAmazon] = useState(false);
  
  // YouTube Search Tab State
  const [ytQuery, setYtQuery] = useState("");
  const [ytMax, setYtMax] = useState(10);
  const [ytResults, setYtResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [assignToUsername, setAssignToUsername] = useState("");

  // TikTok Search Tab State - Added
  const [tkQuery, setTkQuery] = useState("");
  const [tkMax, setTkMax] = useState(10);
  const [tkResults, setTkResults] = useState([]);
  const [isSearchingTk, setIsSearchingTk] = useState(false);
  const [assignToUsernameTk, setAssignToUsernameTk] = useState("");

  const [videoLibrarySource, setVideoLibrarySource] = useState('youtube');

  const { consumeTokensForFeature } = useTokenConsumption();

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Use workspace username - no local filter needed
  const usernameFilter = useWorkspaceScoping ? (globalUsername || "all") : "all";

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();

      let availableUsernames = [];
      if (user.role === 'admin') {
        availableUsernames = await Username.list();
      } else {
        const assignedNames = new Set(user.assigned_usernames || []);
        if (assignedNames.size > 0) {
          const all = await Username.list();
          availableUsernames = (all || []).filter((u) => assignedNames.has(u.user_name));
        }
      }
      setAllUsernames(availableUsernames);

      // Load images
      const allImagesResponse = await ImageLibraryItem.list("-created_date", 1000);
      let displayImages = [];
      if (user.role === 'admin') {
        displayImages = allImagesResponse;
      } else {
        const allowedUsernamesSet = new Set(availableUsernames.map((u) => u.user_name));
        displayImages = (allImagesResponse || []).filter((img) => img.user_name && allowedUsernamesSet.has(img.user_name));
      }
      setAllImages(Array.isArray(displayImages) ? displayImages : []);

      // Load videos (YouTube + TikTok)
      const [ytVideosResponse, ttVideosResponse] = await Promise.all([
        YouTubeVideo.list("-created_date"),
        TikTokVideo.list("-created_date")
      ]);
      
      const ytVideos = (ytVideosResponse || []).map(v => ({ ...v, _type: 'youtube' }));
      const ttVideos = (ttVideosResponse || []).map(v => ({ ...v, _type: 'tiktok' }));

      let allVideosData = [...ytVideos, ...ttVideos];

      if (user.role !== 'admin') {
        const allowedUsernamesSet = new Set(availableUsernames.map((u) => u.user_name));
        allVideosData = allVideosData.filter((video) => video.user_name && allowedUsernamesSet.has(video.user_name));
      }
      setAllVideos(allVideosData);

      // Removed importUsername default UI; we now rely on workspace username
    } catch (error) {
      toast.error("Failed to load media library.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setQuery("");
      setShowImportFromUrl(false);
      setImportUrl("");
      setImportAltText("");
      setYtQuery("");
      setYtResults([]);
      setTkQuery(""); // Added for TikTok cleanup
      setTkResults([]); // Added for TikTok cleanup
      setShowAmazonImport(false); // Clear Amazon import state
      setAmazonUrl(""); // Clear Amazon URL
    }
  }, [isOpen, loadData]);

  // Set default usernames - Added/Modified as per outline
  useEffect(() => {
    if (allUsernames && allUsernames.length > 0) {
      // setImportUsername is removed
      if (!useWorkspaceScoping) {
        setAssignToUsername(allUsernames[0].user_name);
        setAssignToUsernameTk(allUsernames[0].user_name); // Added for TikTok default
      }
    }
  }, [allUsernames, useWorkspaceScoping]);

  // --- FILTERING ---
  const filteredImages = useMemo(() => {
    let items = allImages;
    if (usernameFilter !== 'all') {
      items = items.filter((img) => img.user_name === usernameFilter);
    }
    if (query) {
      const lowerQuery = query.toLowerCase();
      items = items.filter((img) => (img.alt_text || '').toLowerCase().includes(lowerQuery));
    }
    return items;
  }, [allImages, query, usernameFilter]);

  const filteredVideos = useMemo(() => {
    let items = allVideos.filter(video => video._type === videoLibrarySource);
    
    if (usernameFilter !== 'all') {
      items = items.filter((video) => video.user_name === usernameFilter);
    }
    if (query) {
      const lowerQuery = query.toLowerCase();
      items = items.filter((video) =>
        (video.title || '').toLowerCase().includes(lowerQuery) ||
        (video.description || '').toLowerCase().includes(lowerQuery) ||
        (video.author_name || '').toLowerCase().includes(lowerQuery)
      );
    }
    return items;
  }, [allVideos, query, usernameFilter, videoLibrarySource]);

  // --- IMAGE HANDLERS ---
  // Removed handleSelectImage, handleUpdateAltText, handleDeleteImage, confirmDelete, handleCopyUrl functions

  const handleInsertImage = async (image) => { // Modified to accept image directly
    if (!image) return;

    const result = await consumeTokensForFeature('image_library_access');
    if (!result.success) {
      return;
    }

    onInsert(image);
    onClose();
  };

  // --- VIDEO HANDLERS ---
  // No longer a selectedVideo state or handler. Insert happens directly on button click for videos.
  // const handleSelectVideo = (video) => {
  //   setSelectedVideo(video);
  //   setSelectedImage(null);
  // };

  const handleInsertYouTube = async (video) => {
    const result = await consumeTokensForFeature('video_library_insert');
    if (!result.success) {
      return;
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

  const removeAutoplayFromTikTokEmbed = (embedHtml) => {
    if (!embedHtml) return embedHtml;
    
    // Remove autoplay-related attributes and parameters from TikTok embeds
    return embedHtml
      .replace(/autoplay[^"']*["'][^"']*["']/gi, '')
      .replace(/data-autoplay[^"']*["'][^"']*["']/gi, '')
      .replace(/allowautoplay[^"']*["'][^"']*["']/gi, '')
      .replace(/&autoplay=1/gi, '')
      .replace(/\?autoplay=1/gi, '')
      .replace(/autoplay=true/gi, '')
      .replace(/autoplay="true"/gi, '')
      .replace(/autoplay='true'/gi, '');
  };

  const handleInsertTikTok = async (video) => {
    const result = await consumeTokensForFeature('video_library_insert');
    if (!result.success) {
      return;
    }

    // `oembed_html` might not be present in search results, so generate a fallback.
    let tiktokHtml = video.oembed_html || `
<blockquote class="tiktok-embed" cite="${video.url}" data-video-id="${video.video_id}" style="max-width: 605px;min-width: 325px; margin: 2rem auto; border: 1px solid #00f2ea; border-radius: 12px; padding: 0;">
  <section>
    <a target="_blank" title="${video.title}" href="${video.url}">
      <p style="margin: 1rem; text-align: center; font-weight: bold;">${video.title}</p>
      <p style="margin: 1rem; text-align: center; color: #666;">View on TikTok</p>
    </a>
  </section>
</blockquote>`;

    // Remove autoplay from the embed HTML
    tiktokHtml = removeAutoplayFromTikTokEmbed(tiktokHtml);

    onInsert(tiktokHtml);
    onClose();
    toast.success("TikTok video inserted!");
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      toast.error("Please provide an image URL.");
      return;
    }

    if (isImporting) return;

    const result = await consumeTokensForFeature('image_library_access');
    if (!result.success) {
      return;
    }

    // Use workspace username when enabled
    const activeUsername = useWorkspaceScoping ? (globalUsername || "") : "";
    if (useWorkspaceScoping && !activeUsername) {
      toast.error("Please select a workspace first.");
      return;
    }

    setIsImporting(true);
    try {
      const { data } = await saveImageFromString({
        value: importUrl.trim(),
        user_name: activeUsername || undefined,
        alt_text: importAltText.trim() || "Imported image",
        source: "upload"
      });

      if (data.success) {
        toast.success("Image imported successfully!");
        setImportUrl("");
        setImportAltText("");
        setShowImportFromUrl(false);
        await loadData();
      } else {
        toast.error(data.error || "Failed to import image.");
      }
    } catch (error) {
      toast.error("Failed to import image.");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };
  
  // NEW: Amazon import handler (adds ALL listing photos)
  const handleAmazonImport = async () => {
    if (!amazonUrl.trim()) {
      toast.error("Please enter an Amazon product URL");
      return;
    }

    const activeUsername = useWorkspaceScoping ? (globalUsername || "") : "";
    if (useWorkspaceScoping && !activeUsername) {
      toast.error("Please select a workspace first.");
      return;
    }

    const result = await consumeTokensForFeature('image_library_amazon_import');
    if (!result.success) {
      return;
    }

    setIsImportingAmazon(true);
    try {
      const { data } = await amazonProduct({ url: amazonUrl.trim() });

      if (!data?.success || !data.data?.product_photos?.length) {
        toast.error("No Amazon product images found or failed to extract.");
        setIsImportingAmazon(false);
        return;
      }

      let importedCount = 0;
      for (const imageUrl of data.data.product_photos) {
        try {
          const { data: saveResult } = await saveImageFromString({
            value: imageUrl,
            user_name: activeUsername || undefined,
            alt_text: `${data.data.product_title || "Amazon Product"} - Image ${importedCount + 1}`,
            source: "amazon_import"
          });
          if (saveResult?.success) importedCount++;
        } catch (err) {
          console.error("Failed to save Amazon image:", err);
        }
      }

      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} Amazon image${importedCount > 1 ? 's' : ''}`);
        await loadData();
        setShowAmazonImport(false);
        setAmazonUrl("");
      } else {
        toast.error("Failed to import any images");
      }
    } catch (error) {
      console.error("Amazon import error:", error);
      toast.error("Failed to import Amazon product images");
    } finally {
      setIsImportingAmazon(false);
    }
  };

  // --- YOUTUBE SEARCH HANDLERS ---
  const handleYouTubeSearch = async () => {
    if (!ytQuery.trim()) {
      toast.info("Please enter a search query.");
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
      const { data } = await youtubeSearch({ q: ytQuery.trim(), maxResults: ytMax });
      setYtResults(data?.results || []);
      if ((data?.results || []).length === 0) {
        toast.info("No YouTube videos found for your search query.");
      }
    } catch (e) {
      console.error("YouTube search error:", e);
      toast.error("Failed to perform YouTube search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInsertSearchAndSave = async (res) => {
    if (!useWorkspaceScoping && !assignToUsername) {
      toast.error("You must select a username to save videos.");
      return;
    }
    const payload = {
      title: res.title,
      video_id: res.video_id,
      url: res.url,
      thumbnail: res.thumbnail,
      description: res.description,
      user_name: useWorkspaceScoping ? (globalUsername || "unknown") : assignToUsername
    };

    try {
      await YouTubeVideo.create(payload);
      await loadData(); // Reload library to show new video
      toast.success("Video saved to library and inserted.");
    } catch (e) {
      console.error("Failed to save video to library:", e);
      toast.error("Insert succeeded, but saving to library failed.");
    } finally {
      handleInsertYouTube(payload); // Always insert regardless of save success
    }
  };

  // --- TIKTOK SEARCH HANDLERS ---
  const handleTikTokSearch = async () => {
    if (!tkQuery.trim()) {
      toast.info("Please enter a search query.");
      return;
    }
    setIsSearchingTk(true);
    setTkResults([]);
    try {
      const tokenResult = await consumeTokensForFeature('ai_tiktok');
      if (!tokenResult.success) {
        setIsSearchingTk(false);
        return;
      }
      const { data } = await tiktokSearch({ keywords: tkQuery.trim(), count: tkMax });
      setTkResults(data?.videos || []);
      if ((data?.videos || []).length === 0) {
        toast.info("No TikTok videos found for your search query.");
      }
    } catch (e) {
      console.error("TikTok search error:", e);
      toast.error("Failed to perform TikTok search. Please try again.");
    }
    setIsSearchingTk(false);
  };

  const handleInsertTikTokAndSave = async (res) => {
    if (!useWorkspaceScoping && !assignToUsernameTk) {
      toast.error("You must select a username to save videos.");
      return;
    }
    
    // Get the TikTok oEmbed HTML first
    let oembedHtml = res.oembed_html;
    if (!oembedHtml) {
      try {
        const { data } = await getTikTokOembed({ url: res.web_video_url });
        oembedHtml = data?.html || '';
      } catch (e) {
        console.error("Failed to get TikTok oEmbed:", e);
        toast.error("Failed to get TikTok embed code.");
        return; // Critical: If oEmbed HTML cannot be fetched, we cannot insert or save.
      }
    }

    // Remove autoplay from the embed HTML
    oembedHtml = removeAutoplayFromTikTokEmbed(oembedHtml);

    const payload = {
      title: res.title,
      video_id: res.video_id,
      url: res.web_video_url,
      cover_url: res.cover_url,
      author_name: res.author_name,
      user_name: useWorkspaceScoping ? (globalUsername || "unknown") : assignToUsernameTk,
      oembed_html: oembedHtml
    };

    try {
      await TikTokVideo.create(payload);
      await loadData();
      toast.success("Saved to library and inserted.");
    } catch (e) {
      console.error("Failed to save TikTok video to library:", e);
      toast.error("Insert succeeded, but saving to library failed.");
    } finally {
      // Insert the HTML embed code, not the payload object
      onInsert(oembedHtml);
      onClose();
    }
  };


  // --- RENDER ---
  return (
    <>
      <Dialog open={!!isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-[90vw] h-[85vh] p-0 flex flex-col bg-slate-50 text-slate-900 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Media Library</h2>
            <div className="flex items-center gap-2">
              {/* NEW: Import from Amazon */}
              <Button
                onClick={() => { setShowAmazonImport(true); setShowImportFromUrl(false); }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Package className="w-4 h-4" />
                Import from Amazon
              </Button>
              {/* Existing: Import from URL (unchanged label/behavior) */}
              <Button
                onClick={() => { setShowImportFromUrl(!showImportFromUrl); setShowAmazonImport(false); }}
                className="bg-blue-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-indigo-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Import from URL
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:bg-slate-200 hover:text-slate-800">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Import from URL Section - NO USERNAME DROPDOWN */}
          {showImportFromUrl && (
            <div className="bg-slate-50 p-4 flex-shrink-0 border-b border-slate-200">
              <div className="space-y-3">
                <h3 className="font-medium text-slate-800">Import Image from URL</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="bg-white border-slate-300"
                    disabled={isImporting}
                  />
                  <Input
                    placeholder="Alt text (optional)"
                    value={importAltText}
                    onChange={(e) => setImportAltText(e.target.value)}
                    className="bg-white border-slate-300"
                    disabled={isImporting}
                  />
                  {/* Username dropdown removed intentionally; workspace username is used */}
                  <div className="flex items-center text-sm text-slate-500">
                    <span className="font-medium mr-1">Assigned to:</span>
                    <span className="truncate">{globalUsername || "None Selected"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleImportFromUrl}
                    disabled={isImporting || !importUrl.trim() || (useWorkspaceScoping && !globalUsername)}
                    className="bg-blue-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 hover:bg-indigo-800"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Import Image
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImportFromUrl(false);
                      setImportUrl("");
                      setImportAltText("");
                    }}
                    className="bg-white border-slate-300"
                    disabled={isImporting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Full Width */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Bar */}
            <div className="flex-shrink-0 p-3 border-b border-slate-200 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search media..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="images" className="flex-1 flex flex-col min-h-0">
              {/* UPDATED: higher-contrast bar without layout changes */}
              <TabsList className="flex-shrink-0 grid w-full grid-cols-4 bg-white border border-slate-200 rounded-md p-1">
                <TabsTrigger
                  value="images"
                  className="text-slate-700 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-300"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Images
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  className="text-slate-700 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-300"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Video Library
                </TabsTrigger>
                <TabsTrigger
                  value="youtube_search"
                  className="text-slate-700 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-300"
                >
                  <Youtube className="w-4 h-4 mr-2" />
                  Search YouTube
                </TabsTrigger>
                <TabsTrigger
                  value="tiktok_search"
                  className="text-slate-700 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-300"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Search TikTok
                </TabsTrigger>
              </TabsList>

              {/* Make inactive tab panels not take up space */}
              <TabsContent value="images" className="hidden data-[state=active]:block flex-1 min-h-0 overflow-y-auto p-4 m-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-w-16 aspect-h-10 rounded-lg overflow-hidden bg-white border border-slate-200 hover:shadow-md transition-all"
                      >
                        <img src={image.url} alt={image.alt_text || ""} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Button
                            onClick={() => handleInsertImage(image)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Insert
                          </Button>
                        </div>
                        <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                          {image.user_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="videos" className="hidden data-[state=active]:flex flex-1 flex-col min-h-0 m-0">
                 <div className="flex-shrink-0 p-3 border-b border-slate-200">
                    <Select value={videoLibrarySource} onValueChange={setVideoLibrarySource}>
                        <SelectTrigger className="w-[180px] bg-white border-slate-300">
                            <SelectValue placeholder="Select video source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="flex-1 min-h-0 overflow-y-auto p-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Loader2 className="h-8 w-8 text-slate-400 animate-spin mb-4" />
                        Loading videos...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredVideos.map((video) => (
                          <div key={video.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 space-y-3 bg-white">
                            {/* Use portrait 9:16 only for TikTok; keep existing YouTube thumbnail style */}
                            {video._type === 'tiktok' ? (
                              <div className="aspect-[9/16] w-full overflow-hidden rounded">
                                <img
                                  src={video.cover_url || video.thumbnail}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <img
                                src={video.thumbnail || video.cover_url}
                                alt={video.title}
                                className="w-full h-32 object-cover rounded"
                              />
                            )}
                            <h4 className="font-medium line-clamp-2 h-12 text-slate-800">{video.title}</h4>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">Username: {video.user_name}</span>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => video._type === 'youtube' ? handleInsertYouTube(video) : handleInsertTikTok(video)}
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
                 </div>
              </TabsContent>

              <TabsContent value="youtube_search" className="hidden data-[state=active]:block flex-1 min-h-0 overflow-y-auto p-4 m-0 space-y-4">
                {!useWorkspaceScoping && allUsernames.length > 0 &&
                  <div>
                    <Label htmlFor="assign-to-username" className="block text-sm font-medium mb-2 text-slate-700">Assign to Username</Label>
                    <Select value={assignToUsername} onValueChange={setAssignToUsername}>
                      <SelectTrigger id="assign-to-username" className="bg-white border-slate-300 text-slate-900">
                        <SelectValue placeholder="Select a username..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {allUsernames.map((u) =>
                        <SelectItem key={u.id} value={u.user_name} className="hover:bg-slate-100">{u.display_name || u.user_name}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                }
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search YouTube (e.g., dog training tips)"
                        value={ytQuery}
                        onChange={(e) => setYtQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleYouTubeSearch()}
                        className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
                  </div>
                  <div className="flex gap-2">
                    <Input
                        type="number"
                        min={1} max={25} value={ytMax}
                        onChange={(e) => { const val = Number(e.target.value); if (!isNaN(val) && val >= 1 && val <= 25) setYtMax(val); }}
                        onBlur={(e) => { const val = Number(e.target.value); if (isNaN(val) || val < 1 || val > 25) setYtMax(10); }}
                        className="w-24 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                        placeholder="Max" title="Max results (1-25)" />

                    <Button onClick={handleYouTubeSearch} disabled={isSearching} className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 flex-1 hover:bg-indigo-700">
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  {isSearching ?
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                      <Loader2 className="h-8 w-8 text-slate-400 animate-spin mb-4" />
                      Searching YouTube...
                    </div> :
                    ytResults.length === 0 ?
                    <div className="text-center py-8 text-slate-500">
                      <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No results yet. Try a keyword above.</p>
                    </div> :

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ytResults.map((res) =>
                      <div key={res.video_id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 space-y-3 bg-white">
                          <img src={res.thumbnail} alt={res.title} className="w-full h-32 object-cover rounded" />
                          <h4 className="font-medium line-clamp-2 h-12 text-slate-800">{res.title}</h4>
                          <div className="flex justify-between items-center">
                            <a href={res.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 inline-flex items-center gap-1 hover:underline">
                              <ExternalLink className="w-4 h-4" /> Open
                            </a>
                            <div className="flex gap-2">
                              <Button onClick={() => handleInsertSearchAndSave(res)} size="sm" className="bg-blue-900 text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md hover:bg-red-700">
                                <Plus className="w-4 h-4 mr-1" /> Insert
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    }
                </div>

              </TabsContent>

              {/* TikTok Search Tab - Added */}
              <TabsContent value="tiktok_search" className="hidden data-[state=active]:block flex-1 min-h-0 overflow-y-auto p-4 m-0 space-y-4">
                {!useWorkspaceScoping && allUsernames.length > 0 &&
                  <div>
                    <Label className="block text-sm font-medium mb-2 text-slate-700">Assign to Username</Label>
                    <Select value={assignToUsernameTk} onValueChange={setAssignToUsernameTk}>
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                        <SelectValue placeholder="Select a username..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        {allUsernames.map((u) =>
                        <SelectItem key={u.id} value={u.user_name} className="hover:bg-slate-100">{u.display_name || u.user_name}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                }
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search TikTok (e.g., dog tricks)"
                        value={tkQuery}
                        onChange={(e) => setTkQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTikTokSearch()}
                        className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" />
                  </div>
                  <div className="flex gap-2">
                    <Input
                        type="number"
                        min={1} max={25} value={tkMax}
                        onChange={(e) => { const val = Number(e.target.value); if (!isNaN(val) && val >= 1 && val <= 25) setTkMax(val); }}
                        onBlur={(e) => { const val = Number(e.target.value); if (isNaN(val) || val < 1 || val > 25) setTkMax(10); }}
                        className="w-24 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                        placeholder="Max" title="Max results (1-25)" />

                    <Button onClick={handleTikTokSearch} disabled={isSearchingTk} className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 flex-1 hover:bg-indigo-700">
                      {isSearchingTk ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  {isSearchingTk ?
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                      <Loader2 className="h-8 w-8 text-slate-400 animate-spin mb-4" />
                      Searching TikTok...
                    </div> :
                    tkResults.length === 0 ?
                    <div className="text-center py-8 text-slate-500">
                      <Video className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No results yet. Try a keyword above.</p>
                    </div> :

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {tkResults.map((res) =>
                      <div key={res.video_id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 space-y-3 bg-white">
                          <div className="aspect-[9/16] relative">
                            <img src={res.cover_url} alt={res.title} className="w-full h-full object-cover rounded" />
                          </div>
                          <h4 className="font-medium line-clamp-3 text-sm text-slate-800">{res.title}</h4>
                          <p className="text-xs text-slate-600">by {res.author_name}</p>
                          <div className="space-y-2">
                            <a href={res.web_video_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 inline-flex items-center gap-1 hover:underline">
                              <ExternalLink className="w-3 h-3" /> Open
                            </a>
                            <Button onClick={() => handleInsertTikTokAndSave(res)} size="sm" className="bg-blue-900 text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md hover:bg-gray-800 flex-1">
                                <Plus className="w-4 h-4 mr-1" /> Insert
                              </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    }
                </div>

              </TabsContent>
            </Tabs>
          </div>
          {/* Right: Editor Pane - REMOVED */}
          {/* The entire right panel JSX block was here and is now removed */}
        </DialogContent>
      </Dialog>

      {/* NEW: Amazon Import Dialog (no username dropdown) */}
      <Dialog open={showAmazonImport} onOpenChange={setShowAmazonImport}>
        <DialogContent className="bg-white text-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle>Import from Amazon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="amazon-url" className="text-slate-700 mb-2 block">Amazon Product URL</Label>
              <Input
                id="amazon-url"
                placeholder="https://amazon.com/dp/B0123456789"
                value={amazonUrl}
                onChange={(e) => setAmazonUrl(e.target.value)}
                className="bg-white border-slate-300"
                disabled={isImportingAmazon}
              />
            </div>
            <div className="flex items-center text-sm text-slate-500">
              <span className="font-medium mr-1">Assigned to:</span>
              <span className="truncate">{globalUsername || "None Selected"}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAmazonImport}
                disabled={isImportingAmazon || !amazonUrl.trim() || (useWorkspaceScoping && !globalUsername)}
                className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
              >
                {isImportingAmazon ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Import Images
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAmazonImport(false);
                  setAmazonUrl("");
                }}
                disabled={isImportingAmazon}
                className="bg-white border-slate-300"
              >
                Cancel
              </Button>
            </div>
            {useWorkspaceScoping && !globalUsername && (
              <p className="text-xs text-red-500">Please select a workspace to import images.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog for delete confirmation - REMOVED from the outline, so removing it entirely */}
      {/* <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </>
  );
}
