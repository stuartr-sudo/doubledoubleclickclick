
import { useState, useCallback } from 'react';

/**
 * Custom hook for managing all editor modal states and operations
 * Extracted from Editor.jsx to improve maintainability
 * 
 * @returns {Object} Modal state and operations
 */
export function useEditorModals() {
  // ==================== MODAL STATE ====================
  const [showAIModal, setShowAIModal] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const [showHTMLCleanup, setShowHTMLCleanup] = useState(false);
  const [showAIDetection, setShowAIDetection] = useState(false);
  const [showHumanizeModal, setShowHumanizeModal] = useState(false);
  const [showCalloutGenerator, setShowCalloutGenerator] = useState(false);
  const [showFactGenerator, setShowFactGenerator] = useState(false);
  const [showTldrGenerator, setShowTldrGenerator] = useState(false);
  const [showSitemapLinker, setShowSitemapLinker] = useState(false);
  const [isSEOSettingsOpen, setIsSEOSettingsOpen] = useState(false);
  const [showCtaSelector, setShowCtaSelector] = useState(false);
  const [showEmailCaptureSelector, setShowEmailCaptureSelector] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
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
  const [showInfographics, setShowInfographics] = useState(false);
  const [showImagineer, setShowImagineer] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isRewritingTitle, setIsRewritingTitle] = useState(false);
  const [showProductFromUrl, setShowProductFromUrl] = useState(false);

  // ==================== MODAL-SPECIFIC DATA ====================
  const [calloutType, setCalloutType] = useState('callout');
  const [mediaLibraryInitialTab, setMediaLibraryInitialTab] = useState('images');
  const [textForAction, setTextForAction] = useState('');
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [imageLibraryGenerateOnly, setImageLibraryGenerateOnly] = useState(false);
  const [imageLibraryDefaultProvider, setImageLibraryDefaultProvider] = useState(undefined);

  // ==================== MODAL OPERATIONS ====================
  
  const closeAllModals = useCallback(() => {
    setShowAIModal(false);
    setShowImageLibrary(false);
    setShowProductSelector(false);
    setShowVideoGenerator(false);
    setShowLinkSelector(false);
    setShowHTMLCleanup(false);
    setShowAIDetection(false);
    setShowHumanizeModal(false);
    setShowCalloutGenerator(false);
    setShowFactGenerator(false);
    setShowTldrGenerator(false);
    setShowSitemapLinker(false);
    setIsSEOSettingsOpen(false);
    setShowCtaSelector(false);
    setShowEmailCaptureSelector(false);
    setShowVideoLibrary(false);
    setShowMediaLibrary(false);
    setShowScheduler(false);
    setShowTestimonialLibrary(false);
    setShowVariantLibrary(false);
    setShowCMSModal(false);
    setShowAudioModal(false);
    setShowAmazonImport(false);
    setShowLocalize(false);
    setShowBrandIt(false);
    setShowAffilify(false);
    setShowFaqGenerator(false);
    setShowInfographics(false);
    setShowImagineer(false);
    setShowVoiceModal(false);
    setIsActionsModalOpen(false);
    setIsRewritingTitle(false);
    setShowProductFromUrl(false);
    setTextForAction('');
    setIsTextSelected(false);
  }, []);

  const openModal = useCallback((modalName, options = {}) => {
    // Close all modals first to prevent overlaps
    closeAllModals();
    
    // Open the requested modal
    switch (modalName) {
      case 'ai':
        setShowAIModal(true);
        break;
      case 'imageLibrary':
        setShowImageLibrary(true);
        break;
      case 'productSelector':
        setShowProductSelector(true);
        break;
      case 'videoGenerator':
        setShowVideoGenerator(true);
        break;
      case 'linkSelector':
        setShowLinkSelector(true);
        break;
      case 'htmlCleanup':
        setShowHTMLCleanup(true);
        break;
      case 'aiDetection':
        setShowAIDetection(true);
        break;
      case 'humanize':
        setShowHumanizeModal(true);
        break;
      case 'callout':
        setCalloutType(options.type || 'callout');
        setShowCalloutGenerator(true);
        break;
      case 'fact':
        setCalloutType('fact');
        setShowFactGenerator(true);
        break;
      case 'tldr':
        setShowTldrGenerator(true);
        break;
      case 'sitemapLinker':
        setShowSitemapLinker(true);
        break;
      case 'seoSettings':
        setIsSEOSettingsOpen(true);
        break;
      case 'ctaSelector':
        setShowCtaSelector(true);
        break;
      case 'emailCaptureSelector':
        setShowEmailCaptureSelector(true);
        break;
      case 'videoLibrary':
        setShowVideoLibrary(true);
        break;
      case 'mediaLibrary':
        setMediaLibraryInitialTab(options.initialTab || 'images');
        setShowMediaLibrary(true);
        break;
      case 'scheduler':
        setShowScheduler(true);
        break;
      case 'testimonialLibrary':
        setShowTestimonialLibrary(true);
        break;
      case 'variantLibrary':
        setShowVariantLibrary(true);
        break;
      case 'cmsModal':
        setShowCMSModal(true);
        break;
      case 'audioModal':
        setShowAudioModal(true);
        break;
      case 'amazonImport':
        setShowAmazonImport(true);
        break;
      case 'localize':
        setShowLocalize(true);
        break;
      case 'brandIt':
        setShowBrandIt(true);
        break;
      case 'affilify':
        setShowAffilify(true);
        break;
      case 'faqGenerator':
        setShowFaqGenerator(true);
        break;
      case 'infographics':
        setShowInfographics(true);
        break;
      case 'imagineer':
        setShowImagineer(true);
        break;
      case 'voiceModal':
        setShowVoiceModal(true);
        break;
      case 'actionsModal':
        setTextForAction(options.text || '');
        setIsTextSelected(!!options.text);
        setIsActionsModalOpen(true);
        break;
      case 'productFromUrl':
        setShowProductFromUrl(true);
        break;
      default:
        console.warn(`Unknown modal: ${modalName}`);
    }
  }, [closeAllModals]);

  // ==================== RETURN ====================
  return {
    // Modal states
    showAIModal,
    showImageLibrary,
    showProductSelector,
    showVideoGenerator,
    showLinkSelector,
    showHTMLCleanup,
    showAIDetection,
    showHumanizeModal,
    showCalloutGenerator,
    showFactGenerator,
    showTldrGenerator,
    showSitemapLinker,
    isSEOSettingsOpen,
    showCtaSelector,
    showEmailCaptureSelector,
    showVideoLibrary,
    showMediaLibrary,
    showScheduler,
    showTestimonialLibrary,
    showVariantLibrary,
    showCMSModal,
    showAudioModal,
    showAmazonImport,
    showLocalize,
    showBrandIt,
    showAffilify,
    showFaqGenerator,
    showInfographics,
    showImagineer,
    showVoiceModal,
    isActionsModalOpen,
    isRewritingTitle,
    showProductFromUrl,
    
    // Modal-specific data
    calloutType,
    mediaLibraryInitialTab,
    textForAction,
    isTextSelected,
    imageLibraryGenerateOnly,
    imageLibraryDefaultProvider,
    
    // Modal setters (for direct control when needed)
    setShowAIModal,
    setShowImageLibrary,
    setShowProductSelector,
    setShowVideoGenerator,
    setShowLinkSelector,
    setShowHTMLCleanup,
    setShowAIDetection,
    setShowHumanizeModal,
    setShowCalloutGenerator,
    setShowFactGenerator,
    setShowTldrGenerator,
    setShowSitemapLinker,
    setIsSEOSettingsOpen,
    setShowCtaSelector,
    setShowEmailCaptureSelector,
    setShowVideoLibrary,
    setShowMediaLibrary,
    setShowScheduler,
    setShowTestimonialLibrary,
    setShowVariantLibrary,
    setShowCMSModal,
    setShowAudioModal,
    setShowAmazonImport,
    setShowLocalize,
    setShowBrandIt,
    setShowAffilify,
    setShowFaqGenerator,
    setShowInfographics,
    setShowImagineer,
    setShowVoiceModal,
    setIsActionsModalOpen,
    setIsRewritingTitle,
    setShowProductFromUrl,
    setCalloutType,
    setMediaLibraryInitialTab,
    setTextForAction,
    setIsTextSelected,
    setImageLibraryGenerateOnly,
    setImageLibraryDefaultProvider,
    
    // Modal operations
    openModal,
    closeAllModals,
  };
}
