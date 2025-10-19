
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Play, AlertCircle, Crown, User as UserIcon, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import { useTokenConsumption } from "@/components/hooks/useTokenConsumption";
import { useFeatureFlagData } from "@/components/providers/FeatureFlagProvider";

const STEP_LABELS = {
  tldr: "Key Takeaway",
  faq: "FAQs",
  brand_it: "Brand It",
  html_cleanup: "Clean HTML",
  autolink: "AutoLink",
  autoscan: "AutoScan",
  seo: "SEO",
  schema: "Schema",
  links_references: "Links + References",
  humanize: "Humanize"
};

const FEATURE_FLAG_BY_STEP = {
  tldr: "ai_tldr",
  key_takeaway: "ai_tldr",
  "key takeaway (tldr)": "ai_tldr",
  faq: "ai_faq",
  faqs: "ai_faq",
  "brand it": "ai_brand_it",
  brand_it: "ai_brand_it",
  "clean up html": "ai_html_cleanup",
  html_cleanup: "ai_html_cleanup",
  autolink: "ai_autolink",
  add_internal_links: "ai_autolink",
  auto_link: "ai_autolink",
  autoscan: "ai_autoscan",
  seo: "ai_seo",
  schema: "ai_schema",
  links_references: "ai_links_references",
  cite_sources: "ai_links_references",
  humanize: "ai_humanize"
};

export default function RunWorkflowModal({
  isOpen,
  onClose,
  currentHtml,
  onApply,
  onWorkflowStart,
  userName,
  itemId = null,
  itemType = null,
  backgroundMode = false
}) {
  const [workflows, setWorkflows] = useState([]); // This will now hold only default workflows
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(""); // Renamed from selectedId
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loadingWorkflows, setLoadingWorkflows] = useState(true); // New state for loading workflows

  const { consumeTokensForFeature } = useTokenConsumption();
  const { flags } = useFeatureFlagData();

  const TIPS = useMemo(() => ([
    "The first email was sent in 1971 by Ray Tomlinson, who also introduced the @ symbol in email addresses",
    "The World Wide Web was invented by Tim Berners-Lee in 1989 at CERN in Switzerland",
    "The first website ever created is still online at info.cern.ch and was published on August 6, 1991",
    "The first image ever uploaded to the web was in 1992 - a picture of the band Les Horribles Cernettes",
    "Google's original name was 'Backrub' before being renamed in 1997",
    "The first YouTube video 'Me at the zoo' was uploaded on April 23, 2005, and is only 18 seconds long",
    "Over 300 billion emails are sent every day across the internet",
    "The first webcam was created at Cambridge University in 1991 to monitor a coffee pot",
    "The domain symbolics.com, registered in 1985, is the oldest registered .com domain still in use",
    "The first online purchase was a Sting CD sold on August 11, 1994",
    "More than 4.9 billion people worldwide use the internet as of 2023",
    "The internet weighs about the same as a strawberry (50 grams) when you count all the electrons in motion"
  ]), []);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!status || status.status !== "running") return;
    const id = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 4000);
    return () => clearInterval(id);
  }, [status?.status, TIPS.length]);

  const selectedWorkflow = useMemo(() => {
    // Simplified: now workflows only contains the default ones
    return workflows.find(w => String(w.id) === String(selectedWorkflowId)) || null;
  }, [selectedWorkflowId, workflows]);

  const estimatedCost = useMemo(() => {
    const wf = selectedWorkflow;
    if (!wf || !Array.isArray(wf.workflow_steps)) return 0;

    // CRITICAL: If manual token_cost is set, use that instead of calculating
    if (typeof wf.token_cost === 'number' && wf.token_cost >= 0) {
      return wf.token_cost;
    }

    // Otherwise, calculate from individual steps
    let total = 0;
    for (const step of wf.workflow_steps) {
      if (step?.enabled === false) continue;
      const type = String(step?.type || "").toLowerCase();
      const flagName = FEATURE_FLAG_BY_STEP[type] || null;
      if (!flagName) continue;
      const flag = (flags || []).find(f => f.name === flagName);
      const stepCost = Number(flag?.token_cost ?? 0);
      if (Number.isFinite(stepCost)) total += stepCost;
    }
    return total;
  }, [selectedWorkflow, flags]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    (async () => {
      setLoadingWorkflows(true); // Start loading
      try {
        // Only fetch default workflows
        const defaults = await base44.entities.EditorWorkflow.filter({ is_default: true }, "-updated_date", 200).catch(() => []);

        if (active) {
          setWorkflows(defaults || []); // Set to 'workflows' state
          if (defaults.length > 0 && !selectedWorkflowId) {
            // Automatically select the first default workflow if none is selected
            setSelectedWorkflowId(String(defaults[0].id));
          }
        }
      } catch (err) {
        console.error("Failed to load workflows:", err);
        toast.error("Failed to load workflows");
      } finally {
        if (active) {
          setLoadingWorkflows(false); // End loading
        }
      }
    })();

    return () => { active = false; };
  }, [isOpen]); // FIXED: Only depend on isOpen, not selectedWorkflowId

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const arr = await base44.entities.WorkflowRunStatus.filter({ id: runId }).catch(() => []);
      if (cancelled) return;
      const row = arr && arr[0];
      if (row) {
        setStatus(row);
        if (row.status === "completed" || row.status === "failed") {
          clearInterval(interval);
          setRunning(false);
        }
      }
    }, 1500);
    return () => { cancelled = true; clearInterval(interval); };
  }, [runId]);

  const STEP_TO_AGENT = {
    tldr: "tldr_agent",
    key_takeaway: "tldr_agent",
    "key takeaway (tldr)": "tldr_agent",
    faq: "faq_agent",
    faqs: "faq_agent",
    "brand it": "brand_it",
    brand_it: "brand_it",
    "clean up html": "html_cleanup_agent",
    html_cleanup: "html_cleanup_agent",
    autolink: "internal_linker",
    add_internal_links: "internal_linker",
    auto_link: "internal_linker",
    autoscan: "autoscanner",
    seo: "seo_agent",
    schema: "schema_generator",
    humanize: "humanize_agent"
  };

  const callAgent = async (agentName, content) => {
    console.log(`🔥 FLASH: callAgent started for ${agentName}`);
    const { agentSDK } = await import("@/agents");
    const conversation = await agentSDK.createConversation({
      agent_name: agentName,
      metadata: { source: "flash_workflow" },
    });
    console.log(`🔥 FLASH: Conversation created:`, conversation.id);

    await agentSDK.addMessage(conversation, {
      role: "user",
      content: content,
    });
    console.log(`🔥 FLASH: Message added to conversation`);

    const result = await waitForAgentResponse(conversation.id);
    console.log(`🔥 FLASH: callAgent completed for ${agentName}`);
    return result;
  };

  const waitForAgentResponse = async (conversationId, timeoutSec = 120) => {
    console.log(`🔥 FLASH: Waiting for agent response (${timeoutSec}s timeout)`);
    const { agentSDK } = await import("@/agents");
    const deadline = Date.now() + timeoutSec * 1000;
    let attempts = 0;
    while (Date.now() < deadline) {
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`🔥 FLASH: Still waiting... attempt ${attempts}`);
      }
      const conv = await agentSDK.getConversation(conversationId);
      const messages = conv?.messages || [];
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role === "assistant" && m.content) {
          console.log(`🔥 FLASH: Agent responded after ${attempts} attempts`);
          return String(m.content).trim();
        }
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    console.error(`🔥 FLASH: Agent timed out after ${timeoutSec} seconds`);
    throw new Error("Agent timed out after " + timeoutSec + " seconds");
  };

  const toPlain = (html = "") => String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const stripCodeFences = (str) => {
    if (!str) return "";
    let out = String(str).trim();
    const match = out.match(/^```(?:html|json)?\s*([\s\S]*?)\s*```$/);
    if (match) {
      out = match[1];
    } else {
      out = out.replace(/^```(?:html|json)?\s*/i, "").replace(/\s*```$/i, "");
    }
    return out.trim();
  };

  const looksLikeHtml = (str) => {
    const s = (str || "").trim();
    return s.startsWith("<") && s.includes(">");
  };

  const insertLinkOnce = (html, anchorText, url) => {
    if (!html || !anchorText || !url) return html || "";
    const text = anchorText.trim();
    if (!text) return html;

    const lowerHtml = html.toLowerCase();
    const lowerText = text.toLowerCase();

    let idx = -1;
    let startPos = 0;

    while (true) {
      idx = lowerHtml.indexOf(lowerText, startPos);
      if (idx === -1) return html;

      const beforeA = lowerHtml.lastIndexOf("<a", idx);
      const afterA = lowerHtml.indexOf("</a>", idx);
      const insideA = beforeA !== -1 && afterA !== -1 && beforeA < idx && idx < afterA;

      const hOpen = Math.max(
        lowerHtml.lastIndexOf("<h1", idx),
        lowerHtml.lastIndexOf("<h2", idx),
        lowerHtml.lastIndexOf("<h3", idx),
        lowerHtml.lastIndexOf("<h4", idx),
        lowerHtml.lastIndexOf("<h5", idx),
        lowerHtml.lastIndexOf("<h6", idx)
      );
      const hClose = lowerHtml.indexOf("</h", idx);
      const insideH = hOpen !== -1 && hClose !== -1 && hOpen < idx && idx < hClose;

      if (!insideA && !insideH) {
        const before = html.slice(0, idx);
        const match = html.slice(idx, idx + text.length);
        const after = html.slice(idx + text.length);
        const anchor = `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
        return before + anchor + after;
      }
      startPos = idx + lowerText.length;
    }
  };

  const applyLinkOperations = (html, ops, maxLinks = 10) => {
    let out = html || "";
    let used = 0;
    const urlCounts = new Map();
    for (const op of ops || []) {
      if (used >= maxLinks) break;
      const anchor = String(op?.anchor_text || op?.text || op?.phrase || "").trim();
      const url = String(op?.url || op?.href || op?.target_url || "").trim();
      if (!anchor || !url) continue;

      const current = urlCounts.get(url) || 0;
      if (current >= 2) continue;

      const next = insertLinkOnce(out, anchor, url);
      if (next !== out) {
        out = next;
        used += 1;
        urlCounts.set(url, current + 1);
      }
    }
    return { html: out, used };
  };

  const runFlashClient = async ({ runId, workflow, html }) => {
    console.log("🔥 FLASH: runFlashClient started with", workflow.workflow_steps.length, "steps");
    console.log("🔥 FLASH: HTML content length:", html?.length || 0);

    let current = html;
    let seoData = null;
    let schemaData = null;
    const steps = Array.isArray(workflow?.workflow_steps) ? workflow.workflow_steps : [];

    const pushStatus = async (partial) => {
      try {
        await base44.entities.WorkflowRunStatus.update(runId, partial);
        console.log("🔥 FLASH: Status updated:", partial.progress_message || partial.status);
      } catch (e) {
        console.error("🔥 FLASH: Failed to update status:", e);
      }
    };

    console.log("🔥 FLASH: Setting initial status to running");
    await pushStatus({
      status: "running",
      started_at: new Date().toISOString(),
      total_steps: steps.length,
      progress_message: `Starting workflow with ${steps.length} steps`,
    });

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i] || {};
      const rawType = String(step.type || "").trim();
      const type = rawType.toLowerCase();

      console.log(`🔥 FLASH: ========== Starting step ${i + 1}/${steps.length}: ${rawType} ==========`);

      await pushStatus({
        current_step_index: i,
        current_step_name: rawType,
        progress_message: `Running step ${i + 1}/${steps.length}: ${rawType}`,
      });

      try {
        if (type === "links + references" || type === "links_references" || type === "cite_sources") {
          console.log("🔥 FLASH: Calling generateExternalReferences function");
          const { data } = await base44.functions.invoke("generateExternalReferences", { html: current });
          console.log("🔥 FLASH: generateExternalReferences completed");
          if (data?.updated_html) {
            current = data.updated_html;
          } else if (typeof data === "string" && data.trim()) {
            current = data;
          } else {
            throw new Error("Links + References returned empty result");
          }
          console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);
          continue;
        }

        const agentName = STEP_TO_AGENT[type];
        if (!agentName) {
          throw new Error(`Unknown step type: ${rawType}`);
        }

        console.log(`🔥 FLASH: Preparing to call agent: ${agentName}`);

        let contentToSend = current;
        if (type === "brand_it" || type === "brand it") {
          contentToSend = `USERNAME: ${userName}\n\nHTML CONTENT:\n${current}`;
          console.log(`🔥 FLASH: Brand It - adding username prefix`);
        }

        console.log(`🔥 FLASH: Calling agent ${agentName} with content length:`, contentToSend?.length || 0);
        const out = await callAgent(agentName, contentToSend);
        console.log(`🔥 FLASH: Agent ${agentName} returned response length:`, out?.length || 0);

        let rawOut = String(out || "").trim();

        if (!rawOut) {
          throw new Error(`${rawType} agent returned empty result`);
        }

        console.log(`🔥 FLASH: Stripping code fences from response`);
        rawOut = stripCodeFences(rawOut);

        if (type === "brand_it" || type === "brand it") {
          console.log(`🔥 FLASH: Processing Brand It response`);
          if (rawOut.includes("unable to retrieve") || rawOut.includes("cannot rewrite") || !looksLikeHtml(rawOut)) {
            console.log(`🔥 FLASH: Brand It skipped (no valid HTML or error message)`);
            console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);
            continue;
          }
          current = rawOut;
          console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);
          continue;
        }

        if (type === "tldr" || type === "key_takeaway" || type === "key takeaway (tldr)") {
          console.log(`🔥 FLASH: Processing TLDR response`);
          const cleanedSummary = rawOut.replace(/<[^>]*>?/gm, '').trim();

          const elId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const tldrHtml = `
<div class="b44-tldr" data-b44-id="${elId}" data-b44-type="tldr" style="border-left: 4px solid #4f46e5; padding: 1rem; background-color: #f5f3ff; margin: 1.5rem 0; border-radius: 4px;">
  <div class="b44-tldr-icon" style="float: left; margin-right: 0.75rem; font-size: 1.5rem;">💡</div>
  <div class="b44-tldr-content" style="overflow: hidden;">
    <h4 style="margin-top: 0; margin-bottom: 0.5rem; font-weight: bold; color: #3730a3;">TL;DR</h4>
    <p style="margin-bottom: 0; color: #434343;">${cleanedSummary}</p>
  </div>
</div>`;

          current = tldrHtml + '\n' + current;
          console.log(`🔥 FLASH: TLDR added to content`);
          console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);
          continue;
        }

        if (type === "autolink" || type === "add_internal_links" || type === "auto_link") {
          console.log(`🔥 FLASH: Processing AutoLink response`);
          let parsed = null;
          try {
            parsed = JSON.parse(rawOut);
            console.log(`🔥 FLASH: AutoLink JSON parsed successfully`);
          } catch (parseErr) {
            console.error(`🔥 FLASH: AutoLink JSON parse error:`, parseErr);
            throw new Error(`AutoLink returned invalid JSON: ${parseErr.message}`);
          }

          if (parsed?.updated_html && typeof parsed.updated_html === 'string') {
            current = parsed.updated_html;
            console.log(`🔥 FLASH: AutoLink applied via updated_html`);
          } else if (Array.isArray(parsed?.link_operations)) {
            console.log(`🔥 FLASH: AutoLink applying link operations:`, parsed.link_operations.length);
            const res = applyLinkOperations(current, parsed.link_operations, 10);
            current = res.html;
            console.log(`🔥 FLASH: AutoLink inserted ${res.used} links`);
          } else {
            throw new Error("AutoLink JSON missing both updated_html and link_operations fields");
          }
          console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);
          continue;
        }

        if (type === "autoscan") {
          console.log(`🔥 FLASH: Processing AutoScan response`);
          let parsed = null;
          try {
            parsed = JSON.parse(rawOut);
            console.log(`🔥 FLASH: AutoScan JSON parsed successfully`);
          } catch (parseErr) {
            console.error(`🔥 FLASH: AutoScan JSON parse error:`, parseErr);
            throw new Error(`AutoScan returned invalid JSON: ${parseErr.message}`);
          }

          if (parsed?.updated_html && typeof parsed.updated_html === 'string') {
            current = parsed.updated_html;
            console.log(`🔥 FLASH: AutoScan applied updated_html`);
          } else {
            throw new Error("AutoScan JSON missing updated_html field");
          }
          console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);
          continue;
        }

        if (type === "seo") {
          console.log(`🔥 FLASH: Processing SEO response`);
          let parsed = null;
          try {
            parsed = JSON.parse(rawOut);
            console.log(`🔥 FLASH: SEO JSON parsed successfully`);
          } catch (parseErr) {
            console.error(`🔥 FLASH: SEO JSON parse error:`, parseErr);
            throw new Error(`SEO returned invalid JSON: ${parseErr.message}`);
          }

          seoData = {
            meta_title: parsed.meta_title || "",
            slug: parsed.slug || "",
            meta_description: parsed.meta_description || "",
            focus_keyword: parsed.focus_keyword || "",
            featured_image: parsed.featured_image || "",
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            excerpt: parsed.excerpt || ""
          };
          console.log(`🔥 FLASH: SEO data collected`);
          console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);
          continue;
        }

        if (type === "schema") {
          console.log(`🔥 FLASH: Processing Schema response`);
          schemaData = rawOut;
          const script = `\n<script type="application/ld+json">\n${rawOut}\n</script>`;
          current = current + script;
          console.log(`🔥 FLASH: Schema script added to content`);
          console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);
          continue;
        }

        console.log(`🔥 FLASH: Validating HTML output for ${rawType}`);
        if (!looksLikeHtml(rawOut)) {
          throw new Error(`${rawType} agent did not return HTML`);
        }
        current = rawOut;
        console.log(`🔥 FLASH: ========== Completed step ${i + 1}/${steps.length}: ${rawType} ==========`);

      } catch (err) {
        console.error(`🔥 FLASH: ========== STEP FAILED ${i + 1}/${steps.length}: ${rawType} ==========`);
        console.error(`🔥 FLASH: Error details:`, err);
        const errorMsg = `Step "${rawType}" failed: ${err?.message || String(err)}`;
        await pushStatus({
          status: "failed",
          error_message: errorMsg,
          progress_message: `Failed at step ${i + 1}: ${rawType}`,
        });
        throw new Error(errorMsg);
      }
    }

    console.log("🔥 FLASH: All steps completed successfully, preparing final result");
    const resultData = {};
    if (seoData) resultData.seo_metadata = seoData;
    if (schemaData) resultData.schema = schemaData;

    console.log("🔥 FLASH: Updating final status to completed");
    await pushStatus({
      status: "completed",
      finished_at: new Date().toISOString(),
      result_html: current,
      result: Object.keys(resultData).length > 0 ? resultData : null,
      progress_message: "Workflow completed successfully",
    });

    console.log("🔥 FLASH: runFlashClient finished successfully");
    return { ok: true, html: current, seo: seoData, schema: schemaData };
  };

  const runFlashClientInBackground = async () => {
    console.log("🔥 FLASH: Starting background workflow for", itemType, itemId);
    try {
      const newRun = await base44.entities.WorkflowRunStatus.create({
        workflow_id: selectedWorkflow.id,
        status: "pending",
        total_steps: selectedWorkflow?.workflow_steps?.length || 0,
        current_step_index: -1,
      });

      if (!newRun?.id) {
        throw new Error("Failed to create workflow run record");
      }

      console.log("🔥 FLASH: Created run record", newRun.id);

      const result = await runFlashClient({
        runId: newRun.id,
        workflow: selectedWorkflow,
        html: currentHtml,
      });

      console.log("🔥 FLASH: Workflow completed", result.ok);

      if (result?.ok) {
        // Deduct tokens
        if (estimatedCost > 0) {
          await consumeTokensForFeature("flash_workflow_orchestration", estimatedCost);
          console.log("🔥 FLASH: Tokens consumed", estimatedCost);
        }

        // CRITICAL: Update the database with new content
        if (itemId && itemType) {
          const updateData = {
            content: result.html,
            flash_status: "completed",
            flashed_at: new Date().toISOString()
          };

          if (result.seo) {
            Object.assign(updateData, {
              meta_title: result.seo.meta_title,
              slug: result.seo.slug,
              meta_description: result.seo.meta_description,
              focus_keyword: result.seo.focus_keyword,
              featured_image: result.seo.featured_image,
              tags: result.seo.tags,
              excerpt: result.seo.excerpt
            });
          }

          if (result.schema) {
            updateData.generated_llm_schema = result.schema;
          }

          console.log("🔥 FLASH: Updating database with", updateData.flash_status);

          if (itemType === "post") {
            await base44.entities.BlogPost.update(itemId, updateData);
          } else if (itemType === "webhook") {
            await base44.entities.WebhookReceived.update(itemId, updateData);
          }

          console.log("🔥 FLASH: Database updated successfully");
        }
      }
    } catch (err) {
      console.error("🔥 FLASH: Background flash failed:", err);
      console.error("🔥 FLASH: Error stack:", err.stack);
      // Update flash_status to "failed"
      if (itemId && itemType) {
        try {
          if (itemType === "post") {
            await base44.entities.BlogPost.update(itemId, { flash_status: "failed" });
          } else if (itemType === "webhook") {
            await base44.entities.WebhookReceived.update(itemId, { flash_status: "failed" });
          }
          console.log("🔥 FLASH: Status updated to failed");
        } catch (updateErr) {
          console.error("🔥 FLASH: Failed to update flash failure status:", updateErr);
        }
      }
    }
  };

  const startRun = async () => {
    if (!selectedWorkflow) {
      toast.error("Please select a workflow");
      return;
    }
    if (!currentHtml) {
      setError("No HTML content to process.");
      toast.error("No HTML content to process.");
      return;
    }

    setError("");
    setStatus(null);
    setRunning(true);

    // Update item flash_status to "running"
    if (itemId && itemType) {
      try {
        if (itemType === "post") {
          await base44.entities.BlogPost.update(itemId, {
            flash_status: "running",
            flash_workflow_id: selectedWorkflow.id
          });
        } else if (itemType === "webhook") {
          await base44.entities.WebhookReceived.update(itemId, {
            flash_status: "running",
            flash_workflow_id: selectedWorkflow.id
          });
        }
      } catch (err) {
        console.error("Failed to update flash status:", err);
      }
    }

    // If in background mode, close modal immediately
    if (backgroundMode) {
      // Notify parent component that workflow is starting
      onWorkflowStart && onWorkflowStart();

      toast.info("Flash workflow started in background", { duration: 3000 });
      handleClose();

      // Start workflow in background
      runFlashClientInBackground();
      return;
    }

    // Normal flow with progress modal
    try {
      const newRun = await base44.entities.WorkflowRunStatus.create({
        workflow_id: selectedWorkflow.id,
        status: "pending",
        total_steps: selectedWorkflow?.workflow_steps?.length || 0,
        current_step_index: -1,
      });

      if (!newRun?.id) {
        throw new Error("Failed to create workflow run record");
      }

      setRunId(newRun.id);

      const result = await runFlashClient({
        runId: newRun.id,
        workflow: selectedWorkflow,
        html: currentHtml,
      });

      if (result?.ok) {
        if (estimatedCost > 0) {
          await consumeTokensForFeature("flash_workflow_orchestration", estimatedCost);
        }

        if (itemId && itemType) {
          try {
            const updateData = {
              flash_status: "completed",
              flashed_at: new Date().toISOString()
            };

            if (itemType === "post") {
              await base44.entities.BlogPost.update(itemId, updateData);
            } else if (itemType === "webhook") {
              await base44.entities.WebhookReceived.update(itemId, updateData);
            }
          } catch (err) {
            console.error("Failed to update flash completion status:", err);
          }
        }

        toast.success(
          <div className="space-y-2">
            <div className="font-semibold">Workflow Completed!</div>
            {estimatedCost > 0 && (
              <div className="text-xs">Tokens used: {estimatedCost}</div>
            )}
            {result.seo && <div className="text-xs">✓ SEO metadata generated</div>}
            {result.schema && <div className="text-xs">✓ JSON-LD schema added</div>}
            <div className="text-xs">✓ HTML content updated</div>
          </div>,
          { duration: 5000 }
        );

        if (result.html) {
          onApply && onApply(result.html, result.seo || null, result.schema || null);
        }

        if (result.seo) {
          toast.info("Open SEO Settings to review and apply the generated SEO metadata", {
            duration: 6000
          });
        }

        handleClose();
      } else {
        throw new Error("Workflow did not return a success status");
      }
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg);

      if (itemId && itemType) {
        try {
          if (itemType === "post") {
            await base44.entities.BlogPost.update(itemId, { flash_status: "failed" });
          } else if (itemType === "webhook") {
            await base44.entities.WebhookReceived.update(itemId, { flash_status: "failed" });
          }
        } catch (updateErr) {
          console.error("Failed to update flash failure status:", updateErr);
        }
      }

      toast.error(`Workflow failed: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const resetAll = () => {
    setSelectedWorkflowId("");
    setRunId(null);
    setStatus(null);
    setRunning(false);
    setError("");
  };

  const handleClose = () => {
    resetAll();
    onClose && onClose();
  };

  const progressPercent = useMemo(() => {
    if (!status || !status.total_steps || status.total_steps <= 0) return 0;
    const idx = status.current_step_index ?? -1;
    const completed = status.status === "completed" ? status.total_steps : Math.max(0, idx + 1);
    return Math.min(100, Math.round((completed / status.total_steps) * 100));
  }, [status]);

  const renderSteps = () => {
    const steps = (selectedWorkflow?.workflow_steps || []).map(s => s.type);
    const currentIdx = status?.current_step_index ?? -1;

    return (
      <div className="space-y-2">
        {steps.length === 0 && (
          <div className="text-sm text-slate-500">No steps defined.</div>
        )}
        <AnimatePresence initial={false}>
          {steps.map((t, i) => {
            const state = status?.status === "failed"
              ? (i === currentIdx ? "failed" : i < currentIdx ? "done" : "pending")
              : i < currentIdx ? "done" : i === currentIdx ? "running" : "pending";

            return (
              <motion.div
                key={`${t}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 border ${
                  state === "running"
                    ? "border-indigo-300 bg-indigo-50/60"
                    : state === "done"
                    ? "border-emerald-200 bg-emerald-50/40"
                    : state === "failed"
                    ? "border-red-200 bg-red-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="relative">
                  {state === "done" && (
                    <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </motion.div>
                  )}
                  {state === "running" && (
                    <div className="relative">
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-500/80 animate-ping" />
                    </div>
                  )}
                  {state === "pending" && (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                  {state === "failed" && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>

                <span className={`text-sm ${
                  state === "running" ? "text-indigo-900 font-medium" : "text-slate-700"
                }`}>
                  {STEP_LABELS[t] || t}
                </span>

                {state === "running" && (
                  <motion.span
                    className="ml-auto text-[11px] text-indigo-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    working…
                  </motion.span>
                )}
                {state === "done" && (
                  <motion.span
                    className="ml-auto text-[11px] text-emerald-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    done
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  if (running || status?.status === "completed" || status?.status === "failed") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              {status?.status === "completed" ? "Workflow Complete!" : status?.status === "failed" ? "Workflow Failed" : "Running Workflow..."}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4 min-h-0">
            {status?.status !== "failed" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    {status?.progress_message || `Running step ${Math.max(1, (status?.current_step_index ?? 0) + 1)}/${status?.total_steps || 0}: ${status?.current_step_name || ""}`}
                  </div>
                  {estimatedCost > 0 && (
                    <div className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Estimated tokens: {estimatedCost}
                    </div>
                  )}
                </div>

                <div className="relative h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div className="absolute inset-0 pointer-events-none shimmer-mask" />
                </div>

                <motion.div
                  key={tipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-[12px] text-slate-500 mt-1 h-[18px] flex items-center justify-center"
                >
                  💡 {TIPS[tipIndex]}
                </motion.div>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-sm font-semibold text-slate-700 mb-3">Workflow Steps</div>
              {renderSteps()}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
          </div>

          {(status?.status === "completed" || status?.status === "failed") && (
            <div className="flex-shrink-0 flex gap-3 pt-4 border-t border-slate-200">
              {status?.status === "completed" && (
                <>
                  <Button
                    onClick={() => {
                      onApply && onApply(status.result_html || "", status.result?.seo_metadata, status.result?.schema);
                      handleClose();
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Apply to Editor
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </>
              )}

              {status?.status === "failed" && (
                <>
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Close
                  </Button>
                  <Button onClick={() => { resetAll(); }} className="flex-1">
                    Try Again
                  </Button>
                </>
              )}
            </div>
          )}

          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .shimmer-mask::before {
              content: "";
              position: absolute;
              inset: 0;
              background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.35) 50%, rgba(255,255,255,0) 100%);
              transform: translateX(-100%);
              animation: shimmer 1.6s infinite;
            }
          `}</style>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Flash Workflow</DialogTitle>
          <DialogDescription className="text-slate-600">
            Select a workflow to enhance your content with AI-powered tools
          </DialogDescription>
        </DialogHeader>

        {loadingWorkflows ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No workflows available
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => setSelectedWorkflowId(String(wf.id))}
                className={`text-left p-4 rounded-xl border-2 transition-all w-full ${
                  selectedWorkflowId === String(wf.id)
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <Crown className="w-4 h-4 text-amber-600" />
                        </div>
                        <h4 className="font-semibold text-slate-900">{wf.name}</h4>
                        {wf.is_default && (
                           <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                                Recommended
                            </Badge>
                        )}
                    </div>
                    {wf.description && (
                      <p className="text-sm text-slate-600 mb-3">{wf.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {(wf.workflow_steps || []).filter(s => s.enabled !== false).map((step, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs"
                        >
                          {STEP_LABELS[step.type] || step.type}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedWorkflowId === String(wf.id) && (
                    <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Fixed footer with action buttons */}
        {(workflows.length > 0) && (
          <div className="flex-shrink-0 flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={startRun}
              disabled={!selectedWorkflow || running}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 text-base font-semibold"
            >
              {running ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Workflow
                  {estimatedCost > 0 && (
                    <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {estimatedCost} tokens
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} className="px-6">
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
