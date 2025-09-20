
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Video, Wand2, Sparkles, ChevronDown, ToggleLeft, ToggleRight } from "lucide-react";
import { generateVideoFalAi } from "@/api/functions";
import { generateEnhancedPrompt } from "@/api/functions";
import { GeneratedVideo } from "@/api/entities"; // Still needed for background save if parent component uses it, but not directly by modal anymore
import { User } from "@/api/entities";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { generateKeiVideo } from "@/api/functions";
import { generateVeo3Video } from "@/api/functions";
import { generateRunwayVideo } from "@/api/functions";

export default function VideoGeneratorModal({ isOpen, onClose, onInsert, seedPrompt = "", onQueueJob }) {
  // General State
  const [prompt, setPrompt] = useState("");
  const [falAiVideoModel, setFalAiVideoModel] = useState("fal-ai/bytedance/seedance/v1/pro/text-to-video");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  // REMOVED: generatedVideoUrl, finalPrompt, polling, requestId, taskId states
  const [assignToUsername, setAssignToUsername] = useState("");
  const [assignmentUsernames, setAssignmentUsernames] = useState([]);
  const [videoProvider, setVideoProvider] = useState("fal_ai"); // 'fal_ai' | 'kei_ai' | 'kei_veo3' | 'kei_runway'

  // Kei AI specific
  const [keiVideoModel, setKeiVideoModel] = useState(""); // free-text model
  const [keiEndpointPath, setKeiEndpointPath] = useState("/v1/videos/generate");
  const [keiAdvancedParams, setKeiAdvancedParams] = useState(""); // JSON

  // Veo3 specific state
  const [veoModel, setVeoModel] = useState("veo3");
  const [veoAspect, setVeoAspect] = useState("16:9");
  const [veoImageUrls, setVeoImageUrls] = useState(""); // comma-separated
  const [veoCallbackUrl, setVeoCallbackUrl] = useState("");
  // REMOVED: veoTaskId

  // Runway specific state
  const [runwayQuality, setRunwayQuality] = useState("720p");
  const [runwayDuration, setRunwayDuration] = useState(5);
  const [runwayAspect, setRunwayAspect] = useState("16:9");
  const [runwayImageUrl, setRunwayImageUrl] = useState("");
  const [runwayWatermark, setRunwayWatermark] = useState("");
  const [runwayCallbackUrl, setRunwayCallbackUrl] = useState("");
  // REMOVED: runwayTaskId

  // Prompt Enhancer State
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [enhancerStyle, setEnhancerStyle] = useState("Simple");
  const [enhancerCameraStyle, setEnhancerCameraStyle] = useState("None");
  const [enhancerCameraDirection, setEnhancerCameraDirection] = useState("None");
  const [enhancerPacing, setEnhancerPacing] = useState("None");
  const [enhancerSpecialEffects, setEnhancerSpecialEffects] = useState("None");
  const [enhancerPromptLength, setEnhancerPromptLength] = useState("Medium");
  const [showAdvancedEnhancer, setShowAdvancedEnhancer] = useState(false);

  // VEO Model State
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [generateAudio, setGenerateAudio] = useState(true);

  // Seedance Model State
  const [duration, setDuration] = useState(5);
  const [cameraFixed, setCameraFixed] = useState(false);

  // Legacy Model State
  const [motionLevel, setMotionLevel] = useState(127);
  const [cameraMovement, setCameraMovement] = useState("none");
  const [videoLength, setVideoLength] = useState(25);
  
  const isVEOModel = falAiVideoModel.includes('veo');
  const isSeedanceModel = falAiVideoModel.includes('bytedance');

  // Constants for dropdowns
  const enhancerStyles = ["Minimalist", "Simple", "Detailed", "Descriptive", "Dynamic", "Cinematic", "Documentary", "Animation", "Action", "Experimental"];
  const cameraStyles = ["None", "Steadicam flow", "Drone aerials", "Handheld urgency", "Crane elegance", "Dolly precision", "VR 360", "Multi-angle rig", "Static tripod", "Gimbal smoothness", "Slider motion", "Jib sweep", "POV immersion", "Time-slice array", "Macro extreme", "Tilt-shift miniature", "Snorricam character", "Whip pan dynamics", "Dutch angle tension", "Underwater housing", "Periscope lens"];
  const cameraDirections = ["None", "Zoom in", "Zoom out", "Pan left", "Pan right", "Tilt up", "Tilt down", "Orbital rotation", "Push in", "Pull out", "Track forward", "Track backward", "Spiral in", "Spiral out", "Arc movement", "Diagonal traverse", "Vertical rise", "Vertical descent"];
  const pacingOptions = ["None", "Slow burn", "Rhythmic pulse", "Frantic energy", "Ebb and flow", "Hypnotic drift", "Time-lapse rush", "Stop-motion staccato", "Gradual build", "Quick cut rhythm", "Long take meditation", "Jump cut energy", "Match cut flow", "Cross-dissolve dreamscape", "Parallel action", "Slow motion impact", "Ramping dynamics", "Montage tempo", "Continuous flow", "Episodic breaks"];
  const specialEffectsOptions = ["None", "CGI enhancement", "Analog glitches", "Light painting", "Projection mapping", "Nanosecond exposures", "Double exposure", "Smoke diffusion", "Lens flare artistry", "Particle systems", "Holographic overlay", "Chromatic aberration", "Digital distortion", "Wire removal", "Motion capture", "Miniature integration", "Weather simulation", "Color grading", "Mixed media composite", "Neural style transfer"];
  const promptLengths = ["Short", "Medium", "Long"];

  const getAspectRatioOptions = (model) => {
    if (model.includes('veo')) {
      return ["16:9", "9:16", "1:1"];
    }
    if (model.includes('seedance/v1/pro')) {
      return ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"];
    }
    if (model.includes('seedance/v1/lite')) {
      return ["16:9", "4:3", "1:1", "3:4", "9:16", "9:21"];
    }
    if (model.includes('damo')) {
      return ["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3"];
    }
    return ["16:9"]; // Default
  };
  const aspectRatios = getAspectRatioOptions(falAiVideoModel);

  // when opening, prefill the prompt with the selected text (if any)
  useEffect(() => {
    if (isOpen) {
      setPrompt((seedPrompt || "").trim());
      setGenerationStatus(""); // Clear previous status
      setIsGenerating(false); // Reset generating state
      // REMOVED: setGeneratedVideoUrl, setFinalPrompt, setPolling, setRequestId, setVeoTaskId, setRunwayTaskId
    }
  }, [isOpen, seedPrompt]);

  React.useEffect(() => {
    if (isOpen) {
        const loadUser = async () => {
            try {
                const user = await User.me();
                let assignNames = [];
                if (user.role === 'admin') {
                    const allUsers = await User.list();
                    assignNames = Array.from(new Set(allUsers.flatMap(u => u.assigned_usernames || []))).sort();
                } else {
                    assignNames = user.assigned_usernames || [];
                }
                setAssignmentUsernames(assignNames);
                setAssignToUsername(assignNames[0] || "");
            } catch (e) { console.error("Failed to load user for video generator", e)}
        };
        loadUser();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!aspectRatios.includes(aspectRatio) && videoProvider === 'fal_ai') { // Only update if Fal.ai is selected
      setAspectRatio(aspectRatios[0]);
    }
  }, [falAiVideoModel, aspectRatios, videoProvider]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !assignToUsername) {
      toast.error("Please enter a prompt and select a username.");
      return;
    }
    setIsGenerating(true);
    setGenerationStatus("Starting job...");
    let usedPrompt = prompt;

    try {
      if (enhancePrompt) {
        setGenerationStatus("Enhancing prompt...");
        const { data: enhancedData } = await generateEnhancedPrompt({
          input_concept: prompt,
          style: enhancerStyle,
          camera_style: enhancerCameraStyle,
          camera_direction: enhancerCameraDirection,
          pacing: enhancerPacing,
          special_effects: enhancerSpecialEffects,
          prompt_length: enhancerPromptLength,
        });
        if (enhancedData.error) throw new Error(enhancedData.error);
        usedPrompt = enhancedData.prompt;
        toast.success("Prompt enhanced successfully!");
      }
      
      let jobDetails = { prompt: usedPrompt, type: 'video', username: assignToUsername };

      if (videoProvider === "kei_runway") {
        // Optional guard for 1080p/8s
        if (runwayQuality === "1080p" && runwayDuration !== 5) {
          toast.message("1080p is only available for 5-second videos. Setting duration to 5s.");
          setRunwayDuration(5); // Update state to reflect change
        }
        const durationToUse = runwayQuality === "1080p" ? 5 : runwayDuration;

        setGenerationStatus("Submitting Runway job...");
        const { data } = await generateRunwayVideo({
          prompt: usedPrompt,
          duration: durationToUse,
          quality: runwayQuality,
          aspectRatio: runwayAspect,
          waterMark: runwayWatermark || undefined,
          ...(runwayImageUrl.trim() ? { imageUrl: runwayImageUrl.trim() } : {}),
          ...(runwayCallbackUrl.trim() ? { callBackUrl: runwayCallbackUrl.trim() } : {}),
        });

        const taskId = data?.taskId;
        if (!taskId) {
          throw new Error(data?.error || "Runway did not return a taskId.");
        }
        jobDetails = { 
          ...jobDetails,
          provider: 'kei_runway', 
          taskId, 
          modelName: 'runway', 
          duration: durationToUse, 
          quality: runwayQuality, 
          aspectRatio: runwayAspect, 
          imageUrl: runwayImageUrl, 
          watermark: runwayWatermark, 
          callbackUrl: runwayCallbackUrl,
          // Add any other specific parameters needed for polling/saving
        };

      } else if (videoProvider === "kei_ai") {
        setGenerationStatus("Submitting Kei AI video job...");

        // Merge advanced JSON params if any
        let extraParams = {};
        if (keiAdvancedParams && keiAdvancedParams.trim().length > 0) {
          try {
            extraParams = JSON.parse(keiAdvancedParams);
          } catch {
            throw new Error("Invalid JSON in Kei AI Advanced Params. Please fix the JSON and try again.");
          }
        }

        const { data: vidData } = await generateKeiVideo({
          prompt: usedPrompt,
          model: keiVideoModel || undefined, // undefined if empty string, so it's not sent
          duration: duration ? String(duration) : undefined, // Convert to string as expected by some APIs
          params: {
            ...extraParams
          },
          endpointPath: keiEndpointPath || "/v1/videos/generate",
        });

        const maybeRequestId = vidData?.job_id || vidData?.id || vidData?.data?.job_id;
        const maybeUrl = vidData?.url || vidData?.video_url || vidData?.data?.url || vidData?.data?.video_url;
        
        // If a direct URL is returned, still treat it as a completed job to queue
        if (maybeUrl) {
            jobDetails = { 
                ...jobDetails, 
                provider: 'kei_ai', 
                url: maybeUrl, 
                modelName: keiVideoModel || 'kei-ai',
                status: 'COMPLETED'
            };
        } else if (maybeRequestId) {
            jobDetails = { 
                ...jobDetails, 
                provider: 'kei_ai', 
                taskId: maybeRequestId, 
                modelName: keiVideoModel || 'kei-ai',
                endpointPath: keiEndpointPath,
                duration: duration,
                params: extraParams
            };
        } else {
            throw new Error("Kei AI did not return a URL or job_id.");
        }

      } else if (videoProvider === "kei_veo3") {
        setGenerationStatus("Submitting Veo3 job...");

        const images = (veoImageUrls || "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        const { data } = await generateVeo3Video({
          prompt: usedPrompt,
          model: veoModel || "veo3",
          aspectRatio: veoAspect || "16:9",
          imageUrls: images.length ? images : undefined,
          callBackUrl: veoCallbackUrl || undefined,
        });

        const taskId = data?.taskId || data?.raw?.data?.taskId;
        if (!taskId) {
          throw new Error(data?.error || "Veo3 did not return a taskId.");
        }
        jobDetails = { 
            ...jobDetails, 
            provider: 'kei_veo3', 
            taskId, 
            modelName: veoModel, 
            aspectRatio: veoAspect, 
            imageUrls: images, 
            callbackUrl: veoCallbackUrl
        };
      } else { // Fal.ai logic
        setGenerationStatus("Submitting video job...");

        let payload = { prompt: usedPrompt, model: falAiVideoModel };
        if (isVEOModel) {
          payload = { ...payload, aspect_ratio: aspectRatio, resolution, generate_audio: generateAudio };
        } else if (isSeedanceModel) {
          payload = { ...payload, aspect_ratio: aspectRatio, resolution, duration: String(duration), camera_fixed: cameraFixed };
        } else { // Damo
          payload = { ...payload, aspect_ratio: aspectRatio, motion_bucket_id: motionLevel, num_frames: videoLength, camera_movement: cameraMovement };
        }
        
        const { data: videoData } = await generateVideoFalAi(payload);

        if (videoData?.error) throw new Error(videoData.error);
        
        const maybeRequestId = videoData?.request_id || videoData?.id || videoData?.job_id;
        
        if (!maybeRequestId) {
            // Some APIs return 202 or 200 with no clear markers; be permissive
            toast.message("Generation started. No immediate job ID, but it should be processing.", { duration: 3000 });
            throw new Error("Fal.ai did not return a request_id.");
        }
        
        jobDetails = { 
            ...jobDetails, 
            provider: 'fal_ai', 
            taskId: maybeRequestId, 
            modelName: falAiVideoModel,
            // Include fal-specific params for potential polling/reconstruction later
            falParams: payload
        };
      }

      onQueueJob(jobDetails); // Pass the job details to the parent component/queue
      onClose(); // Close modal immediately upon successful job submission
      toast.success("Video generation job submitted successfully! You will be notified when it's ready.");

    } catch (error) {
      console.error("Video generation error:", error);
      let userFriendlyError = error.message;
      if (userFriendlyError.includes("Exhausted balance")) {
          userFriendlyError = "Your Fal.ai account has run out of credits. Please top up your balance at fal.ai/dashboard/billing.";
      }
      toast.error(`Failed to start video generation: ${userFriendlyError}`, { duration: 10000 });
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  const handleClose = () => {
    setPrompt("");
    setIsGenerating(false);
    setGenerationStatus("");
    setEnhancePrompt(false);
    // REMOVED: generatedVideoUrl, finalPrompt, polling, requestId, veoTaskId, runwayTaskId
    setRunwayQuality("720p"); // Reset Runway specific state
    setRunwayDuration(5);
    setRunwayAspect("16:9");
    setRunwayImageUrl("");
    setRunwayWatermark("");
    setRunwayCallbackUrl("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl backdrop-blur-xl bg-slate-800/95 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            AI Video Generator
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Generate a short video from a text description with advanced controls. The video will be generated in the background.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[75vh] overflow-y-auto pr-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-6 shadow-sm space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">Assign to Username</Label>
              <Select value={assignToUsername} onValueChange={setAssignToUsername}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select a username..." />
                  </SelectTrigger>
                  <SelectContent>
                      {assignmentUsernames.map(username => <SelectItem key={username} value={username}>{username}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>

            {/* Provider select */}
            <div>
              <Label className="block text-sm font-medium mb-2">Provider</Label>
              <Select value={videoProvider} onValueChange={setVideoProvider}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fal_ai">Fal.ai</SelectItem>
                  <SelectItem value="kei_ai">Kei AI (Generic)</SelectItem>
                  <SelectItem value="kei_veo3">Kei Veo3</SelectItem>
                  <SelectItem value="kei_runway">Kei Runway</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Your Idea / Prompt</Label>
              <Textarea
                id="video-prompt"
                placeholder="e.g., A teddy bear riding a bicycle through a sunlit meadow"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg p-3 bg-slate-700/50">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <Label htmlFor="enhance-prompt-toggle" className="font-medium flex-grow">Enhance Prompt with AI</Label>
              <Button
                  variant="ghost"
                  size="icon"
                  id="enhance-prompt-toggle"
                  onClick={() => setEnhancePrompt(!enhancePrompt)}
              >
                  {enhancePrompt ? <ToggleRight className="text-green-400"/> : <ToggleLeft className="w-8 h-8"/>}
              </Button>
            </div>

            {enhancePrompt && (
              <div className="space-y-4 border-l-2 border-yellow-400/50 pl-4 ml-2">
                <div>
                    <Label className="block text-sm font-medium mb-2">Style</Label>
                    <Select value={enhancerStyle} onValueChange={setEnhancerStyle}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue/></SelectTrigger>
                        <SelectContent>{enhancerStyles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <Button variant="link" size="sm" onClick={() => setShowAdvancedEnhancer(!showAdvancedEnhancer)} className="text-blue-400 pl-0">
                    {showAdvancedEnhancer ? 'Hide' : 'Show'} Advanced Options <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvancedEnhancer ? 'rotate-180' : ''}`} />
                </Button>
                {showAdvancedEnhancer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                        <div>
                            <Label className="block text-sm font-medium mb-2">Camera Style</Label>
                            <Select value={enhancerCameraStyle} onValueChange={setEnhancerCameraStyle}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue/></SelectTrigger>
                                <SelectContent>{cameraStyles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block text-sm font-medium mb-2">Camera Direction</Label>
                            <Select value={enhancerCameraDirection} onValueChange={setEnhancerCameraDirection}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue/></SelectTrigger>
                                <SelectContent>{cameraDirections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block text-sm font-medium mb-2">Pacing</Label>
                            <Select value={enhancerPacing} onValueChange={setEnhancerPacing}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue/></SelectTrigger>
                                <SelectContent>{pacingOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block text-sm font-medium mb-2">Special Effects</Label>
                            <Select value={enhancerSpecialEffects} onValueChange={setEnhancerSpecialEffects}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue/></SelectTrigger>
                                <SelectContent>{specialEffectsOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block text-sm font-medium mb-2">Prompt Length</Label>
                            <Select value={enhancerPromptLength} onValueChange={setEnhancerPromptLength}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue/></SelectTrigger>
                                <SelectContent>{promptLengths.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
              </div>
            )}

            {/* MODEL + controls */}
            {videoProvider === "fal_ai" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">Video Model</Label>
                  <Select value={falAiVideoModel} onValueChange={setFalAiVideoModel}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Choose Fal.ai model" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="fal-ai/veo3/fast">Veo 3 Fast (Recommended)</SelectItem>
                          <SelectItem value="fal-ai/veo3">Veo 3 High Quality</SelectItem>
                          <SelectItem value="fal-ai/bytedance/seedance/v1/pro/text-to-video">Seedance 1.0 Pro</SelectItem>
                          <SelectItem value="fal-ai/bytedance/seedance/v1/lite/text-to-video">Seedance 1.0 Lite</SelectItem>
                          <SelectItem value="fal-ai/damo-text-to-video">Damo Text-to-Video</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                 
                {isVEOModel ? (
                  <>
                    <div>
                      <Label className="block text-sm font-medium mb-2">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select aspect ratio"/></SelectTrigger>
                        <SelectContent>
                          {aspectRatios.map(ar => <SelectItem key={ar} value={ar}>{ar}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">Resolution</Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select resolution"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p (Fast)</SelectItem>
                          <SelectItem value="1080p">1080p (High Quality)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <div>
                      <Label className="block text-sm font-medium mb-2">Generate Audio</Label>
                      <Button
                        variant="outline"
                        onClick={() => setGenerateAudio(!generateAudio)}
                        className="w-full flex justify-start gap-2 bg-white/10 border-white/20 text-white"
                      >
                        {generateAudio ? <ToggleRight className="text-green-400"/> : <ToggleLeft />}
                        {generateAudio ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </>
                ) : isSeedanceModel ? (
                  <>
                    <div>
                      <Label className="block text-sm font-medium mb-2">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select aspect ratio"/></SelectTrigger>
                        <SelectContent>
                          {aspectRatios.map(ar => <SelectItem key={ar} value={ar}>{ar}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                     <div>
                      <Label className="block text-sm font-medium mb-2">Resolution</Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select resolution"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="480p">480p (Fastest)</SelectItem>
                          <SelectItem value="720p">720p (Standard)</SelectItem>
                          <SelectItem value="1080p">1080p (High Quality)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <div>
                      <Label className="block text-sm font-medium mb-2">Duration (seconds)</Label>
                      <Select value={duration} onValueChange={(v) => setDuration(Number(v))}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select duration"/></SelectTrigger>
                        <SelectContent>
                          {[3,4,5,6,7,8,9,10,11,12].map(d => <SelectItem key={d} value={d}>{d}s</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">Fixed Camera</Label>
                       <Button
                        variant="outline"
                        onClick={() => setCameraFixed(!cameraFixed)}
                        className="w-full flex justify-start gap-2 bg-white/10 border-white/20 text-white"
                      >
                        {cameraFixed ? <ToggleRight className="text-green-400"/> : <ToggleLeft />}
                        {cameraFixed ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </>
                ) : ( // Damo
                  <>
                     <div>
                      <Label className="block text-sm font-medium mb-2">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select aspect ratio"/></SelectTrigger>
                         <SelectContent>
                          {aspectRatios.map(ar => <SelectItem key={ar} value={ar}>{ar}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">Motion Level</Label>
                      <Select value={motionLevel} onValueChange={(v) => setMotionLevel(Number(v))}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select motion level"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={30}>Low</SelectItem>
                          <SelectItem value={127}>Medium</SelectItem>
                          <SelectItem value={200}>High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">Video Length</Label>
                      <Select value={videoLength} onValueChange={(v) => setVideoLength(Number(v))}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select length"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={25}>Short (~2s)</SelectItem>
                          <SelectItem value={50}>Medium (~4s)</SelectItem>
                          <SelectItem value={75}>Long (~6s)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <div>
                      <Label className="block text-sm font-medium mb-2">Camera Movement</Label>
                      <Select value={cameraMovement} onValueChange={setCameraMovement}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select camera movement"/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="pan-left">Pan Left</SelectItem>
                              <SelectItem value="pan-right">Pan Right</SelectItem>
                              <SelectItem value="zoom-in">Zoom In</SelectItem>
                              <SelectItem value="zoom-out">Zoom Out</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  </>
                )}
              </div>
            ) : videoProvider === "kei_ai" ? ( // Kei AI generic controls
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Kei AI Model</Label>
                    <Input
                      placeholder="Enter Kei AI video model (e.g., model-id-123)"
                      value={keiVideoModel}
                      onChange={(e) => setKeiVideoModel(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                    <p className="text-xs text-white/60 mt-1">
                      Use the exact model ID from Kei AI docs, if required by your endpoint.
                    </p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Endpoint Path</Label>
                    <Input
                      placeholder="/v1/videos/generate"
                      value={keiEndpointPath}
                      onChange={(e) => setKeiEndpointPath(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                    <p className="text-xs text-white/60 mt-1">
                      Any Kei AI video endpoint (e.g., /v1/videos/generate).
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Duration (seconds)</Label>
                    <Select value={duration} onValueChange={(v) => setDuration(Number(v))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select duration"/></SelectTrigger>
                      <SelectContent>
                        {[3,4,5,6,7,8,9,10,11,12].map(d => <SelectItem key={d} value={d}>{d}s</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">Advanced Params (JSON)</Label>
                  <Textarea
                    placeholder='Optional JSON, e.g. {"seed":1234,"fps":24,"aspect_ratio":"16:9"}'
                    value={keiAdvancedParams}
                    onChange={(e) => setKeiAdvancedParams(e.target.value)}
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <p className="text-xs text-white/60 mt-1">
                    These keys are merged into the request body for the selected Kei AI endpoint.
                  </p>
                </div>
              </>
            ) : videoProvider === "kei_veo3" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Model</Label>
                    <Select value={veoModel} onValueChange={setVeoModel}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Choose model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="veo3">veo3 (quality)</SelectItem>
                        <SelectItem value="veo3_fast">veo3_fast (faster)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Aspect Ratio</Label>
                    <Select value={veoAspect} onValueChange={setVeoAspect}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select aspect ratio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9</SelectItem>
                        <SelectItem value="9:16">9:16</SelectItem>
                        <SelectItem value="1:1">1:1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Callback URL (optional)</Label>
                    <Input
                      placeholder="https://your-site.com/veo3-callback"
                      value={veoCallbackUrl}
                      onChange={(e) => setVeoCallbackUrl(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">Image URLs (optional, comma-separated)</Label>
                  <Textarea
                    placeholder="https://site/image1.jpg, https://site/image2.png"
                    value={veoImageUrls}
                    onChange={(e) => setVeoImageUrls(e.target.value)}
                    rows={2}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <p className="text-xs text-white/60 mt-1">Include to run image-to-video flow; leave blank for text-to-video.</p>
                </div>
              </>
            ) : videoProvider === "kei_runway" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Duration (seconds)</Label>
                    <Select value={runwayDuration} onValueChange={(v) => setRunwayDuration(Number(v))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={5}>5s</SelectItem>
                        <SelectItem value={8}>8s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Quality</Label>
                    <Select value={runwayQuality} onValueChange={setRunwayQuality}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p (5s only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Aspect Ratio</Label>
                    <Select value={runwayAspect} onValueChange={setRunwayAspect}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9</SelectItem>
                        <SelectItem value="9:16">9:16</SelectItem>
                        <SelectItem value="1:1">1:1</SelectItem>
                        <SelectItem value="4:3">4:3</SelectItem>
                        <SelectItem value="3:4">3:4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="block text-sm font-medium mb-2">Reference Image URL (optional)</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={runwayImageUrl}
                      onChange={(e) => setRunwayImageUrl(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="block text-sm font-medium mb-2">Watermark (optional)</Label>
                    <Input
                      placeholder="Leave empty for no watermark"
                      value={runwayWatermark}
                      onChange={(e) => setRunwayWatermark(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="block text-sm font-medium mb-2">Callback URL (optional)</Label>
                    <Input
                      placeholder="https://your-app.com/webhook/runway-callback"
                      value={runwayCallbackUrl}
                      onChange={(e) => setRunwayCallbackUrl(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || !assignToUsername}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg py-3"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> {generationStatus || 'Starting...'}</>
            ) : (
              <><Wand2 className="w-5 h-5 mr-3" /> Generate Video (Background)</>
            )}
          </Button>
          
          {/* REMOVED: The entire section for displaying the generated video and its buttons */}
          {/* REMOVED: The finalPrompt display block */}
          {/* REMOVED: The "Get 1080P Version (Veo3)" button */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
