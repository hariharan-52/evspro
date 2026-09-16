import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, X, Image as ImageIcon, Camera, Link as LinkIcon, 
  Sparkles, Check, RefreshCw, ZoomIn, Eye, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CATEGORY_PRESET_IMAGES } from '../../utils/helpers';

const ImageUpload = ({ 
  onImageSelect, 
  previewUrl, 
  label = "Item Photo (Required)", 
  category = 'Other',
  required = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(previewUrl || null);
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'preset' | 'camera' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [sourceType, setSourceType] = useState(previewUrl ? 'existing' : null); // 'file' | 'preset' | 'camera' | 'url'
  
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

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.match('image.*')) {
      toast.error('Please upload an image file (jpeg, png, webp, etc)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setSourceType('file');
      if (onImageSelect) onImageSelect(file, reader.result);
    };
    reader.readAsDataURL(file);
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

  // Preset Selection
  const handleSelectPreset = (presetUrl, label) => {
    setPreview(presetUrl);
    setSourceType('preset');
    if (onImageSelect) onImageSelect(presetUrl, presetUrl);
    toast.success(`Selected "${label}" sample item photo`);
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
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreview(dataUrl);
        setSourceType('camera');
        stopCamera();
        if (onImageSelect) onImageSelect(file, dataUrl);
        toast.success('Live photo captured successfully!');
      }
    }, 'image/jpeg', 0.9);
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

  const currentPresets = CATEGORY_PRESET_IMAGES[category] || CATEGORY_PRESET_IMAGES['Furniture'] || [];

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {preview && (
          <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-md font-medium border border-green-200">
            Photo Ready {sourceType && `(${sourceType})`}
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
            <span>Photo Selected</span>
          </div>

          {/* Clear button */}
          <button 
            type="button"
            onClick={clearImage}
            className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors shadow-md"
            title="Remove and choose another photo"
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
              Change Photo
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
              onClick={() => { setActiveMode('preset'); stopCamera(); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeMode === 'preset' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles size={14} className="text-green-600" /> Quick Sample Photos
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
                Click to browse photo or drag & drop here
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                PNG, JPG, JPEG or WEBP (Max 5MB) &bull; Paste with <kbd className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-mono">Ctrl+V</kbd>
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

          {/* Mode 2: Quick Category Sample Presets */}
          {activeMode === 'preset' && (
            <div className="bg-green-50/50 border border-green-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-900">
                  <Sparkles size={15} className="text-green-600" />
                  <span>Select an Authentic Photo for "{category}"</span>
                </div>
                <span className="text-[11px] text-green-700">1-click select</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {currentPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url, preset.label)}
                    className="group relative rounded-xl overflow-hidden border border-green-200 bg-white hover:border-green-600 hover:shadow-md transition-all text-left flex flex-col"
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.label} 
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform" 
                    />
                    <div className="p-1.5 bg-white flex-1 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-800 line-clamp-1">
                        {preset.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: Live Camera Snapper */}
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

          {/* Mode 4: Direct URL Input */}
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
