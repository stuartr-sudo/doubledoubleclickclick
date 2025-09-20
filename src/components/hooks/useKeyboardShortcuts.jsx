import { useEffect, useMemo, useState } from "react";

const DEFAULT_SHORTCUTS = {
  "cmd+s,ctrl+s": { action: "save", description: "Save current work" },
  "cmd+p,ctrl+p": { action: "publish", description: "Publish post" },
  "cmd+/,ctrl+/": { action: "showShortcuts", description: "Show shortcuts" },
  "cmd+z,ctrl+z": { action: "undo", description: "Undo" },
  "cmd+shift+z,ctrl+shift+z": { action: "redo", description: "Redo" },
  "escape": { action: "closeModal", description: "Close modal" },
  "cmd+enter,ctrl+enter": { action: "submitForm", description: "Submit form" },
};

const isMac = () => {
  try { return navigator.platform.toUpperCase().includes("MAC"); } catch { return false; }
};

const normalizeCombo = (e) => {
  const parts = [];
  const mac = isMac();
  if ((mac && e.metaKey) || (!mac && e.ctrlKey)) parts.push(mac ? "cmd" : "ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  const key = (e.key || "").toLowerCase();
  const map = { escape: "escape", esc: "escape", enter: "enter", return: "enter" };
  parts.push(map[key] || key);
  return parts.join("+");
};

const expandMap = (shortcuts) => {
  const map = {};
  Object.entries(shortcuts).forEach(([keys, cfg]) => {
    keys.split(",").map(k => k.trim()).forEach(k => { map[k] = cfg; });
  });
  return map;
};

// Build a map action -> description from a shortcuts map
const actionDescriptions = (shortcuts) => {
  const out = {};
  Object.values(expandMap(shortcuts)).forEach(cfg => {
    if (!out[cfg.action]) out[cfg.action] = cfg.description || cfg.action;
  });
  return out;
};

export function useKeyboardShortcuts(handlers = {}, options = {}) {
  // customShortcuts is an object of combo -> {action, description}
  const [customShortcuts, setCustomShortcuts] = useState(() => {
    try {
      const saved = localStorage.getItem("customKeyboardShortcuts");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  // Effective shortcuts: if an action is customized, remove its defaults
  const shortcuts = useMemo(() => {
    const customActions = new Set(Object.values(customShortcuts).map(c => c.action));
    const filteredDefaults = Object.fromEntries(
      Object.entries(DEFAULT_SHORTCUTS).filter(([keys, cfg]) => !customActions.has(cfg.action))
    );
    return { ...filteredDefaults, ...customShortcuts };
  }, [customShortcuts]);

  const expanded = useMemo(() => expandMap(shortcuts), [shortcuts]);
  const enabled = options.enabled !== false;

  const handleCombo = (combo, e) => {
    const cfg = expanded[combo];
    if (!cfg) return false;
    const fn = handlers[cfg.action];
    if (!fn) return false;
    e?.preventDefault?.();
    e?.stopPropagation?.();
    fn();
    return true;
  };

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e) => {
      const combo = normalizeCombo(e);
      if (handleCombo(combo, e)) return;

      // On mac, also interpret ctrl as cmd fallback
      const mac = isMac();
      if (mac && e.ctrlKey && !e.metaKey) {
        const alt = combo.replace(/^ctrl\+/, "cmd+");
        handleCombo(alt, e);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [expanded, enabled, handlers]);

  // Receive shortcuts from the editable iframe (LiveHtmlPreview posts {type:'b44-shortcut', combo})
  useEffect(() => {
    if (!enabled) return;
    const onMsg = (e) => {
      const d = e?.data || {};
      if (d.type === "b44-shortcut" && typeof d.combo === "string") {
        handleCombo(d.combo);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [expanded, enabled, handlers]);

  const updateShortcut = (action, newCombo) => {
    // Conflict detection
    const all = { ...customShortcuts, ...expandMap(DEFAULT_SHORTCUTS) };
    const conflict = Object.entries(all).find(([combo, cfg]) => combo === newCombo && cfg.action !== action);
    if (conflict) {
      throw new Error(`Shortcut "${newCombo}" is already assigned to "${conflict[1].description || conflict[1].action}"`);
    }

    // Remove any existing custom entries for this action
    const next = Object.fromEntries(
      Object.entries(customShortcuts).filter(([, cfg]) => cfg.action !== action)
    );

    // Determine description
    const descMap = actionDescriptions({ ...DEFAULT_SHORTCUTS, ...customShortcuts });
    next[newCombo] = { action, description: descMap[action] || action };

    setCustomShortcuts(next);
    try { localStorage.setItem("customKeyboardShortcuts", JSON.stringify(next)); } catch {}
  };

  const resetShortcuts = () => {
    setCustomShortcuts({});
    try { localStorage.removeItem("customKeyboardShortcuts"); } catch {}
  };

  return {
    shortcuts,
    showCheatsheet,
    setShowCheatsheet,
    updateShortcut,
    resetShortcuts
  };
}

export default useKeyboardShortcuts;