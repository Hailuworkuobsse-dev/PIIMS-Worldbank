import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null, // manual registration in main.tsx
      includeAssets: ["icons/*.png", "offline.html"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/api/, /^\/v1/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.piims\.gov\.et\/v1\/projects(\?.*)?$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "piims-projects",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern:
              /^https:\/\/api\.piims\.gov\.et\/v1\/beneficiaries(\?.*)?$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "piims-beneficiaries",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 12 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.piims\.gov\.et\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "piims-api-misc",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 6 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|woff2)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "piims-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "piims-map-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      manifest: {
        name: "PIIMS — Project Inception Information Management System",
        short_name: "PIIMS",
        description:
          "World Bank–financed project inception and impact evaluation system",
        theme_color: "#0B1E3D",
        background_color: "#F8FAFC",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "en",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Dashboard",
            url: "/dashboard",
            description: "Open dashboard",
          },
          {
            name: "Projects",
            url: "/projects",
            description: "View project registry",
          },
          {
            name: "Field Collection",
            url: "/impact/field",
            description: "Start field interview",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 3414,
    proxy: {
      "/api": { target: "http://localhost:3413", changeOrigin: true },
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react-router")) return "react-router";
            if (id.includes("react")) return "react-vendor";
            if (id.includes("@tanstack")) return "query";
            if (id.includes("i18next")) return "i18n";
            if (id.includes("leaflet") || id.includes("react-leaflet"))
              return "map";
            if (id.includes("lucide")) return "icons";
            return "vendor";
          }
          // Per-feature chunks
          if (id.includes("/features/projects/")) return "feature-projects";
          if (id.includes("/features/inception/")) return "feature-inception";
          if (id.includes("/features/results/")) return "feature-results";
          if (id.includes("/features/financial/")) return "feature-financial";
          if (id.includes("/features/procurement/"))
            return "feature-procurement";
          if (id.includes("/features/supplier/")) return "feature-supplier";
          if (id.includes("/features/beneficiaries/"))
            return "feature-beneficiaries";
          if (id.includes("/features/geo/")) return "feature-geo";
          if (id.includes("/features/documents/")) return "feature-documents";
          if (id.includes("/features/grievances/")) return "feature-grievances";
          if (id.includes("/features/impact-indicators/"))
            return "feature-impact-indicators";
          if (id.includes("/features/survey/")) return "feature-survey";
          if (id.includes("/features/field/")) return "feature-field";
          if (id.includes("/features/qa/")) return "feature-qa";
          if (id.includes("/features/warehouse/")) return "feature-warehouse";
          if (id.includes("/features/analytics/")) return "feature-analytics";
          if (id.includes("/features/admin/")) return "feature-admin";
          if (id.includes("/components/ui/")) return "ui";
        },
      },
    },
  },
});