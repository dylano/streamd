import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

console.log(`StreamD | commit: ${__BUILD_COMMIT__} | built: ${__BUILD_TIME__}`);

async function startApp() {
  if (import.meta.env.VITE_USE_MOCK_SERVER === "true") {
    console.log("Starting MSW mock server...");
    const { worker } = await import("./test/mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
    console.log("MSW mock server started");
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void startApp();
