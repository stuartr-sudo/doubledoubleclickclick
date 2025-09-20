import React, { useState, useEffect } from "react";
import { GeneratedVideo } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Trash2, Video, Loader2 } from "lucide-react";
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

export default function VideoLibrary() {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        const allVideos = await GeneratedVideo.list("-created_date");
        
        let userSpecificVideos = [];
        let usernamesForFilter = [];

        if (user.role === 'admin') {
          userSpecificVideos = allVideos;
          usernamesForFilter = [...new Set(allVideos.map(v => v.user_name).filter(Boolean))].sort();
        } else if (user.assigned_usernames && user.assigned_usernames.length > 0) {
          userSpecificVideos = allVideos.filter(video => 
            video.user_name && user.assigned_usernames.includes(video.user_name)
          );
          usernamesForFilter = [...user.assigned_usernames].sort();
        }
        
        setVideos(userSpecificVideos);
        setAvailableUsernames(usernamesForFilter);
      } catch (error) {
        console.error("Error loading video library:", error);
        toast.error("Failed to load video library.");
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleDelete = (video) => {
    setVideoToDelete(video);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    try {
      await GeneratedVideo.delete(videoToDelete.id);
      setVideos(videos.filter(v => v.id !== videoToDelete.id));
      toast.success("Video deleted successfully.");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video.");
    } finally {
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    }
  };

  const filteredVideos = videos
    .filter(video => selectedUsername === "all" || video.user_name === selectedUsername)
    .filter(video => video.prompt?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-400" />
            AI Video Library
          </h1>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by prompt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white"
              />
            </div>
            {(availableUsernames.length > 0 || currentUser?.role === 'admin') && (
              <div>
                <Label htmlFor="username-select" className="sr-only">Filter by Username</Label>
                <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                  <SelectTrigger id="username-select" className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Filter by username..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    <SelectItem value="all">
                      {currentUser?.role === 'admin' ? 'All Users' : 'All Assigned Usernames'}
                    </SelectItem>
                    {availableUsernames.map(username => (
                      <SelectItem key={username} value={username}>{username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-white/10">
            <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold">No Videos Found</h3>
            <p className="text-gray-400 mt-2">Generate some videos in the editor to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <div key={video.id} className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="bg-black">
                  <video controls preload="metadata" className="w-full aspect-video">
                    <source src={video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-sm text-gray-300 italic flex-grow line-clamp-3">"{video.prompt}"</p>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Model: {video.model}</span>
                      <span>User: {video.user_name}</span>
                    </div>
                    <Button onClick={() => handleDelete(video)} variant="destructive" size="sm" className="w-full mt-3">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-800 border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The video will be permanently removed from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}