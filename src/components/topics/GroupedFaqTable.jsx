
import React from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import MiniMultiSelect from "@/components/common/MiniMultiSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// NEW: keep logic in sync with Topics page
function getLinkedProductFieldName(fieldsObj) {
  const keys = Object.keys(fieldsObj || {});
  const lowerMap = new Map(keys.map(k => [k.toLowerCase(), k]));
  return (
    lowerMap.get("link to company products") ||
    lowerMap.get("promoted product") ||
    lowerMap.get("promoted products") ||
    "Promoted Product"
  );
}

export default function GroupedFaqTable({ rows = [], tableId, options, handleUpdate, density = "comfortable", onDeleteRow }) {
  const [expanded, setExpanded] = React.useState({});

  // Enhanced horizontal scroll with safe click handling
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Helper to determine if an element is interactive
    const isInteractive = (target) =>
      !!(target && (target.closest('button, [role="button"], a, input, select, textarea, [contenteditable="true"]')));

    const onWheel = (e) => {
      const canScroll = el.scrollWidth > el.clientWidth;
      if (!canScroll) return;
      // Determine if horizontal scroll is more dominant, or if only vertical scroll is available.
      // If `e.deltaX` is non-zero, it means a horizontal scroll attempt was made.
      // If `e.deltaX` is zero but `e.deltaY` is not, we consider scrolling horizontally.
      // This allows trackpads/mice configured for "natural scrolling" to also trigger horizontal pan.
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta !== 0) {
        el.scrollLeft += delta;
        e.preventDefault(); // Prevent page vertical scroll
      }
    };

    let isDown = false; // Flag to indicate if mouse is pressed down on the scrollable area
    let isPanning = false; // Flag to indicate if a pan/drag action has started (moved beyond a threshold)
    let startX = 0;
    let startLeft = 0;

    const setCursorStyle = () => {
        if (el.scrollWidth > el.clientWidth) {
            el.style.cursor = isDown && isPanning ? 'grabbing' : 'grab';
        } else {
            el.style.cursor = 'default';
        }
    };

    const onPointerDown = (e) => {
      // Only primary mouse button
      if (e.button !== 0) return;
      // If scrollable area is not actually scrollable, or target is an interactive element, do nothing
      if (el.scrollWidth <= el.clientWidth || isInteractive(e.target)) {
          el.style.cursor = 'default'; // Ensure default if not scrollable or interactive
          return;
      }
      isDown = true;
      isPanning = false; // Reset panning status
      startX = e.clientX;
      startLeft = el.scrollLeft;
      // Do NOT preventDefault here, as it would block clicks on non-interactive elements immediately.
      setCursorStyle(); // Set cursor to grab immediately
    };

    const onPointerMove = (e) => {
      if (!isDown) return;

      const dx = e.clientX - startX;
      // If not yet panning, check if movement threshold is exceeded (e.e.g., 3 pixels)
      if (!isPanning && Math.abs(dx) > 3) {
        isPanning = true;
        setCursorStyle(); // Change cursor to grabbing once panning starts
      }

      if (isPanning) {
        el.scrollLeft = startLeft - dx;
        e.preventDefault(); // Prevent default only if actually panning (e.g., text selection)
      }
    };

    const onPointerUp = () => {
      if (!isDown) return; // Ensure pointerdown happened on our element
      isDown = false;
      setCursorStyle(); // Reset cursor to grab or default
      isPanning = false; // Reset panning after mouse up
    };

    const onKeyDown = (e) => {
      if (document.activeElement !== el) return; // Only if the scroller itself is focused
      if (el.scrollWidth <= el.clientWidth) return;
      const step = 60;
      if (e.key === "ArrowRight") {
        el.scrollLeft += step;
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        el.scrollLeft -= step;
        e.preventDefault();
      } else if (e.key === "Home") {
        el.scrollLeft = 0;
        e.preventDefault();
      } else if (e.key === "End") {
        el.scrollLeft = el.scrollWidth;
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown, { passive: false });
    window.addEventListener("pointermove", onPointerMove, { passive: false }); // Needs to be non-passive for e.preventDefault()
    window.addEventListener("pointerup", onPointerUp, { passive: true }); // Can be passive

    el.addEventListener("keydown", onKeyDown);

    // Initial cursor style
    setCursorStyle();

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("keydown", onKeyDown);
      el.style.cursor = ''; // Reset cursor style on cleanup
    };
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map();
    (rows || []).forEach((row) => {
      const key = (row?.fields?.["Top Level Keyword"] || "Uncategorized").toString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasAllThree = (fields) => {
    const tm = fields?.["Target Market"] || [];
    const bc = fields?.["Blog Category"] || [];
    const ppKey = getLinkedProductFieldName(fields || {});
    const pp = fields?.[ppKey] || [];
    return Array.isArray(tm) && tm.length > 0 &&
           Array.isArray(bc) && bc.length > 0 &&
           Array.isArray(pp) && pp.length > 0;
  };

  const renderFieldValue = (value) => {
    if (value === null || typeof value === "undefined" || value === "") {
      return <span className="text-slate-400">-</span>;
    }
    return String(value);
  };

  const rowPad = density === "compact" ? "0.5rem 1.0rem" : "0.75rem 1.5rem";

  if (!rows || rows.length === 0) {
    return <div className="text-center text-slate-500 py-10">No FAQ records found for this user.</div>;
  }

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      className="w-full overflow-x-auto focus:outline-none"
      style={{ touchAction: "pan-x" }}
      aria-label="FAQ table horizontal scroller"
    >
      <div>
        {groups.map(([groupKey, groupRows]) => {
          const isOpen = !!expanded[groupKey];
          return (
            <div key={groupKey} className="mb-3 rounded-lg border border-slate-200 overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggle(groupKey)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors sticky top-0 z-10 border-b border-slate-200"
              >
                <div className="flex items-center gap-2 text-slate-900">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-medium">{groupKey}</span>
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200">
                    {groupRows.length}
                  </Badge>
                </div>
                <span className="text-xs text-slate-600">Click to {isOpen ? "collapse" : "expand"}</span>
              </button>

              {isOpen && (
                <div className="text-sm text-slate-900">
                  <div
                    className="grid text-xs font-semibold tracking-wide text-slate-600 uppercase bg-white sticky top-10 z-10 border-b border-slate-200 shadow-sm"
                    style={{
                      gridTemplateColumns: "minmax(300px, 1.5fr) minmax(220px, 1fr) minmax(220px, 1fr) minmax(220px, 1fr)",
                      gap: "1rem",
                      padding: "0.75rem 1.5rem",
                    }}
                  >
                    <div>Keyword</div>
                    <div>Target Market</div>
                    <div>Blog Category</div>
                    <div>Promoted Product</div>
                  </div>

                  {groupRows.map((row, idx) => {
                    const fields = row.fields || {};
                    const complete = hasAllThree(fields);
                    const productField = getLinkedProductFieldName(fields);
                    return (
                      <div
                        key={row.id}
                        className={`grid items-center border-t border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                        style={{
                          gridTemplateColumns:
                            "minmax(300px, 1.5fr) minmax(220px, 1fr) minmax(220px, 1fr) minmax(220px, 1fr)",
                          gap: "1rem",
                          padding: rowPad,
                        }}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-slate-900 truncate">{renderFieldValue(fields["Keyword"])}</span>
                          {complete && (
                            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Writing Article
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDeleteRow && onDeleteRow(tableId, row.id)}
                            title="Delete FAQ keyword"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="min-w-0">
                          <MiniMultiSelect
                            options={options.tm}
                            value={fields["Target Market"] || []}
                            onChange={(selected) => handleUpdate(tableId, row.id, "Target Market", selected)}
                          />
                        </div>

                        <div className="min-w-0">
                          <MiniMultiSelect
                            options={options.bc}
                            value={fields["Blog Category"] || []}
                            onChange={(selected) => handleUpdate(tableId, row.id, "Blog Category", selected)}
                          />
                        </div>

                        <div className="min-w-0">
                          <MiniMultiSelect
                            options={options.pp}
                            value={fields[productField] || []}
                            onChange={(selected) => handleUpdate(tableId, row.id, productField, selected)}
                            size="md"
                            itemVariant="pill"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
