
import React from "react";
import { getTikTokOembed } from "@/api/functions";

function extractVideoIdFromUrl(url) {
  if (!url) return null;
  const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  return m && m[1] ? m[1] : null;
}

function ensureTikTokScript() {
  if (document.querySelector('script[data-tiktok-embed]')) {
    return;
  }
  const s = document.createElement("script");
  s.src = "https://www.tiktok.com/embed.js";
  s.async = true;
  s.setAttribute("data-tiktok-embed", "true");
  document.body.appendChild(s);
}

export default function TikTokEmbed({ videoId, url, coverUrl, title, cachedHtml }) {
  const [embedHtml, setEmbedHtml] = React.useState(cachedHtml || null);
  const [failed, setFailed] = React.useState(false);
  const containerRef = React.useRef(null);

  const vid = videoId || extractVideoIdFromUrl(url);

  React.useEffect(() => {
    let cancelled = false;

    // If we have cached HTML, use it immediately and skip fetching
    if (cachedHtml) {
      setEmbedHtml(cachedHtml);
      setFailed(false);
      ensureTikTokScript();
      return () => { cancelled = true; };
    }

    setEmbedHtml(null);
    setFailed(false);

    async function loadOembed() {
      // Prefer oEmbed when we have a canonical TikTok URL
      if (!url || !/tiktok\.com\//i.test(url)) return;

      try {
        const { data } = await getTikTokOembed({ url });
        const html =
          data?.html ||
          data?.oembed?.html ||
          data?.data?.html ||
          null;

        if (!cancelled && html) {
          setEmbedHtml(html);
          // Load/refresh TikTok parsing script
          ensureTikTokScript();
          // Give React time to paint the HTML, then let embed.js upgrade it
          setTimeout(() => {
            try {
              // embed.js auto-initializes; re-adding script is enough in most cases.
              // If TikTok exposes a refresh API in the future, call it here.
            } catch {}
          }, 0);
        } else if (!cancelled) {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    loadOembed();
    return () => {
      cancelled = true;
    };
  }, [url, cachedHtml]);

  // 1) Render oEmbed HTML when available
  if (embedHtml) {
    return (
      <div className="aspect-[9/16] bg-slate-100 overflow-hidden relative">
        <div
          ref={containerRef}
          className="w-full h-full [&>*]:w-full [&>*]:h-full"
          dangerouslySetInnerHTML={{ __html: embedHtml }}
        />
      </div>
    );
  }

  // 2) Fallback to TikTok's v2 iframe when we have a video id
  if (!embedHtml && vid && !failed) {
    return (
      <div className="aspect-[9/16] bg-slate-100 overflow-hidden relative">
        <iframe
          title={title || "TikTok video"}
          src={`https://www.tiktok.com/embed/v2/video/${vid}`}
          className="w-full h-full"
          allow="encrypted-media; clipboard-write; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  // 3) Final fallback: cover image with an Open on TikTok button
  return (
    <div className="aspect-[9/16] bg-slate-100 overflow-hidden relative">
      {coverUrl ? (
        <a
          href={url || (vid ? `https://www.tiktok.com/@_/video/${vid}` : "#")}
          target="_blank"
          rel="noreferrer"
          className="group block w-full h-full relative"
        >
          <img
            src={coverUrl}
            alt={title || "TikTok"}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-black/70 text-white">
              Open on TikTok
            </span>
          </div>
        </a>
      ) : (
        <div className="w-full h-full grid place-items-center text-slate-400">
          No preview available
        </div>
      )}
    </div>
  );
}
