import React, { useEffect, useState } from "react";
import LiveHtmlPreview from "@/components/html/LiveHtmlPreview";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { AlignLeft, AlignCenter, AlignRight, FileCode2, Monitor, MoveLeft, Download } from "lucide-react";

export default function HTMLStudio() {
  const navigate = useNavigate();
  const [html, setHtml] = useState("<h1>Start here</h1><p>Paste your HTML on the left. Click an image in the preview to resize or align it.</p>");
  const [selected, setSelected] = useState(null); // {id, width, align}

  useEffect(() => {
    const saved = localStorage.getItem("htmlstudio_content");
    if (saved) setHtml(saved);
  }, []);

  const sendToPreview = (msg) => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    win?.postMessage(msg, "*");
  };

  const applyWidth = (w) => {
    if (!selected) return;
    const width = Math.max(10, Math.min(100, Number(w)));
    setSelected(s => ({ ...(s || {}), width }));
    sendToPreview({ type: "apply-image", id: selected.id, width });
  };

  const applyAlign = (align) => {
    if (!selected) return;
    setSelected(s => ({ ...(s || {}), align }));
    sendToPreview({ type: "apply-image", id: selected.id, align });
  };

  const backToEditor = () => {
    localStorage.setItem("htmlstudio_content", html);
    navigate(createPageUrl("Editor") + "?importHtml=1");
  };

  const downloadHtml = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "content.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" onClick={backToEditor} className="gap-2">
            <MoveLeft className="w-4 h-4" /> Back to Editor
          </Button>
          <div className="flex items-center gap-2 text-slate-700">
            <Monitor className="w-4 h-4" />
            <span className="font-semibold">HTML Studio</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => localStorage.setItem("htmlstudio_content", html)}
            >
              Save Draft
            </Button>
            <Button variant="outline" onClick={downloadHtml} className="gap-2">
              <Download className="w-4 h-4" /> Download HTML
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source */}
        <div className="flex flex-col h-[80vh]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-600">
              <FileCode2 className="w-4 h-4" />
              <span className="font-medium">HTML</span>
            </div>
            <div className="text-xs text-slate-500">Live updates as you type</div>
          </div>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="flex-1 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="<div>Hello world</div>"
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col h-[80vh]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-600">
              <Monitor className="w-4 h-4" />
              <span className="font-medium">Preview</span>
            </div>
            {selected ? (
              <div className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2">
                <span className="text-xs text-slate-600">Image width</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={selected.width ?? 100}
                  onChange={(e) => applyWidth(e.target.value)}
                />
                <span className="text-xs text-slate-600 w-10 text-right">
                  {selected.width ?? 100}%
                </span>
                <div className="h-5 w-px bg-slate-200 mx-1" />
                <button
                  onClick={() => applyAlign("left")}
                  className={`p-1.5 rounded ${selected.align === "left" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                  title="Align left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => applyAlign("center")}
                  className={`p-1.5 rounded ${selected.align === "center" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                  title="Align center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => applyAlign("right")}
                  className={`p-1.5 rounded ${selected.align === "right" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
                  title="Align right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Click an image in the preview to adjust its size/alignment
              </div>
            )}
          </div>

          <div className="flex-1">
            <LiveHtmlPreview html={html} onImageSelect={setSelected} />
          </div>
        </div>
      </div>
    </div>
  );
}