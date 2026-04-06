import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

console.log(`StreamD | commit: ${__BUILD_COMMIT__} | built: ${__BUILD_TIME__}`);

async function startApp() {
  if (import.meta.env.VITE_USE_MOCK_SERVER === "true") {
    const { worker } = await import("./test/mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

startApp();
