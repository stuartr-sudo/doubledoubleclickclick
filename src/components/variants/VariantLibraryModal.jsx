import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { CallToAction } from "@/api/entities";
import { PromotedProduct } from "@/api/entities";
import { Testimonial } from "@/api/entities";
import { ContentVariant } from "@/api/entities";
import { Search, Palette, Library, Sparkles, PlusCircle } from "lucide-react";
import { renderByType, styleCatalog } from "./renderers";

export default function VariantLibraryModal({ isOpen, onClose, onInsert }) {
  const [me, setMe] = useState(null);
  const [usernames, setUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("all");

  // Library filters
  const [libType, setLibType] = useState("cta");
  const [asinFilter, setAsinFilter] = useState("");
  const [q, setQ] = useState("");
  const [variants, setVariants] = useState([]);
  const [loadingLib, setLoadingLib] = useState(false);

  // Generate tab
  const [genType, setGenType] = useState("cta");
  const [baseItems, setBaseItems] = useState([]);
  const [baseId, setBaseId] = useState("");
  const [styles, setStyles] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState({});
  const [loadingBase, setLoadingBase] = useState(false);
  const catalog = styleCatalog();

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const meResp = await User.me().catch(() => null);
      setMe(meResp);
      const all = await Username.list("-created_date").catch(() => []);
      const active = (all || []).filter(u => u.is_active !== false).map(u => u.user_name);
      let list = [];
      if (meResp && (meResp.role === "admin" || meResp.access_level === "full")) {
        list = active;
      } else {
        const assigned = meResp && Array.isArray(meResp.assigned_usernames) ? meResp.assigned_usernames : [];
        const set = new Set(active);
        list = assigned.filter(n => set.has(n));
      }
      list = Array.from(new Set(list)).sort();
      setUsernames(list);
      setSelectedUsername(list.length ? list[0] : "all");
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setStyles(catalog[genType] || []);
    setSelectedStyles({});
    setBaseId("");
    loadBaseItems(genType);
  }, [isOpen, genType]);

  const loadBaseItems = async (type) => {
    setLoadingBase(true);
    try {
      let items = [];
      if (type === "cta") {
        items = await CallToAction.list("-created_date", 200);
      } else if (type === "product") {
        items = await PromotedProduct.list("-created_date", 200);
      } else {
        // testimonials
        items = await Testimonial.list("-created_date", 200);
      }
      // Filter to assigned usernames if not admin/full
      if (!(me && (me.role === "admin" || me.access_level === "full"))) {
        const allow = new Set(me && Array.isArray(me.assigned_usernames) ? me.assigned_usernames : []);
        items = items.filter(it => it.user_name && allow.has(it.user_name));
      }
      setBaseItems(items);
    } catch {
      setBaseItems([]);
    }
    setLoadingBase(false);
  };

  const loadVariants = async () => {
    setLoadingLib(true);
    try {
      let filter = { type: libType };
      if (selectedUsername !== "all") filter.user_name = selectedUsername;
      if (libType === "testimonial" && asinFilter.trim()) {
        filter.asin = asinFilter.trim();
      }
      let list = await ContentVariant.filter(filter, "-created_date", 200);
      if (q.trim()) {
        const s = q.trim().toLowerCase();
        list = list.filter(v =>
          (v.title || "").toLowerCase().includes(s) ||
          (v.style_key || "").toLowerCase().includes(s)
        );
      }
      setVariants(list || []);
    } catch {
      setVariants([]);
    }
    setLoadingLib(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, libType, selectedUsername]);

  const toggleStyle = (key, checked) => {
    setSelectedStyles(prev => {
      const nxt = { ...(prev || {}) };
      if (checked) nxt[key] = true; else delete nxt[key];
      return nxt;
    });
  };

  const handleGenerate = async () => {
    if (!baseId) return;
    const base = (baseItems || []).find(i => String(i.id) === String(baseId));
    if (!base) return;
    const chosen = Object.keys(selectedStyles || {});
    if (!chosen.length) return;

    const records = chosen.map(key => {
      const html = renderByType(genType, key, base);
      const title = `${genType.toUpperCase()} • ${key}`;
      return {
        type: genType,
        style_key: key,
        title,
        html,
        user_name: base.user_name || (selectedUsername !== "all" ? selectedUsername : undefined),
        asin: genType === "testimonial" ? (base.asin || "") : undefined,
        source_entity: genType === "cta" ? "CallToAction" : (genType === "product" ? "PromotedProduct" : "Testimonial"),
        source_id: base.id
      };
    });

    // Clean undefined keys
    const cleaned = records.map(r => {
      const c = {};
      Object.keys(r).forEach(k => {
        if (typeof r[k] !== "undefined" && r[k] !== null) c[k] = r[k];
      });
      return c;
    });

    await ContentVariant.bulkCreate(cleaned);
    await loadVariants();
  };

  const filteredVariants = useMemo(() => {
    let arr = variants;
    if (libType === "testimonial" && asinFilter.trim()) {
      arr = arr.filter(v => (v.asin || "").toLowerCase() === asinFilter.trim().toLowerCase());
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter(v =>
        (v.title || "").toLowerCase().includes(s) ||
        (v.style_key || "").toLowerCase().includes(s)
      );
    }
    return arr;
  }, [variants, libType, asinFilter, q]);

  const handleInsert = (v) => {
    onInsert(String(v.html || ""));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] max-w-5xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            Styled Blocks (Variants)
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="w-4 h-4" /> Library
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={libType} onValueChange={setLibType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cta">CTA</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="testimonial">Testimonial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Username</Label>
                <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {usernames.map(u => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              {libType === "testimonial" && (
                <div>
                  <Label>ASIN</Label>
                  <Input placeholder="e.g. B07ZPKN6YR" value={asinFilter} onChange={(e) => setAsinFilter(e.target.value)} />
                </div>
              )}
              <div className="md:col-span-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input className="pl-9" placeholder="Search title or style..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingLib ? (
                <div className="text-center py-8 text-gray-500 md:col-span-2">Loading...</div>
              ) : filteredVariants.length === 0 ? (
                <div className="text-center py-8 text-gray-500 md:col-span-2">No variants found.</div>
              ) : (
                filteredVariants.map((v) => (
                  <div key={v.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500">{v.type.toUpperCase()} • {v.style_key}</div>
                      <Button size="sm" onClick={() => handleInsert(v)}>Insert</Button>
                    </div>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: v.html }} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={genType} onValueChange={setGenType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cta">CTA</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="testimonial">Testimonial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Select Source</Label>
                <Select value={baseId} onValueChange={setBaseId}>
                  <SelectTrigger><SelectValue placeholder={loadingBase ? "Loading..." : "Choose item"} /></SelectTrigger>
                  <SelectContent className="max-h-80 overflow-auto">
                    {(baseItems || []).map((it) => (
                      <SelectItem key={it.id} value={String(it.id)}>
                        {genType === "cta" ? (it.headline || it.name || `CTA ${it.id}`) :
                         genType === "product" ? (it.name || `Product ${it.id}`) :
                         (it.review_title || `Testimonial ${it.id}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Choose Styles</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {(styles || []).map(s => (
                  <label key={s.key} className="border rounded-md p-3 flex items-center gap-2">
                    <Checkbox checked={!!selectedStyles[s.key]} onCheckedChange={(v) => toggleStyle(s.key, Boolean(v))} />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGenerate} disabled={!baseId || Object.keys(selectedStyles).length === 0} className="gap-2">
                <PlusCircle className="w-4 h-4" /> Generate & Save
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}