import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function ConfirmDeleteModal({
  open,
  title = "Delete record",
  description = "Are you sure you want to delete this record? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onClose
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose?.()}>
      <DialogContent className="b44-modal bg-white border border-slate-200 text-slate-900 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            className="bg-white border-slate-300 text-slate-900 hover:bg-slate-50"
            onClick={() => onClose?.()}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => onConfirm?.()}
            disabled={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}