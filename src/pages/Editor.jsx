
import React, { useState, useEffect, useRef, useCallback } from "react";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { Username } from "@/api/entities";
import { IntegrationCredential } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Edit3, Send, ArrowLeft, FileText, Globe, Loader2, Smartphone, Tablet as TabletIcon, Laptop, Monitor, AlignLeft, AlignCenter, AlignRight, Calendar as CalendarIcon, Trash2, Info, X, Wand2, Palette, Settings, FileText as FileTextIcon, Clipboard as ClipboardIcon } from "lucide-react"; // Added Palette, Settings, FileTextIcon, Clipboard
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { publishToAirtable } from "@/api/functions";
import useKeyboardShortcuts from "@/components/hooks/useKeyboardShortcuts";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { securePublish } from "@/api/functions";
import { getKeiJob } from "@/api/functions";
import { getSunoStatus } from "@/api/functions"; // Fix: Changed => to from
import { generateElevenlabsTts } from "@/api/functions";
import { getMidjourneyStatus } from "@/api/functions";
import { getVideoStatus } from "@/api/functions";
import { ImageLibraryItem } from "@/api/entities";
import { GeneratedVideo } from "@/api/entities";
import { checkAndConsumeTokens } from "@/api/functions";
import { callFeatureEndpoint } from "@/api/functions";
import { Slider } from "@/components/ui/slider"; // NEW: slider for drag-to-resize

import EditorToolbar from "../components/editor/EditorToolbar";
import AIRewriterModal from "../components/editor/AIRewriterModal";
import FontSelector from "../components/editor/FontSelector";
import YouTubeSelector from "../components/editor/YouTubeSelector";
import LinkSelector from "../components/editor/LinkSelector";
import ImageLibraryModal from "../components/editor/ImageLibraryModal";
import PromotedProductSelector from "../components/editor/PromotedProductSelector";
import ProductFromUrlModal from "../components/editor/ProductFromUrlModal";
import HTMLCleanupModal from "../components/editor/HTMLCleanupModal";
import AIContentDetectionModal from "../components/editor/AIContentDetectionModal";
import HumanizeTextModal from "../components/editor/HumanizeTextModal";
import CalloutGeneratorModal from "../components/editor/CalloutGeneratorModal";
import SitemapLinkerModal from "../components/editor/SitemapLinkerModal";
import TextActionsModal from "../components/editor/TextActionsModal";
import SEOSettingsModal from "../components/editor/SEOSettingsModal";
import CtaSelector from "../components/editor/CtaSelector";
import EmailCaptureSelector from "../components/editor/EmailCaptureSelector";
import TldrGeneratorModal from "../components/editor/TldrGeneratorModal";
import TikTokSelector from "../components/editor/TikTokSelector";
import VideoGeneratorModal from "../components/editor/VideoGeneratorModal";
import VideoLibraryModal from "../components/editor/VideoLibraryModal";
import LiveHtmlPreview from "@/components/html/LiveHtmlPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ContentScheduler from "../components/editor/ContentScheduler";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import TestimonialLibraryModal from "../components/editor/TestimonialLibraryModal";
import VariantLibraryModal from "../components/variants/VariantLibraryModal";
import PublishToCMSModal from "../components/editor/PublishToCMSModal";
import AskAIFloatingBar from "../components/editor/AskAIFloatingBar";
import AskAIQuickMenu from "../components/editor/AskAIQuickMenu";
import AudioFromTextModal from "../components/editor/AudioFromTextModal";
// FIX: wrong path "EditorAmazonAmazonImportModal" -> correct file name
import EditorAmazonImportModal from "../components/editor/EditorAmazonImportModal";
import LocalizeModal from "../components/editor/LocalizeModal";
import ShopifyPublishModal from "../components/editor/ShopifyPublishModal";
import BrandItModal from "../components/editor/BrandItModal";
import AffilifyModal from "../components/editor/AffilifyModal";
import RunWorkflowModal from "../components/editor/RunWorkflowModal";
import PasteContentModal from "../components/content/PasteContentModal";
import TextEditorModal from "../components/editor/TextEditorModal"; // FIX: correct path (was ../components/content/TextEditorModal)
import InlineFormatToolbar from "../components/editor/InlineFormatToolbar"; // NEW IMPORT
import FaqGeneratorModal from "../components/editor/FaqGeneratorModal";

import { buildFaqAccordionHtml } from "@/components/editor/FaqAccordionBlock";
import { generateArticleFaqs } from "@/api/functions";
import { findSourceAndCite } from "@/api/functions";
import { agentSDK } from "@/agents";

// Add a local error boundary so the page never renders blank on runtime errors
function EditorErrorBoundary({ children }) {
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    // noop – ensures React is available for hooks in this helper
  }, []); // Class-style boundary using hooks substitute
  // eslint-disable-next-line react/display-name
  const Boundary = React.useMemo(() => {
    return class extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(err) {
        return { error: err };
      }
      componentDidCatch(err, info) {
        console.error("Editor crashed:", err, info);
      }
      render() {
        if (this.state.error) {
          return (
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                <p className="text-white/70 mb-4">The editor hit an error. Try reloading this page.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700">
                  Reload
                </button>
              </div>
            </div>
          );
        }
        return this.props.children;
      }
    };
  }, []);
  return React.createElement(Boundary, null, children);
}

export default function Editor() {
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  // FIX: define content before using it in a ref
  const [content, setContent] = useState("");
  const contentRef = useRef(""); // safe initial value

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false); // NEW STATE
  const [currentPost, setCurrentPost] = useState(null);
  const [currentWebhook, setCurrentWebhook] = useState(null);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const navigate = useNavigate();
  const location = useLocation();
  const [previewDevice, setPreviewDevice] = useState("laptop"); // 'mobile' | 'tablet' | 'laptop'
  const [priority, setPriority] = useState('medium');

  // State for the central actions modal
  const [isActionsModalOpen, setIsActionsModal] = useState(false);
  const [textForAction, setTextForAction] = useState("");
  const [isTextSelected, setIsTextSelected] = useState(false);

  // HTML Mode and live preview states - HTML mode is now always on
  const [htmlMode, setHtmlMode] = useState(true); // Always true for this editor
  const [selectedMedia, setSelectedMedia] = useState(null); // {id,width,align, type?} - Now supports images and YouTube embeds

  // MODAL STATES
  const [showAIModal, setShowAIModal] = useState(false);
  const [showYouTubeSelector, setShowYouTubeSelector] = useState(false);
  // FIX: align TikTok state name with usages below (modal and toolbar)
  const [showTikTokSelector, setShowTikTokSelector] = useState(false);
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageLibraryGenerateOnly, setImageLibraryGenerateOnly] = useState(false);
  const [imageLibraryDefaultProvider, setImageLibraryDefaultProvider] = useState(undefined); // FIX: Changed to useState(undefined)
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showProductFromUrl, setShowProductFromUrl] = useState(false);
  const [showHTMLCleanup, setShowHTMLCleanup] = useState(false);
  const [showAIDetection, setShowAIDetection] = useState(false);
  const [showHumanizeModal, setShowHumanizeModal] = useState(false);
  const [showCalloutGenerator, setShowCalloutGenerator] = useState(false);
  const [showFactGenerator, setShowFactGenerator] = useState(false);
  const [showTldrGenerator, setShowTldrGenerator] = useState(false);
  const [showSitemapLinker, setShowSitemapLinker] = useState(false);
  const [isSEOSettingsOpen, setIsSEOSettingsOpen] = useState(false);
  // FIX: proper useState tuple for calloutType
  const [calloutType, setCalloutType] = useState("callout");
  const [showCtaSelector, setShowCtaSelector] = useState(false);
  const [showEmailCaptureSelector, setShowEmailCaptureSelector] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTestimonialLibrary, setShowTestimonialLibrary] = useState(false);
  const [showVariantLibrary, setShowVariantLibrary] = useState(false);
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);
  const [showCMSModal, setShowCMSModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showAmazonImport, setShowAmazonImport] = useState(false);
  const [showLocalize, setShowLocalize] = useState(false);
  const [showBrandIt, setShowBrandIt] = useState(false);
  const [showAffilify, setShowAffilify] = useState(false); // NEW
  // Add FAQ modal state
  const [showFaqGenerator, setShowFaqGenerator] = useState(false);

  // NEW: Double-click notice state
  // const [showDblClickNotice, setShowDblClickNotice] = useState(false); // (kept but unused)

  // Add a state flag for the workflow runner modal
  const [showWorkflowRunner, setShowWorkflowRunner] = React.useState(false);

  // NEW: prevent echo push to iframe after local edits (stops scroll jump)
  const skipNextPreviewPushRef = useRef(false);

  // Add a debounce timer for committing HTML after live style changes
  const resizeCommitTimerRef = React.useRef(null);

  // NEW: Background job processing state
  const [backgroundJobs, setBackgroundJobs] = useState([]);
  const [showGoogleCreds, setShowGoogleCreds] = useState(false); // NEW

  const [defaultPublish, setDefaultPublish] = useState({ method: null, credentialId: null, label: null });
  // NEW: track which username the default applies to (per-username, not per-user)
  const [defaultPublishUsername, setDefaultPublishUsername] = useState(null);
  // NEW: current user + per-user dropdown flag
  const [currentUser, setCurrentUser] = useState(null);
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
  // NEW: available credentials for the current username (for dropdown)
  const [publishCredentials, setPublishCredentials] = useState([]);
  const [pendingAudioJobs, setPendingAudioJobs] = useState([]); // NEW: background audio queue

  // Add modal state and preset
  const [showShopifyModal, setShowShopifyModal] = React.useState(false);
  const shopifyPreset = React.useRef({ credentialId: null });

  const insertLockRef = useRef(false);
  const insertSeqRef = useRef(1); // NEW: unique sequence for insert messages
  const savingGuardRef = React.useRef(false); // NEW: prevent concurrent saves

  const [askAIBar, setAskAIBar] = useState({ visible: false, x: null, y: null });
  const [quickMenu, setQuickMenu] = useState({ visible: false, x: null, y: null }); // NEW
  const [inlineToolbar, setInlineToolbar] = useState({ visible: false, x: null, y: null });

  // NEW: stable session key to dedupe record creation across this editing session
  const sessionKeyRef = React.useRef(null);

  // NEW: Ref for Quill/Editor (even if LiveHtmlPreview is used, outline specifies this)
  const quillRef = useRef(null);

  // NEW: Ref for tracking schema generation to prevent re-triggering
  const generatingSchemaRef = useRef(false);

  // NEW: Paste modal state
  const [showPasteModal, setShowPasteModal] = React.useState(false);
  const [autoReadPaste, setAutoReadPaste] = React.useState(false);

  // NEW: hard guards to prevent duplicate audio insertions in any race
  const insertedAudioUrlsRef = React.useRef(new Set());
  const insertedAudioJobKeysRef = React.useRef(new Set());

  // NEW: state for the new text editor modal
  const [showTextEditor, setShowTextEditor] = useState(false);

  // Helper to create a random session key
  const makeRandomSessionKey = () => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  // Initialize or update the session key based on context (existing post, webhook, or new)
  const initSessionKey = useCallback((opts = {}) => {
    const { postId = null, processingId = null } = opts;
    let key = null;

    if (postId) key = `post-${postId}`;
    else if (processingId) key = `wh-${processingId}`;
    else key = makeRandomSessionKey();

    sessionKeyRef.current = key;
    try { localStorage.setItem('b44_editor_session_key', key); } catch (_) { }
  }, []);

  // Ensure a session key exists at mount, will be refined by loaders later
  useEffect(() => {
    const existing = (() => {
      try { return localStorage.getItem('b44_editor_session_key'); } catch (_) { return null; }
    })();
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    const webhookId = urlParams.get('webhook');
    // If URL already binds us to an identity, prefer that; else reuse or create
    if (postId) initSessionKey({ postId });
    else if (webhookId) initSessionKey({ processingId: webhookId });
    else if (existing) sessionKeyRef.current = existing;
    else initSessionKey();
  }, [initSessionKey]);

  // NEW: Keep the ref updated with the latest content
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Replace the existing handleDeleteSelected with a memoized version that doesn't rely on sendToPreview (to avoid TDZ)
  const handleDeleteSelected = useCallback(() => {
    if (!selectedMedia) return;

    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;

    if (win) {
      // Delete the selected element inside the iframe
      win.postMessage({ type: 'delete-element', id: selectedMedia.id }, '*');
      // Ask the iframe to send back the updated HTML so parent state is synced
      // FIX: targetOrigin must be a string; pass '*' and keep 50 as the delay argument
      setTimeout(() => win.postMessage({ type: 'request-html' }, '*'), 50);
    }

    setSelectedMedia(null);
  }, [selectedMedia, setSelectedMedia]);

  // Update the keyboard Delete/Backspace effect to include handleDeleteSelected in deps
  React.useEffect(() => {
    const onKeyDown = (e) => {
      // If a media block is selected, allow quick delete
      if ((e.key === "Delete" || e.key === "Backspace") && selectedMedia) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [selectedMedia, handleDeleteSelected]); // Added handleDeleteSelected to deps

  // NEW: sanitize AI outputs that may include markdown code fences (```html ... ```)
  const sanitizeLocalizedHtml = (s) => {
    if (s == null) return "";
    let out = String(s).trim();

    // If it's a fenced block, unwrap it
    const fenced = out.match(/^\s*```(?:html|HTML)?\s*([\s\S]*?)\s*```[\s]*$/);
    if (fenced) out = fenced[1];

    // Remove any stray opening/closing fences that slipped through
    out = out.replace(/^\s*```(?:html|HTML)?\s*/i, "");
    out = out.replace(/\s*```$/i, "");

    // As a fallback, strip any remaining triple backtick markers
    out = out.replace(/```(?:html|HTML)?/gi, "");

    return out.trim();
  };

  // Builder for audio HTML snippet (compact inline; no extra padding/line-height)
  const buildAudioHtml = (url, id) => {
    const elId = id || `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return `
<span class="b44-audio-inline"
      data-b44-id="${elId}"
      data-b44-type="audio"
      data-src="${url}"
      style="display:inline-flex;align-items:center;gap:4px;margin:0 4px;line-height:1;vertical-align:middle;">
  <audio
    src="${url}"
    controls
    preload="none"
    style="height:22px;margin:0;display:inline-block;vertical-align:middle;background:transparent;outline:none;box-shadow:none;"
    controlslist="nodownload noplaybackrate">
  </audio>
</span>`.trim();
  };

  // Bridge to preview iframe
  const sendToPreview = useCallback((msg) => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (win) win.postMessage(msg, "*");
  }, []);

  // NEW: focus preview without moving the caret
  const focusPreviewPreserve = useCallback(() => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (iframe) {
      try { iframe.focus(); } catch (e) { console.error("Error focusing iframe:", e); }
    }
    if (win) {
      try { win.focus(); } catch (e) { console.error("Error focusing iframe content window:", e); }
      win.postMessage({ type: "focus-preserve" }, "*");
    }
  }, []);

  // Inject selection/diagnostics into the preview iframe (runs once per load)
  const injectSelectionFix = React.useCallback(() => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      console.warn("[B44] selection-fix: iframe or document not ready");
      return;
    }
    if (win.__b44SelectionFixInstalled) {
      console.log("[B44] selection-fix: already installed");
      return;
    }

    const script = doc.createElement("script");
    script.type = "text/javascript";
    script.text = `
      (() => {
        try {
          if (window.__b44SelectionFixInstalled) return;
          window.__b44SelectionFixInstalled = true;
          console.log("[B44] selection-fix: installing");

          const doc = document;
          const state = { selectedEl: null, savedRange: null };

          // NEW: ensure 1em padding for inserted items (exclude audio)
          (function ensurePaddingStyle() {
            if (doc.getElementById('b44-media-padding')) return;
            const style = doc.createElement('style');
            style.id = 'b44-media-padding';
            style.textContent = 'img[data-b44-type="image"],img[data-b44-id],.youtube-video-container[data-b44-id],blockquote.tiktok-embed,.b44-promoted-product,.b44-callout,.b44-tldr,.b44-fact-card{padding-top:1em;padding-bottom:1em;box-sizing:border-box;display:block;} .b44-audio-inline{padding-top:0;padding-bottom:0;}';
            doc.head.appendChild(style);
          })();

          // NEW: universal FAQ accordion styles so templates expand in-editor
          (function ensureFaqStyles() {
            if (doc.getElementById('b44-faq-styles')) return;
            const style = doc.createElement('style');
            style.id = 'b44-faq-styles';
            style.textContent = 
              /* Hide native checkboxes when authors omit display:none */
              '.b44-faq-block input[type="checkbox"]{position:absolute;left:-9999px;opacity:0;}' +
              /* Expand common content containers when checked (works with custom templates) */
              '.b44-faq-block input[type="checkbox"]:checked ~ [id^="faq-content-"],' +
              '.b44-faq-block input[type="checkbox"]:checked ~ .faq-content,' +
              '.b44-faq-block input[type="checkbox"]:checked ~ div.faq-content{' +
                'max-height:1200px !important;padding-top:8px;padding-bottom:10px;' +
              '}' +
              /* Fallback: if authors didn’t add a faq-content class, still expand the immediate div sibling */
              '.b44-faq-block input[type="checkbox"]:checked ~ div{' +
                'max-height:1200px;padding-top:8px;padding-bottom:10px;' +
              '}';
            doc.head.appendChild(style);

            // Accessibility: keep aria-expanded/hidden in sync
            doc.addEventListener('change', (e) => {
              const el = e.target;
              if (!el || el.tagName !== 'INPUT' || el.type !== 'checkbox') return;
              if (!el.closest('.b44-faq-block')) return;
              try {
                const lbl = el.id ? doc.querySelector('label[for="' + el.id + '"]') : null;
                if (lbl) lbl.setAttribute('aria-expanded', el.checked ? 'true' : 'false');
                const regionId = el.getAttribute('aria-controls');
                if (regionId) {
                  const region = doc.getElementById(regionId);
                  if (region) region.setAttribute('aria-hidden', el.checked ? 'false' : 'true');
                }
              } catch(_) {}
            }, true);
          })();

          const saveSelection = () => {
            try {
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                state.savedRange = sel.getRangeAt(0).cloneRange();
              }
            } catch (_) {}
          };

          const restoreSelection = () => {
            try {
              const sel = window.getSelection();
              sel.removeAllRanges();
              if (state.savedRange) {
                sel.addRange(state.savedRange);
              }
            } catch (_) {}
          };

          const focusEditable = () => {
            try {
              if (!doc.body.getAttribute('contenteditable')) {
                doc.body.setAttribute('contenteditable', 'true');
              }
              doc.body.focus();
            } catch (_) {}
          };

          const wrapSelectionWithSpan = (styleProp, color) => {
            try {
              const sel = window.getSelection();
              if (!sel || sel.rangeCount === 0) return false;
              const range = sel.getRangeAt(0);
              const span = doc.createElement('span');
              if (styleProp === 'color') span.style.color = color;
              else span.style.backgroundColor = color;

              // robust surround
              try {
                range.surroundContents(span);
              } catch (e) {
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
                // reset selection to new span
                sel.removeAllRanges();
                const newR = doc.createRange();
                newR.selectNodeContents(span);
                sel.addRange(newR);
              }
              return true;
            } catch (_) { return false; }
          };

          // NEW: robust link wrapper
          const wrapSelectionWithLink = (href, label) => {
            focusEditable();
            restoreSelection();

            const safeHref = String(href || "").trim();
            if (!safeHref) return false;

            const sel = window.getSelection();
            if (!sel) return false;

            // If selection collapsed, insert link with label or href
            if (sel.rangeCount === 0 || sel.isCollapsed) {
              const a = doc.createElement('a');
              a.href = safeHref;
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
              a.textContent = label || safeHref;
              const r = doc.getSelection()?.getRangeAt(0);
              if (r) {
                r.insertNode(a);
                // place caret after the link
                r.setStartAfter(a);
                r.setEndAfter(a);
                sel.removeAllRanges();
                sel.addRange(r);
              } else {
                // Fallback for no range: append to body
                doc.body.appendChild(a);
              }
              return true;
            }

            // There is a selection: wrap it
            try {
              const range = sel.getRangeAt(0);
              // If user already selected inside an existing link, just update its href
              const parentLink = range.commonAncestorContainer.parentElement?.closest('a');
              if (parentLink) {
                parentLink.setAttribute('href', safeHref);
                parentLink.setAttribute('target', '_blank');
                parentLink.setAttribute('rel', 'noopener noreferrer');
                return true;
              }

              const a = doc.createElement('a');
              a.href = safeHref;
              a.target = '_blank';
              a.rel = 'noopener noreferrer';

              try {
                range.surroundContents(a);
              } catch (e) {
                // Fallback: extract, wrap, insert
                const frag = range.extractContents();
                a.appendChild(frag);
                range.insertNode(a);
                // Reset selection around the new link
                sel.removeAllRanges();
                const nr = doc.createRange();
                nr.selectNode(a);
                sel.addRange(nr);
              }
              return true;
            } catch (_) { return false; }
          };

          const applyColorCommand = (cmd, value) => {
            focusEditable();
            restoreSelection();

            // Try native commands first
            try { doc.execCommand('styleWithCSS', false, true); } catch (_) {}

            let ok = false;
            try {
              const c = cmd === 'hiliteColor' ? 'hiliteColor' : (cmd === 'backColor' ? 'backColor' : 'foreColor');
              ok = doc.execCommand(c, false, value || (cmd === 'foreColor' ? '#000000' : '#ffff00'));
            } catch (_) {}

            if (!ok) {
              // Fallback to span wrapping
              if (cmd === 'foreColor') wrapSelectionWithSpan('color', value || '#000000');
              else wrapSelectionWithSpan('backgroundColor', value || '#ffff00');
            }

            // Notify parent about html changes
            window.parent.postMessage({ type: "html-updated", html: doc.body.innerHTML }, "*");
          };

          const highlight = (el) => {
            try {
              if (state.selectedEl && state.selectedEl !== el) {
                state.selectedEl.style.removeProperty("outline");
                state.selectedEl.style.removeProperty("outline-offset");
              }
              state.selectedEl = el;
              el.style.setProperty("outline", "2px solid #0ea5e9", "important"); // cyan outline
              el.style.setProperty("outline-offset", "2px", "important");
            } catch (e) {
              console.warn("[B44] selection-fix: outline error", e);
            }
          };

          const ensureId = (el) => {
            if (!el.dataset) el.dataset = {};
            if (!el.dataset.b44Id) {
              el.dataset.b44Id = 'el-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
            }
            return el.dataset.b44Id;
          };

          const getMediaType = (el) => {
            if (!el) return "unknown";
            if (el.matches(".b44-audio-inline, .b44-audio-inline *") || el.tagName === "AUDIO") return "audio";
            if (el.tagName === "IMG") return "image";
            if (el.tagName === "IFRAME" || el.classList.contains("youtube-video-container") || el.matches("blockquote.tiktok-embed, blockquote.tiktok-embed *")) return "video";
            // NEW: treat TL;DR as its own selectable type
            if (el.matches(".b44-tldr, .b44-tldr *")) return "tldr";
            // NEW: treat FAQ blocks as their own selectable type
            if (el.matches(".b44-faq-block, .b44-faq-block *")) return "faq";
            return el.dataset?.b44Type || "unknown";
          };

          // REPLACED: computeAlign with inline-style-first and equal-margins detection
          const computeAlign = (el) => {
            try {
              // 1) Inline style has the truth we set from the host
              const inMl = (el.style && el.style.marginLeft) || "";
              const inMr = (el.style && el.style.marginRight) || "";
              const inFloat = (el.style && el.style.float) || "";

              // If we explicitly set margins to auto via inline style
              if (inFloat === "right") return "right";
              if (inFloat === "left") return "left";
              if ((inMl === "auto" && inMr === "auto")) return "center";
              if (inMl === "auto" && (inMr === "0" || inMr === "0px" || inMr === "")) return "right";
              if ((inMl === "0" || inMl === "0px" || inMl === "") && inMr === "auto") return "left";

              // 2) Fallback to computed style
              const cs = window.getComputedStyle(el);
              const fl = cs.float || "none";
              if (fl === "right") return "right";
              if (fl === "left") return "left";

              const ml = cs.marginLeft || "0px";
              const mr = cs.marginRight || "0px";
              const isAuto = (v) => v === "auto";
              const toNum = (v) => {
                const n = parseFloat(v);
                return Number.isFinite(n) ? n : 0;
              };

              // If both are auto per computed (some engines keep 'auto')
              if (isAuto(ml) && isAuto(mr)) return "center";
              if (isAuto(ml) && !isAuto(mr)) return "right";
              if (!isAuto(ml) && isAuto(mr)) return "left";

              // If margins resolve to equal pixel values and element isn't floated, it's centered
              const nMl = toNum(ml);
              const nMr = toNum(mr);
              if (Math.abs(nMl - nMr) <= 1) return "center";

              // Otherwise prefer the side with auto-like spacing
              return nMr > nMl ? "left" : "right";
            } catch (_) {
              return "left";
            }
          };

          const findSelectable = (node) => {
            if (!node) return null;
            // Prefer explicit markers
            let el = node.closest?.("[data-b44-id]");
            if (el) return el;

            // Audio wrapper or the audio itself
            if (node.matches?.(".b44-audio-inline, .b44-audio-inline *") || node.tagName === "AUDIO") {
              return node.closest?.(".b44-audio-inline") || node;
            }
            // YouTube container or iframe
            if (node.tagName === "IFRAME") {
              return node.closest(".youtube-video-container") || node;
            }
            // TikTok oEmbed blocks
            const tiktok = node.closest?.("blockquote.tiktok-embed");
            if (tiktok) return tiktok;

            // NEW: TL;DR block
            const tldr = node.closest?.(".b44-tldr");
            if (tldr) return tldr;

            // NEW: FAQ block
            const faqBlock = node.closest?.(".b44-faq-block");
            if (faqBlock) return faqBlock;

            // Plain images
            if (node.tagName === "IMG") return node;

            return null;
          };

          // Add small selection handles to video and audio embeds so they can be selected/deleted easily
          const installOverlayHandles = () => {
            const addHandle = (container) => {
              try {
                // Avoid duplicates
                if (container.querySelector('.b44-select-handle')) return;

                // Ensure container is positioned
                const currentPos = (container.style && container.style.position) || '';
                if (!currentPos || currentPos === 'static') {
                  container.style.position = 'relative';
                }

                const handle = doc.createElement('div');
                handle.className = 'b44-select-handle';
                handle.style.cssText = [
                  'position:absolute',
                  'top:8px',
                  'left:8px',
                  'width:24px',
                  'height:24px',
                  'border-radius:6px',
                  'background:rgba(14,165,233,0.85)',   /* cyan-500 */
                  'box-shadow:0 1px 2px rgba(0,0,0,0.2)',
                  'cursor:pointer',
                  'z-index:5'
                ].join(';');
                handle.title = 'Select block';

                handle.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const id = ensureId(container);
                  highlight(container);

                  // Compute width and alignment hints if present
                  let widthPct = 100;
                  const styleWidth = container.style?.width || '';
                  const m = String(styleWidth).match(/(\\d+)%/);
                  if (m) { widthPct = parseInt(m[1], 10); }
                  const align = computeAlign(container);

                  const mediaType = getMediaType(container);
                  window.parent.postMessage({
                    type: 'media-selected',
                    id,
                    mediaType,
                    width: widthPct,
                    align
                  }, '*');
                }); // <-- Fixed missing closing parenthesis for addEventListener

                container.appendChild(handle);
              } catch (e) {
                console.warn('[B44] selection-fix: addHandle error', e);
              }
            };

            // Initial pass: YouTube, TikTok, Audio wrappers, and TL;DR blocks
            doc.querySelectorAll('.youtube-video-container').forEach(addHandle);
            doc.querySelectorAll('blockquote.tiktok-embed').forEach(addHandle);
            doc.querySelectorAll('.b44-audio-inline').forEach(addHandle);
            // NEW: TL;DR handle
            doc.querySelectorAll('.b44-tldr').forEach(addHandle);
            // NEW: FAQ handle
            doc.querySelectorAll('.b44-faq-block').forEach(addHandle);

            // Observe for dynamically added embeds/blocks
            const mo = new MutationObserver((mutations) => {
              for (const m of mutations) {
                for (const node of m.addedNodes || []) {
                  if (node.nodeType !== 1) continue;
                  try {
                    if (node.matches && (node.matches('.youtube-video-container') || node.matches('blockquote.tiktok-embed') || node.matches('.b44-audio-inline') || node.matches('.b44-tldr') || node.matches('.b44-faq-block'))) {
                      addHandle(node);
                    }
                    if (node.querySelector) {
                      node.querySelectorAll('.youtube-video-container, blockquote.tiktok-embed, .b44-audio-inline, .b44-tldr, .b44-faq-block').forEach(addHandle);
                    }
                  } catch (_) {}
                }
              }
            });
            mo.observe(doc.body, { childList: true, subtree: true });
          };

          // Delegated click handler (capture phase to be reliable)
          const onClick = (e) => {
            const el = findSelectable(e.target);
            if (!el) return;
            const id = ensureId(el);
            highlight(el);

            // Compute width (percentage if set) and align hints
            let widthPct = 100;
            const styleWidth = el.style?.width || "";
            const m = String(styleWidth).match(/(\\d+)%/);
            if (m) { widthPct = parseInt(m[1], 10); }

            // FIX: determine alignment from computed margins/float, not el.style.margin
            const align = computeAlign(el);

            const mediaType = getMediaType(el);
            window.parent.postMessage({
              type: "media-selected",
              id,
              mediaType,
              width: widthPct,
              align
            }, "*");
            console.log("[B44] selection-fix: media-selected", { id, mediaType, width: widthPct, align });
          };
          doc.addEventListener("click", onClick, true);

          // Message listeners from parent (delete/update/request-html)
          const onMsg = (ev) => {
            const d = ev?.data || {};
            if (!d || !d.type) return;

            // NEW: color + selection commands from toolbar
            if (d.type === "editor-command") {
              const cmd = d.command;
              if (cmd === "saveSelection") {
                saveSelection();
                return;
              }
              if (cmd === "restoreSelection") {
                restoreSelection();
                return;
              }
              if (cmd === "styleWithCSS") {
                try { doc.execCommand('styleWithCSS', false, !!d.value); } catch (_) {}
                return;
              }
              if (cmd === "foreColor" || cmd === "hiliteColor" || cmd === "backColor") {
                applyColorCommand(cmd, d.value);
                return;
              }
              // NEW: link wrapper
              if (cmd === "wrap-link") {
                const ok = wrapSelectionWithLink(d.href || "", d.label || "");
                if (ok) window.parent.postMessage({ type: "html-updated", html: doc.body.innerHTML }, "*");
                return;
              }
              // let other editor-command types fall through to existing preview handlers
            }

            if (d.type === "delete-element" && d.id) {
              const el = doc.querySelector('[data-b44-id="' + d.id + '"]');
              console.log("[B44] selection-fix: delete-element", d.id, !!el);
              if (el) {
                // If TikTok blockquote, also attempt to remove its following embed script for cleanliness
                if (el.matches("blockquote.tiktok-embed")) {
                  const next = el.nextElementSibling;
                  if (next && next.tagName === "SCRIPT" && (next.src || "").includes("tiktok.com")) {
                    next.remove();
                  }
                }
                el.remove();
                state.selectedEl = null;
                window.parent.postMessage({ type: "html-updated", html: doc.body.innerHTML }, "*");
              }
              return;
            }

            if (d.type === "update-media-style" && d.id && d.styles) {
              const el = doc.querySelector('[data-b44-id="' + d.id + '"]');
              if (el) {
                Object.entries(d.styles).forEach(([k, v]) => {
                  try { el.style.setProperty(k, v, "important"); } catch (_) {}
                });
                window.parent.postMessage({ type: "html-updated", html: doc.body.innerHTML }, "*");
              }
              return;
            }

            if (d.type === "request-html") {
              window.parent.postMessage({ type: "html-updated", html: doc.body.innerHTML }, "*");
              return;
            }
          };
          window.addEventListener("message", onMsg, false);

          // Install selection handles
          installOverlayHandles();

          console.log("[B44] selection-fix: ready");
        } catch (err) {
          console.error("[B44] selection-fix: fatal error", err);
        }
      })();
    `;
    doc.head.appendChild(script);
  }, []);

  // Ensure we inject the selection-fix right after the iframe reports ready
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type === "b44-ready") {
        console.log("[B44] host: iframe reported b44-ready – installing selection-fix");
        injectSelectionFix();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [injectSelectionFix]);

  // Also attempt injection once after load to be safe (e.g., if 'b44-ready' was missed)
  React.useEffect(() => {
    const t = setTimeout(() => injectSelectionFix(), 400);
    return () => clearTimeout(t);
  }, [injectSelectionFix]);

  // Update insertContent to support insertion mode
  const insertContent = useCallback((htmlContent, mode = null) => {
    // prevent multi-fire for one user action
    if (insertLockRef.current) return;
    insertLockRef.current = true;
    setTimeout(() => { insertLockRef.current = false; }, 300);

    // Do NOT move caret to end; preserve user's caret
    focusPreviewPreserve();

    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (win) {
      const msgId = `ins-${Date.now()}-${insertSeqRef.current++}`;
      win.postMessage(
        {
          type: mode === "after-selection" ? "insert-after-selection" : "insert-html",
          html: String(htmlContent),
          __id: msgId
        },
        "*"
      );
    }
  }, [focusPreviewPreserve]);

  // HOISTED helper to normalize insert payload
  const insertContentAtPoint = useCallback(function insertContentAtPoint(payload) {
    if (typeof payload === "string") {
      insertContent(payload, null);
    } else if (payload && typeof payload === "object" && payload.html) {
      insertContent(String(payload.html), payload.mode || null);
    }
  }, [insertContent]);

  // NEW: helper function to validate if a URL is likely an audio file
  const isLikelyAudioUrl = (u) => typeof u === "string" && /(\.mp3|\.wav|\.m4a|\.aac|\.ogg)(\?|$)/i.test(u);

  // NEW: verify remote audio URL by HEAD/range probe before inserting
  const checkAudioUrl = async (u) => {
    if (!u) return false;
    try {
      const head = await fetch(u, { method: "HEAD" });
      if (head.ok) {
        const ct = head.headers.get("content-type") || "";
        const len = Number(head.headers.get("content-length") || "0");
        if ((ct.startsWith("audio/") || ct === "application/octet-stream") && len > 0) return true;
      }
      // Fallback: request a single byte to ensure resource exists and is audio-like
      const probe = await fetch(u, { headers: { Range: "bytes=0-0" } });
      if (probe.ok) {
        const ct = probe.headers.get("content-type") || "";
        if (ct.startsWith("audio/") || ct === "application/octet-stream") return true;
      }
    } catch (_) { }
    return false;
  };

  // Queue job from modal on close — add dedupe to prevent multiple identical jobs
  const handleQueueAudioJob = (job) => {
    if (!job) return;

    // Normalize + dedupe by provider+type+voice+format+first40chars(text)
    const key = JSON.stringify({
      p: job.provider, t: job.type, v: job.voice || "", f: job.format || "",
      x: (job.text || "").slice(0, 40)
    });

    setPendingAudioJobs((prev) => {
      const exists = prev.some((j) =>
        JSON.stringify({ p: j.provider, t: j.type, v: j.voice || "", f: j.format || "", x: (j.text || "").slice(0, 40) }) === key
      );
      // NEW: Also check against the `insertedAudioJobKeysRef` for already inserted items from previous sessions/reloads
      if (exists || insertedAudioJobKeysRef.current.has(key)) return prev; // skip duplicate queue

      return [...prev, { ...job, queuedAt: Date.now() }];
    });

    toast.message("Generating audio in background… it will be inserted automatically when ready.");
  };

  // NEW: Handler to queue a background job from any modal
  const handleQueueJob = (job) => {
    // Robustness: Accept 'jobId' as a fallback for 'taskId' to prevent queueing errors.
    if (job && job.jobId && !job.taskId) {
      job.taskId = job.jobId;
      delete job.jobId;
    }
    // Robustness: Accept 'resultUrl' as a fallback for 'url'.
    if (job && job.resultUrl && !job.url) {
      job.url = job.resultUrl;
      delete job.resultUrl;
    }

    if (!job || !job.provider || !job.taskId && !job.url) {
      console.error("Invalid job queued:", JSON.stringify(job, null, 2));
      toast.error("Failed to start background job: Invalid details.");
      return;
    }
    const newJob = {
      ...job,
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
      attempts: 0,
      inserted: false,
      insertMode: isTextSelected ? 'after-selection' : 'at-caret'
    };
    setBackgroundJobs((prev) => [...prev, newJob]);
    // Only show toast for jobs that will actually poll
    if (job.taskId) {
      toast.message(`${job.type === 'image' ? 'Image' : 'Video'} generation started in the background.`);
    }
  };

  // FIXED: Handle Base64 audio data from backend
  const buildAudioUrlFromEleven = async (responseData) => {
    const data = responseData.data; // The actual data is in response.data from the SDK

    if (!data || !data.success || !data.audio_base64) {
      const errorMsg = data?.error || 'Invalid audio data received from server.';
      throw new Error(errorMsg);
    }

    // Decode Base64 and create a Blob
    const byteCharacters = atob(data.audio_base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: data.mime_type || 'audio/mpeg' });

    return URL.createObjectURL(blob);
  };

  // Background polling/insertion loop (Audio Jobs)
  useEffect(() => {
    if (!pendingAudioJobs.length) return;

    const interval = setInterval(async () => {
      const updates = await Promise.all(pendingAudioJobs.map(async (j) => {
        try {
          const attempts = (j.attempts || 0) + 1;

          // ElevenLabs: synchronous — build playable URL from response
          if (j.provider === "elevenlabs" && !j.done) {
            const response = await generateElevenlabsTts({ text: j.text, format: j.format || "mp3_44100_128", voice: j.voice });
            const url = await buildAudioUrlFromEleven(response); // Pass the whole response
            return { ...j, attempts, url, done: true, success: true };
          }

          // KEI: strictly poll until a verifiable audio url exists
          if (j.provider === "kei" && j.jobId && !j.done) {
            const { data } = await getKeiJob({ job_id: j.jobId });
            const u = data?.url || data?.data?.url || data?.audio_url || data?.data?.audio_url || data?.output?.url || null;
            const st = (data?.status || "").toString().toUpperCase();

            if (u) {
              const ready = await checkAudioUrl(u); // REQUIRE verification
              if (ready) return { ...j, attempts, url: u, done: true, success: true };
            }

            if (st === "ERROR" || st === "FAILED") return { ...j, attempts, done: true, success: false, error: "Audio generation failed." };

            if (attempts > 150) return { ...j, attempts }; // still pending
          }

          // Suno: strictly poll until a verifiable audio url exists
          if (j.provider === "suno" && j.jobId && !j.done) {
            const { data } = await getSunoStatus({ taskId: j.jobId });
            const track = Array.isArray(data?.tracks) ? data.tracks[0] : null;
            const u = track?.audio_url || track?.url || data?.audio_url || data?.url || data?.result_url || null;
            const st = (data?.status || "").toString().toUpperCase();

            if (u) {
              const ready = await checkAudioUrl(u); // REQUIRE verification
              if (ready) return { ...j, attempts, url: u, done: true, success: true };
            }

            if (st === "ERROR" || st === "FAILED") {
              return { ...j, attempts, done: true, success: false, error: "Suno generation failed." };
            }

            if (attempts > 150) return { ...j, attempts }; // still pending
            return { ...j, attempts }; // still pending
          }

          return { ...j, attempts };
        } catch (e) {
          return { ...j, done: true, success: false, error: e?.message || "Audio job error." };
        }
      }));

      // Insert finished jobs and prune queue
      let changed = false;
      const nextPendingAudioJobs = updates.filter((j) => {
        if (j.done && !j.inserted) {
          changed = true;
          if (j.success && j.url) {
            // NEW: strong dedupe - by job key and by URL
            const jobKey = `${j.provider || ""}|${j.type || ""}|${j.voice || ""}|${j.format || ""}|${(j.text || "").slice(0, 40)}`;
            const htmlNow = String(contentRef.current || "");
            const alreadyInHtml = htmlNow.includes(`data-src="${j.url}"`) || htmlNow.includes(`src="${j.url}"`);
            const alreadyByKey = insertedAudioJobKeysRef.current.has(jobKey);
            const alreadyByUrl = insertedAudioUrlsRef.current.has(j.url);

            if (!alreadyInHtml && !alreadyByKey && !alreadyByUrl) {
              const html = buildAudioHtml(j.url, j.id);
              insertContentAtPoint({ html, mode: "after-selection" });
              insertedAudioJobKeysRef.current.add(jobKey);
              insertedAudioUrlsRef.current.add(j.url);
              toast.success("Audio ready and inserted.");
            } else {
              toast.message("Audio generated (already present, skipped duplicate).");
            }
            j.inserted = true;
          } else {
            toast.error(j.error || "Audio generation failed.");
            j.inserted = true;
          }
        }
        return !j.inserted; // Keep only jobs that haven't been inserted yet
      });

      if (changed || nextPendingAudioJobs.length !== pendingAudioJobs.length) {
        setPendingAudioJobs(nextPendingAudioJobs);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [pendingAudioJobs, insertContentAtPoint, contentRef]);

  // HOOK: Master polling useEffect for all background jobs (Image/Video)
  useEffect(() => {
    if (!backgroundJobs.length) return;

    const interval = setInterval(async () => {
      let jobsChanged = false;
      const updatedJobs = await Promise.all(
        backgroundJobs.map(async (job) => {
          if (job.status === 'completed' || job.status === 'failed') return job;

          if (job.status === 'queued') {
            jobsChanged = true;
            return { ...job, status: 'polling' };
          }

          if (job.attempts > 120) {
            jobsChanged = true;
            toast.error(`Job for "${(job.prompt || 'unnamed').substring(0, 20)}..." timed out.`);
            return { ...job, status: 'failed', error: 'Timed out' };
          }

          try {
            let resultUrl = null;
            let isDone = false;
            let hasFailed = false;
            let errorMsg = 'Generation failed.';

            // --- Handle jobs that were completed instantly ---
            if (job.url && !job.taskId) {
              isDone = true;
              resultUrl = job.url;
            }
            // --- Provider-specific polling logic ---
            else if (job.provider === 'midjourney' && job.type === 'image') {
              const { data } = await getMidjourneyStatus({ taskId: job.taskId });
              const successFlag = data?.data?.successFlag;
              if (successFlag === 1) {// Success
                isDone = true;
                resultUrl = data?.data?.resultInfoJson?.resultUrls?.[0] || null;
              } else if (successFlag === 2) {// Failed
                isDone = true;
                hasFailed = true;
                errorMsg = data?.data?.resultInfoJson?.failReason || 'Midjourney job failed.';
              }
            } else if (job.provider === 'fal_ai' && job.type === 'video') {
              const { data: statusData } = await getVideoStatus({ request_id: job.taskId, model: job.modelName });
              const normalizedStatus = (statusData.status || "").toString().toUpperCase();
              const maybeUrl = statusData?.videos?.[0]?.url || statusData?.video?.url || statusData?.url;
              if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'SUCCEEDED' || maybeUrl && !statusData.error) {
                isDone = true;
                resultUrl = maybeUrl;
              } else if (normalizedStatus === 'ERROR' || statusData.error) {
                isDone = true; hasFailed = true; errorMsg = statusData.error || 'Fal.ai video generation failed.';
              }
            }
            // Add other providers (Kei, Runway, etc.) here in the same pattern if needed

            if (isDone) {
              jobsChanged = true;
              if (!hasFailed && resultUrl) {
                if (job.type === 'image') {
                  // Ensure username is available for persistence
                  const uname = currentPost?.user_name || currentWebhook?.user_name || "default";
                  await ImageLibraryItem.create({ url: resultUrl, alt_text: job.altText || job.prompt, source: 'ai_generated', user_name: uname });

                  // NEW: pre-tag image with a data-b44-id for reliable selection/deletion
                  const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                  const html = `<img data-b44-id="${elId}" data-b44-type="image" src="${resultUrl}" alt="${job.altText || job.prompt}" style="max-width:100%; height:auto; border-radius: 8px;" />`;
                  insertContentAtPoint({ html, mode: job.insertMode });
                  toast.success('Image generated and inserted!');
                } else if (job.type === 'video') {
                  // Ensure username is available for persistence
                  const uname = currentPost?.user_name || currentWebhook?.user_name || "default";
                  await GeneratedVideo.create({ url: resultUrl, prompt: job.prompt, model: job.modelName, user_name: uname });

                  // NEW: pre-tag video container with a data-b44-id for reliable selection/deletion
                  const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                  const iframeHtml = `<div class="youtube-video-container" data-b44-id="${elId}" data-b44-type="video" style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2rem 0;"><iframe src="${resultUrl}" title="Generated video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 8px; background: #000;"></iframe></div>`;
                  insertContentAtPoint({ html: iframeHtml, mode: job.insertMode });
                  toast.success('Video generated and inserted!');
                }
                return { ...job, status: 'completed' };
              } else {
                toast.error(errorMsg);
                return { ...job, status: 'failed', error: errorMsg };
              }
            }
            return { ...job, attempts: (job.attempts || 0) + 1 };
          } catch (e) {
            console.error('Polling error for job:', job.id, e);
            jobsChanged = true;
            toast.error('An error occurred while checking job status.');
            return { ...job, status: 'failed', error: e.message };
          }
        })
      );

      const nextJobs = updatedJobs.filter((j) => j.status !== 'completed' && j.status !== 'failed');
      if (jobsChanged || nextJobs.length !== backgroundJobs.length) {
        setBackgroundJobs(nextJobs);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [backgroundJobs, currentPost, currentWebhook, insertContentAtPoint]);

  // UPDATED: Cite Sources runner – now sends the expected 'statement' and inserts inline/block reference
  const handleCiteSources = async () => {
    // Token gate for cite sources
    const { data: gate } = await checkAndConsumeTokens({ feature_key: "ai_cite_sources" });
    if (!gate?.ok) {
      toast.error(gate?.error || "Insufficient tokens to cite sources.");
      return;
    }

    // Build a statement: selected text if available, else a concise summary of the article
    const plainArticle = String(content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const statement = (isTextSelected ? (textForAction || "").trim() : plainArticle.slice(0, 600)).trim();

    if (!statement) {
      toast.message("Select text or add content before citing.");
      return;
    }

    try {
      const { data } = await findSourceAndCite({ statement });

      if (data?.success && data?.citation_text && data?.url) {
        if (isTextSelected) {
          // Insert an inline citation immediately after the selection
          const inline = ` <sup class="b44-citation" style="font-size:0.8em;"><a href="${data.url}" target="_blank" rel="noopener noreferrer">[source]</a></sup>`;
          insertContentAtPoint({ html: inline, mode: "after-selection" });
          toast.success("Citation added.");
        } else {
          // No selection: add a simple References block
          const block = `
<section class="b44-references" style="margin:1.25rem 0;padding:1rem;border:1px solid #e5e7eb;border-radius:8px;background:#fff">
  <h4 style="margin:0 0 .5rem 0;'>References</h4>
  <ol style="margin:0;padding-left:1.25rem">
    <li><strong>[1]</strong> ${data.citation_text} — <a href="${data.url}" target="_blank" rel="noopener noreferrer">${data.url}</a></li>
  </ol>
</section>`.trim();
          insertContentAtPoint({ html: block, mode: "at-caret" });
          toast.success("References added.");
        }
        return;
      }

      // If backend returns a different shape, inform user
      toast.error(data?.error || "Could not find a reliable citation.");
    } catch (error) {
      toast.error("Citations service failed. Please try again.");
    }
  };


  // Show the Ask AI pill at the click location (right-click)
  const handleIframeContextMenu = (payload) => {
    const t = (payload?.text || "").trim();
    setTextForAction(t);
    setIsTextSelected(!!t);

    // Restore: show the pill at cursor, hide quick menu until pill is clicked
    setQuickMenu({ visible: false, x: null, y: null });
    setAskAIBar({ visible: true, x: payload.x, y: payload.y });
  };

  // Show the Ask AI pill at the click location (double-click)
  const handleIframeDoubleClick = (payload) => {
    const t = (payload?.text || "").trim();
    setTextForAction(t);
    setIsTextSelected(!!t);

    // Restore: show the pill at cursor, hide quick menu until pill is clicked
    setQuickMenu({ visible: false, x: null, y: null });
    setAskAIBar({ visible: true, x: payload.x, y: payload.y });
  };

  // update Ask AI bar to call inline edit instead of modal
  const openAskAIOptions = (x, y) => {
    setAskAIBar({ visible: false, x: null, y: null });
    setQuickMenu({ visible: true, x, y });
  };

  const openInlineEditor = React.useCallback(() => {
    // capture current bar position then hide it
    setInlineToolbar((prev) => ({ ...prev, visible: true, x: askAIBar.x, y: askAIBar.y }));
    setAskAIBar({ visible: false, x: null, y: null });
  }, [askAIBar]);

  // NEW: Apply affilified HTML helper
  const handleApplyAffilify = (newHtml) => {
    const cleaned = sanitizeLocalizedHtml ? sanitizeLocalizedHtml(newHtml) : String(newHtml || "");
    skipNextPreviewPushRef.current = true;
    setContent(cleaned);
    sendToPreview({ type: "set-html", html: cleaned });
  };

  // Handle a picked quick action (reuse existing mapping)
  const handleQuickPick = (actionId) => {
    setQuickMenu({ visible: false, x: null, y: null });

    switch (actionId) {
      // Core actions that must open modals/generators immediately
      case "tldr":
      case "key-takeaway": // alias
        setShowTldrGenerator(true);
        return;

      case "humanize":
        setShowHumanizeModal(true);
        return;

      case "ai-rewrite":
        setShowAIModal(true);
        return;

      case "callout":
        setCalloutType("callout");
        setShowCalloutGenerator(true);
        return;

      case "fact":
        setCalloutType("fact");
        setShowFactGenerator(true);
        return;

      case "generate-image":
        openImageGenerator();
        return;

      case "generate-video":
        setShowVideoGenerator(true);
        return;

      case "sitemap-link":
        sendToPreview({ type: "editor-command", command: "saveSelection" }); // NEW: Save selection before opening sitemap linker
        setShowSitemapLinker(true);
        return;

      case "cite":
      case "cite-sources":
        handleCiteSources();
        return;

      case "faq":
        setShowFaqGenerator(true);
        return;

      // Already-working utility/openers
      case "localize":
        setShowLocalize(true);
        return;
      case "youtube":
        setShowYouTubeSelector(true);
        return;
      case "tiktok":
        setShowTikTokSelector(true);
        return;
      case "audio": {
        // NEW: force-capture freshest selection right before opening modal
        let latest = (textForAction || "").trim();
        try {
          if (!latest) {
            const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
            const win = iframe?.contentWindow;
            if (win && typeof win.getSelection === "function") {
              latest = (win.getSelection()?.toString() || "").trim();
            }
          }
        } catch (_) { }
        if (!latest) {
          try { latest = (localStorage.getItem("b44_audio_selected_text") || "").trim(); } catch (_) { }
        }
        if (latest) {
          setTextForAction(latest);
          setIsTextSelected(true);
        }
        setShowAudioModal(true);
        return;
      }
      case "brand-it":
        setShowBrandIt(true);
        return;
      case "affilify":
        setShowAffilify(true);
        return;
      case "ai-agent":
        setShowWorkflowRunner(true);
        toast.message("Opening AI Agent Workflow…");
        return;
      case "image-library":
        openImageLibrary();
        return;
      case "video-library":
        setShowVideoLibrary(true);
        return;
      case "cta":
        setShowCtaSelector(true);
        return;
      case "promoted-product":
        setShowProductSelector(true);
        return;
      case "manual-link":
        openLinkSelectorModal();
        return;
      case "testimonials":
        setShowTestimonialLibrary(true);
        return;
      case "clean-html":
        setShowHTMLCleanup(true);
        return;
      case "ai-detection":
        setShowAIDetection(true);
        return;
      case "amazon-import":
        setShowAmazonImport(true);
        return;

      default:
        return;
    }
  };

  // Close bar on any click elsewhere or Escape
  useEffect(() => {
    const close = () => setAskAIBar((s) => ({ ...s, visible: false }));
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("click", close, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("click", close, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);

  // NEW: helper to close all dropdowns across toolbar and publish menu
  const closeAllDropdowns = () => {
    // Notify toolbar menus
    window.dispatchEvent(new CustomEvent('b44-close-dropdowns'));
    // Close publish menu
    setPublishMenuOpen(false);
    // Close AI floating bar
    setAskAIBar((s) => ({ ...s, visible: false }));
    // Close quick menu
    setQuickMenu((s) => ({ ...s, visible: false }));
    // Close inline formatting toolbar
    setInlineToolbar({ visible: false, x: null, y: null });
  };

  // Compute device viewport width for editor wrapper
  const deviceWidth = (() => {
    if (previewDevice === "mobile") return 390;
    if (previewDevice === "tablet") return 820;
    return 1280;
  })();

  // Hook up keyboard shortcuts
  const {
    shortcuts,
    showCheatsheet,
    setShowCheatsheet,
    updateShortcut,
    resetShortcuts
  } = useKeyboardShortcuts(
    {
      save: () => handleSave(),
      publish: () => handlePublish(),
      undo: () => handleUndo(),
      redo: () => handleRedo(),
      showShortcuts: () => setShowCheatsheet(true)
    },
    { enabled: true }
  );

  useEffect(() => {
    // Show once per browser until dismissed
    // const seen = localStorage.getItem("b44_askai_dblclick_hint");
    // if (!seen) setShowDblClickNotice(true);
  }, []); // Load a specific BlogPost by id
  const loadPostContent = useCallback(async (postId) => {
    try {
      const found = await BlogPost.filter({ id: postId });
      if (!found || found.length === 0) {
        toast.error("Post not found");
        setTitle("");
        setContent("");
        setCurrentPost(null);
        setCurrentWebhook(null);
        setPriority('medium'); // Reset priority
        // Immediately clear preview
        sendToPreview({ type: "set-html", html: "" });
        return;
      }
      const post = found[0];
      setCurrentPost(post);
      setTitle(post.title || "");
      setContent(post.content || "");
      setPriority(post.priority || 'medium'); // NEW: set priority from loaded post
      // Immediately push content to preview to avoid seeing defaults
      sendToPreview({ type: "set-html", html: post.content || "" });
      // NEW: bind session key to the post id we loaded
      initSessionKey({ postId: post.id });

      if (post.processing_id) {
        const relatedWebhooks = await WebhookReceived.filter({ processing_id: post.processing_id });
        if (relatedWebhooks && relatedWebhooks.length > 0) {
          const latestWebhook = relatedWebhooks.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date))[0];
          setCurrentWebhook(latestWebhook);
        } else {
          setCurrentWebhook(null);
        }
      } else {
        setCurrentWebhook(null);
      }
    } catch (error) {
      console.error("Error loading post content:", error);
      toast.error("Failed to load post content.");
      setTitle("");
      setContent("");
      setCurrentPost(null);
      setCurrentWebhook(null);
      setPriority('medium'); // Reset priority on error
      // Clear preview on error
      sendToPreview({ type: "set-html", html: "" });
    }
  }, [initSessionKey, sendToPreview, setContent, setCurrentPost, setCurrentWebhook, setPriority, setTitle]);

  const loadWebhookContent = useCallback(async (webhookId) => {
    try {
      const fetchedWebhooks = await WebhookReceived.filter({ id: webhookId });
      if (!fetchedWebhooks || fetchedWebhooks.length === 0) {
        toast.error("Webhook not found");
        setTitle("");
        setContent("");
        setCurrentPost(null);
        setCurrentWebhook(null);
        setPriority('medium'); // Reset priority
        sendToPreview({ type: "set-html", html: "" });
        return;
      }
      const webhook = fetchedWebhooks[0];

      // NEW: ensure processing_id exists and is stable so we don't create duplicates
      if (!webhook.processing_id) {
        await WebhookReceived.update(webhook.id, { processing_id: webhook.id });
        webhook.processing_id = webhook.id;
      }

      setCurrentWebhook(webhook);
      setTitle(webhook.title || "");
      setContent(webhook.content || "");
      // Immediately reflect webhook content in preview
      sendToPreview({ type: "set-html", html: webhook.content || "" });
      // NEW: bind session key to webhook processing id
      initSessionKey({ processingId: webhook.processing_id });

      if (!webhook.processing_id) {
        await WebhookReceived.update(webhook.id, { status: "editing" });
        setCurrentPost(null);
        return;
      }

      const candidates = await BlogPost.filter({ processing_id: webhook.processing_id });
      if (candidates && candidates.length > 0) {
        const latestPost = candidates.
          slice().
          sort((a, b) => {
            const aTime = Date.parse(a.updated_date || a.created_date || 0) || 0;
            const bTime = Date.parse(b.updated_date || b.created_date || 0) || 0;
            return bTime - aTime;
          })[0];

        if (latestPost) {
          setCurrentPost(latestPost);
          setTitle(latestPost.title || "");
          setContent(latestPost.content || "");
          setPriority(latestPost.priority || 'medium'); // NEW: set priority from loaded post
          // Ensure latest post content is pushed through
          sendToPreview({ type: "set-html", html: latestPost.content || "" });
        } else {
          setCurrentPost(null);
        }
      } else {
        setCurrentPost(null);
      }

      await WebhookReceived.update(webhook.id, { status: "editing" });
    } catch (error) {
      console.error("Error loading webhook:", error);
      toast.error("Failed to load webhook content");
      setTitle("");
      setContent("");
      setCurrentPost(null);
      setCurrentWebhook(null);
      setPriority('medium'); // Reset priority on error
      sendToPreview({ type: "set-html", html: "" });
    }
  }, [initSessionKey, sendToPreview, setContent, setCurrentPost, setCurrentWebhook, setPriority, setTitle]);

  const initializeEditor = useCallback(async () => {
    setIsLoading(true);
    // Reset state and local storage
    setTitle("");
    setContent("");
    setCurrentPost(null);
    setCurrentWebhook(null);
    setTextForAction("");
    setIsTextSelected(false);
    setPriority('medium');
    localStorage.removeItem('editor_draft_title');
    localStorage.removeItem('editor_draft_content');
    localStorage.removeItem('autosave-title');
    localStorage.removeItem('autosave-content');
    insertedAudioUrlsRef.current.clear(); // Clear dedupe cache on init
    insertedAudioJobKeysRef.current.clear(); // Clear dedupe cache on init


    // IMPORTANT: determine intent BEFORE clearing preview, so we don't show placeholder for existing items
    const urlParams = new URLSearchParams(window.location.search);
    const importHtml = urlParams.get('importHtml');
    const postId = urlParams.get('post');
    const webhookId = urlParams.get('webhook');

    // Only clear the preview immediately if we're starting a brand new doc
    if (!postId && !webhookId && importHtml !== '1') {
      sendToPreview({ type: "set-html", html: "" });
    }

    try {
      // Import raw HTML from HTML Studio
      if (importHtml === '1') {
        const imported = localStorage.getItem('htmlstudio_content') || "";
        setContent(imported);
        sendToPreview({ type: "set-html", html: imported });
        localStorage.removeItem('htmlstudio_content');
        setIsLoading(false);
        return;
      }

      if (postId) {
        await loadPostContent(postId);
      } else if (webhookId) {
        await loadWebhookContent(webhookId);
      } else {
        // Completely new post
        setTitle("");
        setContent("");
        setCurrentPost(null);
        setCurrentWebhook(null);
        setPriority('medium');
        sendToPreview({ type: "set-html", html: "" });
      }
    } catch (error) {
      console.error("Critical initialization error:", error);
      toast.error("Failed to load article. Please try again.");
      // On critical error, ensure preview is cleared
      sendToPreview({ type: "set-html", html: "" });
    } finally {
      setIsLoading(false);
    }
  }, [loadPostContent, loadWebhookContent, sendToPreview, setContent, setCurrentPost, setCurrentWebhook, setIsLoading, setIsTextSelected, setPriority, setTextForAction, setTitle]);

  useEffect(() => {
    initializeEditor();
  }, [location.search, initializeEditor]);

  // Ensure preview reliably gets the HTML after the iframe reports ready
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type === 'b44-ready') {
        // slight delay to ensure iframe DOM settled
        setTimeout(() => {
          sendToPreview({ type: "set-html", html: content || "" });
        }, 30);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [content, sendToPreview]);

  // Also push once after loading finishes (extra safety)
  React.useEffect(() => {
    if (!isLoading) {
      // NEW: skip the immediate push if the change came from inside the iframe
      if (skipNextPreviewPushRef.current) {
        skipNextPreviewPushRef.current = false;
        return;
      }
      const t = setTimeout(() => {
        sendToPreview({ type: "set-html", html: content || "" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isLoading, content, sendToPreview]);

  // Handle selection messages from iframe (ensure audio selection sets selectedMedia)
  useEffect(() => {
    const onMsg = (e) => {
      const d = e?.data;
      if (d?.type === "media-selected") {
        if (d.mediaType === "audio") {
          setSelectedMedia({ id: d.id, type: "audio", width: d.width || 100, align: d.align || "left" });
        } else {
          // For other media types (images, videos), keep existing behavior
          setSelectedMedia({ id: d.id, type: d.mediaType, width: d.width || 100, align: d.align || "left" });
        }
      } else if (d?.type === "html-updated" && typeof d.html === "string") {
        skipNextPreviewPushRef.current = true;
        setContent(d.html);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Load current user once and determine if dropdown should be shown
  useEffect(() => {
    (async () => {
      try {
        const u = await User.me();
        setCurrentUser(u);
        const allow = !!(u && (u.role === "admin" || u.access_level === "full" || u.show_publish_options === true));
        setShowPublishDropdown(allow);
      } catch {
        setCurrentUser(null);
        setShowPublishDropdown(false);
      }
    })();
  }, []);

  // Determine default publishing method based on current username (per-username default)
  useEffect(() => {
    const uname = currentPost && currentPost.user_name || currentWebhook && currentWebhook.user_name || null;
    let isMounted = true;
    const loadDefaults = async () => {
      if (!uname) {
        if (isMounted) {
          setDefaultPublish({ method: null, credentialId: null, label: null });
          setDefaultPublishUsername(null);
        }
        return;
      }
      const rows = await Username.filter({ user_name: uname });
      const u = rows && rows[0];
      const m = u?.default_publish_method || null;
      const c = u?.default_credential_id || null;
      const label =
        m === "google_docs" ? "Google Docs" :
          m === "notion" ? "Notion" :
            m === "shopify" ? "Shopify" :
              m === "wordpress" ? "WordPress" :
                m === "webflow" ? "Webflow" :
                  m === "webhook" ? "Webhook" :
                    null;

      if (isMounted) {
        setDefaultPublish({ method: m, credentialId: c, label });
        setDefaultPublishUsername(uname); // NEW: remember which username this applies to
      }
    };
    loadDefaults();
    return () => { isMounted = false; };
  }, [currentPost, currentWebhook]);

  // Helper: extract first <img src> from HTML for Notion cover
  const extractFirstImageUrl = (html) => {
    const m = String(html || "").match(/<img[^>]*src=["']([^"']+)["']/i);
    return m && m[1] ? m[1] : "";
  };

  // Lazy-load credentials for the current username when needed
  const loadCredentialsForUsername = async () => {
    const uname = currentPost && currentPost.user_name || currentWebhook && currentWebhook.user_name || null;
    if (!uname) {
      setPublishCredentials([]);
      return;
    }
    const creds = await IntegrationCredential.filter({ user_name: uname });
    setPublishCredentials(creds || []);
  };

  // NEW: generic publisher for dropdown picks
  const handlePublishTo = async (provider, credentialId, labelOverride) => {
    if (!provider) return;
    if (provider === "google_docs") {
      await savePost('published', { useGoogleDocs: true }); // Trigger save with Google Docs intent
      return;
    }
    // Replace only the Shopify branch to open modal
    if (provider === "shopify") {
      shopifyPreset.current = { credentialId }; // Use ref to update
      setShowShopifyModal(true);
      return;
    }
    // All other providers (including webhook) require a credentialId
    if (!credentialId) {
      toast.message("Please select a connection first.");
      setShowCMSModal(true);
      return;
    }

    // For other CMS providers, we first save, then publish with the post content
    // We pass the provider and credentialId through `publishOptions`
    await savePost('published', { publishTo: { provider, credentialId, labelOverride } });
  };

  // Publish to the Username's default provider directly (no modal)
  const publishToDefaultNow = async (postToPublish) => {// Added postToPublish parameter
    const uname = defaultPublishUsername;
    if (!defaultPublish?.method) {
      toast.message(uname ?
        `No default publish method set for username "${uname}". Choose a provider once, then it'll be one‑click.` :
        "No username context found for this post. Set a username or choose a provider once."
      );
      setShowCMSModal(true);
      return;
    }

    const provider = defaultPublish.method;

    // Special case: Google Docs workflow - already handled in savePost
    if (provider === "google_docs") {
      return;
    }

    // inside publishToDefaultNow, replace the shopify branch:
    if (provider === "shopify") {
      shopifyPreset.current = { credentialId: defaultPublish.credentialId || null }; // Use ref to update
      setShowShopifyModal(true);
      setIsPublishing(false); // prevent spinner while modal shows
      return;
    }

    // All other default providers (including webhook) require a credentialId
    if (!defaultPublish.credentialId) {
      toast.message(uname ?
        `No default credential set for username "${uname}". Select one in the modal.` :
        "No default credential set. Select one in the modal."
      );
      setShowCMSModal(true);
      return;
    }

    setIsPublishing(true);
    try {
      const plainText = String(postToPublish.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      if (provider === "webhook") {
        const coverCandidate = postToPublish.featured_image || extractFirstImageUrl(postToPublish.content);
        const { data } = await securePublish({
          provider: "webhook",
          credentialId: defaultPublish.credentialId,
          title: postToPublish.title || "Untitled",
          html: postToPublish.content || "",
          text: plainText,
          coverUrl: coverCandidate || undefined,
          status: "published"
        });

        if (data?.success || data?.ok) {
          toast.success(`Published to ${defaultPublish.label || "Webhook"}${uname ? ` for "${uname}"` : ""}.`);
        } else {
          toast.error(data?.error || "Webhook publish failed.");
        }
        return; // IMPORTANT: Exit after webhook publishing
      }

      if (provider === "notion") {
        const coverCandidate = postToPublish.featured_image || extractFirstImageUrl(postToPublish.content);
        if (!coverCandidate) {
          try {
            localStorage.setItem("cms_default_provider", "notion");
            localStorage.setItem("cms_default_credential_id", defaultPublish.credentialId);
          } catch (_) { }
          toast.message("Pick a cover image before publishing to Notion.");
          setShowCMSModal(true);
          return; // don't call backend without cover
        }

        const { data } = await securePublish({
          provider: "notion",
          credentialId: defaultPublish.credentialId,
          title: postToPublish.title || "Untitled",
          html: postToPublish.content || "",
          text: plainText,
          coverUrl: coverCandidate
        });

        if (data?.success || data?.ok) {
          toast.success(`Published to ${defaultPublish.label || "Notion"}${uname ? ` for "${uname}"` : ""}.`);
        } else {
          toast.error(data?.error || "Publishing to Notion failed.");
        }
        return;
      }

      // CMS providers via securePublish
      const { data } = await securePublish({
        provider,
        credentialId: defaultPublish.credentialId,
        title: postToPublish.title || "Untitled",
        html: postToPublish.content || "", // This content includes the schema
        text: plainText
      });

      if (data?.success || data?.ok) {
        toast.success(`Published to ${defaultPublish.label || provider}${uname ? ` for "${uname}"` : ""}.`);
      } else if (provider === 'notion' && data?.code === 'COVER_REQUIRED') {
        try {
          localStorage.setItem("cms_default_provider", "notion");
          localStorage.setItem("cms_default_credential_id", defaultPublish.credentialId);
        } catch (_) { }
        toast.message("Pick a cover image before publishing to Notion.");
        setShowCMSModal(true);
      } else {
        toast.error(data?.error || "Publishing failed. You can try via the Publish modal.");
        setShowCMSModal(true);
      }
    } catch (e) {
      // Handle Axios 400 errors (e.e., COVER_REQUIRED) gracefully
      const server = e?.response?.data;
      if (provider === 'notion' && server?.code === 'COVER_REQUIRED') {
        try {
          localStorage.setItem("cms_default_provider", "notion");
          localStorage.setItem("cms_default_credential_id", defaultPublish.credentialId);
        } catch (_) { }
        toast.message("Pick a cover image before publishing to Notion.");
        setShowCMSModal(true);
      } else {
        toast.error(server?.error || e?.message || "Publishing failed.");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // When opening the Link selector, save selection first so we can wrap later
  const openLinkSelectorModal = () => {
    sendToPreview({ type: "editor-command", command: "saveSelection" });
    setShowLinkSelector(true);
  };

  // FIX: Always try to wrap the previously saved selection with the URL.
  // If there was no selection, the iframe will insert a link at the caret using the URL as its label.
  const handleLinkInsert = (linkInput) => {
    const isAnchorHtml = typeof linkInput === 'string' && /<a\b[^>]*>/i.test(linkInput);
    const isUrl = typeof linkInput === 'string' && /^https?:\/\//i.test(linkInput);

    if (isAnchorHtml) {
      insertContentAtPoint(linkInput);
      return;
    }

    if (isUrl) {
      // Always attempt to wrap saved selection inside the iframe.
      // The iframe's wrapSelectionWithLink will handle whether to wrap existing text
      // or insert a new link element if no text was selected/provided.
      sendToPreview({ type: "editor-command", command: "wrap-link", href: linkInput });
      // Request updated HTML back after mutation
      setTimeout(() => sendToPreview({ type: "request-html" }), 50);
      return;
    }

    // Fallback: treat as raw HTML/string
    insertContentAtPoint(linkInput);
  };

  const handlePreviewHtmlChange = (newHtml) => {
    // This function is called when the content inside the iframe changes.
    // We set a ref to true to prevent the parent's `useEffect` on `content`
    // from re-pushing the same HTML back down, which can cause flickering or scroll jumps.
    skipNextPreviewPushRef.current = true;
    setContent(newHtml);
  };

  const handlePreviewSelectionChange = ({ text, isSelected }) => {
    setTextForAction(text || "");
    setIsTextSelected(isSelected);
    // NEW: persist latest selection for robust modal prefill fallback
    try { localStorage.setItem("b44_audio_selected_text", (text || "").trim()); } catch (_) { }
  };

  const applyPreviewWidth = (width) => {
    if (!selectedMedia) return;
    const newWidth = parseInt(width, 10);

    setSelectedMedia((prev) => ({ ...prev, width: newWidth }));

    // Ensure proportional scaling and prevent right-side cropping for all media types
    // IMPORTANT: use kebab-case keys because iframe uses style.setProperty()
    const styles = {
      width: `${newWidth}%`,
      'max-width': '100%',
      'box-sizing': 'border-box'
    };

    if (selectedMedia.type === 'image') {
      styles.height = 'auto';
      styles['object-fit'] = 'contain';
      styles.display = 'block'; // Ensure block display for margin auto alignment
    } else if (selectedMedia.type === 'video') {
      styles['aspect-ratio'] = '16 / 9';
      styles.height = 'auto';
      styles.overflow = 'visible';
      styles.display = 'block'; // Ensure block display for margin auto alignment
    } else {
      styles.height = 'auto';
      styles.overflow = 'visible';
      styles.display = 'block'; // Ensure block display for margin auto alignment
    }


    // Live update in the preview iframe
    sendToPreview({
      type: 'update-media-style',
      id: selectedMedia.id,
      styles
    });

    // Debounce the final HTML commit to avoid too many updates
    clearTimeout(resizeCommitTimerRef.current);
    resizeCommitTimerRef.current = setTimeout(() => {
      sendToPreview({ type: 'request-html' });
    }, 500);
  };

  const applyPreviewAlign = (align) => {
    if (!selectedMedia) return;
    setSelectedMedia((prev) => ({ ...prev, align }));

    // Use kebab-case keys so iframe's setProperty works
    // Apply both float and margins for robust visual alignment
    const base = {
      display: 'block',
      'max-width': '100%',
      'box-sizing': 'border-box'
    };

    let styles = { ...base };

    if (align === 'left') {
      styles = {
        ...styles,
        float: 'left',
        'margin-left': '0',
        'margin-right': 'auto',
        clear: 'none'
      };
    } else if (align === 'center') {
      styles = {
        ...styles,
        float: 'none',
        'margin-left': 'auto',
        'margin-right': 'auto',
        clear: 'both' // ensure we break out of previous floats
      };
    } else if (align === 'right') {
      styles = {
        ...styles,
        float: 'right',
        'margin-left': 'auto',
        'margin-right': '0',
        clear: 'none'
      };
    }

    sendToPreview({
      type: 'update-media-style',
      id: selectedMedia.id,
      styles
    });

    clearTimeout(resizeCommitTimerRef.current);
    resizeCommitTimerRef.current = setTimeout(() => {
      sendToPreview({ type: 'request-html' });
    }, 300);
  };

  // These were missing, so I'm adding placeholder implementations.
  // The logic for these depends on how you want to find existing posts.
  // For now, they will return null to prevent crashes.
  const findExistingPostByHeuristics = async () => {
    // Placeholder: This would contain logic to find a post based on title, content, etc.
    return null;
  };
  const findBySessionKey = async () => {
    if (!sessionKeyRef.current) return null;
    const matches = await BlogPost.filter({ client_session_key: sessionKeyRef.current });
    return matches.length > 0 ? matches[0].id : null;
  };


  const resolveExistingPostId = async () => {
    if (currentPost && currentPost.id) return currentPost.id;

    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('post');
    if (idFromUrl) return idFromUrl;

    const procId =
      currentPost && currentPost.processing_id ||
      currentWebhook && currentWebhook.processing_id ||
      null;

    if (procId) {
      const matches = await BlogPost.filter({ processing_id: procId }, "-updated_date");
      if (Array.isArray(matches) && matches.length > 0) {
        return matches[0].id;
      }
    }
    return null;
  };

  const generateSchemaForPost = async (postTitle, htmlContent) => {
    if (generatingSchemaRef.current) {
      toast.info("Schema generation is already in progress.");
      return null; // Return null or throw a specific error that is caught
    }
    if (!postTitle || !htmlContent) {
      throw new Error("Title and content are required for schema generation.");
    }

    generatingSchemaRef.current = true;
    setIsGeneratingSchema(true);

    const conversation = await agentSDK.createConversation({
      agent_name: "schema_generator"
    });

    if (!conversation?.id) {
      throw new Error("Could not start a conversation with the AI agent.");
    }

    // Truncate content to avoid exceeding token limits for the LLM
    const maxContentLength = 20000; // Adjust as needed based on LLM capabilities
    const truncatedHtml = htmlContent.substring(0, maxContentLength);
    const prompt = `Based on the following article content, generate a comprehensive and detailed JSON-LD schema (using schema.org vocabulary) for a BlogPosting. Be as specific and thorough as possible.
Article Title: ${postTitle}
HTML Content:
${truncatedHtml}`;

    await agentSDK.addMessage(conversation, {
      role: "user",
      content: prompt
    });

    const pollTimeout = 60000; // 60 seconds
    const pollInterval = 3000; // 3 seconds
    const startTime = Date.now();

    try {
      while (Date.now() - startTime < pollTimeout) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const updatedConversation = await agentSDK.getConversation(conversation.id);
        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

        if (lastMessage?.role === 'assistant' && lastMessage.is_complete) {
          try {
            const cleanedContent = lastMessage.content.
              replace(/^```json\s*/, '').
              replace(/\s*```$/, '');
            JSON.parse(cleanedContent); // Attempt to parse to validate
            return cleanedContent;
          } catch (e) {

          }
        }
      }
      throw new Error("Schema generation timed out after 60 seconds. Please try again or publish without schema.");
    } finally {
      generatingSchemaRef.current = false;
      setIsGeneratingSchema(false);
    }
  };

  // Strengthen resolve logic in savePost and persist client_session_key
  const savePost = async (status, options = {}) => {
    // NEW: guard against double clicks / concurrent saves
    if (savingGuardRef.current) return;
    savingGuardRef.current = true;

    const isPublishFlow = status === 'published';
    if (isPublishFlow) setIsLoading(true); // Using isLoading for overall loading feedback
    else setIsSaving(true);

    let finalContent = content; // Content that will be saved to the database
    let postData = {
      title: title || "Untitled Post",
      content: content,
      status,
      reading_time: Math.ceil(content.replace(/<[^>]*>/g, '').split(' ').length / 200),
      scheduled_publish_date: options.scheduledPublishDate || null,
      priority,
      client_session_key: sessionKeyRef.current || null,
      generated_llm_schema: currentPost?.generated_llm_schema || null // Preserve existing schema if not generating new
    };

    // --- TEMPORARILY DISABLED SCHEMA GENERATION ---
    const enableSchemaGeneration = false;

    // If schema already exists (from SEO modal or previous generation), include it when publishing
    if (isPublishFlow) {
      let schemaJsonString = currentPost?.generated_llm_schema || null;

      // If schema generation is enabled and no schema exists yet, try to generate it
      if (enableSchemaGeneration && !schemaJsonString) {
        toast.info("Generating hyper-detailed AI schema for your content. This may take up to a minute...", { duration: 60000 });
        try {
          const generatedSchema = await generateSchemaForPost(title, content);
          if (generatedSchema) {
            schemaJsonString = generatedSchema;
            postData.generated_llm_schema = schemaJsonString;
            toast.success("AI Schema generated successfully.");
          }
        } catch (error) {
          toast.error(error.message || "Failed to generate AI schema. Publishing without schema.");
          // Do not return here; allow publishing to continue without schema.
        }
      }

      // Prepend schema to content if available and not already present
      if (schemaJsonString && String(schemaJsonString).trim().startsWith("{")) {
        const schemaScript = `<script type="application/ld+json">${schemaJsonString}</script>`;
        if (!finalContent.includes(schemaScript.substring(0, 50))) {// Check for partial match to avoid issues with different whitespace
          finalContent = `${schemaScript}\n${finalContent}`;
          postData.content = finalContent; // Update content in postData to include schema
        }
      }
    }

    try {
      if (currentPost) {
        postData = { ...currentPost, ...postData };
      }
      if (currentWebhook) {
        postData.user_id = currentWebhook.user_id;
        postData.user_name = currentWebhook.user_name;
        postData.assigned_to_email = currentWebhook.assigned_to_email;
        postData.processing_id = currentWebhook.processing_id || currentWebhook.id;
      }

      let savedPost;
      const existingId = (await resolveExistingPostId()) || (await findBySessionKey()) || (await findExistingPostByHeuristics());

      if (existingId) {
        await BlogPost.update(existingId, postData);
        savedPost = { ...postData, id: existingId };
        initSessionKey({ postId: existingId });
      } else {
        savedPost = await BlogPost.create(postData);
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get('post') && savedPost?.id) {
          const newUrl = createPageUrl(`Editor?post=${savedPost.id}`);
          // FIX: Use history.replaceState to prevent a page reload/re-initialization
          window.history.replaceState({}, '', newUrl);
        }
        if (savedPost?.id) initSessionKey({ postId: savedPost.id });
      }
      setCurrentPost(savedPost); // Update local state with the saved post (which now has the schema)

      if (isPublishFlow) {
        if (options.useGoogleDocs) {
          // Logic previously in openInGoogleDocs, now uses the `savedPost` content
          const safeTitle = (savedPost.title || "Untitled Post").replace(/</g, "&lt;").replace(/>/g, ">");
          const fullHtmlForGDocs = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>${savedPost.content}</body></html>`;
          try {
            if (navigator.clipboard && window.ClipboardItem) {
              const htmlBlob = new Blob([fullHtmlForGDocs], { type: "text/html" });
              const clipboardItem = new ClipboardItem({ "text/html": htmlBlob });
              await navigator.clipboard.write([clipboardItem]);
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(fullHtmlForGDocs);
            } else {
              const blob = new Blob([fullHtmlForGDocs], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const win = window.open(url, "_blank");
              toast.message("Clipboard not available. A new tab opened with the HTML; Select All and copy, then paste into Google Docs.");
              if (win) return;
            }
            toast.success("Content with schema copied. A new Google Doc will open — paste (Cmd/Ctrl + V) to insert your content.");
          } catch (e) {
            toast.message("Could not copy HTML automatically. We'll still open Google Docs; please return here, copy, then paste.");
            console.error("Copy to clipboard failed:", e);
          }
          window.open("https://docs.google.com/document/create", "_blank");
        } else if (options.useDefaultProvider) {
          // We pass the full savedPost so downstream functions get the schema-enriched content
          await publishToDefaultNow(savedPost);
        } else if (options.publishTo) {
          // This is for specific CMS publishing via dropdown
          await publishToDefaultNow({
            ...savedPost, // Pass savedPost (includes content with schema)
            _overrideProvider: options.publishTo.provider,
            _overrideCredentialId: options.publishTo.credentialId,
            _overrideLabel: options.publishTo.labelOverride
          });
        }

        if (currentWebhook) {
          await sendToAirtable({
            title: savedPost.title,
            content: savedPost.content,
            webhookData: currentWebhook.webhook_data,
            // The recordId passed here is the internal processing_id, which is wrong.
            // The fix below will ignore it and use the correct one from webhookData.
            recordId: currentWebhook.processing_id
          });
          await WebhookReceived.update(currentWebhook.id, { status: "published", published_at: new Date().toISOString() });
        }
      } else if (currentWebhook) {
        await WebhookReceived.update(currentWebhook.id, { status: "editing" });
      }

      if (!isPublishFlow) {
        toast.success("Post saved successfully as draft!");
      }
    } catch (error) {
      toast.error(`Failed to ${status === 'published' ? 'publish' : 'save'} post. ${error.message}`);
    } finally {
      if (isPublishFlow) setIsLoading(false); else setIsSaving(false);
      savingGuardRef.current = false;
    }
  };


  const sendToAirtable = async (postData) => {
    try {
      let webhookBody = postData.webhookData;

      if (typeof webhookBody === 'string') {
        try {
          webhookBody = JSON.parse(webhookBody);
        } catch (e) {
          console.error("Failed to parse webhook_data string:", e, "Raw data:", webhookBody);
          throw new Error("Original webhook data is a malformed string.");
        }
      }

      if (typeof webhookBody !== 'object' || webhookBody === null) {
        throw new Error("Webhook data is not a valid object after processing.");
      }

      const tableId = webhookBody?.table;
      const recordId = webhookBody?.['record-id']; // FIX: Always use the record-id from the webhook payload.

      if (!recordId) {
        throw new Error("Could not find 'record-id' for this article. Please re-trigger the webhook from your automation tool to fix it.");
      }
      if (!tableId) {
        throw new Error("Could not find 'table' ID for this article. Please ensure your automation sends a 'table' field, then re-trigger the webhook.");
      }

      const payload = {
        tableId,
        recordId,
        title: postData.title,
        content: postData.content
      };

      const response = await publishToAirtable(payload);

      if (response?.data?.success) {
        toast.success("✅ Post published to Airtable successfully!");
      } else {
        const errorMessage = response?.data?.error || "Unknown error occurred during Airtable update.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast.error(`Post saved but failed to publish to Airtable: ${error.message || error}`);
    }
  };

  const handleSave = () => savePost('draft');
  const handlePublish = () => savePost('published', { useDefaultProvider: true });

  const handleSEOSave = (newMetadata) => {
    setCurrentPost((prev) => ({
      ...prev,
      ...newMetadata
    }));
  };

  const handleOpenActionsModal = () => {
    if (isTextSelected) {
      setIsActionsModal(true);
    } else {
      toast.info("Please select text in the editor first.");
    }
  };

  const openImageLibrary = () => {
    setImageLibraryDefaultProvider(undefined);
    setImageLibraryGenerateOnly(false);
    setShowImageLibrary(true);
  };

  const openImageGenerator = () => {
    setImageLibraryDefaultProvider("fal_ai");
    setImageLibraryGenerateOnly(true);
    setShowImageLibrary(true);
  };

  const openInfographicGenerator = () => {
    setImageLibraryDefaultProvider("infographic");
    setImageLibraryGenerateOnly(true);
    setShowImageLibrary(true);
  };

  const handleActionSelect = (actionId) => {
    switch (actionId) {
      case 'ai-rewrite': setShowAIModal(true); break;
      case 'humanize': setShowHumanizeModal(true); break;
      case 'generate-image': openImageGenerator(); break;
      case 'generate-video': setShowVideoGenerator(true); break;
      case 'callout': setCalloutType("callout"); setShowCalloutGenerator(true); break;
      case 'fact': setCalloutType("fact"); setShowFactGenerator(true); break;
      case 'tldr': setShowTldrGenerator(true); break;
      case 'ai-detection': setShowAIDetection(true); break;
      case 'sitemap-link': setShowSitemapLinker(true); break;
      // NEW: open the AI Agent Workflow runner modal
      case 'ai-agent': setShowWorkflowRunner(true); break;
      // NEW: FAQ generation
      case 'faq':
        // Now opens the FaqGeneratorModal directly
        setShowFaqGenerator(true);
        break;
      default: break;
    }
  };

  const handleInsertPromotedProduct = (htmlBlockOrDoc) => {
    insertContentAtPoint(String(htmlBlockOrDoc));
  };

  const handleAIRewrite = (newText) => {
    // If text was selected in the iframe, it should handle replacing it with newText.
    // If no text was selected, newText will be inserted at the current caret.
    insertContentAtPoint(newText); // Changed from sendToPreview
    setShowAIModal(false);
    setShowHumanizeModal(false);
    setTextForAction("");
    setIsTextSelected(false);
  };

  const handleContentUpdate = (newContent) => {
    setContent(newContent);
  };

  const handleUndo = () => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (win) {
      win.postMessage({ type: "editor-command", command: "undo" }, "*");
      focusPreviewPreserve(); // Keep focus on the editor after command
    }
  };

  const handleRedo = () => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (win) {
      win.postMessage({ type: "editor-command", command: "redo" }, "*");
      focusPreviewPreserve(); // Keep focus on the editor after command
    }
  };

  // Add: copy HTML to clipboard and open Google Docs
  const openInGoogleDocs = async () => {
    // Trigger save with a special "google_docs" action
    await savePost('published', { useGoogleDocs: true });
  };

  // NEW: handle publishing to default CMS or Google Docs
  // This is now redundant with `handlePublishTo` and `handlePublish`
  // const handlePublishDefault = () => { ... } is removed from the outline.

  // Helper to apply branded HTML into editor (supports live streaming)
  const handleApplyBranded = (newHtml, streaming = false) => {
    const cleaned = typeof sanitizeLocalizedHtml === "function" ? sanitizeLocalizedHtml(newHtml) : String(newHtml || "");
    // Avoid feedback loop and push to preview immediately
    skipNextPreviewPushRef.current = true;
    setContent(cleaned);
    sendToPreview({ type: "set-html", html: cleaned });
  };

  // NEW: Add apply handler for TextEditorModal
  const handleApplyTextEdit = (html) => {
    insertContentAtPoint(html); // replaces selection or inserts at caret
    setShowTextEditor(false);
  };

  const currentUsername = currentPost?.user_name || currentWebhook?.user_name;

  // Derive Shopify publish fields from currentPost or Airtable webhook (auto-populate)
  const makeHandle = (s) => String(s || "").
    toLowerCase().
    replace(/&/g, "and").
    replace(/[^a-z0-9]+/g, "-").
    replace(/^-+|-+$/g, "");

  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
    const s = String(val).trim();
    if (!s) return [];
    if (s.includes(",")) return s.split(",").map((v) => v.trim()).filter(Boolean);
    return [s];
  };

  const getFromWebhook = (paths) => {
    let w = currentWebhook?.webhook_data;
    if (typeof w === "string") {
      try { w = JSON.parse(w); } catch { w = null; }
    }
    // Airtable-style nested { fields: {...} }
    for (const p of paths) {
      try {
        let x = w;
        for (const seg of p) {
          if (x == null) break;
          x = x[seg];
        }
        if (x != null && x !== "") return x;
      } catch { }
    }
    return null;
  };

  const derivedMetaDescription =
    currentPost?.meta_description ||
    getFromWebhook([["fields", "SEO Meta Description"], ["fields", "Meta description"], ["fields", "Meta Description"], ["SEO Meta Description"], ["Meta description"], ["Meta Description"]]) ||
    "";

  const derivedTags =
    (Array.isArray(currentPost?.tags) ? currentPost.tags : null) ||
    toArray(getFromWebhook([["fields", "Tags"], ["fields", "tags"], ["Tags"], ["tags"], ["fields", "Blog Tags"]])) ||
    [];

  const derivedSlug =
    currentPost?.slug && currentPost.slug.trim() ||
    getFromWebhook([["fields", "URL handle"], ["fields", "Slug"], ["URL handle"], ["Slug"]]) || "" ||
    makeHandle(title);

  const excerptForShopify = derivedMetaDescription || currentPost?.excerpt || "";

  const goBack = useCallback(() => {
    if (currentWebhook) {
      navigate(createPageUrl("Webhooks"));
    } else {
      navigate(createPageUrl("Content"));
    }
  }, [currentWebhook, navigate]);

  const openOptions = useCallback(() => {
    // This is a placeholder for a general 'options' menu.
    // For now, it will open the keyboard shortcuts cheatsheet.
    setShowCheatsheet(true);
  }, [setShowCheatsheet]);

  // Determines if the current user is a superadmin
  const isSuperadmin = currentUser && currentUser.is_superadmin === true;

  // NEW: Paste from Clipboard button and logic
  const handlePasteTopbar = () => {
    setAutoReadPaste(true);
    setShowPasteModal(true);
  };

  const handleCreateFromPaste = async ({ title, content, user_name }) => {
    // Create a new draft and open it in editor
    const saved = await BlogPost.create({
      title: title || "Pasted Content",
      content,
      status: "draft",
      user_name
    });
    if (saved?.id) {
      const newUrl = createPageUrl(`Editor?post=${saved.id}`);
      window.history.replaceState({}, "", newUrl);
      // Re-init editor for the new post
      initializeEditor();
    }
  };

  const allowedUsernames = Array.isArray(currentUser?.assigned_usernames) ? currentUser.assigned_usernames : [];
  const defaultBrand = currentPost?.user_name || currentWebhook?.user_name || allowedUsernames?.[0] || "";

  // Component for Publish Button, nested to access state directly
  const PublishButton = ({ onPublish, isPublishing }) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={onPublish}
          disabled={isPublishing || isSaving || isGeneratingSchema || !title || !content}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 text-sm font-medium inline-flex items-center gap-2 h-9 rounded-md shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-cyan-400"
          title={
            defaultPublish?.method ?
              `Publish to ${defaultPublish.label}${defaultPublishUsername ? ` for "${defaultPublishUsername}"` : ""}` :
              defaultPublishUsername ?
                `Publish (set default once for "${defaultPublishUsername}")` :
                "Publish (set a username default once)"
          }>

          <Send className="w-4 h-4" />
          {isGeneratingSchema ? 'Generating Schema...' : isPublishing ? 'Publishing...' : defaultPublish?.label ? `Publish to ${defaultPublish.label}` : 'Publish'}
        </Button>

        {showPublishDropdown &&
          <DropdownMenu open={publishMenuOpen} onOpenChange={(o) => {
            setPublishMenuOpen(o);
            if (o) loadCredentialsForUsername();
          }}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="neon-btn h-9"
                title="More publish options">

                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="dropdown-content min-w-[260px]">
              {["google_docs", "notion", "shopify", "webhook", "wordpress", "webflow"].map((prov) => {
                const creds = publishCredentials.filter((c) => c.provider === prov);
                if (prov === "google_docs") {
                  return (
                    <DropdownMenuItem key={prov} onClick={() => handlePublishTo("google_docs", null, "Google Docs")}>
                      Google Docs (copy & paste)
                    </DropdownMenuItem>);

                }
                if (creds.length === 0) return null;
                return creds.map((c) =>
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => handlePublishTo(prov, c.id, `${prov.charAt(0).toUpperCase() + prov.slice(1)} — ${c.name}`)}>

                    {prov === "webhook" ? "Webhook" : prov.charAt(0).toUpperCase() + prov.slice(1)} — {c.name}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem onClick={() => { setShowCMSModal(true); setPublishMenuOpen(false); }}>
                Manage connections…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      </div>);

  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-white/70">Preparing a fresh editor...</p>
        </div>
      </div>);

  }

  return (
    <EditorErrorBoundary>
      <div id="editor-neon" className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
        {/* THEME: Light (black on white) */}
        <style>{`
        #editor-neon {
          --bg: #ffffff;
          --surface: #ffffff;
          --card: #ffffff;
          --text: #0b1220;           /* darker slate for body text */
          --muted: #475569;          /* slate-600 */
          --border: rgba(2,6,23,0.12);
          --hover: rgba(2,6,23,0.04);
          --hover-strong: rgba(2,6,23,0.08);
          --ring: rgba(59,130,246,0.45);
        }
        #editor-neon .topbar { background: #ffffff; border-bottom: 1px solid var(--border); color: var(--text); }
        #editor-neon input, #editor-neon textarea, #editor-neon select {
          background-color: #ffffff; color: #0b1220; border-color: #e2e8f0;
        }
        /* Stronger placeholder contrast for readability */
        #editor-neon input::placeholder, #editor-neon textarea::placeholder {
          color: #64748b; /* slate-500 */
          opacity: 1;
        }
        #editor-neon input:hover, #editor-neon textarea:hover, #editor-neon select:hover {
          background-color: #ffffff; border-color: #cbd5e1;
        }
        #editor-neon input:focus, #editor-neon textarea:focus {
          outline: none; box-shadow: 0 0 0 2px var(--ring); border-color: #93c5fd;
        }
        #editor-neon .neon-btn {
          background-color: #f8fafc;
          color: #0b1220; border: 1px solid #e2e8f0;
        }
        #editor-neon .neon-btn:hover { background-color: #f1f5f9; border-color: #cbd5e1; }
        #editor-neon .radix-dropdown, #editor-neon .dropdown-content {
          background: #ffffff; color: #0b1220; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(2,6,23,0.08);
        }
        #editor-neon .chip {
          background: #f8fafc; color: #0b1220; border: 1px solid #e2e8f0;
        }

        /* Ensure the title value and its placeholder are always centered */
        #editor-neon .b44-title-input { text-align: center !important; }
        #editor-neon .b44-title-input::placeholder { text-align: center; }
      `}</style>

        {/* Light theme for portaled modals opened from Editor */}
        <style>{`
          .b44-modal {
            backdrop-filter: blur(10px);
            background: #ffffff !important;
            color: #0b1220 !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 12px 40px rgba(2,6,23,0.12);
          }
          .b44-modal .bg-white\\/10 { background-color: #ffffff !important; }
          .b44-modal .border-white\\/20 { border-color: #e2e8f0 !important; }
          .b44-modal .text-white { color: #0b1220 !important; }
          .b44-modal input, .b44-modal textarea, .b44-modal select {
            background-color: #ffffff !important; color: #0b1220 !important; border-color: #e2e8f0 !important;
          }
          .b44-modal .TabsList, .b44-modal [role="tablist"] {
            background-color: #f8fafc !important;
          }
        `}</style>

        {/* Subtle neon-white background glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-24 -right-20 w-[680px] h-[680px] rounded-full blur-3xl opacity=15"
            style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)" }} />
          <div className="absolute bottom-[-180px] left-[-120px] w-[560px] h-[560px] rounded-full blur-3xl opacity=10"
            style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.16), rgba(255,255,255,0) 72%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-3xl opacity=10"
            style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.12), rgba(255,255,255,0) 70%)" }} />
        </div>

        <div className="min-h-screen flex flex-col relative z-10">
          {/* Top bar (sticky) */}
          <div className="sticky top-0 topbar shadow-2xl z-[200]">
            <div className="bg-white px-6 py-4 relative">
              <div
                className="mx-auto"
                style={{ width: `${deviceWidth}px`, maxWidth: "100%" }}>

                {/* UPDATED: single compact toolbar row */}
                <div className="overflow-x-auto -mx-2 px-2 hide-scrollbar">
                  <div className="flex items-center gap-2 justify-start min-w-max flex-wrap">
                    {/* BACK button now in-flow and responsive */}
                    <Button
                      onClick={goBack}
                      variant="ghost"
                      size="icon"
                      className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 mr-2"
                      title="Back to Content Feed">

                      <ArrowLeft className="w-5 h-5" />
                    </Button>


                    <div className="hidden sm:flex items-center gap-1 mr-1">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setPreviewDevice("mobile")}
                        className={
                          previewDevice === "mobile" ?
                            "bg-slate-900 text-white border border-slate-900 hover:bg-slate-800" :
                            "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50"
                        }
                        title="Mobile">

                        <Smartphone className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setPreviewDevice("tablet")}
                        className={
                          previewDevice === "tablet" ?
                            "bg-slate-900 text-white border border-slate-900 hover:bg-slate-800" :
                            "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50"
                        }
                        title="Tablet">

                        <TabletIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setPreviewDevice("laptop")}
                        className={
                          previewDevice === "laptop" ?
                            "bg-slate-900 text-white border border-slate-900 hover:bg-slate-800" :
                            "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50"
                        }
                        title="Laptop">

                        <Laptop className="w-4 h-4" />
                      </Button>
                    </div>

                    <FontSelector selectedFont={selectedFont} onFontChange={setSelectedFont} />

                    <Button
                      onClick={() => setIsSEOSettingsOpen(true)}
                      variant="outline"
                      className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2">

                      <Globe className="w-4 h-4" />
                      SEO
                    </Button>

                    {/* NEW: Paste from Clipboard button (between SEO and Insert) */}
                    <Button
                      variant="outline"
                      className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2"
                      onClick={handlePasteTopbar}
                      title="Paste content from your clipboard">

                      <ClipboardIcon className="w-4 h-4" />
                      Paste
                    </Button>

                    {/* NEW: Editor tools in the same row */}
                    <EditorToolbar
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      quillRef={quillRef}
                      showImageLibrary={() => setShowImageLibrary(true)}
                      showLinkSelector={openLinkSelectorModal}
                      showPromotedProductSelector={() => setShowProductSelector(true)}
                      showCtaSelector={() => setShowCtaSelector(true)}
                      showEmailCaptureSelector={() => setShowEmailCaptureSelector(true)}
                      showTikTokSelector={() => setShowTikTokSelector(true)}
                      showYouTubeSelector={() => setShowYouTubeSelector(true)}
                      showTestimonialSelector={() => setShowTestimonialLibrary(true)}
                      showAskAIOptions={openAskAIOptions}
                      setShowWorkflowRunner={() => setShowWorkflowRunner(true)} />


                    <Button
                      onClick={() => {
                        if (!isTextSelected) setTextForAction(content || "");
                        setShowBrandIt(true);
                      }}>

                      <Palette className="w-4 h-4" />
                      Brand It
                    </Button>

                    <div className="flex-1" />

                    {isSuperadmin &&
                      <Button variant="outline" className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2" onClick={() => window.open(createPageUrl('InvoiceBuilder'), '_blank')}>
                        <FileTextIcon className="w-4 h-4" /> Invoices
                      </Button>
                    }
                    <Button variant="outline" className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2" onClick={() => savePost('draft')} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </Button>
                    <PublishButton onPublish={handlePublish} isPublishing={isPublishing} />
                    <Button variant="outline" className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50" onClick={openOptions} size="icon"><Settings className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* REMOVED: Double-click notice banner */}
          {/* Previously rendered a Pro‑Tip banner under the topbar. Intentionally removed per request. */}

          {/* SINGLE PANE LIVE PREVIEW (editable) */}
          <div className="flex-1 flex flex-col overflow-auto" key={`${currentWebhook?.id || 'nw'}-${currentPost?.id || 'np'}`}>
            <div className="border-b" style={{ borderColor: "var(--border)" }}>
              <div className="bg-slate-50 pt-3 pb-5 px-6">
                <div className="mt-3">
                  <Input
                    placeholder="Enter your blog post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="b44-title-input w-full text-[1.6rem] md:text-[1.95rem] font-bold h-14 bg-white text-slate-900 placeholder:text-slate-600 border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-300" />

                </div>

                <div className="relative mt-3 h-[70vh] w-full rounded-xl overflow-hidden" style={{ backgroundColor: "var(--hover)", border: "1px solid var(--border)" }}>
                  <div className="h-full bg-white text-slate-900 flex flex-col">
                    {/* Replace the notice bar with controls only when media is selected */}
                    {selectedMedia &&
                      <div className="bg-slate-100 text-white p-2 text-xs flex-shrink-0 flex items-center gap-3">
                        {selectedMedia.type !== 'audio' ?
                          <>
                            <span className="opacity-70 whitespace-nowrap">Media width</span>
                            {/* NEW: Draggable slider replaces plain input */}
                            <div className="flex items-center gap-3 flex-1">
                              <Slider
                                value={[selectedMedia.width ?? 100]}
                                min={10}
                                max={100}
                                step={1}
                                onValueChange={(val) => applyPreviewWidth(val[0])}
                                className="flex-1" />

                              <span className="w-12 text-right tabular-nums">
                                {selectedMedia.width ?? 100}%
                              </span>
                            </div>
                            <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
                            <button
                              onClick={() => applyPreviewAlign("left")}
                              className={`p-1.5 rounded ${selectedMedia.align === "left" ? "bg-emerald-600 text-white" : "neon-btn"}`}
                              title="Align left">

                              <AlignLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => applyPreviewAlign("center")}
                              className={`p-1.5 rounded ${selectedMedia.align === "center" ? "bg-emerald-600 text-white" : "neon-btn"}`}
                              title="Align center">

                              <AlignCenter className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => applyPreviewAlign("right")}
                              className={`p-1.5 rounded ${selectedMedia.align === "right" ? "bg-emerald-600 text-white" : "neon-btn"}`}
                              title="Align right">

                              <AlignRight className="w-4 h-4" />
                            </button>
                            <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
                          </> :

                          <span className="opacity-70">Audio selected (width/alignment not applicable)</span>
                        }

                        <button
                          onClick={handleDeleteSelected}
                          className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                          title="Delete selected block">

                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    }
                    <div className="flex-1 relative">
                      <LiveHtmlPreview
                        html={content}
                        onImageSelect={setSelectedMedia}
                        onHtmlChange={handlePreviewHtmlChange}
                        onSelectionChange={handlePreviewSelectionChange}
                        onPreviewClick={closeAllDropdowns}
                        onDoubleClickSelected={handleIframeDoubleClick}
                        onContextMenuSelected={handleIframeContextMenu} />

                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Floating 'Ask AI' bar */}
            {askAIBar.visible &&
              <AskAIFloatingBar
                x={askAIBar.x}
                y={askAIBar.y}
                onAskAI={() => openAskAIOptions(askAIBar.x, askAIBar.y)}
                onEdit={openInlineEditor}
                onClose={() => setAskAIBar((s) => ({ ...s, visible: false }))} />
            }

            {/* Inline formatting toolbar (appears after clicking Edit on the pill) */}
            {inlineToolbar.visible &&
              <InlineFormatToolbar
                x={inlineToolbar.x}
                y={inlineToolbar.y}
                onClose={() => setInlineToolbar({ visible: false, x: null, y: null })} />

            }

            {/* NEW: Compact quick menu near selection */}
            {quickMenu.visible &&
              <AskAIQuickMenu
                x={quickMenu.x}
                y={quickMenu.y}
                onPick={handleQuickPick}
                onClose={() => setQuickMenu({ visible: false, x: null, y: null })} />

            }

            <TextActionsModal
              isOpen={isActionsModalOpen}
              onClose={() => setIsActionsModal(false)}
              selectedText={textForAction}
              onActionSelect={handleActionSelect} />


            <SEOSettingsModal
              isOpen={isSEOSettingsOpen}
              onClose={() => setIsSEOSettingsOpen(false)}
              postData={currentPost}
              onSave={handleSEOSave} />


            <AIRewriterModal
              isOpen={showAIModal}
              onClose={() => setShowAIModal(false)}
              selectedText={textForAction}
              onRewrite={handleAIRewrite} />

            <HTMLCleanupModal
              isOpen={showHTMLCleanup}
              onClose={() => setShowHTMLCleanup(false)}
              currentContent={content}
              onContentUpdate={handleContentUpdate} />

            <YouTubeSelector
              isOpen={showYouTubeSelector}
              onClose={() => setShowYouTubeSelector(false)}
              onInsert={insertContentAtPoint} />

            <TikTokSelector
              isOpen={showTikTokSelector}
              onClose={() => setShowTikTokSelector(false)}
              onInsert={insertContentAtPoint} />

            <LinkSelector
              isOpen={showLinkSelector}
              onClose={() => setShowLinkSelector(false)}
              onInsert={handleLinkInsert}
              onOpenSitemap={() => setShowSitemapLinker(true)} // NEW
            />

            {/* Image Library (mount only when open to avoid idle-time crashes) */}
            {showImageLibrary &&
              <ImageLibraryModal
                isOpen={showImageLibrary}
                onClose={() => setShowImageLibrary(false)}
                onInsert={insertContentAtPoint}
                selectedText={textForAction}
                generateOnly={imageLibraryGenerateOnly}
                defaultProvider={imageLibraryDefaultProvider}
                onQueueJob={handleQueueJob} />

            }


            <PromotedProductSelector
              isOpen={showProductSelector}
              onClose={() => setShowProductSelector(false)}
              onInsert={handleInsertPromotedProduct} />

            <ProductFromUrlModal
              isOpen={showProductFromUrl}
              onClose={() => setShowProductFromUrl(false)}
              onInsert={handleInsertPromotedProduct} />

            <AIContentDetectionModal
              isOpen={showAIDetection}
              onClose={() => setShowAIDetection(false)}
              currentContent={textForAction || content} />

            <HumanizeTextModal
              isOpen={showHumanizeModal}
              onClose={() => setShowHumanizeModal(false)}
              selectedText={textForAction}
              onRewrite={handleAIRewrite} />

            <CalloutGeneratorModal
              isOpen={showCalloutGenerator}
              onClose={() => setShowCalloutGenerator(false)}
              selectedText={textForAction}
              onInsert={insertContentAtPoint}
              type="callout" />

            <CalloutGeneratorModal
              isOpen={showFactGenerator}
              onClose={() => setShowFactGenerator(false)}
              selectedText={textForAction}
              onInsert={insertContentAtPoint}
              type="fact" />

            <SitemapLinkerModal
              isOpen={showSitemapLinker}
              onClose={() => setShowSitemapLinker(false)}
              onLinkInsert={handleLinkInsert} />

            <TldrGeneratorModal
              isOpen={showTldrGenerator}
              onClose={() => setShowTldrGenerator(false)}
              selectedText={isTextSelected ? textForAction : content}
              onInsert={insertContentAtPoint} />

            <CtaSelector
              isOpen={showCtaSelector}
              onClose={() => setShowCtaSelector(false)}
              onInsert={insertContentAtPoint}
              // NEW: pass page context for AI CTA generation + username prefilter
              pageHtml={content}
              pageTitle={title}
              preferredUsername={currentUsername}
            />

            <EmailCaptureSelector
              isOpen={showEmailCaptureSelector}
              onClose={() => setShowEmailCaptureSelector(false)}
              onInsert={insertContentAtPoint} />

            <VideoGeneratorModal
              isOpen={showVideoGenerator}
              onClose={() => setShowVideoGenerator(false)}
              onInsert={insertContentAtPoint}
              seedPrompt={textForAction}
              onQueueJob={handleQueueJob} />


            <VideoLibraryModal
              isOpen={showVideoLibrary}
              onClose={() => setShowVideoLibrary(false)}
              onInsert={insertContentAtPoint} />


            <ContentScheduler
              post={currentPost}
              open={showScheduler}
              onClose={() => setShowScheduler(false)} />


            <KeyboardShortcuts
              isOpen={showCheatsheet}
              onClose={() => setShowCheatsheet(false)}
              shortcuts={shortcuts}
              onUpdateShortcut={updateShortcut}
              onReset={resetShortcuts} />


            <TestimonialLibraryModal
              isOpen={showTestimonialLibrary}
              onClose={() => setShowTestimonialLibrary(false)}
              onInsert={insertContentAtPoint} />


            <VariantLibraryModal
              isOpen={showVariantLibrary}
              onClose={() => setShowVariantLibrary(false)}
              onInsert={insertContentAtPoint} />


            <PublishToCMSModal
              isOpen={showCMSModal}
              onClose={() => setShowCMSModal(false)}
              title={title}
              html={content} />
            {/* Shopify publish modal (auto-populated from content + webhook) */}
            <ShopifyPublishModal
              isOpen={showShopifyModal}
              onClose={() => setShowShopifyModal(false)}
              username={currentPost?.user_name || currentWebhook?.user_name || null}
              processingId={currentPost?.processing_id || currentWebhook?.processing_id || null}
              title={title}
              html={content}
              defaultCredentialId={shopifyPreset.current.credentialId} // Use ref
              excerpt={excerptForShopify}
              slug={derivedSlug}
              tags={derivedTags}
              metaDescription={derivedMetaDescription}
              featuredImageUrl={currentPost?.featured_image || extractFirstImageUrl(content)} />



            <AudioFromTextModal
              isOpen={showAudioModal}
              onClose={() => setShowAudioModal(false)}
              selectedText={textForAction}
              onInsert={insertContentAtPoint}
              onQueueJob={handleQueueAudioJob} />


            <EditorAmazonImportModal
              isOpen={showAmazonImport}
              onClose={() => setShowAmazonImport(false)}
              onInsert={insertContentAtPoint}
              currentUsername={currentPost && currentPost.user_name || currentWebhook && currentWebhook.user_name || ""} />


            {/* Localize modal (approve/reject) */}
            <LocalizeModal
              isOpen={showLocalize}
              onClose={() => setShowLocalize(false)}
              originalHtml={content}
              onApplyLocalized={(newHtml) => {
                // Replace the entire article content when approved
                const cleaned = sanitizeLocalizedHtml(newHtml); // NEW: strip ```html fences
                setContent(cleaned);
                // Immediately reflect in preview for snappier UX
                sendToPreview({ type: "set-html", html: cleaned });
                setShowLocalize(false);
              }} />


            <BrandItModal
              isOpen={showBrandIt}
              onClose={() => setShowBrandIt(false)}
              htmlContent={content}
              userName={currentUsername || ""}
              onApply={handleApplyBranded} />


            <AffilifyModal
              isOpen={showAffilify}
              onClose={() => setShowAffilify(false)}
              originalHtml={content}
              selectedText={isTextSelected ? textForAction : ""}
              onApply={handleApplyAffilify}
              onInsert={insertContentAtPoint} />


            <RunWorkflowModal
              isOpen={showWorkflowRunner}
              onClose={() => setShowWorkflowRunner(false)}
              currentHtml={content}
              onApply={(newHtml) => {
                // Reuse existing helper to apply and push to preview immediately
                const cleaned = typeof sanitizeLocalizedHtml === "function" ? sanitizeLocalizedHtml(newHtml) : String(newHtml || "");
                skipNextPreviewPushRef.current = true;
                setContent(cleaned);
                sendToPreview({ type: "set-html", html: cleaned });
              }} />

            {/* NEW: Paste modal instance */}
            <PasteContentModal
              isOpen={showPasteModal}
              onClose={() => { setShowPasteModal(false); setAutoReadPaste(false); }}
              allowedUsernames={allowedUsernames}
              defaultUsername={defaultBrand}
              onSubmit={handleCreateFromPaste}
              autoReadClipboard={autoReadPaste}
              initialRaw="" />

            {/* NEW: Text editor modal for basic formatting */}
            <TextEditorModal
              isOpen={showTextEditor}
              onClose={() => setShowTextEditor(false)}
              initialText={textForAction || ""}
              onApply={handleApplyTextEdit} />

            {/* FAQ Generator Modal */}
            <FaqGeneratorModal
              isOpen={showFaqGenerator}
              onClose={() => setShowFaqGenerator(false)}
              selectedText={isTextSelected ? textForAction : content}
              onInsert={insertContentAtPoint}
            />
          </div>
        </div>
      </div>
    </EditorErrorBoundary>);

}
