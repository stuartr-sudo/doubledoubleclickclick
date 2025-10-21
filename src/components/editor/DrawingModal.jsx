import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  const [sessionKey, setSessionKey] = useState(null);
  const SESSION_KEY_STORAGE = 'sewo_current_drawing_key';

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

  // Create or reuse a persistence key per open. Reuse across unexpected remounts,
  // but clear when the modal is explicitly closed so a new session starts blank.
  useEffect(() => {
    if (open) {
      try {
        const existing = localStorage.getItem(SESSION_KEY_STORAGE);
        if (existing) {
          setSessionKey(existing);
        } else {
          const fresh = `sewo-drawing-${Date.now()}`;
          localStorage.setItem(SESSION_KEY_STORAGE, fresh);
          setSessionKey(fresh);
        }
      } catch (_) {
        // Fallback if localStorage unavailable
        setSessionKey(`sewo-drawing-${Date.now()}`);
      }
    } else {
      setSessionKey(null);
    }
  }, [open]);

  // Handle editor mount
  const handleMount = useCallback((mountedEditor) => {
    console.log('✅ Tldraw editor mounted:', mountedEditor);
    console.log('Editor API available:', !!mountedEditor?.getCurrentPageShapes);
    try {
      // Prefer starting in draw mode to make interaction obvious
      if (mountedEditor?.setCurrentTool) {
        mountedEditor.setCurrentTool('draw');
      }
      // Try to focus canvas for immediate pointer events
      const container = mountedEditor?.getContainer?.();
      if (container && typeof container.focus === 'function') {
        container.focus();
      }
    } catch (e) {
      console.warn('Tldraw mount tweaks failed (non-fatal):', e);
    }
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

  // Only render when open and we have a session key
  if (!open || !sessionKey) return null;

  // Close handler clears the persisted key so the next open starts blank
  const handleClose = () => {
    try { localStorage.removeItem(SESSION_KEY_STORAGE); } catch (_) {}
    onClose();
  };

  // MINIMAL TEST: Just Tldraw with no wrapper at all
  return ReactDOM.createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'white',
      }}
      onMouseEnter={() => { try { window.__drawingOpen = true; } catch(_) {} }}
      onMouseLeave={() => { try { window.__drawingOpen = false; } catch(_) {} }}
    >
      {/* Simple close button */}
      <button 
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          padding: '10px',
          background: 'red',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        CLOSE
      </button>

      {/* Tldraw with NO wrapper - direct render */}
      <Tldraw
        key="tldraw-direct"
        onMount={handleMount}
        hideUi={false}
        persistenceKey={sessionKey}
      />
    </div>,
    document.body
  );
}

