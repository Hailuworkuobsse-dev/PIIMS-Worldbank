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
    const { response } = error;
    if (response?.status === 401) {
      const refreshed = await useAuthStore.getState().refresh();
      if (refreshed && error.config) return api.request(error.config);
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);