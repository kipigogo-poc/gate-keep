/** Typed access to build-time env. The only place import.meta.env is read. */
export const appConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080',
  isDev: import.meta.env.DEV,
} as const;
