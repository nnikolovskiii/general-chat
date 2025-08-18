I looked at the central API configuration in src/lib/api.ts. The current logic hardcodes endpoints named BLOG and CATEGORY and defaults to https://nikolanikolovski.com/api. Given this project is an accountant UI (file uploads, codes, auth), that API config is likely incorrect/mismatched and would cause the frontend to call wrong endpoints or the wrong base URL depending on how it’s deployed.

What I would change:
- Keep the runtime-first, then build-time env, then default priority, but make the default base URL sensible (relative path “/api” so it works behind a reverse proxy like nginx/docker-compose).
- Normalize the base URL to avoid trailing-slash/double-slash issues.
- Remove BLOG/CATEGORY and leave the API module responsible only for base URL + helper methods (pages/components can define their own endpoints).
- Provide a robust buildApiUrl that safely joins URL parts.

Proposed patch for src/lib/api.ts:
- Runtime env still reads window.ENV?.VITE_API_URL.
- Build-time env import.meta.env.VITE_API_URL as fallback.
- Default to “/api” (works when the UI is served by nginx with a /api upstream).
- Normalize slashes and expose helpers to build URLs safely.

Updated src/lib/api.ts:

// Centralized API configuration

// Get runtime URL from window.ENV (injected at runtime via public/config.js or Docker)
const runtimeApiUrl = (window as any).ENV?.VITE_API_URL as string | undefined;

// Normalize a base URL: remove trailing slash
const normalizeBase = (url: string) => url.replace(/\/+$/, '');

// Join base and endpoint safely (avoid double slashes)
const joinUrl = (base: string, endpoint: string) => {
  const b = normalizeBase(base);
  const e = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${b}${e}`;
};

export const API_CONFIG = {
  // Priority:
  // 1. Runtime environment (window.ENV) for Docker.
  // 2. Build-time environment (.env file) for local development.
  // 3. Hardcoded default as a fallback (relative path behind reverse proxy).
  URL: runtimeApiUrl || import.meta.env.VITE_API_URL || '/api',

  getApiUrl: () => {
    return normalizeBase(API_CONFIG.URL);
  },
};

// Helper to build full URL for an endpoint
export const buildApiUrl = (endpoint: string) => {
  return joinUrl(API_CONFIG.getApiUrl(), endpoint);
};

Notes:
- If you rely on window.ENV, ensure public/config.js sets window.ENV = { VITE_API_URL: 'https://your-backend' } and is included via index.html before the bundle.
- If running locally without Docker, create a .env file with VITE_API_URL=http://localhost:8000 (or whatever your backend is), or let it default to /api when reverse-proxied.
- Pages/components should now use buildApiUrl('/auth/login'), buildApiUrl('/files'), etc., rather than the previous BLOG/CATEGORY placeholders. If any code was importing API_CONFIG.ENDPOINTS.BLOG or CATEGORY, update those usages to direct endpoints relevant to this app.

If you want me to update the pages (AuthContext, FileUploadDashboard, CodesView) to use buildApiUrl consistently and align endpoint paths, let me know the backend routes (e.g., /auth/login, /auth/register, /files, /codes) and I’ll adjust them accordingly.