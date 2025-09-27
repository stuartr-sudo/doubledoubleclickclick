
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle, SkipForward, ArrowRight, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { OnboardingStep } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";

export default function Welcome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [showPlagiarismDialog, setShowPlagiarismDialog] = useState(false);
  const [plagiarismConfirmed, setPlagiarismConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // Start at 0 for welcome video
  const [direction, setDirection] = useState(0); // 0: initial, 1: next, -1: prev

  useEffect(() => {
    loadUser();
    loadOnboardingSteps();
  }, []);

  // New function to load onboarding steps from the database
  const loadOnboardingSteps = async () => {
    try {
      // Fetch active onboarding steps, ordered by step_number
      const steps = await OnboardingStep.filter({ is_active: true }, "step_number");
      setOnboardingSteps(steps);
    } catch (error) {
      console.error("Error loading onboarding steps:", error);
      // Fallback to empty array if database fails to prevent app crash
      setOnboardingSteps([]);
      toast.error("Failed to load onboarding steps.");
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Check if user has already completed onboarding
      if (currentUser?.completed_tutorial_ids?.includes('welcome_onboarding')) {
        // Redirect to dashboard if already onboarded
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading user:", error);
      // If no user, redirect to home
      window.location.href = createPageUrl('Home');
    }
  };

  const handleNextStep = () => {
    const totalSteps = 1 + onboardingSteps.length; // 1 welcome video + onboarding steps
    if (currentStepIndex < totalSteps - 1) {
      setDirection(1);
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleMarkComplete = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStepIndex);
    setCompletedSteps(newCompleted);

    const totalSteps = 1 + onboardingSteps.length;
    if (currentStepIndex < totalSteps - 1) {
      // Go to the next step after a short delay
      setTimeout(() => {
        handleNextStep();
      }, 300);
    } else {
      // Last step completed, check if all steps are now complete to show dialog
      if (newCompleted.size === totalSteps) {
        setShowPlagiarismDialog(true);
      }
    }
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      if (user) {
        const currentCompleted = user.completed_tutorial_ids || [];
        // Add the welcome onboarding flag
        const updatedCompleted = Array.from(new Set([...currentCompleted, "welcome_onboarding"]));
        await User.updateMyUserData({ completed_tutorial_ids: updatedCompleted });
      }
      toast.success("Welcome to DoubleClick! Let's get started.");
      // Redirect to the dashboard after finishing
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
      toast.error("There was an issue saving your progress. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSkipOnboarding = async () => {
    setIsSubmitting(true); // Reuse submitting state for skip button
    try {
      if (user) {
        const currentCompleted = user.completed_tutorial_ids || [];
        const updatedCompleted = Array.from(new Set([...currentCompleted, "welcome_onboarding"]));
        await User.updateMyUserData({ completed_tutorial_ids: updatedCompleted });
      }
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
      toast.error("There was an issue. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Welcome video configuration - this can be made dynamic later via admin settings
  // IMPORTANT: For Loom, use the full iframe embed code here, not just the URL.
  // Example: `<div style="..."><iframe src="..."></iframe></div>`
  const welcomeVideoUrl = `<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="https://www.loom.com/embed/6283bf183f664505931be83229498c89?sid=6e695564-b9a5-4e36-8f7f-8c73b6342a29" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;

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

    return embedCode; // Return as-is if we can't parse it
  };

  // Calculate progress including welcome video
  const totalSteps = 1 + onboardingSteps.length; // 1 welcome video + onboarding steps
  const progressPercentage = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0;

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
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

  // Get current slide content
  const isWelcomeVideo = currentStepIndex === 0;
  const currentOnboardingStep = isWelcomeVideo ? null : onboardingSteps[currentStepIndex - 1];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to DoubleClick! 🎉
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Thank you for your purchase! Let's get you started with a quick tour.
          </p>

          {/* Progress Bar */}
          {totalSteps > 0 && (
            <div className="max-w-xl mx-auto mb-8">
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Progress</span>
                <span className="font-medium">Step {currentStepIndex + 1} of {totalSteps}</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          )}
        </div>

        {/* Single Video Carousel */}
        <div className="relative mb-12" style={{ minHeight: '550px' }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentStepIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
              className="absolute w-full"
            >
              <Card className="bg-slate-50 text-slate-800 rounded-lg shadow-sm border-2 border-slate-200 w-full max-w-xl mx-auto">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-sm font-medium">
                        {isWelcomeVideo ? "▶" : currentOnboardingStep?.step_number}
                      </div>
                      {isWelcomeVideo ? "Welcome Message" : currentOnboardingStep?.title}
                    </CardTitle>
                    <span className="text-sm text-slate-500">
                      {isWelcomeVideo ? "9 min" : currentOnboardingStep?.duration}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    {isWelcomeVideo 
                      ? "Get started with this welcome message from our team."
                      : currentOnboardingStep?.description
                    }
                  </p>
                  
                  {/* Video Display */}
                  <div className="mb-4">
                    <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                      {isWelcomeVideo ? (
                        welcomeVideoUrl ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: welcomeVideoUrl }}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-slate-400">
                              <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Welcome video will appear here</p>
                            </div>
                          </div>
                        )
                      ) : (
                        currentOnboardingStep?.loom_url ? (
                          <iframe
                            src={extractLoomEmbedUrl(currentOnboardingStep.loom_url)}
                            frameBorder="0"
                            webkitallowfullscreen="true"
                            mozallowfullscreen="true"
                            allowFullScreen
                            className="w-full h-full"
                          ></iframe>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-slate-400">
                              <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No video configured</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleMarkComplete}
                    variant={completedSteps.has(currentStepIndex) ? "outline" : "default"}
                    className="w-full"
                  >
                    {completedSteps.has(currentStepIndex) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between items-center px-4 -mt-8">
             <Button 
              variant="outline"
              size="icon"
              onClick={handlePrevStep} 
              disabled={currentStepIndex === 0}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              onClick={handleNextStep} 
              disabled={currentStepIndex === totalSteps - 1}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-md"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleSkipOnboarding}
            className="bg-blue-900 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-slate-300 hover:bg-slate-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Skipping..." : "Skip Onboarding"}
          </Button>

          {/* Only show continue button if all steps are completed */}
          {completedSteps.size === totalSteps && totalSteps > 0 && (
            <Button
              onClick={() => setShowPlagiarismDialog(true)}
              className="bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
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
  );
}
