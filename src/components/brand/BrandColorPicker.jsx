import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Palette } from "lucide-react";
import { toast } from "sonner";

export default function BrandColorPicker({
  label,
  value,
  onChange,
  showPreview = true,
  className = ""
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value || "#000000");

  useEffect(() => {
    setTempValue(value || "#000000");
  }, [value]);

  const handleColorChange = (newColor) => {
    setTempValue(newColor);
    onChange(newColor);
  };

  const validateHexColor = (color) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const handleInputChange = (e) => {
    const newColor = e.target.value;
    setTempValue(newColor);
    
    if (validateHexColor(newColor)) {
      onChange(newColor);
    }
  };

  const handleInputBlur = () => {
    if (!validateHexColor(tempValue)) {
      setTempValue(value || "#000000");
      toast.error("Please enter a valid hex color (e.g., #1a365d)");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      
      <div className="flex items-center gap-3">
        {/* Color Preview */}
        {showPreview && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
              style={{ backgroundColor: tempValue }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Click to open color picker"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="h-8 px-2"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Color Input */}
        <Input
          type="text"
          value={tempValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#1a365d"
          className="flex-1 font-mono text-sm"
          maxLength={7}
        />

        {/* Native Color Picker (hidden, triggered by button) */}
        <input
          type="color"
          value={tempValue}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-0 h-0 opacity-0 absolute"
          id={`color-picker-${label.replace(/\s+/g, '-').toLowerCase()}`}
        />
        
        {showColorPicker && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              document.getElementById(`color-picker-${label.replace(/\s+/g, '-').toLowerCase()}`).click();
            }}
            className="h-8 px-2"
          >
            {showColorPicker ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Color Preview Text */}
      {showPreview && (
        <div className="text-xs text-slate-500">
          Preview: <span className="font-mono">{tempValue}</span>
        </div>
      )}
    </div>
  );
}
