import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  code?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "We encountered an unexpected error. Please try again.", 
  retry, 
  action,
  code 
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center p-8"
    >
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      
      {code && (
        <p className="text-red-500 font-mono text-sm mb-2">{code}</p>
      )}
      
      {message && (
        <p className="text-white/60 max-w-md mb-6">{message}</p>
      )}
      
      <div className="flex gap-3">
        {retry && (
          <Button onClick={retry} className="bg-primary hover:bg-primary/90">
            Try Again
          </Button>
        )}
        
        {action && (
          <Button variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function NetworkErrorState({ retry }: { retry?: () => void }) {
  return (
    <ErrorState
      title="Network Connection Error"
      message="We're having trouble connecting to the server. Please check your internet connection and try again."
      retry={retry}
    />
  );
}

export function ServerErrorState({ retry }: { retry?: () => void }) {
  return (
    <ErrorState
      title="Server Error"
      message="The server is experiencing issues. We're working to fix it. Please try again later."
      retry={retry}
    />
  );
}

export function NotFoundErrorState() {
  return (
    <ErrorState
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      action={{
        label: "Go Home",
        onClick: () => window.location.href = "/"
      }}
    />
  );
}