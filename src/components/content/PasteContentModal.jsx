
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
 * AGGRESSIVE HTML cleaner - removes ALL bloat and keeps only semantic HTML.
 * Also extracts <h1> for title field.
 * Returns: { title: string, content: string }
 */
function cleanPastedHtml(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') {
    return { title: '', content: '' };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const body = doc.body;

  if (!body) {
    return { title: '', content: '' };
  }

  // Extract H1 for title
  let extractedTitle = '';
  const h1Element = body.querySelector('h1');
  if (h1Element) {
    extractedTitle = h1Element.textContent.trim();
    h1Element.remove(); // Remove H1 from body
  }

  // Allowed semantic tags only (NO H1, NO FORMATTING TAGS)
  const allowedTags = ['P', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BR'];
  
  // Recursively clean the DOM
  function cleanNode(node) {
    // If it's a text node, return it as-is
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(false);
    }
    
    // If it's an element node
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toUpperCase();
      
      // If tag is not allowed, unwrap it (keep children only)
      if (!allowedTags.includes(tagName)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach(child => {
          const cleaned = cleanNode(child);
          if (cleaned) fragment.appendChild(cleaned);
        });
        return fragment;
      }
      
      // Create a clean version of the allowed tag
      const cleanElement = document.createElement(tagName);
      
      // For links, preserve only href, target, rel
      if (tagName === 'A') {
        const href = node.getAttribute('href');
        if (href) {
          cleanElement.setAttribute('href', href);
          cleanElement.setAttribute('target', '_blank');
          cleanElement.setAttribute('rel', 'noopener noreferrer');
        }
      }
      
      // Recursively clean and append children
      Array.from(node.childNodes).forEach(child => {
        const cleaned = cleanNode(child);
        if (cleaned) {
          cleanElement.appendChild(cleaned);
        }
      });
      
      return cleanElement;
    }
    
    return null;
  }
  
  // Clean all body children
  const cleanedBody = document.createElement('body');
  Array.from(body.childNodes).forEach(child => {
    const cleaned = cleanNode(child);
    if (cleaned) {
      // DocumentFragments need to be appended directly
      if (cleaned.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        Array.from(cleaned.childNodes).forEach(fragChild => cleanedBody.appendChild(fragChild));
      } else {
        cleanedBody.appendChild(cleaned);
      }
    }
  });
  
  // Get the cleaned HTML
  let cleaned = cleanedBody.innerHTML;
  
  // Additional regex cleanup to catch any remaining formatting tags
  cleaned = cleaned.replace(/<\/?strong[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?b[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?em[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?i[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?span[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?h1[^>]*>/gi, ''); // Remove any remaining H1 tags
  
  // Remove all data-*, aria-*, role attributes
  cleaned = cleaned.replace(/\s+data-[\w-]+\s*=\s*"[^"]*"/gi, '');
  cleaned = cleaned.replace(/\s+aria-[\w-]+\s*=\s*"[^"]*"/gi, '');
  cleaned = cleaned.replace(/\s+role\s*=\s*"[^"]*"/gi, '');
  
  // Remove inline styles
  cleaned = cleaned.replace(/\s+style\s*=\s*"[^"]*"/gi, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/>\s+</g, '><');
  
  // Remove empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p><br><\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');
  
  return { title: extractedTitle, content: cleaned.trim() };
}

/**
 * Converts raw text or HTML into simple, clean HTML for the editor.
 * Returns: { title: string, content: string }
 */
function toSimpleHtml(raw) {
  if (!raw) return { title: '', content: '' };

  const isHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  
  if (isHtml) {
    // Pass through aggressive cleaner
    return cleanPastedHtml(String(raw));
  }
  
  // Plain text: convert to paragraphs
  const parts = String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/g)
    .filter(block => block.trim())
    .map(block => {
      const lines = block.split("\n").map(ln => ln.trim() ? ln : "<br/>");
      return `<p>${lines.join("<br/>")}</p>`;
    });
  
  return { title: '', content: parts.join("\n") };
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

  // Derive title from raw content if title is empty
  React.useEffect(() => {
    if (!title && raw) {
      // Use toSimpleHtml to check for extracted H1 title
      const result = toSimpleHtml(raw);
      if (result.title) {
        setTitle(result.title);
      } else {
        setTitle(deriveTitleFrom(raw));
      }
    }
  }, [raw, title]);

  const canSubmit = !!username && !!raw && !submitting;

  /**
   * The rewritten clipboard handler that uses the robust cleaner.
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
        const result = toSimpleHtml(clipboardContent);
        
        // Set title from H1 if found and the title field is currently empty
        if (result.title && !title) {
          setTitle(result.title);
        }
        
        // Append or set the cleaned content in the textarea.
        setRaw((prev) => (prev ? `${prev}\n\n${result.content}` : result.content));
      }
    } catch (e) {
      setError("Couldn't read from clipboard. Use Cmd/Ctrl + V to paste.");
    } finally {
      setPasteLoading(false);
    }
  }, [title]); // Added 'title' to dependency array to correctly check !title

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
      // Re-process raw content to ensure it's clean and to extract any H1 that might have been typed
      const result = toSimpleHtml(raw);
      const finalTitle = title?.trim() || result.title || deriveTitleFrom(raw);

      await onSubmit?.({
        title: finalTitle,
        content: result.content, // Use the cleaned content from the final processing
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
          <DialogDescription>Paste text or HTML. We'll extract the H1 as title and save clean HTML to the editor.</DialogDescription>
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
              placeholder="Optional title (auto-filled from content, H1 extracted if present)"
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
