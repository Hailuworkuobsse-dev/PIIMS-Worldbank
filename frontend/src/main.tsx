import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "@/app/providers";
import App from "@/App";
import "@/design/globals.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);

// Register service worker (PWA — offline support)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* silent — offline is a degradation, not a failure */
    });
  });
}