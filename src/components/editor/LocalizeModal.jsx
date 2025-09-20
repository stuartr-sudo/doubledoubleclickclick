
import React, { useEffect, useMemo, useRef, useState } from "react";
import { agentSDK } from "@/agents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Languages, Loader2, Wand2, Check } from "lucide-react"; // Removed RotateCcw
import { InvokeLLM } from "@/api/integrations";
import { User } from "@/api/entities";
import { callLlmWithRetry } from "./llmRetry";

export default function LocalizeModal({ isOpen, onClose, originalHtml, onApplyLocalized }) {
  const [language, setLanguage] = useState("German");
  const [localizedHtml, setLocalizedHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [chunkIndex, setChunkIndex] = useState(0);
  const [chunkTotal, setChunkTotal] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  // Removed: const [showLogs, setShowLogs] = useState(false);
  // Removed: const [logs, setLogs] = useState([]);
  // Removed: const [skipVerification, setSkipVerification] = useState(false);
  // Removed: const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  // Removed: const [llmChoice, setLlmChoice] = useState(() => {
  // Removed:   try {return localStorage.getItem("b44_llm_choice") || "auto";} catch {return "auto";}
  // Removed: });

  const stripFences = (s) => {
    if (!s) return "";
    let out = String(s).trim();
    const fenced = out.match(/^\s*```(?:html|HTML)?\s*([\s\S]*?)\s*```[\s]*$/);
    if (fenced) out = fenced[1];
    out = out.replace(/^\s*```(?:html|HTML)?\s*/i, "").replace(/\s*```$/i, "");
    out = out.replace(/```(?:html|HTML)?/gi, "");
    return out.trim();
  };

  const logLine = (msg) => {
    // Removed setLogs related logic
    try { console.log("[Localize]", `[${new Date().toLocaleTimeString()}] ${msg}`); } catch (e) { }
  };

  const handleClose = (open) => {
    if (!open) {
      onClose();
    }
  };

  // Removed: useEffect for llmChoice storage
  // useEffect(() => {
  //   try {localStorage.setItem("b44_llm_choice", llmChoice);} catch {}
  // }, [llmChoice]);

  useEffect(() => {
    if (!isOpen) {
      setLocalizedHtml("");
      setIsLoading(false);
      setIsVerifying(false);
      setPhase("idle");
      setChunkIndex(0);
      setChunkTotal(0);
      setProgressPct(0);
      // Removed: setLogs([]);
      // Removed: setShowLogs(false);
    }
  }, [isOpen]);

  // Removed: useEffect for isSuperadmin check
  // useEffect(() => {
  //   if (!isOpen) return;
  //   (async () => {
  //     try {
  //       const me = await User.me();
  //       setIsSuperadmin(!!me?.is_superadmin);
  //       if (!me?.is_superadmin) setShowLogs(false);
  //     } catch {
  //       setIsSuperadmin(false);
  //       setShowLogs(false);
  //     }
  //   })();
  // }, [isOpen]);

  const buildPrompt = useMemo(() => {
    return (lang, html) => {
      return [
        `Task: Translate the following HTML into ${lang}.`,
        `Rules:`,
        `- Preserve ALL HTML structure, classes, ids, data-* attributes, inline styles, and embeds (iframes, scripts).`,
        `- Do NOT add markdown code fences.`,
        `- Do NOT add commentary. Output ONLY the translated HTML.`,
        `- Keep ALL URLs unchanged (href, src, action, etc.).`,
        `- Do NOT invent or add image URLs. Do not change <img src> values.`,
        `- Translate visible text (headings, paragraphs, list items, figcaptions, buttons, etc.).`,
        `- If an alt attribute contains a sentence, translate it; otherwise keep as-is.`,
        `- IMPORTANT: The final output must be ONLY in ${lang}. Do not leave any content in other languages. Preserve proper nouns and brand names.`,
        ``,
        `BEGIN_HTML`,
        html || "",
        `END_HTML`].
        join("\n");
    };
  }, []);

  const getVisibleTextLength = (html) => {
    if (!html) return 0;
    return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  };

  const splitBlockByWords = (block, maxChars) => {
    const parts = [];
    let remaining = String(block);
    while (remaining.length > maxChars) {
      const slice = remaining.slice(0, maxChars + 1);
      let idx = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));
      if (idx < maxChars * 0.6) idx = maxChars;
      parts.push(remaining.slice(0, idx));
      remaining = remaining.slice(idx);
    }
    if (remaining) parts.push(remaining);
    return parts;
  };

  const splitIntoBlocks = (html) => {
    const parts = [];
    const tokens = String(html).split(/(<\/(?:p|div|section|article|ul|ol|li|h[1-6]|figure|blockquote|header|footer|main|aside|nav|form|table|thead|tbody|tfoot|tr|td|th)>)/i);
    for (let i = 0; i < tokens.length; i += 2) {
      const block = (tokens[i] || "") + (tokens[i + 1] || "");
      if (block.trim()) parts.push(block);
    }
    return parts.length ? parts : [html];
  };

  const chunkifyHtml = (html, maxChars = 5000) => {
    const blocks = splitIntoBlocks(html);
    const chunks = [];
    let current = "";
    for (const b of blocks) {
      if (b.length > maxChars) {
        const sub = splitBlockByWords(b, maxChars);
        for (const s of sub) {
          if ((current + s).length > maxChars && current) {
            chunks.push(current);
            current = "";
          }
          current += s;
        }
        continue;
      }
      if ((current + b).length > maxChars && current) {
        chunks.push(current);
        current = "";
      }
      current += b;
    }
    if (current) chunks.push(current);
    return chunks;
  };

  const buildChunkPrompt = (lang, chunk) => [
    `Task: Translate the following HTML CHUNK into ${lang}.`,
    `Rules:`,
    `- Return the FULL HTML for THIS CHUNK ONLY, NO TRUNCATION.`,
    `- Do NOT include content from other chunks and do NOT drop any content.`,
    `- Preserve ALL HTML structure, classes, ids, data-* attributes, inline styles, and embeds (iframes, scripts).`,
    `- Do NOT add markdown code fences or commentary.`,
    `- Keep ALL URLs unchanged (href, src, action, etc.).`,
    `- Do NOT invent or add image URLs. Do not change <img src> values.`,
    `- IMPORTANT: The output must be ONLY in ${lang}.`,
    ``,
    `BEGIN_HTML_CHUNK`,
    chunk,
    `END_HTML_CHUNK`].
    join("\n");

  const CHUNK_GLUE = "\n";

  const ensureFullLanguage = async (lang, html) => {
    // Removed: if (skipVerification) { logLine("Final verification skipped by user choice."); return html; }
    if (!html?.trim()) return html;

    const prompt = [
      `Task: Ensure the following HTML is written ONLY in ${lang}.`,
      `If any visible text is in a different language, translate it to ${lang}.`,
      `Do NOT alter HTML tags, attributes, URLs, or image sources.`,
      `Do NOT add commentary or markdown fences; output ONLY the corrected HTML.`,
      `BEGIN_HTML`,
      html,
      `END_HTML`].
      join("\n");

    setIsVerifying(true);
    logLine("Beginning final language verification...");
    try {
      const verifyPromise = (async () => {
        const resp = await callLlmWithRetry(
          { prompt, add_context_from_internet: false },
          {
            maxAttempts: 3,
            onRetry: ({ attempt, delay }) => {
              logLine(`Final verification rate-limited. Retry #${attempt} in ${Math.round(delay / 1000)}s`);
            },
            model: undefined // Changed to use default/auto LLM choice
          }
        );
        return stripFences(typeof resp === "string" ? resp : String(resp || ""));
      })();

      const timed = await Promise.race([
        verifyPromise,
        new Promise((resolve) => setTimeout(() => resolve("__TIMEOUT__"), 30000))]
      );

      if (timed === "__TIMEOUT__") {
        logLine("Final verification timed out after 30s. Proceeding without further verification.");
        return html;
      }
      logLine("Final verification complete.");
      return timed || html;
    } catch (e) {
      logLine(`Final verification failed: ${e?.message || "unknown error"}. Using assembled output.`);
      return html;
    } finally {
      setIsVerifying(false);
    }
  };

  const chunkedLocalize = async (lang, fullHtml) => {
    const outputs = [];
    const chunks = chunkifyHtml(fullHtml, 5000);
    setChunkTotal(chunks.length);
    setChunkIndex(0);
    setProgressPct(0);
    logLine(`Translating ${chunks.length} chunk(s)…`);

    for (let i = 0; i < chunks.length; i++) {
      setChunkIndex(i + 1);
      setProgressPct(Math.round(i / chunks.length * 100));

      const prompt = buildChunkPrompt(lang, chunks[i]);
      let piece = "";
      logLine(`Chunk ${i + 1}/${chunks.length}: Requesting translation…`);

      try {
        const res = await callLlmWithRetry(
          { prompt, add_context_from_internet: false },
          {
            maxAttempts: 3,
            onRetry: ({ attempt, delay }) => {
              logLine(`Chunk ${i + 1}/${chunks.length} rate-limited. Retry #${attempt} in ${Math.round(delay / 1000)}s`);
            },
            model: undefined // Changed to use default/auto LLM choice
          }
        );
        piece = stripFences(typeof res === "string" ? res : String(res || ""));
      } catch (e) {
        logLine(`Chunk ${i + 1}/${chunks.length}: Initial LLM call failed: ${e?.message}.`);
      }

      const inLen = getVisibleTextLength(chunks[i]);
      const outLen = getVisibleTextLength(piece);
      if (!piece || outLen < Math.max(50, Math.floor(inLen * 0.9))) {
        logLine(`Chunk ${i + 1}/${chunks.length}: output seemed truncated or empty (${outLen}/${inLen} visible chars). Retrying once…`);
        try {
          const res2 = await callLlmWithRetry(
            { prompt, add_context_from_internet: false },
            {
              maxAttempts: 2,
              onRetry: ({ attempt, delay }) => {
                logLine(`Chunk ${i + 1}/${chunks.length} ensure-full retry #${attempt} in ${Math.round(delay / 1000)}s`);
              },
              model: undefined // Changed to use default/auto LLM choice
            }
          );
          piece = stripFences(typeof res2 === "string" ? res2 : String(res2 || "")) || chunks[i];
          if (piece === chunks[i]) {
            logLine(`Chunk ${i + 1}/${chunks.length}: Retry failed, using original chunk to avoid loss.`);
          } else {
            logLine(`Chunk ${i + 1}/${chunks.length}: Retry successful.`);
          }
        } catch (e) {
          logLine(`Chunk ${i + 1}/${chunks.length}: Second LLM call failed: ${e?.message}. Using original chunk.`);
          piece = chunks[i];
        }
      } else {
        logLine(`Chunk ${i + 1}/${chunks.length}: translated ok.`);
      }

      outputs.push(piece);
      setProgressPct(Math.round((i + 1) / chunks.length * 100));
    }

    const assembled = outputs.join(CHUNK_GLUE);
    logLine("All chunks processed. Assembling HTML.");
    return assembled;
  };

  const startLocalization = async () => {
    if (!language || !originalHtml?.trim() || isLoading) return;

    setLocalizedHtml("");
    // Removed: setLogs([]);
    setPhase("translating");
    setIsLoading(true);
    setIsVerifying(false);
    setProgressPct(0);
    setChunkIndex(0);
    setChunkTotal(0);

    try {
      logLine(`Starting localization to ${language}...`); // Simplified log message
      const assembledHtml = await chunkedLocalize(language, originalHtml);

      let finalHtml = assembledHtml;
      // Final verification always runs, removed superadmin/skipVerification condition
      setPhase("verifying");
      finalHtml = await ensureFullLanguage(language, assembledHtml);

      setLocalizedHtml(finalHtml);
      setPhase("done");
      logLine("Localization completed successfully.");
    } catch (e) {
      logLine(`Localization error: ${e?.message || "Unknown error"}`);
      setPhase("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    const cleaned = stripFences(localizedHtml);
    if (!cleaned?.trim()) return;
    onApplyLocalized(cleaned);
    handleClose(false);
  };

  // Removed: handleReset function
  // const handleReset = () => {
  //   setLocalizedHtml("");
  //   setIsLoading(false);
  //   setIsVerifying(false);
  //   setPhase("idle");
  //   setChunkIndex(0);
  //   setChunkTotal(0);
  //   setProgressPct(0);
  //   setLogs([]);
  //   setShowLogs(false);
  //   setSkipVerification(false); // Reset skip verification for next use
  // };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="b44-modal max-w-3xl bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Languages className="w-5 h-5 text-emerald-600" />
            Localize Article
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Globe className="w-4 h-4 text-slate-700" />
            <div className="w-56">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="Choose language" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {[
                    "German", "Spanish", "French", "Italian", "Portuguese (Brazil)", "Portuguese (Portugal)",
                    "Dutch", "Polish", "Swedish", "Danish", "Norwegian", "Finnish",
                    "Turkish", "Arabic", "Hebrew", "Japanese", "Korean",
                    "Chinese (Simplified)", "Chinese (Traditional)", "Hindi", "Indonesian",
                    "Thai", "Vietnamese"].
                    map((lang) =>
                      <SelectItem key={lang} value={lang} className="text-slate-900 hover:bg-slate-100">
                        {lang}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            {/* Removed: Model selector */}
            {/*
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-700">Model</span>
              <Select value={llmChoice} onValueChange={setLlmChoice}>
                <SelectTrigger className="h-8 w-[220px] bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="auto">Auto (use available key)</SelectItem>
                  <SelectItem value="openai:gpt-4o-mini">OpenAI — gpt-4o-mini</SelectItem>
                  <SelectItem value="openai:gpt-4.1">OpenAI — gpt-4.1</SelectItem>
                  <SelectItem value="anthropic:claude-3-5-sonnet-20240620">Anthropic — Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="google:gemini-1.5-pro">Google — Gemini 1.5 Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            */}

            <div className="flex items-center gap-2 ml-auto">
              {phase !== "idle" &&
                <div className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-800 text-xs">
                  {phase === "translating" && `Translating ${chunkIndex}/${chunkTotal}…`}
                  {phase === "verifying" && "Verifying language…"}
                  {phase === "done" && "Done"}
                </div>
              }
              {/* Removed: Superadmin controls (Skip verification, View logs) */}
              {/*
              {isSuperadmin &&
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      className="accent-emerald-600"
                      checked={skipVerification}
                      onChange={(e) => setSkipVerification(e.target.checked)}
                      disabled={isLoading || isVerifying} />
                    Skip verification
                  </label>
                  <Button
                    variant="outline"
                    onClick={() => setShowLogs((v) => !v)}
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                    disabled={isLoading && !showLogs}>
                    {showLogs ? "Hide logs" : "View logs"}
                  </Button>
                </>
              }
              */}
              {/* Removed: Reset button */}
              {/*
              <Button
                variant="outline"
                onClick={handleReset}
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                disabled={isLoading || isVerifying}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              */}
              <Button
                onClick={startLocalization}
                disabled={!originalHtml?.trim() || !language || isLoading || isVerifying} className="bg-blue-950 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-slate-800">
                {isLoading || isVerifying ?
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {phase === "verifying" ? "Verifying…" : "Localizing…"}
                  </> :
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Localize
                  </>
                }
              </Button>
            </div>
          </div>

          {(phase === "translating" || phase === "verifying") && (
            <div className="w-full">
              <div className="h-2 w-full bg-slate-200 rounded">
                <div
                  className="h-2 bg-emerald-600 rounded"
                  style={{ width: `${phase === "verifying" ? 100 : progressPct}%`, transition: "width 200ms linear" }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {phase === "translating"
                  ? `Chunk ${chunkIndex} of ${chunkTotal} (${progressPct}%)`
                  : "Final verification (max ~30s timeout)"}
              </div>
            </div>
          )}

          {/* Removed: Logs panel toggle & panel */}
          {/*
          {isSuperadmin && showLogs &&
            <div className="bg-slate-100 border border-slate-200 rounded-md p-3 max-h-48 overflow-auto text-xs text-slate-800">
              <pre className="whitespace-pre-wrap leading-relaxed">{logs.join("\n") || "No logs yet."}</pre>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    navigator.clipboard.writeText(logs.join("\n") || "");
                  }}>
                  Copy logs
                </Button>
              </div>
            </div>
          }
          */}

          <div className="space-y-2">
            <div className="text-sm text-slate-700">Localized HTML</div>
            <Textarea
              value={localizedHtml}
              onChange={(e) => setLocalizedHtml(e.target.value)}
              rows={12}
              className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 font-mono text-xs"
              placeholder="The translated HTML will appear here…"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1 bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
              disabled={isLoading || isVerifying}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!localizedHtml?.trim() || isLoading || isVerifying} className="bg-sky-950 text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 flex-1 hover:bg-slate-800">
              <Check className="w-4 h-4 mr-2" />
              Use Localized HTML
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
