import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { api } from "../api/client";
import styles from "./Settings.module.css";

export function Settings() {
  const { settings, updateSetting } = useSettings();
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  async function handleResetDatabase() {
    if (!confirm("This will delete all your shows and episodes. Are you sure?")) {
      return;
    }
    setResetting(true);
    try {
      await api.post("/dev/reset", {});
      navigate("/");
      window.location.reload();
    } catch {
      alert("Failed to reset database");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1>Settings</h1>

      <div className={styles.section}>
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Display trending shows</span>
            <span className={styles.settingDesc}>Display trending shows on the dashboard</span>
          </div>
          <button
            className={`${styles.toggle} ${settings.showTrending ? styles.on : ""}`}
            onClick={() => updateSetting("showTrending", !settings.showTrending)}
            type="button"
            aria-pressed={settings.showTrending}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Theme</span>
            <span className={styles.settingDesc}>Choose your preferred appearance</span>
          </div>
          <select
            className={styles.select}
            value={settings.theme}
            onChange={(e) => updateSetting("theme", e.target.value as "system" | "light" | "dark")}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Developer</h2>
      <div className={styles.section}>
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Reset Database</span>
            <span className={styles.settingDesc}>Delete all shows and episodes</span>
          </div>
          <button
            className={styles.dangerButton}
            onClick={handleResetDatabase}
            disabled={resetting}
            type="button"
          >
            {resetting ? "Resetting..." : "Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}
