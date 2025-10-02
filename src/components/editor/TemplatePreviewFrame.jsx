import React, { useEffect, useRef } from "react";

export default function TemplatePreviewFrame({ html, className = "", height = 520 }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const docHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            /* Reset and safe defaults */
            html, body { margin:0; padding:0; background:#ffffff; color:#0f172a; }
            *, *::before, *::after { box-sizing: border-box; }
            a { color: inherit; }
            
            /* Constrain preview to typical editor width */
            .preview-root {
              width: 920px;
              max-width: 100%;
              margin: 0 auto;
              padding: 24px;
            }
            
            /* Allow images to use their natural dimensions or styled dimensions */
            img {
              max-width: 100%;
              display: block;
              /* Remove height: auto !important; to allow templates to set specific heights */
              /* object-fit will be handled by inline styles in templates */
            }
            
            video, iframe {
              max-width: 100% !important;
              height: auto !important;
              display: block;
            }
            
            /* Promoted product specific styles */
            .b44-promoted-product { 
              max-width: 100%; 
              display: block; 
              overflow: visible; /* Changed from hidden to visible */
            }
            
            /* Ensure product images respect their container dimensions */
            .b44-promoted-product img {
              /* Don't override template-specific sizing */
              max-width: 100%;
            }
            
            /* Support for flex containers in templates */
            .b44-promoted-product[style*="display: flex"] img,
            .b44-promoted-product[style*="display:flex"] img {
              flex-shrink: 0; /* Prevent image from shrinking in flex containers */
            }
          </style>
        </head>
        <body>
          <div class="preview-root">${html || ""}</div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(docHtml);
    doc.close();
  }, [html]);

  return (
    <div className={className} style={{ height }}>
      <iframe
        ref={iframeRef}
        title="Template Preview"
        className="w-full h-full rounded-lg border border-slate-200 bg-white"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}