import React from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Minimal Tldraw test to debug rendering issues
 */
export default function DrawingModalSimple({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[90vw] h-[90vh] p-6"
        style={{ maxHeight: '90vh' }}
      >
        <DialogHeader>
          <DialogTitle>Draw & Sketch (Test)</DialogTitle>
        </DialogHeader>
        
        <div 
          style={{ 
            width: '100%', 
            height: '70vh',
            position: 'relative',
            border: '2px solid red',  // Debug border
          }}
        >
          <Tldraw />
        </div>
      </DialogContent>
    </Dialog>
  );
}

