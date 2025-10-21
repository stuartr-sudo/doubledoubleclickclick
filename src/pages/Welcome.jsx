
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { AppSettings } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlagiarismDialog, setShowPlagiarismDialog] = useState(false);
  const [plagiarismConfirmed, setPlagiarismConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState("");
  const [videoWatched, setVideoWatched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    loadWelcomeVideo();
  }, []);

  // Robustly hide any "Skip for Now" (or "Skip") buttons/links, even if rendered later
  useEffect(() => {
    const hideSkipEls = () => {
      const candidates = document.querySelectorAll('button, a, [role="button"]');
      candidates.forEach((el) => {
        const txt = ((el.innerText || el.textContent || "") + "").replace(/\s+/g, " ").trim().toLowerCase();
        // match common variations
        const isSkip =
          txt === "skip for now" ||
          txt === "skip" ||
          txt.startsWith("skip for now") ||
          txt.includes("skip for now");
        const hintAttr =
          (el.getAttribute("data-testid") || "").toLowerCase().includes("skip") ||
          (el.getAttribute("aria-label") || "").toLowerCase().includes("skip");
        if (isSkip || hintAttr) {
          el.style.display = "none";
          el.setAttribute("aria-hidden", "true");
          // safety: prevent interactions if display change is overridden by external styles
          el.style.pointerEvents = "none";
        }
      });
    };

    // Initial run
    hideSkipEls();

    // Watch for dynamic renders
    const observer = new MutationObserver(() => hideSkipEls());
    observer.observe(document.body, { childList: true, subtree: true });

    // Occasional sweep in case of portal-based renders
    const intervalId = window.setInterval(hideSkipEls, 500);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Check if user has already completed onboarding
      if (currentUser?.completed_tutorial_ids?.includes('welcome_onboarding')) {
        // Redirect to dashboard if already onboarded
        navigate(createPageUrl('Dashboard'));
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading user:", error);
      // If no user, redirect to home
      navigate(createPageUrl('Home'));
    }
  };

  const loadWelcomeVideo = async () => {
    try {
      const settings = await AppSettings.list();
      const welcomeSetting = settings.find(s => s.key === "welcome_onboarding_video");
      if (welcomeSetting?.value) {
        setWelcomeVideoUrl(welcomeSetting.value);
      }
    } catch (error) {
      console.error("Error loading welcome video:", error);
    }
  };

  const handleMarkAsWatched = () => {
    setVideoWatched(true);
    setShowPlagiarismDialog(true);
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      console.log('Starting onboarding completion...', { user });
      
      if (user) {
        const currentCompleted = user.completed_tutorial_ids || [];
        const updatedCompleted = Array.from(new Set([...currentCompleted, "welcome_onboarding"]));
        
        console.log('Attempting to update user with:', { completed_tutorial_ids: updatedCompleted });
        
        const updatedUser = await User.updateMe({ completed_tutorial_ids: updatedCompleted });
        
        console.log('Update successful:', updatedUser);
      }
      
      toast.success("Welcome complete! Let's get you started.");
      
      // Redirect to GettingStarted
      console.log('Navigating to GettingStarted...');
      navigate(createPageUrl('GettingStarted'));
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error(`There was an issue: ${error.message}. Please try again.`);
      setIsSubmitting(false);
    }
  };

  const handleSkipOnboarding = async () => {
    setIsSubmitting(true);
    try {
      if (user) {
        const currentCompleted = user.completed_tutorial_ids || [];
        // Mark both welcome and getting_started as complete when skipping
        const updatedCompleted = Array.from(new Set([
          ...currentCompleted, 
          "welcome_onboarding",
          "getting_started_scrape"
        ]));
        await User.updateMe({ completed_tutorial_ids: updatedCompleted });
      }
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
      toast.error("There was an issue. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Setting up your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 80% scale wrapper to keep everything above the fold without changing layout structure */}
      <div
        style={{
          transform: "scale(0.8)",
          transformOrigin: "top center",
          width: "125%", // To make the content fit within the original viewport width after scaling down
          minHeight: `calc(100vh / 0.8)`, // Ensure content is not cut off vertically if it relied on min-h-screen
          position: 'relative', // Needed for transform origin to work as expected relative to its space
          left: '-12.5%', // Center the 125% width element, so after scaling it appears centered at 100% width
        }}
      >
        <div className="min-h-screen bg-white text-slate-900">
          <div className="container mx-auto px-6 py-12 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                Welcome to DoubleClick! 🎉
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Thank you for your purchase! Let's get you started with a quick introduction.
              </p>
            </div>

            {/* Single Video Card */}
            <Card className="bg-slate-50 text-slate-800 rounded-lg shadow-sm border-2 border-slate-200 w-full max-w-4xl mx-auto mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-sm font-medium">
                    ▶
                  </div>
                  Welcome Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Get started with this welcome message from our team.
                </p>
                
                {/* Video Display */}
                <div className="mb-4">
                  <div className="bg-slate-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                    {welcomeVideoUrl ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: welcomeVideoUrl }}
                        className="w-full h-full [&>div]:w-full [&>div]:h-full [&_iframe]:w-full [&_iframe]:h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-slate-400">
                          <p className="text-sm">Welcome video will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={handleMarkAsWatched}
                  disabled={videoWatched}
                  variant={videoWatched ? "outline" : "default"}
                  className="w-full"
                >
                  {videoWatched ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Video Watched
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      I've Watched the Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {/* The skip button will be hidden by the useEffect hook */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleSkipOnboarding}
                className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-slate-300 hover:bg-slate-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Skipping..." : "Skip for Now"}
              </Button>
            </div>

            {/* Plagiarism Confirmation Dialog */}
            <Dialog open={showPlagiarismDialog} onOpenChange={setShowPlagiarismDialog}>
              <DialogContent className="max-w-2xl bg-white text-slate-900">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                    Content Guidelines
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Creating Great Content Together</h3>
                    <div className="space-y-3 text-slate-700">
                      <p>
                        To help you create amazing content, we'd like you to keep these simple guidelines in mind:
                      </p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Create original content that represents your unique voice and perspective</li>
                        <li>When you reference or quote others' work, always give them proper credit</li>
                        <li>Feel free to draw inspiration from others, but make it your own</li>
                        <li>Respect copyright and intellectual property - it's good practice for everyone</li>
                      </ul>
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mt-4">
                        <p className="text-slate-700">
                          <strong>Please note:</strong> Following these guidelines helps maintain a high-quality platform for everyone. Accounts that repeatedly violate these policies may be suspended to protect our community.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="plagiarism-confirm"
                      checked={plagiarismConfirmed}
                      onCheckedChange={setPlagiarismConfirmed}
                      className="mt-1"
                    />
                    <label htmlFor="plagiarism-confirm" className="text-sm leading-relaxed cursor-pointer">
                      I understand these content guidelines and agree to create original content while giving proper credit when referencing others' work.
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPlagiarismDialog(false)}
                      className="border-slate-300 text-slate-700"
                      disabled={isSubmitting}
                    >
                      Go Back
                    </Button>
                    <Button
                      onClick={handleFinishOnboarding}
                      disabled={!plagiarismConfirmed || isSubmitting}
                      className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          I Understand - Start Using DoubleClick
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
}
