
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout, Maximize2, ArrowLeftRight, CornerUpRight } from "lucide-react";

const LAYOUT_TYPES = [
  { value: "centered", label: "Centered (Max Width)" },
  { value: "full-width", label: "Full Width" },
  { value: "sidebar", label: "With Sidebar" },
  { value: "magazine", label: "Magazine Style" },
];

const SPACING_UNITS = [
  { value: "px", label: "px" },
  { value: "rem", label: "rem" },
  { value: "em", label: "em" },
  { value: "%", label: "%" },
];

export default function LayoutConfigurator({
  layout,
  onChange,
  className = ""
}) {
  const {
    max_width = "1200px",
    content_padding = "20px",
    section_spacing = "40px",
    element_spacing = "16px",
    border_radius = "8px",
    box_shadow = "0 2px 4px rgba(0,0,0,0.1)"
  } = layout || {};

  const handleChange = (field, value) => {
    onChange({
      ...layout,
      [field]: value
    });
  };

  const parseValue = (value) => {
    const match = value.match(/^(\d+(?:\.\d+)?)(\w+)$/);
    if (match) {
      return { number: match[1], unit: match[2] };
    }
    return { number: value, unit: "px" };
  };

  const formatValue = (number, unit) => {
    return `${number}${unit}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Layout className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-800">Layout & Spacing</h3>
      </div>

      {/* Layout Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Layout Type</Label>
        <Select
          value={layout?.layout_type || "centered"}
          onValueChange={(value) => handleChange("layout_type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select layout type" />
          </SelectTrigger>
          <SelectContent>
            {LAYOUT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Max Width */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Maximize2 className="w-4 h-4" />
          Max Content Width
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={parseValue(max_width).number}
            onChange={(e) => {
              const { unit } = parseValue(max_width);
              handleChange("max_width", formatValue(e.target.value, unit));
            }}
            placeholder="1200"
            className="flex-1"
          />
          <Select
            value={parseValue(max_width).unit}
            onValueChange={(unit) => {
              const { number } = parseValue(max_width);
              handleChange("max_width", formatValue(number, unit));
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPACING_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Padding */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" />
          Content Padding
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={parseValue(content_padding).number}
            onChange={(e) => {
              const { unit } = parseValue(content_padding);
              handleChange("content_padding", formatValue(e.target.value, unit));
            }}
            placeholder="20"
            className="flex-1"
          />
          <Select
            value={parseValue(content_padding).unit}
            onValueChange={(unit) => {
              const { number } = parseValue(content_padding);
              handleChange("content_padding", formatValue(number, unit));
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPACING_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Section Spacing */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Section Spacing</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={parseValue(section_spacing).number}
            onChange={(e) => {
              const { unit } = parseValue(section_spacing);
              handleChange("section_spacing", formatValue(e.target.value, unit));
            }}
            placeholder="40"
            className="flex-1"
          />
          <Select
            value={parseValue(section_spacing).unit}
            onValueChange={(unit) => {
              const { number } = parseValue(section_spacing);
              handleChange("section_spacing", formatValue(number, unit));
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPACING_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Element Spacing */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Element Spacing</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={parseValue(element_spacing).number}
            onChange={(e) => {
              const { unit } = parseValue(element_spacing);
              handleChange("element_spacing", formatValue(e.target.value, unit));
            }}
            placeholder="16"
            className="flex-1"
          />
          <Select
            value={parseValue(element_spacing).unit}
            onValueChange={(unit) => {
              const { number } = parseValue(element_spacing);
              handleChange("element_spacing", formatValue(number, unit));
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPACING_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <CornerUpRight className="w-4 h-4" />
          Border Radius
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={parseValue(border_radius).number}
            onChange={(e) => {
              const { unit } = parseValue(border_radius);
              handleChange("border_radius", formatValue(e.target.value, unit));
            }}
            placeholder="8"
            className="flex-1"
          />
          <Select
            value={parseValue(border_radius).unit}
            onValueChange={(unit) => {
              const { number } = parseValue(border_radius);
              handleChange("border_radius", formatValue(number, unit));
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPACING_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Box Shadow */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Box Shadow</Label>
        <Input
          type="text"
          value={box_shadow}
          onChange={(e) => handleChange("box_shadow", e.target.value)}
          placeholder="0 2px 4px rgba(0,0,0,0.1)"
          className="font-mono text-sm"
        />
        <div className="text-xs text-slate-500">
          CSS box-shadow value (e.g., 0 2px 4px rgba(0,0,0,0.1))
        </div>
      </div>

      {/* Layout Preview */}
      <div className="p-4 bg-slate-50 rounded-lg border">
        <div className="text-xs text-slate-500 mb-2">Layout Preview:</div>
        <div
          style={{
            maxWidth: max_width,
            padding: content_padding,
            borderRadius: border_radius,
            boxShadow: box_shadow,
            backgroundColor: "white",
            border: "1px solid #e2e8f0"
          }}
          className="mx-auto"
        >
          <div
            style={{
              marginBottom: section_spacing,
              padding: element_spacing,
              backgroundColor: "#f8fafc",
              borderRadius: border_radius
            }}
          >
            Section 1
          </div>
          <div
            style={{
              padding: element_spacing,
              backgroundColor: "#f8fafc",
              borderRadius: border_radius
            }}
          >
            Section 2
          </div>
        </div>
      </div>
    </div>
  );
}
