
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { Wand2, Film, Mic, Music, Loader2, ToggleLeft, ToggleRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const promptModifiers = {
  Style: ["Cinematic", "Anime", "Documentary", "Vibrant Colors", "Minimalist", "Black and White", "Epic Fantasy", "Sci-Fi", "Wes Anderson Style", "Vintage Film", "Claymation", "3D Render"],
  "Shot Type": ["Drone Shot", "Macro Shot", "First-Person POV", "Wide Angle Shot", "Tracking Shot", "Time-lapse", "Slow-motion"],
  Lighting: ["Golden Hour Lighting", "Studio Lighting", "Moody & Dark", "Neon Glow", "Backlit Silhouette", "Volumetric Lighting"],
};

const voiceOptions = [
    { id: 'Rachel', name: 'Rachel (Standard Female)' },
    { id: 'Aria', name: 'Aria (Conversational)' },
    { id: 'Sarah', name: 'Sarah (Narration)' },
    { id: 'Jessica', name: 'Jessica (Expressive)' },
    { id: 'Laura', name: 'Laura (Documentary)' },
    { id: 'Charlotte', name: 'Charlotte (Youthful)' },
    { id: 'Matilda', name: 'Matilda (Warm)' },
    { id: 'Lily', name: 'Lily (Soft)' },
    { id: 'Roger', name: 'Roger (Standard Male)' },
    { id: 'Will', name: 'Will (Deep, Narration)' },
    { id: 'Charlie', name: 'Charlie (Casual)' },
    { id: 'George', name: 'George (Authoritative)' },
    { id: 'Chris', name: 'Chris (Warm)' },
    { id: 'Brian', name: 'Brian (Deep)' },
    { id: 'Daniel', name: 'Daniel (Well-Paced)' },
];

const wanEffects = [
  "cakeify", "squish", "muscle", "inflate", "crush", "rotate", "gun-shooting", 
  "deflate", "hulk", "baby", "bride", "classy", "puppy", "snow-white", 
  "disney-princess", "mona-lisa", "painting", "pirate-captain", "princess", 
  "jungle", "samurai", "vip", "warrior", "zen", "assassin", "timelapse", 
  "tsunami", "fire", "zoom-call", "doom-fps", "fus-ro-dah", "hug-jesus", 
  "robot-face-reveal", "super-saiyan", "jumpscare", "laughing", 
  "cartoon-jaw-drop", "crying", "kissing", "angry-face", 
  "selfie-younger-self", "animeify", "blast"
];

const mareyDimensions = ["1920x1080", "1080x1920", "1152x1152", "1536x1152", "1152x1536"];
const mareyDurations = ["5s", "10s"];

export default function SceneEditor({ scene, onUpdate, onGenerate }) {
  const [localScene, setLocalScene] = useState(scene);

  useEffect(() => {
    setLocalScene(scene);
  }, [scene]);

  const handleFieldChange = (field, value) => {
    const updatedScene = { ...localScene, [field]: value };
    setLocalScene(updatedScene);
    onUpdate(updatedScene);
  };

  const handleModifierToggle = (modifier) => {
    const currentPrompt = localScene.video_prompt || "";
    let promptParts = currentPrompt.split(',').map(p => p.trim()).filter(Boolean);
    
    if (promptParts.includes(modifier)) {
      promptParts = promptParts.filter(p => p !== modifier);
    } else {
      promptParts.push(modifier);
    }
    
    handleFieldChange('video_prompt', promptParts.join(', '));
  };

  const getSeedanceAspectRatioOptions = () => {
      return ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"];
  };
  
  const isGenerating = scene.asset_status === 'generating';

  return (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-6">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-cyan-400">Scene {scene.scene_number}</h3>
        <Badge variant={scene.asset_status === 'complete' ? 'default' : 'outline'} className={scene.asset_status === 'complete' ? 'bg-green-500/20 text-green-300' : 'text-slate-300'}>
          {scene.asset_status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`scene-desc-${scene.id}`} className="font-semibold">Scene Description</Label>
        <Textarea
          id={`scene-desc-${scene.id}`}
          value={localScene.scene_description}
          onChange={(e) => handleFieldChange('scene_description', e.target.value)}
          placeholder="e.g., A wide shot of a majestic castle on a hill at sunset."
          className="bg-slate-900 border-slate-600 h-24"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-700"></div>
        <div className="text-sm text-slate-400 font-medium">AI Generated Prompts (Editable)</div>
        <div className="flex-1 h-px bg-slate-700"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
            <Label className="font-semibold flex items-center gap-2"><Film className="w-4 h-4 text-rose-400" />Video Generation</Label>
            <Select value={localScene.video_generation_type || 'text-to-video'} onValueChange={(v) => handleFieldChange('video_generation_type', v)}>
                <SelectTrigger className="bg-slate-900 border-slate-600"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                    <SelectItem value="text-to-video">Text-to-Video (Seedance)</SelectItem>
                    <SelectItem value="image-to-video">Image-to-Video (Wan Effects)</SelectItem>
                    <SelectItem value="marey-i2v">Image-to-Video (Marey Realism)</SelectItem>
                </SelectContent>
            </Select>
            
            {localScene.video_generation_type === 'text-to-video' && (
                <div className="space-y-4 pt-2">
                    <Textarea 
                        id={`video-prompt-${scene.id}`} 
                        value={localScene.video_prompt || ""} 
                        onChange={(e) => handleFieldChange('video_prompt', e.target.value)} 
                        className="bg-slate-900 border-slate-600 h-28" 
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                        {Object.entries(promptModifiers).map(([category, modifiers]) => (
                          <DropdownMenu key={category}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="bg-slate-700/50 border-slate-600 text-slate-300">
                                {category} <ChevronDown className="w-4 h-4 ml-2" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-800/95 border border-white/20 text-white">
                              {modifiers.map(modifier => (
                                <DropdownMenuCheckboxItem
                                  key={modifier}
                                  checked={localScene.video_prompt?.includes(modifier)}
                                  onCheckedChange={() => handleModifierToggle(modifier)}
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  {modifier}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ))}
                    </div>
                </div>
            )}

            {localScene.video_generation_type === 'image-to-video' && (
                <div className="space-y-4 pt-2">
                    <div>
                        <Label htmlFor={`source-image-${scene.id}`}>Source Image URL</Label>
                        <Input 
                            id={`source-image-${scene.id}`} 
                            placeholder="https://..." 
                            value={localScene.source_image_url || ''} 
                            onChange={(e) => handleFieldChange('source_image_url', e.target.value)} 
                            className="bg-slate-900 border-slate-600" 
                        />
                    </div>
                     <div>
                        <Label htmlFor={`effect-subject-${scene.id}`}>Effect Subject</Label>
                        <Input 
                            id={`effect-subject-${scene.id}`} 
                            placeholder="e.g., a cute kitten" 
                            value={localScene.effect_subject || ''} 
                            onChange={(e) => handleFieldChange('effect_subject', e.target.value)} 
                            className="bg-slate-900 border-slate-600" 
                        />
                    </div>
                    <div>
                        <Label htmlFor={`effect-type-${scene.id}`}>Effect Type</Label>
                        <Select value={localScene.effect_type} onValueChange={(v) => handleFieldChange('effect_type', v)}>
                            <SelectTrigger id={`effect-type-${scene.id}`} className="bg-slate-900 border-slate-600"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                                {wanEffects.map(effect => <SelectItem key={effect} value={effect}>{effect}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {localScene.video_generation_type === 'marey-i2v' && (
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor={`source_image_url-${scene.id}`} className="font-semibold">Source Image URL</Label>
                  <Input id={`source_image_url-${scene.id}`} value={localScene.source_image_url || ""} onChange={(e) => handleFieldChange('source_image_url', e.target.value)} className="bg-slate-900 border-slate-600" placeholder="https://.../image.png" />
                </div>
                <div>
                  <Label htmlFor={`marey_negative_prompt-${scene.id}`} className="font-semibold">Negative Prompt (Optional)</Label>
                  <Textarea id={`marey_negative_prompt-${scene.id}`} value={localScene.marey_negative_prompt || ""} onChange={(e) => handleFieldChange('marey_negative_prompt', e.target.value)} className="bg-slate-900 border-slate-600 h-20" placeholder="blurry, worst quality, bad..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dimensions</Label>
                    <Select value={localScene.marey_dimensions} onValueChange={(v) => handleFieldChange('marey_dimensions', v)}>
                      <SelectTrigger className="bg-slate-900 border-slate-600"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                        {mareyDimensions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Select value={localScene.marey_duration} onValueChange={(v) => handleFieldChange('marey_duration', v)}>
                      <SelectTrigger className="bg-slate-900 border-slate-600"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                        {mareyDurations.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`narration-script-${scene.id}`} className="font-semibold flex items-center gap-2"><Mic className="w-4 h-4 text-amber-400" />Narration Script</Label>
          <Textarea id={`narration-script-${scene.id}`} value={localScene.narration_script || ""} onChange={(e) => handleFieldChange('narration_script', e.target.value)} className="bg-slate-900 border-slate-600 h-40" />
           <div className="pt-2">
              <Label>Narration Voice</Label>
              <Select value={localScene.narration_voice} onValueChange={(v) => handleFieldChange('narration_voice', v)}>
                  <SelectTrigger className="bg-slate-900 border-slate-600"><SelectValue placeholder="Select a voice..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                    {voiceOptions.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`music-prompt-${scene.id}`} className="font-semibold flex items-center gap-2"><Music className="w-4 h-4 text-violet-400" />Music Prompt</Label>
          <Textarea id={`music-prompt-${scene.id}`} value={localScene.music_prompt || ""} onChange={(e) => handleFieldChange('music_prompt', e.target.value)} className="bg-slate-900 border-slate-600 h-40" />
        </div>
      </div>

      {(localScene.video_generation_type === 'text-to-video') && (
          <div className="border-t border-slate-700 pt-6">
              <h4 className="font-semibold mb-4">Video Generation Settings (Seedance)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                      <Label>Aspect Ratio</Label>
                      <Select value={localScene.video_aspect_ratio} onValueChange={(v) => handleFieldChange('video_aspect_ratio', v)}>
                          <SelectTrigger className="bg-slate-900 border-slate-600"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                              {getSeedanceAspectRatioOptions().map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div>
                      <Label>Resolution</Label>
                      <Select value={localScene.video_resolution} onValueChange={(v) => handleFieldChange('video_resolution', v)}>
                          <SelectTrigger className="bg-slate-900 border-slate-600"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                              <SelectItem value="480p">480p</SelectItem>
                              <SelectItem value="720p">720p</SelectItem>
                              <SelectItem value="1080p">1080p</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div>
                      <Label>Duration (sec)</Label>
                      <Select value={String(localScene.video_duration)} onValueChange={(v) => handleFieldChange('video_duration', Number(v))}>
                          <SelectTrigger className="bg-slate-900 border-slate-600"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-800/95 border border-white/20 text-white max-h-60 overflow-y-auto">
                              {[3,4,5,6,7,8,9,10,11,12].map(d => <SelectItem key={d} value={String(d)}>{d}s</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div>
                      <Label>Fixed Camera</Label>
                      <Button variant="outline" onClick={() => handleFieldChange('video_camera_fixed', !localScene.video_camera_fixed)} className="w-full flex justify-start gap-2 bg-slate-900 border-slate-600">
                          {localScene.video_camera_fixed ? <ToggleRight className="text-green-400"/> : <ToggleLeft />}
                          {localScene.video_camera_fixed ? 'Enabled' : 'Disabled'}
                      </Button>
                  </div>
              </div>
          </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-700 pt-6">
        <div className="w-full md:w-auto grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
            {scene.video_clip_url && (
                <div>
                    <Label className="font-semibold">Generated Video</Label>
                    <video src={scene.video_clip_url} controls muted loop className="w-full rounded-lg mt-2 bg-black"></video>
                </div>
            )}
            {scene.narration_audio_url && (
                <div>
                    <Label className="font-semibold">Generated Narration</Label>
                    <audio src={scene.narration_audio_url} controls className="w-full rounded-lg mt-2"></audio>
                </div>
            )}
            {scene.music_track_url && (
                <div>
                    <Label className="font-semibold">Generated Music</Label>
                    <audio src={scene.music_track_url} controls className="w-full rounded-lg mt-2"></audio>
                </div>
            )}
        </div>
        <Button onClick={() => onGenerate(localScene)} disabled={isGenerating} className="bg-green-600 hover:bg-green-700 font-bold self-end mt-4 md:mt-0">
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Generate Assets for This Scene</>}
        </Button>
      </div>

    </div>
  );
}
