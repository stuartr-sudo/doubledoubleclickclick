import React, { useState, useEffect, useCallback } from "react";
import { CustomContentTemplate } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Eye, Save, Code, Type, Image, Link, Box, List, Quote } from "lucide-react";
import { toast } from "sonner";

export default function ContentStructureBuilder() {
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for template editing
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    associated_ai_feature: "general",
    html_structure: "",
    preview_data: {
      title: "Sample Title",
      content: "This is sample content that will be replaced by AI-generated text.",
      image_url: "https://via.placeholder.com/300x200",
      additional_fields: {}
    }
  });

  // Builder state
  const [builderElements, setBuilderElements] = useState([]);
  const [previewHtml, setPreviewHtml] = useState("");

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      let filter = {};
      if (user && user.role !== "admin" && user.access_level !== "full") {
        const allowedUsernames = user.assigned_usernames || [];
        if (allowedUsernames.length > 0) {
          filter.user_name = allowedUsernames[0]; // Filter by first assigned username for simplicity
        }
      }
      const fetchedTemplates = await CustomContentTemplate.filter(filter, "-created_date");
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user, loadTemplates]);

  // Generate preview HTML from builder elements
  const generatePreviewHtml = useCallback(() => {
    if (builderElements.length === 0) {
      return templateForm.html_structure || "<p>No content yet. Add elements to build your template.</p>";
    }

    let html = "";
    builderElements.forEach(element => {
      switch (element.type) {
        case "container":
          html += `<div class="${element.cssClass || 'container'}" style="${element.style || ''}">${element.content || "{{CONTENT}}"}</div>`;
          break;
        case "heading":
          html += `<h${element.level || 2} class="${element.cssClass || ''}" style="${element.style || ''}">${element.content || "{{TITLE}}"}</h${element.level || 2}>`;
          break;
        case "paragraph":
          html += `<p class="${element.cssClass || ''}" style="${element.style || ''}">${element.content || "{{CONTENT}}"}</p>`;
          break;
        case "image":
          html += `<img src="${element.src || "{{IMAGE_URL}}"}" alt="${element.alt || "{{IMAGE_ALT}}"}" class="${element.cssClass || ''}" style="${element.style || 'max-width: 100%; height: auto;'}" />`;
          break;
        case "button":
          html += `<button class="${element.cssClass || 'btn'}" style="${element.style || ''}">${element.content || "{{BUTTON_TEXT}}"}</button>`;
          break;
        case "link":
          html += `<a href="${element.href || "{{LINK_URL}}"}" class="${element.cssClass || ''}" style="${element.style || ''}">${element.content || "{{LINK_TEXT}}"}</a>`;
          break;
        default:
          html += `<div>${element.content || "Unknown element"}</div>`;
      }
    });
    return html;
  }, [builderElements, templateForm.html_structure]);

  // Update preview when builder elements change
  useEffect(() => {
    const html = generatePreviewHtml();
    setPreviewHtml(html);
    setTemplateForm(prev => ({ ...prev, html_structure: html }));
  }, [builderElements, generatePreviewHtml]);

  const addElement = (type) => {
    const newElement = {
      id: Date.now(),
      type,
      content: "",
      cssClass: "",
      style: "",
      ...(type === "heading" && { level: 2 }),
      ...(type === "image" && { src: "", alt: "" }),
      ...(type === "link" && { href: "" })
    };
    setBuilderElements(prev => [...prev, newElement]);
  };

  const updateElement = (id, updates) => {
    setBuilderElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  };

  const removeElement = (id) => {
    setBuilderElements(prev => prev.filter(el => el.id !== id));
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      const templateData = {
        ...templateForm,
        user_name: user?.assigned_usernames?.[0] || user?.email || "default"
      };

      if (selectedTemplate) {
        await CustomContentTemplate.update(selectedTemplate.id, templateData);
        toast.success("Template updated successfully");
      } else {
        await CustomContentTemplate.create(templateData);
        toast.success("Template created successfully");
      }
      
      loadTemplates();
      resetForm();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  const loadTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      associated_ai_feature: template.associated_ai_feature || "general",
      html_structure: template.html_structure,
      preview_data: template.preview_data || {
        title: "Sample Title",
        content: "Sample content",
        image_url: "https://via.placeholder.com/300x200",
        additional_fields: {}
      }
    });
    // Reset builder elements when loading existing template
    setBuilderElements([]);
    setPreviewHtml(template.html_structure);
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setTemplateForm({
      name: "",
      description: "",
      associated_ai_feature: "general",
      html_structure: "",
      preview_data: {
        title: "Sample Title",
        content: "Sample content",
        image_url: "https://via.placeholder.com/300x200",
        additional_fields: {}
      }
    });
    setBuilderElements([]);
    setPreviewHtml("");
  };

  const deleteTemplate = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;
    
    try {
      await CustomContentTemplate.delete(template.id);
      toast.success("Template deleted successfully");
      loadTemplates();
      if (selectedTemplate?.id === template.id) {
        resetForm();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  // Placeholder replacement for preview
  const getPreviewWithSampleData = () => {
    return previewHtml
      .replace(/\{\{TITLE\}\}/g, templateForm.preview_data.title)
      .replace(/\{\{CONTENT\}\}/g, templateForm.preview_data.content)
      .replace(/\{\{IMAGE_URL\}\}/g, templateForm.preview_data.image_url)
      .replace(/\{\{IMAGE_ALT\}\}/g, "Sample Image")
      .replace(/\{\{BUTTON_TEXT\}\}/g, "Click Here")
      .replace(/\{\{LINK_TEXT\}\}/g, "Sample Link")
      .replace(/\{\{LINK_URL\}\}/g, "#");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen">
        {/* Left Sidebar - Template List */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Content Structure Builder</h1>
            <Button onClick={resetForm} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <p className="text-slate-600">Loading templates...</p>
            ) : templates.length === 0 ? (
              <p className="text-slate-600">No templates yet. Create your first one!</p>
            ) : (
              <div className="space-y-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => loadTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">{template.name}</h3>
                        <p className="text-xs text-slate-600 mt-1">{template.associated_ai_feature}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template);
                        }}
                        className="w-6 h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Builder */}
        <div className="flex-1 flex">
          {/* Left Panel - Builder Controls */}
          <div className="w-1/2 bg-white border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Template Builder</h2>
              
              {/* Template Info Form */}
              <div className="space-y-3 mb-6">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Modern TLDR Card"
                    className="bg-white border-slate-300"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the template"
                    className="bg-white border-slate-300"
                  />
                </div>
                
                <div>
                  <Label>AI Feature Type</Label>
                  <Select
                    value={templateForm.associated_ai_feature}
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, associated_ai_feature: value }))}
                  >
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="tldr">TL;DR</SelectItem>
                      <SelectItem value="faq">FAQ</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="testimonial">Testimonial</SelectItem>
                      <SelectItem value="callout">Callout</SelectItem>
                      <SelectItem value="fact">Fact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={saveTemplate} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {selectedTemplate ? "Update Template" : "Save Template"}
                </Button>
              </div>
            </div>

            {/* Element Builder */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h3 className="font-medium text-slate-900 mb-3">Add Elements</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement("container")}
                    className="flex flex-col items-center p-2"
                  >
                    <Box className="w-4 h-4 mb-1" />
                    <span className="text-xs">Container</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement("heading")}
                    className="flex flex-col items-center p-2"
                  >
                    <Type className="w-4 h-4 mb-1" />
                    <span className="text-xs">Heading</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement("paragraph")}
                    className="flex flex-col items-center p-2"
                  >
                    <List className="w-4 h-4 mb-1" />
                    <span className="text-xs">Text</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement("image")}
                    className="flex flex-col items-center p-2"
                  >
                    <Image className="w-4 h-4 mb-1" />
                    <span className="text-xs">Image</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement("button")}
                    className="flex flex-col items-center p-2"
                  >
                    <Code className="w-4 h-4 mb-1" />
                    <span className="text-xs">Button</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addElement("link")}
                    className="flex flex-col items-center p-2"
                  >
                    <Link className="w-4 h-4 mb-1" />
                    <span className="text-xs">Link</span>
                  </Button>
                </div>
              </div>

              {/* Element List */}
              <div className="space-y-3">
                <h3 className="font-medium text-slate-900">Elements</h3>
                {builderElements.length === 0 ? (
                  <p className="text-slate-600 text-sm">No elements added yet. Click buttons above to add elements.</p>
                ) : (
                  builderElements.map((element, index) => (
                    <Card key={element.id} className="border border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="capitalize">{element.type} {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeElement(element.id)}
                            className="w-6 h-6 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {element.type === "heading" && (
                          <div>
                            <Label className="text-xs">Heading Level</Label>
                            <Select
                              value={String(element.level)}
                              onValueChange={(value) => updateElement(element.id, { level: Number(value) })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">H1</SelectItem>
                                <SelectItem value="2">H2</SelectItem>
                                <SelectItem value="3">H3</SelectItem>
                                <SelectItem value="4">H4</SelectItem>
                                <SelectItem value="5">H5</SelectItem>
                                <SelectItem value="6">H6</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        <div>
                          <Label className="text-xs">Content/Placeholder</Label>
                          <Input
                            value={element.content}
                            onChange={(e) => updateElement(element.id, { content: e.target.value })}
                            placeholder="Use {{TITLE}}, {{CONTENT}}, {{IMAGE_URL}} etc."
                            className="h-8"
                          />
                        </div>
                        
                        {element.type === "image" && (
                          <>
                            <div>
                              <Label className="text-xs">Image Source</Label>
                              <Input
                                value={element.src}
                                onChange={(e) => updateElement(element.id, { src: e.target.value })}
                                placeholder="{{IMAGE_URL}} or direct URL"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Alt Text</Label>
                              <Input
                                value={element.alt}
                                onChange={(e) => updateElement(element.id, { alt: e.target.value })}
                                placeholder="{{IMAGE_ALT}} or description"
                                className="h-8"
                              />
                            </div>
                          </>
                        )}
                        
                        {element.type === "link" && (
                          <div>
                            <Label className="text-xs">Link URL</Label>
                            <Input
                              value={element.href}
                              onChange={(e) => updateElement(element.id, { href: e.target.value })}
                              placeholder="{{LINK_URL}} or direct URL"
                              className="h-8"
                            />
                          </div>
                        )}
                        
                        <div>
                          <Label className="text-xs">CSS Classes</Label>
                          <Input
                            value={element.cssClass}
                            onChange={(e) => updateElement(element.id, { cssClass: e.target.value })}
                            placeholder="e.g., bg-blue-100 p-4 rounded"
                            className="h-8"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Inline Styles</Label>
                          <Input
                            value={element.style}
                            onChange={(e) => updateElement(element.id, { style: e.target.value })}
                            placeholder="e.g., color: red; margin: 10px;"
                            className="h-8"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Raw HTML Editor */}
              <div className="mt-6">
                <Label className="text-sm font-medium">Raw HTML Template</Label>
                <Textarea
                  value={templateForm.html_structure}
                  onChange={(e) => {
                    setTemplateForm(prev => ({ ...prev, html_structure: e.target.value }));
                    setPreviewHtml(e.target.value);
                  }}
                  placeholder="Or edit HTML directly..."
                  className="h-32 font-mono text-sm bg-slate-50"
                />
                <p className="text-xs text-slate-600 mt-1">
                  Use placeholders like: {`{{TITLE}}, {{CONTENT}}, {{IMAGE_URL}}, {{BUTTON_TEXT}}`}
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-1/2 bg-slate-50 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: getPreviewWithSampleData() }}
                />
              </div>
            </div>

            {/* Preview Data Controls */}
            <div className="p-4 bg-white border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Preview Data</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Sample Title</Label>
                  <Input
                    value={templateForm.preview_data.title}
                    onChange={(e) => setTemplateForm(prev => ({
                      ...prev,
                      preview_data: { ...prev.preview_data, title: e.target.value }
                    }))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Sample Content</Label>
                  <Input
                    value={templateForm.preview_data.content}
                    onChange={(e) => setTemplateForm(prev => ({
                      ...prev,
                      preview_data: { ...prev.preview_data, content: e.target.value }
                    }))}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}