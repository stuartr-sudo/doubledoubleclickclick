import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Helper function to extract Loom video ID from various URL formats
const extractLoomVideoId = (url) => {
  if (!url) return null;

  // Handle different Loom URL formats:
  // https://www.loom.com/share/1b4ebd4a270a4ecfbddd2f57daf38afa
  // https://www.loom.com/embed/1b4ebd4a270a4ecfbddd2f57daf38afa?sid=...
  const patterns = [
    /loom\.com\/share\/([a-f0-9]+)/i,
    /loom\.com\/embed\/([a-f0-9]+)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Helper function to extract iframe src from full embed code
const extractLoomEmbedUrl = (embedCode) => {
  if (!embedCode) return null;
  
  // If it's already just a URL, return it
  if (embedCode.startsWith('https://www.loom.com/embed/')) {
    return embedCode;
  }
  
  // Extract iframe src from full embed HTML
  const iframeSrcMatch = embedCode.match(/src="([^"]+)"/);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    return iframeSrcMatch[1];
  }
  
  return null;
};

// Helper function to extract YouTube video ID
const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2] && match[2].length === 11 ? match[2] : null;
};

export default function VideoModal({ isOpen, onClose, videoUrl, title = "Tutorial Video" }) {
  if (!isOpen || !videoUrl) return null;

  const youtubeVideoId = extractYouTubeVideoId(videoUrl);
  const loomEmbedUrl = extractLoomEmbedUrl(videoUrl);

  let embedUrl = '';
  let embedHtml = '';

  if (youtubeVideoId) {
    // YouTube embed
    embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}`;
    embedHtml = `
      <iframe 
        src="${embedUrl}" 
        title="${title}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        referrerpolicy="strict-origin-when-cross-origin" 
        allowfullscreen
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
      ></iframe>
    `;
  } else if (loomEmbedUrl) {
    // Loom embed
    embedHtml = `
      <iframe 
        src="${loomEmbedUrl}" 
        title="${title}"
        frameborder="0" 
        webkitallowfullscreen 
        mozallowfullscreen 
        allowfullscreen
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
      ></iframe>
    `;
  } else if (videoUrl.includes('<div') && videoUrl.includes('iframe')) {
    // Handle raw Loom embed code directly
    embedHtml = videoUrl;
  }

  if (!embedHtml) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invalid Video URL</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-slate-600">
              This video URL format is not supported. Please use a YouTube or Loom video URL.
            </p>
          </div>
          <div className="flex justify-end p-4 border-t">
            <Button variant="outline" onClick={onClose} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
          <div
            dangerouslySetInnerHTML={{ __html: embedHtml }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
        <div className="p-4 border-t">
          <h3 className="text-slate-50 font-medium">{title}</h3>
          <div className="flex justify-end mt-2">
            <Button variant="outline" onClick={onClose} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}