import React, { useState, useCallback, useEffect } from 'react';
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
 */
export default function DrawingModal({ open, onClose, onInsert }) {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState(null);
  const [shapesCount, setShapesCount] = useState(0);

  // Get user once
  useEffect(() => {
    if (open) {
      getCurrentUser().then(setUser).catch(() => setUser(null));
    }
  }, [open]);

  // Set flag to pause background processes
  useEffect(() => {
    if (open) {
      window.__drawingOpen = true;
      console.log('🎨 Drawing opened - pausing ALL background processes');
    }
    return () => {
      window.__drawingOpen = false;
      console.log('🎨 Drawing closed - resuming background processes');
    };
  }, [open]);

  // Monitor shapes count for debugging
  useEffect(() => {
    if (!editor || !open) return;

    const interval = setInterval(() => {
      const shapes = editor.getCurrentPageShapes();
      const count = shapes.length;
      
      if (count !== shapesCount) {
        console.log('🔍 Shapes count changed:', shapesCount, '→', count);
        setShapesCount(count);
        
        if (count === 0 && shapesCount > 0) {
          console.error('🚨 SHAPES WERE WIPED! Previous count was:', shapesCount);
        }
      }
    }, 500); // Check every 500ms for faster detection

    return () => clearInterval(interval);
  }, [editor, open, shapesCount]);

  // Mount handler
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
  }, []);

  // Save function
  const handleSaveAndInsert = async () => {
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

      // Export to PNG
      const shapeIds = allShapes.map((shape) => shape.id);
      const blob = await editor.exportToBlob({
        ids: shapeIds,
        format: 'png',
        opts: { background: true, padding: 32, scale: 2 },
      });

      if (!blob) throw new Error('Failed to export drawing');

      // Upload to Supabase
      const timestamp = Date.now();
      const fileName = `drawing_${user?.id || 'anon'}_${timestamp}.png`;
      const filePath = `drawings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, blob, { contentType: 'image/png', cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) throw new Error('Failed to get public URL');

      // Save to library (non-critical)
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
  };

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
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with debug info */}
      <div
        style={{
          height: '60px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
            ✏️ Draw & Sketch
          </h2>
          <div style={{ color: 'white', fontSize: '14px', opacity: 0.8 }}>
            Shapes: {shapesCount}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            onClick={handleSaveAndInsert}
            disabled={saving}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              fontWeight: '600',
            }}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Insert Drawing'
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tldraw */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Tldraw
          onMount={handleMount}
          hideUi={false}
        />
      </div>
    </div>,
    document.body
  );
}