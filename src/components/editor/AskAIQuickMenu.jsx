
import React, { useRef, useEffect, useState } from 'react';
import {
  Image, Video, Music, Library, Film, Youtube, Link as LinkIcon, Globe,
  CheckSquare, ShoppingCart, Share2, Quote, Combine, Shield, Bot, Wand2, Link, Languages, HelpCircle, Clock
} from 'lucide-react';
import useAskAiFeatures from '@/components/hooks/useAskAiFeatures';

const ActionItem = ({ icon: Icon, label, onClick, isComingSoon }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isComingSoon}
    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50"
  >
    <Icon className="h-4 w-4 text-slate-400" />
    <span className="flex-1">{label}</span>
    {isComingSoon && (
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Clock className="w-3 h-3" />
        Coming Soon
      </div>
    )}
  </button>
);

export default function AskAIQuickMenu({ x, y, onPick, onClose }) {
  const { features } = useAskAiFeatures();
  const menuRef = useRef(null);
  const [positionStyle, setPositionStyle] = useState({ top: y + 10, left: x, opacity: 0 });

  // Hide "coming soon" items entirely
  const HIDE_COMING_SOON = true; // NEW

  useEffect(() => {
    if (!menuRef.current || !x || !y) return;

    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const clickOffsetY = 10;

    // --- FIX: Account for the main layout header and editor header ---
    // The main layout header is typically a <header> element.
    const mainLayoutHeader = document.querySelector('body > div > header');
    // The editor has its own sticky top bar.
    const editorHeader = document.querySelector('.topbar');
    
    let totalHeaderHeight = 0;
    if (mainLayoutHeader) {
      totalHeaderHeight += mainLayoutHeader.offsetHeight;
    }
    if (editorHeader) {
        // In the editor, the menu is relative to the viewport, but the click is inside
        // the content area. We need to respect the editor's own header.
        totalHeaderHeight = editorHeader.offsetHeight;
    }
    
    const safeTopMargin = totalHeaderHeight > 0 ? totalHeaderHeight + 10 : 20;
    // --- END FIX ---

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
    
    // Ensure it doesn't go under the header
    if (newTop < safeTopMargin) {
      newTop = safeTopMargin;
    }

    setPositionStyle({ top: newTop, left: newLeft, opacity: 1 });
  }, [x, y, features]);

  if (!features) {
    return null;
  }

  const handlePick = (actionId) => {
    if (typeof onPick === 'function') onPick(actionId);
    if (typeof onClose === 'function') onClose();
  };

  const groups = [
    {
      title: 'CORE AI ACTIONS',
      actions: [
        features.ai_rewrite && { id: 'ai-rewrite', label: 'Rewrite', icon: Wand2, isComingSoon: features.ai_rewrite.isComingSoon },
        features.ai_humanize && { id: 'humanize', label: 'Humanize', icon: Wand2, isComingSoon: features.ai_humanize.isComingSoon },
        features.ai_key_takeaway && { id: 'tldr', label: 'Key Takeaway', icon: CheckSquare, isComingSoon: features.ai_key_takeaway.isComingSoon },
        features.ai_fact_box && { id: 'fact', label: 'Fact Box', icon: CheckSquare, isComingSoon: features.ai_fact_box.isComingSoon },
        features.ai_cite_sources && { id: 'cite-sources', label: 'Cite Sources', icon: Globe, isComingSoon: features.ai_cite_sources.isComingSoon },
        features.ai_faq && { id: 'faq', label: 'Generate FAQs', icon: HelpCircle, isComingSoon: features.ai_faq.isComingSoon },
      ].filter(a => a && (!HIDE_COMING_SOON || !a.isComingSoon)), // EDITED
    },
    {
      title: 'MEDIA & LIBRARIES',
      actions: [
        features.ai_generate_image && { id: 'generate-image', label: 'Generate Image', icon: Image, isComingSoon: features.ai_generate_image.isComingSoon },
        features.ai_generate_video && { id: 'generate-video', label: 'Generate Video', icon: Video, isComingSoon: features.ai_generate_video.isComingSoon },
        features.ai_audio && { id: 'audio', label: 'Audio', icon: Music, isComingSoon: features.ai_audio.isComingSoon },
        features.ai_image_library && { id: 'image-library', label: 'Image Library', icon: Library, isComingSoon: features.ai_image_library.isComingSoon }, // EDITED label
        features.ai_video_library && { id: 'video-library', label: 'Video Library', icon: Film, isComingSoon: features.ai_video_library.isComingSoon },
      ].filter(a => a && (!HIDE_COMING_SOON || !a.isComingSoon)), // EDITED
    },
    {
      title: 'LINKS & PRODUCTS',
      actions: [
        features.ai_youtube && { id: 'youtube', label: 'Search YouTube', icon: Youtube, isComingSoon: features.ai_youtube.isComingSoon },
        features.ai_tiktok && { id: 'tiktok', label: 'Search TikTok', icon: Music, isComingSoon: features.ai_tiktok.isComingSoon },
        features.ai_manual_link && { id: 'manual-link', label: 'Manual Link', icon: LinkIcon, isComingSoon: features.ai_manual_link.isComingSoon },
        features.ai_sitemap_link && { id: 'sitemap-link', label: 'Sitemap Links', icon: Globe, isComingSoon: features.ai_sitemap_link.isComingSoon },
        features.ai_promoted_product && { id: 'promoted-product', label: 'Promoted Product', icon: CheckSquare, isComingSoon: features.ai_promoted_product.isComingSoon },
        // Removed Amazon Import from Ask AI menu
      ].filter(a => a && (!HIDE_COMING_SOON || !a.isComingSoon)), // EDITED
    },
    {
      title: 'UTILITIES',
      actions: [
        features.ai_localize && { id: 'localize', label: 'Localize', icon: Languages, isComingSoon: features.ai_localize.isComingSoon },
        features.ai_cta && { id: 'cta', label: 'CTA', icon: Share2, isComingSoon: features.ai_cta.isComingSoon },
        features.ai_testimonials && { id: 'testimonials', label: 'Testimonials', icon: Quote, isComingSoon: features.ai_testimonials.isComingSoon },
        features.ai_clean_html && { id: 'clean-html', label: 'Clean up HTML', icon: Combine, isComingSoon: features.ai_clean_html.isComingSoon },
        features.ai_detection && { id: 'ai-detection', label: 'AI Detection', icon: Shield, isComingSoon: features.ai_detection.isComingSoon },
        features.ai_agent && { id: 'ai-agent', label: 'AI Agent Workflow', icon: Bot, isComingSoon: features.ai_agent.isComingSoon },
        features.ai_brand_it && { id: 'brand-it', label: 'Brand It', icon: Wand2, isComingSoon: features.ai_brand_it.isComingSoon },
        features.ai_affilify && { id: 'affilify', label: 'Affilify', icon: Link, isComingSoon: features.ai_affilify.isComingSoon },
      ].filter(a => a && (!HIDE_COMING_SOON || !a.isComingSoon)), // EDITED
    },
  ].filter((g) => g.actions.length > 0);

  if (!x || !y) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[998]"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        ref={menuRef}
        className="fixed z-[999] w-72 rounded-xl bg-slate-800/90 p-2 text-white shadow-2xl backdrop-blur-lg border border-white/10 transition-opacity duration-150"
        style={positionStyle}
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {groups.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex > 0 ? 'mt-2' : ''}>
              <h3 className="px-3 py-1.5 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                {group.title}
              </h3>
              <div className="flex flex-col">
                {group.actions.map((action) => (
                  <ActionItem
                    key={action.id}
                    icon={action.icon}
                    label={action.label}
                    onClick={() => handlePick(action.id)}
                    isComingSoon={false} // ensure no coming soon badge is rendered
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
