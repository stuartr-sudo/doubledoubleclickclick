import React, { forwardRef } from "react";
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PromotedProductBlot from './blots/PromotedProductBlot';

Quill.register(PromotedProductBlot);

const ContentEditor = forwardRef(({
  content,
  onChange,
  onTextSelected,
  selectedFont = 'Inter',
  onElementClick
}, ref) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'blockquote', 'code-block'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
    clipboard: { matchVisual: true },
    history: { delay: 1000, maxStack: 200, userOnly: true }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'script', 'color', 'background', 'align'
  ];

  const handleSelectionChange = (range, source, editor) => {
    if (source === 'user' && onTextSelected) {
      const selectedText = range && range.length > 0 ? editor.getText(range.index, range.length) : null;
      onTextSelected(selectedText, range);
    }
  };

  const handleEditorClick = (e) => {
    if (!onElementClick) return;
    const quill = ref.current?.getEditor();
    if (!quill) return;

    const t = e.target;
    if (!t) return;

    const blot = Quill.find(t, true);
    if (!blot) return;

    let type = null;
    let element = null;

    if (t.tagName === "IMG") {
        type = "image";
        element = t;
    } else {
        const ytContainer = t.closest(".youtube-video-container");
        if (ytContainer) {
            type = "youtube";
            element = ytContainer;
        }
    }

    if (type && element) {
        onElementClick({ type, element, blot });
    }
  };

  return (
    <div className="bg-transparent text-white b44-editor-shell" style={{ zIndex: 1, height: "100%" }} onClick={handleEditorClick}>
      <style jsx global>{`
        .b44-editor-shell .ql-toolbar {
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-bottom: none !important;
          background: rgba(15, 23, 42, 0.8) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 12px 12px 0 0 !important;
        }

        .b44-editor-shell .ql-editor {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.3) 0%, rgba(30, 41, 59, 0.2) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 0 0 12px 12px !important;
          color: rgba(255, 255, 255, 0.95) !important;
          font-size: 16px;
          line-height: 1.8;
          font-family: '${selectedFont}', -apple-system, BlinkMacSystemFont, sans-serif !important;
          padding: 40px !important;
          height: 100% !important;
          overflow-y: auto !important;
        }

        /* Highlight element being resized */
        .b44-editor-shell .ql-editor .b44-resizing {
          outline: 2px dashed #60a5fa !important;
          outline-offset: 4px !important;
        }
        
        /* Quill's native alignment classes */
        .b44-editor-shell .ql-editor .ql-align-center { text-align: center; }
        .b44-editor-shell .ql-editor .ql-align-right { text-align: right; }
        
        /* Images and Videos: Treat as inline-block to respect parent's text-align */
        .b44-editor-shell .ql-editor img,
        .b44-editor-shell .ql-editor .youtube-video-container {
          display: inline-block;
          vertical-align: middle;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .b44-editor-shell .ql-editor img {
            height: auto;
            border-radius: 8px;
            max-width: 100%;
        }
        .b44-editor-shell .ql-editor .youtube-video-container {
            position: relative;
            padding-bottom: 56.25%; /* 16:9 ratio */
            height: 0;
            overflow: hidden;
            border-radius: 12px;
        }
        .b44-editor-shell .ql-editor .youtube-video-container iframe {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;
        }
      `}</style>
      <ReactQuill
        ref={ref}
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Start crafting your masterpiece..."
        onChangeSelection={handleSelectionChange}
        style={{ height: "100%" }}
      />
    </div>
  );
});

ContentEditor.displayName = 'ContentEditor';

export default ContentEditor;