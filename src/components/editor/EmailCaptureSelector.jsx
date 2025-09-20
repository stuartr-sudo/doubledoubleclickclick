
import React, { useState, useEffect, useCallback } from "react";
import { EmailCaptureForm } from "@/api/entities";
import { User } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

/**
 * Generates the HTML for embedding an email capture form.
 *
 * @param {object} params - The parameters for building the HTML.
 * @param {string} params.formName - The internal name of the form.
 * @param {string} params.headline - The headline for the form.
 * @param {string} params.subtext - The subtext or description for the form.
 * @param {string} params.buttonText - The text for the submit button.
 * @param {Array<object>} params.fields - An array of additional custom fields for the form.
 * @param {object} params.styles - Style parameters for customizing the form's appearance.
 * @returns {string} The HTML string for the embeddable form.
 */
function buildEmbedHtml({ formName, headline, subtext, buttonText, fields, styles }) {
  const s = styles || {};
  const c = s.container || {};
  const i = s.input || {};
  const b = s.button || {};
  const layout = s.layout || {};

  const containerStyle = [
    `border:${(c.border_width ?? 1)}px solid ${c.border_color || "#e5e7eb"}`,
    `border-radius:${(c.border_radius ?? 12)}px`,
    `padding:${c.padding || "16px 18px"}`,
    `background:${c.background_color || "linear-gradient(180deg,rgba(241,245,249,.65),rgba(255,255,255,.9))"}`,
    c.shadow ? `box-shadow:0 4px 16px rgba(0,0,0,0.08)` : ``
  ].join(";");

  const inputStyle = [
    `width:100%`,
    `padding:${i.padding || "10px 12px"}`,
    `border:1px solid ${i.border_color || "#e5e7eb"}`,
    `border-radius:${(i.border_radius ?? 8)}px`,
    `background:${i.background_color || "#ffffff"}`,
    `color:${i.text_color || "#0f172a"}`
  ].join(";");

  const btnStyle = [
    `width:auto`,
    `background:${b.background_color || "#111827"}`,
    `color:${b.text_color || "#ffffff"}`,
    `border-radius:${(b.border_radius ?? 10)}px`,
    `padding:${b.padding || "10px 12px"}`,
    `border:none`
  ].join(";");

  const extra = (fields || [])
    .map(f => {
      const type = (f.type || "text");
      const req = f.required ? "required" : "";
      const ph = f.placeholder ? `placeholder="${f.placeholder.replace(/"/g, '&quot;')}"` : "";
      return `<input type="${type}" name="${f.key}" ${ph} ${req} style="${inputStyle};margin:6px 0;">`;
    }).join("");

  const gap = layout.gap || "8px";
  const wrapperWidth = layout.full_width_default ? "100%" : "460px";

  return `
<div class="b44-email-form" style="${containerStyle};max-width:100%;width:${wrapperWidth}">
  ${headline ? `<div style="font-weight:700;margin-bottom:6px;">${headline}</div>` : ""}
  ${subtext ? `<div style="color:#4b5563;margin-bottom:10px;">${subtext}</div>` : ""}
  <form onsubmit="return (function(form){
      const fd = new FormData(form);
      const data = {};
      for (const [k,v] of fd.entries()) { data[k] = v; }
      const payload = {
        email: data.email || '',
        name: data.name || '',
        form_name: '${formName?.replace(/'/g, "\\'") || ''}',
        source_url: window.location.href,
        data: Object.fromEntries(Object.entries(data).filter(([k]) => k !== 'email' && k !== 'name'))
      };
      fetch('/functions/captureEmail', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        .then(r=>r.json()).then(()=>{ form.reset(); const m=form.querySelector('.b44-email-msg'); if(m){ m.textContent='Thanks! You are subscribed.'; } })
        .catch(()=>{ const m=form.querySelector('.b44-email-msg'); if(m){ m.textContent='Something went wrong. Please try again.'; } });
      return false;
    })(this)" style="display:flex;flex-wrap:wrap;gap:${gap};align-items:stretch;">
    <input type="text" name="name" placeholder="Your name" style="${inputStyle};flex:1 1 120px;margin:0;">
    <input type="email" name="email" placeholder="Your email" required style="${inputStyle};flex:1 1 140px;margin:0;">
    ${extra}
    <button type="submit" style="${btnStyle};margin-top:0;">${buttonText || 'Subscribe'}</button>
    <div class="b44-email-msg" style="margin-top:8px;font-size:12px;color:#6b7280;width:100%;"></div>
  </form>
</div>`.trim();
}

export default function EmailCaptureSelector({ isOpen, onClose, onInsert }) {
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);

  // loadForms is a dependency of loadCurrentUser, but it doesn't use any state/props
  // from EmailCaptureSelector directly, and it takes `user` as an argument.
  // It's fine not to memoize loadForms itself as it's only called by loadCurrentUser,
  // and loadCurrentUser is memoized.
  const loadForms = async (user) => {
    setIsLoading(true);
    try {
      const allForms = await EmailCaptureForm.list("-created_date");
      const assigned = user.assigned_usernames || [];

      if (assigned.length === 0) {
        setForms([]);
        setAvailableUsernames([]);
        setIsLoading(false);
        return;
      }

      const userSpecificForms = allForms.filter(form => 
        form.user_name && assigned.includes(form.user_name)
      );
      
      setForms(userSpecificForms);
      setAvailableUsernames([...assigned].sort());
    } catch (error) {
      console.error("Error loading Email Forms:", error);
    }
    setIsLoading(false);
  };

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      await loadForms(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  }, []); // Memoize loadCurrentUser, it depends on loadForms, but loadForms does not depend on component state/props.

  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
    } else {
      setSelectedUsername("all");
    }
  }, [isOpen, loadCurrentUser]); // Include loadCurrentUser in useEffect dependencies

  const handleInsert = (form) => {
    // **FIX**: Switched to a blockquote wrapper which Quill preserves.
    // The previous implementation was a blockquote wrapper.
    // The new implementation uses a more robust HTML structure generated by buildEmbedHtml.
    const html = buildEmbedHtml({
      formName: form?.name,
      headline: form?.headline,
      subtext: form?.subtext,
      buttonText: form?.button_text,
      fields: form?.fields || [], // Assumes `form.fields` might exist for dynamic fields
      styles: form?.styles || {} // Pass styles property
    });
    onInsert && onInsert(html);
    onClose && onClose();
  };

  const filteredForms = forms
    .filter(form => selectedUsername === "all" || form.user_name === selectedUsername)
    .filter(form =>
      form.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.headline?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl backdrop-blur-xl bg-white/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Select Email Capture Form
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search forms by name or headline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {(availableUsernames.length > 0 || currentUser?.role === 'admin') && (
              <div>
                <Label htmlFor="username-select-email" className="sr-only">Filter by Username</Label>
                <Select value={selectedUsername} onValueChange={setSelectedUsername}>
                  <SelectTrigger id="username-select-email">
                    <SelectValue placeholder="Filter by username..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {currentUser?.role === 'admin' ? 'All Users' : 'All Assigned Usernames'}
                    </SelectItem>
                    {availableUsernames.map(username => (
                      <SelectItem key={username} value={username}>{username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading Forms...</div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No Email Capture Forms found. Please create one in the Email Form Manager.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredForms.map((form) => (
                  <div key={form.id} className="border rounded-lg p-4 hover:bg-gray-50 flex flex-col justify-between">
                    <div>
                        <h4 className="font-bold text-lg mb-2">{form.headline}</h4>
                        <p className="text-sm text-gray-600 mb-3">{form.subtext}</p>
                        <p className="text-xs text-gray-400 mb-3">Internal Name: {form.name}</p>
                        <div className="my-3 p-4 border rounded-md">
                            {/* Preview inputs for custom fields if any */}
                            {form.fields && form.fields.map((field, index) => (
                                <Input 
                                    key={index} 
                                    type={field.type || 'text'} 
                                    placeholder={field.placeholder || field.key} 
                                    className="w-full p-2 border rounded mb-2" 
                                    disabled 
                                />
                            ))}
                            <Input type="text" placeholder="Your name" className="w-full p-2 border rounded mb-2" disabled />
                            <Input type="email" placeholder="Your Email Address" className="w-full p-2 border rounded" disabled />
                            <Button size="sm" className="w-full mt-2 bg-purple-600 hover:bg-purple-700 pointer-events-none">
                                {form.button_text}
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">Username: {form.user_name}</span>
                      <Button
                        onClick={() => handleInsert(form)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Insert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
