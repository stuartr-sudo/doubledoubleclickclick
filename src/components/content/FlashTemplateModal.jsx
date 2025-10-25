import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";

export default function FlashTemplateModal({ isOpen, onClose, onSelect, currentTemplate = "None" }) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate || "None");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSelect(selectedTemplate);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Select Flash Template
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Choose a content template to apply AI-powered enhancements to this article.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="flash-template" className="text-slate-700 font-medium">
              Template Type
            </Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger 
                id="flash-template"
                className="w-full justify-between bg-white border-slate-300 text-slate-900 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500">
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200 text-slate-900">
                <SelectItem value="None" className="text-sm hover:bg-slate-100">
                  None
                </SelectItem>
                <SelectItem value="Product Review" className="text-sm hover:bg-slate-100">
                  📦 Product Review
                </SelectItem>
                <SelectItem value="How-To Guide" className="text-sm hover:bg-slate-100">
                  📚 How-To Guide
                </SelectItem>
                <SelectItem value="Listicle" className="text-sm hover:bg-slate-100">
                  📝 Listicle
                </SelectItem>
                <SelectItem value="Educational" className="text-sm hover:bg-slate-100">
                  🎓 Educational
                </SelectItem>
                <SelectItem value="News & Blog" className="text-sm hover:bg-slate-100">
                  📰 News & Blog
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate !== "None" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This will apply {selectedTemplate} formatting and optimizations to your content.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="bg-white border-slate-300 hover:bg-slate-100 text-slate-900">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Apply Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

