import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function FlashToggleModal({ 
  isOpen, 
  onClose, 
  onToggle, 
  currentEnabled = false,
  wordCount = 0,
  minWords = 400 
}) {
  const [isEnabled, setIsEnabled] = useState(currentEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const handleApply = async () => {
    if (isEnabled && wordCount < minWords) {
      toast.error(`Content must be at least ${minWords} words to enable Flash AI Enhancement`, {
        description: `Current: ${wordCount} words. Minimum: ${minWords} words.`
      });
      return;
    }

    setIsSaving(true);
    try {
      await onToggle(isEnabled);
      onClose();
      
      if (isEnabled) {
        toast.success("Flash AI Enhancement enabled!", {
          description: "Content will be automatically enhanced when it arrives."
        });
      } else {
        toast.success("Flash AI Enhancement disabled");
      }
    } catch (error) {
      console.error("Failed to update Flash setting:", error);
      toast.error("Failed to update Flash setting");
    } finally {
      setIsSaving(false);
    }
  };

  const getWordCountStatus = () => {
    if (wordCount >= minWords) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
        text: "Word count requirement met",
        className: "text-green-600"
      };
    } else {
      return {
        icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
        text: `Need ${minWords - wordCount} more words`,
        className: "text-orange-600"
      };
    }
  };

  const wordStatus = getWordCountStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white text-slate-900 p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" /> 
            Flash AI Enhancement
          </DialogTitle>
          <DialogDescription className="text-slate-600 mt-2">
            Enable AI-powered content enhancement with automatic features and smart placeholders.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="flash-toggle" className="text-base font-medium text-slate-700">
                Enable Flash AI Enhancement
              </Label>
              <p className="text-sm text-slate-500">
                Automatically enhance content with AI features and smart placeholders
              </p>
            </div>
            <Switch
              id="flash-toggle"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={isSaving}
            />
          </div>

          {/* Word Count Status */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            {wordStatus.icon}
            <div>
              <p className={`text-sm font-medium ${wordStatus.className}`}>
                {wordStatus.text}
              </p>
              <p className="text-xs text-slate-500">
                Current: {wordCount} words | Required: {minWords} words
              </p>
            </div>
          </div>

          {/* Features List */}
          {isEnabled && (
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700">Auto-Insert Features:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  TLDR Summary
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Anchor Links Menu
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Summary Table
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  CTA Buttons
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  FAQ Section
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Citations
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Internal Links
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Clean HTML
                </div>
              </div>

              <h4 className="font-medium text-slate-700 mt-4">Smart Placeholders:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Images (2 locations)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Videos (1-3 locations)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Product (1 location)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Opinions (4-6 locations)
                </div>
              </div>
            </div>
          )}

          {/* Warning for insufficient words */}
          {isEnabled && wordCount < minWords && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Content too short for Flash Enhancement
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Flash AI Enhancement requires at least {minWords} words to work effectively. 
                  Add more content to enable this feature.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isSaving || (isEnabled && wordCount < minWords)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                {isEnabled ? 'Enable Flash' : 'Disable Flash'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
