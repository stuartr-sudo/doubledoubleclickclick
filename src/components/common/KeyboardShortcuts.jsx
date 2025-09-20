import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, RefreshCw } from "lucide-react";

const isMac = () => {
  try { return navigator.platform.toUpperCase().includes("MAC"); } catch { return false; }
};

const formatKey = (combo) => {
  const mac = isMac();
  const map = { cmd: "⌘", ctrl: mac ? "⌃" : "Ctrl", alt: mac ? "⌥" : "Alt", shift: mac ? "⇧" : "Shift", enter: mac ? "⏎" : "Enter", escape: "Esc" };
  return combo.split("+").map(k => map[k] || k.toUpperCase()).join(" ");
};

export default function KeyboardShortcuts({ isOpen, onClose, shortcuts, onUpdateShortcut, onReset }) {
  const [editingAction, setEditingAction] = useState(null);
  const [error, setError] = useState("");

  const actionMeta = useMemo(() => {
    // Build action -> {description, combos[]}
    const meta = {};
    Object.entries(shortcuts).forEach(([keys, cfg]) => {
      const combos = keys.split(",").map(k => k.trim());
      if (!meta[cfg.action]) meta[cfg.action] = { description: cfg.description, combos: [] };
      meta[cfg.action].combos.push(...combos);
    });
    return meta;
  }, [shortcuts]);

  useEffect(() => {
    if (!editingAction) return;
    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mac = isMac();
      const parts = [];
      if ((mac && e.metaKey) || (!mac && e.ctrlKey)) parts.push(mac ? "cmd" : "ctrl");
      if (e.altKey) parts.push("alt");
      if (e.shiftKey) parts.push("shift");
      const key = (e.key || "").toLowerCase();
      if (["meta", "control", "shift", "alt"].includes(key)) return; // wait for a real key
      parts.push(key === " " ? "space" : key);
      const combo = parts.join("+");
      try {
        onUpdateShortcut(editingAction, combo);
        setError("");
        setEditingAction(null);
      } catch (err) {
        setError(err?.message || "Conflict with another shortcut");
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [editingAction, onUpdateShortcut]);

  const mac = isMac();
  const pickForPlatform = (list) => {
    const pref = list.find(c => (mac ? c.startsWith("cmd+") : c.startsWith("ctrl+")));
    return pref || list[0];
  };

  const groups = {
    general: ["save", "publish", "showShortcuts"],
    editing: ["undo", "redo"],
    forms: ["submitForm", "closeModal"],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groups).map(([group, actions]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">{group}</h3>
              <div className="space-y-2">
                {actions.map((action) => {
                  const meta = actionMeta[action];
                  if (!meta) return null;
                  const combo = pickForPlatform(meta.combos);
                  return (
                    <div key={action} className="flex items-center justify-between p-2 rounded border bg-white/50">
                      <div>
                        <div className="text-sm font-medium">{meta.description || action}</div>
                        <div className="text-xs text-gray-500">{action}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border rounded">
                          {formatKey(combo)}
                        </kbd>
                        <Button variant="outline" size="sm" onClick={() => { setError(""); setEditingAction(action); }}>
                          <Pencil className="w-4 h-4 mr-1" /> Rebind
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {editingAction && (
            <div className="p-3 rounded bg-blue-50 border border-blue-200 text-sm">
              Press a new key combination for <strong>{editingAction}</strong>…
              {error && <div className="text-red-600 mt-2">{error}</div>}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Tip: Press {mac ? "⌘ /" : "Ctrl /"} to open this dialog anywhere in the editor.
            </p>
            <Button variant="outline" size="sm" onClick={onReset}>
              <RefreshCw className="w-4 h-4 mr-1" /> Reset to defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}