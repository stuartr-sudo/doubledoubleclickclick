import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon } from "lucide-react";

export default function ImageGenerationPendingModal({ isOpen, onClose, onCloseLibrary }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md backdrop-blur-xl bg-white/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Image is being generated
          </DialogTitle>
          <DialogDescription>
            Your request was sent to the image generator.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Your image will be available in your library soon. Feel free to close this window.</span>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onClose} className="border-gray-300">
            Got it
          </Button>
          <Button onClick={onCloseLibrary} className="bg-blue-600 hover:bg-blue-700">
            Close Library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}