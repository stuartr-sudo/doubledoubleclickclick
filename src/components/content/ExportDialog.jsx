import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { exportPosts } from "@/api/functions";
import { Download, FileText, Code } from "lucide-react";
import { toast } from "sonner";

export default function ExportDialog({ isOpen, onClose, selectedItems, usernames }) {
  const [format, setFormat] = useState("html");
  const [username, setUsername] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const payload = {
        format,
        username: username === "all" ? undefined : username,
        selectedIds: selectedItems?.length > 0 ? selectedItems : undefined
      };

      const { data } = await exportPosts(payload);

      if (data?.download_url) {
        // Create download link
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = `export_${format}_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast.success(`${format.toUpperCase()} file downloaded successfully!`);
        onClose();
      } else {
        toast.error("Failed to generate export file");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed: " + (error.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="format" className="text-slate-700">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format" className="bg-white border-slate-300 text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="html" className="hover:bg-slate-100">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    HTML File (.html)
                  </div>
                </SelectItem>
                <SelectItem value="txt" className="hover:bg-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Text File (.txt)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="username" className="text-slate-700">Filter by Username</Label>
            <Select value={username} onValueChange={setUsername}>
              <SelectTrigger id="username" className="bg-white border-slate-300 text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all" className="hover:bg-slate-100">All Usernames</SelectItem>
                {usernames.map((u) => (
                  <SelectItem key={u} value={u} className="hover:bg-slate-100">{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItems?.length > 0 && (
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
              Exporting {selectedItems.length} selected item{selectedItems.length === 1 ? '' : 's'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {isExporting ? "Exporting..." : `Export ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}