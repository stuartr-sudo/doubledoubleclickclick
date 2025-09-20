export function insertHtmlAtCursor(html) {
  if (!html) return false;

  // Prefer insertion inside Quill editor if present
  const editorEl = document.querySelector(".ql-editor") || document.querySelector('[contenteditable="true"]');
  if (!editorEl) return false;

  // Create a fragment from HTML
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const fragment = template.content;

  // Try to insert at selection if it's inside the editor
  const sel = window.getSelection && window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    // Ensure selection is within the editor
    const withinEditor = editorEl.contains(range.startContainer);
    if (withinEditor) {
      range.collapse(true);
      range.insertNode(fragment.cloneNode(true));
      // Move caret after inserted block
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(editorEl.lastChild);
      newRange.collapse(true);
      sel.addRange(newRange);
      return true;
    }
  }

  // Fallback: append at the end of the editor
  editorEl.appendChild(fragment.cloneNode(true));
  return true;
}