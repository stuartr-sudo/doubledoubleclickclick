import React, { useEffect, useState, useMemo } from "react";
import { VideoProject } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clapperboard, Search, RefreshCw, Send, Eye, Video as VideoIcon } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { stitchWithJson2Video } from "@/api/functions";

const statusColors = {
  draft: "bg-slate-600/30 text-slate-200 border-slate-500/40",
  planning_scenes: "bg-blue-600/20 text-blue-200 border-blue-500/40",
  generating_assets: "bg-amber-600/20 text-amber-200 border-amber-500/40",
  assets_ready: "bg-emerald-600/20 text-emerald-200 border-emerald-500/40",
  assembling: "bg-cyan-600/20 text-cyan-200 border-cyan-500/40",
  complete: "bg-green-600/20 text-green-200 border-green-500/40",
  failed: "bg-red-600/20 text-red-200 border-red-500/40",
};

export default function VideoProjects() {
  const [me, setMe] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const user = await User.me();
        setMe(user);
        const projects = await VideoProject.list("-updated_date");
        let filtered = projects;

        const assigned = Array.isArray(user.assigned_usernames) ? user.assigned_usernames : [];
        if (assigned.length > 0) {
          const allow = new Set(assigned);
          filtered = projects.filter(p => p.user_name && allow.has(p.user_name));
        } else if (user.role !== "admin") {
          filtered = []; // no assignments and not admin -> nothing
        }

        setAllProjects(filtered);
      } catch (e) {
        console.error("Failed to load projects", e);
        toast.error("Could not load projects.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const visible = useMemo(() => {
    let list = allProjects;
    if (status !== "all") list = list.filter(p => p.status === status);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        p =>
          (p.title || "").toLowerCase().includes(s) ||
          (p.idea || "").toLowerCase().includes(s) ||
          (p.user_name || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [allProjects, q, status]);

  const handleStitch = async (project) => {
    try {
      toast.info("Dispatching project to stitching…");
      const { data } = await stitchWithJson2Video({ projectId: project.id });
      if (data?.dispatched) {
        toast.success("Stitching dispatched.");
        // Optimistic status change
        setAllProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: "assembling" } : p));
      } else if (data?.final_video_url) {
        toast.success("Final video is ready!");
        setAllProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: "complete", final_video_url: data.final_video_url } : p));
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.message("Stitch request sent.");
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to stitch project.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Clapperboard className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-bold">Video Projects</h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, idea, or username…"
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="planning_scenes">Planning</SelectItem>
                  <SelectItem value="generating_assets">Generating</SelectItem>
                  <SelectItem value="assets_ready">Assets Ready</SelectItem>
                  <SelectItem value="assembling">Assembling</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-white/70">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
            <VideoIcon className="w-10 h-10 mx-auto mb-3 text-white/60" />
            <div className="text-lg font-semibold">No projects found</div>
            <div className="text-white/60 text-sm mt-1">Try adjusting filters or create a new project in Video Producer.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((p) => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white line-clamp-1">{p.title || "Untitled Project"}</div>
                    <div className="text-xs text-white/60 mt-1">Scenes: {p.scene_count ?? "-"}</div>
                  </div>
                  <Badge variant="outline" className={`border ${statusColors[p.status] || "bg-slate-600/30 text-slate-200 border-slate-500/40"}`}>
                    {p.status?.replace(/_/g, " ")}
                  </Badge>
                </div>

                {p.final_video_url && (
                  <div className="mt-3 rounded-lg overflow-hidden bg-black">
                    <video src={p.final_video_url} className="w-full aspect-video" controls />
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={createPageUrl(`VideoProducer?projectId=${encodeURIComponent(p.id)}`)}>
                    <Button variant="outline" className="w-full border-white/20 text-white/90 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" /> Open
                    </Button>
                  </a>
                  <a href={createPageUrl(`VideoProducer?projectId=${encodeURIComponent(p.id)}&trigger=rerunAll`)}>
                    <Button variant="outline" className="w-full border-white/20 text-white/90 hover:bg-white/10">
                      <RefreshCw className="w-4 h-4 mr-2" /> Rerun all
                    </Button>
                  </a>
                  <Button onClick={() => handleStitch(p)} className="col-span-2 bg-cyan-600 hover:bg-cyan-700">
                    <Send className="w-4 h-4 mr-2" /> Send for stitching
                  </Button>
                </div>

                <div className="text-xs text-white/50 mt-3">
                  Updated: {new Date(p.updated_date || p.created_date).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}