
import React, { useMemo } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE_CONTENT = `
<h1>Welcome to Our Brand</h1>
<p>This is a sample paragraph that demonstrates how your content will look with the current brand specifications. It includes various elements to showcase typography, spacing, and color usage.</p>

<h2>Key Features</h2>
<ul>
  <li>Professional typography that matches your brand</li>
  <li>Consistent color scheme throughout</li>
  <li>Proper spacing and layout</li>
  <li>Responsive design elements</li>
</ul>

<h3>Call to Action</h3>
<p>Here's a <a href="#">sample link</a> that shows how your brand colors will be applied to interactive elements.</p>

<blockquote>
  "This is a sample quote that demonstrates how blockquotes will appear with your brand styling."
</blockquote>
`;

export default function BrandPreview({
  brandSpecs,
  onRefresh,
  className = ""
}) {
  const generatedCSS = useMemo(() => {
    if (!brandSpecs) return "";

    const {
      colors = {},
      typography = {},
      layout = {},
      components = {}
    } = brandSpecs;

    return `
      :root {
        --brand-primary: ${colors.primary || "#1a365d"};
        --brand-secondary: ${colors.secondary || "#2c5282"};
        --brand-accent: ${colors.accent || "#3182ce"};
        --brand-text: ${colors.text || "#1a202c"};
        --brand-heading: ${colors.heading || colors.text || "#1a202c"}; /* Added heading color control */
        --brand-bg: ${colors.background || "#ffffff"};
        --brand-muted: ${colors.muted || "#718096"};
      }

      .brand-preview {
        font-family: ${typography.font_family || "Inter, system-ui, sans-serif"};
        font-size: ${typography.font_size_base || "16px"};
        line-height: ${typography.line_height || "1.6"};
        color: var(--brand-text);
        background: var(--brand-bg);
        max-width: ${layout.max_width || "1200px"};
        padding: ${layout.content_padding || "20px"};
        margin: 0 auto;
        border-radius: ${layout.border_radius || "8px"};
        box-shadow: ${layout.box_shadow || "0 2px 4px rgba(0,0,0,0.1)"};
      }

      .brand-preview h1, .brand-preview h2, .brand-preview h3,
      .brand-preview h4, .brand-preview h5, .brand-preview h6 {
        font-family: ${typography.heading_font || typography.font_family || "Inter, system-ui, sans-serif"};
        color: var(--brand-heading); /* Used new heading color variable */
        margin: ${layout.element_spacing || "16px"} 0;
        font-weight: ${typography.heading_weight || "600"};
      }

      .brand-preview h1 {
        font-size: ${typography.heading_sizes?.h1 || "2.5rem"};
        margin-bottom: ${layout.section_spacing || "40px"};
      }

      .brand-preview h2 {
        font-size: ${typography.heading_sizes?.h2 || "2rem"};
        margin-top: ${layout.section_spacing || "40px"};
      }

      .brand-preview h3 {
        font-size: ${typography.heading_sizes?.h3 || "1.5rem"};
      }

      .brand-preview p {
        margin: ${layout.element_spacing || "16px"} 0;
        color: var(--brand-text);
      }

      .brand-preview a {
        color: ${components.links?.color || colors.accent || "#3182ce"};
        text-decoration: ${components.links?.text_decoration || "underline"};
      }

      .brand-preview a:hover {
        color: ${components.links?.hover_color || colors.primary || "#1a365d"};
      }

      .brand-preview ul, .brand-preview ol {
        margin: ${layout.element_spacing || "16px"} 0;
        padding-left: 24px;
      }

      .brand-preview li {
        margin: 8px 0;
        color: var(--brand-text);
      }

      .brand-preview blockquote {
        border-left: 4px solid var(--brand-accent);
        padding: 16px 20px;
        margin: ${layout.section_spacing || "40px"} 0;
        background: #f8fafc;
        border-radius: ${layout.border_radius || "8px"};
        color: var(--brand-muted);
        font-style: italic;
      }

      .brand-preview button {
        background: ${components.buttons?.primary_bg || colors.primary || "#1a365d"};
        color: ${components.buttons?.primary_text || "#ffffff"};
        border: none;
        padding: ${components.buttons?.padding || "12px 24px"};
        border-radius: ${components.buttons?.border_radius || "6px"};
        font-weight: 500;
        cursor: pointer;
        margin: ${layout.element_spacing || "16px"} 0;
      }

      .brand-preview button:hover {
        opacity: 0.9;
      }

      .brand-preview img {
        max-width: 100%;
        height: auto;
        border-radius: ${components.images?.border_radius || "8px"};
        margin: ${components.images?.margin || "20px 0"};
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .brand-preview {
          padding: ${layout.content_padding ? `calc(${layout.content_padding} / 2)` : "10px"};
        }
        
        .brand-preview h1 {
          font-size: ${typography.heading_sizes?.h1 ? `calc(${typography.heading_sizes.h1} * 0.8)` : "2rem"};
        }
      }
    `;
  }, [brandSpecs]);

  const previewHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Brand Preview</title>
      <style>${generatedCSS}</style>
    </head>
    <body>
      <div class="brand-preview">
        ${SAMPLE_CONTENT}
      </div>
    </body>
    </html>
  `;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Live Preview</h3>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 px-3"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
          <div className="text-xs text-slate-600">
            Preview of how content will appear with your brand specifications
          </div>
        </div>
        
        <div className="h-96 overflow-auto">
          {brandSpecs ? (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              title="Brand Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p>Configure brand specifications to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Brand Specs Summary */}
      {brandSpecs && (
        <div className="p-3 bg-slate-50 rounded-lg border">
          <div className="text-xs font-medium text-slate-700 mb-2">Current Specifications:</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            {brandSpecs.colors?.primary && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded border"
                  style={{ backgroundColor: brandSpecs.colors.primary }}
                />
                <span>Primary: {brandSpecs.colors.primary}</span>
              </div>
            )}
            {brandSpecs.colors?.heading && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded border"
                  style={{ backgroundColor: brandSpecs.colors.heading }}
                />
                <span>Heading: {brandSpecs.colors.heading}</span>
              </div>
            )}
            {brandSpecs.typography?.font_family && (
              <div>
                <span>Font: {brandSpecs.typography.font_family.split(',')[0]}</span>
              </div>
            )}
            {brandSpecs.layout?.max_width && (
              <div>
                <span>Max Width: {brandSpecs.layout.max_width}</span>
              </div>
            )}
            {brandSpecs.layout?.content_padding && (
              <div>
                <span>Padding: {brandSpecs.layout.content_padding}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
