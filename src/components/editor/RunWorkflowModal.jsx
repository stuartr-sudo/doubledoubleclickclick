import React from "react";
import { EditorWorkflow } from "@/api/entities";
import { WorkflowRunStatus } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Play, AlertCircle, ListOrdered } from "lucide-react";
import { executeEditorWorkflow } from "@/api/functions";

export default function RunWorkflowModal({ isOpen, onClose, currentHtml, onApply }) {
  const [workflows, setWorkflows] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [runId, setRunId] = React.useState(null);
  const [status, setStatus] = React.useState(null); // WorkflowRunStatus row
  const [error, setError] = React.useState("");

  const selectedWorkflow = React.useMemo(
    () => workflows.find(w => String(w.id) === String(selectedId)) || null,
    [workflows, selectedId]
  );

  React.useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      const list = await EditorWorkflow.filter({ is_active: true }, "-updated_date", 200).catch(() => []);
      if (active) setWorkflows(list || []);
    })();
    return () => { active = false; };
  }, [isOpen]);

  // Polling loop for status
  React.useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const arr = await WorkflowRunStatus.filter({ id: runId }).catch(() => []);
      if (cancelled) return;
      const row = arr && arr[0];
      if (row) {
        setStatus(row);
        if (row.status === "completed" || row.status === "failed") {
          clearInterval(interval);
          setRunning(false);
        }
      }
    }, 1500);
    return () => { cancelled = true; clearInterval(interval); };
  }, [runId]);

  const startRun = async () => {
    setError("");
    if (!selectedWorkflow) {
      setError("Please select a workflow.");
      return;
    }
    setRunning(true);
    // Create a status record first so we have an id to poll
    const run = await WorkflowRunStatus.create({
      workflow_id: selectedWorkflow.id,
      status: "pending",
      total_steps: (selectedWorkflow.workflow_steps || []).length,
      current_step_index: -1,
      current_step_name: "",
      progress_message: "Queued..."
    });
    setRunId(run.id);
    setStatus(run);

    // Fire-and-poll: kick off backend executor; we don't wait for it to finish
    executeEditorWorkflow({ run_id: run.id, workflow_id: selectedWorkflow.id, html: currentHtml })
      .then(() => {/* no-op; we rely on polling */})
      .catch((e) => {
        setError(e?.response?.data?.error || e?.message || "Failed to start workflow");
        setRunning(false);
      });
  };

  const resetAll = () => {
    setSelectedId("");
    setRunId(null);
    setStatus(null);
    setRunning(false);
    setError("");
  };

  const handleClose = () => {
    resetAll();
    onClose && onClose();
  };

  const progressPercent = React.useMemo(() => {
    if (!status || !status.total_steps || status.total_steps <= 0) return 0;
    const idx = status.current_step_index ?? -1;
    const completed = Math.max(0, idx + (status.status === "completed" ? 1 : 0));
    return Math.min(100, Math.round((completed / status.total_steps) * 100));
  }, [status]);

  const renderSteps = () => {
    const steps = (selectedWorkflow?.workflow_steps || []).map(s => s.type);
    const labels = {
      html_cleanup: "HTML Cleanup",
      tldr: "TL;DR Summary",
      humanize: "Humanize Text",
      cite_sources: "Add Citations",
      add_internal_links: "Add Internal Links",
      affilify: "Affilify",
      brand_it: "Brand It"
    };
    const currentIdx = status?.current_step_index ?? -1;

    return (
      <div className="space-y-2">
        {steps.length === 0 && (
          <div className="text-sm text-white/60">No steps defined in this workflow.</div>
        )}
        {steps.map((t, i) => {
          const state = status?.status === "failed"
            ? (i === currentIdx ? "failed" : i < currentIdx ? "done" : "pending")
            : i < currentIdx ? "done" : i === currentIdx ? "running" : "pending";
          return (
            <div key={`${t}-${i}`} className="flex items-center gap-2">
              {state === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {state === "running" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
              {state === "pending" && <ListOrdered className="w-4 h-4 text-white/40" />}
              {state === "failed" && <AlertCircle className="w-4 h-4 text-red-500" />}
              <span className="text-sm">{labels[t] || t}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-3xl">
        <DialogHeader>
          <DialogTitle>Run AI Agent Workflow</DialogTitle>
          <DialogDescription className="text-white/70">
            Select a workflow and watch step-by-step progress. You can apply the result to the editor when done.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workflow selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Workflow</label>
              <Select value={selectedId} onValueChange={setSelectedId} disabled={running}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a workflow..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 border-white/20 text-white max-h-[50vh] overflow-y-auto">
                  {(workflows || []).map(w => (
                    <SelectItem key={w.id} value={String(w.id)} className="text-white">
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedWorkflow?.description && (
                <p className="mt-2 text-sm text-white/70">{selectedWorkflow.description}</p>
              )}
            </div>
            <div className="flex md:justify-end">
              <Button onClick={startRun} disabled={!selectedWorkflow || running} className="gap-2">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? "Running..." : "Run"}
              </Button>
            </div>
          </div>

          {/* Step list and progress */}
          {selectedWorkflow && (
            <div className="rounded-lg border border-white/15 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Steps</div>
                <div className="text-xs text-white/60">
                  {status?.status || "idle"}{status?.progress_message ? ` • ${status.progress_message}` : ""}
                </div>
              </div>
              {renderSteps()}
              <div className="mt-3">
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {status?.status === "failed" && status?.error_message && (
            <div className="text-sm text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{status.error_message}</span>
            </div>
          )}

          {/* Result preview and apply */}
          {status?.status === "completed" && (
            <div className="space-y-3">
              <div className="text-sm text-white/70">Result preview:</div>
              <div className="rounded-lg border border-white/15 bg-white">
                <iframe
                  title="Workflow Result Preview"
                  className="w-full h-64"
                  srcDoc={status.result_html || ""}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    onApply && onApply(status.result_html || "");
                    handleClose();
                  }}
                >
                  Apply to Editor
                </Button>
                <Button variant="outline" onClick={handleClose} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}