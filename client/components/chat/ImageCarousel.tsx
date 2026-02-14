import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: Array<{ url: string; index: number; alt?: string }>;
  className?: string;
}

export default function ImageCarousel({ images, className = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Debug logging
  console.log('📸 ImageCarousel rendering with images:', images);

  if (!images || images.length === 0) {
    console.log('⚠️ ImageCarousel: No images provided');
    return null;
  }

  // Single image - show with counter badge but no navigation controls
  if (images.length === 1) {
    console.log('📸 Rendering single image:', images[0]);
    return (
      <div className={`relative rounded-lg overflow-hidden bg-gray-100 border-4 border-purple-500 ${className}`}>
        <img
          src={images[0].url}
          alt={images[0].alt || `Image ${images[0].index}`}
          className="w-full h-auto max-h-[600px] object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
          }}
        />
        {/* Image Counter Badge - Always show even for single images */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium">
          1 / 1
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${className}`}>
      {/* Main Image Display */}
      <div className="relative">
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || `Image ${images[currentIndex].index}`}
          className="w-full h-auto max-h-[600px] object-contain transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Image Counter Badge */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all hover:scale-110"
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all hover:scale-110"
          aria-label="Next image"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 py-3 bg-gray-50">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-purple-600 w-6'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Thumbnail Strip (for 2-5 images) */}
      {images.length <= 5 && (
        <div className="flex gap-2 p-3 bg-gray-50 border-t border-gray-200 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-purple-600 ring-2 ring-purple-300'
                  : 'border-gray-300 hover:border-purple-400 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={`${image.url}?w=80&h=80&fit=crop`}
                alt={image.alt || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '0.3';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
