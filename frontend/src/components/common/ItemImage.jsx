import React, { useState } from 'react';
import { ZoomIn, X, Image as ImageIcon, Eye } from 'lucide-react';
import { getItemImageUrl } from '../../utils/helpers';

const ItemImage = ({
  src,
  category = 'Other',
  alt = 'Item Photo',
  className = 'w-12 h-12 rounded-lg object-cover',
  containerClassName = '',
  showZoomButton = true,
  title = '',
  subtitle = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = imageError ? getItemImageUrl(null, category) : getItemImageUrl(src, category);

  return (
    <>
      <div className={`relative group cursor-pointer inline-block ${containerClassName}`} onClick={() => setIsOpen(true)}>
        <img
          src={imageUrl}
          alt={alt}
          onError={() => setImageError(true)}
          className={`${className} border border-gray-200 shadow-xs transition-transform duration-200 group-hover:scale-105`}
          loading="lazy"
        />
        {showZoomButton && (
          <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <ZoomIn size={16} />
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{title || alt}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Full Image) */}
            <div className="p-4 bg-gray-900/5 flex items-center justify-center overflow-auto max-h-[70vh]">
              <img
                src={imageUrl}
                alt={alt}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-md"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
              <span className="font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                {category}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemImage;
