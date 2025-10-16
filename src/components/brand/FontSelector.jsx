import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Type, Eye } from "lucide-react";

const COMMON_FONTS = [
  { name: "Inter", value: "Inter, system-ui, sans-serif", category: "Sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif", category: "Sans-serif" },
  { name: "Open Sans", value: "Open Sans, sans-serif", category: "Sans-serif" },
  { name: "Lato", value: "Lato, sans-serif", category: "Sans-serif" },
  { name: "Montserrat", value: "Montserrat, sans-serif", category: "Sans-serif" },
  { name: "Source Sans Pro", value: "Source Sans Pro, sans-serif", category: "Sans-serif" },
  { name: "Nunito", value: "Nunito, sans-serif", category: "Sans-serif" },
  { name: "Poppins", value: "Poppins, sans-serif", category: "Sans-serif" },
  { name: "Playfair Display", value: "Playfair Display, serif", category: "Serif" },
  { name: "Merriweather", value: "Merriweather, serif", category: "Serif" },
  { name: "Lora", value: "Lora, serif", category: "Serif" },
  { name: "PT Serif", value: "PT Serif, serif", category: "Serif" },
  { name: "Fira Code", value: "Fira Code, monospace", category: "Monospace" },
  { name: "Source Code Pro", value: "Source Code Pro, monospace", category: "Monospace" },
  { name: "JetBrains Mono", value: "JetBrains Mono, monospace", category: "Monospace" },
];

const FONT_WEIGHTS = [
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semi Bold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Extra Bold", value: "800" },
];

const FONT_SIZES = [
  { label: "Small", value: "14px" },
  { label: "Base", value: "16px" },
  { label: "Large", value: "18px" },
  { label: "XL", value: "20px" },
  { label: "2XL", value: "24px" },
];

export default function FontSelector({
  label,
  fontFamily,
  fontSize,
  fontWeight,
  onFontFamilyChange,
  onFontSizeChange,
  onFontWeightChange,
  showPreview = true,
  className = ""
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customFont, setCustomFont] = useState("");

  const groupedFonts = COMMON_FONTS.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = [];
    }
    acc[font.category].push(font);
    return acc;
  }, {});

  const handleCustomFontSubmit = () => {
    if (customFont.trim()) {
      onFontFamilyChange(customFont.trim());
      setShowCustomInput(false);
      setCustomFont("");
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Type className="w-4 h-4" />
        {label}
      </Label>

      {/* Font Family Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-600">Font Family</Label>
        <div className="flex gap-2">
          <Select value={fontFamily} onValueChange={onFontFamilyChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedFonts).map(([category, fonts]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-medium text-slate-500 bg-slate-50">
                    {category}
                  </div>
                  {fonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="px-3"
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>

        {/* Custom Font Input */}
        {showCustomInput && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={customFont}
              onChange={(e) => setCustomFont(e.target.value)}
              placeholder="e.g., Helvetica, Arial, sans-serif"
              className="text-sm"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCustomFontSubmit}
              disabled={!customFont.trim()}
            >
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Font Size and Weight */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-slate-600">Font Size</Label>
          <Select value={fontSize} onValueChange={onFontSizeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label} ({size.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-slate-600">Font Weight</Label>
          <Select value={fontWeight} onValueChange={onFontWeightChange}>
            <SelectTrigger>
              <SelectValue placeholder="Weight" />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((weight) => (
                <SelectItem key={weight.value} value={weight.value}>
                  {weight.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Font Preview */}
      {showPreview && fontFamily && (
        <div className="p-3 bg-slate-50 rounded-lg border">
          <div className="text-xs text-slate-500 mb-2">Preview:</div>
          <div
            style={{
              fontFamily: fontFamily,
              fontSize: fontSize,
              fontWeight: fontWeight,
            }}
            className="text-slate-800"
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
      )}
    </div>
  );
}
