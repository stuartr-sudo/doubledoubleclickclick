import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Trash2, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import VideoModal from '@/components/common/VideoModal';

export default function TutorialCard({ tutorial, isCompleted, onToggleComplete, onDelete, onToggleVisibility, isAdmin }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine which video URL to use (prefer Loom if available)
  const videoUrl = tutorial.loom_url || tutorial.youtube_url;

  return (
    <>
      <div className={`bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all ${!tutorial.is_active && isAdmin ? 'opacity-60' : ''}`}>
        <div className="flex flex-col h-full">
          {/* Admin Controls - Show for ALL tutorials when user is admin */}
          {isAdmin && (
            <div className="flex justify-end mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2" title={tutorial.is_active ? "Visible to users" : "Hidden from users"}>
                  <Switch
                    id={`visibility-toggle-${tutorial.id}`}
                    checked={tutorial.is_active}
                    onCheckedChange={() => onToggleVisibility && onToggleVisibility(tutorial)}
                  />
                  <Label htmlFor={`visibility-toggle-${tutorial.id}`} className="text-sm text-slate-600 cursor-pointer">
                    {tutorial.is_active ? 'Visible' : 'Hidden'}
                  </Label>
                </div>
                {onDelete && tutorial.type === 'manual' && (
                  <Button
                    onClick={() => onDelete(tutorial.id)}
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete manual tutorial">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Title and Status */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-slate-900 flex-1">
              {tutorial.title}
            </h3>
            <div className="flex flex-col items-end gap-1">
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1.5" />
                  Completed
                </Badge>
              )}
              {!tutorial.is_active && isAdmin && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  Hidden
                </Badge>
              )}
              {tutorial.type === 'feature_flag' && isAdmin && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Auto-Generated
                </Badge>
              )}
            </div>
          </div>
          
          {/* Description */}
          <div className="flex-1 mb-6">
            <p className="text-slate-600 text-sm leading-relaxed">
              {tutorial.description || 'Learn how to use this feature effectively.'}
            </p>
          </div>
          
          {/* Bottom section with buttons */}
          <div className="flex justify-between items-center mt-auto">
            <div className="flex items-center gap-2">
              {videoUrl && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Watch Video
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {videoUrl && (
        <VideoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          videoUrl={videoUrl}
          title={tutorial.title}
          isCompleted={isCompleted}
        />
      )}
    </>
  );
}