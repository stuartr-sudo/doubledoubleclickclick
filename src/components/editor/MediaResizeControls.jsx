import React, { useEffect, useState } from "react";
import { Quill } from 'react-quill';

// --- SVG Icons as components to avoid external dependencies ---
const IconAlignLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>;
const IconAlignCenter = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/></svg>;
const IconAlignRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6"y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

const WIDTH_STEPS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

// Gets width from the element's inline style
function getWidthFromStyle(el) {
    if (!el) return 100;
    const styleW = (el.style?.width || "").trim();
    if (styleW.endsWith("%")) {
        const n = Number(styleW.replace("%", ""));
        if (!Number.isNaN(n)) return n;
    }
    return 100; // Default width if not set
}

// Gets alignment from the Quill editor's format API
function getAlignFromQuill(quill, blot) {
    if (!quill || !blot) return 'left';
    try {
        const blotIndex = quill.getIndex(blot);
        const [line, ] = quill.getLine(blotIndex);
        const lineFormat = line.formats();
        return lineFormat.align || 'left';
    } catch (e) {
        return 'left';
    }
}

// Snaps a percentage value to the nearest step in WIDTH_STEPS
function snapWidth(pct) {
    return WIDTH_STEPS.reduce((prev, curr) =>
        Math.abs(curr - pct) < Math.abs(prev - pct) ? curr : prev
    , WIDTH_STEPS[WIDTH_STEPS.length - 1]);
}

export default function MediaResizeControls({ quill, resizeTarget, onChange, onClose }) {
    if (!resizeTarget || !resizeTarget.element || !quill) return null;

    const { type, element, blot } = resizeTarget;

    const [width, setWidth] = useState(getWidthFromStyle(element));
    const [align, setAlign] = useState(getAlignFromQuill(quill, blot));
    
    // Add a highlight class to the element being edited
    useEffect(() => {
        if (!element) return;
        element.classList.add("b44-resizing");
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return () => element.classList.remove("b44-resizing");
    }, [element]);

    // Update state if a different element is selected
    useEffect(() => {
        setWidth(getWidthFromStyle(element));
        setAlign(getAlignFromQuill(quill, blot));
    }, [element, blot, quill]);
    
    // The core function to apply changes
    const commitChanges = (newWidth, newAlign) => {
        if (!element || !blot) return;

        const snappedWidth = snapWidth(newWidth);
        
        // 1. Apply width directly via inline style
        element.style.width = `${snappedWidth}%`;
        element.style.maxWidth = '100%'; // ensure it's responsive

        // 2. Apply alignment using Quill's sanctioned API
        const blotIndex = quill.getIndex(blot);
        quill.formatLine(blotIndex, 1, 'align', newAlign === 'left' ? false : newAlign);

        // 3. IMPORTANT: Sync the DOM change back to the parent state
        if (typeof onChange === "function") {
            onChange();
        }

        // Update local state
        setWidth(snappedWidth);
        setAlign(newAlign);
    };
    
    const handleRangeChange = (e) => {
        const val = Number(e.target.value);
        if (Number.isNaN(val)) return;
        commitChanges(val, align);
    };
    
    // Close the panel on Escape key press
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="fixed top-24 right-6 z-[1000] w-[320px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-800">
                    {type === "image" ? "Image Settings" : "Video Settings"}
                </p>
                <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                    <IconX />
                </button>
            </div>
            <div className="p-4 space-y-5">
                <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Width</span>
                        <span className="text-gray-500">{width}%</span>
                    </div>
                    <input
                        type="range"
                        min={30}
                        max={100}
                        step={5}
                        value={width}
                        onChange={handleRangeChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex gap-2 mt-2.5 flex-wrap">
                        {[30, 50, 85, 100].map(p => (
                            <button
                                key={p}
                                onClick={() => commitChanges(p, align)}
                                className={`px-3 py-1 text-xs rounded-md border transition-colors ${width === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {p}%
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <span className="font-medium text-sm text-gray-700 mb-2 block">Alignment</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => commitChanges(width, "left")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${align === 'left' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                            <IconAlignLeft /> Left
                        </button>
                        <button onClick={() => commitChanges(width, "center")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${align === 'center' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                            <IconAlignCenter /> Center
                        </button>
                        <button onClick={() => commitChanges(width, "right")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${align === 'right' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                            <IconAlignRight /> Right
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}