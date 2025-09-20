
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor, Laptop, Tablet, Smartphone, X } from "lucide-react";
import { captureEmail } from "@/api/functions";
import { getTikTokOembed } from "@/api/functions";

const DEVICE_PRESETS = {
  desktop: { label: "Desktop", width: 1280, icon: Monitor },
  laptop: { label: "Laptop", width: 1024, icon: Laptop },
  tablet: { label: "Tablet", width: 834, icon: Tablet },
  mobile: { label: "Mobile", width: 390, icon: Smartphone },
};

export default function ExpandedPreviewModal({ isOpen, onClose, title, content, selectedFont = "Inter" }) {
  const [device, setDevice] = useState("desktop");
  const deviceWidth = useMemo(() => DEVICE_PRESETS[device].width, [device]);

  useEffect(() => {
    if (!isOpen) return;

    const container = document.getElementById("expanded-preview-content");
    if (!container) return;

    // Email capture submit handler
    const forms = container.querySelectorAll(".b44-email-capture-form");
    const handleSubmit = async (event) => {
      event.preventDefault();
      const form = event.target;
      const wrapper = form.closest(".b44-email-capture");
      const successMessage = wrapper?.querySelector(".b44-email-capture-success");
      const formName = wrapper?.dataset.formName || "Unknown Form";
      const emailInput = form.querySelector('input[name="email"]');
      const email = emailInput?.value;

      const result = await captureEmail({
        email,
        form_name: formName,
        source_url: window.location.href,
      });

      if (result?.data?.success) {
        if (form) form.style.display = "none";
        if (successMessage) successMessage.style.display = "block";
      } else {
        alert(`Error: ${result?.data?.error || "Unknown error"}`);
      }
    };
    forms.forEach((f) => f.addEventListener("submit", handleSubmit));

    // Ensure YouTube is responsive (unchanged)
    const makeYouTubeResponsive = () => {
      const iframes = Array.from(
        container.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]')
      );
      iframes.forEach((iframe) => {
        const wrapped = iframe.closest(".youtube-video-container");
        if (wrapped) {
          iframe.removeAttribute("width");
          iframe.removeAttribute("height");
          Object.assign(iframe.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "8px",
          });
          return;
        }
        const wrapper = document.createElement("div");
        wrapper.className = "youtube-video-container";
        Object.assign(wrapper.style, {
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%",
          height: "0",
          overflow: "hidden",
          maxWidth: "100%",
          margin: "2rem auto",
          borderRadius: "12px",
        });

        const parent = iframe.parentElement;
        iframe.removeAttribute("width");
        iframe.removeAttribute("height");
        Object.assign(iframe.style, {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "8px",
        });

        parent.insertBefore(wrapper, iframe);
        wrapper.appendChild(iframe);
      });
    };

    // Convert any plain-text TikTok URLs into anchors so they can be upgraded
    const convertPlainTikTokTextToAnchors = () => {
      const urlRegex = /(https?:\/\/(?:www\.)?tiktok\.com\/@[^/\s]+\/video\/\d+)/g;

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue || !node.parentNode) return NodeFilter.FILTER_REJECT;
          // Skip if already inside a link or an embed
          if (node.parentNode.closest('a, .tiktok-embed')) return NodeFilter.FILTER_REJECT;
          // Avoid processing text nodes that are already within script or style tags
          if (node.parentNode.nodeName === 'SCRIPT' || node.parentNode.nodeName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          return urlRegex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });

      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);

      nodes.forEach(textNode => {
        const text = textNode.nodeValue || "";
        const parts = text.split(urlRegex);
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (!part) return; // Skip empty parts from split
          if (part.startsWith("http") && urlRegex.test(part)) { // Check if the part is a URL
            const a = document.createElement("a");
            a.href = part;
            a.textContent = part;
            a.dataset.b44PlainUrl = "1"; // mark so we don't reconvert
            frag.appendChild(a);
          } else {
            frag.appendChild(document.createTextNode(part));
          }
        });
        if (frag.childNodes.length && textNode.parentNode) {
          textNode.parentNode.replaceChild(frag, textNode);
        }
      });
    };

    // Force styles on any TikTok blockquotes we see (before/after script runs)
    const styleTikTokEmbeds = () => {
      const embeds = Array.from(container.querySelectorAll(".tiktok-embed"));
      embeds.forEach((bq) => {
        bq.removeAttribute("style");
        Object.assign(bq.style, {
          width: "100%",
          maxWidth: "100%",
          minWidth: "0",
          margin: "0",
          padding: "0",
          background: "transparent",
          boxShadow: "none",
        });
        const section = bq.querySelector("section");
        if (section) {
          section.removeAttribute("style");
          Object.assign(section.style, {
            width: "100%",
            maxWidth: "100%",
            minWidth: "0",
            margin: "0",
            padding: "0",
            background: "transparent",
          });
        }
      });
    };

    // Upgrade TikTok links to embeds (oEmbed first, then fallback), then (re)load script
    const upgradeTikTokLinks = async () => {
      convertPlainTikTokTextToAnchors(); // Convert any plain text URLs to anchors first

      const links = Array.from(container.querySelectorAll('a[href*="tiktok.com/"]'))
        .filter(a => /https?:\/\/(www\.)?tiktok\.com\/@[^/]+\/video\/\d+/.test(a.href))
        .filter(a => !a.dataset.b44Embedded); // Only process links not already handled

      const createBlockquoteFromUrl = (url) => {
        const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
        const vid = m ? m[1] : "";
        const el = document.createElement("blockquote");
        el.className = "tiktok-embed";
        el.setAttribute("cite", url);
        if (vid) el.setAttribute("data-video-id", vid);
        el.innerHTML = '<section></section>'; // content placeholder to keep blockquote non-empty
        return el;
      };

      let insertedAny = false;

      for (const a of links) {
        a.dataset.b44Embedded = "1"; // Mark as processed
        let blockquote = null;
        try {
          const { data } = await getTikTokOembed({ url: a.href });
          const temp = document.createElement("div");
          temp.innerHTML = data?.html || "";
          temp.querySelectorAll("script").forEach(s => s.remove()); // Remove scripts from oEmbed HTML
          blockquote = temp.querySelector(".tiktok-embed");
        } catch (_) {
          // ignore; will use fallback
        }
        if (!blockquote) {
          blockquote = createBlockquoteFromUrl(a.href);
        }

        if (a.parentNode) { // Ensure parent node exists before insertion and removal
          a.insertAdjacentElement("beforebegin", blockquote);
          a.remove();
          insertedAny = true;
        }
      }

      // Style embeds before loading script, to apply our default styles
      styleTikTokEmbeds();

      if (insertedAny || container.querySelector(".tiktok-embed")) {
        // Remove ANY existing TikTok embed.js script so it runs fresh
        document.querySelectorAll('script[src*="tiktok.com/embed.js"]').forEach(s => s.remove());
        const script = document.createElement("script");
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      }
    };

    // Observe DOM changes (TikTok script will mutate the blockquote)
    const observer = new MutationObserver(() => {
      // Re-apply tight styles after TikTok modifies the DOM
      styleTikTokEmbeds();
    });
    observer.observe(container, { childList: true, subtree: true });


    const t1 = setTimeout(makeYouTubeResponsive, 30);
    const t2 = setTimeout(upgradeTikTokLinks, 80);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect(); // Disconnect the observer on cleanup
      const forms = container.querySelectorAll('.b44-email-capture-form');
      forms.forEach((f) => f.removeEventListener('submit', handleSubmit));
    };
  }, [isOpen, content]);

  const DeviceButton = ({ id }) => {
    const Icon = DEVICE_PRESETS[id].icon;
    const active = device === id;
    return (
      <Button
        variant={active ? "default" : "outline"}
        onClick={() => setDevice(id)}
        className={`gap-2 ${active ? "bg-indigo-600 text-white" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
        size="sm"
      >
        <Icon className="w-4 h-4" />
        {DEVICE_PRESETS[id].label}
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 border border-white/10">
        <DialogHeader className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white/90">Expanded Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <DeviceButton id="desktop" />
              <DeviceButton id="laptop" />
              <DeviceButton id="tablet" />
              <DeviceButton id="mobile" />
              <Button variant="ghost" onClick={onClose} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="w-full h-[calc(92vh-56px)] overflow-auto py-6">
          <div
            className="mx-auto shadow-2xl rounded-[18px] bg-slate-800/30 border border-white/10"
            style={{ width: '100%', maxWidth: deviceWidth }}
          >
            {/* Device "chrome" bar */}
            <div className="h-8 flex items-center justify-center">
              <div className="w-24 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Styles for the content preview */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .expanded-preview *, .expanded-preview *:before, .expanded-preview *:after { box-sizing: border-box !important; }
                .expanded-preview {
                  font-family: '${selectedFont}', sans-serif !important;
                  color: rgba(255, 255, 255, 0.92) !important;
                  line-height: 1.8 !important;
                  background: linear-gradient(135deg, rgba(15,23,42,0.28) 0%, rgba(30,41,59,0.18) 100%) !important;
                  border-radius: 16px !important;
                  padding: 40px 32px !important;
                  min-height: 60vh !important;
                  overflow-wrap: break-word !important;
                  overflow-x: hidden !important;
                }
                @media (max-width: 768px) { .expanded-preview { padding: 24px 16px !important; } }

                .expanded-preview h1, .expanded-preview h2, .expanded-preview h3, .expanded-preview h4, .expanded-preview h5, .expanded-preview h6 {
                  color: white !important;
                  margin: 3rem 0 1.5rem 0 !important;
                  font-weight: 600 !important;
                  line-height: 1.3 !important;
                }
                .expanded-preview h1 { font-size: 2.5rem !important; font-weight: 700 !important; margin-top: 0 !important; }
                .expanded-preview h2 { font-size: 2rem !important; }
                .expanded-preview h3 { font-size: 1.75rem !important; }
                .expanded-preview p, .expanded-preview div:not([class*="b44-"]) {
                  color: rgba(255,255,255,0.9) !important;
                  margin: 2rem 0 !important;
                  font-size: 1.1rem !important;
                }
                .expanded-preview img { max-width: 100% !important; height: auto !important; border-radius: 8px !important; margin: 2rem 0 !important; }

                /* Video-file iframes responsive */
                .expanded-preview iframe[src$=".mp4"],
                .expanded-preview iframe[src*=".mp4?"],
                .expanded-preview iframe[src$=".webm"],
                .expanded-preview iframe[src*=".webm?"],
                .expanded-preview iframe[src$=".mov"],
                .expanded-preview iframe[src*=".mov?"],
                .expanded-preview iframe[src$=".m4v"],
                .expanded-preview iframe[src*=".m4v?"],
                .expanded-preview iframe[src$=".mkv"],
                .expanded-preview iframe[src*=".mkv?"] {
                  display: block;
                  width: 80% !important;
                  max-width: 100%;
                  aspect-ratio: 16 / 9;
                  height: auto !important;
                  border: 0;
                  border-radius: 8px;
                  margin: 2rem auto !important;
                  background: #000;
                }
                @media (max-width: 768px) {
                  .expanded-preview iframe[src$=".mp4"],
                  .expanded-preview iframe[src*=".mp4?"],
                  .expanded-preview iframe[src$=".webm"],
                  .expanded-preview iframe[src*=".webm?"],
                  .expanded-preview iframe[src$=".mov"],
                  .expanded-preview iframe[src*=".mov?"],
                  .expanded-preview iframe[src$=".m4v"],
                  .expanded-preview iframe[src*=".m4v?"],
                  .expanded-preview iframe[src$=".mkv"],
                  .expanded-preview iframe[src*=".mkv?"] {
                    width: 100% !important;
                  }
                }

                /* YouTube: 80% centered (100% on mobile) */
                .expanded-preview .youtube-video-container {
                  position: relative; width: 100%; max-width: 80%; padding-bottom: 56.25%; height: 0; overflow: hidden;
                  margin: 2rem auto !important; border-radius: 12px;
                }
                .expanded-preview .youtube-video-container iframe {
                  position: absolute; top: 0; left: 0; width: 100% !important; height: 100% !important; border: 0; border-radius: 8px;
                }
                .expanded-preview iframe[src*="youtube.com"], .expanded-preview iframe[src*="youtu.be"] {
                  display: block; width: 80% !important; aspect-ratio: 16 / 9; height: auto !important; border: 0; border-radius: 8px; margin: 2rem auto !important;
                }
                @media (max-width: 768px) {
                  .expanded-preview .youtube-video-container { max-width: 100%; }
                  .expanded-preview iframe[src*="youtube.com"], .expanded-preview iframe[src*="youtu.be"] { width: 100% !important; }
                }

                /* TikTok: force 100% width and zero whitespace in expanded view */
                .expanded-preview .tiktok-embed {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-width: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: transparent !important;
                  box-shadow: none !important;
                }
                .expanded-preview .tiktok-embed > section {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-width: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: transparent !important;
                }

                /* Core custom blocks (subset) */
                .expanded-preview .b44-callout, .expanded-preview .b44-fact {
                  margin: 3rem 0 !important; padding: 2rem !important; border-radius: 12px !important;
                  display: flex !important; gap: 1rem !important; align-items: flex-start !important;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
                }
                .expanded-preview .b44-cta {
                  margin: 3rem 0 !important; padding: 2.5rem !important; border-radius: 1rem !important;
                  background: linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8));
                  border: 1px solid rgba(255,255,255,0.1); text-align: center;
                }

                /* Email Capture */
                .expanded-preview .b44-email-capture { margin: 3rem 0 !important; padding: 2.5rem !important; border-radius: 1rem !important; background: #111827; border: 1px solid rgba(255,255,255,0.1); text-align: center; }
                .expanded-preview .b44-email-capture-form { display: flex; gap: .5rem; max-width: 450px; margin: 0 auto; }
                .expanded-preview .b44-email-capture-form input { flex-grow: 1; padding: .75rem 1rem; border-radius: .5rem; border: 1px solid #374151; background: #1f2937; color: #fff; }
                .expanded-preview .b44-email-capture-form button { padding: .75rem 1.5rem; border-radius: .5rem; border: none; background: #4f46e5; color: #fff; font-weight: 600; cursor: pointer; }
              `,
            }} />

            <div className="expanded-preview">
              {title && (
                <div className="mb-8">
                  <h1 style={{
                    color: "white",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    marginBottom: "2rem",
                    paddingBottom: "1.5rem",
                    borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
                    textAlign: "center",
                  }}>
                    {title}
                  </h1>
                </div>
              )}

              <div id="expanded-preview-content" dangerouslySetInnerHTML={{ __html: content }} />
              {!content && (
                <div className="text-center py-20 text-white/60">Nothing to preview yet.</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
