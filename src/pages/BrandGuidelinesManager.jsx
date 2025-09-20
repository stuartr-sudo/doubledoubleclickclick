
import React, { useEffect, useState } from "react";
import { BrandGuidelines } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Trash2, Edit3, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { InvokeLLM } from "@/api/integrations";
import { extractWebsiteContent } from "@/api/functions";

export default function BrandGuidelinesManager() {
  const [items, setItems] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [filterUserName, setFilterUserName] = useState("all");
  const [form, setForm] = useState({
    id: null,
    user_name: "",
    name: "",
    voice_and_tone: "",
    content_style_rules: "",
    prohibited_elements: "",
    preferred_elements: "",
    ai_instructions_override: "",
    target_market: "" // Added target_market to form state
  });
  const [loading, setLoading] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const u = await User.me().catch(() => null);
    let unameList = await Username.list("-updated_date", 100).catch(() => []);
    // Optional: limit to assigned_usernames for non-admins
    if (u && u.role !== "admin" && Array.isArray(u.assigned_usernames) && u.assigned_usernames.length) {
      unameList = unameList.filter(x => u.assigned_usernames.includes(x.user_name));
    }
    setUsernames(unameList);

    // NEW: preselect username if none chosen yet
    setForm((f) => ({
      ...f,
      user_name: f.user_name || (unameList[0]?.user_name || "")
    }));

    let data = await BrandGuidelines.list("-updated_date", 200).catch(() => []);
    if (u && u.role !== "admin" && Array.isArray(u.assigned_usernames) && u.assigned_usernames.length) {
      data = data.filter(x => u.assigned_usernames.includes(x.user_name));
    }
    setItems(data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      id: null,
      user_name: "",
      name: "",
      voice_and_tone: "",
      content_style_rules: "",
      prohibited_elements: "",
      preferred_elements: "",
      ai_instructions_override: "",
      target_market: "" // Reset target_market
    });
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      user_name: item.user_name || "",
      name: item.name || "",
      voice_and_tone: item.voice_and_tone || "",
      content_style_rules: item.content_style_rules || "",
      prohibited_elements: item.prohibited_elements || "",
      preferred_elements: item.preferred_elements || "",
      ai_instructions_override: item.ai_instructions_override || "",
      target_market: item.target_market || "" // Populate target_market
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete guidelines "${item.name}" for ${item.user_name}?`)) return;
    await BrandGuidelines.delete(item.id);
    toast.success("Deleted");
    loadAll();
  };

  const handleSave = async () => {
    // NEW: robust required validation with trimming
    const userNameTrim = (form.user_name || "").trim();
    const nameTrim = (form.name || "").trim();
    const voiceTrim = (form.voice_and_tone || "").trim();

    if (!userNameTrim || !nameTrim || !voiceTrim) {
      toast.error("Username, Guideline Name, and Voice & Tone are required");
      return;
    }

    const payload = { 
      ...form, 
      user_name: userNameTrim, 
      name: nameTrim, 
      voice_and_tone: voiceTrim 
    };

    if (payload.id) {
      await BrandGuidelines.update(payload.id, payload);
      toast.success("Updated");
    } else {
      await BrandGuidelines.create(payload);
      toast.success("Created");
    }
    resetForm();
    loadAll();
  };

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl || !/^https?:\/\//i.test(websiteUrl)) {
      toast.error("Please enter a valid URL (including http/https).");
      return;
    }
    setAnalyzing(true);
    try {
      // 1) Fetch and extract text from website (server-side)
      const { data: extracted } = await extractWebsiteContent({ url: websiteUrl });
      if (!extracted?.success) {
        toast.error(extracted?.error || "Failed to fetch website content");
        setAnalyzing(false);
        return;
      }

      // 2) Ask LLM to analyze voice/tone/target market (+ optional rules)
      const longText = extracted.text || "";
      const prompt = [
        "You are a brand analyst. Read the following website content and extract concise, actionable brand guidance.",
        "",
        "Language requirement:",
        "- Detect the dominant language of the content and RESPOND ENTIRELY in that same language.",
        "- Do NOT translate to any other language. If the site is English, respond in English; otherwise respond in the site's language.",
        "",
        "Return JSON with the following fields:",
        "- voice_and_tone: 5-10 sentences describing voice and tone with examples of phrasing.",
        "- target_market: 1-3 sentences describing the primary audience (demographics, roles, regions if evident).",
        "- content_style_rules: 6-12 bullet-style rules as a single string (e.g., '• Use short sentences...').",
        "- prohibited_elements: a short list of words/phrases/patterns to avoid.",
        "- preferred_elements: a short list of words/phrases/patterns to encourage.",
        "",
        "Be specific and grounded in the content. If a field is unclear, make a best-effort reasonable inference.",
        "",
        "CONTENT START",
        longText,
        "CONTENT END"
      ].join("\n"); // Corrected to use "\n" for newline

      const schema = {
        type: "object",
        properties: {
          voice_and_tone: { type: "string" },
          target_market: { type: "string" },
          content_style_rules: { type: "string" },
          prohibited_elements: { type: "array", items: { type: "string" } },
          preferred_elements: { type: "array", items: { type: "string" } }
        }
      };

      const ai = await InvokeLLM({
        prompt,
        response_json_schema: schema
      });

      const out = ai || {};
      const prohibitedCsv = Array.isArray(out.prohibited_elements) ? out.prohibited_elements.join(", ") : (out.prohibited_elements || "");
      const preferredCsv = Array.isArray(out.preferred_elements) ? out.preferred_elements.join(", ") : (out.preferred_elements || "");

      // NEW: auto-suggest a Guideline Name from the site host if empty
      let suggestedName = "";
      try {
        const host = new URL(websiteUrl).hostname.replace(/^www\./, "");
        suggestedName = `${host} • Core Voice`;
      } catch (_) {}

      // NEW: ensure a username is selected if none (use first available)
      const defaultUserName = form.user_name?.trim() ? form.user_name : (usernames[0]?.user_name || "");

      setForm((f) => ({
        ...f,
        user_name: defaultUserName,
        name: f.name?.trim() ? f.name : suggestedName,
        voice_and_tone: out.voice_and_tone || f.voice_and_tone,
        content_style_rules: out.content_style_rules || f.content_style_rules,
        prohibited_elements: prohibitedCsv || f.prohibited_elements,
        preferred_elements: preferredCsv || f.preferred_elements,
        // NEW: populate target market
        // if the Username entity already has target_market, user can override per-guideline here
        target_market: out.target_market || f.target_market
      }));

      toast.success("Analysis complete. Fields populated — review and adjust as needed.");
    } catch (e) {
      toast.error("Analysis failed. Try another URL or adjust later.");
    } finally {
      setAnalyzing(false);
    }
  };

  const filtered = items.filter(i => filterUserName === "all" || i.user_name === filterUserName);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h1 className="text-2xl font-bold mb-1 text-slate-900">Brand Guidelines</h1>
          <p className="text-slate-600 mb-4">Create voice and tone rules per username. These power the “Brand It” feature.</p>

          {/* Website analyzer */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="text-sm text-slate-700">Website URL</label>
                <div className="relative mt-1">
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="bg-white border-slate-300 text-slate-900 pl-9"
                  />
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAnalyzeWebsite}
                  disabled={analyzing || !websiteUrl}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">We’ll fetch the site, analyze its content with AI, and fill in Voice & Tone, Style Rules, and Target Market automatically.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700">Username</label>
              <Select value={form.user_name} onValueChange={(v) => setForm(f => ({ ...f, user_name: v }))}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900 mt-1">
                  <SelectValue placeholder="Select username" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {usernames.map(u => (
                    <SelectItem key={u.id} value={u.user_name}>{u.user_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-700">Guideline Name</label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1" placeholder="e.g., Core Voice" />
            </div>

            {/* NEW: Target market */}
            <div className="md:col-span-2">
              <label className="text-sm text-slate-700">Target Market</label>
              <Input
                value={form.target_market || ""}
                onChange={(e) => setForm(f => ({ ...f, target_market: e.target.value }))}
                className="bg-white border-slate-300 text-slate-900 mt-1"
                placeholder="e.g., SMB marketers in North America"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-slate-700">Voice & Tone</label>
              <Textarea value={form.voice_and_tone} onChange={(e) => setForm(f => ({ ...f, voice_and_tone: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1 min-h-[80px]" placeholder="Describe the voice and tone in detail..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-700">Content Style Rules</label>
              <Textarea value={form.content_style_rules} onChange={(e) => setForm(f => ({ ...f, content_style_rules: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1 min-h-[80px]" placeholder="Active voice, sentence length, headings conventions..." />
            </div>
            <div>
              <label className="text-sm text-slate-700">Prohibited (comma-separated)</label>
              <Input value={form.prohibited_elements} onChange={(e) => setForm(f => ({ ...f, prohibited_elements: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1" placeholder="e.g., synergy, deep dive" />
            </div>
            <div>
              <label className="text-sm text-slate-700">Preferred (comma-separated)</label>
              <Input value={form.preferred_elements} onChange={(e) => setForm(f => ({ ...f, preferred_elements: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1" placeholder="e.g., practical, clear" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-700">AI Instructions Override (optional)</label>
              <Textarea value={form.ai_instructions_override} onChange={(e) => setForm(f => ({ ...f, ai_instructions_override: e.target.value }))} className="bg-white border-slate-300 text-slate-900 mt-1 min-h-[60px]" placeholder="Extra directives to the AI for this brand" />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Save className="w-4 h-4 mr-2" /> {form.id ? "Update" : "Create"}
            </Button>
            <Button onClick={resetForm} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
              <Edit3 className="w-4 h-4 mr-2" /> Reset
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Saved Guidelines</h2>
            <div className="flex items-center gap-2">
              <Select value={filterUserName} onValueChange={setFilterUserName}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900 w-[200px]">
                  <SelectValue placeholder="Filter by username" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="all">All usernames</SelectItem>
                  {usernames.map(u => (
                    <SelectItem key={u.id} value={u.user_name}>{u.user_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={loadAll} variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                Refresh
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="text-slate-600">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-slate-500">No guidelines yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map(item => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-wide text-slate-500">{item.user_name}</div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => handleEdit(item)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-200" onClick={() => handleDelete(item)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-slate-600 mt-2 text-sm line-clamp-3">{item.voice_and_tone}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
