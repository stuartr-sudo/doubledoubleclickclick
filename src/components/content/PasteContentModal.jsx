
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clipboard as ClipboardIcon, AlertCircle } from "lucide-react";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

/**
 * NEW: A robust HTML cleaner to strip all unwanted attributes and styles.
 * This function handles full HTML documents (including <head>, <meta>, etc.)
 * by parsing them and only using the content from the <body> tag.
 *
 * @param {string} htmlString - The raw HTML from the clipboard.
 * @returns {string} Cleaned HTML with only basic tags and no inline styles.
 */
function cleanPastedHtml(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') {
    return '';
  }

  // Use DOMParser to handle full HTML documents, not just fragments.
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const body = doc.body;

  // If no body is found, return an empty string.
  if (!body) {
    return '';
  }

  // Get all elements within the body to iterate over them.
  const allElements = body.querySelectorAll('*');

  // A list of attributes to remove completely.
  const garbageAttrs = [
    'style', 'class', 'face', 'size', 'color', 'bgcolor', 'width', 'height',
    'cellpadding', 'cellspacing', 'border', 'align', 'valign', 'lang', 'dir',
    'id', 'onclick', 'onmouseover', 'onmouseout'
  ];

  allElements.forEach(el => {
    // Remove specific garbage attributes from the list.
    garbageAttrs.forEach(attr => el.removeAttribute(attr));
    
    // Remove all 'data-*' attributes.
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Return the innerHTML of the body, which is now clean.
  return body.innerHTML;
}


/**
 * Converts raw text or HTML into simple, clean HTML for the editor.
 * It now uses the new robust cleaner.
 *
 * @param {string} raw - The raw input string.
 * @returns {string} Cleaned HTML string.
 */
function toSimpleHtml(raw) {
  if (!raw) return "";

  const isHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  
  if (isHtml) {
    // If it's HTML, pass it through the new super-cleaner.
    return cleanPastedHtml(String(raw));
  }
  
  // If it's plain text, convert newlines to paragraphs.
  const parts = String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/g)
    .filter(block => block.trim())
    .map(block => {
      const lines = block.split("\n").map(ln => ln.trim() ? ln : "<br/>");
      return `<p>${lines.join("<br/>")}</p>`;
    });
  
  return parts.join("\n");
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
  const [localUsername, setLocalUsername] = React.useState(defaultUsername || "");
  const [title, setTitle] = React.useState("");
  const [raw, setRaw] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [pasteLoading, setPasteLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const hasAutoPastedRef = React.useRef(false);

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username based on workspace scoping
  const username = useWorkspaceScoping ? (globalUsername || "") : localUsername;

  React.useEffect(() => {
    if (isOpen) {
      setLocalUsername(defaultUsername || "");
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

  /**
   * NEW: The rewritten clipboard handler that uses the robust cleaner.
   */
  const handlePasteFromClipboard = React.useCallback(async () => {
    setPasteLoading(true);
    setError("");
    try {
      let clipboardContent = "";
      
      // Prioritize reading HTML format from clipboard.
      if (navigator.clipboard && navigator.clipboard.read) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            if (item.types.includes('text/html')) {
              const htmlBlob = await item.getType('text/html');
              clipboardContent = await htmlBlob.text();
              break; 
            }
          }
        } catch (e) {
          // Could fail if permission is denied, fallback to readText.
          console.warn('Advanced clipboard read failed, trying simple text read:', e);
        }
      }
      
      // Fallback to plain text if HTML isn't available or reading it failed.
      if (!clipboardContent && navigator.clipboard.readText) {
          clipboardContent = await navigator.clipboard.readText();
      }
      
      if (!clipboardContent) {
        setError("Clipboard is empty or inaccessible. Please paste manually.");
      } else {
        // Run ALL content through the new `toSimpleHtml` function,
        // which now contains the robust `cleanPastedHtml` logic.
        const cleanedContent = toSimpleHtml(clipboardContent);
        
        // Append or set the cleaned content in the textarea.
        setRaw((prev) => (prev ? `${prev}\n\n${cleanedContent}` : cleanedContent));
      }
    } catch (e) {
      setError("Couldn't read from clipboard. Use Cmd/Ctrl + V to paste.");
    } finally {
      setPasteLoading(false);
    }
  }, []);

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
        content: toSimpleHtml(raw), // Use the cleaner on final submission too.
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
          <DialogDescription>Paste text or HTML. We'll save it as a draft and open it in the editor.</DialogDescription>
        </DialogHeader>

        {allowedUsernames.length === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            You don't have any brands assigned. Ask an admin to assign a username before pasting.
          </div>
        )}

        <div className="grid gap-4">
          {/* Brand selection - conditionally rendered */}
          {!useWorkspaceScoping && (
            <div className="grid gap-2">
              <Label>Brand (username)</Label>
              <Select value={localUsername} onValueChange={setLocalUsername} disabled={allowedUsernames.length === 0}>
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
          )}

          <div className="grid gap-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional title (auto-filled from content)"
              className="bg-white border-slate-300"
            />
          </div>

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
