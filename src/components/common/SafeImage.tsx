import React, { useState, useEffect } from 'react';
import { Coffee, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useStoredImage } from '../../hooks/useStoredImage';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  imageId?: string | null;
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  showSkeleton?: boolean;
}

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80';

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  imageId,
  alt = 'SECRETpresso image',
  className = '',
  fallbackSrc,
  fallbackIcon,
  showSkeleton = true,
  style,
  ...props
}) => {
  // Determine if we should query IndexedDB or direct URL
  const targetIdentifier = imageId || src || null;
  const { imageUrl: resolvedStoredUrl, isLoading: isStoredLoading, error: storedError, isStored } =
    useStoredImage(targetIdentifier);

  const [hasError, setHasError] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isStored) {
      if (resolvedStoredUrl) {
        setCurrentSrc(resolvedStoredUrl);
        setHasError(false);
        setIsImgLoaded(false);
      } else if (storedError) {
        setHasError(true);
        setCurrentSrc(fallbackSrc || null);
      }
    } else {
      if (!src || typeof src !== 'string' || src.trim() === '') {
        setCurrentSrc(fallbackSrc || null);
        setHasError(!fallbackSrc);
        setIsImgLoaded(true);
      } else {
        setCurrentSrc(src.trim());
        setHasError(false);
        setIsImgLoaded(false);
      }
    }
  }, [src, imageId, resolvedStoredUrl, isStored, storedError, fallbackSrc]);

  const handleImgError = () => {
    if (!hasError && fallbackSrc && fallbackSrc !== currentSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
      setIsImgLoaded(true);
    }
  };

  // 1. Loading state from IndexedDB
  if (isStoredLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#1A120D] text-[#8C6D3B] p-2 animate-pulse ${className}`}
        style={style}
        role="status"
        aria-label="Loading image..."
      >
        <Loader2 className="w-5 h-5 animate-spin text-[#CFA851] opacity-70 mb-1" />
        <span className="text-[9px] font-mono tracking-wider uppercase text-[#A08875]">
          Loading image...
        </span>
      </div>
    );
  }

  // 2. Error / Unavailable state
  if (!currentSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#1A120D] text-[#8C6D3B]/70 p-3 ${className}`}
        style={style}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        {fallbackIcon || <Coffee className="w-7 h-7 opacity-40 mb-1" />}
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#A08875] text-center line-clamp-1 opacity-80">
          Image unavailable
        </span>
      </div>
    );
  }

  // 3. Render image with smooth fade-in
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {showSkeleton && !isImgLoaded && (
        <div className="absolute inset-0 bg-[#24160F] animate-pulse z-0 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-[#8C6D3B]/30" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsImgLoaded(true)}
        onError={handleImgError}
        className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
          isImgLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
