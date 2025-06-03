import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Add a small delay to ensure content is rendered before scrolling
    const timer = setTimeout(() => {
      // Try scrolling the document.documentElement
      document.documentElement.scrollTo(0, 0);
      // Also try window.scrollTo as a fallback/alternative
      window.scrollTo(0, 0);
    }, 100); // Increased delay to 100ms

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

export default ScrollToTop; 