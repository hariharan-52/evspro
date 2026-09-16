import React, { useState, useEffect } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, 
  Download, Copy, Check, X, Image as ImageIcon, Sparkles, RefreshCw
} from 'lucide-react';
import { getItemImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ItemImage = ({
  src,
  category = 'Other',
  alt = 'Item Photo',
  className = 'w-12 h-12 rounded-lg object-cover',
  containerClassName = '',
  showZoomButton = true,
  title = '',
  subtitle = '',
  condition = '',
  quantity = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // When src changes, reset error & loading state
  useEffect(() => {
    setImageError(false);
    setLoading(true);
  }, [src, category]);

  const imageUrl = imageError ? getItemImageUrl(null, category) : getItemImageUrl(src, category);

  // Reset transform state when modal opens/closes
  const handleOpen = (e) => {
    if (e) e.stopPropagation();
    setZoomScale(1);
    setRotation(0);
    setIsFullscreen(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setZoomScale(1);
    setRotation(0);
    setIsFullscreen(false);
  };

  // Keyboard navigation for zoom modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === '+' || e.key === '=') setZoomScale((prev) => Math.min(prev + 0.25, 3));
      if (e.key === '-') setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
      if (e.key === 'r' || e.key === 'R') setRotation((prev) => (prev + 90) % 360);
      if (e.key === '0') {
        setZoomScale(1);
        setRotation(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setZoomScale(1);
    setRotation(0);
  };

  const handleRotate = (e) => {
    e.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      toast.success('Image link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = imageUrl;
    a.target = '_blank';
    a.download = `${(title || alt || 'ecodonate-item').toLowerCase().replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Downloading photo...');
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    setIsFullscreen((prev) => !prev);
  };

  return (
    <>
      <div 
        className={`relative group cursor-pointer inline-block overflow-hidden rounded-xl ${containerClassName}`} 
        onClick={handleOpen}
        title="Click to inspect photo in high resolution"
      >
        <img
          src={imageUrl}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => {
            setImageError(true);
            setLoading(false);
          }}
          className={`${className} border border-gray-200/80 shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:brightness-95`}
          loading="lazy"
        />
        {showZoomButton && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white p-1">
            <ZoomIn size={16} className="drop-shadow-md animate-pulse" />
            <span className="text-[10px] font-medium tracking-tight mt-0.5 opacity-90">Inspect</span>
          </div>
        )}
      </div>

      {/* Interactive Lightbox / Inspection Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-gray-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-opacity"
          onClick={handleClose}
        >
          <div 
            className={`relative bg-gray-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col transition-all duration-200 ${
              isFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' : 'max-w-4xl w-full max-h-[92vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-900/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-100 text-sm sm:text-base leading-snug">{title || alt}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold text-green-400 bg-green-950/80 px-2 py-0.5 rounded border border-green-800/60">
                      {category}
                    </span>
                    {condition && (
                      <span className="text-[11px] font-medium text-gray-300 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                        Condition: {condition}
                      </span>
                    )}
                    {quantity && (
                      <span className="text-[11px] font-medium text-gray-300 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                        Qty: {quantity}
                      </span>
                    )}
                    {subtitle && <span className="text-xs text-gray-400 hidden sm:inline">&bull; {subtitle}</span>}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors ml-2"
                title="Close (ESC)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Image Stage */}
            <div className="relative flex-1 bg-black/60 flex items-center justify-center overflow-hidden min-h-[320px] max-h-[68vh] p-4 select-none">
              <div 
                className="transition-transform duration-200 ease-out flex items-center justify-center w-full h-full"
                style={{
                  transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={imageUrl}
                  alt={alt}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-2xl transition-all"
                  draggable={false}
                />
              </div>

              {/* Scale Indicator Badge */}
              {zoomScale !== 1 && (
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md border border-white/10 font-mono">
                  {Math.round(zoomScale * 100)}%
                </div>
              )}
            </div>

            {/* Interactive Control Toolbar */}
            <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Zoom & Inspection Controls */}
              <div className="flex items-center gap-1.5 bg-gray-800/80 p-1 rounded-xl border border-gray-700">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 0.5}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-30 transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="px-2 text-gray-300 font-mono font-medium min-w-[42px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 3}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-30 transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
                <button
                  onClick={handleRotate}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                  title="Rotate 90° (R)"
                >
                  <RotateCw size={15} />
                  <span className="hidden sm:inline text-[11px]">Rotate</span>
                </button>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-[11px] font-medium px-2"
                  title="Reset view (0)"
                >
                  Reset
                </button>
              </div>

              {/* Utility Actions (Copy link, Download, Fullscreen, Close) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors flex items-center gap-1.5 border border-gray-700"
                  title="Copy Image URL"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors flex items-center gap-1.5 border border-gray-700"
                  title="Download Image"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemImage;
