import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SEO } from '@/components/SEO';
import LoadingSpinner from '@/components/ui/loading-spinner';

const LazyMap = lazy(() => import('@/components/map/LiveMap'));
const LazyChat = lazy(() => import('@/components/social/MessagingHub'));
const LazyFeed = lazy(() => import('@/components/social/Feed'));

const useIntersectionObserver = (callback: IntersectionObserverCallback) => {
  const observerRef = React.useRef<IntersectionObserver>();
  
  React.useEffect(() => {
    observerRef.current = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [callback]);
  
  return observerRef.current;
};
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className, 
  loading = 'lazy',
  sizes 
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const observer = useIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && imgRef.current) {
        imgRef.current.src = entry.target.getAttribute('data-src') || src;
      }
    });
  });

  React.useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      imgRef.current.setAttribute('data-src', src);
      observer?.observe(imgRef.current);
    }
  }, [loading, observer]);

  if (hasError) {
    return <div className={`bg-gray-200 ${className}`}>{alt}</div>;
  }

  return (
    <img
      ref={imgRef}
      src={loading === 'lazy' ? undefined : src}
      alt={alt}
      className={className}
      loading={loading}
      sizes={sizes}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

// Performance optimized hook for debounced operations
const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  
  return React.useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Virtual scrolling component for large lists
interface VirtualListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

const VirtualList: React.FC<VirtualListProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleItems = items.slice(startIndex, startIndex + visibleCount + 1);
  
  const handleScroll = useDebouncedCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // 60fps throttling
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div 
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            width: '100%'
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Bundle splitting utilities
export const lazyLoadComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return lazy(() => importFunc().then(module => ({ default: module.default })));
};

// Critical CSS optimization
const criticalCSS = `
  /* Critical rendering path optimizations */
  .will-change-transform { 
    will-change: transform; 
  }
  
  /* GPU acceleration hints */
  .gpu-accelerated {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }
  
  /* Contain paint for animations */
  .contain-paint {
    contain: paint;
  }
  
  /* Optimize images */
  img {
    content-visibility: auto;
  }
  
  /* Smooth scrolling */
  .smooth-scroll {
    scroll-behavior: smooth;
    scroll-padding-top: 100px;
  }
`;

// Performance monitoring hook
export const usePerformanceOptimizations = () => {
  React.useEffect(() => {
    // Inject critical CSS
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
    
    // Preload critical resources
    const preloadLinks = [
      '/hup-logo.png',
      '/fonts/space-grotesk-v22.woff2',
      '/fonts/outfit-v15.woff2'
    ];
    
    preloadLinks.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = href.endsWith('.woff2') ? 'font' : 'image';
      link.href = href;
      document.head.appendChild(link);
    });
    
    // Monitor performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return { OptimizedImage, VirtualList, lazyLoadComponent };
};

export default function PerformanceOptimizedLayout({
  children,
  title = 'SocialOS - Your God Mode Social Experience',
  description = 'Connect, create, and monetize in the ultimate social platform.',
  keywords = 'social media, dating, networking, AI matchmaking'
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
}) {
  return (
    <ErrorBoundary>
      <SEO 
        title={title}
        description={description}
        keywords={keywords}
      />
      
      <Suspense fallback={<LoadingSpinner />}>
        <div className="min-h-screen">
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          
          {/* Preload critical components */}
          <div style={{ display: 'none' }}>
            <LazyMap />
            <LazyChat />
            <LazyFeed />
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}