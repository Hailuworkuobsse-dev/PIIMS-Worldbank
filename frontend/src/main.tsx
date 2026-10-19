import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "@/app/providers";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import App from "@/App";
import { registerServiceWorker } from "@/lib/pwa/registerSW";
import "@/design/globals.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>,
);

registerServiceWorker();