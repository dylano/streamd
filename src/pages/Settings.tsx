import { useSettings } from "../context/SettingsContext";
import { useUser } from "../context/UserContext";
import styles from "./Settings.module.css";

export function Settings() {
  const { settings, updateSetting } = useSettings();
  const { user, logout } = useUser();

  return (
    <div className={styles.page}>
      <h1>Settings</h1>

      <h2 className={styles.sectionTitle}>Preferences</h2>
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
            <span className={styles.settingLabel}>Use dark mode</span>
            <span className={styles.settingDesc}>Switch between light and dark appearance</span>
          </div>
          <button
            className={`${styles.toggle} ${settings.theme === "dark" ? styles.on : ""}`}
            onClick={() => updateSetting("theme", settings.theme === "dark" ? "light" : "dark")}
            type="button"
            aria-pressed={settings.theme === "dark"}
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Account</h2>
      <div className={styles.section}>
        <div className={styles.setting}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Logged in as {user?.name}</span>
            <span className={styles.settingDesc}>Switch to a different user</span>
          </div>
          <button className={styles.secondaryButton} onClick={logout} type="button">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
