
import React, { useState, useEffect } from "react";
import { CallToAction } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, Share2, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { renderCta } from "@/components/variants/renderers";

export default function CtaManager() {
  const [ctas, setCtas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCta, setEditingCta] = useState(null);
  const [assignmentUsernames, setAssignmentUsernames] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    subtext: "",
    button_text: "Click Here", // Updated default
    button_url: "#", // Updated default
    user_name: "",
    template_key: "cta-solid-glow",
    variant_name: "",
    cta_styles: {
      background_color: "",
      text_color: "",
      button_color: "",
      button_text_color: "",
      padding: "",
      layout: ""
    },
    font_settings: {
      headline_font: "",
      headline_size: 0,
      subtext_font: "",
      subtext_size: 0,
      button_font: "",
      button_size: 0
    },
    border_settings: {
      radius: 0,
      width: 0,
      color: ""
    },
    shadow_settings: {
      enabled: false,
      intensity: ""
    }
  });

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Regular user can only assign to their own assigned usernames
        const userUsernames = user.assigned_usernames || [];
        setAssignmentUsernames(userUsernames);
        if (userUsernames.length > 0) {
          setFormData((prev) => ({ ...prev, user_name: userUsernames[0] }));
        }

        await loadCtas(user);
      } catch (error) {
        toast.error("You must be logged in to manage CTAs.");
      }
      setIsLoading(false);
    };
    initialize();
  }, []);

  const loadCtas = async (user) => {
    try {
      const allCtas = await CallToAction.list("-created_date");
      const assigned = user?.assigned_usernames || [];

      if (assigned.length > 0) {
        const userCtas = allCtas.filter((cta) =>
          cta.user_name && assigned.includes(cta.user_name)
        );
        setCtas(userCtas);
      } else {
        setCtas([]);
      }
    } catch (error) {
      toast.error("Failed to load CTAs.");
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleNestedChange = (path, value) => {
    setFormData((prev) => {
      const next = { ...prev };
      const parts = path.split(".");
      let ref = next;
      for (let i = 0; i < parts.length - 1; i++) {
        ref[parts[i]] = ref[parts[i]] || {};
        ref = ref[parts[i]];
      }
      ref[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      headline: "",
      subtext: "",
      button_text: "Click Here", // Updated default
      button_url: "#", // Updated default
      user_name: assignmentUsernames[0] || "", // Use assignmentUsernames for default
      template_key: "cta-solid-glow",
      variant_name: "",
      cta_styles: {
        background_color: "",
        text_color: "",
        button_color: "",
        button_text_color: "",
        padding: "",
        layout: ""
      },
      font_settings: {
        headline_font: "",
        headline_size: 0,
        subtext_font: "",
        subtext_size: 0,
        button_font: "",
        button_size: 0
      },
      border_settings: {
        radius: 0,
        width: 0,
        color: ""
      },
      shadow_settings: {
        enabled: false,
        intensity: ""
      }
    });
    setEditingCta(null);
  };

  const handleOpenDialog = (cta = null) => {
    if (cta) {
      setEditingCta(cta);
      setFormData({
        name: cta.name,
        headline: cta.headline,
        subtext: cta.subtext || "",
        button_text: cta.button_text || "Click Here", // Ensure default if existing CTA lacks it
        button_url: cta.button_url || "#", // Ensure default if existing CTA lacks it
        user_name: cta.user_name,
        template_key: cta.template_key || "cta-solid-glow",
        variant_name: cta.variant_name || "",
        cta_styles: {
          background_color: cta.cta_styles?.background_color || "",
          text_color: cta.cta_styles?.text_color || "",
          button_color: cta.cta_styles?.button_color || "",
          button_text_color: cta.cta_styles?.button_text_color || "",
          padding: cta.cta_styles?.padding || "",
          layout: cta.cta_styles?.layout || ""
        },
        font_settings: {
          headline_font: cta.font_settings?.headline_font || "",
          headline_size: cta.font_settings?.headline_size || 0,
          subtext_font: cta.font_settings?.subtext_font || "",
          subtext_size: cta.font_settings?.subtext_size || 0,
          button_font: cta.font_settings?.button_font || "",
          button_size: cta.font_settings?.button_size || 0
        },
        border_settings: {
          radius: cta.border_settings?.radius || 0,
          width: cta.border_settings?.width || 0,
          color: cta.border_settings?.color || ""
        },
        shadow_settings: {
          enabled: !!cta.shadow_settings?.enabled,
          intensity: cta.shadow_settings?.intensity || ""
        }
      });
    } else {
      resetFormData();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetFormData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_name) {
      toast.error("Please assign a username.");
      return;
    }

    try {
      if (editingCta) {
        await CallToAction.update(editingCta.id, formData);
        toast.success("CTA updated successfully!");
      } else {
        await CallToAction.create(formData);
        toast.success("CTA created successfully!");
      }
      await loadCtas(currentUser);
      handleCloseDialog();
    } catch (error) {
      toast.error(`Failed to ${editingCta ? 'update' : 'create'} CTA.`);
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this CTA?")) {
      try {
        await CallToAction.delete(id);
        toast.success("CTA deleted successfully!");
        await loadCtas(currentUser);
      } catch (error) {
        toast.error("Failed to delete CTA.");
        console.error(error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>);
  }

  // Generate live preview HTML
  const livePreviewHtml = renderCta(formData.template_key, formData);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50 text-slate-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Share2 className="w-6 h-6 text-blue-600" /> Call to Action Manager
        </h1>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add New CTA
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-[1.1fr_1.6fr_1fr_2.2fr_1fr_1.2fr] p-4 font-semibold text-slate-700 border-b border-slate-200">
          <div>Name</div>
          <div>Headline</div>
          <div>Button Text</div>
          <div>Preview</div>
          <div>Username</div>
          <div>Actions</div>
        </div>
        {ctas.length > 0 ? (
          ctas.map((cta) => (
            <div
              key={cta.id}
              className="grid grid-cols-[1.1fr_1.6fr_1fr_2.2fr_1fr_1.2fr] p-4 items-center text-slate-800 border-b border-slate-200 last:border-b-0"
            >
              <div className="font-medium text-slate-900">{cta.name}</div>
              <div className="truncate pr-4">{cta.headline}</div>
              <div className="truncate">{cta.button_text}</div>

              {/* NEW: per-row scaled preview (non-interactive) */}
              <div className="py-2">
                <div
                  className="overflow-hidden rounded-md border border-slate-100 bg-white"
                  style={{ maxWidth: 280, maxHeight: 120 }}
                >
                  <div
                    className="scale-[0.6] origin-top-left"
                    dangerouslySetInnerHTML={{ __html: renderCta(cta.template_key, cta) }}
                    // The CTA HTML is self-contained with its own styles
                  />
                </div>
              </div>

              <div className="truncate">{cta.user_name}</div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(cta)}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(cta.id)}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-slate-500">No CTAs found. Add one to get started!</p>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-5xl w-[min(96vw,1200px)] max-h-[92vh] flex flex-col shadow-xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingCta ? "Edit" : "Create"} Call to Action</DialogTitle>
          </DialogHeader>

          {/* EDIT: Stack vertically and add headroom to prevent focus ring clipping */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 pt-3">
            {/* Form Fields (now full width and stacked) */}
            <form onSubmit={handleSubmit} className="w-full min-w-0 flex-1 flex flex-col space-y-4 overflow-visible">
              <div>
                <Label htmlFor="name">CTA Name (Internal)</Label>
                <Input id="name" value={formData.name} onChange={handleInputChange} required className="bg-white border-slate-300 text-slate-900" />
              </div>
              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input id="headline" value={formData.headline} onChange={handleInputChange} required className="bg-white border-slate-300 text-slate-900" />
              </div>
              <div>
                <Label htmlFor="subtext">Subtext</Label>
                <Textarea id="subtext" value={formData.subtext} onChange={handleInputChange} className="bg-white border-slate-300 text-slate-900" />
              </div>
              <div>
                <Label htmlFor="button_text">Button Text</Label>
                <Input id="button_text" value={formData.button_text} onChange={handleInputChange} required className="bg-white border-slate-300 text-slate-900" />
              </div>
              <div>
                <Label htmlFor="button_url">Button URL</Label>
                <Input id="button_url" type="url" value={formData.button_url} onChange={handleInputChange} required className="bg-white border-slate-300 text-slate-900" />
              </div>

              <div>
                <Label htmlFor="template_key">Template Style</Label>
                <Select value={formData.template_key} onValueChange={(v) => handleSelectChange('template_key', v)}>
                  <SelectTrigger id="template_key" className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border border-slate-200">
                    <SelectItem value="cta-solid-glow">CTA • Solid Glow</SelectItem>
                    <SelectItem value="cta-neon-outline">CTA • Neon Outline</SelectItem>
                    <SelectItem value="cta-double-neon">CTA • Double Neon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="variant_name">Variant Name (optional)</Label>
                <Input id="variant_name" value={formData.variant_name} onChange={handleInputChange} className="bg-white border-slate-300 text-slate-900" placeholder="e.g., A / B / Hero-Alt" />
              </div>

              <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="font-semibold mb-1 text-slate-900">Design Overrides</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Background Color</Label>
                    <Input type="color" value={formData.cta_styles.background_color || "#000000"} onChange={(e) => handleNestedChange("cta_styles.background_color", e.target.value)} className="bg-white border-slate-300 h-10" />
                  </div>
                  <div>
                    <Label>Text Color</Label>
                    <Input type="color" value={formData.cta_styles.text_color || "#ffffff"} onChange={(e) => handleNestedChange("cta_styles.text_color", e.target.value)} className="bg-white border-slate-300 h-10" />
                  </div>
                  <div>
                    <Label>Button Color</Label>
                    <Input type="color" value={formData.cta_styles.button_color || "#ffffff"} onChange={(e) => handleNestedChange("cta_styles.button_color", e.target.value)} className="bg-white border-slate-300 h-10" />
                  </div>
                  <div>
                    <Label>Button Text Color</Label>
                    <Input type="color" value={formData.cta_styles.button_text_color || "#000000"} onChange={(e) => handleNestedChange("cta_styles.button_text_color", e.target.value)} className="bg-white border-slate-300 h-10" />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="user_name">Assign to Username</Label>
                <Select onValueChange={(value) => handleSelectChange('user_name', value)} value={formData.user_name}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900"><SelectValue placeholder="Select a username" /></SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border border-slate-200">
                    {assignmentUsernames.map((name) =>
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-slate-700 hover:bg-slate-100">Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {editingCta ? "Update CTA" : "Create CTA"}
                </Button>
              </div>
            </form>

            {/* Live Preview (now full width, stacked below) */}
            <div className="w-full min-w-0 flex flex-col bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 flex-shrink-0">
                <Eye className="w-5 h-5 text-cyan-600" />
                Live Preview
              </h3>
              <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                <div dangerouslySetInnerHTML={{ __html: renderCta(formData.template_key, formData) }} />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-slate-700 hover:bg-slate-100">Cancel</Button>
            {/* The form submission logic is now handled by requestSubmit on the form element */}
            <Button type="button" onClick={(e) => { e.preventDefault(); document.querySelector('form').requestSubmit(); }} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editingCta ? "Update CTA" : "Create CTA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
