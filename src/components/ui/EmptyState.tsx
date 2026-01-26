import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  image?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  image 
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center p-8"
    >
      {image ? (
        <div className="w-32 h-32 mb-6 opacity-50">
          <img src={image} alt="Empty state" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-white/50" />
        </div>
      )}
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      
      {description && (
        <p className="text-white/60 max-w-md mb-6">{description}</p>
      )}
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

export function EmptyFeedState() {
  return (
    <EmptyState
      icon={() => (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
      title="No posts yet"
      description="Be the first to share something with your network. Start a new post to get things rolling!"
      action={{
        label: "Create Post",
        onClick: () => console.log("Create post clicked")
      }}
    />
  );
}

export function EmptyMessagesState() {
  return (
    <EmptyState
      icon={() => (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )}
      title="No messages"
      description="Your inbox is empty. Start a conversation with someone new or check back later!"
    />
  );
}

export function EmptySearchState() {
  return (
    <EmptyState
      icon={() => (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}
      title="No results found"
      description="We couldn't find anything matching your search. Try different keywords or adjust your filters."
    />
  );
}