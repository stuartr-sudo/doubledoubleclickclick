
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Video } from "lucide-react";
import { generateWavespeedVideo } from "@/api/functions";
import { getWavespeedResult } from "@/api/functions";

export default function WavespeedStudio() {
  const [prompt, setPrompt] = useState("the iron man transform into the sport car");
  const [imagesText, setImagesText] = useState([
    "https://d3gnftk2yhz9lr.wavespeed.ai/media/images/1745494594983907143_liqlhd9u.jpg",
    "https://d3gnftk2yhz9lr.wavespeed.ai/media/images/1745494607637805608_31gIDzwr.jpg",
  ].join("\n"));
  const [duration, setDuration] = useState(4);
  const [movementAmplitude, setMovementAmplitude] = useState("auto");
  const [seed, setSeed] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // New state for polling
  const [requestId, setRequestId] = useState(null);
  const [status, setStatus] = useState(null);
  const [outputs, setOutputs] = useState([]);
  const pollRef = React.useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (id) => {
    stopPolling();
    setStatus("processing");
    pollRef.current = setInterval(async () => {
      const { data } = await getWavespeedResult({ id });
      const s = data?.result?.data?.status || data?.result?.status || null;
      setStatus(s);
      if (s === "completed") {
        const outs = data?.result?.data?.outputs || data?.result?.outputs || [];
        setOutputs(Array.isArray(outs) ? outs : []);
        stopPolling();
        setIsLoading(false);
      } else if (s === "failed") {
        stopPolling();
        setIsLoading(false);
      }
    }, 2500);
  };

  React.useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);
    setOutputs([]); // Clear previous outputs
    setRequestId(null); // Clear previous request ID
    setStatus(null); // Clear previous status
    stopPolling(); // Stop any active polling

    const images = imagesText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const { data } = await generateWavespeedVideo({
      duration: Number(duration) || 4,
      images,
      movement_amplitude: movementAmplitude || "auto",
      prompt: prompt || "",
      seed: Number(seed) || 0,
    });

    setResponse(data);

    // Try to extract request/task id from various shapes
    const rid =
      data?.result?.data?.id ||
      data?.result?.id ||
      data?.data?.id ||
      data?.id ||
      null;

    if (rid) {
      setRequestId(rid);
      setStatus("created"); // Initial status when ID is received
      startPolling(rid);
    } else {
      // No id means API likely returned final URL immediately, stop loading
      setIsLoading(false);
    }
  };

  // Try to detect a video URL in the response for convenience
  const detectVideoUrl = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    // Common fields
    if (obj.video_url) return obj.video_url;
    if (obj.url && String(obj.url).match(/\.(mp4|webm|mov)(\?|$)/i)) return obj.url;
    // Nested result fields
    if (obj.result?.video_url) return obj.result.video_url;
    if (obj.result?.url && String(obj.result.url).match(/\.(mp4|webm|mov)(\?|$)/i)) return obj.result.url;
    return null;
  };

  // Prioritize video from polling outputs, then fall back to initial response detection
  const videoUrl = outputs?.[0] || detectVideoUrl(response);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Video className="w-6 h-6 text-cyan-300" />
          <h1 className="text-2xl font-semibold">Wavespeed Studio</h1>
        </div>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Create video from two images</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <Label>Prompt</Label>
                <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the transition..." className="bg-white text-slate-900" />
              </div>

              <div>
                <Label>Images (one URL per line, at least 2)</Label>
                <Textarea rows={4} value={imagesText} onChange={(e) => setImagesText(e.target.value)} className="bg-white text-slate-900" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Duration (seconds)</Label>
                  <Input type="number" min="1" max="20" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-white text-slate-900" />
                </div>
                <div>
                  <Label>Movement amplitude</Label>
                  <Input value={movementAmplitude} onChange={(e) => setMovementAmplitude(e.target.value)} placeholder="auto or a number" className="bg-white text-slate-900" />
                </div>
                <div>
                  <Label>Seed</Label>
                  <Input type="number" value={seed} onChange={(e) => setSeed(e.target.value)} className="bg-white text-slate-900" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-400 text-black">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Generate Video
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mt-6 space-y-4">
          {(isLoading || status) && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <div className="text-sm">
                {status ? `Status: ${status}` : isLoading ? "Submitting..." : null}
                {requestId ? ` • Request ID: ${requestId}` : null}
              </div>
            </div>
          )}

          {videoUrl && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="font-medium mb-2">Preview</div>
              <video src={videoUrl} controls className="w-full rounded-lg bg-black" />
            </div>
          )}

          {response && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="font-medium mb-2">Raw response</div>
              <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
