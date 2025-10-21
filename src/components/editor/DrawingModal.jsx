import React, { useState, useCallback, useEffect } from 'react';
import { Tldraw, exportAs } from 'tldraw';
import 'tldraw/tldraw.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, X } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import app from '@/api/appClient';
import { toast } from 'sonner';

// CSS override to ensure Tldraw works in modal
const tldrawContainerStyle = `
  .tldraw-container {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .tldraw-container * {
    pointer-events: auto !important;
  }
  .tldraw__editor {
    pointer-events: auto !important;
    touch-action: none !important;
  }
  .tl-container {
    width: 100% !important;
    height: 100% !important;
    position: absolute !important;
    inset: 0 !important;
  }
`;

/**
 * DrawingModal - Infinite canvas drawing tool using Tldraw
 * Allows users to sketch, draw, and brainstorm visually within the editor
 */
export default function DrawingModal({ open, onClose, onInsert }) {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState(null);

  // Get current user
  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error);
  }, []);

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log('🎨 DrawingModal opened');
    }
  }, [open]);

  // Handle editor mount
  const handleMount = useCallback((mountedEditor) => {
    console.log('✅ Tldraw editor mounted:', mountedEditor);
    console.log('Editor API available:', !!mountedEditor?.getCurrentPageShapes);
    setEditor(mountedEditor);
  }, []);

  // Export drawing as PNG and upload to Supabase
  const handleSaveAndInsert = async () => {
    if (!editor) {
      toast.error('Drawing editor not ready');
      return;
    }

    try {
      setSaving(true);

      // Check if canvas is empty (no shapes)
      const allShapes = editor.getCurrentPageShapes();
      if (!allShapes || allShapes.length === 0) {
        toast.error('Please draw something first!');
        setSaving(false);
        return;
      }

      // Export to PNG blob using tldraw v4 API
      const shapeIds = allShapes.map((shape) => shape.id);
      const blob = await editor.exportToBlob({
        ids: shapeIds,
        format: 'png',
        opts: {
          background: true,
          padding: 32,
          scale: 2, // 2x for high-DPI displays
        },
      });

      if (!blob) {
        throw new Error('Failed to export drawing');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `drawing_${user?.id || 'anon'}_${timestamp}.png`;
      const filePath = `drawings/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Save to image_library_items table
      try {
        await app.entities.ImageLibraryItem.create({
          user_id: user?.id,
          user_name: user?.user_name,
          url: publicUrl,
          alt_text: 'Hand-drawn sketch',
          tags: ['drawing', 'sketch', 'tldraw'],
          source: 'tldraw_drawing',
          file_size: blob.size,
          mime_type: 'image/png',
        });
      } catch (err) {
        console.warn('Failed to save to image library:', err);
        // Non-critical, continue anyway
      }

      // Insert into editor
      onInsert(publicUrl);
      toast.success('Drawing inserted!');
      onClose();

    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error(error.message || 'Failed to save drawing');
    } finally {
      setSaving(false);
    }
  };

  // Export drawing as PNG file (download)
  const handleExportPNG = async () => {
    if (!editor) return;

    try {
      const allShapes = editor.getCurrentPageShapes();
      if (!allShapes || allShapes.length === 0) {
        toast.error('Nothing to export!');
        return;
      }

      const shapeIds = allShapes.map((shape) => shape.id);
      const blob = await editor.exportToBlob({
        ids: shapeIds,
        format: 'png',
        opts: { background: true, padding: 32, scale: 2 },
      });

      if (!blob) {
        throw new Error('Export failed');
      }

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drawing_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Drawing exported!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export drawing');
    }
  };

  // Only render Tldraw when dialog is open (fixes initialization issues)
  if (!open) return null;

  return (
    <>
      {/* Inject CSS to fix pointer events */}
      <style>{tldrawContainerStyle}</style>
      
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className="p-0 overflow-hidden"
          style={{
            width: '95vw',
            height: '90vh',
            maxWidth: '95vw',
            maxHeight: '90vh',
          }}
        >
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <DialogTitle>Draw & Sketch</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Create diagrams, sketches, or brainstorm ideas on an infinite canvas
              </p>
            </DialogHeader>

            {/* Tldraw Canvas - MUST have explicit pixel height */}
            <div 
              className="tldraw-container" 
              style={{ 
                width: '100%',
                height: '600px',
                position: 'relative',
                overflow: 'hidden',
                flex: '1 1 auto',
              }}
            >
              {open && (
                <Tldraw
                  key="tldraw-instance"
                  onMount={handleMount}
                  hideUi={false}
                  components={{
                    SharePanel: null,
                  }}
                />
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t flex justify-between items-center flex-shrink-0">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportPNG}
                  disabled={saving || !editor}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PNG
                </Button>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveAndInsert} disabled={saving || !editor}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Insert Drawing'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

