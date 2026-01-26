import React, { useState, useEffect } from 'react';
import { Search, Sparkles, User, FileText, Hash, MapPin, Users } from 'lucide-react';
import { useAISearch } from '@/hooks/useAISearch';

interface AISearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  onSearch: (query: string) => void;
}

export const AISearchSuggestions: React.FC<AISearchSuggestionsProps> = ({
  query,
  onSuggestionClick,
  onSearch
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { searchSuggestions } = useAISearch();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const aiSuggestions = await searchSuggestions(query);
        setSuggestions(aiSuggestions.slice(0, 5));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [query, searchSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick(suggestion);
    setSuggestions([]);
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
      setSuggestions([]);
    }
  };

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Suggestions</span>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Generating suggestions...</p>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full p-3 text-left hover:bg-primary/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {suggestion}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="p-3 border-t border-white/5 bg-black/60">
          <button
            onClick={handleSearch}
            className="w-full py-2 px-3 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-bold transition-colors"
          >
            Search for "{query}"
          </button>
        </div>
      )}
    </div>
  );
};
