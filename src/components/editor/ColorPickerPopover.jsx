import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

const PRESET_COLORS = [
  "#000000", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#ffffff",
  "#ef4444", "#f59e0b", "#fbbf24", "#22c55e", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"
];

export default function ColorPickerPopover({ label = "Color", onPick, onOpenChange }) {
  const inputRef = React.useRef(null);
  const handleCustom = () => {
    inputRef.current?.click();
  };
  return (
    <Popover onOpenChange={(o) => onOpenChange?.(o)}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 px-2" title={label}>
          <Palette className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" side="top" className="p-3 w-[220px]">
        <div className="grid grid-cols-9 gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`pick ${c}`}
              className="h-5 w-5 rounded border border-slate-200"
              style={{ backgroundColor: c }}
              onClick={() => onPick?.(c)}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            className="text-xs text-slate-600 hover:text-slate-900 underline"
            onClick={() => onPick?.("inherit")}
            title="Reset color"
          >
            Reset
          </button>
          <div>
            <input
              ref={inputRef}
              type="color"
              className="hidden"
              onChange={(e) => onPick?.(e.target.value)}
            />
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCustom}>
              Custom…
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}