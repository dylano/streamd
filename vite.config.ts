import { defineConfig } from "vite-plus";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { execSync } from "child_process";
import pkg from "./package.json" with { type: "json" };

function getGitCommit() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

// https://vite.dev/config/
export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    plugins: ["typescript", "react"],
    ignorePatterns: ["dist", "**/*.test.{ts,tsx}", "**/test/**"],
    rules: {
      "no-undef": "off", // TypeScript handles this
    },
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_COMMIT__: JSON.stringify(getGitCommit()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8788",
        changeOrigin: true,
      },
    },
  },
});
