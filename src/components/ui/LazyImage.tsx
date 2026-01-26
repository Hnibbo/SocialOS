import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%231e1b4b" opacity="0.3"/%3E%3Ctext x="50%%" y="50%%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="system-ui" font-size="16"%3ELoading...%3C/text%3E%3C/svg%3E',
  fallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%231e1b4b" opacity="0.3"/%3E%3Ctext x="50%%" y="50%%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="system-ui" font-size="16"%3EImage not available%3C/text%3E%3C/svg%3E',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  priority = false
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority) {
      setIsLoading(true);
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        setImageSrc(fallback);
        setIsLoading(false);
        setHasError(true);
      };
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoading(true);
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };
            img.onerror = () => {
              setImageSrc(fallback);
              setIsLoading(false);
              setHasError(true);
            };
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src, priority, fallback]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <ImageIcon className="w-6 h-6 text-red-500" />
        </div>
      )}

      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full transition-all duration-300 ${
          isLoading ? 'opacity-0 blur-sm' : 'opacity-100 blur-0'
        }`}
        style={{ objectFit }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </motion.div>
  );
}