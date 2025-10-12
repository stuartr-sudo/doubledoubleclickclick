import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ExportDialog({ isOpen, onClose, post }) {
  const [exporting, setExporting] = useState(false);

  const cleanContentForTxtExport = (html) => {
    if (!html) return '';
    
    let cleaned = String(html);
    
    // Remove ALL script tags (JSON-LD schema, TikTok embeds, etc.)
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Remove all meta tags
    cleaned = cleaned.replace(/<meta[^>]*\/?>/gi, '');
    
    // Remove title tags
    cleaned = cleaned.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '');
    
    // Remove style tags
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  const handleDownloadTxt = async () => {
    setExporting(true);
    try {
      const title = post?.title || 'article';
      const metaTitle = post?.meta_title || title;
      const metaDescription = post?.meta_description || '';
      const slug = post?.slug || '';
      const focusKeyword = post?.focus_keyword || '';
      
      // Clean the HTML content - remove ALL scripts, meta tags, and schema
      const cleanedContent = cleanContentForTxtExport(post?.content || '');
      
      // Build a clean export with SEO fields at top, then clean HTML
      let txtContent = '';
      
      // Add SEO metadata section (once, at the top)
      txtContent += `TITLE: ${metaTitle}\n`;
      if (metaDescription) txtContent += `META DESCRIPTION: ${metaDescription}\n`;
      if (slug) txtContent += `SLUG: ${slug}\n`;
      if (focusKeyword) txtContent += `FOCUS KEYWORD: ${focusKeyword}\n`;
      
      // Add separator
      txtContent += `\n${'='.repeat(80)}\n\n`;
      
      // Add ONLY the cleaned HTML content (no scripts, no duplicate schemas)
      txtContent += cleanedContent;
      
      // Create blob and download
      const blob = new Blob([txtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug || 'article'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Article exported to .txt file');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export article');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Article
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Download a clean .txt file with SEO metadata and HTML content (schemas removed).
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-slate-600 mb-4">
            This will export:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
            <li>SEO metadata (title, description, slug, keyword)</li>
            <li>Clean HTML content</li>
            <li>NO duplicate schemas or scripts</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-white border-slate-300">
            Cancel
          </Button>
          <Button 
            onClick={handleDownloadTxt} 
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Download .txt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}