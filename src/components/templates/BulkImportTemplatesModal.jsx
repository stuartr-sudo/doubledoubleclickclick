import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CustomContentTemplate } from "@/api/entities";
import { Upload } from "lucide-react";

const SAMPLE_JSON = `[
  {
    "name": "Product Card - Clean",
    "description": "Simple product card with image left",
    "associated_ai_feature": "product",
    "html_structure": "<div style=\\"display:flex;gap:16px\\"><img src=\\"{{PRODUCT_IMAGE_URL}}\\" alt=\\"{{PRODUCT_NAME}}\\" style=\\"width:160px;object-fit:contain\\"/><div><h3>{{PRODUCT_NAME}}</h3><p>{{PRODUCT_DESCRIPTION}}</p></div></div>",
    "is_active": true
  },
  {
    "name": "CTA - Glow",
    "description": "Call to action with glow button",
    "associated_ai_feature": "cta",
    "html_structure": "<div style=\\"padding:16px;border:1px solid #e2e8f0;border-radius:12px\\"><h3>{{HEADLINE}}</h3><p>{{SUBTEXT}}</p><a href=\\"{{BUTTON_URL}}\\" style=\\"display:inline-block;background:#111;color:#fff;padding:10px 14px;border-radius:10px\\">{{BUTTON_TEXT}}</a></div>",
    "is_active": true
  }
]`;

export default function BulkImportTemplatesModal({
  open,
  onOpenChange,
  onImported
}) {
  const [jsonText, setJsonText] = React.useState("");
  const [skipDuplicates, setSkipDuplicates] = React.useState(true);
  const [defaultFeature, setDefaultFeature] = React.useState("");
  const [defaultUsername, setDefaultUsername] = React.useState("");

  const fileInputRef = React.useRef(null);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setJsonText(text);
      toast.success("File loaded. Review and import.");
    } catch (err) {
      toast.error("Failed to read file");
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  const normalizeRecord = (r) => {
    const out = {
      name: r.name?.toString()?.trim(),
      description: r.description ?? "",
      associated_ai_feature: r.associated_ai_feature || defaultFeature || undefined,
      html_structure: r.html_structure,
      user_name: r.user_name || (defaultUsername || undefined),
      is_active: r.is_active !== false,
      preview_data: r.preview_data
    };
    // remove undefined keys
    Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
    return out;
  };

  const handleImport = async () => {
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch {
      toast.error("Invalid JSON. Please paste a JSON array of templates.");
      return;
    }
    if (!Array.isArray(data) || data.length === 0) {
      toast.error("JSON must be a non-empty array.");
      return;
    }

    // Minimal validation
    const cleaned = data
      .map(normalizeRecord)
      .filter((r) => r.name && r.html_structure);

    if (cleaned.length === 0) {
      toast.error("No valid records found (each record needs name and html_structure).");
      return;
    }

    try {
      let toCreate = cleaned;

      if (skipDuplicates) {
        const existing = await CustomContentTemplate.list().catch(() => []);
        const existingNames = new Set((existing || []).map((t) => (t.name || "").toLowerCase()));
        toCreate = cleaned.filter((r) => !existingNames.has(r.name.toLowerCase()));
      }

      if (toCreate.length === 0) {
        toast.message("Nothing to import", {
          description: skipDuplicates ? "All names already exist. Disable 'Skip duplicates' to attempt all." : undefined
        });
        return;
      }

      // Prefer bulkCreate when available
      if (CustomContentTemplate.bulkCreate) {
        await CustomContentTemplate.bulkCreate(toCreate);
      } else {
        // Fallback: sequential create
        // eslint-disable-next-line no-restricted-syntax
        for (const rec of toCreate) {
          // eslint-disable-next-line no-await-in-loop
          await CustomContentTemplate.create(rec);
        }
      }

      toast.success(`Imported ${toCreate.length} template${toCreate.length > 1 ? "s" : ""}`);
      onImported?.();
      onOpenChange(false);
      setJsonText("");
    } catch (err) {
      toast.error("Import failed. See console for details.");
      console.error("Bulk import error:", err);
    }
  };

  const resetAndClose = () => {
    setJsonText("");
    setDefaultFeature("");
    setDefaultUsername("");
    setSkipDuplicates(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-3xl bg-white border border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Bulk Import Templates</DialogTitle>
          <DialogDescription>Paste a JSON array of templates or load a .json file. Each item must include at least "name" and "html_structure".</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label className="text-slate-700">Default Feature (optional)</Label>
              <Select value={defaultFeature} onValueChange={setDefaultFeature}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="No default" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="product">product</SelectItem>
                  <SelectItem value="cta">cta</SelectItem>
                  <SelectItem value="email_form">email_form</SelectItem>
                  <SelectItem value="tldr">tldr</SelectItem>
                  <SelectItem value="testimonial">testimonial</SelectItem>
                  <SelectItem value="faq">faq</SelectItem>
                  <SelectItem value="callout">callout</SelectItem>
                  <SelectItem value="fact">fact</SelectItem>
                  <SelectItem value="general">general</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Label className="text-slate-700">Default Username (optional)</Label>
              <Input
                placeholder="e.g. acme_brand"
                value={defaultUsername}
                onChange={(e) => setDefaultUsername(e.target.value)}
                className="bg-white border-slate-300" />
            </div>
            <div className="md:col-span-1 flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={skipDuplicates}
                  onCheckedChange={setSkipDuplicates}
                  className="bg-slate-300 data-[state=checked]:bg-emerald-600" />
                <Label className="text-slate-700">Skip duplicates by name</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePickFile} className="bg-white border-slate-300">
              <Upload className="w-4 h-4 mr-2" />
              Load .json file
            </Button>
            <Button variant="ghost" onClick={() => setJsonText(SAMPLE_JSON)} className="text-slate-600">Paste sample</Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden" />
          </div>

          <div>
            <Label className="text-slate-700 mb-1 block">Templates JSON</Label>
            <Textarea
              rows={14}
              placeholder={SAMPLE_JSON}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="bg-white border-slate-300 font-mono text-sm" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetAndClose} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</Button>
            <Button onClick={handleImport} className="bg-indigo-700 hover:bg-indigo-800">Import Templates</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}