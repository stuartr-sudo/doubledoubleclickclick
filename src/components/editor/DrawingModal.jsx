import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import app from '@/api/appClient';
import { toast } from 'sonner';

/**
 * DrawingModal - Completely isolated from Editor
 * No shared state, no background process interactions
 * Memoized to prevent unnecessary re-renders from parent
 */
const DrawingModal = React.memo(function DrawingModal({ open, onClose, onInsert }) {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState(null);
  const [shapesCount, setShapesCount] = useState(0);

  // Use a ref to store a stable instance ID for Tldraw
  // This ensures Tldraw only remounts when the modal truly opens/closes, not on internal state changes
  const stableInstanceKeyRef = useRef(null);

  // Generate a new, stable key when the modal opens, and clear it when it closes
  useEffect(() => {
    if (open) {
      if (!stableInstanceKeyRef.current) {
        stableInstanceKeyRef.current = `tldraw-instance-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log('🎨 Generated new stable Tldraw instance key:', stableInstanceKeyRef.current);
      }
      getCurrentUser().then(setUser).catch(() => setUser(null));
      window.__drawingOpen = true;
      console.log('🎨 Drawing opened - pausing ALL background processes');
    } else {
      stableInstanceKeyRef.current = null; // Clear key on close to force fresh canvas next time
      window.__drawingOpen = false;
      console.log('🎨 Drawing closed - resuming background processes');
    }
    return () => {
      window.__drawingOpen = false; // Ensure it's cleared on unmount too
      console.log('🎨 Drawing unmounted - resuming background processes');
    };
  }, [open]);

  // Minimal mount handler
  const handleMount = useCallback((mountedEditor) => {
    console.log('✅ Tldraw mounted successfully');
    setEditor(mountedEditor);
    
    // Set draw tool after editor is ready
    setTimeout(() => {
      try {
        mountedEditor?.setCurrentTool?.('draw');
        console.log('🎯 Set to draw tool');
      } catch (e) {
        console.warn('Could not set draw tool:', e);
      }
    }, 100);

    // Debug: Monitor shapes in real-time
    const monitorInterval = setInterval(() => {
      if (mountedEditor) {
        const currentShapes = mountedEditor.getCurrentPageShapes();
        const newCount = currentShapes.length;
        if (newCount !== shapesCount) {
          console.log(`🔍 Shapes count changed: ${shapesCount} → ${newCount}`);
          setShapesCount(newCount);
        }
        if (newCount === 0 && shapesCount > 0) {
          console.error(`🚨 SHAPES WERE WIPED! Previous count was: ${shapesCount}`);
        }
      }
    }, 500); // Check every 500ms

    return () => clearInterval(monitorInterval);
  }, [shapesCount]); // Dependency on shapesCount to update the console log correctly

  // Export drawing as PNG and upload to Supabase
  const handleSaveAndInsert = useCallback(async () => {
    if (!editor) {
      toast.error('Drawing editor not ready');
      return;
    }

    try {
      setSaving(true);

      const allShapes = editor.getCurrentPageShapes();
      if (!allShapes || allShapes.length === 0) {
        toast.error('Please draw something first!');
        setSaving(false);
        return;
      }

      const shapeIds = allShapes.map((shape) => shape.id);
      const blob = await editor.exportToBlob({
        ids: shapeIds,
        format: 'png',
        opts: {
          background: true,
          padding: 32,
          scale: 2,
        },
      });

      if (!blob) {
        throw new Error('Failed to export drawing');
      }

      const timestamp = Date.now();
      const fileName = `drawing_${user?.id || 'anon'}_${timestamp}.png`;
      const filePath = `drawings/${fileName}`;

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

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

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
      }

      onInsert(publicUrl);
      toast.success('Drawing inserted!');
      onClose();

    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error(error.message || 'Failed to save drawing');
    } finally {
      setSaving(false);
    }
  }, [editor, user, onInsert, onClose, shapesCount]);

  if (!open) return null;

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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
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
      `}</style>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          background: 'linear-gradient(to right, #6366F1, #9333EA)', // Modern gradient header
          color: 'white',
          zIndex: 10000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.2em' }}>Draw & Sketch <span style={{ fontSize: '0.8em', opacity: 0.8 }}> (Shapes: {shapesCount})</span></h2>
        <div>
          <Button
            onClick={handleSaveAndInsert}
            disabled={saving || shapesCount === 0}
            style={{
              marginRight: '10px',
              background: 'white',
              color: '#6366F1',
              fontWeight: 'bold',
            }}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Insert Drawing'}
          </Button>
          <Button
            onClick={onClose}
            variant="destructive"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <X className="h-4 w-4 mr-2" /> Close
          </Button>
        </div>
      </div>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <Tldraw
          key={stableInstanceKeyRef.current} // Use the stable key here
          onMount={handleMount}
          hideUi={false}
          // No persistenceKey here, as we want a fresh canvas every time
        />
      </div>
    </div>,
    document.body
  );
});

export default DrawingModal;