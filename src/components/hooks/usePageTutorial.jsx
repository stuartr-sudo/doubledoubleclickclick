import { useState, useEffect } from 'react';
import { TutorialVideo } from '@/api/entities';
import { User } from '@/api/entities';

/**
 * Hook to manage page-specific tutorial videos
 * Auto-shows tutorial video on first visit to a page
 * 
 * @param {string} pageName - The name of the current page (must match assigned_page_name in TutorialVideo)
 * @returns {Object} - { showVideo, videoUrl, closeVideo, hasSeenTutorial }
 */
export default function usePageTutorial(pageName) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!pageName) {
      setIsChecking(false);
      return;
    }

    const checkAndShowTutorial = async () => {
      try {
        // Get current user
        const user = await User.me();
        const completedIds = user.completed_tutorial_ids || [];
        
        // Create a unique ID for this page's tutorial
        const tutorialId = `page_tutorial_${pageName}`;
        
        // Check if user has already seen this page's tutorial
        if (completedIds.includes(tutorialId)) {
          setHasSeenTutorial(true);
          setIsChecking(false);
          return;
        }

        // Fetch tutorial video for this page
        const videos = await TutorialVideo.filter({
          assigned_page_name: pageName,
          is_active: true
        });

        if (videos.length > 0) {
          const video = videos[0]; // Take the first active video for this page
          setVideoUrl(video.video_url);
          setVideoTitle(video.title || `${pageName} Tutorial`);
          setShowVideo(true); // Auto-show on first visit
        }
        
        setHasSeenTutorial(false);
      } catch (error) {
        console.error('Error checking page tutorial:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAndShowTutorial();
  }, [pageName]);

  const closeVideo = async () => {
    setShowVideo(false);
    
    // Mark this page's tutorial as seen
    try {
      const user = await User.me();
      const completedIds = user.completed_tutorial_ids || [];
      const tutorialId = `page_tutorial_${pageName}`;
      
      if (!completedIds.includes(tutorialId)) {
        await User.updateMyUserData({
          completed_tutorial_ids: [...completedIds, tutorialId]
        });
        setHasSeenTutorial(true);
      }
    } catch (error) {
      console.error('Error marking tutorial as seen:', error);
    }
  };

  return {
    showVideo,
    videoUrl,
    videoTitle,
    closeVideo,
    hasSeenTutorial,
    isChecking
  };
}