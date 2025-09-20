import React, { useState, useEffect } from "react";
import { YouTubeVideo } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Trash2, Search, Plus } from "lucide-react";
import { toast } from "sonner";

export default function YouTubeManager() {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const fetchedVideos = await YouTubeVideo.list("-created_date");
      setVideos(fetchedVideos);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVideo = async (video) => {
    if (!confirm(`Delete "${video.title}"?`)) return;
    
    try {
      await YouTubeVideo.delete(video.id);
      toast.success("Video deleted successfully");
      loadVideos();
    } catch (error) {
      toast.error("Failed to delete video");
      console.error("Error deleting video:", error);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
              YouTube Video Library
            </h1>
            <p className="text-white/70 mt-1">Manage your saved YouTube videos</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-white/60">Loading videos...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Video className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p>No videos found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
              <div key={video.id} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-4">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
                <h3 className="text-white font-medium mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-white/60 text-sm mb-3 line-clamp-2">{video.description}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => deleteVideo(video)}
                    variant="destructive"
                    size="sm"
                    className="bg-red-900/50 text-red-400 border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}