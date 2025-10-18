
import React, { useEffect, useRef, useCallback } from "react";
import { Username } from "@/api/entities";
import { CreateFileSignedUrl } from "@/api/integrations";
import { toast } from "sonner";

export default function LiveHtmlPreview({
  html,
  onImageSelect,
  onHtmlChange,
  onSelectionChange,
  onPreviewClick,
  onContextMenuSelected,
  onDoubleClickSelected,
  userCssUsername
}) {
  const iframeRef = useRef(null);
  const isReadyRef = useRef(false); // track when iframe script is ready
  const skipNextSetRef = useRef(false); // prevent echo that moves caret
  const initialHtmlRef = useRef(html); // snapshot of initial html used only at mount

  // Effect to load and inject custom CSS
  useEffect(() => {
    const iframe = iframeRef.current; // Capture iframe instance
    if (!iframe || !userCssUsername) {
      // If no iframe or no username, ensure any previously injected custom CSS is removed.
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const oldLink = doc?.head.querySelector('link[data-b44-custom-css]');
      if (oldLink) oldLink.remove();
      return;
    }

    const loadAndInjectCss = async () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          console.warn("Iframe document not available for CSS injection.");
          return;
        }

        const usernameRecords = await Username.filter({ user_name: userCssUsername });
        if (usernameRecords.length === 0) {
          toast.error("Could not find user information for custom brand CSS.");
          return;
        }

        const username = usernameRecords[0];
        const cssUri = username.default_css_file_uri;

        // Clear any old custom CSS first
        const oldLink = doc.head.querySelector('link[data-b44-custom-css]');
        if (oldLink) oldLink.remove();

        if (cssUri) {
          const { signed_url } = await CreateFileSignedUrl({ file_uri: cssUri });
          if (signed_url) {
            const link = doc.createElement('link');
            link.rel = 'stylesheet';
            link.href = signed_url;
            link.setAttribute('data-b44-custom-css', 'true');
            doc.head.appendChild(link);
          } else {
            toast.error("Failed to generate signed URL for custom brand CSS.");
          }
        }
      } catch (error) {
        console.error("Failed to load custom CSS:", error);
        toast.error("Could not load custom brand CSS.");
      }
    };

    // We need to wait for the iframe to be ready before we can inject CSS.
    // The iframe posts a 'b44-ready' message when its internal script has run.
    const handleReadyMessage = (event) => {
        if (event.data?.type === 'b44-ready') {
            loadAndInjectCss();
            // Remove listener after first successful load for this username
            window.removeEventListener('message', handleReadyMessage);
        }
    };
    
    window.addEventListener('message', handleReadyMessage);
    
    // Also trigger if already ready (e.g., username changes after initial iframe load)
    if(isReadyRef.current) {
        loadAndInjectCss();
    }

    return () => {
      window.removeEventListener('message', handleReadyMessage);
      // Cleanup: remove the link when the username changes or component unmounts
      // FIXED: Use the captured iframe variable instead of iframeRef.current
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const link = doc?.head.querySelector('link[data-b44-custom-css]');
      if (link) link.remove();
    };
  }, [userCssUsername]);


  // Inject default text color without overriding explicit inline styles
  const __injectBlackText = () => {
    try {
      const iframe = iframeRef.current;
      const d = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (!d) return;
      const style = d.createElement("style");
      style.setAttribute("data-b44", "force-black-text");
      style.textContent = `
        /* Default readable text color; does NOT override inline colors */
        body { color: #0f172a; }
      `;
      // Replace previous aggressive rule if it exists
      const existing = d.head.querySelector('style[data-b44="force-black-text"]');
      if (existing) existing.remove();
      d.head.appendChild(style);
    } catch (_) {}
  };

  const writeDoc = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const cw = iframe.contentWindow ? iframe.contentWindow : null;
    const doc = iframe.contentDocument || (cw && cw.document);
    if (!doc) return;

    const helperScript = `
      (function(){
        let nextId = 1;
        let selected = null;
        let dumpTimer = null;
        let lastRange = null; // remember last valid caret/selection
        let lastSelectedId = null; // persist last selected element by its data-b44-id to restore after commits

        // Add global drag state and helpers
        var __dragState = { id: null, overEl: null, pos: 'before' };
        var __dropSelector = '[data-b44-type], .b44-promoted-product, .b44-audio-inline, blockquote.tiktok-embed, .youtube-video-container, p, div, section, article, h1, h2, h3, h4, h5, h6, li, img';
        function clearDropClasses(){
          try {
            document.querySelectorAll('.b44-drop-before, .b44-drop-after').forEach(function(n){
              n.classList.remove('b44-drop-before'); 
              n.classList.remove('b44-drop-after');
            });
          } catch(_) {}
        }

        // lightweight HTML history for reliable Undo/Redo (independent of execCommand)
        const HISTORY_LIMIT = 100;
        let __history = [];
        let __future = [];
        let __restoring = false;
        let __lastHtml = null;

        function pushHistory(reason){
          try {
            const html = document.body.innerHTML;
            if (html === __lastHtml) return; // no-op, HTML is the same
            __history.push(html);
            if (__history.length > HISTORY_LIMIT) __history.shift();
            __future = []; // clear redo stack on new action
            __lastHtml = html;
          } catch(_) {}
        }

        function restoreHtml(html){
          __restoring = true;
          setHtmlFromParent(html || "");
          __lastHtml = html || ""; // Ensure __lastHtml is updated
          __restoring = false;
        }

        function undoSnapshot(){
          if (__history.length <= 1) return; // nothing to undo (always keep at least initial state)
          const current = __history.pop(); // remove current state
          __future.push(current); // push current state to future for redo
          const prev = __history[__history.length - 1]; // get previous state
          if (prev !== undefined) { // Check if prev exists
            restoreHtml(prev);
            try { window.parent.postMessage({ type: 'html-dump', html: document.body.innerHTML }, '*'); } catch(_) {}
          } else {
            // This case should ideally not be hit if __history.length > 1, but as a safeguard
            __history.push(current); // Put back current if no prev found
            __future.pop(); // Remove from future
          }
        }

        function redoSnapshot(){
          if (__future.length === 0) return;
          const next = __future.pop();
          __history.push(next);
          restoreHtml(next);
          try { window.parent.postMessage({ type: 'html-dump', html: document.body.innerHTML }, '*'); } catch(_) {}
        }

        // broken image handling
        function markImageBroken(img) {
          try {
            img.dataset.b44Broken = '1';
            img.style.display = 'none';
            img.alt = (img.alt || '').toString() + ' (image not available)';
          } catch(_) {}
        }
        function bindImageHandlers(root) {
          try {
            (root || document).querySelectorAll('img').forEach(function(img){
              if (img.dataset.b44ImgBound === '1') return;
              img.dataset.b44ImgBound = '1';
              img.addEventListener('error', function(){ markImageBroken(img); });
              img.addEventListener('load', function(){
                if (!img.naturalWidth || !img.naturalHeight) markImageBroken(img);
              });
              // hide immediately if src is empty/invalid
              if (!img.getAttribute('src')) markImageBroken(img);
            });
          } catch(_) {}
        }

        // NEW: render any saved shadow templates into real Shadow DOM at runtime
        function setupShadowBlocks(root) {
          try {
            (root || document).querySelectorAll('[data-b44-shadow-host]').forEach(function(host){
              if (host.dataset.b44ShadowReady === '1') return;
              const tpl = host.querySelector('template[data-b44-shadow-html]');
              if (!tpl) { host.dataset.b44ShadowReady = '1'; return; }
              try {
                const shadow = host.attachShadow({ mode: 'open' });
                shadow.innerHTML = tpl.innerHTML;
                host.dataset.b44ShadowReady = '1';
              } catch (e) {
                // If Shadow DOM not available for some reason, fall back to inline render without isolation
                // but keep the template as source of truth.
                const fallback = document.createElement('div');
                fallback.setAttribute('data-b44-shadow-fallback', '1');
                fallback.innerHTML = tpl.innerHTML;
                host.appendChild(fallback);
                host.dataset.b44ShadowReady = '1';
              }
            });
          } catch (_) {}
        }

        // Observe DOM for future <img> additions
        const __imgObserver = new MutationObserver(function(muts){
          muts.forEach(function(m){
            m.addedNodes && m.addedNodes.forEach(function(n){
              if (n && n.nodeType === 1) {
                if (n.tagName === 'IMG') {
                  bindImageHandlers(n.parentElement || document);
                  markDraggable(n); // NEW: Make newly added images draggable
                } else {
                  bindImageHandlers(n);
                }

                // NEW: set up any newly added shadow-host blocks
                if (n.matches && n.matches('[data-b44-shadow-host]')) {
                  setupShadowBlocks(n.parentElement || n);
                } else if (n.querySelectorAll) {
                  const hosts = n.querySelectorAll('[data-b44-shadow-host]');
                  if (hosts && hosts.length) setupShadowBlocks(n);
                }
                // NEW: Check for newly added img elements that might need to be made draggable
                if (n.matches && n.matches('img')) {
                  markDraggable(n);
                } else if (n.querySelectorAll) {
                  n.querySelectorAll('img').forEach(markDraggable);
                }
              }
            });
          });
        });
        try { __imgObserver.observe(document.body, { childList: true, subtree: true }); } catch(_) {}
        
        // NEW: Drag & Drop for feature blocks (TLDR, FAQ, Testimonial, CTA, product, etc.)
        function markDraggable(el) {
          try {
            if (!el) return;
            // NEW: in-memory flag that won't persist into saved HTML
            if (el.__b44DragBound) return;
            el.__b44DragBound = true;

            el.setAttribute('draggable', 'true');

            el.addEventListener('dragstart', function (ev) {
              try {
                ev.stopPropagation();
                ev.dataTransfer.effectAllowed = 'move';
                var id = el.dataset.b44Id || '';
                ev.dataTransfer.setData('text/plain', id);
                el.classList.add('b44-dragging');
                __dragState.id = id; // remember globally
                lastSelectedId = id;
              } catch(_) {}
            });

            // Keep element-level dragover to allow drop on specific targets, but compute before/after by cursor Y
            el.addEventListener('dragover', function (ev) {
              try {
                if (!__dragState.id) return;
                ev.preventDefault();
                var rect = el.getBoundingClientRect();
                var pos = ((ev.clientY - rect.top) < rect.height / 2) ? 'before' : 'after';
                clearDropClasses();
                el.classList.add(pos === 'before' ? 'b44-drop-before' : 'b44-drop-after');
                __dragState.overEl = el;
                __dragState.pos = pos;
              } catch(_) {}
            });

            el.addEventListener('dragleave', function () {
              try { el.classList.remove('b44-drop-before'); el.classList.remove('b44-drop-after'); } catch(_) {}
            });

            el.addEventListener('drop', function (ev) {
              try {
                if (!__dragState.id) return;
                ev.preventDefault();
                ev.stopPropagation();
                var src = document.querySelector('[data-b44-id=\"' + __dragState.id + '\"]');
                var target = el;
                if (!src || !target || src === target || src.contains(target)) {
                  clearDropClasses();
                  __dragState.id = null; __dragState.overEl = null; // Reset global state
                  return;
                }
                if (__dragState.pos === 'before') {
                  target.parentNode.insertBefore(src, target);
                } else {
                  target.parentNode.insertBefore(src, target.nextSibling);
                }
                clearDropClasses();
                try { selectGeneric(src, src.dataset && src.dataset.b44Type ? src.dataset.b44Type : 'block'); } catch(_) {}
                pushHistory('drag-drop');
                dumpHtml(true);
                __dragState.id = null; __dragState.overEl = null; // Reset global state
              } catch(_) {}
            });

            el.addEventListener('dragend', function () {
              try { clearDropClasses(); el.classList.remove('b44-dragging'); __dragState.id = null; __dragState.overEl = null; } catch(_) {}
            });
          } catch(_) {}
        }

        // Ensure feature blocks have required data attributes and bindings
        function ensureFeatureDataAttrs(el, type) {
          if (!el) return;
          const t = (type || (el.dataset && el.dataset.b44Type) || '').toLowerCase();
          if (!el.dataset) el.dataset = {};
          if (!el.dataset.b44Type) el.dataset.b44Type = t || inferFeatureType(el);
          if (!el.dataset.b44Id) el.dataset.b44Id = 'el-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
          markDraggable(el);
        }

        function inferFeatureType(el) {
          if (!el) return 'block';
          const c = (el.className || '').toString().toLowerCase();
          if (c.includes('b44-faq')) return 'faq';
          if (c.includes('b44-tldr')) return 'tldr';
          if (c.includes('b44-promoted-product')) return 'product';
          if (c.includes('b44-audio-inline')) return 'audio';
          if (c.includes('testimonial')) return 'testimonial';
          // NEW: detect references blocks
          if (c.includes('b44-references')) return 'references';
          return 'block';
        }

        // Click-to-select for feature blocks (so Delete works)
        // This is a global listener, specific clicks will override.
        document.addEventListener('click', function(e){
          try {
            const sel = '.b44-faq, .b44-tldr, .b44-promoted-product, .b44-audio-inline, blockquote.tiktok-embed, .youtube-video-container, [data-b44-type], img'; // ADDED: img to the selector
            const block = e.target && e.target.closest && e.target.closest(sel);
            if (!block) return;
            ensureFeatureDataAttrs(block); // Ensure it's properly tagged if it wasn't already
            if (typeof selectGeneric === 'function') {
              selectGeneric(block, block.dataset.b44Type || 'block');
            }
          } catch(_) {}
        }, true);
        
        // recompute nextId to avoid collisions with existing IDs
        function recomputeNextId() {
          try {
            let maxId = 0;
            document.querySelectorAll('[data-b44-id]').forEach((n) => {
              // Only consider numeric IDs for recomputing nextId
              if (n.dataset.b44Id && !isNaN(parseInt(n.dataset.b44Id, 10))) {
                const v = parseInt(n.dataset.b44Id, 10);
                if (v > maxId) maxId = v;
              }
            });
            nextId = maxId + 1;
          } catch (_) {}
        }

        // track processed message ids to prevent duplicate inserts
        if (!window.__b44_processed_ids) window.__b44_processed_ids = {};
        function alreadyProcessed(id){
          if (!id) return false;
          if (window.__b44_processed_ids[id]) return true;
          window.__b44_processed_ids[id] = Date.now();
          // prune oldest after 200 entries
          const keys = Object.keys(window.__b44_processed_ids);
          if (keys.length > 200) {
            keys.sort((a,b) => window.__b44_processed_ids[a] - window.__b44_processed_ids[b]);
            for (let i = 0; i < keys.length - 150; i++) delete window.__b44_processed_ids[keys[i]];
          }
          return false;
        }

        function styleTikTokEmbedsDefault() {
          try {
            const blocks = document.querySelectorAll('blockquote.tiktok-embed');
            blocks.forEach((el) => {
              if (el && el.dataset && el.dataset.b44WidthSet === '1') return;
              el.style.display = 'block';
              el.style.width = '65%';
              el.style.maxWidth = '100%';
              if (!el.style.margin) el.style.margin = '1rem auto';
              let sib = el.nextElementSibling;
              while (sib && sib.tagName !== 'IFRAME') sib = sib.nextElementSibling;
              if (sib && /tiktok\\.com/.test((sib.getAttribute('src') || ''))) {
                sib.style.display = 'block';
                sib.style.width = '65%';
                sib.style.maxWidth = '100%';
                if (!sib.style.margin) sib.style.margin = '1rem auto';
              }
            });
          } catch(e) {}
        }

        function clearSelections() {
          if (selected) {
            selected.style.outline = '';
            selected = null;
          }
          document.querySelectorAll('.b44-cta-block,[data-b44-type="cta"]').forEach(function(n){
            n.style.outline = '0px solid transparent';
          });
          // also clear outlines for any selectable block types like FAQ
          document.querySelectorAll('[data-b44-id],[data-b44-type], .b44-audio-inline').forEach(function(n){ // Added .b44-audio-inline
            n.style.outline = '0px solid transparent';
          });
        }

        function markSelectable(el, kind){
          if (!el) return;
          if (!el.getAttribute('data-b44-id')) {
            el.setAttribute('data-b44-id', kind + '-' + Math.random().toString(36).slice(2,8));
          }
          el.addEventListener('click', function(e){
            e.stopPropagation();
            const id = el.getAttribute('data-b44-id');
            clearSelections();
            el.style.outline = '2px solid #10b981';
            // original select-image was too specific, media-selected is more generic
            window.parent.postMessage({ type: 'media-selected', id: id, kind: kind, width: 100, align: 'center' }, '*');
          });
        }

        // All product iframe handling functions are removed as per instructions.

        function assignIds() {
          // start from the highest existing numeric id + 1 to avoid duplicates
          recomputeNextId();

          const imgs = document.querySelectorAll('img');
          imgs.forEach(function(img){
            if (!img.dataset.b44Id) { img.dataset.b44Id = String(nextId++); }
            // No longer apply margin here, rely on CSS.
            // if (!img.style.margin) img.style.margin = '1rem 0';
            img.style.cursor = 'pointer';
          });

          const ytIframes = document.querySelectorAll('iframe[src*="youtube.com/embed"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie.com/embed"]');
          ytIframes.forEach(function(ifr){
            const container = ifr.closest('.youtube-video-container') || ifr.parentElement || ifr;
            if (!container.dataset.b44Id) { container.dataset.b44Id = String(nextId++); }
            container.style.display = 'block';
            if (!container.style.margin) container.style.margin = '1rem 0';
            container.style.cursor = 'pointer';
            container.style.maxWidth = '100%';
          });

          const tiktokBlocks = document.querySelectorAll('blockquote.tiktok-embed');
          tiktokBlocks.forEach(function(el){
            if (!el.dataset.b44Id) { el.dataset.b44Id = String(nextId++); }
            el.style.display = 'block';
            if (!el.style.margin) el.style.margin = '1rem auto';
            el.style.cursor = 'pointer';
            el.style.maxWidth = '100%';
          });

          const prods = document.querySelectorAll('.b44-promoted-product');
          prods.forEach(function(el){
            if (!el.dataset.b44Id) { el.dataset.b44Id = String(nextId++); }
            el.style.cursor = 'pointer';
            // Specific styles for promoted product should generally be handled by CSS only,
            // but for dynamic sizing/alignment, it might be adjusted by the applyChange function.
            // Default margin is now zeroed out in CSS.
            // if (!el.style.margin) el.style.margin = '1rem 0';
            el.style.maxWidth = '100%';
          });

          // NEW: after products exist in DOM, render their shadow content
          setupShadowBlocks(document);

          // NEW: Ensure audio elements or their wrappers get a data-b44-id
          const audios = document.querySelectorAll('audio, .b44-audio-inline');
          audios.forEach(function(aud){
            if (!aud.dataset.b44Id) { aud.dataset.b44Id = String(nextId++); }
            aud.style.cursor = 'pointer';
          });

          // ensure all custom blocks get a data-b44-id (e.g., FAQ)
          try {
            document.querySelectorAll('[data-b44-type]').forEach(function(el){
              if (!el.dataset.b44Id) { el.dataset.b44Id = String(nextId++); }
            });
          } catch(_) {}

          document.querySelectorAll('.b44-cta-block,[data-b44-type="cta"]').forEach(function(el){
            markSelectable(el, 'cta');
          });

          // ensure image error handlers are bound after IDs assigned
          bindImageHandlers(document);

          styleTikTokEmbedsDefault();

          // NEW: make feature blocks draggable (TLDR/FAQ/Testimonial/etc.)
          try {
            document.querySelectorAll('[data-b44-type]').forEach(markDraggable);
            document.querySelectorAll('.b44-promoted-product').forEach(markDraggable);
            document.querySelectorAll('.b44-audio-inline').forEach(markDraggable);
            document.querySelectorAll('blockquote.tiktok-embed').forEach(markDraggable);
            document.querySelectorAll('.youtube-video-container').forEach(markDraggable);
            document.querySelectorAll('img').forEach(markDraggable); // ADDED: Make images draggable

            // NEW: Auto-tag Flash-generated FAQ / TLDR so they become selectable + draggable
            document.querySelectorAll('.b44-faq').forEach(function(el){
              ensureFeatureDataAttrs(el, 'faq');
            });
            document.querySelectorAll('.b44-tldr').forEach(function(el){
              ensureFeatureDataAttrs(el, 'tldr');
            });
            // NEW: auto-tag references if present
            document.querySelectorAll('.b44-references').forEach(function(el){
              ensureFeatureDataAttrs(el, 'references');
            });
          } catch(_) {}
        }

        // Add a MutationObserver to capture future inserts (e.g., when Flash appends FAQ after run)
        try {
          const mo = new MutationObserver(function(muts){
            for (const m of muts) {
              (m.addedNodes || []).forEach(function(n){
                if (!n || n.nodeType !== 1) return;
                // Check if the added node itself matches
                if (n.matches && (n.matches('.b44-faq, .b44-tldr, .b44-references, img') || n.matches('[data-b44-type]'))) { // ADDED: img to the selector
                  ensureFeatureDataAttrs(n);
                } else if (n.querySelectorAll) {
                  n.querySelectorAll('.b44-faq, .b44-tldr, .b44-references, [data-b44-type], img').forEach(function(el){ // ADDED: img to the selector
                    ensureFeatureDataAttrs(el);
                  });
                }
              });
            }
          });
          mo.observe(document.body, { childList: true, subtree: true });
        } catch(_) {}

        // Transient editor classes/styles that should NEVER persist across saves
        function removeTransientClassesLive(root) {
          try {
            (root || document).querySelectorAll('.b44-dragging, .b44-drop-before, .b44-drop-after').forEach(function(n){
              n.classList.remove('b44-dragging');
              n.classList.remove('b44-drop-before');
              n.classList.remove('b44-drop-after');
            });
            // NEW: strip legacy persisted drag-bound attributes so we can rebind after refresh
            (root || document).querySelectorAll('[data-b44-drag-bound]').forEach(function(n){
              try { n.removeAttribute('data-b44-drag-bound'); } catch(_) {}
            });
            // Clear selection outlines that could have been saved inline
            (root || document).querySelectorAll('[data-b44-id],[data-b44-type]').forEach(function(n){
              try { if (n.style && n.style.outline) n.style.outline = ''; } catch(_) {}
            });
          } catch(_) {}
        }
        function getCleanHtml() {
          try {
            const clone = document.body.cloneNode(true);
            // Remove transient classes in the clone
            clone.querySelectorAll('.b44-dragging, .b44-drop-before, .b44-drop-after').forEach(function(n){
              n.classList.remove('b44-dragging');
              n.classList.remove('b44-drop-before');
              n.classList.remove('b44-drop-after');
            });
            // NEW: strip any persisted drag-bound attributes so saved HTML stays clean
            clone.querySelectorAll('[data-b44-drag-bound]').forEach(function(n){
              try { n.removeAttribute('data-b44-drag-bound'); } catch(_) {}
            });
            // Strip selection outlines only
            clone.querySelectorAll('[data-b44-id],[data-b44-type]').forEach(function(n){
              try { if (n.hasAttribute('style')) {
                n.style.outline = '';
                if (!n.getAttribute('style') || n.getAttribute('style').trim() === '') {
                  n.removeAttribute('style');
                }
              } } catch(_) {}
            });
            return clone.innerHTML;
          } catch(_) {
            // Fallback to raw innerHTML to avoid blocking saves
            return document.body.innerHTML;
          }
        }

        function deleteElementById(id) {
          const el = document.querySelector('[data-b44-id="' + id + '"]');
          if (el && el.parentElement) {
            if (selected === el) { clearSelections(); }
            el.parentElement.removeChild(el);
            dumpHtml(true);
            pushHistory('delete'); // record to history
          }
        }

        function currentWidthPct(el) {
          const parent = el.parentElement || document.body;
          const parentW = parent.getBoundingClientRect().width || 1;
          const w = el.getBoundingClientRect().width || 0;
          return Math.max(10, Math.min(100, Math.round((w / parentW) * 100)));
        }

        function deriveAlign(el) {
          const cs = getComputedStyle(el);
          const ml = cs.marginLeft;
          const mr = cs.marginRight;
          if (ml === 'auto' && mr === 'auto') return 'center';
          if (ml === 'auto') return 'right';
          return 'left';
        }

        function select(el) {
          clearSelections();
          selected = el;
          // remember which element is selected so we can reselect it after a commit
          try { lastSelectedId = el && el.dataset ? el.dataset.b44Id || null : null; } catch(_) { lastSelectedId = null; }
          el.style.outline = '2px solid #3b82f6';
          var id = el.dataset.b44Id;
          var w = currentWidthPct(el);
          var al = deriveAlign(el);
          var mediaType = 'image'; // Default type
          if (el.matches('iframe[src*="youtube.com/embed"]') || el.matches('blockquote.tiktok-embed')) {
            mediaType = 'video';
          } else if (el.matches('audio') || el.matches('.b44-audio-inline')) {
            mediaType = 'audio';
          } else if (el.matches('.b44-promoted-product')) {
            mediaType = 'product';
          }
          // Consolidated to 'media-selected' and added mediaType
          window.parent.postMessage({ type: 'media-selected', id: id, width: w, align: al, mediaType: mediaType }, '*');
        }

        // generic selector that doesn't trigger media toolbar in parent
        function selectGeneric(el, kind) {
          clearSelections();
          selected = el;
          try { lastSelectedId = el && el.dataset ? el.dataset.b44Id || null : null; } catch(_) { lastSelectedId = null; }
          el.style.outline = '2px solid #10b981'; // Specific color for generic blocks
          // Inform parent in case it wants to react, but do not use media channels
          try { window.parent.postMessage({ type: 'block-selected', id: el.dataset.b44Id, kind: kind || 'block' }, '*'); } catch(_){}
        }

        function dumpHtml(immediate) {
          const post = function(){
            try {
              window.parent.postMessage({ type: 'html-dump', html: getCleanHtml() }, '*');
            } catch(_) {}
          };
          if (immediate) { post(); return; }
          clearTimeout(dumpTimer);
          dumpTimer = setTimeout(post, 120);
        }

        function saveLastRange() {
          const sel = document.getSelection();
          if (sel && sel.rangeCount > 0) {
            try { lastRange = sel.getRangeAt(0).cloneRange(); } catch(e){}
          }
        }

        function restoreLastRangeSoon() {
          // Restore selection after browser default behaviors finish
          setTimeout(() => {
            try {
              if (!lastRange) return;
              const sel = document.getSelection();
              if (!sel) return;
              sel.removeAllRanges();
              sel.addRange(lastRange.cloneRange());
            } catch(_) {}
          }, 0);
        }

        function ensureRange() {
          const sel = document.getSelection();
          if (sel && sel.rangeCount > 0) return sel.getRangeAt(0);
          if (lastRange) {
            sel.removeAllRanges();
            sel.addRange(lastRange);
            return lastRange;
          }
          const r = document.createRange();
          r.selectNodeContents(document.body);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
          lastRange = r.cloneRange();
          return r;
        }

        function reportSelection() {
          saveLastRange();
          const sel = document.getSelection();
          const text = sel && !sel.isCollapsed ? String(sel).trim() : '';
          window.parent.postMessage({ type: 'selection-change', text: text }, '*');
        }

        function executePendingScripts(root){
          root = root || document.body;
          const scripts = Array.prototype.slice.call(root.querySelectorAll('script:not([data-b44-processed])'));
          scripts.forEach(function(old){
            const s = document.createElement('script');
            Array.prototype.slice.call(old.attributes).forEach(function(attr){ s.setAttribute(attr.name, attr.value); });
            if (old.textContent) s.textContent = old.textContent;
            old.dataset.b44Processed = '1';
            try { (document.body || document.documentElement).appendChild(s); } catch(e){}
          });
          styleTikTokEmbedsDefault();
        }

        function nearestTikTok(el) {
          if (!el) return null;
          if (el.nodeType === 1) {
            if (el.matches('blockquote.tiktok-embed')) return el;
            return el.closest && el.closest('blockquote.tiktok-embed');
          } else {
            return el.parentElement && el.parentElement.closest('blockquote.tiktok-embed');
          }
        }
        
        // Improved getClosestBlockAncestor to include more common block-level tags
        function getClosestBlockAncestor(node) {
            if (!node) return document.body;
            let el = node.nodeType === 1 ? node : node.parentElement;
            while (el && el !== document.body) {
                const display = window.getComputedStyle(el).display;
                if (display === 'block' || display === 'list-item' || display === 'table' || display === 'flex' || display === 'grid' ||
                    ['div', 'p', 'ul', 'ol', 'li', 'section', 'article', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(el.tagName.toLowerCase())) {
                    return el;
                }
                el = el.parentElement;
            }
            return document.body; // If no block parent found before body, return body itself.
        }

        // The previous getTopLevelInsertionPoint function has been removed as its logic is now
        // directly integrated and improved into insertHtmlAfterSelection.

        function insertHtmlAtSelection(html) {
          const sel = document.getSelection();
          let range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0) : ensureRange();
          if (!range) return;
          
          range.deleteContents();

          const temp = document.createElement('div');
          temp.innerHTML = html;
          const frag = document.createDocumentFragment();
          var node, lastNode;
          while ((node = temp.firstChild)) { lastNode = frag.appendChild(node); }
          
          const blockParent = getClosestBlockAncestor(range.startContainer);
          if (blockParent && blockParent !== document.body) {
              blockParent.parentNode.insertBefore(frag, blockParent.nextSibling);
              if (lastNode) {
                  range.setStartAfter(lastNode);
                  range.setEndAfter(lastNode);
                  sel.removeAllRanges();
                  sel.addRange(range);
                  lastRange = range.cloneRange();
              }
          } else {
              range.insertNode(frag); 
              if (lastNode) {
                  sel.removeAllRanges();
                  const newRange = document.createRange();
                  newRange.setStartAfter(lastNode);
                  newRange.collapse(true);
                  sel.addRange(newRange);
                  lastRange = newRange.cloneRange();
              }
          }

          assignIds();
          executePendingScripts();
          styleTikTokEmbedsDefault();
          const tik = nearestTikTok(lastNode);
          if (tik) select(tik);
          dumpHtml(true);
          pushHistory('insert');
        }

        // insert content after current selection (no replacement)
        // FIX: Insert infographic RIGHT AFTER the selected text's parent block, not at bottom
        function insertHtmlAfterSelection(html) {
          const sel = document.getSelection();
          let range = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : ensureRange();
          if (!range) return;
          
          const temp = document.createElement('div');
          temp.innerHTML = html;
          const frag = document.createDocumentFragment();
          let lastNode = null;
          let node;
          while ((node = temp.firstChild)) { lastNode = frag.appendChild(node); }
          
          let insertionPointElement = getClosestBlockAncestor(range.endContainer); // Use endContainer for insertion point

          // If the closest block ancestor is an <li>, promote the insertion point to its parent <ul>/ol
          if (insertionPointElement && insertionPointElement.tagName?.toLowerCase() === 'li') {
            const parentList = insertionPointElement.closest('ul, ol');
            if (parentList) {
              insertionPointElement = parentList;
            }
          }

          if (insertionPointElement && insertionPointElement !== document.body) {
              // Insert the fragment immediately after the determined insertionPointElement
              if (insertionPointElement.parentNode) {
                  insertionPointElement.parentNode.insertBefore(frag, insertionPointElement.nextSibling);
              } else {
                  // Fallback if insertionPointElement somehow has no parent (e.g., detached or direct child of documentFragment)
                  document.body.appendChild(frag);
              }
          } else {
              // If no suitable block ancestor found before body, or the closest ancestor is the body itself,
              // append to the body.
              document.body.appendChild(frag);
          }

          if (lastNode) {
              sel.removeAllRanges();
              const newRange = document.createRange();
              newRange.setStartAfter(lastNode);
              newRange.collapse(true);
              sel.addRange(newRange);
              lastRange = newRange.cloneRange();
          }

          assignIds();
          executePendingScripts();
          styleTikTokEmbedsDefault();
          const tik = nearestTikTok(lastNode);
          if (tik) select(tik);
          dumpHtml(true);
          pushHistory('insert-after');
        }

        function insertLink(url) {
          const sel = document.getSelection();
          var text = sel && !sel.isCollapsed ? String(sel) : '';
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = text && text.trim().length ? text : url.replace(/^https?:\\/\\//,'').replace(/\\/$/,'');
          insertHtmlAtSelection(a.outerHTML);
        }

        function wrapSelectionInTag(tagName) {
          const sel = document.getSelection();
          if (!sel || sel.isCollapsed) return; // No selection
          
          const selectedText = sel.toString();
          if (!selectedText.trim()) return;
          
          const range = sel.getRangeAt(0);
          range.deleteContents();
          
          const wrapper = document.createElement(tagName.toLowerCase());
          wrapper.textContent = selectedText;
          
          range.insertNode(wrapper);
          
          // Clear selection and place cursor after the inserted element
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.setStartAfter(wrapper);
          newRange.collapse(true);
          sel.addRange(newRange);
          
          assignIds();
          dumpHtml(true);
          pushHistory('wrap-' + tagName);
        }

        function applyChange(msg) {
          const id = msg.id, width = msg.width, align = msg.align;
          const el = document.querySelector('[data-b44-id="'+id+'"]');
          if (!el) return;

          function applyTo(target) {
            if (!target) return;
            // NEW: Do not apply width/margin for images with data-infographic="true"
            if (target.matches('img[data-infographic="true"]')) {
              // Skip width/margin changes for infographics, they are full-width
              // Still allow outline/selection behavior
            } else {
              if (typeof width === 'number') {
                target.style.width = width + '%';
                target.style.maxWidth = '100%';
                target.style.minWidth = '0';
                target.style.display = 'block';
              }
              if (align) {
                target.style.display = 'block';
                if (align === 'center') target.style.margin = '1rem auto';
                else if (align === 'right') target.style.margin = '1rem 0 1rem auto';
                else target.style.margin = '1rem 0';
              }
            }
          }

          applyTo(el);

          if (el.matches && el.matches('blockquote.tiktok-embed')) {
            if (typeof width === 'number' && el.dataset) el.dataset.b44WidthSet = '1';
            let sib = el.nextElementSibling;
            while (sib && sib.tagName !== 'IFRAME') sib = sib.nextElementSibling;
            if (sib && /tiktok\\.com/.test(sib.getAttribute('src') || '')) {
              applyTo(sib);
            }
          }

          // Also apply to audio wrappers if they have similar sizing needs
          if (el.matches && el.matches('.b44-audio-inline')) {
            // The applyTo(el) already handles block, width, margin.
            // Float handling here specific for the wrapper.
          }

          // If a promoted product, specific margin/padding is handled by CSS,
          // but width/alignment from here might still be useful.
          if (el.matches && el.matches('.b44-promoted-product')) {
            // No additional margin/padding rules here, relies on global CSS.
          }


          if (selected === el) { el.style.outline = '2px solid #3b82f6'; }
          if (el.matches('.b44-cta-block') || el.matches('[data-b44-type="cta"]')) {
            el.style.outline = '2px solid #10b981';
          }

          // IMPORTANT: do NOT dump HTML here to avoid flicker during slider drags.
          // Parent can explicitly request a dump via 'request-html' or 'commit-html'.
          saveLastRange();
        }

        function setHtmlFromParent(newHtml) {
          // Preserve scroll position to avoid jumping to the top
          const scroller = document.scrollingElement || document.documentElement || document.body;
          const prevTop = scroller.scrollTop;

          // Replace HTML
          document.body.innerHTML = newHtml || '';

          // NEW: If any transient classes/styles were accidentally persisted in saved HTML, remove them now
          removeTransientClassesLive(document);

          assignIds();
          executePendingScripts();
          styleTikTokEmbedsDefault();
          bindImageHandlers(document);
          setupShadowBlocks(document); // Ensure shadow blocks are set up on HTML change

          // Restore previous scroll position
          try { scroller.scrollTop = prevTop; } catch(_) {}

          // reselect the previously selected element (if it still exists)
          if (lastSelectedId) {
            try {
              const el = document.querySelector('[data-b44-id="' + lastSelectedId + '"]');
              if (el) {
                // Defer a tick to ensure layout is ready before notifying parent
                setTimeout(function(){
                  // If it's a media element (including audio), use 'select', otherwise 'selectGeneric'
                  if (el.matches('img') || el.matches('iframe[src*="youtube.com/embed"]') || el.matches('blockquote.tiktok-embed') || el.matches('.b44-promoted-product') || el.matches('audio') || el.matches('.b44-audio-inline')) {
                    select(el);
                  } else if (el.dataset.b44Type) {
                    selectGeneric(el, el.dataset.b44Type);
                  } else {
                    select(el); // Fallback to select if type is unknown but ID exists
                  }
                }, 10);
              }
            } catch(_) {}
          }

          // only push to history when not restoring an undo/redo
          if (!__restoring) {
            pushHistory('set-html');
          }
        }

        // Post a simple click so parent can close menus if needed
        document.addEventListener('click', function(e){
          try { window.parent.postMessage({ type: 'b44-click-preview' }, '*'); } catch(_) {}
        }, true);

        // Double-click -> Ask AI (send selection text + cursor pos)
        document.addEventListener('dblclick', function(e){
          try {
            const txt = (window.getSelection() && window.getSelection().toString()) || '';
            window.parent.postMessage({
              type: 'b44-dblclick',
              x: e.clientX,
              y: e.clientY,
              text: txt
            }, '*');
          } catch(_) {}
        }, true);

        // Right-click (context menu) -> Ask AI (send selection text + cursor pos)
        document.addEventListener('contextmenu', function(e){
          try {
            const txt = (window.getSelection() && window.getSelection().toString()) || '';
            window.parent.postMessage({
              type: 'b44-contextmenu',
              x: e.clientX,
              y: e.clientY,
              text: txt
            }, '*');
            e.preventDefault();
          } catch(_) {}
        }, true);

        document.addEventListener('click', function(e){
          const t = e.target;
          let handledSelection = false;

          // UPDATED: FAQ block selection that preserves toggle clicks (label/checkbox)
          const faqBlock = t && t.closest && t.closest('[data-b44-type="faq"]');
          if (faqBlock) {
            // Detect if the click is on a functional toggle (label[for] or the checkbox itself)
            let isToggle = false;
            try {
              const label = t.closest && t.closest('label[for]');
              const forId = label && label.getAttribute && label.getAttribute('for');
              if (forId) {
                // Safe: our ids are alphanumeric, so direct selector is fine
                const targetInput = faqBlock.querySelector('#' + forId);
                if (targetInput && targetInput.tagName === 'INPUT' && targetInput.type === 'checkbox') {
                  isToggle = true;
                }
              }
            } catch (_) {}
            if (!isToggle) {
              const cb = t.closest && t.closest('input[type="checkbox"]');
              if (cb && faqBlock.contains(cb)) isToggle = true;
            }

            // Only prevent default when not clicking the toggle control
            if (!isToggle) {
              e.preventDefault();
            }

            // Still select the whole FAQ block for outline/delete behavior
            selectGeneric(faqBlock, 'faq');
            handledSelection = true;
          } else if (t && t.tagName === 'IMG') {
            e.preventDefault();
            select(t);
            handledSelection = true;
          } else if (t && t.tagName === 'IFRAME' && /(youtube\\.com|youtu\\.be|youtube-nocookie\\.com)/.test(t.getAttribute('src') || '')) {
            e.preventDefault();
            const container = t.closest('.youtube-video-container') || t.parentElement || t;
            select(container);
            handledSelection = true;
          } else if (t && t.closest && t.closest('blockquote.tiktok-embed')) {
            e.preventDefault();
            select(t.closest('blockquote.tiktok-embed'));
            handledSelection = true;
          } else if (t && t.closest && t.closest('.b44-promoted-product')) {
            e.preventDefault();
            select(t.closest('.b44-promoted-product'));
            handledSelection = true;
          } else if (t && (t.tagName === 'AUDIO' || t.closest('.b44-audio-inline'))) { // NEW: Audio element click handling
            e.preventDefault();
            select(t.tagName === 'AUDIO' ? t : t.closest('.b44-audio-inline'));
            handledSelection = true;
          } else if (t && t.closest && t.closest('[data-b44-type]')) {
             // Generic handler: click inside any protected block selects the whole block
             e.preventDefault();
             const block = t.closest('[data-b44-type]');
             selectGeneric(block, block.dataset.b44Type || 'block');
             handledSelection = true;
          }

          if (!handledSelection) {
            clearSelections();
            window.parent.postMessage({ type: 'selection-cleared' }, '*');
          }
        });

        document.addEventListener('keydown', function(e){
          const isMac = navigator.platform.toUpperCase().indexOf('MAC') !== -1;
          const primary = isMac ? e.metaKey : e.ctrlKey;
          if (primary) {
            const k = (e.key || '').toLowerCase();
            const handled = ['s', 'p', '/', 'z'];
            if (handled.indexOf(k) !== -1) {
              e.preventDefault();
              const parts = [isMac ? 'cmd' : 'ctrl'];
              if (e.shiftKey) parts.push('shift');
              parts.push(k);
              const combo = parts.join('+');
              try { window.parent.postMessage({ type: 'b44-shortcut', combo: combo }, '*'); } catch(err){}
            }
          }

          if ((e.key === 'Delete' || e.key === 'Backspace')) {
            let elementToDelete = null;
            if (selected && selected.dataset && selected.dataset.b44Id) {
              elementToDelete = selected;
            } else {
              const ctaSelected = document.querySelector('.b44-cta-block[style*="outline: 2px solid #10b981"], [data-b44-type="cta"][style*="outline: 2px solid #10b981"]');
              if (ctaSelected && ctaSelected.dataset && ctaSelected.dataset.b44Id) {
                elementToDelete = ctaSelected;
              }
              const audioSelected = document.querySelector('.b44-audio-inline[style*="outline: 2px solid #3b82f6"]');
              if (audioSelected && audioSelected.dataset && audioSelected.dataset.b44Id) {
                elementToDelete = audioSelected;
              }
              // NEW: Check if an image is selected for deletion
              const imgSelected = document.querySelector('img[style*="outline: 2px solid #3b82f6"]');
              if (imgSelected && imgSelected.dataset && imgSelected.dataset.b44Id) {
                elementToDelete = imgSelected;
              }
            }

            // PROTECT CHILDREN OF ANY [data-b44-type] BLOCK:
            // If caret or selection is inside a protected block and the target is a child,
            // select the container instead (don't delete child on first press).
            try {
              const sel = document.getSelection();
              const anchorEl = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement) : null;
              const protectedAncestor = anchorEl && anchorEl.closest ? anchorEl.closest('[data-b44-type]') : null;

              if (protectedAncestor) {
                // If attempting to delete a child inside the protected block, select the block instead
                if (elementToDelete && protectedAncestor.contains(elementToDelete) && elementToDelete !== protectedAncestor) {
                  e.preventDefault();
                  selectGeneric(protectedAncestor, protectedAncestor.dataset.b44Type || 'block');
                  return;
                }
                // If nothing explicitly selected, but caret is inside, select the block
                if (!elementToDelete) {
                  e.preventDefault();
                  selectGeneric(protectedAncestor, protectedAncestor.dataset.b44Type || 'block');
                  return;
                }
              }
            } catch (_) {}
 
            if (elementToDelete) {
              e.preventDefault();
              deleteElementById(String(elementToDelete.dataset.b44Id));
              clearSelections();
            }
          }
        }, true);

        document.addEventListener('keyup', function(){ dumpHtml(); reportSelection(); });
        document.addEventListener('keydown', saveLastRange);
        document.addEventListener('input', function(){
          dumpHtml();
          saveLastRange();
          // push to history on user edits
          pushHistory('input');
        });
        document.addEventListener('mouseup', function(){ reportSelection(); saveLastRange(); });
        document.addEventListener('selectionchange', function(){ reportSelection(); });

        // GLOBAL fallback so you can drop "anywhere" between blocks, not only on specific elements
        document.addEventListener('dragover', function(ev){
          try {
            if (!__dragState.id) return;
            ev.preventDefault();
            var target = ev.target && (ev.target.closest && ev.target.closest(__dropSelector));
            if (!target) return;
            if (target.dataset && target.dataset.b44Id === __dragState.id) return;
            if (document.querySelector('[data-b44-id=\"' + __dragState.id + '\"]')?.contains(target)) return;

            var rect = target.getBoundingClientRect();
            var pos = ((ev.clientY - rect.top) < rect.height / 2) ? 'before' : 'after';
            clearDropClasses();
            target.classList.add(pos === 'before' ? 'b44-drop-before' : 'b44-drop-after');
            __dragState.overEl = target; 
            __dragState.pos = pos;
          } catch(_) {}
        }, true);

        document.addEventListener('drop', function(ev){
          try {
            if (!__dragState.id) return;
            ev.preventDefault();
            var src = document.querySelector('[data-b44-id=\"' + __dragState.id + '\"]');
            var target = __dragState.overEl || (ev.target && ev.target.closest && ev.target.closest(__dropSelector));
            if (!src || !target || src === target || src.contains(target)) {
              clearDropClasses();
              __dragState.id = null; __dragState.overEl = null;
              return;
            }
            if (__dragState.pos === 'before') {
              target.parentNode.insertBefore(src, target);
            } else {
              target.parentNode.insertBefore(src, target.nextSibling);
            }
            clearDropClasses();
            try { selectGeneric(src, src.dataset && src.dataset.b44Type ? src.dataset.b44Type : 'block'); } catch(_) {}
            pushHistory('drag-drop');
            dumpHtml(true);
            __dragState.id = null; __dragState.overEl = null;
          } catch(_) {}
        }, true);

        document.addEventListener('dragend', function(){
          try { clearDropClasses(); __dragState.id = null; __dragState.overEl = null; } catch(_) {}
        }, true);

        // Ensure we only bind one 'message' handler and process insert once
        if (!window.__b44_msg_bound) {
          window.__b44_msg_bound = true;

          window.addEventListener('message', function(e){
            const d = e && e.data ? e.data : {};

            // If this exact message id was seen, ignore
            if (d && d.__id && alreadyProcessed(d.__id)) return;

            // Updated: 'select-image' is deprecated in favor of 'media-selected' which includes mediaType
            // if (d.type === 'apply-image' || d.type === 'apply-media') applyChange(d);
            // Parent now sends 'update-media-style' or older messages will be handled by original applyChange
            if (d.type === 'request-html' || d.type === 'commit-html') { assignIds(); dumpHtml(true); }

            // Secondary de-dup guard: prevent multiple inserts within a short window
            function shouldProcessInsert() {
              const now = Date.now();
              if (window.__b44_last_insert_at && (now - window.__b44_last_insert_at) < 400) {
                return false;
              }
              window.__b44_last_insert_at = now;
              return true; // Corrected from 'false' to 'true'
            }

            if (d.type === 'insert-html') {
              if (shouldProcessInsert()) {
                insertHtmlAtSelection(d.html || '');
              }
              return;
            }

            // handle insertion after selection (no replacement)
            if (d.type === 'insert-after-selection') {
              if (shouldProcessInsert()) {
                insertHtmlAfterSelection(d.html || '');
              }
              return;
            }

            if (d.type === 'insert-link') {
              insertLink(d.url || '');
              return;
            }

            if (d.type === 'set-html') { setHtmlFromParent(d.html || ''); return; }
            if (d.type === 'focus-end') {
              try { window.focus(); document.body.focus(); } catch(err) {}
              const r = ensureRange();
              const sel = document.getSelection();
              sel.removeAllRanges();
              sel.addRange(r);
            }
            if (d.type === 'focus-preserve') {
              try { window.focus(); document.body.focus(); } catch(err) {}
            }
            if (d && d.type === 'delete-element' && d.id) {
               // Protect children: if the target is inside a protected block, select the container instead
               const target = document.querySelector('[data-b44-id="' + String(d.id) + '"]');
               if (target) {
                 const container = target.closest('[data-b44-type]');
                 if (container && target !== container) {
                   selectGeneric(container, container.dataset.b44Type || 'block');
                   return;
                 }
               }
               deleteElementById(String(d.id));
               return;
            }
            if (d && d.type === 'editor-command') {
              try {
                if (d.command === 'undo') {
                  // use custom history (more reliable than execCommand)
                  undoSnapshot();
                  return;
                } else if (d.command === 'redo') {
                  redoSnapshot();
                  return;
                } else if (d.command === 'wrapSelection') {
                  // NEW: Handle wrapping selected text in specified tag
                  wrapSelectionInTag(d.value);
                  return;
                } else if (d.command === 'formatBlock' && /H[1-6]/.test(d.value)) {
                  // This is the new, more robust heading logic.
                  // It leverages the browser's own HTML parser to correctly split paragraphs.
                  const sel = window.getSelection();
                  if (sel.rangeCount > 0) {
                      const range = sel.getRangeAt(0);
                      // Check if the selection is empty; if so, format the whole block.
                      if (range.collapsed) {
                           document.execCommand('formatBlock', false, d.value);
                      } else {
                          // If there's a selection, get its HTML content.
                          const fragment = range.cloneContents();
                          const div = document.createElement('div');
                          div.appendChild(fragment.cloneNode(true));
                          const selectedHtml = div.innerHTML;

                          // Use insertHTML which forces the browser to split the parent block element.
                          if (selectedHtml) {
                              // FIXED: Replaced nested template literal with string concatenation
                              document.execCommand('insertHTML', false, '<' + d.value + '>' + selectedHtml + '</' + d.value + '>');
                          } else {
                              // Fallback for simple text selections
                              document.execCommand('formatBlock', false, d.value);
                          }
                      }
                      dumpHtml(true);
                      pushHistory('exec-formatBlock');
                  }
                } else {
                  // FIXED: Pass the value to execCommand for formatBlock to work
                  document.execCommand && document.execCommand(d.command, false, d.value || null);
                  dumpHtml(true);
                  pushHistory('exec-' + d.command);
                }
                reportSelection();
                saveLastRange();
              } catch (_) {}
            }
          });
        }

        assignIds();
        // NEW: Just in case initial HTML had transient classes (e.g., user saved mid-drag), clean them
        removeTransientClassesLive(document);

        document.body.setAttribute('contenteditable', 'true');
        document.body.style.outline = 'none';
        try { window.parent.postMessage({ type: 'b44-ready' }, '*'); } catch(e) {}

        // initialize first snapshot once content is ready
        setTimeout(() => { pushHistory('init'); }, 0);

        /**
         * PATCH: Enhanced style updates for media resizing/aligning.
         * - Supports messages with type 'update-media-style'
         * - Understands msg.styles: { widthPercent, widthPx, width, align, float, margin, commit }
         * - Keeps old behavior for apply-image/apply-media
         */
        if (!window.__b44_style_patch_applied) {
          window.__b44_style_patch_applied = true;

          const __origApplyChange = applyChange;

          applyChange = function(msg) {
            try {
              // Normalize width and align from msg.styles if provided
              const s = msg && msg.styles ? msg.styles : {};
              let normalized = Object.assign({}, msg);

              // NEW: If element is an infographic, bypass width/align changes entirely
              const el = normalized && normalized.id ? document.querySelector('[data-b44-id="' + normalized.id + '"]') : null;
              if (el && el.matches('img[data-infographic="true"]')) {
                // If it's an infographic, skip all width/align modifications
                if ((s && s.commit) || normalized.commit) {
                  dumpHtml(true);
                } else {
                  saveLastRange();
                }
                return; // Exit early for infographics
              }


              if (s && typeof normalized.width === 'undefined') {
                if (typeof s.widthPercent === 'number') normalized.width = s.widthPercent;
                else if (typeof s.width === 'number') normalized.width = s.width; // assume percent
              }
              if (s && typeof normalized.align === 'undefined' && typeof s.align === 'string') {
                normalized.align = s.align;
              }

              // Call original to apply percent width + margin alignment
              __origApplyChange(normalized);

              // Then apply extended properties (px width, float, custom margin) directly
              // el is already defined from above.
              if (el) {
                // widthPx or width string (px/%)
                if (typeof s.widthPx === 'number') {
                  el.style.width = String(s.widthPx) + 'px';
                  el.style.maxWidth = '100%';
                  el.style.minWidth = '0';
                  el.style.display = 'block';
                } else if (typeof s.width === 'string' && s.width.trim()) {
                  el.style.width = s.width.trim();
                  el.style.maxWidth = '100%';
                  el.style.minWidth = '0';
                  el.style.display = 'block';
                }
                // float alignment
                if (s.float === 'left' || s.float === 'right') {
                  el.style.float = s.float;
                  el.style.display = 'block';
                  el.style.margin = '1rem ' + (s.float === 'left' ? '1rem 1rem 0' : '0 1rem 1rem 1rem'); // Correct margin for floats
                } else if (s.float === 'none') {
                  el.style.float = 'none';
                }
                // custom margin override
                if (typeof s.margin === 'string') {
                  el.style.margin = s.margin;
                }
                // For promoted products, prevent dynamic margins from here conflicting with CSS-defined zeroing
                if (el.matches && el.matches('.b44-promoted-product')) {
                  if (typeof s.margin !== 'string') { // Only override if parent explicitly set a margin
                    el.style.margin = '5px'; // Enforce 5px margin
                    el.style.padding = '5px'; // Enforce 5px padding
                  }
                }

                // If TikTok blockquote, mirror width/alignment to sibling iframe
                if (el.matches && el.matches('blockquote.tiktok-embed')) {
                  let sib = el.nextElementSibling;
                  while (sib && sib.tagName !== 'IFRAME') sib = sib.nextElementSibling;
                  if (sib && /tiktok\\.com/.test(sib.getAttribute('src') || '')) {
                    if (typeof s.widthPx === 'number') sib.style.width = String(s.widthPx) + 'px';
                    else if (typeof s.width === 'string' && s.width.trim()) sib.style.width = s.width.trim();
                    if (s.float === 'left' || s.float === 'right') {
                      sib.style.float = s.float;
                      sib.style.margin = '1rem ' + (s.float === 'left' ? '1rem 1rem 0' : '0 1rem 1rem 1rem');
                    } else if (typeof s.margin === 'string') {
                      sib.style.margin = s.margin;
                    }
                  }
                  if (typeof normalized.width === 'number' || typeof s.widthPercent === 'number' || typeof s.widthPx === 'number' || typeof s.width === 'string') {
                    el.dataset.b44WidthSet = '1';
                  }
                }
                // NEW: If audio wrapper, apply styles.
                // Note: direct audio elements are harder to style reliably for width/float
                // but a wrapper div can be styled.
                if (el.matches && el.matches('.b44-audio-inline')) {
                  // The applyTo(el) already handles block, width, margin.
                  // Float handling here specific for the wrapper.
                  if (s.float === 'left' || s.float === 'right') {
                    el.style.float = s.float;
                    el.style.display = 'block';
                    el.style.margin = '1rem ' + (s.float === 'left' ? '1rem 1rem 0' : '0 1rem 1rem 1rem');
                  } else if (s.float === 'none') {
                    el.style.float = 'none';
                  }
                  if (typeof s.margin === 'string') {
                    el.style.margin = s.margin;
                  }
                }
              }

              if ((s && s.commit) || normalized.commit) {
                dumpHtml(true);
              } else {
                // Keep not dumping on every drag tick to avoid flicker; parent can send commit.
                saveLastRange();
              }
            } catch (_) {
              try { __origApplyChange(msg); } catch(__) {}
            }
          };

          // Support new message type used by resizer/alignment controls
          window.addEventListener('message', function(e){
            const d = e && e.data ? e.data : {};
            if (d && d.type === 'update-media-style') {
              applyChange(d);
            }
          });
        }
      })();
    `;

    const docHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            html, body { margin:0; padding:0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, Arial, sans-serif;
              line-height: 1.7;
              padding: 20px 25%;
              background: white;
              color: #0f172a;
              overflow-x: hidden;
            }
            @media (max-width: 1200px) { body { padding-left: 10%; padding-right: 10%; } }
            @media (max-width: 768px) { body { padding-left: 16px; padding-right: 16px; } }
            h1,h2,h3,h4,h5 { color:#0f172a; margin: 1.2rem 0 0.6rem; }
            p { margin: 0.75rem 0; }
            a { color:#2563eb; }
            /* Default image styling - EXCLUDES infographics */
            img:not([data-infographic]) { 
              width: 65%; 
              border-radius: 8px; 
              height: auto; 
              display: block; 
              margin: 0 auto; 
            }
            /* Infographics are FULL WIDTH, no restrictions */
            img[data-infographic="true"] {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              display: block !important;
              margin: 20px 0 !important;
              border-radius: 0 !important;
            }
            audio { max-width: 100%; display: block; margin: 1rem 0;}
            .b44-audio-inline { max-width: 100%; display: block; margin: 1rem 0; }
            blockquote { padding: 12px 16px; border-left: 4px solid #94a3b8; background:#f8fafc; margin: 1rem 0; }
            blockquote.tiktok-embed { padding: 0 !important; border: none !important; background: transparent !important; }
            table { width:100%; border-collapse: collapse; margin: 1rem 0; }
            th, td { border:1px solid #e5e7eb; padding:8px; }
            code, pre { background: #0f172a0d; padding: 2px 4px; border-radius: 6px; }

            /* Product block - direct HTML, no iframes */
            .b44-promoted-product {
              max-width: 100%;
              display: block;
              cursor: pointer;
              position: relative;
              margin: 5px !important;
              padding: 5px !important;
            }

            .b44-promoted-product * {
              max-width: 100%;
            }

            .b44-promoted-product img {
              max-width: 100%;
              height: auto;
            }
            /* --- Drag & Drop visuals for feature blocks --- */
            .b44-dragging { opacity: 0.6; }
            .b44-drop-before { outline: 2px dashed #8b5cf6 !important; outline-offset: 2px; }
            .b44-drop-after { outline: 2px solid #10b981 !important; outline-offset: 2px; }
          </style>
        </head>
        <body>${initialHtmlRef.current || ''}</body>
        <script>${helperScript}<\/script>
      </html>
    `;

    doc.open();
    doc.write(docHtml);
    doc.close();

    setTimeout(() => {
      try { __injectBlackText(); } catch(_) {}
    }, 0);
  }, []); // Empty dependency array means this function is created only once

  // Map iframe -> parent events and translate coordinates from iframe space to page space
  useEffect(() => {
    const onMsg = (e) => {
      const d = e?.data || {};
      if (!d?.type) return;

      // Compute viewport coords from iframe-local coords
      const rect = iframeRef?.current?.getBoundingClientRect?.() || { left: 0, top: 0, width: 0, height: 0 };
      const toViewport = (x, y) => {
        // Ensure numbers and clamp very slightly within viewport
        const vx = (Number(x) || 0) + rect.left;
        const vy = (Number(y) || 0) + rect.top;
        return { x: Math.max(0, Math.min(window.innerWidth - 1, vx)), y: Math.max(0, Math.min(window.innerHeight - 1, vy)) };
      };

      if (d.type === "b44-dblclick" && typeof onDoubleClickSelected === "function") {
        const { x, y } = toViewport(d.x, d.y);
        onDoubleClickSelected({ x, y, text: d.text || "", isSelected: !!(d.text && d.text.length) });
        return;
      }
      if (d.type === "b44-contextmenu" && typeof onContextMenuSelected === "function") {
        const { x, y } = toViewport(d.x, d.y);
        onContextMenuSelected({ x, y, text: d.text || "", isSelected: !!(d.text && d.text.length) });
        return;
      }
      if (d.type === "b44-click-preview" && typeof onPreviewClick === "function") {
        onPreviewClick();
        return;
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onDoubleClickSelected, onContextMenuSelected, onPreviewClick]);


  useEffect(() => {
    const onMsg = (event) => {
      const d = event && event.data ? event.data : null;
      if (!d) return;
      if (d.type === 'b44-ready') {
        isReadyRef.current = true;
        try {
          const win = iframeRef.current && iframeRef.current.contentWindow ? iframeRef.current.contentWindow : null;
          if (win && html) {
            win.postMessage({ type: 'set-html', html: html }, '*');
          }
        } catch (e) {}
        // Also reinforce on ready message from iframe
        try { __injectBlackText(); } catch(_) {}
      }
      // NEW: Parent now listens for 'media-selected' which includes mediaType
      if (d.type === 'media-selected') {
        if (onImageSelect) onImageSelect(d);
      } else if (d.type === 'deselect-image' || d.type === 'selection-cleared' || d.type === 'block-selected') {
        if (onImageSelect) onImageSelect(null); // Clear selection in parent
      }

      if (d.type === 'html-dump') {
        skipNextSetRef.current = true;
        if (onHtmlChange) onHtmlChange(d.html || '');
      }
      if (d.type === 'selection-change') {
        if (onSelectionChange) onSelectionChange(d.text || '');
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    writeDoc();
  }, [writeDoc]); // run once on mount; writeDoc is stable

  useEffect(() => {
    const iframe = iframeRef.current;
    const win = iframe && iframe.contentWindow ? iframe.contentWindow : null;
    if (!win || !isReadyRef.current) return;

    if (skipNextSetRef.current) {
      skipNextSetRef.current = false;
      return;
    }

    try {
      const doc = (iframe.contentDocument || (win && win.document));
      const current = (doc && doc.body && doc.body.innerHTML) ? doc.body.innerHTML : '';
      if (current === (html || '')) return;
    } catch (e) {}

    win.postMessage({ type: 'set-html', html: html }, '*');
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="Live HTML Preview"
      className="w-full h-full rounded-lg border border-gray-200 bg-white"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
    />
  );
}
