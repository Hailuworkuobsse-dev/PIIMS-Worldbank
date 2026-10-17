import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import { i18n } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/Toast";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { GlobalLoadingBar } from "./GlobalLoadingBar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 3;
      },
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst",
    },
    mutations: { retry: 0 },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <GlobalLoadingBar />
            {children}
            <UpdatePrompt />
            {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}