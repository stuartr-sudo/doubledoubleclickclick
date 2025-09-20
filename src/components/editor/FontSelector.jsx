import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Type } from "lucide-react";

const blogOptimizedFonts = [
  { name: 'Inter', category: 'Sans-serif', description: 'Modern & clean' },
  { name: 'Lora', category: 'Serif', description: 'Elegant reading' },
  { name: 'Merriweather', category: 'Serif', description: 'Comfortable reading' },
  { name: 'Playfair Display', category: 'Serif', description: 'Sophisticated headlines' },
  { name: 'Source Sans Pro', category: 'Sans-serif', description: 'Professional' },
  { name: 'Open Sans', category: 'Sans-serif', description: 'Versatile & readable' },
  { name: 'Roboto', category: 'Sans-serif', description: "Google's signature" },
  { name: 'PT Serif', category: 'Serif', description: 'Traditional elegance' },
];

export default function FontSelector({ selectedFont, onFontChange }) {
  return (
    <div className="flex items-center gap-2">
      <Type className="w-4 h-4 text-slate-600" />
      <Select value={selectedFont} onValueChange={onFontChange}>
        <SelectTrigger className="w-40 bg-white border border-slate-300 text-slate-900 text-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-xl">
          {blogOptimizedFonts.map((font) => (
            <SelectItem 
              key={font.name} 
              value={font.name}
              className="text-slate-900 hover:bg-slate-50"
            >
              <div className="flex flex-col">
                <span style={{ fontFamily: font.name }}>{font.name}</span>
                <span className="text-xs text-slate-500">{font.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}