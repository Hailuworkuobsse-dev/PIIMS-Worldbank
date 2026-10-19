import axios, { AxiosError, type AxiosInstance } from "axios";
import { APP_CONFIG } from "@/app/config";
import { useAuthStore } from "@/stores/auth.store";

export const api: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 30_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers[APP_CONFIG.correlationHeader] = crypto.randomUUID();
  if (config.method && ["post", "put", "patch"].includes(config.method)) {
    config.headers[APP_CONFIG.idempotencyHeader] ??= crypto.randomUUID();
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const { response, config } = error;
    if (response?.status === 401 && config) {
      const url = config.url ?? "";
      const isAuthEntry = [
        "/auth/login",
        "/auth/mfa/verify",
        "/auth/refresh",
        "/auth/password-reset",
      ].some((path) => url.includes(path));
      const original = config as typeof config & { _piimsRetried?: boolean };
      if (!isAuthEntry && !original._piimsRetried && useAuthStore.getState().refreshToken) {
        original._piimsRetried = true;
        const refreshed = await useAuthStore.getState().refresh();
        if (refreshed) return api.request(original);
        useAuthStore.getState().logout({ silent: true });
      }
    }
    return Promise.reject(error);
  },
);
