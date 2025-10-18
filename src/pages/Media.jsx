
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
          {/* REPLACED TabsList with a custom single-row segmented header for 3 tabs */}
          <div className="mb-6">
            <div className="bg-slate-200 p-1 rounded-xl grid grid-cols-3 gap-2 border border-slate-200 h-12 shadow-sm">
              <TabsTrigger
                value="images"
                className="w-full h-10 rounded-lg flex items-center justify-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">

                <ImageIcon className="w-4 h-4" />
                Images
              </TabsTrigger>
              <TabsTrigger
                value="youtube"
                className="w-full h-10 rounded-lg flex items-center justify-center gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-800">

                <Youtube className="w-4 h-4" />
                YouTube
              </TabsTrigger>
              <TabsTrigger
                value="tiktok"
                className="w-full h-10 rounded-lg flex items-center justify-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800">

                <Video className="w-4 h-4" />
                TikTok
              </TabsTrigger>
            </div>
          </div>

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
    </div>);

}