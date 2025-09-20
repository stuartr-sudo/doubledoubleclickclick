
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clipboard as ClipboardIcon, AlertCircle } from "lucide-react";

// Force a simple, black-text HTML wrapper around pasted content
function toSimpleHtml(raw) {
  if (!raw) return "";
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  const ensureWrapper = (inner) => `<div style="color:#000;">${inner}</div>`;
  if (hasHtml) {
    return ensureWrapper(String(raw));
  }
  // Convert plaintext to paragraphs and line-breaks
  const parts = String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/g)
    .map(block =>
      `<p>${block
        .split("\n")
        .map(ln => (ln.length ? ln.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "<br/>"))
        .join("<br/>")}</p>`
    );
  return ensureWrapper(parts.join("\n"));
}

function deriveTitleFrom(text) {
  if (!text) return "Pasted Content";
  const plain = String(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 60) || "Pasted Content";
}

export default function PasteContentModal({
  isOpen,
  onClose,
  allowedUsernames = [],
  defaultUsername = "",
  onSubmit,
  autoReadClipboard = false,
  initialRaw = ""
}) {
  const [username, setUsername] = React.useState(defaultUsername || "");
  const [title, setTitle] = React.useState("");
  const [raw, setRaw] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [pasteLoading, setPasteLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const hasAutoPastedRef = React.useRef(false);

  React.useEffect(() => {
    if (isOpen) {
      setUsername(defaultUsername || "");
      setTitle("");
      setRaw(initialRaw || "");
      setError("");
      setSubmitting(false);
      setPasteLoading(false);
      hasAutoPastedRef.current = false;
    }
  }, [isOpen, defaultUsername, initialRaw]);

  React.useEffect(() => {
    if (!title && raw) setTitle(deriveTitleFrom(raw));
  }, [raw, title]);

  const canSubmit = !!username && !!raw && !submitting;

  // Replace the plain function with a memoized callback
  const handlePasteFromClipboard = React.useCallback(async () => {
    setPasteLoading(true);
    setError("");
    try {
      const txt = await navigator.clipboard.readText();
      if (!txt) {
        setError("Clipboard is empty or inaccessible. Please paste manually.");
      } else {
        setRaw((prev) => (prev ? `${prev}\n\n${txt}` : txt));
      }
    } catch (e) {
      setError("Couldn't read from clipboard. Use Cmd/Ctrl + V to paste.");
    } finally {
      setPasteLoading(false);
    }
  }, []); // setState functions are stable; no external deps

  // Ensure we include the memoized function in deps to satisfy the hook linter
  React.useEffect(() => {
    if (isOpen && autoReadClipboard && !hasAutoPastedRef.current) {
      hasAutoPastedRef.current = true;
      setTimeout(() => { handlePasteFromClipboard(); }, 50);
    }
  }, [isOpen, autoReadClipboard, handlePasteFromClipboard]);

  const handleCreate = async () => {
    setError("");
    if (!canSubmit) {
      setError("Please select a brand and paste some content.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit?.({
        title: title?.trim() || deriveTitleFrom(raw),
        content: toSimpleHtml(raw),
        user_name: username
      });
      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to create content.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-2xl bg-white text-slate-900 border border-slate-200">
        <DialogHeader>
          <DialogTitle>Paste content</DialogTitle>
          <DialogDescription>Paste text or HTML. We’ll save it as a draft (black text) and open it in the editor.</DialogDescription>
        </DialogHeader>

        {allowedUsernames.length === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            You don’t have any brands assigned. Ask an admin to assign a username before pasting.
          </div>
        )}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Brand (username)</Label>
            <Select value={username} onValueChange={setUsername} disabled={allowedUsernames.length === 0}>
              <SelectTrigger className="bg-white border-slate-300">
                <SelectValue placeholder={allowedUsernames.length ? "Select brand" : "No brands available"} />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {allowedUsernames.map((u) => (
                  <SelectItem key={u} value={u} className="hover:bg-slate-100">
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional title (auto-filled from content)"
              className="bg-white border-slate-300"
            />
          </div>

          {/* NEW: Paste from Clipboard action row */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePasteFromClipboard}
              disabled={pasteLoading}
              className="gap-2 bg-white border-slate-300"
              title="Read text from clipboard"
            >
              {pasteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardIcon className="w-4 h-4" />}
              Paste from Clipboard
            </Button>
            <div className="text-xs text-slate-500">Tip: You can also paste manually with Cmd/Ctrl + V</div>
          </div>

          <div className="grid gap-2">
            <Label>Content</Label>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste your content here..."
              rows={10}
              className="bg-white border-slate-300"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} className="bg-white border-slate-300">Cancel</Button>
            <Button onClick={handleCreate} disabled={!canSubmit} className="bg-slate-900 hover:bg-slate-800 text-white">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create Draft & Edit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
