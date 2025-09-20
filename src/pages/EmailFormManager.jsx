
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { EmailCaptureForm } from "@/api/entities";
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
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, Mail, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, Copy, CheckCircle2 } from "lucide-react";
import { captureEmail } from "@/api/functions";
import { Switch } from "@/components/ui/switch";

function EmailFormLivePreview({ template, values, onSubmit, fullWidth = false, onToggleFullWidth }) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const btnText = values.button_text?.trim() || "Subscribe";

  // NEW: derive styles with safe fallbacks
  const s = values.styles || {};
  const c = s.container || {};
  const i = s.input || {};
  const b = s.button || {};
  const gap = (s.layout && s.layout.gap) || "8px";

  const containerStyle = {
    background: c.background_color || "white",
    border: `${(c.border_width ?? 1)}px solid ${c.border_color || "#e5e7eb"}`,
    borderRadius: (c.border_radius ?? 12) + "px",
    padding: c.padding || "16px 18px",
    boxShadow: c.shadow ? "0 4px 16px rgba(0,0,0,0.08)" : "none"
  };

  const inputStyle = {
    background: i.background_color || "white",
    color: i.text_color || "#0f172a",
    border: `1px solid ${i.border_color || "#e5e7eb"}`,
    borderRadius: (i.border_radius ?? 8) + "px",
    padding: i.padding || "10px 12px"
  };

  const buttonStyle = {
    background: b.background_color || "#2563eb",
    color: b.text_color || "white",
    border: "none",
    borderRadius: (b.border_radius ?? 10) + "px",
    padding: b.padding || "10px 16px"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ email, name });
      setEmail("");
      setName("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-slate-900 font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" /> Live Preview
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Full width</span>
            <Switch checked={fullWidth} onCheckedChange={onToggleFullWidth} />
          </div>
        </div>

        <div className={`overflow-hidden max-w-full ${fullWidth ? "w-full" : "max-w-[460px] mx-auto"}`} style={containerStyle}>
          {values.headline && (
            <h3 className="text-lg font-semibold text-slate-900 break-words">{values.headline}</h3>
          )}
          {values.subtext && (
            <p className="text-slate-600 mt-1 break-words">{values.subtext}</p>
          )}
          <form
            onSubmit={handleSubmit}
            className="mt-3 flex flex-row flex-wrap items-stretch"
            style={{ gap }}
          >
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="basis-0 flex-1 min-w-[120px] w-full"
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="basis-0 flex-1 min-w-[140px] w-full"
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex-none whitespace-nowrap inline-flex items-center justify-center disabled:opacity-60"
              style={buttonStyle}
            >
              {btnText}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-2 break-words">
            Submits to your app and records under username “{values.user_name || '—'}”.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmailFormManager() {
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [assignmentUsernames, setAssignmentUsernames] = useState([]);
  const [apiError, setApiError] = useState(null); // NEW: Track API errors
  // Initialize styles defaults if missing when opening/creating
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    subtext: "",
    button_text: "",
    user_name: "",
    styles: {
      container: {
        background_color: "#ffffff",
        border_color: "#e5e7eb",
        border_width: 1,
        border_radius: 12,
        padding: "16px 18px",
        shadow: false
      },
      input: {
        background_color: "#ffffff",
        text_color: "#0f172a",
        border_color: "#e5e7eb",
        border_radius: 8,
        padding: "10px 12px"
      },
      button: {
        background_color: "#2563eb",
        text_color: "#ffffff",
        border_radius: 10,
        padding: "10px 16px"
      },
      layout: {
        full_width_default: false,
        gap: "8px"
      }
    }
  });
  const [previewFullWidth, setPreviewFullWidth] = React.useState(false);

  // Memoized function to prevent unnecessary re-renders
  const loadForms = useCallback(async (user) => {
    if (!user) return; // Ensure user is defined before proceeding

    try {
      setApiError(null); // Clear previous errors
      const allForms = await EmailCaptureForm.list("-created_date");
      const assigned = user?.assigned_usernames || [];

      if (assigned.length > 0) {
        const userForms = allForms.filter(form =>
          form.user_name && assigned.includes(form.user_name)
        );
        setForms(userForms);
      } else {
        setForms([]);
      }
    } catch (error) {
      console.error("Failed to load email forms:", error);
      if (error?.response?.status === 429) {
        setApiError("Rate limit reached. Please wait a moment and try again.");
        // Retry after a delay
        setTimeout(() => {
          if (user) loadForms(user); // Use the passed user for retry
        }, 5000);
      } else {
        setApiError("Failed to load forms. Please try again.");
      }
    }
  }, []); // Dependencies: setApiError (stable), EmailCaptureForm methods (stable). User is passed as arg.

  // Optimize initialization to reduce simultaneous API calls
  const initializeData = useCallback(async () => {
    setIsLoading(true);
    try {
      setApiError(null);
      const user = await User.me();
      setCurrentUser(user);

      const userUsernames = user.assigned_usernames || [];
      setAssignmentUsernames(userUsernames);

      if (userUsernames.length > 0) {
        setFormData(prev => ({
          ...prev,
          user_name: userUsernames[0],
          styles: prev.styles || { // Ensure styles object exists, with defaults if needed
            container: {
              background_color: "#ffffff",
              border_color: "#e5e7eb",
              border_width: 1,
              border_radius: 12,
              padding: "16px 18px",
              shadow: false
            },
            input: {
              background_color: "#ffffff",
              text_color: "#0f172a",
              border_color: "#e5e7eb",
              border_radius: 8,
              padding: "10px 12px"
            },
            button: {
              background_color: "#2563eb",
              text_color: "#ffffff",
              border_radius: 10,
              padding: "10px 16px"
            },
            layout: {
              full_width_default: false,
              gap: "8px"
            }
          }
        }));
      }

      // Load forms after user data is set
      await loadForms(user);
    } catch (error) {
      console.error("Initialization error:", error);
      if (error?.response?.status === 429) {
        setApiError("Rate limit reached during initialization. Please refresh the page in a few moments.");
      } else {
        setApiError("You must be logged in to manage email forms.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadForms, setFormData]); // Dependencies: loadForms, setFormData (stable)

  // Use effect with proper dependency management
  useEffect(() => {
    initializeData();
  }, [initializeData]); // Only run on mount, re-run if initializeData changes

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id, value) => {
     setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleStyleChange = (path, value) => {
    setFormData(prev => {
      const next = { ...prev, styles: { ...(prev.styles || {}) } };
      const parts = path.split(".");
      let cur = next.styles;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        cur[k] = cur[k] || {};
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      headline: "",
      subtext: "",
      button_text: "",
      user_name: assignmentUsernames[0] || "",
      styles: {
        container: {
          background_color: "#ffffff",
          border_color: "#e5e7eb",
          border_width: 1,
          border_radius: 12,
          padding: "16px 18px",
          shadow: false
        },
        input: {
          background_color: "#ffffff",
          text_color: "#0f172a",
          border_color: "#e5e7eb",
          border_radius: 8,
          padding: "10px 12px"
        },
        button: {
          background_color: "#2563eb",
          text_color: "#ffffff",
          border_radius: 10,
          padding: "10px 16px"
        },
        layout: {
          full_width_default: false,
          gap: "8px"
        }
      }
    });
    setEditingForm(null);
    setPreviewFullWidth(false);
  };

  const handleOpenDialog = (form = null) => {
    if (form) {
      setEditingForm(form);
      setFormData({
        name: form.name,
        headline: form.headline,
        subtext: form.subtext || "",
        button_text: form.button_text,
        user_name: form.user_name,
        styles: {
          container: {
            background_color: form.styles?.container?.background_color || "#ffffff",
            border_color: form.styles?.container?.border_color || "#e5e7eb",
            border_width: form.styles?.container?.border_width ?? 1,
            border_radius: form.styles?.container?.border_radius ?? 12,
            padding: form.styles?.container?.padding || "16px 18px",
            shadow: !!form.styles?.container?.shadow
          },
          input: {
            background_color: form.styles?.input?.background_color || "#ffffff",
            text_color: form.styles?.input?.text_color || "#0f172a",
            border_color: form.styles?.input?.border_color || "#e5e7eb",
            border_radius: form.styles?.input?.border_radius ?? 8,
            padding: form.styles?.input?.padding || "10px 12px"
          },
          button: {
            background_color: form.styles?.button?.background_color || "#2563eb",
            text_color: form.styles?.button?.text_color || "#ffffff",
            border_radius: form.styles?.button?.border_radius ?? 10,
            padding: form.styles?.button?.padding || "10px 16px"
          },
          layout: {
            full_width_default: !!form.styles?.layout?.full_width_default,
            gap: form.styles?.layout?.gap || "8px"
          }
        }
      });
      setPreviewFullWidth(!!form.styles?.layout?.full_width_default);
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
      setApiError(null); // Clear errors
      if (editingForm) {
        await EmailCaptureForm.update(editingForm.id, formData);
        toast.success("Form template updated successfully!");
      } else {
        await EmailCaptureForm.create(formData);
        toast.success("Form template created successfully!");
      }
      await loadForms(currentUser);
      handleCloseDialog();
    } catch (error) {
      console.error("Save error:", error);
      if (error?.response?.status === 429) {
        toast.error("Rate limit reached. Please wait and try again.");
        setApiError("Too many requests. Please wait before trying again.");
      } else {
        toast.error(`Failed to ${editingForm ? 'update' : 'create'} form template.`);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this form template?")) {
      try {
        setApiError(null); // Clear errors
        await EmailCaptureForm.delete(id);
        toast.success("Form template deleted successfully!");
        await loadForms(currentUser);
      } catch (error) {
        console.error("Delete error:", error);
        if (error?.response?.status === 429) {
          toast.error("Rate limit reached. Please wait and try again.");
          setApiError("Too many requests. Please wait before trying again.");
        } else {
          toast.error("Failed to delete form template.");
        }
      }
    }
  };

  const handlePreviewSubmit = async ({ email, name }) => {
    const payload = {
      email,
      name,
      form_name: formData.name || "Untitled Form",
      source_url: window.location.href,
      user_name: formData.user_name || "",
      data: {} // extend later with custom fields
    };
    const { data } = await captureEmail(payload);
    if (data?.success) {
      toast.success("Test submission captured.");
    } else {
      toast.error(data?.error || "Failed to capture.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading email forms...</p>
          {apiError && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">{apiError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50 text-slate-900">
      {apiError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800">{apiError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setApiError(null); // Clear error before retrying
              initializeData(); // Retry initialization
            }}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Mail className="text-slate-700" /> Email Capture Form Manager
        </h1>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!!apiError} // Disable button if API error exists
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Form Template
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-4 p-4 font-semibold text-slate-700 border-b border-slate-200">
          <div>Name</div>
          <div>Headline</div>
          <div>Username</div>
          <div>Actions</div>
        </div>
        {forms.length > 0 ? (
          forms.map((form) => (
            <div key={form.id} className="grid grid-cols-4 p-4 items-center text-slate-800 border-b border-slate-200 last:border-b-0">
              <div className="font-medium text-slate-900">{form.name}</div>
              <div className="truncate pr-4">{form.headline}</div>
              <div>{form.user_name}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(form)} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(form.id)} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-6 text-center text-slate-500">No form templates found. Add one to get started!</p>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-3xl w-[min(96vw,1000px)] max-h-[90vh] flex flex-col p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle>{editingForm ? "Edit" : "Create"} Email Form Template</DialogTitle>
          </DialogHeader>

          {/* EDIT: add top padding and constrain scroll to prevent focus ring clipping */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 pt-3">
            {/* Top: Form */}
            <form
              onSubmit={handleSubmit}
              className="w-full min-w-0 flex-1 flex flex-col space-y-4 overflow-visible"
            >
              <div>
                <Label htmlFor="name">Form Name (Internal)</Label>
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
                <Label htmlFor="user_name">Assign to Username</Label>
                <Select onValueChange={(value) => handleSelectChange('user_name', value)} value={formData.user_name}>
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Select a username" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border border-slate-200">
                    {assignmentUsernames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* NEW: Design Editor */}
              <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="font-semibold text-slate-900">Design</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Container BG</Label>
                    <Input type="color" value={formData.styles.container.background_color} onChange={(e) => handleStyleChange("container.background_color", e.target.value)} className="h-10 bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Border Color</Label>
                    <Input type="color" value={formData.styles.container.border_color} onChange={(e) => handleStyleChange("container.border_color", e.target.value)} className="h-10 bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Border Width</Label>
                    <Input type="number" value={formData.styles.container.border_width} onChange={(e) => handleStyleChange("container.border_width", Number(e.target.value))} className="bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Border Radius</Label>
                    <Input type="number" value={formData.styles.container.border_radius} onChange={(e) => handleStyleChange("container.border_radius", Number(e.target.value))} className="bg-white border-slate-300" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Container Padding</Label>
                    <Input value={formData.styles.container.padding} onChange={(e) => handleStyleChange("container.padding", e.target.value)} placeholder="e.g., 16px 18px" className="bg-white border-slate-300" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Input BG</Label>
                    <Input type="color" value={formData.styles.input.background_color} onChange={(e) => handleStyleChange("input.background_color", e.target.value)} className="h-10 bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Input Text</Label>
                    <Input type="color" value={formData.styles.input.text_color} onChange={(e) => handleStyleChange("input.text_color", e.target.value)} className="h-10 bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Input Border</Label>
                    <Input type="color" value={formData.styles.input.border_color} onChange={(e) => handleStyleChange("input.border_color", e.target.value)} className="h-10 bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Input Radius</Label>
                    <Input type="number" value={formData.styles.input.border_radius} onChange={(e) => handleStyleChange("input.border_radius", Number(e.target.value))} className="bg-white border-slate-300" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Input Padding</Label>
                    <Input value={formData.styles.input.padding} onChange={(e) => handleStyleChange("input.padding", e.target.value)} placeholder="e.g., 10px 12px" className="bg-white border-slate-300" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Button BG</Label>
                    <Input type="color" value={formData.styles.button.background_color} onChange={(e) => handleStyleChange("button.background_color", e.target.value)} className="h-10 bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Button Text</Label>
                    <Input type="color" value={formData.styles.button.text_color} onChange={(e) => handleStyleChange("button.text_color", e.target.value)} className="h-10 bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Button Radius</Label>
                    <Input type="number" value={formData.styles.button.border_radius} onChange={(e) => handleStyleChange("button.border_radius", Number(e.target.value))} className="bg-white border-slate-300" />
                  </div>
                  <div>
                    <Label>Button Padding</Label>
                    <Input value={formData.styles.button.padding} onChange={(e) => handleStyleChange("button.padding", e.target.value)} placeholder="e.g., 10px 16px" className="bg-white border-slate-300" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Full width (default)</Label>
                    <Switch checked={!!formData.styles.layout.full_width_default} onCheckedChange={(v) => { handleStyleChange("layout.full_width_default", v); setPreviewFullWidth(v); }} />
                  </div>
                  <div>
                    <Label>Gap</Label>
                    <Input value={formData.styles.layout.gap} onChange={(e) => handleStyleChange("layout.gap", e.target.value)} placeholder="e.g., 8px" className="bg-white border-slate-300" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-slate-600 hover:text-slate-800">Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{editingForm ? "Update" : "Create"} Form</Button>
              </div>
            </form>

            {/* Bottom: Live Preview */}
            <div className="w-full min-w-0">
              <EmailFormLivePreview
                template="default"
                values={formData}
                onSubmit={handlePreviewSubmit}
                fullWidth={previewFullWidth}
                onToggleFullWidth={setPreviewFullWidth}
              />
              <div className="mt-3 text-xs text-slate-500">
                The preview above submits to your in-app capture endpoint and stores entries in CapturedEmail with the selected username.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
