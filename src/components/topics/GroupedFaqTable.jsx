
import React from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import MiniMultiSelect from "@/components/common/MiniMultiSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

function getLinkedProductFieldName(fieldsObj) {
  const keys = Object.keys(fieldsObj || {});
  const lowerMap = new Map(keys.map((k) => [k.toLowerCase(), k]));
  return (
    lowerMap.get("link to company products") ||
    lowerMap.get("promoted product") ||
    lowerMap.get("promoted products") ||
    "Promoted Product");

}

const FAQ_HEADERS = ["Keyword", "Flash AI", "Target Market", "Promoted Product"];
const FAQ_LAYOUT = "3fr minmax(120px, 140px) minmax(140px, 1fr) minmax(140px, 1fr)";

export default function GroupedFaqTable({ rows = [], tableId, options, handleUpdate, onDeleteRow, writtenByKeyword }) {
  const [expanded, setExpanded] = React.useState({});

  // Enhanced horizontal scroll with safe click handling - EXACT COPY from DataTable
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isInteractive = (target) =>
    !!(target && target.closest('button, [role="button"], a, input, select, textarea, [contenteditable="true"]'));

    const onWheel = (e) => {
      const canScrollX = el.scrollWidth > el.clientWidth;
      const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;

      if (!canScrollX) {
        return;
      }

      if (!horizontalIntent) {
        return;
      }

      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;

      const atLeft = el.scrollLeft <= 0;
      const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if (atLeft && delta < 0 || atRight && delta > 0) {
        return;
      }

      el.scrollLeft += delta;
      e.preventDefault();
    };

    let isDown = false;
    let isPanning = false;
    let startX = 0;
    let startLeft = 0;

    const onPointerDown = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (isInteractive(e.target)) return;
      isDown = true;
      isPanning = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!isPanning && Math.abs(dx) > 3) {
        isPanning = true;
      }
      if (isPanning) {
        el.scrollLeft = startLeft - dx;
        e.preventDefault();
      }
    };

    const onPointerUp = () => {
      isDown = false;
      isPanning = false;
    };

    const onKeyDown = (e) => {
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
    window.addEventListener("pointermove", onPointerMove); // Passive false removed, no preventDefault
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("keydown", onKeyDown);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map();
    (rows || []).forEach((row) => {
      // Default label changed to 'Manually Added'
      const raw = row?.fields?.["Top Level Keyword"];
      const key = raw && String(raw).trim() ? String(raw) : "Manually Added";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });

    const arr = Array.from(map.entries());
    // Always pin 'Manually Added' group at the top, then alphabetical for the rest
    arr.sort((a, b) => {
      const aKey = a[0];
      const bKey = b[0];
      const A = aKey.toLowerCase();
      const B = bKey.toLowerCase();
      if (A === "manually added" && B !== "manually added") return -1;
      if (B === "manually added" && A !== "manually added") return 1;
      return aKey.localeCompare(bKey);
    });

    return arr;
  }, [rows]);

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const isComplete = (fields) => {
    const tm = fields?.["Target Market"] || [];
    const ppKey = getLinkedProductFieldName(fields || {});
    const pp = fields?.[ppKey] || [];
    return Array.isArray(tm) && tm.length > 0 &&
    Array.isArray(pp) && pp.length > 0;
  };

  const renderFieldValue = (value) => {
    if (value === null || typeof value === "undefined" || value === "") {
      return <span className="text-slate-500">-</span>;
    }
    return String(value);
  };

  if (!rows || rows.length === 0) {
    return <div className="text-center text-slate-500 py-10">No FAQ records found for this user.</div>;
  }

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      className="w-full overflow-x-auto focus:outline-none"
      style={{ touchAction: "pan-x pan-y" }}
      aria-label="FAQ table horizontal scroller">

      <div className="w-full">
        {groups.map(([groupKey, groupRows]) => {
          const isOpen = !!expanded[groupKey];
          return (
            <div key={groupKey} className="mb-3 rounded-lg border border-slate-200 overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggle(groupKey)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white hover:bg-slate-50 transition-colors sticky top-0 z-20 border-b border-slate-200">

                <div className="flex items-center gap-2 text-slate-900">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-medium text-sm">{groupKey}</span>
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-xs">
                    {groupRows.length}
                  </Badge>
                </div>
                <span className="text-xs text-slate-600">Click to {isOpen ? "collapse" : "expand"}</span>
              </button>

              {isOpen &&
              <>
                  {/* Header */}
                  <div
                  className="grid text-xs font-semibold tracking-wide text-slate-600 uppercase bg-white sticky top-[41px] z-20 border-b border-slate-200 shadow-sm"
                  style={{ gridTemplateColumns: FAQ_LAYOUT, gap: "0.75rem", padding: "0.5rem 1rem" }}>

                    {FAQ_HEADERS.map((header) =>
                  <div key={header} className="whitespace-nowrap">{header}</div>
                  )}
                  </div>

                  {/* Rows */}
                  <div className="text-sm text-slate-900">
                    {groupRows.map((row, idx) => {
                    const fields = row.fields || {};
                    const complete = isComplete(fields);
                    const productField = getLinkedProductFieldName(fields);
                    const keywordText = String(fields["Keyword"] || "").trim();
                    const keywordKey = keywordText.toLowerCase();
                    const postId = writtenByKeyword ? writtenByKeyword[keywordKey] : null;

                    return (
                      <div
                        key={row.id}
                        className={`grid items-center border-t border-slate-200 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                        style={{ gridTemplateColumns: FAQ_LAYOUT, gap: "0.75rem", padding: "0.25rem 1rem" }}>

                          {FAQ_HEADERS.map((header) =>
                        <div key={`${row.id}-${header}`} className="min-w-0">
                              {header === "Keyword" ?
                          <div className="flex items-center gap-2">
                                  <span className="text-slate-900 truncate text-sm">{keywordText || "-"}</span>
                                  {complete && (
                            postId ?
                            <Link to={`${createPageUrl('Editor')}?postId=${postId}`}>
                                        <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                title="Open in Editor">

                                          Written
                                        </Button>
                                      </Link> :

                            <Badge className="inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-blue-800 bg-blue-900 text-white border border-blue-700 text-xs px-1.5 py-0.5">
                                        Writing Article
                                      </Badge>)

                            }
                                  <Button
                              variant="ghost"
                              size="icon" className="text-violet-800 ml-auto text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-red-700 hover:bg-red-50 h-6 w-6"

                              onClick={() => onDeleteRow && onDeleteRow(tableId, row.id)}
                              title="Delete FAQ keyword">

                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div> :
                          header === "Flash AI" ?
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={fields["Flash AI"] || false}
                              onCheckedChange={(checked) => handleUpdate(tableId, row.id, "Flash AI", checked)}
                              className="data-[state=checked]:bg-indigo-600"
                            />
                          </div> :
                          header === "Target Market" ?
                          <MiniMultiSelect
                            options={options.tm}
                            value={fields["Target Market"] || []}
                            onChange={(selected) => handleUpdate(tableId, row.id, "Target Market", selected)}
                            size="sm" /> :

                          header === "Promoted Product" ?
                          <MiniMultiSelect
                            options={options.pp}
                            value={fields[productField] || []}
                            onChange={(selected) => handleUpdate(tableId, row.id, productField, selected)}
                            size="sm"
                            itemVariant="pill" /> :


                          renderFieldValue(fields[header])
                          }
                            </div>
                        )}
                        </div>);

                  })}
                  </div>
                </>
              }
            </div>);

        })}
      </div>
    </div>);

}