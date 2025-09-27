
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { Username } from "@/api/entities";
import { IntegrationCredential } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Edit3, Send, ArrowLeft, FileText, Globe, Loader2, Smartphone, Tablet as TabletIcon, Laptop, Monitor, Calendar as CalendarIcon, Trash2, Info, X, Wand2, Palette, Settings, FileText as FileTextIcon, Clipboard as ClipboardIcon, ChevronDown, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { publishToAirtable } from "@/api/functions";
import useKeyboardShortcuts from "@/components/hooks/useKeyboardShortcuts";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { securePublish } from "@/api/functions";
import { getKeiJob } from "@/api/functions";
import { getSunoStatus } from "@/api/functions";
import { generateElevenlabsTts } from "@/api/functions";
import { getMidjourneyStatus } from "@/api/functions";
import { getVideoStatus } from "@/api/functions";
import { ImageLibraryItem } from "@/api/entities";
import { GeneratedVideo } from "@/api/entities";
import { checkAndConsumeTokens } from "@/api/functions";
import { callFeatureEndpoint } from "@/api/functions";
import { Slider } from "@/components/ui/slider";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

import EditorToolbar from "../components/editor/EditorToolbar";
import AIRewriterModal from "../components/editor/AIRewriterModal";
import FontSelector from "../components/editor/FontSelector";
// REMOVED: import YouTubeSelector from "../components/editor/YouTubeSelector";
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
// REMOVED: import TikTokSelector from "../components/editor/TikTokSelector";
import VideoGeneratorModal from "../components/editor/VideoGeneratorModal";
import VideoLibraryModal from "../components/editor/VideoLibraryModal";
import LiveHtmlPreview from "@/components/html/LiveHtmlPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ContentScheduler from "../components/editor/ContentScheduler";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import TestimonialLibraryModal from "../components/editor/TestimonialLibraryModal";
import VariantLibraryModal from "../components/variants/VariantLibraryModal";
import PublishToCMSModal from "../components/editor/PublishToCMSModal";
import AskAIFloatingBar from "../components/editor/AskAIFloatingBar";
import AskAIQuickMenu from "../components/editor/AskAIQuickMenu";
import AudioFromTextModal from "../components/editor/AudioFromTextModal";
import EditorAmazonImportModal from "../components/editor/EditorAmazonImportModal";
import LocalizeModal from "../components/editor/LocalizeModal";
import ShopifyPublishModal from "../components/editor/ShopifyPublishModal";
import BrandItModal from "../components/editor/BrandItModal";
import AffilifyModal from "../components/editor/AffilifyModal";
import RunWorkflowModal from "../components/editor/RunWorkflowModal";
import PasteContentModal from "../components/content/PasteContentModal";
import TextEditorModal from "../components/editor/TextEditorModal";
import InlineFormatToolbar from "../components/editor/InlineFormatToolbar";
import FaqGeneratorModal from "../components/editor/FaqGeneratorModal";
import MediaLibraryModal from "../components/editor/MediaLibraryModal";

import { buildFaqAccordionHtml } from "@/components/editor/FaqAccordionBlock";
import { generateArticleFaqs } from "@/api/functions";
import { findSourceAndCite } from "@/api/functions";
import { agentSDK } from "@/agents";

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
            </div>);
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
  const [content, setContent] = useState("");
  const contentRef = useRef("");

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [currentWebhook, setCurrentWebhook] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const navigate = useNavigate();
  const location = useLocation();
  const [previewDevice, setPreviewDevice] = useState("laptop");
  const [priority, setPriority] = useState('medium');

  const [isActionsModalOpen, setIsActionsModal] = useState(false);
  const [textForAction, setTextForAction] = useState("");
  const [isTextSelected, setIsTextSelected] = useState(false);

  const [htmlMode, setHtmlMode] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const [showAIModal, setShowAIModal] = useState(false);
  // REMOVED: const [showYouTubeSelector, setShowYouTubeSelector] = useState(false);
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageLibraryGenerateOnly, setImageLibraryGenerateOnly] = useState(false);
  const [imageLibraryDefaultProvider, setImageLibraryDefaultProvider] = useState(undefined);
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
  const [calloutType, setCalloutType] = useState("callout");
  const [showCtaSelector, setShowCtaSelector] = useState(false);
  const [showEmailCaptureSelector, setShowEmailCaptureSelector] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  // REMOVED: const [showTikTokSelector, setShowTikTokSelector] = useState(false); // Reordered
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaLibraryInitialTab, setMediaLibraryInitialTab] = useState(undefined); // NEW STATE for MediaLibraryModal's initial tab
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTestimonialLibrary, setShowTestimonialLibrary] = useState(false);
  const [showVariantLibrary, setShowVariantLibrary] = useState(false);
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);
  const [showCMSModal, setShowCMSModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showAmazonImport, setShowAmazonImport] = useState(false);
  const [showLocalize, setShowLocalize] = useState(false);
  const [showBrandIt, setShowBrandIt] = useState(false);
  const [showAffilify, setShowAffilify] = useState(false);
  const [showFaqGenerator, setShowFaqGenerator] = useState(false);
  const [isRewritingTitle, setIsRewritingTitle] = useState(false);

  const [showWorkflowRunner, setShowWorkflowRunner] = React.useState(false);

  const skipNextPreviewPushRef = useRef(false);

  const resizeCommitTimerRef = React.useRef(null);

  const [backgroundJobs, setBackgroundJobs] = useState([]);
  const [showGoogleCreds, setShowGoogleCreds] = useState(false);

  const [defaultPublish, setDefaultPublish] = useState({ method: null, credentialId: null, label: null });
  const [defaultPublishUsername, setDefaultPublishUsername] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
  const [publishCredentials, setPublishCredentials] = useState([]);
  const [pendingAudioJobs, setPendingAudioJobs] = useState([]);

  const [showShopifyModal, setShowShopifyModal] = React.useState(false);
  const shopifyPreset = React.useRef({ credentialId: null });

  const insertLockRef = useRef(false);
  const insertSeqRef = useRef(1);
  const savingGuardRef = React.useRef(false);

  const [askAIBar, setAskAIBar] = useState({ visible: false, x: null, y: null });
  const [quickMenu, setQuickMenu] = useState({ visible: false, x: null, y: null });
  const [inlineToolbar, setInlineToolbar] = useState({ visible: false, x: null, y: null });

  const sessionKeyRef = React.useRef(null);

  const quillRef = useRef(null);

  const generatingSchemaRef = useRef(false);

  const [showPasteModal, setShowPasteModal] = React.useState(false);
  const [autoReadPaste, setAutoReadPaste] = React.useState(false);

  const insertedAudioUrlsRef = React.useRef(new Set());
  const insertedAudioJobKeysRef = React.useRef(new Set());

  const [showTextEditor, setShowTextEditor] = useState(false);

  const makeRandomSessionKey = () => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const initSessionKey = useCallback((opts = {}) => {
    const { postId = null, processingId = null } = opts;
    let key = null;

    if (postId) key = `post-${postId}`;
    else if (processingId) key = `wh-${processingId}`;
    else key = makeRandomSessionKey();

    sessionKeyRef.current = key;
    try { localStorage.setItem('b44_editor_session_key', key); } catch (_) { }
  }, []);

  useEffect(() => {
    const existing = (() => {
      try { return localStorage.getItem('b44_editor_session_key'); } catch (_) { return null; }
    })();
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    const webhookId = urlParams.get('webhook');
    if (postId) initSessionKey({ postId });
    else if (webhookId) initSessionKey({ processingId: webhookId });
    else if (existing) sessionKeyRef.current = existing;
    else initSessionKey();
  }, [initSessionKey]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedMedia) return;

    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;

    if (win) {
      win.postMessage({ type: 'delete-element', id: selectedMedia.id }, '*');
      setTimeout(() => win.postMessage({ type: 'request-html' }, '*'), 50);
    }

    setSelectedMedia(null);
  }, [selectedMedia, setSelectedMedia]);

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedMedia) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [selectedMedia, handleDeleteSelected]);

  const sanitizeLocalizedHtml = (s) => {
    if (s == null) return "";
    let out = String(s).trim();

    const fenced = out.match(/^\s*```(?:html|HTML)?\s*([\s\S]*?)\s*```[\s]*$/);
    if (fenced) out = fenced[1];

    out = out.replace(/^\s*```(?:html|HTML)?\s*/i, "");
    out = out.replace(/\s*```$/i, "");

    out = out.replace(/```(?:html|HTML)?/gi, "");

    return out.trim();
  };

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

  const sendToPreview = useCallback((msg) => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (win) {
      win.postMessage(msg, "*");
    }
  }, []);

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
            style.textContent = 'img[data-b44-type="image"],img[data-b44-id],.youtube-video-container[data-b44-id],blockquote.tiktok-embed,.b44-promoted-product,.b44-callout,.b44-tldr,.b44-fact-card,.b44-testimonial{padding-top:1em;padding-bottom:1em;box-sizing:border-box;display:block;} .b44-audio-inline{padding-top:0;padding-bottom:0;}';
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
              } catch (_) { }
            }, true);
          })();

          // NEW: Ensure TikTok embeds work properly
          (function ensureTikTokEmbeds() {
            // Function to load and execute TikTok embed script
            const loadTikTokScript = () => {
              if (window.tiktokEmbedInitialized) return;
              
              const existingScript = doc.querySelector('script[src*="tiktok.com/embed.js"]');
              if (existingScript) existingScript.remove();
              
              const script = doc.createElement('script');
              script.async = true;
              script.src = 'https://www.tiktok.com/embed.js';
              script.onload = () => {
                window.tiktokEmbedInitialized = true;
                // Process any existing TikTok embeds
                if (window.tiktokEmbed && typeof window.tiktokEmbed.lib === 'object') {
                  window.tiktokEmbed.lib.render(doc.body);
                }
              };
              doc.head.appendChild(script);
            };

            // Initial load
            loadTikTokScript();

            // Re-process TikTok embeds when new content is added
            const observer = new MutationObserver((mutations) => {
              let foundTikTok = false;
              for (const mutation of mutations) {
                for (const node of mutation.addedNodes || []) {
                  if (node.nodeType === 1 && 
                      (node.matches && node.matches('blockquote.tiktok-embed') || 
                       node.querySelector && node.querySelector('blockquote.tiktok-embed'))) {
                    foundTikTok = true;
                    break;
                  }
                }
                if (foundTikTok) break;
              }
              
              if (foundTikTok) {
                setTimeout(() => {
                  if (window.tiktokEmbed && typeof window.tiktokEmbed.lib === 'object') {
                    window.tiktokEmbed.lib.render(doc.body);
                  } else {
                    loadTikTokScript();
                  }
                }, 100);
              }
            });
            
            observer.observe(doc.body, { childList: true, subtree: true });
          })();

          const saveSelection = () => {
            try {
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                state.savedRange = sel.getRangeAt(0).cloneRange();
              }
            } catch (_) { }
          };

          const restoreSelection = () => {
            try {
              const sel = window.getSelection();
              sel.removeAllRanges();
              if (state.savedRange) {
                sel.addRange(state.savedRange);
              }
            } catch (_) { }
          };

          const focusEditable = () => {
            try {
              if (!doc.body.getAttribute('contenteditable')) {
                doc.body.setAttribute('contenteditable', 'true');
              }
              doc.body.focus();
            } catch (_) { }
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
            try { doc.execCommand('styleWithCSS', false, true); } catch (_) { }

            let ok = false;
            try {
              const c = cmd === 'hiliteColor' ? 'hiliteColor' : (cmd === 'backColor' ? 'backColor' : 'foreColor');
              ok = doc.execCommand(c, false, value || (cmd === 'foreColor' ? '#000000' : '#ffff00'));
            } catch (_) { }

            if (!ok) {
              // Fallback to span wrapping
              if (cmd === 'foreColor') wrapSelectionWithSpan('color', value || '#000000');
              else wrapSelectionWithSpan('backgroundColor', value || '#000000');
            }

            // Notify parent about html changes
            window.parent.postMessage({ type: "html-updated", html: doc.body.innerHTML }, "*");
          };

          const dehighlight = () => {
            if (state.selectedEl) {
              try {
                state.selectedEl.style.removeProperty("outline");
                state.selectedEl.style.removeProperty("outline-offset");
              } catch (_) { }
              state.selectedEl = null;
              window.parent.postMessage({ type: 'media-deselected' }, '*');
            }
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
              el.dataset.b44Id = 'el-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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
            // NEW: treat testimonials as their own selectable type
            if (el.matches(".b44-testimonial, .b44-testimonial *")) return "testimonial";
            return el.dataset?.b44Type || "unknown";
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

            // NEW: Testimonial block
            const testimonial = node.closest?.(".b44-testimonial");
            if (testimonial) return testimonial;

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

                  const mediaType = getMediaType(container);
                  window.parent.postMessage({
                    type: 'media-selected',
                    id,
                    mediaType,
                    width: mediaType === 'video' ? 100 : widthPct, // Video width is always 100% (container width)
                  }, '*');
                });

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
            // NEW: Testimonial handle
            doc.querySelectorAll('.b44-testimonial').forEach(addHandle);

            // Observe for dynamically added embeds/blocks
            const mo = new MutationObserver((mutations) => {
              for (const m of mutations) {
                for (const node of m.addedNodes || []) {
                  if (node.nodeType !== 1) continue;
                  try {
                    if (node.matches && (node.matches('.youtube-video-container') || node.matches('blockquote.tiktok-embed') || node.matches('.b44-audio-inline') || node.matches('.b44-tldr') || node.matches('.b44-faq-block') || node.matches('.b44-testimonial'))) {
                      addHandle(node);
                    }
                    if (node.querySelector) {
                      node.querySelectorAll('.youtube-video-container, blockquote.tiktok-embed, .b44-audio-inline, .b44-tldr, .b44-faq-block, .b44-testimonial').forEach(addHandle);
                    }
                  } catch (_) { }
                }
              }
            });
            mo.observe(doc.body, { childList: true, subtree: true });
          };

          // Delegated click handler (capture phase to be reliable)
          const onClick = (e) => {
            const el = findSelectable(e.target);
            if (!el) {
              dehighlight(); // Dehighlight if no selectable element is clicked
              return;
            }
            const id = ensureId(el);
            highlight(el);

            // Compute width (percentage if set) and align hints
            let widthPct = 100;
            const styleWidth = el.style?.width || "";
            const m = String(styleWidth).match(/(\\d+)%/);
            if (m) { widthPct = parseInt(m[1], 10); }

            const mediaType = getMediaType(el);
            window.parent.postMessage({
              type: "media-selected",
              id,
              mediaType,
              width: mediaType === 'video' ? 100 : widthPct, // Video width is always 100% (container width)
            }, "*");
            console.log("[B44] selection-fix: media-selected", { id, mediaType, width: widthPct });
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
                try { doc.execCommand('styleWithCSS', false, !!d.value); } catch (_) { }
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
              
              // Generic handler for standard text formatting commands
              const supportedCommands = [
                "bold", "italic", "underline", "strikeThrough", "formatBlock",
                "insertUnorderedList", "insertOrderedList", "removeFormat",
                "justifyLeft", "justifyCenter", "justifyRight", "justifyFull"
              ];

              if (supportedCommands.includes(cmd)) {
                try {
                  focusEditable();
                  restoreSelection();
                  doc.execCommand(cmd, false, d.value || null);
                  // Notify parent that HTML has changed so it can be saved
                  window.parent.postMessage({ type: "html-updated", html: doc.body.innerHTML }, "*");
                } catch (e) {
                  console.error("[B44] execCommand failed for:", cmd, e);
                }
                return;
              }
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
                  try { el.style.setProperty(k, v, "important"); } catch (_) { }
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

  const insertContent = useCallback((htmlContent, mode = null) => {
    if (insertLockRef.current) return;
    insertLockRef.current = true;
    setTimeout(() => { insertLockRef.current = false; }, 300);

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

  const insertContentAtPoint = useCallback(function insertContentAtPoint(payload) {
    if (typeof payload === "string") {
      insertContent(payload, null);
    } else if (payload && typeof payload === "object" && payload.html) {
      insertContent(String(payload.html), payload.mode || null);
    }
  }, [insertContent]);

  const handleImageInsertFromLibrary = (image) => {
    if (!image || !image.url) return;
    const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const html = `<img data-b44-id="${elId}" data-b44-type="image" src="${image.url}" alt="${image.alt_text || ""}" style="max-width:100%; height:auto; border-radius: 8px;" />`;
    insertContentAtPoint({ html, mode: isTextSelected ? 'after-selection' : 'at-caret' });
  };

  const isLikelyAudioUrl = (u) => typeof u === "string" && /(\.mp3|\.wav|\.m4a|\.aac|\.ogg)(\?|$)/i.test(u);

  const checkAudioUrl = async (u) => {
    if (!u) return false;
    try {
      const head = await fetch(u, { method: "HEAD" });
      if (head.ok) {
        const ct = head.headers.get("content-type") || "";
        const len = Number(head.headers.get("content-length") || "0");
        if ((ct.startsWith("audio/") || ct === "application/octet-stream") && len > 0) return true;
      }
      const probe = await fetch(u, { headers: { Range: "bytes=0-0" } });
      if (probe.ok) {
        const ct = probe.headers.get("content-type") || "";
        if (ct.startsWith("audio/") || ct === "application/octet-stream") return true;
      }
    } catch (_) { }
    return false;
  };

  const handleQueueAudioJob = (job) => {
    if (!job) return;

    const key = JSON.stringify({
      p: job.provider, t: job.type, v: job.voice || "", f: job.format || "",
      x: (job.text || "").slice(0, 40)
    });

    setPendingAudioJobs((prev) => {
      const exists = prev.some((j) =>
        JSON.stringify({ p: j.provider, t: j.type, v: j.voice || "", f: j.format || "", x: (j.text || "").slice(0, 40) }) === key
      );
      if (exists || insertedAudioJobKeysRef.current.has(key)) return prev;

      return [...prev, { ...job, queuedAt: Date.now() }];
    });

    toast.message("Generating audio in background… it will be inserted automatically when ready.");
  };

  const handleQueueJob = (job) => {
    if (job && job.jobId && !job.taskId) {
      job.taskId = job.jobId;
      delete job.jobId;
    }
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
    if (job.taskId) {
      toast.message(`${job.type === 'image' ? 'Image' : 'Video'} generation started in the background.`);
    }
  };

  const buildAudioUrlFromEleven = async (responseData) => {
    const data = responseData.data;

    if (!data || !data.success || !data.audio_base64) {
      const errorMsg = data?.error || 'Invalid audio data received from server.';
      throw new Error(errorMsg);
    }

    const byteCharacters = atob(data.audio_base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: data.mime_type || 'audio/mpeg' });

    return URL.createObjectURL(blob);
  };

  useEffect(() => {
    if (!pendingAudioJobs.length) return;

    const interval = setInterval(async () => {
      const updates = await Promise.all(pendingAudioJobs.map(async (j) => {
        try {
          const attempts = (j.attempts || 0) + 1;

          if (j.provider === "elevenlabs" && !j.done) {
            const response = await generateElevenlabsTts({ text: j.text, format: j.format || "mp3_44100_128", voice: j.voice });
            const url = await buildAudioUrlFromEleven(response);
            return { ...j, attempts, url, done: true, success: true };
          }

          if (j.provider === "kei" && j.jobId && !j.done) {
            const { data } = await getKeiJob({ job_id: j.jobId });
            const u = data?.url || data?.data?.url || data?.audio_url || data?.data?.audio_url || data?.output?.url || null;
            const st = (data?.status || "").toString().toUpperCase();

            if (u) {
              const ready = await checkAudioUrl(u);
              if (ready) return { ...j, attempts, url: u, done: true, success: true };
            }

            if (st === "ERROR" || st === "FAILED") return { ...j, attempts, done: true, success: false, error: "Audio generation failed." };

            if (attempts > 150) return { ...j, attempts };
          }

          if (j.provider === "suno" && j.jobId && !j.done) {
            const { data } = await getSunoStatus({ taskId: j.jobId });
            const track = Array.isArray(data?.tracks) ? data.tracks[0] : null;
            const u = track?.audio_url || track?.url || data?.audio_url || data?.url || data?.result_url || null;
            const st = (data?.status || "").toString().toUpperCase();

            if (u) {
              const ready = await checkAudioUrl(u);
              if (ready) return { ...j, attempts, url: u, done: true, success: true };
            }

            if (st === "ERROR" || st === "FAILED") {
              return { ...j, attempts, done: true, success: false, error: "Suno generation failed." };
            }

            if (attempts > 150) return { ...j, attempts };
            return { ...j, attempts };
          }

          return { ...j, attempts };
        } catch (e) {
          return { ...j, done: true, success: false, error: e?.message || "Audio job error." };
        }
      }));

      let changed = false;
      const nextPendingAudioJobs = updates.filter((j) => {
        if (j.done && !j.inserted) {
          changed = true;
          if (j.success && j.url) {
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
        return !j.inserted;
      });

      if (changed || nextPendingAudioJobs.length !== pendingAudioJobs.length) {
        setPendingAudioJobs(nextPendingAudioJobs);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [pendingAudioJobs, insertContentAtPoint, contentRef]);

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

            if (job.url && !job.taskId) {
              isDone = true;
              resultUrl = job.url;
            } else
              if (job.provider === 'midjourney' && job.type === 'image') {
                const { data } = await getMidjourneyStatus({ taskId: job.taskId });
                const successFlag = data?.data?.successFlag;
                if (successFlag === 1) {
                  isDone = true;
                  resultUrl = data?.data?.resultInfoJson?.resultUrls?.[0] || null;
                } else if (successFlag === 2) {
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

            if (isDone) {
              jobsChanged = true;
              if (!hasFailed && resultUrl) {
                if (job.type === 'image') {
                  const uname = currentPost?.user_name || currentWebhook?.user_name || "default";
                  await ImageLibraryItem.create({ url: resultUrl, alt_text: job.altText || job.prompt, source: 'ai_generated', user_name: uname });

                  const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                  const html = `<img data-b44-id="${elId}" data-b44-type="image" src="${resultUrl}" alt="${job.altText || job.prompt}" style="max-width:100%; height:auto; border-radius: 8px;" />`;
                  insertContentAtPoint({ html, mode: job.insertMode });
                  toast.success('Image generated and inserted!');
                } else if (job.type === 'video') {
                  const uname = currentPost?.user_name || currentWebhook?.user_name || "default";
                  await GeneratedVideo.create({ url: resultUrl, prompt: job.prompt, model: job.modelName, user_name: uname });

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

  const { consumeTokensForFeature } = useTokenConsumption();
  const { enabled: isAiTitleRewriteEnabled } = useFeatureFlag('ai_title_rewrite', { currentUser });

  const handleRewriteTitle = async () => {
    if (!content || !isAiTitleRewriteEnabled) {
      toast.message("Please add content to the article before rewriting the title.");
      return;
    }

    const result = await consumeTokensForFeature('ai_title_rewrite');
    if (!result.success) {
      return;
    }

    setIsRewritingTitle(true);
    try {
      const conversation = await agentSDK.createConversation({
        agent_name: "seo_title_rewriter",
      });

      if (!conversation?.id) {
        throw new Error("Could not start a conversation with the AI agent.");
      }

      const truncatedContent = content.substring(0, 15000);
      const prompt = `Article Content:\n${truncatedContent}\n\nOriginal Title: ${title}`;

      await agentSDK.addMessage(conversation, {
        role: "user",
        content: prompt,
      });

      // Improved polling with better error handling
      const pollTimeout = 90000; // Increased to 90 seconds
      const pollInterval = 2000; // Check every 2 seconds
      const startTime = Date.now();

      let newTitle = "";
      let attempts = 0;
      const maxAttempts = Math.ceil(pollTimeout / pollInterval);

      while (Date.now() - startTime < pollTimeout && attempts < maxAttempts) {
        attempts++;

        try {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));

          const updatedConversation = await agentSDK.getConversation(conversation.id);

          if (!updatedConversation || !updatedConversation.messages) {
            console.log(`Poll attempt ${attempts}: No messages found`);
            continue;
          }

          const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

          if (lastMessage?.role === 'assistant') {
            // Check if message is complete or has content
            if (lastMessage.is_complete === true || lastMessage.content) {
              let content = lastMessage.content || "";

              // Clean up the response - remove quotes, extra whitespace, and markdown
              newTitle = content
                .replace(/^["']|["']$/g, "") // Remove surrounding quotes
                .replace(/^\*\*|\*\*$/g, "") // Remove markdown bold
                .replace(/^#+\s*/, "") // Remove markdown headers
                .replace(/\n+/g, " ") // Replace line breaks with spaces
                .trim();

              if (newTitle && newTitle.length > 5) { // Minimum viable title length
                console.log(`Title generated successfully: ${newTitle}`);
                break;
              }
            }
          }

          console.log(`Poll attempt ${attempts}/${maxAttempts}: Waiting for response...`);

        } catch (pollError) {
          console.error(`Poll attempt ${attempts} failed:`, pollError);
          // Continue polling even if one attempt fails
        }
      }

      if (newTitle && newTitle.length > 5) {
        setTitle(newTitle);
        toast.success("AI successfully rewrote the title!");

        // Dispatch token balance update event
        window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', {
          detail: {
            newBalance: result.balance - result.consumed,
            consumed: result.consumed,
            featureUsed: 'ai_title_rewrite'
          }
        }));
      } else {
        // More specific error messages
        if (attempts >= maxAttempts) {
          throw new Error("Title generation timed out after maximum attempts. Please try again.");
        } else {
          throw new Error("AI did not generate a valid title. Please try again or check your content.");
        }
      }

    } catch (error) {
      console.error("AI title rewrite error:", error);

      // More helpful error messages for users
      let userMessage = "Failed to rewrite title.";

      if (error.message.includes("timeout") || error.message.includes("timed out")) {
        userMessage = "Title generation is taking longer than expected. Please try again.";
      } else if (error.message.includes("conversation")) {
        userMessage = "Could not connect to AI service. Please try again.";
      } else if (error.message.includes("valid title")) {
        userMessage = "AI couldn't generate a better title. Your current title might already be optimized.";
      }

      toast.error(userMessage);
    } finally {
      setIsRewritingTitle(false);
    }
  };

  const handleCiteSources = async () => {
    const result = await consumeTokensForFeature("ai_cite_sources");
    if (!result.success) {
      return;
    }

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
          const inline = ` <sup class="b44-citation" style="font-size:0.8em;"><a href="${data.url}" target="_blank" rel="noopener noreferrer">[source]</a></sup>`;
          insertContentAtPoint({ html: inline, mode: "after-selection" });
          toast.success("Citation added.");
        } else {
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

      toast.error(data?.error || "Could not find a reliable citation.");
    } catch (error) {
      toast.error("Citations service failed. Please try again.");
    }
  };

  const handleIframeContextMenu = (payload) => {
    const t = (payload?.text || "").trim();
    setTextForAction(t);
    setIsTextSelected(!!t);

    setQuickMenu({ visible: false, x: null, y: null });
    setAskAIBar({ visible: true, x: payload.x, y: payload.y });
  };

  const handleIframeDoubleClick = (payload) => {
    const t = (payload?.text || "").trim();
    setTextForAction(t);
    setIsTextSelected(!!t);

    setQuickMenu({ visible: false, x: null, y: null });
    setAskAIBar({ visible: true, x: payload.x, y: payload.y });
  };

  const openAskAIOptions = (x, y) => {
    setAskAIBar({ visible: false, x: null, y: null });
    setQuickMenu({ visible: true, x, y });
  };

  const openInlineEditor = React.useCallback(() => {
    setInlineToolbar((prev) => ({ ...prev, visible: true, x: askAIBar.x, y: askAIBar.y }));
    setAskAIBar({ visible: false, x: null, y: null });
  }, [askAIBar]);

  const handleApplyAffilify = (newHtml) => {
    const cleaned = sanitizeLocalizedHtml ? sanitizeLocalizedHtml(newHtml) : String(newHtml || "");
    skipNextPreviewPushRef.current = true;
    setContent(cleaned);
    sendToPreview({ type: "set-html", html: cleaned });
  };

  const handleMediaInsert = (media) => {
    // It's video HTML
    if (typeof media === 'string') {
        insertContentAtPoint({ html: media, mode: 'at-caret' });
    }
    // It's an image object from ImageLibraryItem
    else if (typeof media === 'object' && media.url && media.source) {
        handleImageInsertFromLibrary(media);
    }
    setShowMediaLibrary(false); // Close the modal after insertion
    setMediaLibraryInitialTab(undefined); // Reset initial tab on close
  };

  const openImageLibrary = () => {
    setImageLibraryDefaultProvider(undefined);
    setImageLibraryGenerateOnly(false);
    setShowImageLibrary(true);
  };

  const handleQuickPick = (actionId) => {
    setQuickMenu({ visible: false, x: null, y: null });

    switch (actionId) {
      case "tldr":
      case "key-takeaway":
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
        consumeTokensForFeature('ai_generate_video').then(result => {
          if (result.success) setShowVideoGenerator(true);
        });
        return;

      case "sitemap-link":
        consumeTokensForFeature('ai_sitemap_link').then(result => {
          if (result.success) {
            sendToPreview({ type: "editor-command", command: "saveSelection" });
            setShowSitemapLinker(true);
          }
        });
        return;

      case "cite":
      case "cite-sources":
        handleCiteSources();
        return;

      case "faq":
        setShowFaqGenerator(true);
        return;

      case "localize":
        setShowLocalize(true);
        return;
      // Removed 'youtube' quick pick case as per merge into Media Library.
      case "tiktok":
        consumeTokensForFeature('ai_tiktok').then(result => {
          if (result.success) {
            setMediaLibraryInitialTab("tiktok"); // Open MediaLibraryModal to the TikTok tab
            setShowMediaLibrary(true);
          }
        });
        return;
      case "audio": {
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
        consumeTokensForFeature('ai_brand_it').then(result => {
          if(result.success) setShowBrandIt(true);
        });
        return;
      case "affilify":
        consumeTokensForFeature('ai_affilify').then(result => {
          if (result.success) setShowAffilify(true);
        });
        return;
      case "ai-agent":
        setShowWorkflowRunner(true);
        return;
      case "media-library":
        setMediaLibraryInitialTab(undefined); // Ensure default tab is opened
        setShowMediaLibrary(true);
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
        setShowLinkSelector(true);
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
        console.warn("Unhandled quick pick action:", actionId);
    }
  };

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

  const closeAllDropdowns = () => {
    window.dispatchEvent(new CustomEvent('b44-close-dropdowns'));
    setPublishMenuOpen(false);
    setAskAIBar((s) => ({ ...s, visible: false }));
    setQuickMenu((s) => ({ ...s, visible: false }));
    setInlineToolbar((s) => ({ ...s, visible: false, x: null, y: null }));
  };

  const deviceWidth = (() => {
    if (previewDevice === "mobile") return 390;
    if (previewDevice === "tablet") return 820;
    return 1280;
  })();

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
  }, []);
  const loadPostContent = useCallback(async (postId) => {
    try {
      const found = await BlogPost.filter({ id: postId });
      if (!found || found.length === 0) {
        toast.error("Post not found");
        setTitle("");
        setContent("");
        setCurrentPost(null);
        setCurrentWebhook(null);
        setPriority('medium');
        sendToPreview({ type: "set-html", html: "" });
        return;
      }
      const post = found[0];
      setCurrentPost(post);
      setTitle(post.title || "");
      setContent(post.content || "");
      setPriority(post.priority || 'medium');
      sendToPreview({ type: "set-html", html: post.content || "" });
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
      setPriority('medium');
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
        setPriority('medium');
        sendToPreview({ type: "set-html", html: "" });
        return;
      }
      const webhook = fetchedWebhooks[0];

      if (!webhook.processing_id) {
        await WebhookReceived.update(webhook.id, { processing_id: webhook.id });
        webhook.processing_id = webhook.id;
      }

      setCurrentWebhook(webhook);
      setTitle(webhook.title || "");
      setContent(webhook.content || "");
      sendToPreview({ type: "set-html", html: webhook.content || "" });
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
          setPriority(latestPost.priority || 'medium');
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
      setPriority('medium');
      sendToPreview({ type: "set-html", html: "" });
    }
  }, [initSessionKey, sendToPreview, setContent, setCurrentPost, setCurrentWebhook, setPriority, setTitle]);

  const initializeEditor = useCallback(async () => {
    setIsLoading(true);
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
    insertedAudioUrlsRef.current.clear();
    insertedAudioJobKeysRef.current.clear();


    const urlParams = new URLSearchParams(window.location.search);
    const importHtml = urlParams.get('importHtml');
    const postId = urlParams.get('post');
    const webhookId = urlParams.get('webhook');

    if (!postId && !webhookId && importHtml !== '1') {
      sendToPreview({ type: "set-html", html: "" });
    }

    try {
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
      sendToPreview({ type: "set-html", html: "" });
    } finally {
      setIsLoading(false);
    }
  }, [loadPostContent, loadWebhookContent, sendToPreview, setContent, setCurrentPost, setCurrentWebhook, setIsLoading, setIsTextSelected, setPriority, setTextForAction, setTitle]);

  useEffect(() => {
    initializeEditor();
  }, [location.search, initializeEditor]);

  React.useEffect(() => {
    const onMsg = (e) => {
      if (e?.data?.type === 'b44-ready') {
        setTimeout(() => {
          sendToPreview({ type: "set-html", html: content || "" });
        }, 30);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [content, sendToPreview]);

  React.useEffect(() => {
    if (!isLoading) {
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

  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e?.data;
      if (d?.type === "media-selected") {
        // Ensure video types are properly categorized
        let mediaType = d.mediaType;
        if (d.mediaType === "video" || mediaType === "iframe" || mediaType === "youtube" || mediaType === "tiktok") {
          mediaType = "video";
        }

        setSelectedMedia({
          id: d.id,
          type: mediaType,
          width: d.width || 100
        });
      } else if (d?.type === "media-deselected") {
        setSelectedMedia(null);
      } else if (d?.type === "html-updated" && typeof d.html === "string") {
        skipNextPreviewPushRef.current = true;
        setContent(d.html);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

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
        setDefaultPublishUsername(uname);
      }
    };
    loadDefaults();
    return () => { isMounted = false; };
  }, [currentPost, currentWebhook]);

  const extractFirstImageUrl = (html) => {
    const m = String(html || "").match(/<img[^>]*src=["']([^"']+)["']/i);
    return m && m[1] ? m[1] : "";
  };

  const loadCredentialsForUsername = async () => {
    const uname = currentPost && currentPost.user_name || currentWebhook && currentWebhook.user_name || null;
    if (!uname) {
      setPublishCredentials([]);
      return;
    }
    const creds = await IntegrationCredential.filter({ user_name: uname });
    setPublishCredentials(creds || []);
  };

  const publishToDefaultNow = async (postToPublish) => {
    const uname = defaultPublishUsername;
    const provider = postToPublish._overrideProvider || defaultPublish.method;
    const credentialId = postToPublish._overrideCredentialId || defaultPublish.credentialId;
    const label = postToPublish._overrideLabel || defaultPublish.label;

    if (!provider) {
      toast.message(uname ?
        `No default publish method set for username "${uname}". Choose a provider once, then it'll be one‑click.` :
        "No username context found for this post. Set a username or choose a provider once."
      );
      setShowCMSModal(true);
      return;
    }

    if (provider === "google_docs") {
      return;
    }

    if (provider === "shopify") {
      shopifyPreset.current = { credentialId: credentialId || null };
      setShowShopifyModal(true);
      setIsPublishing(false);
      return;
    }

    if (!credentialId) {
      toast.message(uname ?
        `No credential set for provider "${provider}" for username "${uname}". Select one in the modal.` :
        "No credential set. Select one in the modal."
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
          credentialId: credentialId,
          title: postToPublish.title || "Untitled",
          html: postToPublish.content || "",
          text: plainText,
          coverUrl: coverCandidate || undefined,
          status: "published"
        });

        if (data?.success || data?.ok) {
          toast.success(`Published to ${label || "Webhook"}${uname ? ` for "${uname}"` : ""}.`);
        } else {
          toast.error(data?.error || "Webhook publish failed.");
        }
        return;
      }

      if (provider === "notion") {
        const coverCandidate = postToPublish.featured_image || extractFirstImageUrl(postToPublish.content);
        if (!coverCandidate) {
          try {
            localStorage.setItem("cms_default_provider", "notion");
            localStorage.setItem("cms_default_credential_id", credentialId);
          } catch (_) { }
          toast.message("Pick a cover image before publishing to Notion.");
          setShowCMSModal(true);
          return;
        }

        const { data } = await securePublish({
          provider: "notion",
          credentialId: credentialId,
          title: postToPublish.title || "Untitled",
          html: postToPublish.content || "",
          text: plainText,
          coverUrl: coverCandidate
        });

        if (data?.success || data?.ok) {
          toast.success(`Published to ${label || "Notion"}${uname ? ` for "${uname}"` : ""}.`);
        } else {
          toast.error(data?.error || "Publishing to Notion failed.");
        }
        return;
      }

      const { data } = await securePublish({
        provider,
        credentialId: credentialId,
        title: postToPublish.title || "Untitled",
        html: postToPublish.content || "",
        text: plainText
      });

      if (data?.success || data?.ok) {
        toast.success(`Published to ${label || provider}${uname ? ` for "${uname}"` : ""}.`);
      } else if (provider === 'notion' && data?.code === 'COVER_REQUIRED') {
        try {
          localStorage.setItem("cms_default_provider", "notion");
          localStorage.setItem("cms_default_credential_id", credentialId);
        } catch (_) { }
        toast.message("Pick a cover image before publishing to Notion.");
        setShowCMSModal(true);
      } else {
        toast.error(data?.error || "Publishing failed. You can try via the Publish modal.");
        setShowCMSModal(true);
      }
    } catch (e) {
      const server = e?.response?.data;
      if (provider === 'notion' && server?.code === 'COVER_REQUIRED') {
        try {
          localStorage.setItem("cms_default_provider", "notion");
          localStorage.setItem("cms_default_credential_id", credentialId);
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

  const openLinkSelectorModal = () => {
    sendToPreview({ type: "editor-command", command: "saveSelection" });
    setShowLinkSelector(true);
  };

  const handleLinkInsert = (linkInput) => {
    const isAnchorHtml = typeof linkInput === 'string' && /<a\b[^>]*>/i.test(linkInput);
    const isUrl = typeof linkInput === 'string' && /^https?:\/\//i.test(linkInput);

    if (isAnchorHtml) {
      insertContentAtPoint(linkInput);
      return;
    }

    if (isUrl) {
      sendToPreview({ type: "editor-command", command: "wrap-link", href: linkInput });
      setTimeout(() => sendToPreview({ type: "request-html" }), 50);
      return;
    }

    insertContentAtPoint(linkInput);
  };

  const handlePreviewHtmlChange = (newHtml) => {
    skipNextPreviewPushRef.current = true;
    setContent(newHtml);
  };

  const handlePreviewSelectionChange = ({ text, isSelected }) => {
    setTextForAction(text || "");
    setIsTextSelected(isSelected);
    try { localStorage.setItem("b44_audio_selected_text", (text || "").trim()); } catch (_) { }
  };

  const applyPreviewWidth = (width) => {
    if (!selectedMedia) return;
    // For video, we disable resizing, so we shouldn't apply width changes
    if (selectedMedia.type === 'video') return;

    const newWidth = parseInt(width, 10);

    setSelectedMedia((prev) => ({ ...prev, width: newWidth }));

    const styles = {
      width: `${newWidth}%`,
      'max-width': '100%',
      'box-sizing': 'border-box'
    };

    if (selectedMedia.type === 'image') {
      styles.height = 'auto';
      styles['object-fit'] = 'contain';
      styles.display = 'block';
    } else { // Generic handling for other types if they were ever resizable
      styles.height = 'auto';
      styles.overflow = 'visible';
      styles.display = 'block';
    }

    sendToPreview({
      type: 'update-media-style',
      id: selectedMedia.id,
      styles
    });

    clearTimeout(resizeCommitTimerRef.current);
    resizeCommitTimerRef.current = setTimeout(() => {
      sendToPreview({ type: 'request-html' });
    }, 500);
  };

  const findExistingPostByHeuristics = async () => {
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
      return null;
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

    const maxContentLength = 20000;
    const truncatedHtml = htmlContent.substring(0, maxContentLength);
    const prompt = `Based on the following article content, generate a comprehensive and detailed JSON-LD schema (using schema.org vocabulary) for a BlogPosting. Be as specific and thorough as possible.
Article Title: ${postTitle}
HTML Content:
${truncatedHtml}`;

    await agentSDK.addMessage(conversation, {
      role: "user",
      content: prompt
    });

    const pollTimeout = 60000;
    const pollInterval = 3000;
    const startTime = Date.now();

    try {
      while (Date.now() - startTime < pollTimeout) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const updatedConversation = await agentSDK.getConversation(conversation.id);
        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

        if (lastMessage?.role === 'assistant' && lastMessage.is_complete) {
          try {
            const cleanedContent = lastMessage.
              content.
              replace(/^```json\s*/, '').
              replace(/\s*```$/, '');
            JSON.parse(cleanedContent);
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

  const savePost = async (status, options = {}) => {
    if (savingGuardRef.current) return;
    savingGuardRef.current = true;

    const isPublishFlow = status === 'published';
    if (isPublishFlow) setIsLoading(true);
    else
      setIsSaving(true);

    let finalContent = content;
    let postData = {
      title: title || "Untitled Post",
      content: content,
      status,
      reading_time: Math.ceil(content.replace(/<[^>]*>/g, '').split(' ').length / 200),
      scheduled_publish_date: options.scheduledPublishDate || null,
      priority,
      client_session_key: sessionKeyRef.current || null,
      generated_llm_schema: currentPost?.generated_llm_schema || null
    };

    const enableSchemaGeneration = false;

    if (isPublishFlow) {
      let schemaJsonString = currentPost?.generated_llm_schema || null;

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
        }
      }

      if (schemaJsonString && String(schemaJsonString).trim().startsWith("{")) {
        const schemaScript = `<script type="application/ld+json">${schemaJsonString}</script>`;
        if (!finalContent.includes(schemaScript.substring(0, 50))) {
          finalContent = `${schemaScript}\n${finalContent}`;
          postData.content = finalContent;
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
          window.history.replaceState({}, '', newUrl);
        }
        if (savedPost?.id) initSessionKey({ postId: savedPost.id });
      }
      setCurrentPost(savedPost);

      if (isPublishFlow) {
        if (options.useGoogleDocs) {
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
          await publishToDefaultNow(savedPost);
        } else if (options.publishTo) {
          await publishToDefaultNow({
            ...savedPost,
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
      if (isPublishFlow) setIsLoading(false);
      else setIsSaving(false);
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
      const recordId = webhookBody?.['record-id'];

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
  const handlePublish = async (method = null, credentialId = null) => {
    try {
      if (method === null && credentialId === null) {
        await savePost('published', { useDefaultProvider: true });
      } else if (method === "google_docs") {
        await savePost('published', { useGoogleDocs: true });
      } else {
        await savePost('published', { publishTo: { provider: method, credentialId } });
      }
      setPublishMenuOpen(false);
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(`Failed to publish: ${error.message || "Unknown error"}`);
      setPublishMenuOpen(false);
    }
  };

  const handleSEOSave = (newMetadata) => {
    setCurrentPost((prev) => ({
      ...prev,
      ...newMetadata,
      // Also update top-level fields if they are present in metadata
      ...(newMetadata.meta_title && { meta_title: newMetadata.meta_title }),
      ...(newMetadata.slug && { slug: newMetadata.slug }),
      ...(newMetadata.meta_description && { meta_description: newMetadata.meta_description }),
      ...(newMetadata.featured_image && { featured_image: newMetadata.featured_image }),
      ...(newMetadata.focus_keyword && { focus_keyword: newMetadata.focus_keyword }),
      ...(newMetadata.tags && { tags: newMetadata.tags }),
      ...(newMetadata.excerpt && { excerpt: newMetadata.excerpt }),
      ...(newMetadata.generated_llm_schema && { generated_llm_schema: newMetadata.generated_llm_schema }),
    }));
  };


  const handleOpenActionsModal = () => {
    if (isTextSelected) {
      setIsActionsModal(true);
    } else {
      toast.info("Please select text in the editor first.");
    }
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
      case 'ai-agent': setShowWorkflowRunner(true); break;
      case 'faq':
        setShowFaqGenerator(true);
        break;
      default: break;
    }
  };

  const handleInsertPromotedProduct = (htmlBlockOrDoc) => {
    insertContentAtPoint(String(htmlBlockOrDoc));
  };

  const handleAIRewrite = (newText) => {
    // Check if newText is HTML
    const isHtml = /<[a-z][\s\S]*>/i.test(newText);

    if (isTextSelected) {
      // If text was selected, insert the rewritten text after the selection.
      // The user will then manually replace/delete the original selected text.
      insertContentAtPoint({ html: newText, mode: "after-selection" });
    } else {
      // If no text was selected, just insert at the current caret position or end.
      // The 'insert-html' type in the iframe will handle this.
      insertContentAtPoint({ html: newText, mode: "at-caret" });
    }
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
      focusPreviewPreserve();
    }
  };

  const handleRedo = () => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (win) {
      win.postMessage({ type: "editor-command", command: "redo" }, "*");
      focusPreviewPreserve();
    }
  };

  const handleApplyBranded = (newHtml, streaming = false) => {
    const cleaned = typeof sanitizeLocalizedHtml === "function" ? sanitizeLocalizedHtml(newHtml) : String(newHtml || "");
    skipNextPreviewPushRef.current = true;
    setContent(cleaned);
    sendToPreview({ type: "set-html", html: cleaned });
  };

  const handleApplyTextEdit = (html) => {
    insertContentAtPoint(html);
    setShowTextEditor(false);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const currentUsername = currentPost?.user_name || currentWebhook?.user_name;

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
    navigate(createPageUrl("Content"));
  }, [navigate]);

  const isSuperadmin = currentUser && currentUser.is_superadmin === true;

  const handlePasteTopbar = () => {
    setAutoReadPaste(true);
    setShowPasteModal(true);
  };

  const handleCreateFromPaste = async ({ title, content, user_name }) => {
    const saved = await BlogPost.create({
      title: title || "Pasted Content",
      content,
      status: "draft",
      user_name
    });
    if (saved?.id) {
      const newUrl = createPageUrl(`Editor?post=${saved.id}`);
      window.history.replaceState({}, "", newUrl);
      initializeEditor();
    }
  };

  const allowedUsernames = Array.isArray(currentUser?.assigned_usernames) ? currentUser.assigned_usernames : [];
  const defaultBrand = currentPost?.user_name || currentWebhook?.user_name || allowedUsernames?.[0] || "";

  const getUsernameForContent = () => {
    return currentPost?.user_name || currentWebhook?.user_name;
  };

  const publishOptions = useMemo(() => {
    const options = [];

    options.push({
      key: 'google_docs',
      label: 'Google Docs (copy & paste)',
      method: 'google_docs',
      credential_id: null
    });

    const currentUsernameCreds = publishCredentials.filter(
      (c) => c.user_name === (currentPost?.user_name || currentWebhook?.user_name)
    );

    const providers = {};
    currentUsernameCreds.forEach((cred) => {
      if (!providers[cred.provider]) {
        providers[cred.provider] = [];
      }
      providers[cred.provider].push(cred);
    });

    for (const provider of ["notion", "shopify", "webhook", "wordpress", "webflow"]) {
      if (providers[provider]) {
        providers[provider].forEach((cred) => {
          options.push({
            key: `${provider}-${cred.id}`,
            label: `${provider.charAt(0).toUpperCase() + provider.slice(1)} — ${cred.name}`,
            method: provider,
            credential_id: cred.id
          });
        });
      }
    }
    return options;
  }, [publishCredentials, currentPost, currentWebhook]);


  // Component for Publish Button, nested to access state directly
  const PublishButton = ({ onPublish }) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onPublish()}
          disabled={isPublishing || isSaving || isGeneratingSchema || !title || !content}
          size="sm" className="bg-blue-900 text-white px-3 text-sm font-medium justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-cyan-700 inline-flex items-center gap-2 h-9 rounded-md shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-cyan-400"
          title={
            defaultPublish?.method ?
              `Publish to ${defaultPublish.label}${defaultPublishUsername ? ` for "${defaultPublishUsername}"` : ""}` :
              "Set up a default publishing method in Username settings for one-click publishing"
          }>

          <Send className="w-4 h-4 mr-1" />
          <span>{defaultPublish?.label ? `Publish to ${defaultPublish.label}` : "Publish"}</span>
        </Button>
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
        <style>{`
        #editor-neon {
          --bg: #ffffff;
          --surface: #ffffff;
          --card: #ffffff;
          --text: #0b1220;
          --muted: #475569;
          --border: rgba(2,6,23,0.12);
          --hover: rgba(2,6,23,0.04);
          --hover-strong: rgba(2,6,23,0.08);
          --ring: rgba(59,130,246,0.45);
        }
        #editor-neon .topbar { background: #ffffff; border-bottom: 1px solid var(--border); color: var(--text); }
        #editor-neon input, #editor-neon textarea, #editor-neon select {
          background-color: #ffffff; color: #0b1220; border-color: #e2e8f0;
        }
        #editor-neon input::placeholder, #editor-neon textarea::placeholder {
          color: #64748b;
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

        #editor-neon .b44-title-input { text-align: center !important; }
        #editor-neon .b44-title-input::placeholder { text-align: center; }
        
        /* CTA Styling for proper spacing */
        .b44-cta {
          margin: 2rem 0 !important;
          padding: 1.5rem !important;
          box-sizing: border-box !important;
          display: block !important;
        }
      `}</style>

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

        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-24 -right-20 w-[680px] h-[680px] rounded-full blur-3xl opacity=15"
            style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)" }} />
          <div className="absolute bottom-[-180px] left-[-120px] w-[560px] h-[560px] rounded-full blur-3xl opacity=10"
            style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.16), rgba(255,255,255,0) 72%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-3xl opacity=10"
            style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.12), rgba(255,255,255,0) 70%)" }} />
        </div>

        <div className="min-h-screen flex flex-col relative z-10">
          <div className="sticky top-0 topbar shadow-2xl z-[200]">
            <div className="bg-white px-6 py-4 relative">
              <div
                className="mx-auto max-w-5xl">

                <div className="overflow-x-auto -mx-2 px-2 hide-scrollbar">
                  <div className="flex items-center gap-2 justify-start min-w-max flex-wrap">
                    <Button
                      onClick={goBack}
                      variant="ghost"
                      size="icon"
                      className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 mr-2"
                      title="Back to Content Feed">

                      <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div className="hidden">
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
                    </div>

                    <div className="hidden">
                      <FontSelector selectedFont={selectedFont} onFontChange={setSelectedFont} />
                    </div>

                    <Button
                      onClick={() => setIsSEOSettingsOpen(true)}
                      variant="outline"
                      className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2">

                      <Globe className="w-4 h-4" />
                      SEO
                    </Button>

                    <Button
                      variant="outline"
                      className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2"
                      onClick={handlePasteTopbar}
                      title="Paste content from your clipboard">

                      <ClipboardIcon className="w-4 h-4" />
                      Paste
                    </Button>

                    <div className="hidden">
                      <EditorToolbar
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        quillRef={quillRef}
                        showImageLibrary={() => setShowImageLibrary(true)}
                        showLinkSelector={openLinkSelectorModal}
                        showPromotedProductSelector={() => setShowProductSelector(true)}
                        showCtaSelector={() => setShowCtaSelector(true)}
                        showEmailCaptureSelector={() => setShowEmailCaptureSelector(true)}
                        // REMOVED: showTikTokSelector={() => setShowTikTokSelector(true)}
                        // REMOVED: showYouTubeSelector={() => setShowYouTubeSelector(true)}
                        showTestimonialSelector={() => setShowTestimonialLibrary(true)}
                        showAskAIOptions={openAskAIOptions}
                        setShowWorkflowRunner={() => setShowWorkflowRunner(true)} />
                    </div>

                    <div className="flex-1" />

                    {isSuperadmin &&
                      <Button variant="outline" className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2" onClick={() => window.open(createPageUrl('InvoiceBuilder'), '_blank')}>
                        <FileTextIcon className="w-4 h-4" /> Invoices
                      </Button>
                    }
                    <Button variant="outline" className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2" onClick={() => handleSave()} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </Button>
                    <PublishButton onPublish={handlePublish} />

                    {/* REMOVED: Options dropdown menu completely */}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 gap-2">
                          Share
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => {
                          const safeTitle = (title || "Untitled").replace(/</g, "&lt;").replace(/>/g, ">");
                          const fullHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>${content}</body></html>`;
                          const blob = new Blob([fullHtml], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${(title || "content").replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}>
                          <Download className="w-4 h-4 mr-2" />
                          Download HTML
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                          // Enhanced TXT export with full SEO metadata
                          let exportContent = "";

                          // Add title in clean HTML tags (no attributes)
                          if (title) {
                            exportContent += `<title>${title}</title>\n\n`;
                          }

                          // Add SEO metadata if available
                          if (currentPost?.meta_title || currentPost?.meta_description || currentPost?.focus_keyword || currentPost?.tags?.length > 0 || currentPost?.slug || currentPost?.excerpt) {
                            exportContent += "<!-- SEO METADATA -->\n";

                            if (currentPost.meta_title) {
                              exportContent += `<meta name="title" content="${currentPost.meta_title}" />\n`;
                            }

                            if (currentPost.meta_description) {
                              exportContent += `<meta name="description" content="${currentPost.meta_description}" />\n`;
                            }

                            if (currentPost.focus_keyword) {
                              exportContent += `<!-- Focus Keyword: ${currentPost.focus_keyword} -->\n`;
                            }

                            if (currentPost.slug) {
                              exportContent += `<!-- URL Slug: ${currentPost.slug} -->\n`;
                            }

                            if (currentPost.tags && Array.isArray(currentPost.tags) && currentPost.tags.length > 0) {
                              exportContent += `<meta name="keywords" content="${currentPost.tags.join(', ')}" />\n`;
                            }

                            if (currentPost.excerpt) {
                              exportContent += `<!-- Excerpt: ${currentPost.excerpt} -->\n`;
                            }

                            exportContent += "\n";
                          }

                          // Add JSON-LD Schema if available
                          if (currentPost?.generated_llm_schema) {
                            try {
                              // Validate and format the schema
                              const schema = typeof currentPost.generated_llm_schema === 'string'
                                ? JSON.parse(currentPost.generated_llm_schema)
                                : currentPost.generated_llm_schema;

                              exportContent += '<!-- JSON-LD SCHEMA -->\n';
                              exportContent += '<script type="application/ld+json">\n';
                              exportContent += JSON.stringify(schema, null, 2);
                              exportContent += '\n</script>\n\n';
                            } catch (e) {
                              // If schema parsing fails, include it as text comment
                              console.error("Failed to parse JSON-LD schema for export:", e);
                              exportContent += '<!-- JSON-LD SCHEMA (Raw, parsing failed) -->\n';
                              exportContent += `<!-- ${currentPost.generated_llm_schema} -->\n\n`;
                            }
                          }

                          // Add main content
                          exportContent += "<!-- MAIN CONTENT -->\n";
                          exportContent += content;

                          // Create and download the file
                          const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${(title || "content").replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}>
                          <FileText className="w-4 h-4 mr-2" />
                          Download TXT
                        </DropdownMenuItem>

                      </DropdownMenuContent>
                    </DropdownMenu>

                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-auto" key={`${currentWebhook?.id || 'nw'}-${currentPost?.id || 'np'}`}>
            <div className="border-b" style={{ borderColor: "var(--border)" }}>
              <div className="bg-slate-50 pt-3 pb-5">
                <div className="mt-3 max-w-5xl mx-auto px-6">
                  <div className="relative">
                    <Textarea
                      placeholder="Enter your blog post title..."
                      value={title}
                      onChange={handleTitleChange}
                      className="b44-title-input w-full text-[1.6rem] md:text-[1.95rem] font-bold py-2 leading-tight bg-white text-slate-900 placeholder:text-slate-600 border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-300 resize-none overflow-hidden pr-12"
                      rows={1}
                      style={{ minHeight: '56px' }}
                    />
                    {isAiTitleRewriteEnabled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                        onClick={handleRewriteTitle}
                        disabled={isRewritingTitle || !title || !content}
                        title="Rewrite title with AI"
                      >
                        {isRewritingTitle ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Wand2 className="w-5 h-5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative mt-3 h-[70vh] w-full max-w-5xl mx-auto rounded-xl overflow-hidden" style={{ backgroundColor: "var(--hover)", border: "1px solid var(--border)" }}>
                  <div className="h-full bg-white text-slate-900 flex flex-col">
                    {selectedMedia &&
                      <div className="bg-slate-50 text-slate-950 p-2 text-xs flex-shrink-0 flex items-center gap-3">
                        {(selectedMedia.type === 'image') ? (
                          <>
                            <span className="opacity-70 whitespace-nowrap">Image width</span>
                            <div className="bg-slate-50 flex items-center gap-3 flex-1">
                              <Slider
                                value={[selectedMedia.width ?? 100]}
                                min={10}
                                max={100}
                                step={1}
                                onValueChange={(val) => applyPreviewWidth(val[0])} className="bg-slate-50 text-base capitalize relative flex w-full touch-none select-none items-center flex-1" />


                              <span className="w-12 text-right tabular-nums">
                                {selectedMedia.width ?? 100}%
                              </span>
                            </div>
                            <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
                          </>
                        ) : (
                          <span className="opacity-70">
                            {selectedMedia.type === 'video' ? 'Video selected (resizing disabled)' :
                              selectedMedia.type === 'audio' ? 'Audio selected (width not applicable)' :
                                `${selectedMedia.type} selected (resizing disabled)`}
                          </span>
                        )}

                        <button
                          onClick={handleDeleteSelected} className="bg-violet-950 text-white p-1.5 rounded hover:bg-red-700"

                          title="Delete selected block">

                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    }
                    <div className="h-full w-full p-4">
                      <LiveHtmlPreview
                        html={content}
                        onImageSelect={setSelectedMedia}
                        onHtmlChange={handlePreviewHtmlChange}
                        onSelectionChange={handlePreviewSelectionChange}
                        onPreviewClick={closeAllDropdowns}
                        onDoubleClickSelected={handleIframeDoubleClick}
                        onContextMenuSelected={handleIframeContextMenu}
                        userCssUsername={getUsernameForContent()} />

                    </div>
                  </div>
                </div>

              </div>
            </div>

            {askAIBar.visible &&
              <AskAIFloatingBar
                x={askAIBar.x}
                y={askAIBar.y}
                onAskAI={() => openAskAIOptions(askAIBar.x, askAIBar.y)}
                onEdit={openInlineEditor}
                onClose={() => setAskAIBar((s) => ({ ...s, visible: false }))} />
            }

            {inlineToolbar.visible &&
              <InlineFormatToolbar
                x={inlineToolbar.x}
                y={inlineToolbar.y}
                onClose={() => setInlineToolbar({ visible: false, x: null, y: null })} />

            }

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

            {/* REMOVED: YouTubeSelector component */}

            {/* REMOVED: TikTokSelector component and its associated state/props */}

            <LinkSelector
              isOpen={showLinkSelector}
              onClose={() => setShowLinkSelector(false)}
              onInsert={handleLinkInsert}
              username={currentUsername}
              onOpenSitemap={() => setShowSitemapLinker(true)} />


            {showImageLibrary &&
              <ImageLibraryModal
                isOpen={showImageLibrary}
                onClose={() => setShowImageLibrary(false)}
                onInsert={handleImageInsertFromLibrary}
                usernameFilter={imageLibraryGenerateOnly ? (currentPost?.user_name || currentWebhook?.user_name) : undefined}
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
              pageHtml={content}
              pageTitle={title}
              preferredUsername={currentUsername} />


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

            <MediaLibraryModal
                isOpen={showMediaLibrary}
                onClose={() => {
                  setShowMediaLibrary(false);
                  setMediaLibraryInitialTab(undefined); // Reset initial tab when closing
                }}
                onInsert={handleMediaInsert}
                initialTab={mediaLibraryInitialTab} // Pass the initial tab prop
            />


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
            <ShopifyPublishModal
              isOpen={showShopifyModal}
              onClose={() => setShowShopifyModal(false)}
              username={currentPost?.user_name || currentWebhook?.user_name || null}
              processingId={currentPost?.processing_id || currentWebhook?.processing_id || null}
              title={title}
              html={content}
              defaultCredentialId={shopifyPreset.current.credentialId}
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


            <LocalizeModal
              isOpen={showLocalize}
              onClose={() => setShowLocalize(false)}
              originalHtml={content}
              onApplyLocalized={(newHtml) => {
                const cleaned = sanitizeLocalizedHtml(newHtml);
                setContent(cleaned);
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
                const cleaned = typeof sanitizeLocalizedHtml === "function" ? sanitizeLocalizedHtml(newHtml) : String(newHtml || "");
                skipNextPreviewPushRef.current = true;
                setContent(cleaned);
                sendToPreview({ type: "set-html", html: cleaned });
              }} />

            <PasteContentModal
              isOpen={showPasteModal}
              onClose={() => { setShowPasteModal(false); setAutoReadPaste(false); }}
              allowedUsernames={allowedUsernames}
              defaultUsername={defaultBrand}
              onSubmit={handleCreateFromPaste}
              autoReadClipboard={autoReadPaste}
              initialRaw="" />

            <TextEditorModal
              isOpen={showTextEditor}
              onClose={() => setShowTextEditor(false)}
              initialText={textForAction || ""}
              onApply={handleApplyTextEdit} />

            <FaqGeneratorModal
              isOpen={showFaqGenerator}
              onClose={() => setShowFaqGenerator(false)}
              selectedText={isTextSelected ? textForAction : content}
              onInsert={insertContentAtPoint} />

          </div>
        </div>
      </div>
    </EditorErrorBoundary>);

}
