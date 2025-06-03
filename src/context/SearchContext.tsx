import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  submitSearch: () => void;
  resetSearch: () => void;
  triggerScrollOnEnter: boolean;
  setTriggerScrollOnEnter: (value: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState(''); // For dynamic input and API calls
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [triggerScrollOnEnter, setTriggerScrollOnEnter] = useState(false); // Controls scroll after Enter
  const location = useLocation();

  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setTriggerScrollOnEnter(false); // Reset scroll trigger
  }, []);

  const submitSearch = useCallback(() => {
    setIsSearchOpen(false);
    setTriggerScrollOnEnter(true); // Indicate a search was explicitly submitted (trigger scroll)
  }, []);

  useEffect(() => {
    // Reset search state when navigating to a new page
    // Using setTimeout to ensure it resets after route transition completes if needed
    const timer = setTimeout(() => {
        resetSearch();
    }, 50); 
    return () => clearTimeout(timer);
  }, [location.pathname, resetSearch]);

  return (
    <SearchContext.Provider value={{
      searchQuery,
      setSearchQuery,
      isSearchOpen,
      setIsSearchOpen,
      submitSearch,
      resetSearch,
      triggerScrollOnEnter,
      setTriggerScrollOnEnter,
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 