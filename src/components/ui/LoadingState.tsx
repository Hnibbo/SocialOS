import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export function LoadingState({ 
  size = "md", 
  text = "Loading...", 
  fullScreen = false 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const textClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const container = fullScreen ? (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
          {text && <p className={`${textClasses[size]} text-white/80`}>{text}</p>}
        </motion.div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <p className={`${textClasses[size]} text-white/80 mt-2`}>{text}</p>}
    </div>
  );

  return container;
}

export function SkeletonLoader({ count = 3, height = "h-4" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className={`${height} w-full bg-white/10 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
        <div className="h-4 bg-white/10 rounded w-4/6" />
      </div>
    </div>
  );
}