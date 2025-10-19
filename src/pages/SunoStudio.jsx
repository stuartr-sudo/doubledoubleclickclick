import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Loader2, Copy, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";

// import { generateSunoMusic } from "@/api/functions/generateSunoMusic"; // TODO: Implement Suno music generation
import { getSunoStatus } from "@/api/functions";

export default function SunoStudio() {
  const [prompt, setPrompt] = React.useState("");
  const [customMode, setCustomMode] = React.useState(false);
  const [instrumental, setInstrumental] = React.useState(false);
  const [model, setModel] = React.useState("V4_5");
  const [style, setStyle] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [negativeTags, setNegativeTags] = React.useState("");
  const [callBackUrl, setCallBackUrl] = React.useState("");

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [taskId, setTaskId] = React.useState(null);
  const [statusText, setStatusText] = React.useState("");
  const [tracks, setTracks] = React.useState([]);

  const pollRef = React.useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => stopPolling();
  }, []);

  const startPolling = (id) => {
    stopPolling();
    setStatusText("Queued... checking status");
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getSunoStatus({ taskId: id });
        const status = data?.status || "";
        if (status === "SUCCESS") {
          stopPolling();
          const list = data?.tracks || [];
          setTracks(Array.isArray(list) ? list : []);
          setIsGenerating(false);
          setStatusText("Completed");
          toast.success("Music generated successfully!");
        } else if (status === "PENDING" || status === "FIRST_SUCCESS" || status === "TEXT_SUCCESS") {
          setStatusText(`Processing... (${status})`);
        } else {
          stopPolling();
          setIsGenerating(false);
          setStatusText(status || "Failed");
          toast.error(`Generation failed: ${status || "Unknown error"}`);
        }
      } catch (e) {
        stopPolling();
        setIsGenerating(false);
        setStatusText("Error");
        toast.error("Failed to check status.");
      }
    }, 10000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt.");
      return;
    }
    setTracks([]);
    setIsGenerating(true);
    setStatusText("Submitting...");
    try {
      const payload = {
        prompt,
        customMode,
        instrumental,
        model,
      };
      if (style.trim()) payload.style = style.trim();
      if (title.trim()) payload.title = title.trim();
      if (negativeTags.trim()) payload.negativeTags = negativeTags.trim();
      if (callBackUrl.trim()) payload.callBackUrl = callBackUrl.trim();

      // TODO: Implement Suno music generation
      toast.error("Suno music generation is temporarily disabled during migration.");
      setIsGenerating(false);
      return;
    } catch (e) {
      setIsGenerating(false);
      setStatusText("");
      toast.error(e?.message || "Failed to submit generation.");
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Music className="w-5 h-5 text-emerald-400" />
              Suno Studio
            </h1>
            <p className="text-white/70 text-sm">
              Generate AI music with Kei AI (Suno) and fetch the final audio when it’s ready.
            </p>
          </div>
          <div className="text-xs text-white/60">
            API: https://api.kie.ai • Auth: Bearer KEI_AI_API
          </div>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="block mb-2">Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A calm and relaxing piano track with soft melodies"
                  rows={3}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>

              <div>
                <Label className="block mb-2">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V3_5">V3_5 – structured songs</SelectItem>
                    <SelectItem value="V4">V4 – improved vocals</SelectItem>
                    <SelectItem value="V4_5">V4_5 – smart prompts</SelectItem>
                    <SelectItem value="V4_5PLUS">V4_5PLUS – richer sound</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="block">Custom Mode</Label>
                <Button
                  variant="outline"
                  className={`ml-auto ${customMode ? 'bg-emerald-600/30 border-emerald-500/40' : 'bg-white/10 border-white/20'}`}
                  onClick={() => setCustomMode(!customMode)}
                >
                  {customMode ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Label className="block">Instrumental Only</Label>
                <Button
                  variant="outline"
                  className={`ml-auto ${instrumental ? 'bg-emerald-600/30 border-emerald-500/40' : 'bg-white/10 border-white/20'}`}
                  onClick={() => setInstrumental(!instrumental)}
                >
                  {instrumental ? 'Yes' : 'No'}
                </Button>
              </div>

              {customMode && (
                <>
                  <div>
                    <Label className="block mb-2">Style (Custom Mode)</Label>
                    <Input
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      placeholder="e.g., Folk, Acoustic, Nostalgic"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div>
                    <Label className="block mb-2">Title (Custom Mode)</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Track title (max 80 chars)"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <Label className="block mb-2">Negative Tags (optional)</Label>
                <Input
                  value={negativeTags}
                  onChange={(e) => setNegativeTags(e.target.value)}
                  placeholder="e.g., noisy, distorted, off-key"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="block mb-2">Callback URL (optional)</Label>
                <Input
                  value={callBackUrl}
                  onChange={(e) => setCallBackUrl(e.target.value)}
                  placeholder="https://your-app.com/suno-callback"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isGenerating ? "Generating..." : "Generate Music"}
              </Button>
              {taskId && (
                <div className="text-sm text-white/70">
                  Task: <span className="font-mono text-white">{taskId}</span> • {statusText}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {tracks && tracks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Generated Tracks</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {tracks.map((t, idx) => (
                <Card key={t.id || idx} className="bg-white/5 border-white/10">
                  <CardContent className="p-4 space-y-3">
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.title || `Track ${idx+1}`} className="w-full h-40 object-cover rounded-md" />
                    ) : null}
                    <div className="font-medium">
                      {t.title || `Track ${idx + 1}`}
                    </div>
                    <div className="text-xs text-white/60">
                      Duration: {Math.round((t.duration || 0))}s {t.tags ? `• ${t.tags}` : ""}
                    </div>
                    {t.audioUrl && (
                      <audio controls className="w-full">
                        <source src={t.audioUrl} type="audio/mpeg" />
                      </audio>
                    )}
                    <div className="flex gap-2">
                      {t.audioUrl && (
                        <>
                          <Button
                            variant="outline"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            onClick={() => copyText(t.audioUrl)}
                          >
                            <Copy className="w-4 h-4 mr-2" /> Copy URL
                          </Button>
                          <a
                            className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                            href={t.audioUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" /> Open
                          </a>
                          <a
                            className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                            href={t.audioUrl}
                            download
                          >
                            <Download className="w-4 h-4 mr-2" /> Download
                          </a>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}