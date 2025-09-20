import React from "react";

export default function ProductMiniPreview({ variant = "neon", product = {} }) {
  const name = (product.name || "Product").toString();
  const price = (product.price || "").toString();
  const desc = (product.description || "").toString();
  const img = product.image_url || "";
  const cta =
    variant === "minimal" ? "View Details" :
    variant === "double" ? "Buy Now" : "Add to Cart";

  return (
    <div
      className="relative isolate w-full h-40 overflow-hidden rounded-md border bg-white"
      style={{
        contain: "layout style paint",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        transform: "translateZ(0)"
      }}
    >
      <div className="absolute inset-0 flex">
        <div className="relative shrink-0 w-[44%] bg-gray-100">
          {img ? (
            <img
              src={img}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              style={{ WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: "translateZ(0)" }}
              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
            />
          ) : null}
          {variant !== "neon" && (
            <div className="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase rounded bg-black/80 text-white tracking-wide">
              Sale
            </div>
          )}
        </div>
        <div className="flex-1 p-3 flex flex-col justify-center">
          <div className="text-sm font-semibold line-clamp-1">{name}</div>
          {price && <div className="text-xs font-bold text-gray-900 mt-1">{price}</div>}
          {desc && <div className="text-xs text-gray-600 line-clamp-2 mt-1">{desc}</div>}
          <div className="mt-2">
            <span className="inline-block rounded bg-gray-900 text-white text-[11px] font-semibold px-2 py-1 select-none">
              {cta}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}