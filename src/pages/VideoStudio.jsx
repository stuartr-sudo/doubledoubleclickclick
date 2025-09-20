import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Play, Wand2, RefreshCw, Scissors, Copy, CheckCircle2, Loader2, GitBranch, Film } from "lucide-react";
import { toast } from "sonner";

import { callPromptWebhook } from "@/api/functions";
import { generateVeo3Video } from "@/api/functions";
import { getVeo3Status } from "@/api/functions";
import { stitchWithJson2Video } from "@/api/functions";

import { Username } from "@/api/entities";
import { VideoProject } from "@/api/entities";
import { VideoScene } from "@/api/entities";

export default function VideoStudio() {
  const [usernames, setUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState("");
  const [clipLength, setClipLength] = useState(8);
  const [sceneCount, setSceneCount] = useState(6);

  const [scenes, setScenes] = useState([]); // [{index, prompt, duration}]
  const [loadingScenes, setLoadingScenes] = useState(false);

  const [currentProject, setCurrentProject] = useState(null);
  const [generatingMap, setGeneratingMap] = useState({}); // scene_index -> bool
  const [pollingMap, setPollingMap] = useState({}); // scene_index -> { taskId }
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await Username.filter({ is_active: true });
        setUsernames(list || []);
        if (list?.length) setSelectedUsername(list[0].user_name);
      } catch {
        setUsernames([]);
      }
    })();
  }, []);

  const fetchScenes = async () => {
    if (!idea.trim()) {
      toast.message("Enter your comprehensive prompt first.");
      return;
    }
    setLoadingScenes(true);
    try {
      const { data } = await callPromptWebhook({ prompt: idea, clip_length: clipLength, scene_count: sceneCount });
      if (!data?.success) {
        toast.error(data?.error || "Webhook did not return scenes");
        return;
      }
      setScenes(data.scenes);
      toast.success(`Received ${data.scenes.length} scene prompts.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || "Failed to call webhook");
    } finally {
      setLoadingScenes(false);
    }
  };

  const createProject = async () => {
    if (!selectedUsername) {
      toast.message("Select a username (brand).");
      return;
    }
    if (!title.trim() || scenes.length === 0) {
      toast.message("Add a title and generate scenes first.");
      return;
    }
    const project = await VideoProject.create({
      title: title.trim(),
      idea: idea.trim(),
      scene_count: scenes.length,
      user_name: selectedUsername,
      status: "planning_scenes"
    });
    // create scenes
    await VideoScene.bulkCreate(
      scenes.map(s => ({
        project_id: project.id,
        scene_number: s.index,
        scene_description: s.prompt.slice(0, 120),
        video_prompt: s.prompt,
        original_prompt: s.prompt,
        video_model: "veo3_fast",
        video_duration: Number(s.duration || clipLength) || 8,
        video_aspect_ratio: "16:9",
        video_resolution: "720p",
        asset_status: "pending_assets"
      }))
    );
    setCurrentProject(project);
    toast.success("Project created. You can now generate clips per scene.");
  };

  const rerunScene = async (scene) => {
    const idx = scene.scene_number;
    setGeneratingMap(prev => ({ ...prev, [idx]: true }));
    try {
      const prompt = scene.video_prompt || scene.original_prompt || "";
      const { data } = await generateVeo3Video({
        prompt,
        model: "veo3_fast",
        aspectRatio: scene.video_aspect_ratio || "16:9"
      });

      const taskId = data?.taskId || data?.raw?.data?.taskId;
      if (!taskId) {
        toast.error(data?.error || "No taskId returned by Veo3.");
        setGeneratingMap(prev => ({ ...prev, [idx]: false }));
        return;
      }

      setPollingMap(prev => ({ ...prev, [idx]: { taskId } }));
      toast.message(`Scene ${idx}: generation started.`);
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || "Failed to start generation");
    } finally {
      setGeneratingMap(prev => ({ ...prev, [idx]: false }));
    }
  };

  // poll all active tasks
  useEffect(() => {
    const timer = setInterval(async () => {
      const entries = Object.entries(pollingMap);
      if (entries.length === 0) return;
      const next = { ...pollingMap };
      let changed = false;

      await Promise.all(entries.map(async ([idx, info]) => {
        if (!info?.taskId) return;
        try {
          const { data } = await getVeo3Status({ taskId: info.taskId });
          const status = (data?.status || "").toString().toUpperCase();
          const url = data?.url || data?.video_url || data?.result_url || data?.data?.url;
          if (status === "COMPLETED" || status === "SUCCEEDED" || url) {
            changed = true;
            delete next[idx];
            // persist to scene
            const projectScenes = await VideoScene.filter({ project_id: currentProject.id });
            const scene = projectScenes.find(s => String(s.scene_number) === String(idx));
            if (scene) {
              await VideoScene.update(scene.id, {
                asset_status: "complete",
                video_clip_url: url || scene.video_clip_url
              });
            }
            toast.success(`Scene ${idx} ready.`);
            setRefreshToggle(s => !s);
          } else if (status === "FAILED" || status === "ERROR") {
            changed = true;
            delete next[idx];
            toast.error(`Scene ${idx} failed to generate.`);
            const projectScenes = await VideoScene.filter({ project_id: currentProject.id });
            const scene = projectScenes.find(s => String(s.scene_number) === String(idx));
            if (scene) await VideoScene.update(scene.id, { asset_status: "failed" });
            setRefreshToggle(s => !s);
          }
        } catch (e) {
          changed = true;
          delete next[idx];
          toast.error(`Polling error on scene ${idx}.`);
        }
      }));

      if (changed) {
        setPollingMap(next);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [pollingMap, currentProject]);

  const loadProjectScenes = async () => {
    if (!currentProject) return [];
    return await VideoScene.filter({ project_id: currentProject.id }, "scene_number");
  };

  const stitchNow = async () => {
    const list = await loadProjectScenes();
    const urls = list
      .sort((a, b) => a.scene_number - b.scene_number)
      .map(s => s.video_clip_url)
      .filter(Boolean);

    if (urls.length === 0) {
      toast.message("No generated clips yet.");
      return;
    }

    try {
      const { data } = await stitchWithJson2Video({
        title: currentProject.title || "My Video",
        clip_urls: urls,
        transition: "fade",
        transition_duration: 1.5,
        resolution: "full-hd",
        quality: "high"
      });
      if (data?.final_url || data?.url) {
        await VideoProject.update(currentProject.id, {
          final_video_url: data.final_url || data.url,
          status: "complete"
        });
        toast.success("Stitched final video is ready.");
        setRefreshToggle(s => !s);
      } else {
        toast.message("Stitch request submitted.");
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || "Failed to stitch");
    }
  };

  const createSplitTest = async () => {
    if (!currentProject?.id) {
      toast.message("Create a project first.");
      return;
    }
    // duplicate project with parent_project_id
    const parent = currentProject;
    const variant = await VideoProject.create({
      title: `${parent.title} — Variant`,
      idea: parent.idea,
      scene_count: parent.scene_count,
      user_name: parent.user_name,
      status: "planning_scenes",
      parent_project_id: parent.id
    });

    const existingScenes = await VideoScene.filter({ project_id: parent.id });
    await VideoScene.bulkCreate(existingScenes.map(s => ({
      project_id: variant.id,
      scene_number: s.scene_number,
      scene_description: s.scene_description,
      video_prompt: s.video_prompt,
      original_prompt: s.original_prompt,
      enhanced_prompt: s.enhanced_prompt,
      video_seed: s.video_seed,
      video_model: "veo3_fast",
      video_duration: s.video_duration || 8,
      video_aspect_ratio: s.video_aspect_ratio || "16:9",
      video_resolution: s.video_resolution || "720p",
      asset_status: "pending_assets"
    })));

    setCurrentProject(variant);
    toast.success("Split-test variant created. You can modify prompts and re-run scenes.");
  };

  const refreshSceneList = async () => {
    if (!currentProject) return;
    setRefreshToggle(s => !s);
  };

  const [projectScenes, setProjectScenes] = useState([]);
  useEffect(() => {
    (async () => {
      if (!currentProject?.id) {
        setProjectScenes([]);
        return;
      }
      const list = await VideoScene.filter({ project_id: currentProject.id }, "scene_number");
      setProjectScenes(list.sort((a, b) => a.scene_number - b.scene_number));
    })();
  }, [currentProject, refreshToggle]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Film className="w-5 h-5 text-cyan-400" /> Video Studio</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white/10 border-white/20" onClick={createSplitTest} disabled={!currentProject}><GitBranch className="w-4 h-4 mr-2" /> Split-test</Button>
            <Button onClick={stitchNow} className="bg-cyan-500 hover:bg-cyan-400" disabled={!currentProject}><Scissors className="w-4 h-4 mr-2" /> Stitch Manually</Button>
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label className="text-sm text-white/80">Brand (Username)</Label>
              <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {usernames.map(u => (
                    <SelectItem key={u.id} value={u.user_name}>{u.display_name || u.user_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm text-white/80">Project Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Honey Brand Launch Teaser" className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="md:col-span-5">
              <Label className="text-sm text-white/80">Your Comprehensive Prompt</Label>
              <Textarea value={idea} onChange={e => setIdea(e.target.value)} rows={4} placeholder="Describe the full story, style, pacing, and visual details..." className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:col-span-5">
              <div>
                <Label className="text-sm text-white/80">Clip Length (sec)</Label>
                <Select value={String(clipLength)} onValueChange={v => setClipLength(Number(v))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5,6,7,8,9,10,12].map(v => <SelectItem key={v} value={String(v)}>{v}s</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-white/80">Scene Count</Label>
                <Select value={String(sceneCount)} onValueChange={v => setSceneCount(Number(v))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3,4,5,6,7,8,9,10].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchScenes} className="w-full bg-indigo-500 hover:bg-indigo-400" disabled={loadingScenes}>
                  {loadingScenes ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fetching...</> : <><Wand2 className="w-4 h-4 mr-2" /> Build Scenes</>}
                </Button>
              </div>
              <div className="flex items-end">
                <Button onClick={createProject} className="w-full" variant="outline" disabled={!scenes.length || !title.trim() || !selectedUsername}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Create Project
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {!!currentProject && (
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white/80">Project: <span className="font-medium">{currentProject.title}</span> {currentProject.parent_project_id ? <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded">Variant of {currentProject.parent_project_id}</span> : null}</div>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20" onClick={refreshSceneList}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            </div>

            {projectScenes.length === 0 ? (
              <div className="text-white/60 py-8 text-center">No scenes yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectScenes.map(s => (
                  <div key={s.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-white/70">Scene {s.scene_number}</div>
                      <div className="text-xs">
                        {s.asset_status === "complete" ? <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Ready</span> :
                         s.asset_status === "generating" ? <span className="inline-flex items-center gap-1 text-yellow-300"><Loader2 className="w-4 h-4 animate-spin" /> Generating</span> :
                         s.asset_status === "failed" ? <span className="text-red-400">Failed</span> :
                         <span className="text-white/50">Pending</span>}
                      </div>
                    </div>

                    <Label className="text-xs text-white/70">Scene Prompt</Label>
                    <Textarea
                      className="bg-white/10 border-white/20 text-white mb-2"
                      rows={4}
                      value={s.video_prompt || ""}
                      onChange={async (e) => {
                        const v = e.target.value;
                        setProjectScenes(prev => prev.map(px => px.id === s.id ? { ...px, video_prompt: v } : px));
                        await VideoScene.update(s.id, { video_prompt: v });
                      }}
                    />

                    {s.video_clip_url ? (
                      <video src={s.video_clip_url} controls className="w-full rounded mb-2" />
                    ) : null}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => rerunScene(s)}
                        disabled={!!generatingMap[s.scene_number]}
                        className="bg-cyan-500 hover:bg-cyan-400"
                      >
                        {generatingMap[s.scene_number] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        {s.video_clip_url ? "Re-run" : "Generate"}
                      </Button>
                      {s.video_clip_url ? (
                        <Button size="sm" variant="outline" className="bg-white/10 border-white/20" onClick={() => navigator.clipboard.writeText(s.video_clip_url).then(() => toast.success("Clip URL copied"))}>
                          <Copy className="w-4 h-4 mr-2" /> Copy URL
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}