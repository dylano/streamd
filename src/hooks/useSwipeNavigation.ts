import { useRef, useEffect, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export type SlideDirection = "left" | "right" | null;

const SWIPE_ROUTES = ["/", "/watchlist"];
const SWIPE_THRESHOLD = 60;
const SWIPE_MAX_Y = 80;

function getRouteIndex(pathname: string): number {
  const exact = SWIPE_ROUTES.indexOf(pathname);
  if (exact !== -1) return exact;
  if (pathname.startsWith("/show/")) return 1;
  return -1;
}

export function useSwipeNavigation(ref: React.RefObject<HTMLElement | null>): SlideDirection {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const [direction, setDirection] = useState<SlideDirection>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const idx = getRouteIndex(pathname);
      if (idx === -1) return;

      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current);

      if (dy > SWIPE_MAX_Y || Math.abs(dx) < SWIPE_THRESHOLD) return;

      if (dx < 0 && idx < SWIPE_ROUTES.length - 1) {
        setDirection("left");
        navigate(SWIPE_ROUTES[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        setDirection("right");
        navigate(SWIPE_ROUTES[idx - 1]);
      }
    },
    [pathname, navigate],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, handleTouchStart, handleTouchEnd]);

  return direction;
}
