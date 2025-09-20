
import React, { useEffect, useMemo, useRef, useState } from "react";

function safeStr(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function applyProductPlaceholders(html, product) {
  if (!html) return "";
  const p = product || {};
  let out = html;

  const map = {
    PRODUCT_NAME: safeStr(p.name),
    PRODUCT_DESCRIPTION: safeStr(p.description),
    PRODUCT_PRICE: safeStr(p.price),
    PRODUCT_URL: safeStr(p.button_url || p.product_url || "#"), // UPDATED: prefer button_url
    IMAGE_URL: safeStr(p.image_url),
    IMAGE_ALT: safeStr(p.alt_text || p.name || "Product Image"),
    SKU: safeStr(p.sku),
    STAR_RATING: safeStr(p.star_rating ?? ""),
    REVIEW_COUNT: safeStr(p.review_count ?? ""),
    BUTTON_TEXT: "Buy Now",
    LINK_TEXT: "Learn More",
    TITLE: safeStr(p.name),
    CONTENT: safeStr(p.description)
  };

  Object.entries(map).forEach(([key, val]) => {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    out = out.replace(re, val);
  });

  return out;
}

export default function TemplatePreview({ template, product, className, maxHeight = 240 }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [measured, setMeasured] = useState(false);

  const html = useMemo(() => {
    if (!template?.html_structure) return "";
    return applyProductPlaceholders(template.html_structure, product);
  }, [template?.html_structure, product]);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      // Reset scaling before measuring
      content.style.transform = "scale(1)";
      content.style.transformOrigin = "top left";

      // Use scrollWidth/scrollHeight to get natural size
      // Ensure content's natural width considers its own maxWidth for calculation
      const naturalWidth = content.scrollWidth || 1;
      const naturalHeight = content.scrollHeight || 1;

      // Available space inside the container (minus padding)
      const containerStyles = getComputedStyle(container);
      const padX = (parseFloat(containerStyles.paddingLeft) || 0) + (parseFloat(containerStyles.paddingRight) || 0);
      const padY = (parseFloat(containerStyles.paddingTop) || 0) + (parseFloat(containerStyles.paddingBottom) || 0);
      const availWidth = (container.clientWidth || 1) - padX;
      const availHeight = (container.clientHeight || maxHeight) - padY;

      const nextScale = Math.min(1, availWidth / naturalWidth, availHeight / naturalHeight);
      setScale(nextScale);
      setMeasured(true);
    };

    // Measure after paint and on resize
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [html, maxHeight]);

  return (
    <div className={className}>
      <div className="text-xs text-slate-500 mb-1">Preview</div>
      <div
        ref={containerRef}
        className="border border-slate-200 rounded-md bg-white overflow-hidden w-full"
        style={{
          padding: 12,
          maxWidth: "100%",
          height: maxHeight,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          overflowX: "hidden",
          overflowY: "hidden"
        }}
      >
        <div
          ref={contentRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            visibility: measured ? "visible" : "hidden",
            width: "max-content", // Allow content to determine its width, then constrain with maxWidth
            height: "max-content", // Allow content to determine its height
            maxWidth: "100%", // Constrain content width to parent
            wordBreak: "break-word", // Break words if they overflow
            overflowWrap: "anywhere", // Wrap long strings
            minWidth: 0,
            minHeight: 0,
            flexShrink: 0
          }}
          dangerouslySetInnerHTML={{
            __html:
              html ||
              '<div style="font-size:12px;color:#94a3b8">No template selected</div>'
          }}
        />
      </div>
    </div>
  );
}
