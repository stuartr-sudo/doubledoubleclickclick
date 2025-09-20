import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import ReactQuill from "react-quill";

export default function TextEditorModal({ isOpen, onClose, initialText = "", onApply }) {
  const [value, setValue] = React.useState(initialText || "");

  React.useEffect(() => {
    // reset editor content each time it opens with the latest selection
    if (isOpen) setValue(initialText || "");
  }, [isOpen, initialText]);

  const modules = React.useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["clean"],
    ],
  }), []);

  const formats = [
    "header",
    "bold", "italic", "underline", "strike",
    "color", "background",
    "align",
    "list", "bullet",
    "blockquote", "code-block",
  ];

  const handleApply = () => {
    // ReactQuill value is HTML. Send it back to replace current selection/insert at caret.
    if (typeof onApply === "function") onApply(value || "");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="b44-modal max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle>Edit Text</DialogTitle>
          <DialogDescription>Apply basic formatting, then insert back into your document.</DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
            <ReactQuill
              theme="snow"
              value={value}
              onChange={setValue}
              modules={modules}
              formats={formats}
              placeholder="Type or paste text…"
              style={{ minHeight: 220 }}
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}