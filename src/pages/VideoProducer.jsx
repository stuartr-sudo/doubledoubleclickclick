
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator"; 
import { VideoProject } from '@/api/entities';
import { VideoScene } from '@/api/entities';
import { User } from '@/api/entities';
import { InvokeLLM, UploadFile } from '@/api/integrations';
import { generateVideoFalAi } from '@/api/functions';
import { generateWanEffectsVideo } from '@/api/functions';
import { generateMareyI2V } from '@/api/functions';
import { getVideoStatus } from '@/api/functions';
import { stitchWithJson2Video } from '@/api/functions';
import { generateAceStepMusic } from '@/api/functions';
import { generateElevenlabsTts } from '@/api/functions';
import { Film, Loader2, Wand2, ArrowRight, CheckCircle2, Video, Send } from 'lucide-react';
import { toast } from 'sonner';
import SceneEditor from '../components/video/SceneEditor';

export default function VideoProducer() {
  const [currentUser, setCurrentUser] = useState(null);
  const [idea, setIdea] = useState('');
  const [sceneCount, setSceneCount] = useState(3);
  const [targetAudience, setTargetAudience] = useState('');
  const [videoStyle, setVideoStyle] = useState('Professional');
  const [keyMessage, setKeyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [backgroundJobs, setBackgroundJobs] = useState([]);
  const [isAssembling, setIsAssembling] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);

  // NEW: Rendering configuration states
  const [resolution, setResolution] = useState("full-hd");
  const [quality, setQuality] = useState("high");
  const [narrationVolume, setNarrationVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(30);
  const [transitionStyle, setTransitionStyle] = useState("fade");
  const [transitionDuration, setTransitionDuration] = useState(1.5);
  const [subtitleStyle, setSubtitleStyle] = useState({
    style: "classic-progressive",
    font_family: "Lalezar",
    font_size: 60,
    position: "bottom-center",
    line_color: "#FFFFFF",
    word_color: "#FFFF00",
    outline_color: "#000000",
    outline_width: 3,
    max_words_per_line: 8
  });
  const [allAssetsReady, setAllAssetsReady] = useState(false); // NEW: ready flag

  useEffect(() => {
    User.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  // NEW: Load existing project by URL param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("projectId");
    if (!projectId || activeProject) return;

    (async () => {
      try {
        const rows = await VideoProject.filter({ id: projectId });
        const project = Array.isArray(rows) ? rows[0] : null;
        if (!project) {
          toast.error("Project not found.");
          return;
        }

        const sceneRows = await VideoScene.filter({ project_id: projectId }, "scene_number");
        setActiveProject(project);
        setScenes(sceneRows || []);
        setIdea(project.idea || '');
        setTargetAudience(project.target_audience || '');
        setVideoStyle(project.video_style || 'Professional');
        setKeyMessage(project.key_message || '');
        setSceneCount(project.scene_count || 3);
        setSubtitlesEnabled(project.subtitles_enabled ?? true);
        setResolution(project.resolution || "full-hd");
        setQuality(project.quality || "high");
        setNarrationVolume(project.narration_volume ?? 100);
        setMusicVolume(project.music_volume ?? 30);
        setTransitionStyle(project.transition_style || "fade");
        setTransitionDuration(project.transition_duration ?? 1.5);
        setSubtitleStyle(project.subtitle_settings || {
          style: "classic-progressive",
          font_family: "Lalezar",
          font_size: 60,
          position: "bottom-center",
          line_color: "#FFFFFF",
          word_color: "#FFFF00",
          outline_color: "#000000",
          outline_width: 3,
          max_words_per_line: 8
        });
        toast.success(`Loaded project: ${project.title}`);
      } catch (error) {
        console.error("Failed to load project:", error);
        toast.error("Failed to load project. Please try again.");
      }
    })();
  }, [activeProject]);

  // NEW: After loading existing project, auto-trigger rerun if requested
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trigger = urlParams.get("trigger");
    if (!activeProject || !scenes.length) return; // Wait for project and scenes to be loaded
    if (trigger === "rerunAll") {
      toast.info("Re-running all scene assets…");
      // slight delay to let UI paint
      setTimeout(() => handleGenerateAllAssets(), 300);
      // Remove trigger param from URL to prevent re-running on refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("trigger");
      window.history.replaceState({}, '', newUrl.toString());
    } else if (trigger === "stitch") {
      toast.info("Attempting to stitch project…");
      setTimeout(() => handleSendForStitching(), 300);
      // Remove trigger param from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("trigger");
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [activeProject, scenes]); // Removed function references to avoid TDZ

  // NEW: compute readiness whenever scenes change
  useEffect(() => {
    const ready = scenes.length > 0 && scenes.every(s => s.asset_status === 'complete');
    setAllAssetsReady(ready);
  }, [scenes]);

  // REPLACED: no automatic stitching; only mark readiness
  const checkAndStitch = async (currentScenes) => {
    if (!activeProject) return;
    const allComplete = currentScenes.length > 0 && currentScenes.every(s => s.asset_status === 'complete');
    setAllAssetsReady(allComplete);
  };

  useEffect(() => {
    if (!backgroundJobs.length) return;

    const interval = setInterval(async () => {
        let jobsChanged = false;
        const updatedJobs = await Promise.all(
            backgroundJobs.map(async (job) => {
                if (job.status !== 'polling') return job;

                if (job.attempts > 120) { // Timeout after ~16 minutes with 8s interval
                    jobsChanged = true;
                    toast.error(`Job timed out for Scene ${job.sceneNumber}.`);
                    await VideoScene.update(job.sceneId, { asset_status: 'failed' });
                    setScenes(prev => prev.map(s => s.id === job.sceneId ? { ...s, asset_status: 'failed' } : s));
                    return { ...job, status: 'failed', error: 'Timed out' };
                }

                try {
                    if (job.type === 'video') {
                        const { data: statusData, error } = await getVideoStatus({ request_id: job.taskId, model: job.modelName });

                        if (error) {
                            if (error.message && error.message.includes('Rate limit exceeded')) {
                                toast.warning("Polling rate limit reached. Checks will continue in the background.", { duration: 8000 });
                                return { ...job, attempts: (job.attempts || 0) + 1 }; // Don't fail, just retry later
                            }
                            // For other errors, fail the job by throwing
                            throw new Error(error.message || "Unknown polling error");
                        }

                        const normalizedStatus = (statusData.status || "").toString().toUpperCase();
                        const resultUrl = statusData?.url || statusData?.video?.url;

                        if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'SUCCEEDED') {
                            if (resultUrl) {
                                await VideoScene.update(job.sceneId, { video_clip_url: resultUrl });
                                setScenes(prev => prev.map(s => s.id === job.sceneId ? { ...s, video_clip_url: resultUrl } : s));
                                toast.success(`Video for Scene ${job.sceneNumber} is ready!`);
                                jobsChanged = true;
                                return { ...job, status: 'completed' };
                            }
                        } else if (normalizedStatus === 'ERROR' || statusData.error) {
                            toast.error(`Video generation failed for Scene ${job.sceneNumber}: ${statusData.error}`);
                            await VideoScene.update(job.sceneId, { asset_status: 'failed' });
                            setScenes(prev => prev.map(s => s.id === job.sceneId ? { ...s, asset_status: 'failed' } : s));
                            jobsChanged = true;
                            return { ...job, status: 'failed', error: statusData.error };
                        }
                    }
                    return { ...job, attempts: (job.attempts || 0) + 1 };
                } catch (e) {
                    console.error("Polling error:", e);
                    toast.error(`Polling failed for Scene ${job.sceneNumber}: ${e.message}`);
                    await VideoScene.update(job.sceneId, { asset_status: 'failed' });
                    setScenes(prev => prev.map(s => s.id === job.sceneId ? { ...s, asset_status: 'failed' } : s));
                    jobsChanged = true;
                    return { ...job, status: 'failed', error: e.message };
                }
            })
        );
        
        const nextJobs = updatedJobs.filter(j => j.status === 'polling');
        
        // After jobs are processed, check if any scene is now complete
        if(jobsChanged) {
            setScenes(currentScenes => {
                const updatedScenes = currentScenes.map(scene => {
                    // If a scene was previously generating and now has all three asset URLs, mark it complete
                    if (scene.asset_status === 'generating' && scene.video_clip_url && scene.narration_audio_url && scene.music_track_url) {
                        VideoScene.update(scene.id, { asset_status: 'complete' }).catch(e => console.error("Failed to update scene status to complete:", e));
                        return { ...scene, asset_status: 'complete' };
                    }
                    return scene;
                });

                // Check if stitching can begin
                checkAndStitch(updatedScenes); // This now only updates `allAssetsReady`
                return updatedScenes;
            });
        }
        
        if (jobsChanged || nextJobs.length !== backgroundJobs.length) {
            setBackgroundJobs(nextJobs);
        }
    }, 8000); // Slower polling interval

    return () => clearInterval(interval);
  }, [backgroundJobs, activeProject, isAssembling]);

  const handleGeneratePlan = async () => {
    if (!idea.trim()) {
      toast.error('Please enter a video idea.');
      return;
    }
    setIsLoading(true);
    let tempProject = null;

    try {
      tempProject = await VideoProject.create({
        idea,
        scene_count: sceneCount,
        status: 'draft',
        user_name: currentUser?.email,
        title: idea.substring(0, 50) + '...',
        subtitles_enabled: subtitlesEnabled,
        target_audience: targetAudience,
        video_style: videoStyle,
        key_message: keyMessage,
        // NEW: rendering configuration
        resolution,
        quality,
        narration_volume: narrationVolume,
        music_volume: musicVolume,
        transition_style: transitionStyle,
        transition_duration: transitionDuration,
        subtitle_settings: subtitleStyle
      });
      
      const scenePlanPrompt = `
        You are a creative video director specializing in compelling, short-form storytelling.
        Your task is to transform a simple video idea into a coherent and connected scene plan for an AI video generator.
        The final video must have a clear narrative arc, where each scene logically flows into the next, building upon the previous one to tell a complete mini-story.

        --- CREATIVE BRIEF ---
        - Core Idea: "${idea}"
        - Target Audience: "${targetAudience}"
        - Desired Style/Tone: "${videoStyle}"
        - Key Message/Call to Action: "${keyMessage}"
        ---

        Number of Scenes: ${sceneCount}

        Instructions:
        1.  **Analyze the Brief:** First, carefully analyze all the elements of the Creative Brief to understand the project's goals.
        2.  **Develop a Narrative:** Based on the brief, think about a simple story with a beginning, middle, and end that fits the idea and resonates with the target audience.
        3.  **Create Connected Scenes:** Based on that story, create exactly ${sceneCount} distinct but narratively linked scenes. Each scene's description should reflect the desired style and tone.
        4.  **Incorporate the Key Message:** Ensure the overall narrative arc effectively delivers the Key Message or naturally leads to the Call to Action by the end of the video.
        5.  **Write Evocative Descriptions:** For each scene, write a concise but evocative description. Focus on what the viewer sees and the overall mood. Ensure the description for Scene 2 logically follows Scene 1, Scene 3 follows Scene 2, and so on.

        Output the result as a JSON object with a single key "scenes", which is an narray of objects. Each object in the array must have one key: "scene_description".
      `;
      const scenePlanSchema = {
        type: "object",
        properties: { scenes: { type: "array", items: { type: "object", properties: { scene_description: { type: "string" } }, required: ["scene_description"] } } },
        required: ["scenes"]
      };

      const plan = await InvokeLLM({ prompt: scenePlanPrompt, response_json_schema: scenePlanSchema });
      
      if (!plan || !plan.scenes) {
        throw new Error('Failed to generate a valid scene plan.');
      }

      const initialScenePromises = plan.scenes.map((scene, index) => 
        VideoScene.create({
          project_id: tempProject.id,
          scene_number: index + 1,
          scene_description: scene.scene_description,
          asset_status: 'pending_prompts'
        })
      );
      const createdScenes = await Promise.all(initialScenePromises);
      
      const promptGenerationPromises = createdScenes.map(async (scene) => {
        try {
            const assetPrompt = `
              You are a multimedia production assistant. Based on a scene description, generate three distinct assets: a detailed video prompt, a narration script, and a music prompt.
              Scene Description: "${scene.scene_description}"
              1.  **Video Prompt:** Create a highly detailed, evocative prompt for an AI video generator (like Sora or Seedance). Describe the camera angle, lighting, colors, mood, and specific actions. Be cinematic.
              2.  **Narration Script:** Write a short, engaging voice-over script (1-3 sentences) that complements the scene's visuals and story.
              3.  **Music Prompt:** Write a prompt for an AI music generator (like Suno). Describe the genre, tempo, mood, and instrumentation for the background music.
              Output the result as a single JSON object with three keys: "video_prompt", "narration_script", "music_prompt".
            `;
            const assetSchema = {
              type: "object",
              properties: { video_prompt: { type: "string" }, narration_script: { type: "string" }, music_prompt: { type: "string" } },
              required: ["video_prompt", "narration_script", "music_prompt"]
            };
            const prompts = await InvokeLLM({ prompt: assetPrompt, response_json_schema: assetSchema });
            
            if (!prompts || prompts.error) {
                console.error(`Failed to generate prompts for scene ${scene.scene_number}:`, prompts.error || "Unknown error");
                return scene;
            }
    
            const updatedScenePayload = {
                video_prompt: prompts.video_prompt,
                narration_script: prompts.narration_script,
                music_prompt: prompts.music_prompt,
                asset_status: 'pending_assets'
            };
            await VideoScene.update(scene.id, updatedScenePayload);
            return { ...scene, ...updatedScenePayload };
        } catch(e) {
            console.error(`Error processing scene ${scene.scene_number}`, e);
            return scene; // Return original scene on error
        }
      });

      const scenesWithPrompts = await Promise.all(promptGenerationPromises);

      setScenes(scenesWithPrompts);
      setActiveProject(tempProject);

      await VideoProject.update(tempProject.id, { status: 'planning_scenes' });
      toast.success(`Generated ${scenesWithPrompts.length}-scene plan with detailed prompts. Ready for your review.`);

    } catch (error) {
      toast.error(error.message || 'Failed to generate scene plan.');
      if (tempProject) {
        await VideoProject.update(tempProject.id, { status: 'failed' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateScene = (updatedScene) => {
    setScenes(currentScenes =>
      currentScenes.map(s => s.id === updatedScene.id ? updatedScene : s)
    );
    VideoScene.update(updatedScene.id, {
        scene_description: updatedScene.scene_description,
        video_prompt: updatedScene.video_prompt,
        narration_script: updatedScene.narration_script,
        music_prompt: updatedScene.music_prompt,
        video_aspect_ratio: updatedScene.video_aspect_ratio,
        video_resolution: updatedScene.video_resolution,
        video_duration: updatedScene.video_duration,
        video_camera_fixed: updatedScene.video_camera_fixed,
        narration_voice: updatedScene.narration_voice,
        video_generation_type: updatedScene.video_generation_type,
        source_image_url: updatedScene.source_image_url,
        effect_subject: updatedScene.effect_subject,
        effect_type: updatedScene.effect_type,
        marey_dimensions: updatedScene.marey_dimensions,
        marey_duration: updatedScene.marey_duration,
        marey_negative_prompt: updatedScene.marey_negative_prompt,
    }).catch(e => console.error("Failed to persist scene update", e));
  };
  
  const handleGenerateAssets = async (sceneToGenerate) => {
    setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, asset_status: 'generating' } : s));
    toast.info(`Starting all asset generation for Scene ${sceneToGenerate.scene_number}...`);
    
    const generationPromises = [];

    // --- Narration Generation (ElevenLabs via Fal.ai) ---
    if (sceneToGenerate.narration_script) {
      generationPromises.push((async () => {
        try {
            const { data } = await generateElevenlabsTts({
                text: sceneToGenerate.narration_script,
                voice: sceneToGenerate.narration_voice,
            });
            if (data?.audio_url) {
                await VideoScene.update(sceneToGenerate.id, { narration_audio_url: data.audio_url });
                setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, narration_audio_url: data.audio_url } : s));
                toast.success(`Narration ready for Scene ${sceneToGenerate.scene_number}.`);
            } else {
                 throw new Error("ElevenLabs TTS (Fal.ai) did not return an audio URL.");
            }
        } catch (error) {
            toast.error(`Narration failed for Scene ${sceneToGenerate.scene_number}: ${error.message}`);
            // If narration fails, mark scene as failed for asset generation
            setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, asset_status: 'failed' } : s));
        }
      })());
    }

    // --- Music Generation (Fal.ai ACE-Step) ---
    if (sceneToGenerate.music_prompt) {
      generationPromises.push((async () => {
        try {
            toast.info(`Music generation started for Scene ${sceneToGenerate.scene_number}.`);
            const { data: musicResult } = await generateAceStepMusic({
                prompt: sceneToGenerate.music_prompt,
                duration: sceneToGenerate.video_duration,
                instrumental: true,
            });

            if (musicResult?.audioUrl) {
                await VideoScene.update(sceneToGenerate.id, { music_track_url: musicResult.audioUrl });
                setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, music_track_url: musicResult.audioUrl } : s));
                toast.success(`Music ready for Scene ${sceneToGenerate.scene_number}.`);
            } else {
                throw new Error("ACE-Step service did not return an audio URL.");
            }
        } catch(error) {
             toast.error(`Music generation failed for Scene ${sceneToGenerate.scene_number}: ${error.message}`);
             setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, asset_status: 'failed' } : s));
        }
      })());
    }
    
    // --- Video Generation ---
    if (sceneToGenerate.video_generation_type === 'image-to-video') {
      generationPromises.push((async () => {
        try {
          if (!sceneToGenerate.source_image_url || !sceneToGenerate.effect_subject) {
            throw new Error("Source Image URL and Subject are required for this effect.");
          }
          const { data: videoJob } = await generateWanEffectsVideo({
            image_url: sceneToGenerate.source_image_url,
            subject: sceneToGenerate.effect_subject,
            effect_type: sceneToGenerate.effect_type,
          });

          if (!videoJob?.videoUrl) {
            throw new Error('Wan Effects service did not return a video URL.');
          }
          
          await VideoScene.update(sceneToGenerate.id, { video_clip_url: videoJob.videoUrl });
          setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, video_clip_url: videoJob.videoUrl } : s));
          toast.success(`Video effect for Scene ${sceneToGenerate.scene_number} is ready!`);
        } catch (error) {
          toast.error(`Video effect failed for Scene ${sceneToGenerate.scene_number}: ${error.message}`);
          setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, asset_status: 'failed' } : s));
        }
      })());
    } else if (sceneToGenerate.video_generation_type === 'marey-i2v') {
      generationPromises.push((async () => {
        try {
          if (!sceneToGenerate.source_image_url || !sceneToGenerate.video_prompt) {
            throw new Error("Source Image URL and a detailed prompt are required for Marey I2V.");
          }
          const { data: videoJob } = await generateMareyI2V({
            image_url: sceneToGenerate.source_image_url,
            prompt: sceneToGenerate.video_prompt,
            dimensions: sceneToGenerate.marey_dimensions,
            duration: sceneToGenerate.marey_duration,
            negative_prompt: sceneToGenerate.marey_negative_prompt,
          });

          if (!videoJob?.videoUrl) {
            throw new Error('Marey I2V service did not return a video URL.');
          }
          
          await VideoScene.update(sceneToGenerate.id, { video_clip_url: videoJob.videoUrl });
          setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, video_clip_url: videoJob.videoUrl } : s));
          toast.success(`Marey I2V video for Scene ${sceneToGenerate.scene_number} is ready!`);
        } catch (error) {
          toast.error(`Marey I2V failed for Scene ${sceneToGenerate.scene_number}: ${error.message}`);
          setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, asset_status: 'failed' } : s));
        }
      })());
    } else {
      // --- Text-to-Video Generation (Fal.ai) ---
      if (sceneToGenerate.video_prompt) {
        generationPromises.push((async () => {
          try {
            const { data: videoJob } = await generateVideoFalAi({
              model: sceneToGenerate.video_model,
              prompt: sceneToGenerate.video_prompt,
              aspect_ratio: sceneToGenerate.video_aspect_ratio,
              resolution: sceneToGenerate.video_resolution,
              duration: String(sceneToGenerate.video_duration),
              camera_fixed: sceneToGenerate.video_camera_fixed,
            });

            if (!videoJob || !videoJob.request_id) {
              throw new Error('Failed to get a request_id from the video generation service.');
            }

            const newJob = {
              id: `job-video-${Date.now()}-${sceneToGenerate.id}`,
              type: 'video',
              taskId: videoJob.request_id,
              sceneId: sceneToGenerate.id,
              sceneNumber: sceneToGenerate.scene_number,
              modelName: sceneToGenerate.video_model,
              status: 'polling',
              attempts: 0,
            };
            setBackgroundJobs(prev => [...prev, newJob]);
            toast.info(`Video generation started for Scene ${sceneToGenerate.scene_number}.`);
          } catch (error) {
            toast.error(`Video generation failed for Scene ${sceneToGenerate.scene_number}: ${error.message}`);
            setScenes(prev => prev.map(s => s.id === sceneToGenerate.id ? { ...s, asset_status: 'failed' } : s));
          }
        })());
      }
    }

    // Run all generation tasks
    await Promise.allSettled(generationPromises);
  };

  const handleGenerateAllAssets = async () => {
    toast.info(`Starting bulk asset generation for ${scenes.length} scenes...`);
    for (const scene of scenes) {
        // Only generate assets for scenes that are not already complete or generating or failed
        if (['pending_assets', 'pending_prompts'].includes(scene.asset_status)) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to prevent rate limiting
            handleGenerateAssets(scene);
        }
    }
  };

  // NEW: manual send for stitching
  const handleSendForStitching = async () => {
    if (!activeProject) return;
    if (!allAssetsReady) {
      toast.warning("Please generate all scene assets before stitching.");
      return;
    }
    setIsAssembling(true);
    toast.info("Sending project for stitching…");

    try {
      const { data: result } = await stitchWithJson2Video({ projectId: activeProject.id });

      if (result?.final_video_url) {
        const finalVideoUrl = result.final_video_url;
        setActiveProject(prev => ({ ...prev, final_video_url: finalVideoUrl, status: 'complete' }));
        toast.success("Final video is ready!");
      } else if (result?.dispatched) {
        setActiveProject(prev => ({ ...prev, status: 'assembling' }));
        toast.success("Stitching dispatched. You'll be notified when it's ready.");
      } else {
        throw new Error("Unexpected response from stitching service.");
      }
    } catch (e) {
      toast.error(`Failed to dispatch stitching: ${e.message}`);
      await VideoProject.update(activeProject.id, { status: 'failed' });
    } finally {
      setIsAssembling(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Film className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-bold">AI Video Producer</h1>
        </div>

        {!activeProject ? (
          <div className="bg-slate-800/70 p-8 rounded-2xl border border-slate-700 space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
                <h2 className="text-xl font-bold text-cyan-400">Step 1: Define Your Vision</h2>
                <p className="text-slate-400">Provide details to guide the AI in creating a tailored video plan.</p>
            </div>
            
            <div>
              <Label htmlFor="idea" className="font-semibold">Core Video Idea</Label>
              <Textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g., A short promotional video for a new brand of coffee, focusing on the morning ritual."
                className="mt-2 bg-slate-900 border-slate-600 h-28"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="audience" className="font-semibold">Target Audience</Label>
                    <Input
                        id="audience"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="e.g., Tech enthusiasts, busy parents"
                        className="mt-2 bg-slate-900 border-slate-600"
                    />
                </div>
                <div>
                    <Label htmlFor="style" className="font-semibold">Video Style & Tone</Label>
                    <Select value={videoStyle} onValueChange={setVideoStyle}>
                        <SelectTrigger id="style" className="mt-2 bg-slate-900 border-slate-600">
                            <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                            <SelectItem value="Professional">Professional & Polished</SelectItem>
                            <SelectItem value="Casual & Friendly">Casual & Friendly</SelectItem>
                            <SelectItem value="Energetic & Fun">Energetic & Fun</SelectItem>
                            <SelectItem value="Inspirational & Uplifting">Inspirational & Uplifting</SelectItem>
                            <SelectItem value="Dramatic & Cinematic">Dramatic & Cinematic</SelectItem>
                            <SelectItem value="Educational & Informative">Educational & Informative</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="message" className="font-semibold">Key Message / Call to Action</Label>
                <Input
                    id="message"
                    value={keyMessage}
                    onChange={(e) => setKeyMessage(e.target.value)}
                    placeholder="e.g., Visit our website to learn more."
                    className="mt-2 bg-slate-900 border-slate-600"
                />
            </div>

            {/* Subtitles settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="mt-1 flex items-start gap-3">
                <Checkbox id="subs" checked={subtitlesEnabled} onCheckedChange={(v) => setSubtitlesEnabled(Boolean(v))} />
                <div>
                  <Label htmlFor="subs" className="font-semibold">Enable dynamic subtitles</Label>
                  <p className="text-xs text-slate-400">Subtitles are rendered from narration text during stitching.</p>
                </div>
              </div>
            </div>

            {/* NEW: Render settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="font-semibold">Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                    <SelectItem value="hd">HD (1280x720)</SelectItem>
                    <SelectItem value="full-hd">Full HD (1920x1080)</SelectItem>
                    <SelectItem value="4k">4K (3840x2160)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-semibold">Quality</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="font-semibold">Narration Volume ({narrationVolume})</Label>
                <Slider value={[narrationVolume]} min={0} max={100} step={1} onValueChange={v => setNarrationVolume(v[0])} className="mt-3" />
              </div>
              <div>
                <Label className="font-semibold">Music Volume ({musicVolume})</Label>
                <Slider value={[musicVolume]} min={0} max={100} step={1} onValueChange={v => setMusicVolume(v[0])} className="mt-3" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="font-semibold">Transition Style</Label>
                <Select value={transitionStyle} onValueChange={setTransitionStyle}>
                  <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-semibold">Transition Duration (sec)</Label>
                <Input type="number" min="0" step="0.1" value={transitionDuration} onChange={(e) => setTransitionDuration(Number(e.target.value))} className="mt-2 bg-slate-900 border-slate-600" />
              </div>
            </div>

            {/* Subtitle style (collapsible, simple inline for now) */}
            <div className="space-y-3">
              <Separator className="bg-slate-700/70" />
              <h3 className="text-lg font-semibold text-slate-300">Subtitle Style</h3>
              {(() => {
                const stylePresets = ["classic-progressive", "karaoke-bounce", "bold-outline", "minimal", "caption-bar", "pop-shadow"];
                const fontFamilies = ["Lalezar", "Inter", "Roboto", "Open Sans", "Source Sans Pro", "Merriweather", "Lora", "Playfair Display", "PT Serif"];
                const fontSizes = [36, 48, 60, 72, 84];
                const outlineWidths = [0, 1, 2, 3, 4, 5, 6];
                const maxWords = [6, 8, 10, 12];
                const colorOptions = [
                  { label: "White", value: "#FFFFFF" },
                  { label: "Yellow", value: "#FFFF00" },
                  { label: "Black", value: "#000000" },
                  { label: "Orange", value: "#FFA500" },
                  { label: "Red", value: "#FF0000" },
                  { label: "Blue", value: "#1D4ED8" },
                  { label: "Green", value: "#10B981" },
                  { label: "Cyan", value: "#06B6D4" },
                  { label: "Magenta", value: "#FF00FF" },
                  { label: "Custom…", value: "__custom__" },
                ];

                const isPreset = (v) => colorOptions.some(c => c.value === v);
                const isCustomLine = subtitleStyle.line_color && !isPreset(subtitleStyle.line_color);
                const isCustomWord = subtitleStyle.word_color && !isPreset(subtitleStyle.word_color);
                const isCustomOutline = subtitleStyle.outline_color && !isPreset(subtitleStyle.outline_color);

                return (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Style Preset */}
                    <div>
                      <Label>Style Preset</Label>
                      <Select
                        value={subtitleStyle.style}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, style: v }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          {stylePresets.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Family */}
                    <div>
                      <Label>Font Family</Label>
                      <Select
                        value={subtitleStyle.font_family}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, font_family: v }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          {fontFamilies.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Size */}
                    <div>
                      <Label>Font Size</Label>
                      <Select
                        value={String(subtitleStyle.font_size)}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, font_size: Number(v) }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          {fontSizes.map(sz => (
                            <SelectItem key={sz} value={String(sz)}>{sz}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Position (already dropdown earlier) */}
                    <div>
                      <Label>Position</Label>
                      <Select
                        value={subtitleStyle.position}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, position: v }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          <SelectItem value="bottom-center">Bottom Center</SelectItem>
                          <SelectItem value="top-center">Top Center</SelectItem>
                          <SelectItem value="center-center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Line Color */}
                    <div>
                      <Label>Line Color</Label>
                      <Select
                        value={isCustomLine ? "__custom__" : subtitleStyle.line_color}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, line_color: v === "__custom__" ? s.line_color : v }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          {colorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isCustomLine && (
                        <Input
                          className="mt-2 bg-slate-900 border-slate-600"
                          placeholder="#RRGGBB"
                          value={subtitleStyle.line_color}
                          onChange={(e) => setSubtitleStyle(s => ({ ...s, line_color: e.target.value }))}
                        />
                      )}
                    </div>

                    {/* Word Color */}
                    <div>
                      <Label>Word Color</Label>
                      <Select
                        value={isCustomWord ? "__custom__" : subtitleStyle.word_color}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, word_color: v === "__custom__" ? s.word_color : v }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          {colorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isCustomWord && (
                        <Input
                          className="mt-2 bg-slate-900 border-slate-600"
                          placeholder="#RRGGBB"
                          value={subtitleStyle.word_color}
                          onChange={(e) => setSubtitleStyle(s => ({ ...s, word_color: e.target.value }))}
                        />
                      )}
                    </div>

                    {/* Outline Color */}
                    <div>
                      <Label>Outline Color</Label>
                      <Select
                        value={isCustomOutline ? "__custom__" : subtitleStyle.outline_color}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, outline_color: v === "__custom__" ? s.outline_color : v }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          {colorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isCustomOutline && (
                        <Input
                          className="mt-2 bg-slate-900 border-slate-600"
                          placeholder="#RRGGBB"
                          value={subtitleStyle.outline_color}
                          onChange={(e) => setSubtitleStyle(s => ({ ...s, outline_color: e.target.value }))}
                        />
                      )}
                    </div>

                    {/* Outline Width */}
                    <div>
                      <Label>Outline Width</Label>
                      <Select
                        value={String(subtitleStyle.outline_width)}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, outline_width: Number(v) }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          {outlineWidths.map(w => (
                            <SelectItem key={w} value={String(w)}>{w}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Max Words Per Line */}
                    <div>
                      <Label>Max Words Per Line</Label>
                      <Select
                        value={String(subtitleStyle.max_words_per_line)}
                        onValueChange={(v) => setSubtitleStyle(s => ({ ...s, max_words_per_line: Number(v) }))}
                      >
                        <SelectTrigger className="mt-2 bg-slate-900 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                          {maxWords.map(n => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <Label htmlFor="scene-count" className="font-semibold">Number of Scenes: {sceneCount}</Label>
              <Slider
                id="scene-count"
                value={[sceneCount]}
                onValueChange={(value) => setSceneCount(value[0])}
                min={2}
                max={10}
                step={1}
                className="mt-3"
              />
            </div>

            <Button onClick={handleGeneratePlan} disabled={isLoading} size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold">
              {isLoading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Storyboard...</>
              ) : (
                <><Wand2 className="w-5 h-5 mr-2" /> Create Scene Plan</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h2 className="text-2xl font-bold mb-2">{activeProject.title}</h2>
                <p className="text-slate-400">{activeProject.idea}</p>
                {activeProject.status === 'assembling' || isAssembling && (
                    <div className="mt-4 flex items-center gap-3 bg-blue-900/50 border border-blue-500/60 p-3 rounded-lg">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin"/>
                        <p className="font-semibold text-blue-300">Assembling final video... this may take a few minutes.</p>
                    </div>
                )}
            </div>

            {activeProject.final_video_url ? (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"><Video className="w-8 h-8 text-green-400"/> Final Video</h3>
                    <video src={activeProject.final_video_url} controls muted loop className="w-full rounded-lg mt-2 bg-black"></video>
                </div>
            ) : (
              <>
                <div className="space-y-6">
                  {scenes.map((scene) => (
                    <SceneEditor 
                      key={scene.id} 
                      scene={scene} 
                      onUpdate={handleUpdateScene}
                      onGenerate={handleGenerateAssets}
                    />
                  ))}
                </div>
                
                {/* Action bar */}
                <div className="flex flex-col md:flex-row justify-end md:items-center gap-3 border-t border-slate-700 pt-6">
                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Button 
                      onClick={handleGenerateAllAssets} 
                      size="lg" 
                      className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold" 
                      disabled={isAssembling || scenes.some(s => s.asset_status === 'generating')}
                    >
                      {isAssembling ? 'Assembling...' : (scenes.some(s => s.asset_status === 'generating') ? 'Generating...' : 'Generate All Scene Assets')}
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                    </Button>

                    {/* NEW: Send for stitching button */}
                    <Button
                      onClick={handleSendForStitching}
                      size="lg"
                      variant="outline"
                      className={`w-full md:w-auto border-cyan-400/40 text-cyan-300 hover:text-white hover:bg-cyan-500/10 ${allAssetsReady ? '' : 'opacity-60 cursor-not-allowed'}`}
                      disabled={!allAssetsReady || isAssembling}
                      title={allAssetsReady ? 'Send to stitching' : 'Generate all scene assets first'}
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Send for stitching
                    </Button>
                  </div>

                  {/* Optional hint */}
                  {!allAssetsReady && (
                    <div className="text-sm text-slate-400 md:ml-4">
                      All scenes must be complete before stitching.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
