
import React, { useRef, useEffect, useState } from 'react';
import useAskAiFeatures from '@/components/hooks/useAskAiFeatures';
import { User } from '@/api/entities';
import VideoModal from '@/components/common/VideoModal';
import { Play, Coins } from 'lucide-react';
import useFeatureFlag from '@/components/hooks/useFeatureFlag';
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';

// Magical Materia Orb Component
const MateriaOrb = ({ type, size = 16 }) => {
  const getOrbStyle = (actionType) => {
    // Reduce size by 11%
    const baseSize = size * 0.89;
    const glowSize = baseSize * 1.8;

    // ENHANCED NEON: Brighter, more vibrant neon color schemes
    const colorSchemes = {
      // Core AI Actions - Bright Electric Neon Purple/Magenta
      core: {
        primary: '#ff00ff',
        secondary: '#bf00ff',
        glow: '#ff44ff',
        inner: '#ff88ff'
      },
      // Media & Libraries - Bright Neon Cyan Blue
      media: {
        primary: '#00ffff',
        secondary: '#0099ff',
        glow: '#44ffff',
        inner: '#88ffff'
      },
      // Links & Products - Bright Neon Green/Lime
      links: {
        primary: '#00ff00',
        secondary: '#44ff44',
        glow: '#88ff88',
        inner: '#ccffcc'
      },
      // Utilities - Bright Neon Orange/Yellow
      utilities: {
        primary: '#ffaa00',
        secondary: '#ff8800',
        glow: '#ffbb44',
        inner: '#ffdd88'
      },
      // Advanced/Dangerous - Bright Neon Pink/Red
      advanced: {
        primary: '#ff0088',
        secondary: '#ff0044',
        glow: '#ff44aa',
        inner: '#ff88cc'
      },
      // Flash - Unique pulsating glow, perhaps a mix of core and advanced
      flash: {
        primary: '#FFD700', // Gold-ish yellow
        secondary: '#FFA500', // Orange
        glow: '#FFEA00', // Brighter yellow glow
        inner: '#FFEF99'
      }
    };

    // Map action types to color schemes
    const typeMapping = {
      'ai-rewrite': 'core',
      'humanize': 'core',
      'tldr': 'core',
      'fact': 'core',
      'ai-faq': 'core',
      'voice': 'core',
      'generate-image': 'media',
      'imagineer': 'media',
      'generate-video': 'media',
      'infographics': 'media',
      'audio': 'media',
      'media-library': 'media',
      'youtube': 'media',
      'tiktok': 'media',
      'manual-link': 'links',
      'promoted-product': 'links',
      'testimonials': 'links',
      'cta': 'links',
      'localize': 'utilities',
      'clean-html': 'utilities',
      'brand-it': 'utilities',
      'cite-sources': 'advanced',
      'ai-detection': 'advanced',
      'ai-agent': 'advanced',
      'affilify': 'utilities',
      'flash': 'flash',
      'autoscan': 'utilities'
    };

    const scheme = colorSchemes[typeMapping[actionType] || 'core'];

    return {
      width: `${baseSize}px`,
      height: `${baseSize}px`,
      borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${scheme.inner} 0%, ${scheme.primary} 35%, ${scheme.secondary} 75%, #000000 100%)`,
      boxShadow: `
        0 0 ${glowSize * 0.3}px ${scheme.glow}cc,
        0 0 ${glowSize * 0.5}px ${scheme.glow}88,
        0 0 ${glowSize * 0.8}px ${scheme.glow}44,
        inset 0 0 ${baseSize * 0.4}px ${scheme.inner}aa,
        inset ${baseSize * 0.12}px ${baseSize * 0.12}px ${baseSize * 0.25}px rgba(255,255,255,0.7)
      `,
      position: 'relative',
      animation: 'materiaPulse 3s ease-in-out infinite, materiaFloat 4s ease-in-out infinite alternate'
    };
  };

  return (
    <div
      style={getOrbStyle(type)}
      className="materia-orb"
    >
      {/* Inner magical sparkle effect - enhanced for neon */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'materiaSparkle 2s ease-in-out infinite alternate'
        }}
      />
    </div>
  );
};

const ActionItem = ({ icon: Icon, label, onClick, isComingSoon, showVideo, onPlayVideo, actionType, tokenCost }) => {
  const { enabled: showTokenCosts } = useFeatureFlag("show_token_costs_in_menu", { defaultEnabled: true });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isComingSoon}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group hover:bg-slate-700/50"
    >
      <MateriaOrb type={actionType} size={16} />
      <span className="flex-1">{label}</span>
      {showTokenCosts && tokenCost > 0 && (
        <div className="flex items-center gap-1 text-xs text-white bg-white/10 px-1.5 py-px rounded-full border border-white/30">
          <Coins className="w-2.5 h-2.5" />
          <span>{tokenCost}</span>
        </div>
      )}
      {isComingSoon && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-full border border-slate-500 border-t-transparent animate-spin" />
          Coming Soon
        </div>
      )}
      {showVideo && (
        <button
          onClick={onPlayVideo}
          className="p-1 -m-1 rounded-full text-yellow-400 hover:text-yellow-300 hover:bg-slate-600 transition-colors"
          title="Watch Tutorial"
        >
          <div className="w-4 h-4 relative">
            <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-ping" />
            <div className="relative w-full h-full bg-yellow-400 rounded-full flex items-center justify-center">
              <Play className="w-2 h-2 text-slate-800 fill-current ml-0.5" />
            </div>
          </div>
        </button>
      )}
    </button>
  );
};

export default function AskAIQuickMenu({ x, y, onPick, onClose }) {
  const { features } = useAskAiFeatures();
  const menuRef = useRef(null);
  const [positionStyle, setPositionStyle] = useState({ top: y + 10, left: x, opacity: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // State to store current user
  const [modalState, setModalState] = useState({ isOpen: false, url: null, title: null });
  const { consumeTokensForFeature } = useTokenConsumption();

  useEffect(() => {
      const checkUserAndAdmin = async () => {
          try {
              const user = await User.me();
              setCurrentUser(user); // Store current user
              const adminStatus = user?.role === 'admin' || !!user?.is_superadmin;
              setIsAdmin(adminStatus);
          } catch (error) {
              console.error("Failed to fetch user:", error);
              setIsAdmin(false);
              setCurrentUser(null);
          }
      };
      checkUserAndAdmin();
  }, []);

  // NEW: feature flag check for flash
  const { enabled: flashEnabled } = useFeatureFlag("flash", {
    currentUser: currentUser,
    defaultEnabled: false
  });

  // Hide "coming soon" items entirely
  const HIDE_COMING_SOON = true;

  useEffect(() => {
    if (!menuRef.current || !x || !y) return;

    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const clickOffsetY = 10;

    // Account for headers
    const mainLayoutHeader = document.querySelector('body > div > header');
    const editorHeader = document.querySelector('.topbar');

    let totalHeaderHeight = 0;
    if (mainLayoutHeader) {
      totalHeaderHeight += mainLayoutHeader.offsetHeight;
    }
    if (editorHeader) {
        totalHeaderHeight = editorHeader.offsetHeight;
    }

    const safeTopMargin = totalHeaderHeight > 0 ? totalHeaderHeight + 10 : 20;

    let newLeft = x;
    let newTop = y + clickOffsetY;

    if (newLeft + menuWidth > viewportWidth - 20) {
      newLeft = viewportWidth - menuWidth - 20;
    }
    if (newLeft < 20) {
      newLeft = 20;
    }

    if (newTop + menuHeight > viewportHeight - 20) {
      newTop = y - menuHeight - clickOffsetY;
    }

    if (newTop < safeTopMargin) {
      newTop = safeTopMargin;
    }

    setPositionStyle({ top: newTop, left: newLeft, opacity: 1 });
  }, [x, y, features]);

  if (!features) {
    return null;
  }

  // NEW: normalize imagineer feature (supports 'ai_imagineer' or 'imagineer')
  const imagineerFeature = features.ai_imagineer || features.imagineer;
  
  // NEW: normalize voice-ai feature (supports 'voice-ai' or 'voice_ai')
  const voiceFeature = features['voice-ai'] || features.voice_ai;

  // NEW: explicit feature flag mapping for these tools
  const autoLinkFeature = features['auto-link'];
  const referencesFeature = features.ai_rnl;
  const autoScanFeature = features.ai_autoscan;
  const seoFeature = features.ai_seo;

  const handlePick = (actionId) => {
    // Open immediately, token checking will happen inside each feature when user clicks execute
    if (typeof onPick === 'function') onPick(actionId);
    if (typeof onClose === 'function') onClose();
  };

  const handlePlayVideo = (e, youtubeUrl, loomUrl, title) => {
      e.stopPropagation();
      e.preventDefault();

      // Prefer Loom over YouTube if both are available
      const videoUrl = loomUrl || youtubeUrl;
      if (videoUrl) {
        setModalState({ isOpen: true, url: videoUrl, title });
      }
  };

  const groups = [
    {
      title: 'CORE AI ACTIONS',
      actions: [
        // REMOVED: 'Flash' from the Ask AI menu as requested, without affecting the Flash pill elsewhere
        // flashEnabled && {
        //   id: 'flash',
        //   label: 'Flash',
        //   actionType: 'flash',
        //   isComingSoon: false,
        //   tokenCost: 0
        // },
        features.ai_rewrite && {
          id: 'ai-rewrite',
          label: 'Rewrite',
          actionType: 'ai-rewrite',
          isComingSoon: features.ai_rewrite.isComingSoon,
          youtube_tutorial_url: features.ai_rewrite.youtube_tutorial_url,
          loom_tutorial_url: features.ai_rewrite.loom_tutorial_url,
          tokenCost: features.ai_rewrite.token_cost
        },
        features.ai_humanize && {
          id: 'humanize',
          label: 'Humanize',
          actionType: 'humanize',
          isComingSoon: features.ai_humanize.isComingSoon,
          youtube_tutorial_url: features.ai_humanize.youtube_tutorial_url,
          loom_tutorial_url: features.ai_humanize.loom_tutorial_url,
          tokenCost: features.ai_humanize.token_cost
        },
        // FIXED: Voice Dictation now pulls from voice-ai feature flag
        voiceFeature && {
          id: 'voice',
          label: 'Voice',
          actionType: 'voice',
          isComingSoon: voiceFeature.isComingSoon,
          youtube_tutorial_url: voiceFeature.youtube_tutorial_url,
          loom_tutorial_url: voiceFeature.loom_tutorial_url,
          tokenCost: voiceFeature.token_cost
        },
        features.ai_key_takeaway && {
          id: 'tldr',
          label: 'Key Takeaway',
          actionType: 'tldr',
          isComingSoon: features.ai_key_takeaway.isComingSoon,
          youtube_tutorial_url: features.ai_key_takeaway.youtube_tutorial_url,
          loom_tutorial_url: features.ai_key_takeaway.loom_tutorial_url,
          tokenCost: features.ai_key_takeaway.token_cost
        },
        features.ai_fact_box && {
          id: 'fact',
          label: 'Fact Box',
          actionType: 'fact',
          isComingSoon: features.ai_fact_box.isComingSoon,
          youtube_tutorial_url: features.ai_fact_box.youtube_tutorial_url,
          loom_tutorial_url: features.ai_fact_box.loom_tutorial_url,
          tokenCost: features.ai_fact_box.token_cost
        },
        features.ai_cite_sources && {
          id: 'cite-sources',
          label: 'Cite Sources',
          actionType: 'cite-sources',
          isComingSoon: features.ai_cite_sources.isComingSoon,
          youtube_tutorial_url: features.ai_cite_sources.youtube_tutorial_url,
          loom_tutorial_url: features.ai_cite_sources.loom_tutorial_url,
          tokenCost: features.ai_cite_sources.token_cost
        },
        features.ai_faq && {
          id: 'faq',
          label: 'FAQs', // Renamed from 'Generate FAQs' to 'FAQs'
          actionType: 'ai-faq',
          isComingSoon: features.ai_faq.isComingSoon,
          youtube_tutorial_url: features.ai_faq.youtube_tutorial_url,
          loom_tutorial_url: features.ai_faq.loom_tutorial_url,
          tokenCost: features.ai_faq.token_cost
        },
      ].filter(a => a && (!HIDE_COMING_SOON || !a.isComingSoon)),
    },
    {
      title: 'MEDIA & LIBRARIES',
      actions: [
        features.ai_generate_image && {
          id: 'generate-image',
          label: 'Generate Image',
          actionType: 'generate-image',
          isComingSoon: features.ai_generate_image.isComingSoon,
          youtube_tutorial_url: features.ai_generate_image.youtube_tutorial_url,
          loom_tutorial_url: features.ai_generate_image.loom_tutorial_url,
          tokenCost: features.ai_generate_image.token_cost
        },
        // UPDATED: use normalized feature for Imagineer so it appears with a flag named "imagineer"
        imagineerFeature && {
          id: 'imagineer',
          label: 'Imagineer',
          actionType: 'imagineer',
          isComingSoon: imagineerFeature.isComingSoon,
          youtube_tutorial_url: imagineerFeature.youtube_tutorial_url,
          loom_tutorial_url: imagineerFeature.loom_tutorial_url,
          tokenCost: imagineerFeature.token_cost
        },
        features.ai_generate_video && {
          id: 'generate-video',
          label: 'Generate Video',
          actionType: 'generate-video',
          isComingSoon: features.ai_generate_video.isComingSoon,
          youtube_tutorial_url: features.ai_generate_video.youtube_tutorial_url,
          loom_tutorial_url: features.ai_generate_video.loom_tutorial_url,
          tokenCost: features.ai_generate_video.token_cost
        },
        features.ai_infographics && { // Infographics feature added
          id: 'infographics',
          label: 'Infographics',
          actionType: 'infographics',
          isComingSoon: features.ai_infographics.isComingSoon,
          youtube_tutorial_url: features.ai_infographics.youtube_tutorial_url,
          loom_tutorial_url: features.ai_infographics.loom_tutorial_url,
          tokenCost: features.ai_infographics.token_cost
        },
        features.ai_audio && {
          id: 'audio',
          label: 'Audio',
          actionType: 'audio',
          isComingSoon: features.ai_audio.isComingSoon,
          youtube_tutorial_url: features.ai_audio.youtube_tutorial_url,
          loom_tutorial_url: features.ai_audio.loom_tutorial_url,
          tokenCost: features.ai_audio.token_cost
        },
        // Combined Image and Video Libraries into a single Media Library entry
        features.ai_image_library && { // Using ai_image_library as the primary feature flag for the combined entry
          id: 'media-library',
          label: 'Media', // Renamed from 'Media Library' to 'Media'
          actionType: 'media-library',
          isComingSoon: features.ai_image_library.isComingSoon, // Using image library's coming soon status
          youtube_tutorial_url: features.ai_image_library.youtube_tutorial_url, // Using image library's tutorial URL
          loom_tutorial_url: features.ai_image_library.loom_tutorial_url, // Using image library's tutorial URL
          tokenCost: features.ai_image_library.token_cost
        },
        // REMOVED: YouTube and TikTok search entries
      ].filter(a => a && (!HIDE_COMING_SOON || !a.isComingSoon)),
    },
    {
      title: 'LINKS & PRODUCTS',
      actions: [
        features.ai_manual_link && {
          id: 'manual-link',
          label: 'Links',
          actionType: 'manual-link',
          isComingSoon: features.ai_manual_link.isComingSoon,
          youtube_tutorial_url: features.ai_manual_link.youtube_tutorial_url,
          loom_tutorial_url: features.ai_manual_link.loom_tutorial_url,
          tokenCost: features.ai_manual_link.token_cost
        },
        features.ai_promoted_product && {
          id: 'promoted-product',
          label: 'Products', // Renamed from 'Promoted Product' to 'Products'
          actionType: 'promoted-product',
          isComingSoon: features.ai_promoted_product.isComingSoon,
          youtube_tutorial_url: features.ai_promoted_product.youtube_tutorial_url,
          loom_tutorial_url: features.ai_promoted_product.loom_tutorial_url,
          tokenCost: features.ai_promoted_product.token_cost
        },
        features.ai_testimonials && {
          id: 'testimonials',
          label: 'Testimonials',
          actionType: 'testimonials',
          isComingSoon: features.ai_testimonials.isComingSoon,
          youtube_tutorial_url: features.ai_testimonials.youtube_tutorial_url,
          loom_tutorial_url: features.ai_testimonials.loom_tutorial_url,
          tokenCost: features.ai_testimonials.token_cost
        },
        features.ai_cta && {
          id: 'cta',
          label: 'CTA',
          actionType: 'cta',
          isComingSoon: features.ai_cta.isComingSoon,
          youtube_tutorial_url: features.ai_cta.youtube_tutorial_url,
          loom_tutorial_url: features.ai_cta.loom_tutorial_url,
          tokenCost: features.ai_cta.token_cost
        },
        // ADD AutoLink here, now bound to feature flag
        autoLinkFeature && {
          id: 'autolink',
          label: 'AutoLink',
          actionType: 'manual-link', // Using 'manual-link' actionType for orb style
          isComingSoon: autoLinkFeature.isComingSoon,
          youtube_tutorial_url: autoLinkFeature.youtube_tutorial_url,
          loom_tutorial_url: autoLinkFeature.loom_tutorial_url,
          tokenCost: autoLinkFeature.token_cost
        },
        // ADD References here, now bound to feature flag
        referencesFeature && {
          id: 'references',
          label: 'References',
          actionType: 'manual-link', // Using 'manual-link' actionType for orb style
          isComingSoon: referencesFeature.isComingSoon,
          youtube_tutorial_url: referencesFeature.youtube_tutorial_url,
          loom_tutorial_url: referencesFeature.loom_tutorial_url,
          tokenCost: referencesFeature.token_cost
        },
      ].filter(a => a && (!HIDE_COMING_SOON || !a.isComingSoon)),
    },
    {
      title: 'UTILITIES',
      actions: [
        features.ai_localize && {
          id: 'localize',
          label: 'Localize',
          actionType: 'localize',
          isComingSoon: features.ai_localize.isComingSoon,
          youtube_tutorial_url: features.ai_localize.youtube_tutorial_url,
          loom_tutorial_url: features.ai_localize.loom_tutorial_url,
          tokenCost: features.ai_localize.token_cost
        },
        features.ai_clean_html && {
          id: 'clean-html',
          label: 'Clean up HTML',
          actionType: 'clean-html',
          isComingSoon: features.ai_clean_html.isComingSoon,
          youtube_tutorial_url: features.ai_clean_html.youtube_tutorial_url,
          loom_tutorial_url: features.ai_clean_html.loom_tutorial_url,
          tokenCost: features.ai_clean_html.token_cost
        },
        features.ai_detection && {
          id: 'ai-detection',
          label: 'AI Detection',
          actionType: 'ai-detection',
          isComingSoon: features.ai_detection.isComingSoon,
          youtube_tutorial_url: features.ai_detection.youtube_tutorial_url,
          loom_tutorial_url: features.ai_detection.loom_tutorial_url,
          tokenCost: features.ai_detection.token_cost
        },
        features.ai_agent && {
          id: 'ai-agent',
          label: 'AI Agent Workflow',
          actionType: 'ai-agent',
          isComingSoon: features.ai_agent.isComingSoon,
          youtube_tutorial_url: features.ai_agent.youtube_tutorial_url,
          loom_tutorial_url: features.ai_agent.loom_tutorial_url,
          tokenCost: features.ai_agent.token_cost
        },
        features.ai_brand_it && {
          id: 'brand-it',
          label: 'Brand It',
          actionType: 'brand-it',
          isComingSoon: features.ai_brand_it.isComingSoon,
          youtube_tutorial_url: features.ai_brand_it.youtube_tutorial_url,
          loom_tutorial_url: features.ai_brand_it.loom_tutorial_url,
          tokenCost: features.ai_brand_it.token_cost
        },
        features.ai_affilify && {
          id: 'affilify',
          label: 'Affilify',
          actionType: 'affilify',
          isComingSoon: features.ai_affilify.isComingSoon,
          youtube_tutorial_url: features.ai_affilify.youtube_tutorial_url,
          loom_tutorial_url: features.ai_affilify.loom_tutorial_url,
          tokenCost: features.ai_affilify.token_cost
        },
        // ADD AutoScan here, now bound to feature flag
        autoScanFeature && {
          id: 'autoscan',
          label: 'AutoScan',
          actionType: 'autoscan', // Using 'autoscan' actionType
          isComingSoon: autoScanFeature.isComingSoon,
          youtube_tutorial_url: autoScanFeature.youtube_tutorial_url,
          loom_tutorial_url: autoScanFeature.loom_tutorial_url,
          tokenCost: autoScanFeature.token_cost
        },
        // ADD SEO here, now bound to feature flag
        seoFeature && {
          id: 'seo',
          label: 'SEO',
          actionType: 'utilities',
          isComingSoon: seoFeature.isComingSoon,
          youtube_tutorial_url: seoFeature.youtube_tutorial_url,
          loom_tutorial_url: seoFeature.loom_tutorial_url,
          tokenCost: seoFeature.token_cost
        },
      ].filter(a => a && (!HIDE_COMING_SOON || !a.isComingSoon)),
    },
  ].filter((g) => g.actions.length > 0);

  if (!x || !y) return null;

  return (
    <>
      {/* Enhanced Magical CSS Animations */}
      <style jsx>{`
        @keyframes materiaPulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1) saturate(1.2);
          }
          50% {
            transform: scale(1.08);
            filter: brightness(1.4) saturate(1.4);
          }
        }

        @keyframes materiaFloat {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          100% {
            transform: translateY(-1.5px) rotate(360deg);
          }
        }

        @keyframes materiaSparkle {
          0% {
            opacity: 0.4;
            transform: scale(0.7);
          }
          100% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        .materia-orb:hover {
          transform: scale(1.2) !important;
          filter: brightness(1.6) saturate(1.5) !important;
        }

        /* Hide scrollbar completely */
        .scrollbar-hidden {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999]"
        style={{ zIndex: 9999 }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        ref={menuRef}
        className="fixed z-[10000] w-72 rounded-xl bg-slate-800/95 p-2 text-white shadow-2xl backdrop-blur-lg border border-purple-500/20 transition-opacity duration-150"
        style={{ ...positionStyle, zIndex: 10000 }}
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1 scrollbar-hidden">
          {groups.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex > 0 ? 'mt-2' : ''}>
              <h3 className="px-3 py-1.5 text-xs font-semibold uppercase text-slate-300 tracking-wider">
                {group.title}
              </h3>
              <div className="flex flex-col">
                {group.actions.map((action) => (
                  <ActionItem
                    key={action.id}
                    icon={null}
                    label={action.label}
                    onClick={() => handlePick(action.id)}
                    isComingSoon={action.isComingSoon}
                    showVideo={!!(action.youtube_tutorial_url || action.loom_tutorial_url)}
                    onPlayVideo={(e) => handlePlayVideo(e, action.youtube_tutorial_url, action.loom_tutorial_url, `How To Guide: ${action.label}`)}
                    actionType={action.actionType}
                    tokenCost={action.tokenCost}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <VideoModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, url: null, title: null })}
        videoUrl={modalState.url}
        title={modalState.title}
      />
    </>
  );
}
