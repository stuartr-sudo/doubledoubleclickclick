import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";
import { ImageLibraryItem } from "@/api/entities";
import { Loader2, Crop as CropIcon, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function ImageEditorModal({
  isOpen,
  onClose,
  imageUrl,
  assignToUsername,
  defaultAltText = "",
  onInsert,            // function(htmlString) to insert into editor (passed from ImageLibraryModal)
  onLibrarySaved,      // callback to refresh library list in parent
}) {
  const canvasRef = useRef(null);
  const [imgEl, setImgEl] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);

  // Display canvas size
  const CANVAS_W = 720;
  const CANVAS_H = 420;

  // Image-to-canvas scale
  const [displayScale, setDisplayScale] = useState(1);

  // Crop rectangle in image coordinates
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState("none"); // 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'draw'
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [aspect, setAspect] = useState("free"); // 'free' | '1:1' | '4:3' | '16:9' | '3:2' | '2:3'
  const [outputW, setOutputW] = useState("");
  const [outputH, setOutputH] = useState("");
  const [altText, setAltText] = useState(defaultAltText || "");

  const getAspectValue = () => {
    if (aspect === "free") return null;
    const [a, b] = aspect.split(":").map(Number);
    return a > 0 && b > 0 ? a / b : null;
  };

  useEffect(() => {
    if (!isOpen) return;
    if (!imageUrl) return;
    setLoadingImg(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgEl(img);
      // Initialize crop to centered region
      const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height, 1);
      setDisplayScale(scale);
      const initW = Math.floor(img.width * 0.8);
      const initH = Math.floor(img.height * 0.8);
      setCrop({
        x: Math.floor((img.width - initW) / 2),
        y: Math.floor((img.height - initH) / 2),
        w: initW,
        h: initH,
      });
      if (!altText) setAltText(defaultAltText || "");
      setLoadingImg(false);
    };
    img.onerror = () => {
      toast.error("Failed to load image for editing.");
      setLoadingImg(false);
    };
    img.src = imageUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, imageUrl]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgEl, crop, displayScale]);

  const imgToCanvas = (p) => {
    // Convert image coords to canvas coords
    return { x: p.x * displayScale, y: p.y * displayScale };
  };
  const canvasToImg = (p) => {
    // Convert canvas coords to image coords
    return { x: p.x / displayScale, y: p.y / displayScale };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Center image
    const dx = Math.floor((CANVAS_W - imgEl.width * displayScale) / 2);
    const dy = Math.floor((CANVAS_H - imgEl.height * displayScale) / 2);

    ctx.save();
    ctx.translate(dx, dy);
    ctx.drawImage(imgEl, 0, 0, imgEl.width * displayScale, imgEl.height * displayScale);

    // Overlay outside crop area
    const cropTL = imgToCanvas({ x: crop.x, y: crop.y });
    const cropBR = imgToCanvas({ x: crop.x + crop.w, y: crop.y + crop.h });

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    // Top
    ctx.fillRect(0, 0, imgEl.width * displayScale, Math.max(0, cropTL.y));
    // Bottom
    ctx.fillRect(0, cropBR.y, imgEl.width * displayScale, imgEl.height * displayScale - cropBR.y);
    // Left
    ctx.fillRect(0, cropTL.y, Math.max(0, cropTL.x), cropBR.y - cropTL.y);
    // Right
    ctx.fillRect(cropBR.x, cropTL.y, imgEl.width * displayScale - cropBR.x, cropBR.y - cropTL.y);

    // Crop border
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropTL.x, cropTL.y, cropBR.x - cropTL.x, cropBR.y - cropTL.y);

    // Grid lines (rule of thirds)
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    const w = cropBR.x - cropTL.x;
    const h = cropBR.y - cropTL.y;
    ctx.beginPath();
    ctx.moveTo(cropTL.x + w / 3, cropTL.y);
    ctx.lineTo(cropTL.x + w / 3, cropBR.y);
    ctx.moveTo(cropTL.x + (2 * w) / 3, cropTL.y);
    ctx.lineTo(cropTL.x + (2 * w) / 3, cropBR.y);
    ctx.moveTo(cropTL.x, cropTL.y + h / 3);
    ctx.lineTo(cropTL.x + w, cropTL.y + h / 3);
    ctx.moveTo(cropTL.x, cropTL.y + (2 * h) / 3);
    ctx.lineTo(cropTL.x + w, cropTL.y + (2 * h) / 3);
    ctx.stroke();

    // Handles
    const handleSize = 8;
    const handles = [
      { x: cropTL.x, y: cropTL.y, mode: "resize-nw" },
      { x: cropBR.x, y: cropTL.y, mode: "resize-ne" },
      { x: cropTL.x, y: cropBR.y, mode: "resize-sw" },
      { x: cropBR.x, y: cropBR.y, mode: "resize-se" },
    ];
    ctx.fillStyle = "#60a5fa";
    handles.forEach((h) => {
      ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
    });

    ctx.restore();
    // Outline canvas
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H);
  };

  const pointNear = (a, b, d = 10) => Math.hypot(a.x - b.x, a.y - b.y) <= d;

  const determineDragMode = (canvasX, canvasY) => {
    const dx = Math.floor((CANVAS_W - imgEl.width * displayScale) / 2);
    const dy = Math.floor((CANVAS_H - imgEl.height * displayScale) / 2);
    const pt = { x: canvasX - dx, y: canvasY - dy };
    const tl = imgToCanvas({ x: crop.x, y: crop.y });
    const br = imgToCanvas({ x: crop.x + crop.w, y: crop.y + crop.h });
    const tr = { x: br.x, y: tl.y };
    const bl = { x: tl.x, y: br.y };

    if (pointNear(pt, tl)) return "resize-nw";
    if (pointNear(pt, tr)) return "resize-ne";
    if (pointNear(pt, bl)) return "resize-sw";
    if (pointNear(pt, br)) return "resize-se";
    // inside?
    if (pt.x >= tl.x && pt.x <= br.x && pt.y >= tl.y && pt.y <= br.y) return "move";
    return "draw";
  };

  const clampCropToImage = (c) => {
    if (!imgEl) return c;
    const nx = Math.max(0, Math.min(c.x, imgEl.width - 1));
    const ny = Math.max(0, Math.min(c.y, imgEl.height - 1));
    const nw = Math.max(1, Math.min(c.w, imgEl.width - nx));
    const nh = Math.max(1, Math.min(c.h, imgEl.height - ny));
    return { x: nx, y: ny, w: nw, h: nh };
  };

  const onMouseDown = (e) => {
    if (!imgEl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const mode = determineDragMode(cx, cy);
    setDragMode(mode);
    setIsDragging(true);
    dragStartRef.current = { cx, cy, crop: { ...crop } };
  };

  const onMouseMove = (e) => {
    if (!isDragging || !imgEl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dx = Math.floor((CANVAS_W - imgEl.width * displayScale) / 2);
    const dy = Math.floor((CANVAS_H - imgEl.height * displayScale) / 2);
    const start = dragStartRef.current;
    const aspectVal = getAspectValue();

    const startImgPt = canvasToImg({ x: start.cx - dx, y: start.cy - dy });
    const currImgPt = canvasToImg({ x: cx - dx, y: cy - dy });

    let newCrop = { ...crop };

    if (dragMode === "move") {
      const delta = { x: currImgPt.x - startImgPt.x, y: currImgPt.y - startImgPt.y };
      newCrop = clampCropToImage({
        x: start.crop.x + delta.x,
        y: start.crop.y + delta.y,
        w: start.crop.w,
        h: start.crop.h
      });
    } else if (dragMode.startsWith("resize")) {
      let { x, y, w, h } = start.crop;
      const fromRight = dragMode.endsWith("e");
      const fromBottom = dragMode.endsWith("s"); // 'se' or 'sw' has bottom
      const fromLeft = dragMode.endsWith("w");
      const fromTop = dragMode.endsWith("n");

      // Compute tentative new edges
      let left = x;
      let right = x + w;
      let top = y;
      let bottom = y + h;

      const ciX = currImgPt.x;
      const ciY = currImgPt.y;

      if (fromLeft) left = ciX;
      if (!fromLeft && fromRight) right = ciX;
      if (fromTop) top = ciY;
      if (!fromTop && fromBottom) bottom = ciY;

      // Maintain aspect ratio if locked
      if (aspectVal) {
        const targetW = right - left;
        const targetH = bottom - top;
        const curAspect = Math.abs(targetW) / Math.abs(targetH || 1);

        if (curAspect > aspectVal) {
          // too wide, adjust height
          const centerY = fromTop ? bottom : top;
          const newH = Math.abs(targetW) / aspectVal;
          if (fromTop) top = centerY - newH;
          else bottom = centerY + newH;
        } else {
          // too tall, adjust width
          const centerX = fromLeft ? right : left;
          const newW = Math.abs(targetH) * aspectVal;
          if (fromLeft) left = centerX - newW;
          else right = centerX + newW;
        }
      }

      // Normalize to x,y,w,h
      const nx = Math.min(left, right);
      const ny = Math.min(top, bottom);
      const nw = Math.abs(right - left);
      const nh = Math.abs(bottom - top);
      newCrop = clampCropToImage({ x: nx, y: ny, w: nw, h: nh });
    } else if (dragMode === "draw") {
      const nx = Math.min(startImgPt.x, currImgPt.x);
      const ny = Math.min(startImgPt.y, currImgPt.y);
      let nw = Math.abs(currImgPt.x - startImgPt.x);
      let nh = Math.abs(currImgPt.y - startImgPt.y);

      if (aspectVal) {
        // enforce aspect on draw
        const fromCenter = false;
        if (nw / (nh || 1) > aspectVal) {
          // too wide -> adjust height
          nh = nw / aspectVal;
        } else {
          // too tall -> adjust width
          nw = nh * aspectVal;
        }
        if (!fromCenter) {
          // keep nx, ny as mins
        }
      }

      newCrop = clampCropToImage({ x: nx, y: ny, w: nw, h: nh });
    }

    setCrop(newCrop);
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setDragMode("none");
  };

  const exportCroppedBlob = async () => {
    if (!imgEl) throw new Error("Image not loaded");
    const sx = Math.max(0, Math.floor(crop.x));
    const sy = Math.max(0, Math.floor(crop.y));
    const sw = Math.max(1, Math.floor(crop.w || imgEl.width));
    const sh = Math.max(1, Math.floor(crop.h || imgEl.height));

    let dw = sw;
    let dh = sh;
    if (outputW && Number(outputW) > 0) {
      dw = Math.floor(Number(outputW));
      if (outputH && Number(outputH) > 0) {
        dh = Math.floor(Number(outputH));
      } else {
        // Keep aspect
        dh = Math.floor(sw === 0 ? sh : dw * (sh / sw));
      }
    } else if (outputH && Number(outputH) > 0) {
      dh = Math.floor(Number(outputH));
      dw = Math.floor(sh === 0 ? sw : dh * (sw / sh));
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.width = Math.max(1, dw);
    outCanvas.height = Math.max(1, dh);
    const octx = outCanvas.getContext("2d");
    octx.imageSmoothingQuality = "high";
    octx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, dw, dh);

    return new Promise((resolve, reject) => {
      outCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate image blob"));
      }, "image/jpeg", 0.92);
    });
  };

  const saveToLibrary = async ({ alsoInsert }) => {
    if (!assignToUsername) {
      toast.error("Please select a username first.");
      return;
    }
    try {
      const blob = await exportCroppedBlob();
      const fileNameHint = `edited-${Date.now()}.jpg`;
      const file = new File([blob], fileNameHint, { type: "image/jpeg" });

      const { file_url } = await UploadFile({ file });
      const record = await ImageLibraryItem.create({
        url: file_url,
        alt_text: altText || "Edited image",
        source: "upload",
        tags: ["cropped", "resized"],
        user_name: assignToUsername,
      });

      toast.success("Image saved to library.");
      if (onLibrarySaved) onLibrarySaved(record);

      if (alsoInsert && onInsert) {
        const imageHtml = `<img src="${record.url}" alt="${record.alt_text}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;" />`;
        onInsert(imageHtml);
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save image.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl backdrop-blur-xl bg-white/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="w-5 h-5 text-blue-600" />
            Crop & Resize Image
          </DialogTitle>
          <DialogDescription>Edit the selection, choose aspect ratio and export size, then save.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative rounded-lg border bg-black/80 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={720}
              height={420}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              className="w-full h-auto cursor-crosshair"
              style={{ touchAction: "none" }}
            />
            {loadingImg && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading image...
              </div>
            )}
            {!imgEl && !loadingImg && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 p-6 text-center">
                <ImageIcon className="w-6 h-6 mr-2" /> Unable to load image preview
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1 block">Aspect ratio</Label>
              <Select value={aspect} onValueChange={setAspect}>
                <SelectTrigger><SelectValue placeholder="Aspect" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="4:3">4:3</SelectItem>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="3:2">3:2</SelectItem>
                  <SelectItem value="2:3">2:3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Output width (px)</Label>
              <Input type="number" min="1" value={outputW} onChange={(e) => setOutputW(e.target.value)} placeholder={`${Math.floor(crop.w || 0)}`} />
            </div>
            <div>
              <Label className="mb-1 block">Output height (px)</Label>
              <Input type="number" min="1" value={outputH} onChange={(e) => setOutputH(e.target.value)} placeholder={`${Math.floor(crop.h || 0)}`} />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Alt text</Label>
            <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image..." />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="outline" onClick={() => saveToLibrary({ alsoInsert: false })}>
              <Save className="w-4 h-4 mr-2" /> Save to Library
            </Button>
            <Button onClick={() => saveToLibrary({ alsoInsert: true })} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" /> Save & Insert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}