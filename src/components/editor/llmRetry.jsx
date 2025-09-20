
import { llmRouter } from "@/api/functions";
import { InvokeLLM } from "@/api/integrations";
import { User } from "@/api/entities"; // NEW: to detect auth once

// Tiny util
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Extract a best-effort string from various function response shapes
function extractText(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  // Common fields returned by router/provider wrappers
  return (
    data.text ||
    data.content ||
    data.output ||
    data.result ||
    (Array.isArray(data.choices) && data.choices[0]?.message?.content) ||
    JSON.stringify(data)
  );
}

// Auth memoization (avoid calling User.me() for every chunk)
let authChecked = false; // NEW
let isAuthenticated = true; // NEW (assume true until proven otherwise)

// NEW: last-resort fallback when router keeps returning 429
async function fallbackInvokeWithRetry(prompt, addInternet = false, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await InvokeLLM({
        prompt,
        add_context_from_internet: !!addInternet
      });
      return extractText(res);
    } catch (e) {
      lastErr = e;
      const jitter = Math.floor(Math.random() * 250);
      await sleep(800 * Math.pow(1.6, i) + jitter);
    }
  }
  throw lastErr || new Error("Fallback LLM failed after retries");
}

/**
 * callLlmWithRetry
 * - opts: { prompt: string, add_context_from_internet?: boolean, model_id?: string }
 * - retryOpts: { maxAttempts?: number, baseDelayMs?: number, onRetry?: ({attempt, delay, error}) => void, model?: string }
 * Returns: string (LLM text)
 */
export async function callLlmWithRetry(
  opts,
  retryOpts = {}
) {
  const {
    maxAttempts = 4,
    baseDelayMs = 1200,
    onRetry = () => {},
    model // optional override
  } = retryOpts;

  // NEW: One-time auth check to avoid hitting llmRouter when not logged in
  if (!authChecked) {
    try {
      const me = await User.me();
      isAuthenticated = !!me;
    } catch {
      isAuthenticated = false;
    } finally {
      authChecked = true;
    }
  }

  // If not authenticated, use Core InvokeLLM path immediately
  if (!isAuthenticated) {
    return await fallbackInvokeWithRetry(opts.prompt, !!opts.add_context_from_internet, 3);
  }

  let attempt = 0;
  let lastErr = null;
  let lastStatus = null;

  while (attempt < maxAttempts) {
    try {
      // Prefer our authenticated router
      const resp = await llmRouter({
        prompt: opts.prompt,
        add_context_from_internet: !!opts.add_context_from_internet,
        model_id: model || opts.model_id || "auto",
        stream: false
      });

      // Body-level unauthorized guard (some deployments return 200 with {error: "Unauthorized"})
      const body = resp?.data;
      const bodyError = typeof body?.error === "string" ? body.error : "";
      const unauthorizedByBody = /unauthor/i.test(bodyError);

      if (unauthorizedByBody) {
        const fallback = await InvokeLLM({
          prompt: opts.prompt,
          add_context_from_internet: !!opts.add_context_from_internet
        });
        return extractText(fallback);
      }

      return extractText(body);
    } catch (e) {
      lastErr = e;
      lastStatus = e?.response?.status;
      const serverMsg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "";

      const isRateLimited = lastStatus === 429 || /rate limit/i.test(serverMsg);
      const isUnauthorized =
        lastStatus === 401 ||
        lastStatus === 403 ||
        /unauthor/i.test(serverMsg);

      // Unauthorized -> immediate fallback to Core
      if (isUnauthorized) {
        try {
          const fallback = await InvokeLLM({
            prompt: opts.prompt,
            add_context_from_internet: !!opts.add_context_from_internet
          });
          return extractText(fallback);
        } catch {
          throw new Error("Unauthorized. Please make sure you are logged in, then try again.");
        }
      }

      // Retry on 429 or 5xx/unknown network issues
      if (isRateLimited || (!lastStatus || lastStatus >= 500)) {
        attempt += 1;
        const delay = Math.round(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 300);
        onRetry({ attempt, delay, error: e });
        await sleep(delay);
        continue;
      }

      // Other non-retryable errors
      throw e;
    }
  }

  // If we exhausted retries on rate limits/5xx, try Core InvokeLLM as last resort
  const rateLimited =
    lastStatus === 429 ||
    /rate limit/i.test(lastErr?.response?.data?.error || lastErr?.message || "");
  if (rateLimited) {
    return await fallbackInvokeWithRetry(opts.prompt, !!opts.add_context_from_internet, 3);
  }

  // Exhausted attempts
  const msg =
    lastErr?.response?.data?.error ||
    lastErr?.message ||
    "LLM call failed after multiple attempts";
  throw new Error(msg);
}
