import { useState, useEffect, useCallback } from "react";

type NavState = { cursor: number; scrollOffset: number };

export function useNavigation(reposLength: number, visibleCount: number) {
  const [nav, setNav] = useState<NavState>({ cursor: 0, scrollOffset: 0 });
  const { cursor, scrollOffset } = nav;

  // On terminal resize, clamp scrollOffset so cursor stays visible
  useEffect(() => {
    setNav((prev) => {
      let { scrollOffset } = prev;
      if (prev.cursor < scrollOffset) scrollOffset = prev.cursor;
      else if (prev.cursor >= scrollOffset + visibleCount) scrollOffset = prev.cursor - visibleCount + 1;
      return scrollOffset === prev.scrollOffset ? prev : { ...prev, scrollOffset };
    });
  }, [visibleCount]);

  // Single atomic nav update — one setState, one render, no jitter.
  // useCallback keeps the reference stable so useInput doesn't re-subscribe every render.
  const moveCursor = useCallback((delta: number) => {
    setNav((prev) => {
      const cursor = Math.max(0, Math.min(reposLength - 1, prev.cursor + delta));
      let scrollOffset = prev.scrollOffset;
      if (cursor < scrollOffset) scrollOffset = cursor;
      else if (cursor >= scrollOffset + visibleCount) scrollOffset = cursor - visibleCount + 1;
      return { cursor, scrollOffset };
    });
  }, [reposLength, visibleCount]);

  const resetNav = useCallback(() => {
    setNav({ cursor: 0, scrollOffset: 0 });
  }, []);

  return { cursor, scrollOffset, moveCursor, resetNav, setNav };
}
