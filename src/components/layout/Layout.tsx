import { Outlet } from "react-router-dom";
import { useShows } from "../../context/ShowsContext";
import { useAutoSync } from "../../hooks/useAutoSync";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import styles from "./Layout.module.css";

export function Layout() {
  const { refresh } = useShows();
  useAutoSync(refresh);

  return (
    <div className={styles.layout}>
      <Header />
      <Navigation />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
