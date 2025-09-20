import React from "react";
import ProductMiniPreview from "./ProductMiniPreview";

const OPTIONS = [
  { key: "neon", label: "Neon Card" },
  { key: "minimal", label: "Minimal (Light)" },
  { key: "double", label: "Double Border" }
];

export default function ProductStructurePicker({ value = "neon", onChange, product }) {
  return (
    <div className="space-y-2">
      <div className="font-semibold">Structure & Preview</div>
      <p className="text-sm text-white/70">
        Pick a structural HTML layout for this product. You can still fine-tune design below (optional).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange && onChange(opt.key)}
            className={`text-left rounded-lg border transition-all ${
              value === opt.key ? "border-white/60 ring-2 ring-white/30" : "border-white/15 hover:border-white/40"
            } bg-white/5`}
          >
            <div className="p-3">
              <div className="text-sm mb-2">{opt.label}</div>
              <ProductMiniPreview variant={opt.key} product={product} />
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  value === opt.key ? "bg-white/80 text-slate-900" : "bg-white/10 text-white/80"
                }`}>
                  {value === opt.key ? "Selected" : "Select"}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}