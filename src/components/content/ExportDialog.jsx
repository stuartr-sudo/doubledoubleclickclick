import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { exportPosts } from "@/api/functions";
import { UploadFile, SendEmail } from "@/api/integrations";

export default function ExportDialog({ postIds = [], onClose }) {
  const [format, setFormat] = useState("pdf");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);
  const [imageHandling, setImageHandling] = useState("link"); // embed|link|separate (we currently output links)
  const [emailTo, setEmailTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const getExt = (fmt) => ({ pdf:"pdf", docx:"docx", markdown:"md", html:"html", json:"json" }[fmt] || "bin");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options = { includeMetadata, includeAnalytics, includeImages, imageHandling };
      const { data, headers } = await exportPosts({ postIds, format, options });
      const contentType = headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([data], { type: contentType });

      if (emailTo) {
        const fileName = `export-${Date.now()}.${postIds.length > 1 ? "zip" : getExt(format)}`;
        const file = new File([blob], fileName, { type: blob.type });
        const { file_url } = await UploadFile({ file });
        await SendEmail({
          to: emailTo,
          subject: "Your requested export is ready",
          body: `Download your export here: ${file_url}`
        });
        toast.success(`Export emailed to ${emailTo}`);
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${Date.now()}.${postIds.length > 1 ? "zip" : getExt(format)}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Export downloaded");
      }
      onClose();
    } catch (e) {
      toast.error(e?.message || "Export failed");
    }
    setIsExporting(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Content</DialogTitle>
          <DialogDescription>Export {postIds.length} {postIds.length === 1 ? "post" : "posts"} in your preferred format.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="mb-2 block">Format</Label>
            <RadioGroup value={format} onValueChange={setFormat} className="grid grid-cols-2 gap-2">
              {["pdf","docx","markdown","html","json"].map(f => (
                <div key={f} className="flex items-center space-x-2">
                  <RadioGroupItem id={`fmt-${f}`} value={f} />
                  <Label htmlFor={`fmt-${f}`} className="capitalize">{f}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Include metadata</Label>
              <Switch checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Include analytics</Label>
              <Switch checked={includeAnalytics} onCheckedChange={setIncludeAnalytics} />
            </div>
            {format !== "json" && (
              <>
                <div className="flex items-center justify-between">
                  <Label>Include images</Label>
                  <Switch checked={includeImages} onCheckedChange={setIncludeImages} />
                </div>
                <div>
                  <Label className="mb-2 block">Image handling</Label>
                  <Select value={imageHandling} onValueChange={setImageHandling}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Links (recommended)</SelectItem>
                      <SelectItem value="embed">Embed (limited)</SelectItem>
                      <SelectItem value="separate">Separate (zip-only; not implemented)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Email export (optional)</Label>
            <Input placeholder="name@company.com" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting...</>) : (<><Download className="w-4 h-4 mr-2" />Export</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}