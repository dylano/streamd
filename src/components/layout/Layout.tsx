import { useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useShows } from "../../context/ShowsContext";
import { useAutoSync } from "../../hooks/useAutoSync";
import { useSwipeNavigation } from "../../hooks/useSwipeNavigation";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import styles from "./Layout.module.css";

export function Layout() {
  const { refresh } = useShows();
  useAutoSync(refresh);
  const mainRef = useRef<HTMLElement>(null);
  const slideDirection = useSwipeNavigation(mainRef);
  const { pathname } = useLocation();

  const slideClass =
    slideDirection === "left"
      ? styles.slideLeft
      : slideDirection === "right"
        ? styles.slideRight
        : "";

  return (
    <div className={styles.layout}>
      <Header />
      <Navigation />
      <main
        ref={mainRef}
        key={slideDirection ? pathname : undefined}
        className={`${styles.main} ${slideClass}`}
        onAnimationEnd={() => {
          const el = mainRef.current;
          if (el) {
            el.classList.remove(styles.slideLeft, styles.slideRight);
          }
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
