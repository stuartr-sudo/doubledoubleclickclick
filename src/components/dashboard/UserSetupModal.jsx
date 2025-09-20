import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserX, Mail } from "lucide-react";

export default function UserSetupModal({ isOpen, currentUser }) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md backdrop-blur-xl bg-slate-800/95 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-amber-400" />
            Account Setup Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-lg p-4">
            <p className="text-amber-200 text-sm mb-3">
              Your account needs to be configured by an administrator before you can access content.
            </p>
            <div className="text-xs text-white/60 space-y-1">
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Role:</strong> {currentUser.role}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              What to do next:
            </h4>
            <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
              <li>Contact your administrator</li>
              <li>Ask them to assign you to specific usernames</li>
              <li>Once configured, refresh this page to access your content</li>
            </ul>
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-500 hover:to-gray-500"
          >
            Refresh Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}