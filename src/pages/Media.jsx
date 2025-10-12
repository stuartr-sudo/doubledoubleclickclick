import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Youtube, Video } from "lucide-react";
import ImageLibrary from "./ImageLibrary";
import YouTubeManager from "./YouTubeManager";
import TiktokAIGenerator from "./TiktokAIGenerator";

export default function Media() {
  const [activeTab, setActiveTab] = useState("images");

  // Check URL params for initial tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['images', 'youtube', 'tiktok'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Media Library</h1>
          <p className="text-slate-600 mt-2">Manage your images, videos, and media assets</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 p-1 h-12 mb-6">
            <TabsTrigger 
              value="images" 
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger 
              value="youtube" 
              className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800 flex items-center gap-2"
            >
              <Youtube className="w-4 h-4" />
              YouTube
            </TabsTrigger>
            <TabsTrigger 
              value="tiktok" 
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              TikTok
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="mt-0">
            <ImageLibrary />
          </TabsContent>

          <TabsContent value="youtube" className="mt-0">
            <YouTubeManager />
          </TabsContent>

          <TabsContent value="tiktok" className="mt-0">
            <TiktokAIGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}