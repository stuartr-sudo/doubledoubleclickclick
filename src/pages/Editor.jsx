
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { Username } from "@/api/entities";
import { IntegrationCredential } from "@/api/entities";
import { User } from "@/api/entities";
import { ImageLibraryItem } from "@/api/entities";
import { GeneratedVideo } from "@/api/entities";
import { ImagineerJob } from "@/api/entities"; // Ensure ImagineerJob is imported as it's used
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Edit3, Send, ArrowLeft, FileText, Globe, Loader2, Smartphone, Tablet as TabletIcon, Laptop, Monitor, Calendar as CalendarIcon, Trash2, Info, X, Wand2, Palette, Settings, FileText as FileTextIcon, Clipboard as ClipboardIcon, ChevronDown, Download, Eye, EyeOff } from "lucide-react"; // Added Eye, EyeOff
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"; // Added useSearchParams
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
import { checkAndConsumeTokens } from "@/api/functions";
import { callFeatureEndpoint } from "@/api/functions";
import { Slider } from "@/components/ui/slider";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import { useEditorContent } from "@/components/hooks/editor/useEditorContent";

import EditorToolbar from "../components/editor/EditorToolbar";
import AIRewriterModal from "../components/editor/AIRewriterModal";
import FontSelector from "../components/editor/FontSelector";
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
import TextEditorModal from "../components/editor/TextEditorModal"; // FIX: Corrected import path
import InlineFormatToolbar from "../components/editor/InlineFormatToolbar";
import FaqGeneratorModal from "../components/editor/FaqGeneratorModal";
import MediaLibraryModal from "../components/editor/MediaLibraryModal";
import InternalLinkerButton from "../components/editor/InternalLinkerButton";
import LinksAndReferencesButton from "../components/editor/LinksAndReferencesButton";
import AutoScanButton from "../components/editor/AutoScanButton";
import MagicOrbLoader from "@/components/common/MagicOrbLoader";
import FloatingPublishButton from "../components/editor/FloatingPublishButton";

import { generateNapkinInfographic } from "@/api/functions";
import InfographicsModal from "../components/editor/InfographicsModal";

import { buildFaqAccordionHtml } from "@/components/editor/FaqAccordionBlock";
import { generateArticleFaqs } from "@/api/functions";
import { findSourceAndCite } from "@/api/functions";
import { agentSDK } from "@/agents";

import ImagineerModal from "../components/editor/ImagineerModal";
import { initiateImagineerGeneration } from "@/api/functions";
import VoiceDictationModal from '../components/editor/VoiceDictationModal';

function EditorErrorBoundary({ children }) {
  const [error, React_useState_null] = React.useState(null);
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

// Minimal AuthGate component for the outline's render section
function AuthGate({ currentUser, children }) {
  if (currentUser === null) { // Check for explicit null (not yet loaded)
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-white/70">Loading user data...</p>
        </div>
      </div>
    );
  }
  return children;
}


export default function Editor() {
  // ==================== URL PARAMETERS ====================
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParams = new URLSearchParams(location.search);
  const postId = urlParams.get("post");
  const webhookId = urlParams.get("webhook");

  // ==================== EDITOR CONTENT HOOK ====================
  const {
    post: currentPost, // Renamed 'post' from hook to 'currentPost'
    webhook: currentWebhook, // Renamed 'webhook' from hook to 'currentWebhook'
    content,
    title,
    isLoading: contentLoading, // Renamed to avoid collision with other 'isLoading' states
    isSaving, // This `isSaving` now comes from the hook
    lastSaved,
    hasUnsavedChanges,
    saveContent,
    handleContentChange,
    handleTitleChange: handleTitleChangeFromHook, // Renamed to avoid conflict with local handler
    setPostState, // Expose for internal updates like SEO metadata
    setWebhookState, // Expose for internal updates like status
    initSessionKey, // Exposed for external session key updates
    sessionKeyRef, // Exposed for external access if needed
  } = useEditorContent(postId, webhookId, setSearchParams); // Pass setSearchParams for URL updates

  // ==================== OTHER STATE (Non-content related) ====================
  const [currentUser, setCurrentUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);

  const [isPublishing, setIsPublishing] = useState(false); // Still needed for explicit publish actions
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [previewDevice, setPreviewDevice] = useState("laptop");
  const [priority, setPriority] = useState('medium');

  const [isActionsModalOpen, setIsActionsModal] = useState(false);
  const [textForAction, setTextForAction] = useState("");
  const [isTextSelected, setIsTextSelected] = useState(false);

  const [htmlMode, setHtmlMode] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const [showAIModal, setShowAIModal] = useState(false);
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
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaLibraryInitialTab, setMediaLibraryInitialTab] = useState(undefined);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTestimonialLibrary, setShowTestimonialLibrary] = useState(false);
  const [showVariantLibrary, setShowVariantLibrary] = useState(false);
  const [showCMSModal, setShowCMSModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showAmazonImport, setShowAmazonImport] = useState(false);
  const [showLocalize, setShowLocalize] = useState(false);
  const [showBrandIt, setShowBrandIt] = useState(false);
  const [showAffilify, setShowAffilify] = useState(false);
  const [showFaqGenerator, setShowFaqGenerator] = useState(false);
  const [isRewritingTitle, setIsRewritingTitle] = useState(false);
  const [showInfographics, setShowInfographics] = useState(false);
  const [pendingInfographicJobs, setPendingInfographicJobs] = useState([]);
  const insertedInfographicIdsRef = useRef(new Set());
  const infographicGeneratingRef = useRef(false);

  const [showImagineer, setShowImagineer] = useState(false);
  const [pendingImagineerJobs, setPendingImagineerJobs] = useState([]);
  const imagineerJobsRef = useRef(new Set());

  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // NEW: State for InternalLinker Modal (this is for the modal, not the headless trigger)
  const [showInternalLinker, setShowInternalLinker] = useState(false);
  const [isAutoLinking, setIsAutoLinking] = useState(false); // State for MagicOrbLoader during autolinking
  const internalLinkerRef = React.useRef(null); // Ref for hidden InternalLinkerButton

  // NEW: State for AutoScan and its loader
  const [isAutoScanning, setIsAutoScanning] = useState(false); // State for MagicOrbLoader during auto-scanning
  const autoScanButtonRef = React.useRef(null); // Ref for hidden AutoScanButton

  // NEW: Ref for hidden LinksAndReferencesButton (for programmatic triggering)
  const referencesButtonRef = React.useRef(null);

  const [showWorkflowRunner, setShowWorkflowRunner] = React.useState(false);
  // NEW: state for Flash workflow modal
  const [showFlashModal, setShowFlashModal] = React.useState(false);


  const skipNextPreviewPushRef = useRef(false);

  const resizeCommitTimerRef = React.useRef(null);

  const [backgroundJobs, setBackgroundJobs] = useState([]);
  const [showGoogleCreds, setShowGoogleCreds] = useState(false);

  const [publishCredentials, setPublishCredentials] = useState(false); // Changed to false to trigger initial load from useEffect
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [pendingAudioJobs, setPendingAudioJobs] = useState([]);

  const [showShopifyModal, setShowShopifyModal] = React.useState(false);
  const shopifyPreset = React.useRef({ credentialId: null });

  const insertLockRef = useRef(false);
  const insertSeqRef = useRef(1);

  const [askAIBar, setAskAIBar] = useState({ visible: false, x: null, y: null });
  const [quickMenu, setQuickMenu] = useState({ visible: false, x: null, y: null });
  const [inlineToolbar, setInlineToolbar] = useState({ visible: false, x: null, y: null });

  const quillRef = useRef(null);

  const generatingSchemaRef = useRef(false);

  const [showPasteModal, setShowPasteModal] = React.useState(false);
  const [autoReadPaste, setAutoReadPaste] = React.useState(false);

  const insertedAudioUrlsRef = React.useRef(new Set());
  const insertedAudioJobKeysRef = React.useRef(new Set());

  const [showTextEditor, setShowTextEditor] = useState(false);

  // NEW: Track retry attempts for rate-limited requests
  const retryAttemptsRef = useRef({ credentials: 0, post: 0, save: 0 }); // `post` and `save` retries are mostly handled by useEditorContent now


  // ==================== LOAD USER AND PLAN ====================
  useEffect(() => {
    const loadUserAndPlan = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        setUserPlan(user?.plan_price_id || null);
      } catch (error) {
        console.error("Error loading user:", error);
        setCurrentUser(null);
        setUserPlan(null);
      }
    };
    loadUserAndPlan();
  }, []); // Only runs once on mount

  // ==================== AUTO-SAVE ====================
  useEffect(() => {
    // If the content is loading, or a save is already in progress, or no user is logged in, don't trigger auto-save.
    // Also, only save if there are actual unsaved changes tracked by the hook.
    if (!hasUnsavedChanges || isSaving || contentLoading || !currentUser) return;

    const autoSaveTimer = setTimeout(() => {
      saveContent(); // Trigger the hook's save function
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, isSaving, contentLoading, saveContent, currentUser]);


  // Definition for sendToPreview moved to correctly declare before its dependents
  const sendToPreview = useCallback((msg) => {
    const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
    const win = iframe?.contentWindow;
    if (win) {
      win.postMessage(msg, "*");
    }
  }, []);

  const openLinkSelectorModal = React.useCallback(() => {
    sendToPreview({ type: "editor-command", command: "saveSelection" });
    setShowLinkSelector(true);
  }, [sendToPreview]);

  const applyPreviewWidth = React.useCallback((widthPercent) => {
    if (!selectedMedia || !selectedMedia.id) return;

    setSelectedMedia(prev => ({ ...prev, width: widthPercent }));

    sendToPreview({
      type: "update-media-style",
      id: selectedMedia.id,
      styles: {
        width: `${widthPercent}%`,
        maxWidth: `${widthPercent}%`
      }
    });
  }, [selectedMedia, sendToPreview]);

  const handlePreviewHtmlChange = React.useCallback((newHtml) => {
    skipNextPreviewPushRef.current = true;
    handleContentChange(newHtml); // Use hook's content handler
  }, [handleContentChange]);

  const handlePreviewSelectionChange = React.useCallback((selectionData) => {
    const selectedText = selectionData?.text || "";
    setTextForAction(selectedText);
    setIsTextSelected(!!selectedText);
  }, []);

  const handleLinkInsert = React.useCallback((linkData) => {
    if (!linkData || !linkData.url) return;

    const href = linkData.url;
    const label = linkData.label || linkData.title || href;

    sendToPreview({
      type: "editor-command",
      command: "restoreSelection"
    });

    setTimeout(() => {
      sendToPreview({
        type: "editor-command",
        command: "wrap-link",
        href: href,
        label: label
      });
    }, 50);

    setShowLinkSelector(false);
  }, [sendToPreview]);


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
            style.textContent =
              'img[data-b44-type="image"],img[data-b44-id],.youtube-video-container[data-b44-id],blockquote.tiktok-embed,.b44-promoted-product,.b44-callout,.b44-tldr,.b44-fact-card,.b44-testimonial,.b44-infographic,.b44-imagineer-placeholder{padding-top:1em;padding-bottom:1em;box-sizing:border-box;display:block;}' +
              ' .b44-audio-inline{padding-top:0;padding-bottom:0;}' +
              // Force TL;DR to be left-aligned and not centered by inline margin:auto snippets
              ' .b44-tldr{margin:24px 0 !important;max-width:none !important;width:100% !important;text-align:left !important;}' +
              ' .b44-tldr *{text-align:left !important;}';
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
            const loadTikTokScript = () => {
              if (window.tiktokEmbedInitialized) return;

              const existingScript = doc.querySelector('script[src*="tiktok.com/embed.js"]');
              if (existingScript) existingScript.remove();

              const script = doc.createElement('script');
              script.async = true;
              script.src = 'https://www.tiktok.com/embed.js';
              script.onload = () => {
                window.tiktokEmbedInitialized = true;
                if (window.tiktokEmbed && typeof window.tiktokEmbed.lib === 'object') {
                  window.tiktokEmbed.lib.render(doc.body);
                }
              };
              doc.head.appendChild(script);
            };

            loadTikTokScript();

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
            if (state.selectedEl && state.selectedEl.style) {
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
              if (state.selectedEl && state.selectedEl !== el && state.selectedEl.style) {
                state.selectedEl.style.removeProperty("outline");
                state.selectedEl.style.removeProperty("outline-offset");
              }
              state.selectedEl = el;
              el.style.setProperty("outline", "2px solid #0ea5e9", "important");
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
            if (el.matches(".b44-tldr, .b44-tldr *")) return "tldr";
            if (el.matches(".b44-faq-block, .b44-faq-block *")) return "faq";
            if (el.matches(".b44-testimonial, .b44-testimonial *")) return "testimonial";
            if (el.matches(".b44-infographic, .b44-infographic *")) return "infographic";
            if (el.matches(".b44-imagineer-placeholder, .b44-imagineer-placeholder *")) return "imagineer-placeholder";
            return el.dataset?.b44Type || "unknown";
          };

          const findSelectable = (node) => {
            if (!node) return null;
            let el = node.closest?.("[data-b44-id]");
            if (el) return el;

            if (node.matches?.(".b44-audio-inline, .b44-audio-inline *") || node.tagName === "AUDIO") {
              return node.closest?.(".b44-audio-inline") || node;
            }
            if (node.tagName === "IFRAME") {
              return node.closest(".youtube-video-container") || node;
            }
            const tiktok = node.closest?.("blockquote.tiktok-embed");
            if (tiktok) return tiktok;

            const tldr = node.closest?.(".b44-tldr");
            if (tldr) return tldr;

            const faqBlock = node.closest?.(".b44-faq-block");
            if (faqBlock) return faqBlock;

            const testimonial = node.closest?.(".b44-testimonial");
            if (testimonial) return testimonial;

            const infographic = node.closest?.(".b44-infographic");
            if (infographic) return infographic;
            
            const imagineer = node.closest?.(".b44-imagineer-placeholder");
            if (imagineer) return imagineer;

            if (node.tagName === "IMG") return node;

            return null;
          };

          const installOverlayHandles = () => {
            const addHandle = (container) => {
              try {
                if (container.querySelector('.b44-select-handle')) return;

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
                  'background:rgba(14,165,233,0.85)',
                  'box-shadow:0 1px 2px rgba(0,0,0,0.2)',
                  'cursor:pointer',
                  'z-index:5'
                ].join(';');
                handle.title = 'Select block';

                handle.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const id = ensureId(container);
                  highlight(container);

                  let widthPct = 100;
                  const styleWidth = container.style && container.style.width || '';
                  const m = String(styleWidth).match(/(\d+)%/);
                  if (m) { widthPct = parseInt(m[1], 10); }

                  const mediaType = getMediaType(container);
                  window.parent.postMessage({
                    type: 'media-selected',
                    id,
                    mediaType,
                    width: mediaType === 'video' ? 100 : widthPct,
                  }, '*');
                });

                container.appendChild(handle);
              } catch (e) {
                console.warn('[B44] selection-fix: addHandle error', e);
              }
            };

            doc.querySelectorAll('[data-b44-id]').forEach(addHandle);

            const mo = new MutationObserver((mutations) => {
              for (const m of mutations) {
                for (const node of m.addedNodes || []) {
                  if (node.nodeType !== 1) continue;
                  try {
                    if (node.matches && node.matches('[data-b44-id]')) {
                      addHandle(node);
                    }
                    if (node.querySelector) {
                      node.querySelectorAll('[data-b44-id]').forEach(addHandle);
                    }
                  } catch (_) { }
                }
              }
            });
            mo.observe(doc.body, { childList: true, subtree: true });
          };

          const onClick = (e) => {
            const el = findSelectable(e.target);
            if (!el) {
              dehighlight();
              return;
            }
            const id = ensureId(el);
            highlight(el);

            let widthPct = 100;
            const styleWidth = el.style && el.style.width || "";
            const m = String(styleWidth).match(/(\d+)%/);
            if (m) { widthPct = parseInt(m[1], 10); }

            const mediaType = getMediaType(el);
            window.parent.postMessage({
              type: "media-selected",
              id,
              mediaType,
              width: mediaType === 'video' ? 100 : widthPct,
            }, "*");
            console.log("[B44] selection-fix: media-selected", { id, mediaType, width: widthPct });
          };
          doc.addEventListener("click", onClick, true);

          const onMsg = (ev) => {
            const d = ev?.data || {};
            if (!d || !d.type) return;

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
              if (cmd === "wrap-link") {
                const ok = wrapSelectionWithLink(d.href || "", d.label || "");
                if (ok) window.parent.postMessage({ type: "html-updated", html: doc.body.innerHTML }, "*");
                return;
              }

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

          installOverlayHandles();

          console.log("[B44] selection-fix: ready");
        } catch (err) {
          console.error("[B44] selection-fix: fatal error", err);
        }
      })();
    `;
    doc.head.appendChild(script);
  }, []);

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
            const htmlNow = String(content || ""); // Use content from hook
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
  }, [pendingAudioJobs, insertContentAtPoint, content]); // Dependency content added

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
                  insertContentAtPoint({ html: html, mode: job.insertMode });
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

  const { consumeTokensForFeature, consumeTokensOptimistic } = useTokenConsumption();

  const handleGenerateInfographic = async (config) => {
    // Prevent duplicate submissions
    if (infographicGeneratingRef.current) {
      toast.message("Infographic is already being generated. Please wait.");
      return;
    }

    // Check and consume tokens BEFORE generation
    const tokenResult = await consumeTokensForFeature('ai_infographics');

    if (!tokenResult.success) {
      // Token consumption failed - error already shown by the hook
      return;
    }

    infographicGeneratingRef.current = true;
    const jobId = `infographic-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setPendingInfographicJobs(prev => [...prev, {
      id: jobId,
      config,
      status: 'pending',
      attempts: 0,
      startedAt: Date.now(),
      insertMode: isTextSelected ? 'after-selection' : 'at-caret' // Capture current selection mode
    }]);

    toast.message("Generating infographic in background...");
  };

  // Poll for infographic generation
  useEffect(() => {
    if (!pendingInfographicJobs.length) {
      infographicGeneratingRef.current = false; // Reset when no jobs are pending
      return;
    }

    const interval = setInterval(async () => {
      const updates = await Promise.all(pendingInfographicJobs.map(async (job) => {
        if (job.done) return job; // If the job is already marked as done, no need to re-call the API.

        try {
          const attempts = (job.attempts || 0) + 1;

          // Add delay between attempts to avoid rate limiting
          if (attempts > 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

          const { data } = await generateNapkinInfographic(job.config);

          if (data.success && data.file_url) {
            return { ...job, attempts, done: true, success: true, data };
          }

          if (data.error) {
            return { ...job, attempts, done: true, success: false, error: data.error };
          }

          // Max 60 attempts * 5s = 5 minutes timeout
          if (attempts > 60) {
            return { ...job, attempts, done: true, success: false, error: "Infographic generation timed out." };
          }

          return { ...job, attempts }; // Job still pending, increment attempts
        } catch (e) {
          return { ...job, done: true, success: false, error: e?.message || "Infographic generation error." };
        }
      }));

      setPendingInfographicJobs((currentJobs) => {
        const nextJobs = updates.filter((job) => {
          if (job.done && !job.inserted) {
            // Process completed/failed jobs for insertion or toast message
            if (job.success && job.data && job.data.file_url) {
              const alreadyInserted = insertedInfographicIdsRef.current.has(job.id);

              if (!alreadyInserted) {
                const wrapperId = `infographic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

                // Display infographics at full size without image resizing restrictions
                const imgHtml = `<div data-b44-id="${wrapperId}" data-b44-type="infographic" style="width: 100%; margin: 20px 0; padding: 0; display: block; clear: both; text-align: center;"><img src="${job.data.file_url}" alt="Generated infographic" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 8px;" /></div>`;

                insertContentAtPoint({ html: imgHtml, mode: job.insertMode }); // Use job's insertMode
                insertedInfographicIdsRef.current.add(job.id);
                toast.success("Infographic inserted!");
              } else {
                // If already inserted, just acknowledge but don't re-insert
                toast.message("Infographic generated (already present, skipped duplicate).");
              }
            } else {
              toast.error(job.error || "Infographic generation failed.");
            }

            // Mark job as inserted/processed to remove it from pending list
            job.inserted = true;
          }
          // Only keep jobs that are NOT inserted yet (i.e., still pending or just completed and awaiting insertion)
          return !job.inserted;
        });

        // After processing updates, check if there are any remaining active jobs.
        // If not, reset the global generation flag.
        if (nextJobs.length === 0) {
          infographicGeneratingRef.current = false;
        }

        return nextJobs;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [pendingInfographicJobs, insertContentAtPoint]);

  // Poll for completed Imagineer jobs and replace placeholders
  useEffect(() => {
    if (pendingImagineerJobs.length === 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const jobIds = pendingImagineerJobs.map(j => j.job_id);
        
        // Fetch up to 100 most recent jobs to find relevant ones.
        const allJobs = await ImagineerJob.list('-created_date', 100); 
        const relevantJobs = allJobs.filter(j => jobIds.includes(j.job_id));

        // Create a temporary array for jobs that are still pending after this poll cycle
        const nextPendingJobs = [...pendingImagineerJobs];

        for (const job of relevantJobs) {
          const pendingJobIndex = nextPendingJobs.findIndex(pj => pj.job_id === job.job_id);
          
          // If the job is not found in our current pending list, it's already processed or not ours.
          if (pendingJobIndex === -1) continue; 

          if (job.status === 'completed' && job.image_url) {
            // RACE FIX: Remove from pending immediately to prevent duplicate processing
            nextPendingJobs.splice(pendingJobIndex, 1);
            
            // Replace placeholder with actual image
            const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
            const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
            
            if (iframeDoc) {
              const placeholder = iframeDoc.querySelector(`[data-imagineer-job="${job.job_id}"]`);
              
              if (placeholder) {
                // Create the image element
                const imgElement = iframeDoc.createElement('img');
                imgElement.src = job.image_url;
                imgElement.alt = job.prompt || 'Generated image';
                imgElement.style.cssText = 'width: 100%; max-width: 100%; height: auto; display: block; border-radius: 8px;';
                
                // Create the wrapper div, similar to infographics
                const wrapperDiv = iframeDoc.createElement('div');
                wrapperDiv.setAttribute('data-b44-id', job.job_id); // Use job_id as the ID for selection
                wrapperDiv.setAttribute('data-b44-type', 'infographic'); // Use 'infographic' type for full width display
                wrapperDiv.style.cssText = 'width: 100%; margin: 20px 0; padding: 0; display: block; clear: both; text-align: center;';
                wrapperDiv.appendChild(imgElement);

                placeholder.replaceWith(wrapperDiv); // Replace placeholder with the new wrapper
                
                // Trigger content update in React state
                const updatedHtml = iframeDoc.body.innerHTML;
                skipNextPreviewPushRef.current = true;
                handleContentChange(updatedHtml); // Use hook's content handler
                
                toast.success('Imagineer image generated successfully!');
              }
            }
          } else if (job.status === 'failed') {
            // RACE FIX: Remove from pending immediately
            nextPendingJobs.splice(pendingJobIndex, 1);
            
            // Remove placeholder on failure
            const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
            const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
            
            if (iframeDoc) {
              const placeholder = iframeDoc.querySelector(`[data-imagineer-job="${job.job_id}"]`);
              if (placeholder) {
                placeholder.remove();
                
                // Trigger content update in React state
                const updatedHtml = iframeDoc.body.innerHTML;
                skipNextPreviewPushRef.current = true;
                handleContentChange(updatedHtml); // Use hook's content handler
              }
            }
            
            toast.error('Imagineer image generation failed');
          }
        }
        // Update the component's state with the modified list of pending jobs
        setPendingImagineerJobs(nextPendingJobs);
      } catch (error) {
        console.error('Error polling Imagineer jobs:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [pendingImagineerJobs, handleContentChange, skipNextPreviewPushRef]);


  const handleImagineerGenerate = async ({ prompt, style, influence, dimensions }) => {
    const jobId = `imagineer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    // NEW: Deduct tokens for 'imagineer' feature immediately (non-blocking)
    consumeTokensOptimistic('imagineer');
    
    try {
      // Get the iframe and its selection BEFORE doing anything
      const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      
      if (!iframeDoc) {
        throw new Error("Cannot access editor preview");
      }

      const iframeWindow = iframe.contentWindow;
      const selection = iframeWindow.getSelection();
      
      if (!selection || selection.rangeCount === 0) {
        throw new Error("No text selected");
      }

      const range = selection.getRangeAt(0);
      
      // CRITICAL: Find the parent block element
      let parentBlock = range.endContainer;
      while (parentBlock && parentBlock.nodeType !== 1) {
        parentBlock = parentBlock.parentNode;
      }
      
      // Walk up to find a true block-level element
      while (parentBlock && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'SECTION', 'ARTICLE', 'UL', 'OL'].includes(parentBlock.nodeName)) {
        parentBlock = parentBlock.parentNode;
      }

      // CRITICAL FIX: If we're inside a list item, walk up to the list container (OL/UL)
      if (parentBlock && parentBlock.nodeName === 'LI') {
        let listContainer = parentBlock.parentNode;
        while (listContainer && !['UL', 'OL'].includes(listContainer.nodeName)) {
          listContainer = listContainer.parentNode;
        }
        if (listContainer) {
          parentBlock = listContainer;
        }
      }

      if (!parentBlock || parentBlock === iframeDoc.body) {
        parentBlock = iframeDoc.body;
      }

      // CRITICAL: Clear selection IMMEDIATELY before creating placeholder
      selection.removeAllRanges();

      const selectedUsername = currentPost?.user_name || currentWebhook?.user_name || null;

      // Call backend to initiate generation
      await initiateImagineerGeneration({
        job_id: jobId,
        prompt,
        style,
        influence,
        dimensions,
        placeholder_id: jobId,
        user_name: selectedUsername
      });

      // Create a completely fresh placeholder element (no inheritance possible)
      const placeholderDiv = iframeDoc.createElement('div');
      placeholderDiv.setAttribute('data-imagineer-job', jobId);
      placeholderDiv.setAttribute('data-b44-id', jobId);
      placeholderDiv.setAttribute('data-b44-type', 'imagineer-placeholder'); // Ensure type is set for selection
      placeholderDiv.style.cssText = 'margin: 20px 0; padding: 20px; border: 2px dashed #9333ea; border-radius: 88px; text-align: center; background: #faf5ff;';
      placeholderDiv.innerHTML = `
        <div style="display: inline-flex; align-items: center; gap: 8px; color: #9333ea; font-weight: 500;">
          <svg class="animate-spin" style="width: 20px; height: 20px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating image...
        </div>
      `;
      
      // Insert AFTER the parent block element as a clean sibling (OUTSIDE any list structure)
      if (parentBlock === iframeDoc.body) {
        iframeDoc.body.appendChild(placeholderDiv);
      } else if (parentBlock.nextSibling) {
        parentBlock.parentNode.insertBefore(placeholderDiv, parentBlock.nextSibling);
      } else {
        parentBlock.parentNode.appendChild(placeholderDiv);
      }

      // Update the main component's content state
      const updatedHtml = iframeDoc.body.innerHTML;
      skipNextPreviewPushRef.current = true;
      handleContentChange(updatedHtml); // Use hook's content handler

      toast.success("Image generation started! The image will appear here once ready.");
      
      setPendingImagineerJobs(prev => [...prev, {
        job_id: jobId,
        placeholder_id: jobId,
        prompt,
        style,
        influence,
        dimensions,
        startedAt: Date.now(),
      }]);

    } catch (error) {
      console.error("Imagineer generation error:", error);
      toast.error(error.message || "Failed to start image generation");
    }
  };


  const { enabled: isAiTitleRewriteEnabled } = useFeatureFlag('ai_title_rewrite', { currentUser });

  const handleRewriteTitle = async () => {
    if (!isAiTitleRewriteEnabled) {
      toast.message("AI Title Rewrite is not enabled for your account.");
      return;
    }

    const tokenResult = await consumeTokensForFeature('ai_title_rewrite');
    if (!tokenResult.success) {
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

      const truncatedContent = (content || "").substring(0, 15000);
      const prompt = `Rewrite the blog post title to be highly optimized for SEO while remaining natural and compelling.
Constraints:
- Under 60 characters
- Include the primary keyword if it appears in the content or title
- No quotes or emojis
- Title Case

Article Content (may be empty if not provided):
${truncatedContent || "(no article body provided, use semantic rewriting based on the current title only)"}

Current Title: ${title}`;

      await agentSDK.addMessage(conversation, {
        role: "user",
        content: prompt,
      });

      const pollTimeout = 90000;
      const pollInterval = 2000;
      const startTime = Date.now();

      let newTitle = "";
      let attempts = 0;
      const maxAttempts = Math.ceil(pollTimeout / pollInterval);

      while (Date.now() - startTime < pollTimeout && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const updatedConversation = await agentSDK.getConversation(conversation.id);
        const lastMessage = updatedConversation?.messages?.[updatedConversation.messages.length - 1];

        if (lastMessage?.role === 'assistant' && (lastMessage.is_complete === true || lastMessage.content)) {
          let contentStr = lastMessage.content || "";
          newTitle = contentStr
            .replace(/^["']|["']$/g, "")
            .replace(/^\*\*|\*\*$/g, "")
            .replace(/^#+\s*/, "")
            .replace(/\n+/g, " ")
            .trim();

          if (newTitle && newTitle.length > 5) break;
        }
      }

      if (newTitle && newTitle.length > 5) {
        handleTitleChangeFromHook(newTitle); // Use hook's title handler
        toast.success("AI successfully rewrote the title!");
      } else {
        throw new Error("AI did not generate a valid title. Please try again.");
      }
    } catch (error) {
      console.error("AI title rewrite error:", error);
      toast.error(error.message || "Failed to rewrite title.");
    } finally {
      setIsRewritingTitle(false);
    }
  };

  const handleCiteSources = async () => {
    const result = consumeTokensForFeature("ai_cite_sources");
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
    handleContentChange(cleaned); // Use hook's content handler
    sendToPreview({ type: "set-html", html: cleaned });
  };

  const handleMediaInsert = (media) => {
    if (typeof media === 'string') {
        insertContentAtPoint({ html: media, mode: 'at-caret' });
    }
    else if (typeof media === 'object' && media.url && media.source) {
        handleImageInsertFromLibrary(media);
    }
    setShowMediaLibrary(false);
    setMediaLibraryInitialTab(undefined);
  };

  const openImageGenerator = () => {
    setImageLibraryDefaultProvider("fal_ai");
    setImageLibraryGenerateOnly(true);
    setShowImageLibrary(true);
  };

  const handleVoiceInsert = (transcribedText) => {
    if (!transcribedText) return;
    
    const html = `<p>${transcribedText}</p>`;
    insertContentAtPoint({ html, mode: isTextSelected ? 'after-selection' : 'at-caret' });
    setShowVoiceModal(false);
    toast.success('Transcription inserted');
  };

  // Remove loadPostContent and loadWebhookContent and initializeEditor as they are now handled by useEditorContent hook.

  // Helper to trigger auto-save (used by various modals/features)
  const triggerAutoSave = useCallback(() => {
    // This will trigger the useEffect for auto-save if hasUnsavedChanges is true
    // No need to directly call saveContent here, as the useEffect already handles debouncing.
  }, []);

  // NEW: Handler for the hidden InternalLinkerButton's onApply
  const handleApplyInternalLinks = useCallback((updatedHtml) => {
    skipNextPreviewPushRef.current = true;
    handleContentChange(updatedHtml); // Use hook's content handler
    sendToPreview({ type: "set-html", html: updatedHtml });
    setIsAutoLinking(false); // Hide the loader after auto-linking is complete
    toast.success("Internal links auto-generated!");
    saveContent(); // Trigger an immediate save
  }, [sendToPreview, handleContentChange, saveContent]);

  // NEW: Handler for the hidden AutoScanButton's onApply
  const handleApplyAutoScan = useCallback((updatedHtml) => {
    skipNextPreviewPushRef.current = true;
    handleContentChange(updatedHtml); // Use hook's content handler
    sendToPreview({ type: "set-html", html: updatedHtml });
    setIsAutoScanning(false); // Hide the loader after auto-scanning is complete
    toast.success("AutoScan completed!");
    saveContent(); // Trigger an immediate save
  }, [sendToPreview, handleContentChange, saveContent]);

  // NEW: Handler for the hidden LinksAndReferencesButton's onApply
  const handleApplyLinksAndReferences = useCallback((updatedHtml) => {
    skipNextPreviewPushRef.current = true;
    handleContentChange(updatedHtml); // Use hook's content handler
    sendToPreview({ type: "set-html", html: updatedHtml });
    toast.success("References generated!");
    saveContent(); // Trigger an immediate save
  }, [sendToPreview, handleContentChange, saveContent]);

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
        consumeTokensForFeature('ai_generate_image').then(result => {
          if (result.success) openImageGenerator();
        });
        return;

      case "imagineer":
        setShowImagineer(true);
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

      case "references": // NEW: Trigger LinksAndReferencesButton for generating references
        if (!content || String(content).trim().length === 0) {
          toast.message("Add some content first, then try generating references.");
          return;
        }
        if (referencesButtonRef.current) {
          referencesButtonRef.current.run();
        } else {
          console.error("ReferencesButton ref not available.");
          toast.error("References feature is not ready. Please try again.");
        }
        return;

      case "seo": // NEW: SEO handling moved to Quick Pick
        setIsSEOSettingsOpen(true);
        return;

      case "faq":
        setShowFaqGenerator(true);
        return;

      case "localize":
        setShowLocalize(true);
        return;

      case "tiktok":
        consumeTokensForFeature('ai_tiktok').then(result => {
          if (result.success) {
            setMediaLibraryInitialTab("tiktok");
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
        if (latest) {
          setTextForAction(latest);
          setIsTextSelected(true);
        }
        setShowAudioModal(true);
        return;
      }

      case "voice":
        setShowVoiceModal(true);
        return;

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

      case "flash": // NEW: Wire up Flash button in Ask AI modal
        setShowFlashModal(true);
        return;

      case "autolink":
        if (!content || String(content).trim().length === 0) {
          toast.message("Add some content first, then try AutoLink.");
          return;
        }
        setIsAutoLinking(true); // Show MagicOrbLoader
        // Trigger the InternalLinkerButton programmatically
        if (internalLinkerRef.current) {
          internalLinkerRef.current.run();
        } else {
          console.error("InternalLinkerButton ref not available for autolink.");
          setIsAutoLinking(false); // Hide loader if unable to run
          toast.error("AutoLink feature is not ready. Please try again.");
        }
        return;

      case "autoscan": // NEW: AutoScan button from Ask AI Quick Menu
        if (!content || String(content).trim().length === 0) {
          toast.message("Add some content first, then try AutoScan.");
          return;
        }
        setIsAutoScanning(true); // Show MagicOrbLoader
        if (autoScanButtonRef.current) {
          autoScanButtonRef.current.run();
        } else {
          console.error("AutoScanButton ref not available for autoscan.");
          setIsAutoScanning(false); // Hide loader if unable to run
          toast.error("AutoScan feature is not ready. Please try again.");
        }
        return;

      case "media-library":
        setMediaLibraryInitialTab(undefined);
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

      case "infographics":
        // Capture the current selected text before opening modal
        let infographicText = (textForAction || "").trim();
        if (!infographicText) {
          // Try to get selection from iframe if textForAction is empty
          try {
            const iframe = document.querySelector('iframe[title="Live HTML Preview"]');
            const win = iframe?.contentWindow;
            if (win && typeof win.getSelection === "function") {
              infographicText = (win.getSelection()?.toString() || "").trim();
            }
          } catch (_) {}
        }

        // Store the text in state before opening modal
        if (infographicText) {
          setTextForAction(infographicText);
          setIsTextSelected(true);
        } else {
          // If no text is selected, ensure textForAction is cleared for the modal,
          // so it doesn't use stale selection.
          setTextForAction("");
          setIsTextSelected(false);
        }
        setShowInfographics(true);
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
      undo: () => handleUndo(),
      redo: () => handleRedo(),
      showShortcuts: () => setShowCheatsheet(true)
    },
    { enabled: true }
  );

  // loadPostContent and loadWebhookContent are now handled by the useEditorContent hook.

  // The main useEffect for initializing editor based on URL (previously `initializeEditor`):
  // This useEffect is no longer needed here as useEditorContent handles the initial loading
  // based on postId, webhookId props, and local storage.


  const isFreeTrial = useMemo(() => {
    if (!userPlan) return false;
    return userPlan === 'price_1S7VhHQ1L6eczTxdoaAAaAZK' || userPlan === 'sddsg';
  }, [userPlan]);

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
    if (!contentLoading) { // Changed from `isLoading` to `contentLoading`
      if (skipNextPreviewPushRef.current) {
        skipNextPreviewPushRef.current = false;
        return;
      }
      const t = setTimeout(() => {
        sendToPreview({ type: "set-html", html: content || "" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [contentLoading, content, sendToPreview]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e?.data;
      if (d?.type === "media-selected") {
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
        handleContentChange(d.html); // Use hook's content handler
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [handleContentChange]);


  const loadPublishCredentials = useCallback(async () => {
    if (!currentUser) return;

    setLoadingCredentials(true);
    try {
      const assignedUsernames = Array.isArray(currentUser.assigned_usernames)
        ? currentUser.assigned_usernames
        : [];

      const postUsername = currentPost?.user_name || currentWebhook?.user_name;

      let filtered = [];

      if (postUsername) {
        filtered = await IntegrationCredential.filter({ user_name: postUsername }, "-updated_date");
      } else if (assignedUsernames.length > 0) {
        const credPromises = assignedUsernames.map(username =>
          IntegrationCredential.filter({ user_name: username }, "-updated_date")
        );
        const credArrays = await Promise.all(credPromises);
        filtered = credArrays.flat();
      }

      setPublishCredentials(filtered || []);
      retryAttemptsRef.current.credentials = 0; // Reset on success
    } catch (error) {
      console.error("Failed to load credentials:", error);
      if (error?.response?.status === 429 && retryAttemptsRef.current.credentials < 3) {
        const delay = Math.pow(2, retryAttemptsRef.current.credentials) * 1000 + (Math.random() * 500); // 1s, 2s, 4s + jitter
        console.log(`Rate limited loading credentials, retrying in ${delay}ms (attempt ${retryAttemptsRef.current.credentials + 1}/3)`);
        retryAttemptsRef.current.credentials++;
        setTimeout(() => loadPublishCredentials(), delay);
      } else {
        toast.error("Failed to load publishing credentials.");
        setPublishCredentials([]);
      }
    } finally {
      setLoadingCredentials(false);
    }
  }, [currentUser, currentPost, currentWebhook, retryAttemptsRef]);

  useEffect(() => {
    if (currentUser) {
      loadPublishCredentials();
    }
  }, [currentUser, loadPublishCredentials]);


  const handleCMSModalClose = useCallback(() => {
    setShowCMSModal(false);
    loadPublishCredentials();
  }, [loadPublishCredentials]);


  const extractFirstImageUrl = (html) => {
    const m = String(html || "").match(/<img[^>]*src=["']([^"']+)["']/i);
    return m && m[1] ? m[1] : "";
  };

  const buildWordPressHtmlIslandBlock = (rawHtml) => {
    const cleanHtml = (html) => {
      let cleaned = String(html || "");

      cleaned = cleaned.replace(/<([a-z0-9:-]+)\b[^>]*class=["'][^"']*b44-select-handle\b[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, '');

      cleaned = cleaned.replace(/\s+data-filename=["'][^"']*["']/gi, '');
      cleaned = cleaned.replace(/\s+data-linenumber=["'][^"']*["']/gi, '');
      cleaned = cleaned.replace(/\s+data-visual-selector-id=["'][^"']*["']/gi, '');

      cleaned = cleaned.replace(/\s+data-b44-id=["'][^"']*["']/gi, '');
      cleaned = cleaned.replace(/\s+data-b44-type=["'][^"']*["']/gi, '');
      cleaned = cleaned.replace(/\s+data-b44-processed=["'][^"']*["']/gi, '');

      cleaned = cleaned.replace(/\s+on(click|mouseover|mouseout|focus|blur|change|submit|load|error)=["'][^"']*["']/gi, '');

      cleaned = cleaned.replace(/style=(["'])([\s\S]*?)\1/gi, (m, q, styles) => {
        const out = styles.replace(/\boutline(?:-offset)?\s*:\s*[^;"]*;?/gi, '').trim();
        return out ? `style=${q}${out}${q}` : '';
      });

      cleaned = cleaned.replace(/\s+style=["']\s*["']/gi, '');

      const tiktokEmbedScriptRegex = /<script[^>]*id=["']ttEmbedLibScript["'][^>]*>[\s\S]*?<\/script>/gi;
      const tiktokMatches = [...cleaned.matchAll(tiktokEmbedScriptRegex)];
      if (tiktokMatches.length > 1) {
        cleaned = cleaned.replace(tiktokEmbedScriptRegex, '');
        cleaned += tiktokMatches[0][0];
      }

      const faqSchemas = [];
      cleaned = cleaned.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (m, content) => {
        try {
          const parsed = JSON.parse(content);
          if (parsed['@type'] === 'FAQPage') {
            const key = JSON.stringify(parsed.mainEntity || []);
            if (faqSchemas.includes(key)) return '';
            faqSchemas.push(key);
          }
        } catch {}
        return m;
      });

      cleaned = cleaned.replace(/\s{2,}/g, ' ');
      cleaned = cleaned.replace(/\s+>/g, '>');

      return cleaned.trim();
    };

    const normalizeH2SpanIds = (html) =>
      String(html).replace(
        /<h2(\s[^>]*)?>\s*<span\s+id=["']([^"']+)["'][^!]*>([\s\S]*?)<\/span>\s*<\/h2>/gi,
        (m, attrs = "", id, inner) => `<h2 id="${id}"${attrs || ""}>${inner}</h2>`
      );

    const addSequentialH2Ids = (html) => {
      let counter = 0;
      return String(html).replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (m, attrs = "", inner) => {
        if (/\sid="[^"]+"/i.test(m)) return m;
        if (/<(span|a|em|strong)[^!]*\sid=["'][^"']+["']/i.test(inner)) return m;
        counter += 1;
        const id = `topic${counter}`;
        return `<h2 id="${id}"${attrs || ""}>${inner}</h2>`;
      });
    };

    const css = `/* Scoped article styles */
.ls-article,.ls-article *{box-sizing:border-box}
.ls-article{
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  color:#0f172a;font-size:20px;line-height:1.78;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
  overflow-wrap:break-word;word-break:normal
}
.ls-article{max-width:880px;width:100%;margin:0 auto;padding:40px 24px 72px}
.ls-article a{color:#1d4ed8;text-decoration:none}
.ls-article img,.ls-article video,.ls-article iframe{max-width:100%;height:auto;display:block}

.ls-article h1,.ls-article h2,.ls-article h3{line-height:1.25;color:#0b1220;margin:0}
.ls-article h1{font-size:2.6rem;margin:14px 0 10px}
.ls-article h2{font-size:1.8rem;margin-top:36px;scroll-margin-top:96px}
.ls-article h3{font-size:1.3rem;margin-top:26px;scroll-margin-top:96px}
.ls-article p{margin:16px 0}
.ls-article ul,.ls-article ol{padding-left:22px;margin:14px 0}
.ls-article li{margin:8px 0}
.ls-article .muted{color:#475569;font-size:.97em}

.ls-article .toc{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-top:8px}
.ls-article .callout{background:#f1f5ff;border:1px solid #c7d2fe;padding:16px;border-radius:12px}

.ls-article .table-wrap{overflow-x:auto}
.ls-article table{width:100%;border-collapse:collapse;margin:18px 0}
.ls-article th,.ls-article td{border:1px solid #e2e8f0;padding:14px;vertical-align:top;text-align:left}
.ls-article th{background:#f1f5f9}

.ls-article .b44-cta{margin:2rem 0;padding:1.25rem 1.5rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
.ls-article .b44-cta a,
.ls-article .b44-cta .cta-btn{
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  gap:.5rem;
  padding:12px 18px !important;
  background:#4f46e5 !important;
  color:#fff !important;
  text-decoration:none !important;
  font-weight:700 !important;
  border:0 !important;
  border-radius:10px !important;
  line-height:1 !important;
  white-space:normal !important;
  box-shadow:0 2px 8px rgba(79,70,229,.25) !important;
  transform:none !important;
}
.ls-article .b44-cta a:hover,
.ls-article .b44-cta .cta-btn:hover{background:#4338ca !important}
.ls-article .b44-cta a::before,
.ls-article .b44-cta a::after,
.ls-article .b44-cta .cta-btn::before,
.ls-article .b44-cta .cta-btn::after{content:none !important;display:none !important}

.ls-article .b44-faq-block input[type="checkbox"],
.ls-article input[type="checkbox"][id^="faq-"],
.ls-article input[type="checkbox"][id^="accordion-"]{position:absolute;left:-9999px;opacity:0}

.ls-article [class*="faq-"],
.ls-article [class*="accordion"]{background:transparent !important;border:0 !important;box-shadow:none !important}

.ls-article [class*="faq-"][class$="-wrap"],
.ls-article .faq-wrap,
.ls-article .faq-container{
  margin:24px 0 !important;
  padding:16px !important;
  background:#f9fafb !important;
  border:1px solid #e5e7eb !important;
  border-radius:8px !important;
}

.ls-article .faq-item,
.ls-article .b44-faq-block .faq-item,
.ls-article [class*="faq-"][class$="-item"]{
  background:#fff !important;
  border:0 !important;
  border-bottom:1px solid #e5e7eb !important;
  border-radius:0 !important;
  box-shadow:none !important;
  padding:18px 16px !important;
  margin:0 !important;
}
.ls-article .faq-item:last-child{border-bottom:0 !important}

.ls-article [class*="faq-"][class$="-trigger"],
.ls-article .faq-question,
.ls-article label[for^="faq-"]{
  display:flex !important;
  align-items:center !important;
  justify-content:space-between !important;
  gap:12px;
  margin:0 !important;
  padding:8px 0 !important;
  font-weight:700 !important;
  color:#0b1220 !important;
  cursor:pointer !important;
  min-height:44px !important;
  user-select:none !important;
  -webkit-user-select:none !important;
}

.ls-article [class*="faq-"][class$="-trigger"]:hover,
.ls-article .faq-question:hover,
.ls-article label[for^="faq-"]:hover{
  color:#4f46e5 !important;
}

.ls-article [class*="faq-"] [class$="-q"],
.ls-article .faq-q{font-weight:700 !important;margin:0 !important}

.ls-article [class*="faq-"][class$="-content"],
.ls-article .faq-answer,
.ls-article [id^="faq-content-"]{
  max-height:0;
  overflow:hidden;
  transition:max-height .25s ease,padding .25s ease;
  padding:0 !important;
  margin:0 !important;
}

.ls-article [class*="faq-"][class$="-toggle"]:checked ~ [class$="-content"],
.ls-article input[type="checkbox"][id^="faq-"]:checked ~ [id^="faq-content-"],
.ls-article input[type="checkbox"][id^="faq-"]:checked ~ .faq-answer{
  max-height:1200px !important;
  padding:12px 0 !important;
}

@media (max-width:1024px){
  .ls-article{font-size:19px}
  .ls-article .container{padding:36px 20px 64px}
  .ls-article h1{font-size:2.3rem}
  .ls-article h2{font-size:1.7rem}
  .ls-article h3{font-size:1.25rem}
}
@media (max-width:640px){
  .ls-article{font-size:18.5px}
  .ls-article .container{padding:28px 16px 56px}
  .ls-article h1{font-size:2.1rem}
  .ls-article h2{font-size:1.55rem}
  .ls-article h3{font-size:1.22rem}
  .ls-article ul,.ls-article ol{padding-left:18px}
  .ls-article .toc{padding:16px}
  .ls-article .b44-cta a,.ls-article .b44-cta .cta-btn{width:100%}
  .ls-article .faq-item{padding:16px 12px !important}
}
@media (prefers-reduced-motion:reduce){.ls-article *{animation:none!important;transition:none!important}}`;

    const faqToggleScript = `
<script>
(function() {
  if (typeof window === 'undefined') return;

  document.addEventListener('DOMContentLoaded', function() {
    const labels = document.querySelectorAll('label[for^="faq-"], label[for^="accordion-"]');
    labels.forEach(function(label) {
      label.style.cursor = 'pointer';
      label.addEventListener('click', function(e) {
        const forAttr = this.getAttribute('for');
        if (!forAttr) return;

        const checkbox = document.getElementById(forAttr);
        if (checkbox && checkbox.type === 'checkbox') {
          e.preventDefault();
          checkbox.checked = !checkbox.checked;

          this.setAttribute('aria-expanded', checkbox.checked ? 'true' : 'false');
          const controlId = checkbox.getAttribute('aria-controls');
          if (controlId) {
            const content = document.getElementById(controlId);
            if (content) {
              content.setAttribute('aria-hidden', checkbox.checked ? 'false' : 'true'); // Fixed accessibility issue with aria-hidden logic
            }
          }
        }
      });
    });

    document.querySelectorAll('input[type="checkbox"][id^="faq-"], input[type="checkbox"][id^="accordion-"]').forEach(function(cb) {
      const label = document.querySelector('label[for="' + cb.id + '"]');
      if (label) {
        label.setAttribute('aria-expanded', cb.checked ? 'true' : 'false');
      }
      const controlId = cb.getAttribute('aria-controls');
      if (controlId) {
        const content = document.getElementById(controlId);
        if (content) {
          content.setAttribute('aria-hidden', cb.checked ? 'false' : 'true');
        }
      }
    });
  });
})();
</script>`;

    let html = cleanHtml(rawHtml);
    html = normalizeH2SpanIds(html);
    html = addSequentialH2Ids(html);

    const hasWrapper = /class=["'][^"']*\bls-article\b[^"']*["']/.test(html);
    const wrapped = hasWrapper ? html : `<div class="ls-article"><main class="container">${html}</main></div>`;
    const hasStyle = /<style[\s>][\s\S]*?<\/style>/i.test(wrapped) && /\.ls-article/.test(wrapped);
    const htmlWithStyle = hasStyle ? wrapped : `<style>${css}</style>\n${wrapped}`;

    return `${htmlWithStyle}\n${faqToggleScript}`;
  };

  const publishToDefaultNow = async (postToPublish) => {
    const provider = postToPublish._overrideProvider;
    const credentialId = postToPublish._overrideCredentialId;
    const label = postToPublish._overrideLabel;

    if (!provider || !credentialId) {
      toast.error("Invalid publishing configuration.");
      return;
    }

    if (provider === "shopify") {
      shopifyPreset.current = { credentialId: credentialId || null };
      setShowShopifyModal(true);
      setIsPublishing(false);
      return;
    }

    if (provider === "wordpress" || provider === "wordpress_org") {
      const htmlForWp = postToPublish.overrideHtml
        || buildWordPressHtmlIslandBlock(postToPublish.content || "");

      const payload = {
        provider: provider,
        credentialId: credentialId,
        title: postToPublish.title || "Untitled",
        content: htmlForWp,
        content_html: htmlForWp,
        text: String(postToPublish.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        status: "publish"
      };

      const { data } = await securePublish(payload);

      if (data?.success || data?.ok) {
        toast.success(`Published to ${label || "WordPress"}.`);
      } else {
        toast.error(data?.error || "Publishing to WordPress failed.");
      }
      setIsPublishing(false);
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
        if (data?.success || data?.ok) toast.success(`Published to ${label || "Webhook"}.`);
        else toast.error(data?.error || "Webhook publish failed.");
        return;
      }

      if (provider === "notion") {
        const coverCandidate = postToPublish.featured_image || extractFirstImageUrl(postToPublish.content);
        if (!coverCandidate) {
          try {
            localStorage.setItem("cms_default_provider", "notion");
            localStorage.setItem("cms_default_credential_id", credentialId);
          } catch (_) {}
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
        if (data?.success || data?.ok) toast.success(`Published to ${label || "Notion"}.`);
        else toast.error(data?.error || "Publishing to Notion failed.");
        return;
      }

      const { data } = await securePublish({
        provider,
        credentialId: credentialId,
        title: postToPublish.title || "Untitled",
        html: postToPublish.content || "",
        text: plainText
      });
      if (data?.success || data?.ok) toast.success(`Published to ${label || provider}.`);
      else if (provider === 'notion' && data?.code === 'COVER_REQUIRED') {
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
    const isPublishFlow = status === 'published';
    if (!isPublishFlow) {
      // The `isSaving` state is from the hook, it'll update internally
    } else {
      setIsPublishing(true); // Control local publishing state
    }

    try {
      let finalContent = options.overrideHtml !== undefined ? options.overrideHtml : content;
      let generatedLlmSchema = currentPost?.generated_llm_schema || null;

      const enableSchemaGeneration = false; // Keep as false or dynamically set as needed

      if (isPublishFlow) {
        if (enableSchemaGeneration && !generatedLlmSchema) {
          toast.info("Generating hyper-detailed AI schema for your content. This may take up to a minute...", { duration: 60000 });
          try {
            const generatedSchema = await generateSchemaForPost(title, content);
            if (generatedSchema) {
              generatedLlmSchema = generatedSchema;
              toast.success("AI Schema generated successfully.");
            }
          } catch (error) {
            toast.error(error.message || "Failed to generate AI schema. Publishing without schema.");
          }
        }

        if (generatedLlmSchema && String(generatedLlmSchema).trim().startsWith("{")) {
          const schemaScript = `<script type="application/ld+json">${generatedLlmSchema}</script>`;
          if (!finalContent.includes(schemaScript.substring(0, 50))) { // Check for a unique part of the script
            finalContent = `${schemaScript}\n${finalContent}`;
          }
        }
      }

      // Call the hook's saveContent function with all necessary data
      const savedPostEntity = await saveContent(status, {
        ...options,
        overrideContent: finalContent, // Pass content potentially modified with schema
        overrideTitle: title, // Always pass current title
        overridePriority: priority, // Pass current priority
        overrideGeneratedLlmSchema: generatedLlmSchema, // Pass potentially generated schema
      });

      if (isPublishFlow) {
        if (options.useGoogleDocs) {
          const safeTitle = (savedPostEntity.title || "Untitled Post").replace(/</g, "&lt;").replace(/>/g, ">");
          const fullHtmlForGDocs = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>${savedPostEntity.content}</body></html>`;
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
              toast.message("Clipboard not available. A new tab opened with the HTML; Select All and Copy, then paste into Google Docs.");
              if (win) return;
            }
            toast.success("Content with schema copied. A new Google Doc will open — paste (Cmd/Ctrl + V) to insert your content.");
          } catch (e) {
            toast.message("Could not copy HTML automatically. We'll still open Google Docs; please return here, copy, then paste.");
            console.error("Copy to clipboard failed:", e);
          }
          window.open("https://docs.google.com/document/create", "_blank");
        } else if (options.useDefaultProvider) {
          await publishToDefaultNow(savedPostEntity);
        } else if (options.publishTo) {
          await publishToDefaultNow({
            ...savedPostEntity,
            _overrideProvider: options.publishTo.provider,
            _overrideCredentialId: options.publishTo.credentialId,
            _overrideLabel: options.publishTo.labelOverride,
            overrideHtml: options.overrideHtml // Use the content potentially modified by schema for publishing
          });
        }

        if (currentWebhook) {
          await sendToAirtable({
            title: savedPostEntity.title,
            content: savedPostEntity.content,
            webhookData: currentWebhook.webhook_data,
            recordId: currentWebhook.processing_id
          });
          setWebhookState({ status: "published", published_at: new Date().toISOString() }); // Update webhook state via hook
        }
      } else if (currentWebhook) {
        setWebhookState({ status: "editing" }); // Update webhook state via hook
      }

      if (!isPublishFlow) {
        toast.success("Post saved successfully as draft!");
      }
      retryAttemptsRef.current.save = 0; // Reset on success
      return true; // Indicate success
    } catch (error) {
      console.error(`Failed to ${isPublishFlow ? 'publish' : 'save'} post:`, error);
      toast.error(`Failed to ${status === 'published' ? 'publish' : 'save'} post. ${error.message || 'Unknown error'}`);
      return false; // Indicate failure
    } finally {
      if (isPublishFlow) setIsPublishing(false);
    }
  };


  const sendToAirtable = async (postData) => {
    try {
      let webhookBody = postData.webhookData;

      if (typeof webhookBody === "string") {
        try {
          webhookBody = JSON.parse(webhookBody);
        } catch (e) {
          console.warn("Airtable: malformed webhook_data string.", e, webhookBody);
          return;
        }
      }

      if (typeof webhookBody !== "object" || webhookBody === null) {
        console.warn("Airtable: webhook data not an object after processing.");
        return;
      }

      const tableId = webhookBody?.table;
      const recordId = webhookBody?.["record-id"];

      if (!recordId || !tableId) {
        console.warn("Airtable: missing record-id or table id.");
        return;
      }

      const payload = {
        tableId,
        recordId,
        title: postData.title,
        content: postData.content
      };

      const response = await publishToAirtable(payload);

      if (response?.data?.success) {
        console.debug?.("Airtable publish: success (silent).");
      } else {
        const errorMessage = response?.data?.error || "Unknown Airtable update error.";
        console.warn("Airtable publish failed (silent):", errorMessage, response?.data);
      }
    } catch (error) {
      console.warn("Airtable publish exception (silent):", error);
    }
  };

  const handleSave = () => savePost('draft');

  const handlePublishGoogleDocs = async () => {
    setIsPublishing(true);
    try {
      await savePost('published', { useGoogleDocs: true });
      toast.success("Content prepared for Google Docs.");
    } catch (error) {
      console.error("Publish to Google Docs error:", error);
      toast.error(`Failed to publish to Google Docs: ${error.message || "Unknown error"}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishToCredential = async (credential) => {
    setIsPublishing(true);
    try {
      const isWordPress = credential?.provider === "wordpress" || credential?.provider === "wordpress_org";
      const original = content;
      const htmlForWp = isWordPress ? buildWordPressHtmlIslandBlock(original) : original;

      await savePost('published', {
        publishTo: {
          provider: credential.provider,
          credentialId: credential.id,
          labelOverride: credential.name
        },
        overrideHtml: isWordPress ? htmlForWp : undefined
      });
      toast.success(`Published to ${credential.name}`);
    } catch (error)
      {
      console.error("Publish error:", error);
      toast.error(`Failed to publish: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };


  const handleSEOSave = (newMetadata) => {
    setPostState({ // Use setPostState from hook to update post metadata
      ...currentPost, // Keep existing post data
      ...newMetadata,
      ...(newMetadata.meta_title && { meta_title: newMetadata.meta_title }),
      ...(newMetadata.slug && { slug: newMetadata.slug }),
      ...(newMetadata.meta_description && { meta_description: newMetadata.meta_description }),
      ...(newMetadata.featured_image && { featured_image: newMetadata.featured_image }),
      ...(newMetadata.focus_keyword && { focus_keyword: newMetadata.focus_keyword }),
      ...(newMetadata.is_indexed === true || newMetadata.is_indexed === false ? { is_indexed: newMetadata.is_indexed } : {}), // Handle boolean
      ...(newMetadata.tags && { tags: newMetadata.tags }),
      ...(newMetadata.excerpt && { excerpt: newMetadata.excerpt }),
      ...(newMetadata.generated_llm_schema && { generated_llm_schema: newMetadata.generated_llm_schema }),
    });
    saveContent(); // Trigger an immediate save to persist SEO changes
  };

  // NEW: Handler to apply Flash workflow results
  const handleApplyFlashResult = useCallback((html, seoData, schemaData) => {
    if (html) {
      skipNextPreviewPushRef.current = true;
      handleContentChange(html); // Use hook's content handler
      sendToPreview({ type: "set-html", html: html });
    }
    if (seoData || schemaData) {
      // Apply SEO metadata and schema to the post using handleSEOSave
      setPostState((prev) => ({ // Use setPostState from hook
        ...prev,
        ...seoData,
        ...(schemaData && { generated_llm_schema: schemaData }) // Merge schemaData if present
      }));
      if (seoData) toast.success("SEO metadata updated!");
      if (schemaData) toast.success("Schema saved to SEO settings!");
    }
    setShowFlashModal(false);
    saveContent(); // Trigger an immediate save
  }, [sendToPreview, handleContentChange, setPostState, saveContent]);

  const handleOpenActionsModal = () => {
    if (isTextSelected) {
      setIsActionsModal(true);
    } else {
      toast.info("Please select text in the editor first.");
    }
  };

  const handleActionSelect = (actionId) => {
    switch (actionId) {
      case 'ai-rewrite': setShowAIModal(true); break;
      case 'humanize': setShowHumanizeModal(true); break;
      case 'generate-image': openImageGenerator(); break;
      case 'imagineer': setShowImagineer(true); break;
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
      case 'voice':
        setShowVoiceModal(true);
        break;
      default: break;
    }
  };

  const handleContentUpdate = useCallback((newContent) => {
    handleContentChange(newContent); // Use hook's content handler
    saveContent(); // Trigger an immediate save
  }, [handleContentChange, saveContent]);

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
    handleContentChange(cleaned); // Use hook's content handler
    sendToPreview({ type: "set-html", html: cleaned });
    saveContent(); // Trigger an immediate save
  };

  const handleApplyTextEdit = (html) => {
    insertContentAtPoint(html);
    setShowTextEditor(false);
    saveContent(); // Trigger an immediate save
  };

  const localHandleTitleChange = (e) => { // Renamed to localHandleTitleChange
    handleTitleChangeFromHook(e.target.value); // Use hook's title handler
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

  const handleCreateFromPaste = async ({ title: newTitle, content: newContent, user_name }) => {
    const saved = await BlogPost.create({
      title: newTitle || "Pasted Content",
      content: newContent,
      status: "draft",
      user_name
    });
    if (saved?.id) {
      const newUrl = createPageUrl(`Editor?post=${saved.id}`);
      navigate(newUrl, { replace: true }); // Use navigate with replace to trigger hook re-initialization
    }
  };

  const allowedUsernames = Array.isArray(currentUser?.assigned_usernames) ? currentUser.assigned_usernames : [];
  const defaultBrand = currentPost?.user_name || currentWebhook?.user_name || allowedUsernames?.[0] || "";

  const getUsernameForContent = () => {
    return currentPost?.user_name || currentWebhook?.user_name;
  };

  const cleanHtmlForExport = (htmlString) => {
    if (!htmlString) return "";

    let cleaned = String(htmlString);

    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

    cleaned = cleaned.replace(/<([a-z0-9:-]+)\b[^>]*class=["'][^"']*b44-select-handle\b[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, '');

    cleaned = cleaned.replace(/\sdata-b44-[\w-]+=(["'])[\s\S]*?\1/gi, '');

    cleaned = cleaned.replace(/style=(["'])([\s\S]*?)\1/gi, (m, q, styles) => {
      const out = styles.replace(/\boutline(?:-offset)?\s*:\s*[^;"]*;?/gi, '').trim();
      return out ? `style=${q}${out}${q}` : '';
    });

    cleaned = cleaned.replace(/\s+data-[\w-]+\s*=\s*"[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s+data-[\w-]+\s*=\s*'[^']*'/gi, '');
    cleaned = cleaned.replace(/\s+data-[\w-]+\s*=\s*[^\s>'"]+/gi, '');
    cleaned = cleaned.replace(/\s+data-[\w-]+\s*=\s*(("[^"]*"|'[^']*'|[^\s>]+))/gi, '');

    cleaned = cleaned.replace(/\s+data-[\w-]+\s*=\s*(?=[\s>])/gi, '');

    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    cleaned = cleaned.replace(/\s+>/g, '>');

    cleaned = cleaned.trim();

    return cleaned;
  };

  const handleDownloadTxt = () => {
    let exportContent = "";
    if (title) {
      const cleanTitle = cleanHtmlForExport(title);
      exportContent += `<title>${cleanTitle}</title>\n\n`;
    }
    if (currentPost?.meta_title || currentPost?.meta_description) {
      exportContent += "<!-- SEO METADATA -->\n";
      if (currentPost.meta_title) {
        exportContent += `<meta name="title" content="${cleanHtmlForExport(currentPost.meta_title)}" />\n`;
      }
      if (currentPost.meta_description) {
        exportContent += `<meta name="description" content="${cleanHtmlForExport(currentPost.meta_description)}" />\n`;
      }
      exportContent += "\n";
    }
    const cleanedContent = cleanHtmlForExport(content);
    exportContent += cleanedContent;
    const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "content").replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Content downloaded as TXT");
  };

  // findExistingPostByHeuristics and findBySessionKey are now internal to useEditorContent.
  // They should not be here.


  const handlePublishToShopify = useCallback(async () => {
    const cred = publishCredentials.find(c => c.provider === 'shopify');
    if (cred) {
      await handlePublishToCredential(cred);
    } else {
      toast.error("Shopify credential not found. Please configure it in publishing settings.");
      setShowCMSModal(true);
    }
  }, [publishCredentials, handlePublishToCredential]);

  const showPublishOptions = useMemo(() => publishCredentials.length > 0, [publishCredentials]);

  // Replaced original `isLoading` state check with `contentLoading` from hook.
  if (contentLoading) {
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
      <AuthGate currentUser={currentUser}>
        <div id="editor-neon" className="h-full overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
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

          .b44-cta {
            margin: 2rem 0 !important;
            padding: 1.5rem !important;
            box-sizing: border-box !important;
            display: block !important;
          }

          .neon-underline {
              position: relative;
            }
            .neon-underline::after {
              content: '';
              position: absolute;
              left: 0;
              bottom: -2px;
              width: 100%;
              height: 2px;
              background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
              border-radius: 2px;
              animation: neon-glow 2s ease-in-out infinite;
            }
            @keyframes neon-glow {
              0%, 100% { opacity: 0.8; box-shadow: 0 0 5px #3b82f6; }
              50% { opacity: 1; box-shadow: 0 0 15px #8b5cf6, 0 0 25px #ec4899; }
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

          <div className="flex flex-col relative z-10 h-full">

            {/* Always-visible floating publish button */}
            <FloatingPublishButton
              isPublishing={isPublishing}
              isFreeTrial={isFreeTrial}
              showPublishOptions={showPublishOptions}
              onDownloadTxt={handleDownloadTxt}
              onPublishToGoogleDocs={handlePublishGoogleDocs}
              onPublishToShopify={handlePublishToShopify}
              onOpenPublishOptions={() => setShowCMSModal(true)}
              isSavingAuto={isSaving && hasUnsavedChanges} // isSaving from hook combined with hasUnsavedChanges
              lastSaved={lastSaved}
            />

            <div className="flex-1 flex flex-col overflow-auto" key={`${currentWebhook?.id || 'nw'}-${currentPost?.id || 'np'}`}>
              <div className="border-b flex flex-col" style={{ borderColor: "var(--border)" }}>
                <div className="bg-slate-50 pt-3 pb-0 flex flex-col">
                  <div className="mt-3 w-full px-6">
                    <div className="relative">
                      <Input
                        placeholder="Enter your blog post title..."
                        value={title}
                        onChange={(e) => handleTitleChangeFromHook(e.target.value)} // Use hook's title handler
                        className="b44-title-input w-full text-[1.6rem] md:text-[1.95rem] font-bold py-2 leading-tight bg-white text-slate-900 placeholder:text-slate-600 border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-300 pr-12 resize-none overflow-hidden"
                      />
                      {isAiTitleRewriteEnabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                          onClick={handleRewriteTitle}
                          disabled={isRewritingTitle || !title}
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
                      {selectedMedia && (
                        <div className="bg-slate-50 text-slate-950 p-2 text-xs flex-shrink-0 flex items-center gap-3">
                          {selectedMedia.type === 'image' || selectedMedia.type === 'infographic' || selectedMedia.type === 'imagineer-placeholder' ? (
                            <>
                              <span className="opacity-70 whitespace-nowrap">Image width</span>
                              <div className="bg-slate-50 flex items-center gap-3 flex-1">
                                <Slider
                                  value={[selectedMedia.width ?? 100]}
                                  min={10}
                                  max={100}
                                  step={1}
                                  onValueChange={(val) => applyPreviewWidth(val[0])}
                                  className="bg-slate-50 text-base capitalize relative flex w-full touch-none select-none items-center flex-1"
                                />
                                <span className="w-12 text-right tabular-nums">{selectedMedia.width ?? 100}%</span>
                              </div>
                              <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
                            </>
                          ) : (
                            <div className="flex-1" />
                          )}

                          <button
                            onClick={handleDeleteSelected}
                            className="bg-violet-950 text-white p-1.5 rounded hover:bg-red-700"
                            title="Delete selected block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                  onFlash={() => { // NEW PROP for Flash button
                    setShowFlashModal(true);
                    setAskAIBar((s) => ({ ...s, visible: false })); // Close floating bar after click
                  }}
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


              {/* InternalLinker as a modal controlled by state - remains for manual opening */}
              {showInternalLinker && (
                <InternalLinkerButton
                  isOpen={showInternalLinker}
                  onClose={() => setShowInternalLinker(false)}
                  html={content}
                  userName={currentUsername}
                  onApply={(updatedHtml) => {
                    skipNextPreviewPushRef.current = true;
                    handleContentChange(updatedHtml); // Use hook's content handler
                    sendToPreview({ type: "set-html", html: updatedHtml });
                    setShowInternalLinker(false); // Close modal after apply
                    saveContent(); // Trigger an immediate save
                  }}
                  disabled={isSaving || isPublishing}
                />
              )}

              {/* Hidden buttons that can be triggered programmatically */}
              <div style={{ display: 'none' }}>
                <InternalLinkerButton
                  ref={internalLinkerRef}
                  html={content}
                  userName={currentUsername}
                  onApply={handleApplyInternalLinks} // This handler also sets isAutoLinking(false)
                />
                <AutoScanButton
                  ref={autoScanButtonRef}
                  html={content}
                  userName={currentUsername}
                  onApply={handleApplyAutoScan} // This handler also sets isAutoScanning(false)
                  disabled={isSaving || isPublishing}
                />
                <LinksAndReferencesButton
                  ref={referencesButtonRef}
                  html={content}
                  userName={currentUsername}
                  onApply={handleApplyLinksAndReferences}
                  disabled={isSaving || isPublishing}
                />
              </div>

              <SEOSettingsModal
                isOpen={isSEOSettingsOpen}
                onClose={() => setIsSEOSettingsOpen(false)}
                postData={currentPost}
                onSave={handleSEOSave} />


              <AIRewriterModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                selectedText={textForAction}
                onRewrite={handleContentUpdate} />

              <HTMLCleanupModal
                isOpen={showHTMLCleanup}
                onClose={() => setShowHTMLCleanup(false)}
                currentContent={content}
                onContentUpdate={handleContentUpdate} />

              <LinkSelector
                isOpen={showLinkSelector}
                onClose={() => setShowLinkSelector(false)}
                onInsert={handleLinkInsert} />


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
                onInsert={insertContentAtPoint} />

              <ProductFromUrlModal
                isOpen={showProductFromUrl}
                onClose={() => setShowProductFromUrl(false)}
                onInsert={insertContentAtPoint} />

              <AIContentDetectionModal
                isOpen={showAIDetection}
                onClose={() => setShowAIDetection(false)}
                currentContent={textForAction || content} />

              <HumanizeTextModal
                isOpen={showHumanizeModal}
                onClose={() => setShowHumanizeModal(false)}
                selectedText={textForAction}
                onRewrite={handleContentUpdate} />

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
                    setMediaLibraryInitialTab(undefined);
                  }}
                  onInsert={handleMediaInsert}
                  initialTab={mediaLibraryInitialTab}
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
                onClose={handleCMSModalClose}
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
                  handleContentChange(cleaned); // Use hook's content handler
                  sendToPreview({ type: "set-html", html: cleaned });
                  setShowLocalize(false);
                  saveContent(); // Trigger an immediate save
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
                onApply={(affiliatedHtml) => {
                  const cleaned = sanitizeLocalizedHtml ? sanitizeLocalizedHtml(affiliatedHtml) : String(affiliatedHtml || "");
                  skipNextPreviewPushRef.current = true;
                  handleContentChange(cleaned); // Use hook's content handler
                  sendToPreview({ type: "set-html", html: cleaned });
                  saveContent(); // Trigger an immediate save
                }}
                onInsert={insertContentAtPoint} />


              <RunWorkflowModal
                isOpen={showWorkflowRunner}
                onClose={() => setShowWorkflowRunner(false)}
                currentHtml={content}
                userName={currentUsername} // Added for AutoLink logic
                onApply={(newHtml) => {
                  const cleaned = typeof sanitizeLocalizedHtml === "function" ? sanitizeLocalizedHtml(newHtml) : String(newHtml || "");
                  skipNextPreviewPushRef.current = true;
                  handleContentChange(cleaned); // Use hook's content handler
                  sendToPreview({ type: "set-html", html: cleaned });
                  saveContent(); // Trigger an immediate save
                }} />
              
              {/* NEW: Flash Workflow Modal */}
              <RunWorkflowModal
                isOpen={showFlashModal}
                onClose={() => setShowFlashModal(false)}
                currentHtml={content}
                userName={currentUsername} // Replicate working AutoLink logic for the internal_linker agent step
                onApply={handleApplyFlashResult}
                isFlashWorkflow={true} // Optional prop to distinguish this invocation
              />

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

              <InfographicsModal
                isOpen={showInfographics}
                onClose={() => setShowInfographics(false)}
                selectedText={textForAction}
                articleTitle={title}
                onGenerate={handleGenerateInfographic}
              />

              <ImagineerModal
                isOpen={showImagineer}
                onClose={() => setShowImagineer(false)}
                initialPrompt={textForAction}
                onGenerate={handleImagineerGenerate}
              />

              <VoiceDictationModal
                isOpen={showVoiceModal}
                onClose={() => setShowVoiceModal(false)}
                onInsert={handleVoiceInsert}
              />
            </div>
          </div>

          {/* NEW: Magic Orb Loader for AutoLink/AutoScan */}
          {(isAutoLinking || isAutoScanning) && <MagicOrbLoader />}
        </div>
      </AuthGate>
    </EditorErrorBoundary>
  );
}
