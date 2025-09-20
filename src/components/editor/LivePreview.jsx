
import React, { useEffect } from "react";
import { Edit3 } from "lucide-react";
import { captureEmail } from "@/api/functions";
import { getTikTokOembed } from "@/api/functions"; // NEW IMPORT

export default function LivePreview({ title, content, selectedFont = 'Inter', previewDevice = 'laptop' }) {

  useEffect(() => {
    const container = document.getElementById('live-preview-content');
    if (!container) return;

    // Email form logic
    const forms = container.querySelectorAll('.b44-email-capture-form');
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const wrapper = form.closest('.b44-email-capture');
        const successMessage = wrapper.querySelector('.b44-email-capture-success');
        const formName = wrapper.dataset.formName || 'Unknown Form';
        const emailInput = form.querySelector('input[name="email"]');
        const email = emailInput.value;

        try {
            const result = await captureEmail({ 
                email,
                form_name: formName,
                source_url: window.location.href
            });

            if (result && result.data && result.data.success) {
                form.style.display = 'none';
                successMessage.style.display = 'block';
            } else {
                const errorMessage = result?.data?.error || 'An unknown error occurred.';
                alert(`Error: ${errorMessage}`);
            }
        } catch (error) {
            alert(`An unexpected error occurred: ${error.message}`);
        }
    };

    forms.forEach(form => {
        form.addEventListener('submit', handleSubmit);
    });

    // Helper to guess mime type from URL
    const guessMime = (url) => {
      const u = (url || "").toLowerCase().split("?")[0];
      if (u.endsWith(".mp4") || u.endsWith(".m4v")) return "video/mp4";
      if (u.endsWith(".webm")) return "video/webm";
      if (u.endsWith(".mov") || u.endsWith(".qt")) return "video/quicktime";
      if (u.endsWith(".mkv")) return "video/x-matroska";
      return "video/mp4"; // Default fallback
    };

    // NEW: Repair stripped video src by using data-b44-video-src and ensure a <source> exists
    const repairVideoElements = () => {
      const vids = Array.from(container.querySelectorAll('video'));
      vids.forEach(v => {
        const dataSrc = v.getAttribute('data-b44-video-src');
        const hasSrc = v.getAttribute('src');
        
        let finalSrc = hasSrc;
        if (!hasSrc && dataSrc) {
          finalSrc = dataSrc;
          v.setAttribute('src', dataSrc);
        } else if (hasSrc && dataSrc && hasSrc !== dataSrc) {
          // If src exists but is different from dataSrc, prioritize src but keep dataSrc for reference
          // Or, decide on a priority (e.g., if src is empty string, use dataSrc)
        }

        if (!finalSrc) return; // No source to work with

        // Ensure there is a <source> tag with src/type
        let source = v.querySelector('source');
        if (!source) {
          source = document.createElement('source');
          v.insertBefore(source, v.firstChild); // Insert as first child
        }
        
        // Update source attributes if they are missing or incorrect
        if (!source.getAttribute('src') || source.getAttribute('src') !== finalSrc) {
          source.setAttribute('src', finalSrc);
        }
        if (!source.getAttribute('type') || source.getAttribute('type') !== guessMime(finalSrc)) {
          source.setAttribute('type', guessMime(finalSrc));
        }
      });
    };

    // NEW: Convert plain-text TikTok URLs into anchors so they can be upgraded
    const convertPlainTikTokTextToAnchors = () => {
      // Regex for TikTok video URLs: https://www.tiktok.com/@username/video/1234567890
      const urlRegex = /(https?:\/\/(?:www\.)?tiktok\.com\/@[^/\s]+\/video\/\d+)/g;

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          // Only process text nodes that are not inside already processed embeds or other non-text elements
          if (!node.nodeValue || node.parentNode.closest('a, .tiktok-embed, .youtube-video-container')) {
            return NodeFilter.FILTER_REJECT;
          }
          return urlRegex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      });

      const toProcess = [];
      let current;
      while ((current = walker.nextNode())) {
        toProcess.push(current);
      }

      toProcess.forEach(textNode => {
        const text = textNode.nodeValue;
        const parts = text.split(urlRegex);
        const frag = document.createDocumentFragment();

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part) continue;
          if (urlRegex.test(part)) { // Check if the part matches the URL regex directly
            const a = document.createElement("a");
            a.href = part;
            a.textContent = part;
            a.dataset.b44PlainUrl = "1"; // Custom attribute to mark it as originally plain text
            frag.appendChild(a);
          } else {
            frag.appendChild(document.createTextNode(part));
          }
        }

        // Replace the original text node with the new fragment
        if (frag.childNodes.length > 0) {
          textNode.parentNode.replaceChild(frag, textNode);
        }
      });
    };

    // Ensure any raw YouTube iframes are wrapped responsively and centered at 80% width
    const makeYouTubeResponsive = () => {
      if (!container) return;
      const iframes = Array.from(
        container.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]')
      );

      iframes.forEach((iframe) => {
        const alreadyWrapped = iframe.closest('.youtube-video-container');
        if (alreadyWrapped) {
          iframe.removeAttribute('width');
          iframe.removeAttribute('height');
          Object.assign(iframe.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '8px',
          });
          // Enforce centered 85% width on the wrapper (updated from 80%)
          Object.assign(alreadyWrapped.style, {
            position: 'relative',
            width: '100%',
            maxWidth: '85%', // Updated from 80%
            margin: '2rem auto', // Centered margin
            paddingBottom: '56.25%',
            height: '0',
            overflow: 'hidden',
            borderRadius: '12px',
          });
          return;
        }
        // Wrap in responsive, centered container
        const wrapper = document.createElement('div');
        wrapper.className = 'youtube-video-container';
        Object.assign(wrapper.style, {
          position: 'relative',
          width: '100%',
          maxWidth: '85%', // Updated from 80%
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: '0',
          overflow: 'hidden',
          margin: '2rem auto', // Centered margin
          borderRadius: '12px',
        });

        const parent = iframe.parentElement;
        iframe.removeAttribute('width');
        iframe.removeAttribute('height');
        Object.assign(iframe.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '8px',
        });

        parent.insertBefore(wrapper, iframe);
        wrapper.appendChild(iframe);
      });
    };

    // Upgrade TikTok links to real embeds, normalize their dimensions, and load TikTok's script
    const upgradeTikTokLinks = async () => {
      if (!container) return;

      // FIRST: convert any plain text URLs to anchors so they can be processed
      convertPlainTikTokTextToAnchors();

      const linkSelector = 'a[href*="tiktok.com/"]';
      const links = Array.from(container.querySelectorAll(linkSelector))
        .filter(a => /https?:\/\/(www\.)?tiktok\.com\/@[^/]+\/video\/\d+/.test(a.href))
        .filter(a => !a.dataset.b44Embedded); // Avoid reprocessing

      for (const a of links) {
        a.dataset.b44Embedded = "1"; // Mark as processed
        try {
          const { data } = await getTikTokOembed({ url: a.href });
          const temp = document.createElement('div');
          temp.innerHTML = data?.html || "";
          // Remove scripts from the oEmbed HTML to prevent them from running multiple times
          temp.querySelectorAll('script').forEach(s => s.remove());
          const blockquote = temp.querySelector('.tiktok-embed');
          
          if (blockquote) {
            // Apply desired styles for expanded view and no outer whitespace
            blockquote.removeAttribute('style'); // Remove TikTok's default inline styles
            Object.assign(blockquote.style, {
              width: '100%',
              maxWidth: '100%',
              minWidth: '0',
              margin: '0', // Important: remove outer margin
              padding: '0', // Important: remove outer padding
              background: 'transparent', // Ensure transparent background
              boxShadow: 'none' // Remove any shadows
            });
            // Also target the inner section if it exists, as it can add padding/margin
            const section = blockquote.querySelector('section');
            if (section) {
              Object.assign(section.style, {
                margin: '0',
                padding: '0',
                background: 'transparent',
                boxShadow: 'none'
              });
            }
            a.insertAdjacentElement('beforebegin', blockquote);
            a.remove(); // Remove the original link
          }
        } catch (_) {
          // If oEmbed fails, leave the link as-is (degrades gracefully)
          a.dataset.b44Embedded = "0"; // Reset if failed to embed
        }
      }

      // Also restyle any existing TikTok embeds (e.g., pasted earlier or already processed)
      const embeds = Array.from(container.querySelectorAll('.tiktok-embed'));
      embeds.forEach(bq => {
        bq.removeAttribute('style'); // Clear any existing inline styles
        Object.assign(bq.style, {
          width: '100%', maxWidth: '100%', minWidth: '0', margin: '0', padding: '0', background: 'transparent', boxShadow: 'none'
        });
        const section = bq.querySelector('section');
        if (section) { 
          Object.assign(section.style, {
            margin: '0', padding: '0', background: 'transparent', boxShadow: 'none'
          });
        }
      });

      // Load TikTok's embed script if there are any embeds present
      if (embeds.length > 0) {
        const existingScript = document.getElementById('tiktok-embed-script');
        if (existingScript) existingScript.remove(); // Remove and re-add to ensure script is fresh
        const script = document.createElement('script');
        script.id = 'tiktok-embed-script';
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    // Use timeouts to ensure DOM is ready and content is parsed before manipulation
    const t1 = setTimeout(makeYouTubeResponsive, 30);
    const t2 = setTimeout(upgradeTikTokLinks, 60);
    const t3 = setTimeout(repairVideoElements, 80); // NEW: repair videos after other upgrades

    return () => {
        clearTimeout(t1); // Clear YouTube timeout
        clearTimeout(t2); // Clear TikTok timeout
        clearTimeout(t3); // Clear video repair timeout
        // Correctly remove the event listener by referencing the same function
        forms.forEach(form => {
            form.removeEventListener('submit', handleSubmit);
        });
    };
  }, [content]); // Rerun when the raw content changes

  // Compute viewport width for device modes
  const deviceWidth = (() => {
    if (previewDevice === 'mobile') return 390; // iPhone-ish
    if (previewDevice === 'tablet') return 768; // iPad portrait
    if (previewDevice === 'laptop') return 1024; // Laptop content width
    return 1024;
  })();

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-slate-900/20 to-gray-900/30 backdrop-blur-sm">
      <style dangerouslySetInnerHTML={{
        __html: `
          .preview-viewport {
            width: ${deviceWidth}px !important;
            max-width: 100% !important;
            margin: 0 auto !important;
          }

          .preview-container *, .preview-container *:before, .preview-container *:after {
             box-sizing: border-box !important;
          }
          .preview-container {
            font-family: '${selectedFont}', sans-serif !important;
            color: rgba(255, 255, 255, 0.92) !important;
            line-height: 1.8 !important;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.2) 0%, rgba(30, 41, 59, 0.1) 100%) !important;
            border-radius: 16px !important;
            margin: 20px auto !important;
            padding: 40px 32px !important;
            min-height: calc(100vh - 240px) !important;
            overflow-wrap: break-word !important;
            max-width: 100% !important; /* allow outer viewport to control width */
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1) !important;
            overflow-x: hidden !important;
          }
          
          @media (max-width: 768px) {
            .preview-container {
              padding: 24px 16px !important;
              margin: 15px auto !important;
            }
          }
          
          /* Normalize typography spacing to mirror editor */
          .preview-container h1, .preview-container h2, .preview-container h3, .preview-container h4, .preview-container h5, .preview-container h6 {
            color: white !important; 
            margin: 3rem 0 1.5rem 0 !important; 
            font-weight: 600 !important; 
            line-height: 1.3 !important;
            overflow-wrap: break-word !important;
          }
          .preview-container h1 { font-size: 2.5rem !important; font-weight: 700 !important; margin-top: 0 !important; }
          .preview-container h2 { font-size: 2rem !important; }
          .preview-container h3 { font-size: 1.75rem !important; }
          .preview-container h4 { font-size: 1.5rem !important; }
          .preview-container h5 { font-size: 1.25rem !important; }
          .preview-container h6 { font-size: 1.125rem !important; }
          
          .preview-container p, .preview-container div:not([class*="b44-"]) { 
            color: rgba(255, 255, 255, 0.9) !important; 
            line-height: 1.8 !important; 
            margin: 2rem 0 !important; /* match editor */
            font-size: 1.1rem !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
          }
          .preview-container div[style] { display: block !important; }
          
          /* Constrain and center all images to 85% width */
          .preview-container img { 
            display: block !important;
            max-width: 85% !important;
            width: auto !important;
            height: auto !important; 
            border-radius: 8px !important; 
            margin: 2rem auto !important; 
          }
          
          /* Fix list display */
          .preview-container ul, .preview-container ol { 
            padding-left: 2em !important; 
            margin: 2rem 0 !important; 
            color: rgba(255, 255, 255, 0.9) !important;
          }
          .preview-container ul li { 
            list-style-type: disc !important;
            margin: 1rem 0 !important; 
            color: rgba(255, 255, 255, 0.9) !important;
            line-height: 1.6 !important;
          }
          .preview-container ol li { 
            list-style-type: decimal !important;
            margin: 1rem 0 !important; 
            color: rgba(255, 255, 255, 0.9) !important;
            line-height: 1.6 !important;
          }
          
          .preview-container a { 
            color: #93c5fd !important; 
            text-decoration: underline !important;
            word-break: break-all !important;
          }

          /* YouTube Container - 85% width, centered */
          .preview-container .youtube-video-container {
            position: relative;
            width: 100%;
            max-width: 85%;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
            margin: 2rem auto !important;
            border-radius: 12px;
          }
          .preview-container .youtube-video-container iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
            border: 0;
            border-radius: 8px; /* Apply to the iframe inside */
          }

          /* Fallback: make any YouTube iframe responsive even without wrapper (modern browsers) */
          .preview-container iframe[src*="youtube.com"],
          .preview-container iframe[src*="youtu.be"] {
            display: block;
            width: 85% !important;
            max-width: 100%; /* Important for intrinsic sizing */
            aspect-ratio: 16 / 9;
            height: auto !important;
            border: 0;
            border-radius: 8px;
            margin: 2rem auto !important; /* Ensure consistent margin & centering */
          }
          
          @media (max-width: 768px) {
            .preview-container .youtube-video-container { max-width: 100%; }
            .preview-container iframe[src*="youtube.com"], .preview-container iframe[src*="youtu.be"] { width: 100% !important; }
          }

          /* NEW: Make raw <video> elements responsive and centered */
          .preview-container video {
            display: block !important;
            width: 85% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 2rem auto !important;
            border-radius: 8px !important;
            background: #000 !important; /* Dark background for video */
          }
          @media (max-width: 768px) {
            .preview-container video { width: 100% !important; }
          }

          /* Fallback: make any video-file iframe responsive, mirroring YouTube style */
          .preview-container iframe[src$=".mp4"],
          .preview-container iframe[src*=".mp4?"],
          .preview-container iframe[src$=".webm"],
          .preview-container iframe[src*=".webm?"],
          .preview-container iframe[src$=".mov"],
          .preview-container iframe[src*=".mov?"],
          .preview-container iframe[src$=".m4v"],
          .preview-container iframe[src*=".m4v?"],
          .preview-container iframe[src$=".mkv"],
          .preview-container iframe[src*=".mkv?"] {
            display: block;
            width: 85% !important;
            max-width: 100%;
            aspect-ratio: 16 / 9;
            height: auto !important;
            border: 0;
            border-radius: 8px;
            margin: 2rem auto !important;
            background: #000;
          }
          @media (max-width: 768px) {
            .preview-container iframe[src$=".mp4"],
            .preview-container iframe[src*=".mp4?"],
            .preview-container iframe[src$=".webm"],
            .preview-container iframe[src*=".webm?"],
            .preview-container iframe[src$=".mov"],
            .preview-container iframe[src*=".mov?"],
            .preview-container iframe[src$=".m4v"],
            .preview-container iframe[src*=".m4v?"],
            .preview-container iframe[src$=".mkv"],
            .preview-container iframe[src*=".mkv?"] {
              width: 100% !important;
            }
          }

          /* DEFINITIVE STYLES FOR ALL CUSTOM BLOCKS */
          .preview-container .b44-callout, .preview-container .b44-fact {
            margin: 3rem 0 !important; 
            padding: 2rem !important; 
            border-radius: 12px !important; 
            display: flex !important; 
            gap: 1rem !important; 
            align-items: flex-start !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          }
          .preview-container .b44-callout-icon, .preview-container .b44-fact-icon { 
            margin-top: 2px !important; 
            font-size: 1.2em !important; 
          }
          .preview-container .b44-callout-content p, .preview-container .b44-fact-content p { 
            margin: 0 !important; 
            line-height: 1.6 !important; 
          }
          .preview-container .b44-callout-content h4, .preview-container .b44-fact-content h4 { 
            margin: 0 0 1rem 0 !important; 
            font-size: 1.1em !important; 
            font-weight: 600 !important; 
          }
          
          /* Blue Callout */
          .preview-container .b44-callout { 
            background-color: rgba(59, 130, 246, 0.1) !important; 
            border: 1px solid rgba(59, 130, 246, 0.2) !important; 
          }
          
          /* Orange/Yellow Fact */
          .preview-container .b44-fact { 
            background-color: rgba(245, 158, 11, 0.1) !important; 
            border: 1px solid rgba(245, 158, 11, 0.2) !important; 
          }
          
          /* Quote */
          .preview-container .b44-quote { 
            border-left: 4px solid #64748b !important; 
            padding-left: 2rem !important; 
            margin: 3rem 0 !important; 
            font-style: italic !important; 
            color: #cbd5e1 !important; 
            background: rgba(30, 41, 59, 0.2) !important;
            border-radius: 0 8px 8px 0 !important;
            padding: 2rem !important;
          }
          .preview-container .b44-quote p { 
            margin-bottom: 1rem !important; 
            font-size: 1.2rem !important;
          }
          .preview-container .b44-quote cite { 
            font-style: normal !important; 
            color: #94a3b8 !important; 
            font-size: 1rem !important; 
            opacity: 0.8 !important;
          }

          /* CTA */
          .preview-container .b44-cta {
            margin: 3rem 0 !important;
            padding: 2.5rem !important;
            border-radius: 1rem !important;
            background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8));
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          }
          .preview-container .b44-cta h3 {
            font-size: 1.75rem !important;
            font-weight: 700 !important;
            margin: 0 0 1rem 0 !important;
            color: #fff !important;
          }
          .preview-container .b44-cta p {
            margin: 0 0 1.5rem 0 !important;
            color: rgba(255, 255, 255, 0.8) !important;
            font-size: 1.1rem !important;
            max-width: 60ch;
            margin-left: auto;
            margin-right: auto;
          }
          .preview-container .b44-cta a {
            display: inline-block;
            background: linear-gradient(90deg, #3b82f6, #6366f1);
            color: #fff !important;
            padding: 0.75rem 2rem !important;
            border-radius: 0.5rem;
            text-decoration: none !important;
            font-weight: 600;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
          }
          .preview-container .b44-cta a:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
          }


          /* Divider */
          .preview-container .b44-divider { 
            border: 0 !important; 
            height: 2px !important; 
            background: linear-gradient(90deg, transparent, #475569, transparent) !important; 
            margin: 4rem 0 !important; 
          }

          /* Alert Boxes */
          .preview-container .b44-alert { 
            padding: 2rem !important; 
            border-radius: 12px !important; 
            border-left-width: 4px !important; 
            margin: 3rem 0 !important; 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          }
          .preview-container .b44-alert p { margin: 0 !important; }
          .preview-container .b44-alert-success { 
            background-color: rgba(34, 197, 94, 0.1) !important; 
            border-left-color: #22c55e !important; 
            color: #a7f3d0 !important; 
          }
          .preview-container .b44-alert-success p { color: #a7f3d0 !important; }
          .preview-container .b44-alert-warning { 
            background-color: rgba(245, 158, 11, 0.1) !important; 
            border-left-color: #f59e0b !important; 
            color: #fde68a !important; 
          }
          .preview-container .b44-alert-warning p { color: #fde68a !important; }
          
          /* TLDR Block */
          .preview-container .b44-tldr {
            margin: 3rem 0 !important;
            padding: 2rem !important;
            border-radius: 12px !important;
            background-color: rgba(234, 179, 8, 0.1) !important;
            border: 1px solid rgba(234, 179, 8, 0.2) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          }
          .preview-container .b44-tldr h4 {
            margin: 0 0 1rem 0 !important;
            font-size: 1.1em !important;
            font-weight: 700 !important;
            color: #f59e0b !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .preview-container .b44-tldr p {
            margin: 0 !important;
            line-height: 1.6 !important;
            color: #fde68a !important;
          }

          /* Promoted Product - REFRESHED STYLE */
          .preview-container .b44-promoted-product {
            position: relative;
            overflow: hidden;
            margin: 3rem 0 !important;
            padding: 2px !important; /* For gradient border */
            border-radius: 1.25rem !important; /* Slightly larger radius */
            background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important; /* Gradient for border */
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 40px rgba(99, 102, 241, 0.3) !important;
            transition: all 0.3s ease-in-out;
          }

          .preview-container .b44-promoted-product:hover {
              transform: translateY(-4px) scale(1.01);
              box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4), 0 0 60px rgba(139, 92, 246, 0.4) !important;
          }

          .preview-container .b44-promoted-product-inner-wrapper { /* New wrapper for content inside border */
              background: linear-gradient(145deg, #1e293b, #0f172a) !important;
              border-radius: 1.15rem !important;
              padding: 3rem !important;
          }

          .preview-container .b44-promoted-product-badge {
            position: absolute;
            top: -1px;
            right: 20px;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: white;
            padding: 0.75rem 1.5rem;
            border-bottom-left-radius: 1rem;
            border-bottom-right-radius: 1rem;
            font-size: 0.9rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            z-index: 10;
          }

          .preview-container .b44-promoted-product-inner {
            display: flex !important;
            gap: 2rem !important;
            align-items: center !important;
            flex-wrap: wrap !important;
          }

          .preview-container .b44-promoted-product-image img {
            width: 150px !important; /* Slightly larger */
            height: 150px !important;
            object-fit: cover !important;
            border-radius: 1rem !important;
            border: 2px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            margin: 0 !important; /* Override default img margin */
          }

          .preview-container .b44-promoted-product-content {
            flex: 1;
            min-width: 250px;
          }

          .preview-container .b44-promoted-product-content h3 {
            font-size: 1.75rem !important; /* Larger title */
            font-weight: 700 !important;
            margin: 0 0 1rem 0 !important;
            line-height: 1.3 !important;
            color: #fff !important;
          }

          .preview-container .b44-promoted-product-content p {
            margin: 0 0 1.5rem 0 !important;
            line-height: 1.7 !important; /* More spacing */
            color: rgba(255, 255, 255, 0.8) !important;
          }

          .preview-container .b44-promoted-product-actions {
            display: flex !important;
            align-items: center !important;
            gap: 1.5rem !important;
            flex-wrap: wrap !important;
          }

          .preview-container .b44-promoted-product-price {
            background: rgba(255, 255, 255, 0.05) !important;
            color: #a78bfa !important; /* Lighter purple */
            padding: 0.75rem 1.5rem !important;
            border-radius: 0.75rem !important;
            font-size: 1.1rem !important;
            font-weight: 600 !important;
            border: 1px solid rgba(167, 139, 250, 0.3) !important;
          }

          .preview-container .b44-promoted-product-button {
            background: linear-gradient(90deg, #8b5cf6, #d946ef) !important;
            color: white !important;
            padding: 1rem 2rem !important;
            border-radius: 0.75rem !important;
            text-decoration: none !important;
            font-weight: 700 !important; /* Bolder */
            transition: all 0.2s ease !important;
            box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3) !important;
          }

          .preview-container .b44-promoted-product-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4) !important;
          }
          
          /* Email Capture */
          .preview-container .b44-email-capture {
            margin: 3rem 0 !important;
            padding: 2.5rem !important;
            border-radius: 1rem !important;
            background: #111827;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
          }
          .preview-container .b44-email-capture h3 {
             margin: 0 0 1rem 0 !important;
             color: #fff !important;
          }
          .preview-container .b44-email-capture p {
             margin: 0 0 1.5rem 0 !important;
             color: rgba(255, 255, 255, 0.7) !important;
          }
          .preview-container .b44-email-capture-form {
            display: flex;
            gap: 0.5rem;
            max-width: 450px;
            margin: 0 auto;
          }
          .preview-container .b44-email-capture-form input {
            flex-grow: 1;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            border: 1px solid #374151;
            background: #1f2937;
            color: #fff;
          }
          .preview-container .b44-email-capture-form button {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            border: none;
            background: #4f46e5;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }
          .preview-container .b44-email-capture-success {
            color: #34d399;
            font-weight: 600;
          }

          /* TikTok Embed - remove outer whitespace and force full width of text column */
          .preview-container .tiktok-embed {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important; /* tightened to zero */
            padding: 0 !important;
            box-shadow: none !important; /* Remove any shadows */
            background: transparent !important; /* Ensure transparent background */
          }
          .preview-container .tiktok-embed > section {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }
        `
      }} />
      
      <div className="preview-viewport">
        <div id="live-preview-container" className="preview-container">
          {title && (
            <div className="title-section mb-12">
              <h1 style={{ 
                color: 'white', 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                marginBottom: '2rem', 
                paddingBottom: '1.5rem', 
                borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                {title}
              </h1>
            </div>
          )}
          <div 
            id="live-preview-content"
            dangerouslySetInnerHTML={{ __html: content }} 
          />
          {!content && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-slate-600/20 to-gray-600/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Edit3 className="w-12 h-12 text-white/40" />
              </div>
              <p className="text-white/50 italic text-xl">
                Start writing to see your content preview here...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
