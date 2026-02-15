import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Upload, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type AvatarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  isUploading: boolean;
};

export function AvatarModal({ isOpen, onClose, currentAvatarUrl, onUpload, onDelete, isUploading }: AvatarModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setSelectedFile(null);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!preview) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = async () => {
    if (!selectedFile || !preview) return;

    // Create cropped version using canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);

      // Clip to circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      ctx.drawImage(
        img,
        -w / 2 + position.x * scale,
        -h / 2 + position.y * scale,
        w,
        h,
      );
      ctx.restore();

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], selectedFile.name, { type: 'image/png' });
          onUpload(croppedFile);
        }
      }, 'image/png');
    };
    img.src = preview;
  };

  if (!isOpen) return null;

  const displayImage = preview || currentAvatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {preview ? 'Adjust Photo' : 'Profile Photo'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Preview area */}
          <div
            className="relative w-48 h-48 mx-auto rounded-full overflow-hidden bg-surface-100 dark:bg-surface-700 cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {displayImage ? (
              <img
                src={displayImage}
                alt="Avatar preview"
                className="absolute w-full h-full object-cover pointer-events-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: 'center center',
                }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-surface-400">
                <Camera size={48} />
              </div>
            )}
          </div>

          {/* Controls */}
          {preview && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
                title="Zoom out"
              >
                <ZoomOut size={20} />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 accent-primary-500"
              />
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
                title="Zoom in"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500"
                title="Rotate"
              >
                <RotateCw size={20} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-6">
            {!preview && (
              <>
                <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                  <Upload size={16} className="mr-2" /> Upload Photo
                </Button>
                {currentAvatarUrl && (
                  <Button
                    variant="outline"
                    onClick={() => { onDelete(); onClose(); }}
                    className="w-full text-danger-500 border-danger-300 hover:bg-danger-50 dark:hover:bg-danger-950/20"
                  >
                    <Trash2 size={16} className="mr-2" /> Remove Photo
                  </Button>
                )}
              </>
            )}

            {preview && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setPreview(null); setSelectedFile(null); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={isUploading} className="flex-1">
                  Save Photo
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
