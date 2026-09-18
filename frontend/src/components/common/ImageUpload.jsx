import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, X, Image as ImageIcon, Camera, Link as LinkIcon, 
  Check, RefreshCw, ZoomIn
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Client-side image compressor: keeps image quality crisp while keeping payload lightweight (<200KB)
const compressImage = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        // If still > 350KB, compress with slightly lower quality
        if (dataUrl.length > 350 * 1024) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.60);
        }
        resolve(dataUrl);
      };
      img.onerror = () => {
        if (file.size > 2 * 1024 * 1024) {
          reject(new Error('Image is too large to process. Please select a smaller photo.'));
        } else {
          resolve(event.target.result);
        }
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

const ImageUpload = ({ 
  onImageSelect, 
  previewUrl, 
  label = "Item Photo (Required)", 
  required = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(previewUrl || null);
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'camera' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [sourceType, setSourceType] = useState(previewUrl ? 'existing' : null);
  const [processing, setProcessing] = useState(false);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const inputRef = useRef(null);

  // Sync previewUrl prop if it changes
  useEffect(() => {
    if (previewUrl && previewUrl !== preview) {
      setPreview(previewUrl);
    }
  }, [previewUrl]);

  // Clean up camera stream when component unmounts or camera mode stops
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Listen to Global Paste Event (Ctrl+V) when user pastes an image
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            toast.success('Pasted photo from clipboard!');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    if (!file.type.match('image.*')) {
      toast.error('Please upload an image file (JPEG, PNG, WEBP, etc)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be less than 8MB');
      return;
    }

    setProcessing(true);
    try {
      const compressedDataUrl = await compressImage(file);
      setPreview(compressedDataUrl);
      setSourceType('file');
      if (onImageSelect) onImageSelect(file, compressedDataUrl);
    } catch (err) {
      if (file.size <= 1.5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
          setSourceType('file');
          if (onImageSelect) onImageSelect(file, reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error(err.message || 'Image is too large. Please select a smaller photo.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPreview(null);
    setSourceType(null);
    setUrlInput('');
    stopCamera();
    if (inputRef.current) inputRef.current.value = "";
    if (onImageSelect) onImageSelect(null, null);
  };

  // Camera Capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Camera access denied or unavailable. Please use file upload.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setPreview(dataUrl);
        setSourceType('camera');
        stopCamera();
        if (onImageSelect) onImageSelect(file, dataUrl);
        toast.success('Live photo captured successfully!');
      }
    }, 'image/jpeg', 0.75);
  };

  // URL Input
  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }
    setPreview(urlInput.trim());
    setSourceType('url');
    if (onImageSelect) onImageSelect(urlInput.trim(), urlInput.trim());
    toast.success('Custom image URL applied!');
  };

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {preview && (
          <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-medium border border-green-200">
            Photo Attached
          </span>
        )}
      </div>

      {preview ? (
        /* Image Preview Card */
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-900 group">
          <img 
            src={preview} 
            alt="Uploaded Preview" 
            className="w-full h-56 object-cover sm:object-contain bg-gray-950/20 transition-all duration-300 group-hover:scale-102" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none"></div>

          {/* Top action pill */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs">
            <Check size={14} className="text-green-400" />
            <span>Photo Attached</span>
          </div>

          {/* Clear button */}
          <button 
            type="button"
            onClick={clearImage}
            className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors shadow-md"
            title="Remove photo"
          >
            <X size={16} />
          </button>

          {/* Bottom replace actions */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={clearImage}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1"
            >
              <RefreshCw size={13} />
              Replace Photo
            </button>
          </div>
        </div>
      ) : (
        /* Multi-mode Upload Area */
        <div className="space-y-3">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => { setActiveMode('upload'); stopCamera(); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'upload' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UploadCloud size={14} /> Upload File
            </button>

            <button
              type="button"
              onClick={() => { setActiveMode('camera'); startCamera(); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'camera' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera size={14} /> Take Live Photo
            </button>

            <button
              type="button"
              onClick={() => { setActiveMode('url'); stopCamera(); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'url' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LinkIcon size={14} /> Image URL
            </button>
          </div>

          {/* Mode 1: File Upload Dropzone */}
          {activeMode === 'upload' && (
            <div 
              className={`relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none
                ${dragActive 
                  ? 'border-green-500 bg-green-50/70 scale-[0.99]' 
                  : 'border-gray-300 bg-gray-50/60 hover:bg-gray-100/80 hover:border-green-400'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="p-3 bg-white rounded-full shadow-xs border border-gray-200 mb-2">
                <UploadCloud className={`w-6 h-6 ${dragActive ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <p className="text-sm font-semibold text-gray-800 text-center">
                {processing ? 'Processing photo...' : 'Click to browse photo or drag & drop here'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                PNG, JPG, JPEG or WEBP (Max 8MB) &bull; Paste with <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-mono">Ctrl+V</kbd>
              </p>
              <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleChange}
              />
            </div>
          )}

          {/* Mode 2: Live Camera Snapper */}
          {activeMode === 'camera' && (
            <div className="bg-gray-900 rounded-2xl overflow-hidden p-4 text-white space-y-3 border border-gray-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-blue-400">
                  <Camera size={15} /> Device Camera Live Stream
                </span>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Camera size={16} /> Snap & Use This Photo
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Direct URL Input */}
          {activeMode === 'url' && (
            <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <LinkIcon size={14} className="text-purple-600" />
                <span>Paste Web Image Link</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-purple-300 rounded-xl text-xs focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
