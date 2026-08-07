import { useEffect } from "react";

export function useSmoothScroll() {
  useEffect(() => {
    // Implement ultra-smooth native scroll optimization
    // We avoid heavy libraries like Lenis/Locomotive if not strictly needed
    // to prevent the "white screen" issue often caused by transform-based scrolling
    
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Ensure the background color is forced on the root elements
    document.documentElement.style.backgroundColor = '#0a0a12';
    document.body.style.backgroundColor = '#0a0a12';

    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
}
